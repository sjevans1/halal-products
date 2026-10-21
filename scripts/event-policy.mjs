/** Public event model. An organizer source is necessary, not independent certification. */
export const EVENT_KINDS = Object.freeze({gathering:'Community gathering',learning:'Learning and workshops',charity:'Charity and service',ramadan:'Ramadan gathering',eid:'Eid gathering',other:'Other community event'});
export const PARISHES = Object.freeze(['Kingston','St. Andrew','St. Catherine','St. James','St. Ann','St. Mary','St. Elizabeth','Westmoreland','Manchester','Portland','St. Thomas','Clarendon','Trelawny','Hanover','Islandwide']);
const ISO_JM = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:00-05:00$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const localInstantValid = value => {
 const ms=Date.parse(value);
 return Number.isFinite(ms) && new Date(ms-5*3600000).toISOString().slice(0,19)===value.slice(0,19);
};
const safeText = value => typeof value === 'string' && value.trim().length >= 3 && value.length <= 400 && !/[<>]/.test(value);
const dateIsReal = value => DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
function sourceIsPublic(url){
 try{const u=new URL(url);return u.protocol === 'https:' && u.username==='' && u.password==='' && !['localhost','127.0.0.1','example.com','example.org','example.net'].includes(u.hostname) && u.hostname.includes('.') && !/\.local$/.test(u.hostname)}catch{return false}
}
/** Reject the *entire* publication instead of silently dropping unapproved data. */
export function validatePublicEvents(events, today=new Date().toISOString().slice(0,10)){
 if(!Array.isArray(events))throw Error('Public events must be an array');
 const ids=new Set();
 for(const [i,e] of events.entries()){
  const prefix=`Event ${i+1}`;
  if(!e || typeof e !== 'object' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id||'') || ids.has(e.id))throw Error(`${prefix}: invalid or duplicate ID`);
  ids.add(e.id);
  if(e.approved!==true || !safeText(e.approvedBy) || !dateIsReal(e.reviewedAt)||e.reviewedAt>today)throw Error(`${prefix}: independent editorial approval missing or future dated`);
  if(!safeText(e.title)||!safeText(e.summary)||!safeText(e.organizer)||!safeText(e.locality))throw Error(`${prefix}: meaningful title, organizer, summary and locality required`);
  if(!Object.hasOwn(EVENT_KINDS,e.kind))throw Error(`${prefix}: event type invalid`);
  if(!PARISHES.includes(e.parish))throw Error(`${prefix}: parish invalid`);
  if(!sourceIsPublic(e.sourceUrl)||!dateIsReal(e.sourceCheckedAt)||e.sourceCheckedAt>today)throw Error(`${prefix}: real HTTPS organizer source and review date required`);
  if(!ISO_JM.test(e.startsAt)||!ISO_JM.test(e.endsAt)||!localInstantValid(e.startsAt)||!localInstantValid(e.endsAt))throw Error(`${prefix}: times must use Jamaica UTC-05:00 offset`);
  if(Date.parse(e.endsAt)<=Date.parse(e.startsAt) || Date.parse(e.endsAt)-Date.parse(e.startsAt)>14*86400000)throw Error(`${prefix}: invalid event time window`);
  if(e.parish==='Islandwide' && !/online|virtual|multiple|jamaica|islandwide/i.test(e.locality))throw Error(`${prefix}: islandwide events require location clarification`);
  if(Date.parse(e.startsAt)-Date.parse(`${e.sourceCheckedAt}T00:00:00Z`)>366*86400000)throw Error(`${prefix}: organizer source too far ahead of event`);
 }
 return events;
}
export function upcomingEvents(events, now=Date.now()){
 return events.filter(e=>Date.parse(e.endsAt)>now).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
}
export function formatJamaicaEventDate(date){
 const ms=Date.parse(date);
 if(!Number.isFinite(ms))throw Error('invalid event date');
 return new Intl.DateTimeFormat('en-JM',{timeZone:'America/Jamaica',weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(ms));
}
