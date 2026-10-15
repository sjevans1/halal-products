/** Cloudflare Access JWT verification for Tayyib staff APIs.
 * Every condition must be configured and validated; CF identity headers are NEVER trusted.
 * No shared static secret or browser-side key can authorize access.
 */
const deny = (code = 403) => Response.json({ok:false,error:code===503?'Operator review is not configured.':'Access denied.'},{status:code,headers:{'cache-control':'no-store'}});
const hostnamePattern=/^[a-z0-9-]+\.cloudflareaccess\.com$/i;
const readB64 = value => {
  if(!/^[a-zA-Z0-9_-]+$/.test(value)) throw Error('Invalid encoding');
  const v=value.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(v.padEnd(Math.ceil(v.length/4)*4,'=')),x=>x.charCodeAt(0));
};
const parsePart = value => JSON.parse(new TextDecoder().decode(readB64(value)));
function settings(env){
  if(env.HUB_OPERATOR_ACTIVE!=='true'||!env.WAITLIST_DB||typeof env.HUB_OPERATOR_AUD!=='string'||!env.HUB_OPERATOR_AUD.trim()||typeof env.HUB_OPERATOR_TEAM_DOMAIN!=='string'||!hostnamePattern.test(env.HUB_OPERATOR_TEAM_DOMAIN)||typeof env.HUB_OPERATOR_EMAILS!=='string')return null;
  const emails=new Set(env.HUB_OPERATOR_EMAILS.split(',').map(e=>e.trim().toLowerCase()).filter(e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)));
  return emails.size?{issuer:`https://${env.HUB_OPERATOR_TEAM_DOMAIN}`,aud:env.HUB_OPERATOR_AUD,domain:env.HUB_OPERATOR_TEAM_DOMAIN,emails}:null;
}
export async function authorize({request,env}){
  const cfg=settings(env);
  if(!cfg)return {error:deny(503)};
  const token=request.headers.get('cf-access-jwt-assertion');
  if(!token||token.length>12000)return {error:deny(401)};
  const parts=token.split('.');
  if(parts.length!==3)return {error:deny(401)};
  let header,claims,signature;
  try{header=parsePart(parts[0]);claims=parsePart(parts[1]);signature=readB64(parts[2]);}
  catch{return {error:deny(401)}}
  if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>256||typeof claims!=='object'||!claims)return {error:deny(401)};
  const now=Math.floor(Date.now()/1000);
  if(claims.iss!==cfg.issuer||!(Array.isArray(claims.aud)?claims.aud.includes(cfg.aud):claims.aud===cfg.aud)||!Number.isInteger(claims.exp)||claims.exp<=now||!Number.isInteger(claims.iat)||claims.iat>now+60||claims.iat<now-86400||claims.exp-claims.iat>86400|| (claims.nbf!=null&&(!Number.isInteger(claims.nbf)||claims.nbf>now+60)))return {error:deny(401)};
  if(typeof claims.email!=='string'||!cfg.emails.has(claims.email.toLowerCase()))return {error:deny(403)};
  try{
    const response=await fetch(`${cfg.issuer}/cdn-cgi/access/certs`,{headers:{accept:'application/json'}});
    if(!response.ok)return {error:deny(503)};
    const certs=await response.json();
    const jwk=Array.isArray(certs?.keys)?certs.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256')&&k.use!=='enc'):null;
    if(!jwk)return {error:deny(401)};
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid?{email:claims.email.toLowerCase(),db:env.WAITLIST_DB}:{error:deny(401)};
  }catch{return {error:deny(503)}}
}
export function requireSameOrigin(request){
  try{return request.headers.get('origin')===new URL(request.url).origin}
  catch{return false}
}
export const respond=(object,status=200)=>Response.json(object,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
