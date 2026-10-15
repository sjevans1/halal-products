/** Internal verification case validation. No public certification derives from these decisions. */
export const evidenceTypes={
 product:['halal_certificate','supplier_origin','ingredient_label','food_safety'],
 community:['listing_accuracy','community_contact']
};
export function validEvidenceUrl(value){
 if(typeof value!=='string'||value.length>700||value.length<12)return false;
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&u.username===''&&u.password===''&&u.port===''&&u.hostname.includes('.')&&!u.hostname.endsWith('.local')&&!u.hostname.endsWith('.internal')&&!u.hostname.endsWith('.localhost')&&!u.hostname.endsWith('.')&&!/^\d/.test(u.hostname)&&!u.hostname.includes('..')&&u.hash.length===0;
 }catch{return false}
}
export function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const dt=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(dt.valueOf())&&dt.toISOString().slice(0,10)===value;
}
const str=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
export function validateCase(body,today){
 if(!body||typeof body!=='object'||Array.isArray(body)||body.action!=='submit')return 'Invalid record.';
 const {subjectKey,evidenceType,claim,sourceUrl,scope,issuer='',validFrom=null,validUntil=null,reviewDue}=body;
 if(typeof subjectKey!=='string'||! /^(product|community):[a-z0-9-]{2,80}$/.test(subjectKey))return 'Invalid subject.';
 const kind=subjectKey.split(':')[0];
 if(!evidenceTypes[kind].includes(evidenceType))return 'Evidence type not permitted for subject.';
 if(!str(claim,15,240)||!str(scope,10,360)||!validEvidenceUrl(sourceUrl)||!str(issuer,0,160))return 'Complete claim, scope and public evidence URL required.';
 if(!validDate(reviewDue)||reviewDue<=today)return 'Next review date must be a future calendar date.';
 const max=new Date(`${today}T00:00:00Z`);max.setUTCFullYear(max.getUTCFullYear()+2);
 if(reviewDue>max.toISOString().slice(0,10))return 'Next review date cannot be more than two years away.';
 if(evidenceType==='halal_certificate'){
  if(!str(issuer,3,160)||!validDate(validFrom)||!validDate(validUntil)||validFrom>validUntil)return 'Certificate requires an issuer and actual validity dates.';
  if(validUntil<=today||reviewDue>validUntil)return 'Certificate is expired or its review date exceeds its validity.';
 }else if(validFrom!=null||validUntil!=null)return 'Validity dates are reserved for certificate evidence.';
 return null;
}
export function isVerifier(email,env){
 if(typeof env.HUB_VERIFIER_EMAILS!=='string')return false;
 return env.HUB_VERIFIER_EMAILS.split(',').some(s=>s.trim().toLowerCase()===email);
}
export const utcDate=()=>new Date().toISOString().slice(0,10);
