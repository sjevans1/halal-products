import {authorize,requireSameOrigin,respond} from '../../../src/operator-auth.js';
import {validDraft,reviewDecisions,statuses,reviewerEnabled} from '../../../src/editorial-policy.js';
const disabled=()=>respond({ok:false,error:'Editorial workspace is not configured.'},503);
function normalize(d){return {kind:d.kind,slug:d.slug,title:typeof d.title==='string'?d.title.trim():d.title,summary:typeof d.summary==='string'?d.summary.trim():d.summary,body:typeof d.body==='string'?d.body.trim():d.body,sourceUrl:d.sourceUrl,parish:typeof d.parish==='string'?d.parish.trim():d.parish,eventDate:d.eventDate}}
function draftInput(d){if(!d||typeof d!=='object'||!d.entry||typeof d.entry!=='object')return {error:'Draft content required'};const fields=normalize(d.entry);const error=validDraft(fields);return error?{error}:{entry:fields}}
function rowData(r){return {id:r.id,kind:r.kind,slug:r.slug,title:r.title,summary:r.summary,body:r.body,sourceUrl:r.source_url,parish:r.parish,eventDate:r.event_date,status:r.status,createdBy:r.created_by,revision:r.revision,updatedAt:r.updated_at}}
export async function onRequestGet(ctx){
  if(ctx.env?.HUB_EDITORIAL_ACTIVE!=='true')return disabled();
  const auth=await authorize(ctx);if(auth.error)return auth.error;
  const url=new URL(ctx.request.url);const status=url.searchParams.get('status')||'draft';
  if(!statuses.includes(status))return respond({ok:false,error:'Invalid status'},400);
  const beforeRaw=url.searchParams.get('before'),before=beforeRaw?Number(beforeRaw):Number.MAX_SAFE_INTEGER;
  if(!Number.isSafeInteger(before)||before<1)return respond({ok:false,error:'Invalid cursor'},400);
  const auditId=url.searchParams.get('history');
  const exportId=url.searchParams.get('export');
  try{
    if(exportId!==null){
      const id=Number(exportId);if(!Number.isSafeInteger(id)||id<1)return respond({ok:false,error:'Invalid export ID'},400);
      const r=await auth.db.prepare("SELECT id,kind,slug,title,summary,body,source_url,parish,event_date,revision,acted_by,action_note,updated_at FROM editorial_entries WHERE id=?1 AND status='approved'").bind(id).first();
      if(!r)return respond({ok:false,error:'Only internally accepted material can be packaged for human review'},404);
      return respond({ok:true,packet:{publicationStatus:'UNPUBLISHED: SOURCE REVIEW AND HUMAN RELEASE REQUIRED',entryId:r.id,revision:r.revision,kind:r.kind,slug:r.slug,title:r.title,summary:r.summary,body:r.body,sourceUrl:r.source_url,parish:r.parish,eventDate:r.event_date,editorialReview:{reviewedAt:r.updated_at,reviewNote:r.action_note},requirements:['Verify the primary source and attribution','Seek qualified religious or halal evidence review where relevant','Record community organizer approval before announcing events','Create a separate GitHub content pull request and obtain human release approval']}});
    }
    if(auditId!==null){const id=Number(auditId);if(!Number.isSafeInteger(id)||id<=0)return respond({ok:false,error:'Invalid ID'},400);
      const record=await auth.db.prepare('SELECT id FROM editorial_entries WHERE id=?1').bind(id).first();
      if(!record)return respond({ok:false,error:'Entry unavailable'},404);
      const entries=await auth.db.prepare('SELECT revision,action,actor,note,created_at FROM editorial_audit WHERE entry_id=?1 ORDER BY id DESC LIMIT 100').bind(id).all();
      return respond({ok:true,history:entries.results||[]});
    }
    const result=await auth.db.prepare('SELECT id,kind,slug,title,summary,body,source_url,parish,event_date,status,created_by,revision,updated_at FROM editorial_entries WHERE status=?1 AND id<?2 ORDER BY id DESC LIMIT 21').bind(status,before).all();
    const rows=result.results||[];
    return respond({ok:true,items:rows.slice(0,20).map(rowData),nextCursor:rows.length>20?rows[19].id:null,canReview:reviewerEnabled(ctx.env,auth.email),publication:'manual-source-review-only'});
  }catch{return respond({ok:false,error:'Content queue unavailable'},503)}
}
export async function onRequestPost(ctx){
  if(ctx.env?.HUB_EDITORIAL_ACTIVE!=='true')return disabled();
  const auth=await authorize(ctx);if(auth.error)return auth.error;
  if(!requireSameOrigin(ctx.request))return respond({ok:false,error:'Origin rejected'},403);
  if(!ctx.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required'},415);
  if(Number(ctx.request.headers.get('content-length'))>11000)return respond({ok:false,error:'Request too large'},413);
  let b;try{const text=await ctx.request.text();if(text.length>11000)return respond({ok:false,error:'Request too large'},413);b=JSON.parse(text)}catch{return respond({ok:false,error:'Invalid JSON'},400)}
  if(!b||typeof b!=='object'||Array.isArray(b))return respond({ok:false,error:'Invalid action'},400);
  const action=b.action;
  if(!['create','edit','submit','review'].includes(action))return respond({ok:false,error:'Unsupported action'},400);
  let data=null;if(['create','edit'].includes(action)){const parsed=draftInput(b);if(parsed.error)return respond({ok:false,error:parsed.error},400);data=parsed.entry}
  if(action!=='create'&&(!Number.isSafeInteger(b.id)||b.id<=0||!Number.isSafeInteger(b.revision)||b.revision<1))return respond({ok:false,error:'Valid ID and revision required'},400);
  if(action==='review'&&(!reviewDecisions.includes(b.decision)||!reviewerEnabled(ctx.env,auth.email)))return respond({ok:false,error:'Independent reviewer required'},403);
  const note=typeof b.note==='string'?b.note.trim():'';
  if(action==='review'&&(note.length<20||note.length>500))return respond({ok:false,error:'Review justification must be 20–500 characters'},400);
  try{
    let result;
    if(action==='create'){
      result=await auth.db.prepare("INSERT INTO editorial_entries(kind,slug,title,summary,body,source_url,parish,event_date,created_by,acted_by,action_note) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?9,'Private editorial draft. Not published.')").bind(data.kind,data.slug,data.title,data.summary,data.body,data.sourceUrl,data.parish,data.eventDate,auth.email).run();
      if(result.meta?.changes!==1)return respond({ok:false,error:'Draft was not saved'},503);
      return respond({ok:true,id:result.meta.last_row_id,revision:1,status:'draft',publication:'not-published'},201);
    }
    if(action==='edit'){
      // Kind and slug are immutable after creation. Revisions are compare-and-swap.
      result=await auth.db.prepare("UPDATE editorial_entries SET title=?1,summary=?2,body=?3,source_url=?4,parish=?5,event_date=?6,status='draft',revision=revision+1,acted_by=?7,last_action='edited',action_note='Author updated draft content',updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id=?8 AND revision=?9 AND created_by=?7 AND kind=?10 AND slug=?11 AND status IN ('draft','changes_requested')").bind(data.title,data.summary,data.body,data.sourceUrl,data.parish,data.eventDate,auth.email,b.id,b.revision,data.kind,data.slug).run();
    }else if(action==='submit'){
      result=await auth.db.prepare("UPDATE editorial_entries SET status='submitted',revision=revision+1,acted_by=?1,last_action='submitted',action_note='Author submitted for independent review',updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id=?2 AND revision=?3 AND status='draft' AND created_by=?1").bind(auth.email,b.id,b.revision).run();
    }else{
      result=await auth.db.prepare("UPDATE editorial_entries SET status=?1,revision=revision+1,acted_by=?2,last_action=?1,action_note=?3,updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id=?4 AND revision=?5 AND status='submitted' AND lower(created_by)<>?2").bind(b.decision,auth.email,note,b.id,b.revision).run();
    }
    if(result.meta?.changes!==1)return respond({ok:false,error:'Entry changed, permission denied or transition unavailable. Refresh.'},409);
    return respond({ok:true,id:b.id,revision:b.revision+1,status:action==='review'?b.decision:action==='submit'?'submitted':'draft',publication:'not-published'});
  }catch{return respond({ok:false,error:'Editorial action failed; no publication or approval should be assumed'},503)}
}
