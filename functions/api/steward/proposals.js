import {authorizeSteward,requireSameOrigin,respond} from '../../../src/operator-auth.js';
import {validProposal} from '../../../src/steward-policy.js';
const disabled=()=>respond({ok:false,error:'Representative workspace is not available yet.'},503);
export async function onRequestGet(ctx){
 if(ctx.env?.HUB_STEWARD_ACTIVE!=='true')return disabled();
 const auth=await authorizeSteward(ctx);if(auth.error)return auth.error;
 try{
  const grants=await auth.db.prepare("SELECT id,listing_id,expires_at FROM steward_grants WHERE email=?1 AND status='active' AND date(expires_at)>date('now') ORDER BY listing_id LIMIT 30").bind(auth.email).all();
  return respond({ok:true,grants:grants.results||[],publication:'changes-never-automatic'});
 }catch{return respond({ok:false,error:'Your assignments cannot be loaded right now'},503)}
}
export async function onRequestPost(ctx){
 if(ctx.env?.HUB_STEWARD_ACTIVE!=='true')return disabled();
 const auth=await authorizeSteward(ctx);if(auth.error)return auth.error;
 if(!requireSameOrigin(ctx.request))return respond({ok:false,error:'Origin rejected'},403);
 if(!ctx.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required'},415);
 if(Number(ctx.request.headers.get('content-length'))>3000)return respond({ok:false,error:'Request too large'},413);
 let body;try{const raw=await ctx.request.text();if(raw.length>3000)return respond({ok:false,error:'Request too large'},413);body=JSON.parse(raw)}catch{return respond({ok:false,error:'Invalid JSON'},400)}
 const error=validProposal(body);if(error)return respond({ok:false,error},400);
 try{
  // Grant ownership, listing scope, current status and expiry are re-evaluated AT INSERT.
  const result=await auth.db.prepare("INSERT INTO steward_proposals(grant_id,listing_id,submitted_by,source_url,note) SELECT id,listing_id,email,?1,?2 FROM steward_grants WHERE id=?3 AND email=?4 AND status='active' AND date(expires_at)>date('now')").bind(body.sourceUrl,body.note.trim(),body.grantId,auth.email).run();
  if(result.meta?.changes!==1)return respond({ok:false,error:'Your listing access is expired or unavailable. Nothing was submitted.'},403);
  return respond({ok:true,status:'pending',publication:'no-public-change'},201);
 }catch{return respond({ok:false,error:'Proposal could not be stored; no public page was changed.'},503)}
}
