import {authorize,requireSameOrigin,respond} from '../../../src/operator-auth.js';
import {listingIds} from '../../../src/steward-listings.js';
import {grantReviewers,validGrant} from '../../../src/steward-policy.js';
const disabled=()=>respond({ok:false,error:'Steward administration is not configured.'},503);
export async function onRequestGet(ctx){
 if(ctx.env?.HUB_STEWARD_GRANTS_ACTIVE!=='true')return disabled();
 const auth=await authorize(ctx);if(auth.error)return auth.error;
 if(!grantReviewers(ctx.env,auth.email))return respond({ok:false,error:'Steward reviewer role required'},403);
 const status=new URL(ctx.request.url).searchParams.get('status')||'active';
 if(!['active','revoked'].includes(status))return respond({ok:false,error:'Invalid status'},400);
 try {
  const result=await auth.db.prepare('SELECT id,listing_id,email,source_url,review_note,issued_by,expires_at,status,revision,created_at FROM steward_grants WHERE status=?1 ORDER BY id DESC LIMIT 100').bind(status).all();
  return respond({ok:true,items:(result.results||[]),publication:'none',grantMeaning:'Permission to suggest a listing correction, not proof of halal certification or endorsement.'});
 }catch{return respond({ok:false,error:'Steward register unavailable'},503)}
}
export async function onRequestPost(ctx){
 if(ctx.env?.HUB_STEWARD_GRANTS_ACTIVE!=='true')return disabled();
 const auth=await authorize(ctx);if(auth.error)return auth.error;
 if(!grantReviewers(ctx.env,auth.email))return respond({ok:false,error:'Independent steward reviewer required'},403);
 if(!requireSameOrigin(ctx.request))return respond({ok:false,error:'Origin rejected'},403);
 if(!ctx.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required'},415);
 if(Number(ctx.request.headers.get('content-length'))>5000)return respond({ok:false,error:'Request too large'},413);
 let body;try{const raw=await ctx.request.text();if(raw.length>5000)return respond({ok:false,error:'Request too large'},413);body=JSON.parse(raw)}catch{return respond({ok:false,error:'Invalid JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({ok:false,error:'Invalid request'},400);
 try {
  if(body.action==='grant'){
   const err=validGrant(body,listingIds,auth.email);if(err)return respond({ok:false,error:err},400);
   const result=await auth.db.prepare('INSERT INTO steward_grants (listing_id,email,source_url,review_note,issued_by,acted_by,expires_at) VALUES (?1,?2,?3,?4,?5,?5,?6)').bind(body.listingId,body.email,body.sourceUrl,body.note.trim(),auth.email,body.expiresAt).run();
   if(result.meta?.changes!==1)return respond({ok:false,error:'Grant was not saved'},409);
   return respond({ok:true,id:result.meta.last_row_id,status:'active',scope:body.listingId,publication:'never-automatic'},201);
  }
  if(body.action==='revoke'){
   if(!Number.isSafeInteger(body.id)||body.id<1||!Number.isSafeInteger(body.revision)||body.revision<1||typeof body.note!=='string'||body.note.trim().length<20||body.note.length>800)return respond({ok:false,error:'A current grant and a meaningful revocation reason are required'},400);
   const result=await auth.db.prepare("UPDATE steward_grants SET status='revoked',action='revoked',acted_by=?1,action_note=?2,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id=?3 AND revision=?4 AND status='active' AND email<>?1").bind(auth.email,body.note.trim(),body.id,body.revision).run();
   if(result.meta?.changes!==1)return respond({ok:false,error:'Grant has changed or revocation is not permitted. Refresh the list.'},409);
   return respond({ok:true,id:body.id,status:'revoked',publication:'never-automatic'});
  }
  return respond({ok:false,error:'Unsupported action'},400);
 }catch{return respond({ok:false,error:'Grant not saved; it may already exist, or the database is unavailable.'},409)}
}
