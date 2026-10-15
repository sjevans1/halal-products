import {authorize,requireSameOrigin,respond} from '../../../src/operator-auth.js';
import {validateCase,isVerifier,utcDate} from '../../../src/trust-policy.js';
const filters=['pending','accepted','rejected','disputed','due'];
const decisions=['accepted','rejected'];
const MAX_REQUEST=3500;
const subjectList='SELECT subject_key,kind,display_name,baseline FROM trust_subjects ORDER BY kind,display_name LIMIT 100';
const baseSelect=`SELECT c.id,c.case_ref,c.subject_key,s.display_name,s.kind,c.evidence_type,c.claim,c.source_url,c.issuer,c.scope,c.valid_from,c.valid_until,c.review_due,c.status,c.submitted_by,c.created_at,c.reviewed_by,c.review_note,c.reviewed_at,c.version,
 CASE WHEN c.status='accepted' AND (c.review_due <= ?1 OR (c.valid_until IS NOT NULL AND c.valid_until < ?1)) THEN 'recheck-required' ELSE c.status END AS effective_status
 FROM trust_cases c JOIN trust_subjects s ON s.subject_key=c.subject_key`;
const noteOK=v=>typeof v==='string'&&v.trim().length>=20&&v.trim().length<=500;

export async function onRequestGet(ctx){
 if(ctx.env.HUB_TRUST_ACTIVE!=='true')return respond({ok:false,error:'Evidence operations are not activated.'},503);
 const auth=await authorize(ctx);if(auth.error)return auth.error;
 const u=new URL(ctx.request.url), view=u.searchParams.get('view')||'cases';
 try{
  if(view==='subjects'){
   const result=await auth.db.prepare(subjectList).all();
   return respond({ok:true,subjects:result.results||[],canVerify:isVerifier(auth.email,ctx.env),publication:'separate-git-approval-only'});
  }
  if(view==='history'){
   const id=Number(u.searchParams.get('id'));
   const beforeRaw=u.searchParams.get('before');const before=beforeRaw?Number(beforeRaw):Number.MAX_SAFE_INTEGER;
   if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(before)||before<=0)return respond({ok:false,error:'Invalid history request.'},400);
   const result=await auth.db.prepare('SELECT id,case_id,action,actor,note,created_at FROM trust_case_audit WHERE case_id=?1 AND id<?2 ORDER BY id DESC LIMIT 26').bind(id,before).all();
   const rows=result.results||[],items=rows.slice(0,25);
   return respond({ok:true,items,nextCursor:rows.length>25?items.at(-1).id:null,publication:'never-automatic'});
  }
  if(view!=='cases')return respond({ok:false,error:'Invalid view.'},400);
  const status=u.searchParams.get('status')||'pending';
  if(!filters.includes(status))return respond({ok:false,error:'Invalid case filter.'},400);
  const beforeRaw=u.searchParams.get('before');const before=beforeRaw?Number(beforeRaw):Number.MAX_SAFE_INTEGER;
  if(!Number.isSafeInteger(before)||before<=0)return respond({ok:false,error:'Invalid cursor.'},400);
  const today=utcDate();const due=status==='due';
  const where=due?"c.status='accepted' AND (c.review_due <= ?1 OR (c.valid_until IS NOT NULL AND c.valid_until < ?1))":'c.status=?2';
  const sql=`${baseSelect} WHERE ${where} AND c.id < ?3 ORDER BY c.id DESC LIMIT 26`;
  const result=await auth.db.prepare(sql).bind(today,due?'accepted':status,before).all();
  const rows=result.results||[];const items=rows.slice(0,25);
  return respond({ok:true,items,nextCursor:rows.length>25?items.at(-1).id:null,canVerify:isVerifier(auth.email,ctx.env),publication:'never-automatic'});
 }catch{return respond({ok:false,error:'Internal evidence register unavailable.'},503)}
}

