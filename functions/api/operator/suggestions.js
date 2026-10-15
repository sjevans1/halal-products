import {authorize,requireSameOrigin,respond} from '../../../src/operator-auth.js';
const statuses=['pending','approved','rejected'];
export async function onRequestGet(ctx){
  const auth=await authorize(ctx);if(auth.error)return auth.error;
  const url=new URL(ctx.request.url);
  const status=url.searchParams.get('status')||'pending';
  if(!statuses.includes(status))return respond({ok:false,error:'Invalid status filter.'},400);
  const beforeRaw=url.searchParams.get('before');
  const before=beforeRaw?Number(beforeRaw):Number.MAX_SAFE_INTEGER;
  if(!Number.isSafeInteger(before)||before<=0)return respond({ok:false,error:'Invalid page cursor.'},400);
  try{
    const result=await auth.db.prepare('SELECT id,kind,title,source_url,note,review_status,created_at,reviewed_at,reviewed_by,review_note FROM hub_suggestions WHERE review_status = ?1 AND id < ?2 ORDER BY id DESC LIMIT 26').bind(status,before).all();
    const rows=result.results||[];const items=rows.slice(0,25);
    return respond({ok:true,items,nextCursor:rows.length>25?items.at(-1).id:null,publication:'never-automatic'});
  }catch{return respond({ok:false,error:'Review queue unavailable.'},503)}
}
export async function onRequestPost(ctx){
  const auth=await authorize(ctx);if(auth.error)return auth.error;
  if(!requireSameOrigin(ctx.request))return respond({ok:false,error:'Request origin rejected.'},403);
  if(!ctx.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required.'},415);
  if(Number(ctx.request.headers.get('content-length'))>2500)return respond({ok:false,error:'Request too large.'},413);
  let raw;try{raw=await ctx.request.text();if(raw.length>2500)throw Error();}catch{return respond({ok:false,error:'Request too large.'},413)}
  let body;try{body=JSON.parse(raw)}catch{return respond({ok:false,error:'Invalid JSON.'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body)||!Number.isSafeInteger(body.id)||body.id<=0||!['approved','rejected'].includes(body.decision)||typeof body.note!=='string'||body.note.trim().length<10||body.note.trim().length>500)return respond({ok:false,error:'A review decision and meaningful note are required.'},400);
  try{
    // D1.batch is atomic: an update and audit insert commit together or roll back together.
    // changes() binds the audit record to a successful pending → decision transition.
    const results=await auth.db.batch([
      auth.db.prepare("UPDATE hub_suggestions SET review_status=?1, reviewed_by=?2, review_note=?3, reviewed_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id=?4 AND review_status='pending'").bind(body.decision,auth.email,body.note.trim(),body.id),
      auth.db.prepare('INSERT INTO hub_moderation_audit(suggestion_id,action,reviewer,note) SELECT id,?1,?2,?3 FROM hub_suggestions WHERE id=?4 AND review_status=?1 AND reviewed_by=?2 AND changes()=1').bind(body.decision,auth.email,body.note.trim(),body.id)
    ]);
    if(results[0]?.meta?.changes!==1||results[1]?.meta?.changes!==1)return respond({ok:false,error:'Item no longer pending. Refresh the queue.'},409);
    return respond({ok:true,id:body.id,decision:body.decision,publication:'not-published'});
  }catch{return respond({ok:false,error:'Decision could not be saved. No approval should be assumed.'},503)}
}
