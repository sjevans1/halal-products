const error=(message,status)=>Response.json({ok:false,error:message},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequestPost({request,env}) {
  if(env.WAITLIST_ACTIVE!=='true'||!env.WAITLIST_DB||!env.TURNSTILE_SECRET||!env.TURNSTILE_SITE_KEY)return error('Registrations are not open yet.',503);
  if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')return error('Invalid content type.',415);
  const length=Number(request.headers.get('content-length')||0);if(length>4096)return error('Request too large.',413);
  let data;try{const body=await request.text();if(body.length>4096)return error('Request too large.',413);data=JSON.parse(body)}catch{return error('Invalid request.',400)}
  if(!data||typeof data!=='object')return error('Invalid request.',400);
  if(data.website)return Response.json({ok:true}); // Honeypot: do not reveal spam classification
  const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
  if(email.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return error('Please enter a valid email address.',400);
  if(data.consent!==true)return error('Consent is required.',400);
  if(typeof data.turnstileToken!=='string'||!data.turnstileToken.trim()||data.turnstileToken.length>2048)return error('Please complete the security check.',400);
  let verification;
  try{const payload=new FormData();payload.append('secret',env.TURNSTILE_SECRET);payload.append('response',data.turnstileToken);
    const resp=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:payload});
    if(!resp.ok)return error('Security verification is temporarily unavailable.',503);
    verification=await resp.json();
  }catch{return error('Security verification is temporarily unavailable.',503)}
  if(verification?.success!==true)return error('Security check failed. Please try again.',403);
  try{
    await env.WAITLIST_DB.prepare("INSERT INTO waitlist (email,consent_at,created_at) VALUES (?1,datetime('now'),datetime('now')) ON CONFLICT(email) DO UPDATE SET consent_at=datetime('now'), unsubscribed_at=NULL").bind(email).run();
  }catch{return error('Registration is unavailable. Please try later.',503)}
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
export function onRequestGet(){return error('Method not allowed.',405)}
