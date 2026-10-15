/** Private proposal data only. No HTML rendering, public claims or publication actions. */
export const kinds=['guide','directory','event','recipe'];
export const reviewDecisions=['approved','rejected','changes_requested'];
export const statuses=['draft','submitted',...reviewDecisions];
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function validPublicSource(value){
  if(typeof value!=='string'||value.length>700)return false;
  try{
    const u=new URL(value);const host=u.hostname.toLowerCase();
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!host.endsWith('.local')&&!host.endsWith('.internal')&&!host.endsWith('.localhost')&&host!=='localhost'&&!/^\d+\.\d+\.\d+\.\d+$/.test(host)&&!host.includes(':')&&host.includes('.')&&u.href.length<=700;
  }catch{return false}
}
export function validIsoDate(value){if(typeof value!=='string'||!datePattern.test(value))return false;const d=new Date(`${value}T00:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value}
export function validDraft(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return 'Invalid draft';
  const {kind,title,summary,body,slug,sourceUrl,parish,eventDate}=data;
  if(!kinds.includes(kind))return 'Choose a content type';
  if(typeof slug!=='string'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length<3||slug.length>70)return 'Use a valid lowercase slug';
  if(typeof title!=='string'||title.trim().length<5||title.trim().length>140)return 'Title must be 5–140 characters';
  if(typeof summary!=='string'||summary.trim().length<20||summary.trim().length>320)return 'Summary must be 20–320 characters';
  if(typeof body!=='string'||body.trim().length<50||body.trim().length>6000)return 'Body must be 50–6000 characters';
  if(!validPublicSource(sourceUrl))return 'Add a publicly available HTTPS source';
  if(typeof parish!=='string'||parish.length>90||typeof eventDate!=='string')return 'Invalid location or date';
  if(['directory','event'].includes(kind)&&parish.trim().length<3)return 'Add the parish or community locality';
  if(kind==='event'&&!validIsoDate(eventDate))return 'Add a valid event date';
  if(eventDate&& !validIsoDate(eventDate))return 'Invalid date';
  return null;
}
export function reviewerEnabled(env,email){
  if(env.HUB_EDITORIAL_ACTIVE!=='true'||typeof env.HUB_EDITORIAL_REVIEWERS!=='string')return false;
  return env.HUB_EDITORIAL_REVIEWERS.split(',').some(x=>x.trim().toLowerCase()===email.toLowerCase());
}
