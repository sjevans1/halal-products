const json=(object,status=200)=>Response.json(object,{status,headers:{'cache-control':'no-store'}});
const enabled=env=>env.HUB_SUBMISSIONS_ACTIVE==='true'&&!!env.WAITLIST_DB&&!!env.TURNSTILE_SITE_KEY&&!!env.TURNSTILE_SECRET;
const sourceUrl=str=>{
  try{
    const u=new URL(str);
    return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&u.hostname!=='localhost'&&!/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)&&u.toString().length<=700;
  }catch{return false}
};
export const onRequestGet=()=>new Response('Method Not Allowed',{status:405,headers:{Allow:'POST'}});
export async function onRequestPost({request,env}){
  if(!enabled(env))return json({ok:false,error:'Suggestions are not currently open.'},503);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({ok:false,error:'JSON required.'},415);
  const length=Number(request.headers.get('content-length'));
  if(length>6000)return json({ok:false,error:'Request too large.'},413);
  let body;
  try{
    const text=await request.text();
    if(text.length>6000)return json({ok:false,error:'Request too large.'},413);
    body=JSON.parse(text);
  }catch{return json({ok:false,error:'Invalid JSON.'},400)}
  if(!body||Array.isArray(body)||typeof body!=='object')return json({ok:false,error:'Invalid details.'},400);
  const {type,title,sourceUrl:url,note,website,turnstileToken}=body;
  if(website)return json({ok:true}); // anonymous honeypot does not write a record
  if(!['listing','event','correction'].includes(type)||typeof title!=='string'||title.trim().length<3||title.length>120||typeof url!=='string'||!sourceUrl(url)||typeof note!=='string'||note.length>1000||typeof turnstileToken!=='string'||turnstileToken.length<5||turnstileToken.length>2048)return json({ok:false,error:'Please check the details and verification.'},400);
  const host=new URL(request.url).hostname;
  let result;
  try{
    const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:turnstileToken});
    const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
    if(!verification.ok)return json({ok:false,error:'Verification unavailable.'},503);
    result=await verification.json();
  }catch{return json({ok:false,error:'Verification unavailable.'},503)}
  if(result.success!==true||typeof result.hostname!=='string'||result.hostname.toLowerCase()!==host.toLowerCase())return json({ok:false,error:'Security verification failed.'},403);
  try{
    await env.WAITLIST_DB.prepare('INSERT INTO hub_suggestions (kind, title, source_url, note, review_status) VALUES (?1, ?2, ?3, ?4, ?5)').bind(type,title.trim(),url.trim(),note.trim(),'pending').run();
    return json({ok:true});
  }catch{return json({ok:false,error:'Suggestions cannot be saved right now.'},503)}
}