export async function onRequestPost(ctx){
 if(ctx.env.HUB_TRUST_ACTIVE!=='true')return respond({ok:false,error:'Evidence operations are not activated.'},503);
 const auth=await authorize(ctx);if(auth.error)return auth.error;
 if(!requireSameOrigin(ctx.request))return respond({ok:false,error:'Request origin rejected.'},403);
 if(!ctx.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required.'},415);
 if(Number(ctx.request.headers.get('content-length'))>MAX_REQUEST)return respond({ok:false,error:'Request too large.'},413);
 let body;
 try{const raw=await ctx.request.text();if(raw.length>MAX_REQUEST)return respond({ok:false,error:'Request too large.'},413);body=JSON.parse(raw)}catch{return respond({ok:false,error:'Invalid JSON.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({ok:false,error:'Invalid request.'},400);
 const today=utcDate();
 if(body.action==='submit'){
  const reason=validateCase(body,today);if(reason)return respond({ok:false,error:reason},400);
  const ref=crypto.randomUUID();
  try{
   // Database AFTER INSERT trigger writes the audit row within this one atomic statement.
   // Only registered subjects can be referenced; no auto-publication.
   const result=await auth.db.prepare(`INSERT INTO trust_cases(case_ref,subject_key,evidence_type,claim,source_url,issuer,scope,valid_from,valid_until,review_due,status,submitted_by)
     SELECT ?1,subject_key,?2,?3,?4,?5,?6,?7,?8,?9,'pending',?10 FROM trust_subjects WHERE subject_key=?11`)
     .bind(ref,body.evidenceType,body.claim.trim(),body.sourceUrl.trim(),(body.issuer||'').trim(),body.scope.trim(),body.validFrom||null,body.validUntil||null,body.reviewDue,auth.email,body.subjectKey).run();
   if(result?.meta?.changes!==1)return respond({ok:false,error:'Subject not found. No case created.'},409);
   return respond({ok:true,caseRef:ref,status:'pending',publication:'never-automatic'},201);
  }catch{return respond({ok:false,error:'Evidence could not be stored.'},503)}
 }
 if(body.action==='review'||body.action==='dispute'){
  if(!Number.isSafeInteger(body.id)||body.id<=0||!Number.isSafeInteger(body.version)||body.version<=0||!noteOK(body.note))return respond({ok:false,error:'Case, current version and substantive review note required.'},400);
  const dispute=body.action==='dispute';
  if(!dispute&&!decisions.includes(body.decision))return respond({ok:false,error:'Invalid review decision.'},400);
  if(!dispute&&!isVerifier(auth.email,ctx.env))return respond({ok:false,error:'Independent verifier permission required.'},403);
  try{
   const record=await auth.db.prepare('SELECT id,status,submitted_by,evidence_type,valid_until,review_due,version FROM trust_cases WHERE id=?1').bind(body.id).first();
   if(!record)return respond({ok:false,error:'Case not found.'},404);
   if(record.version!==body.version||record.status!==(dispute?'accepted':'pending'))return respond({ok:false,error:'Case state changed; refresh before deciding.'},409);
   if(!dispute && record.submitted_by.toLowerCase()===auth.email)return respond({ok:false,error:'You cannot independently verify your own submission.'},403);
   if(!dispute && body.decision==='accepted' && (record.review_due<=today || (record.valid_until&&record.valid_until<=today)))return respond({ok:false,error:'Expired or review-due evidence cannot be accepted as current.'},409);
   const status=dispute?'disputed':body.decision;
   // Optimistic compare-and-swap prevents concurrent decisions.
   // DB trigger inserts the audit row or aborts the whole statement: no unaudited transition.
   const result=await auth.db.prepare(`UPDATE trust_cases SET status=?1,reviewed_by=?2,review_note=?3,reviewed_at=strftime('%Y-%m-%dT%H:%M:%SZ','now'),version=version+1
     WHERE id=?4 AND status=?5 AND version=?6`).bind(status,auth.email,body.note.trim(),body.id,dispute?'accepted':'pending',body.version).run();
   if(result?.meta?.changes!==1)return respond({ok:false,error:'Case changed during review.'},409);
   return respond({ok:true,id:body.id,status,version:body.version+1,publication:'not-published'});
  }catch{return respond({ok:false,error:'Decision could not be safely saved.'},503)}
 }
 return respond({ok:false,error:'Unsupported action.'},400);
}
