import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {validateCase,validDate,validEvidenceUrl} from '../src/trust-policy.js';
import {onRequestGet,onRequestPost} from '../functions/api/operator/trust.js';

const BASE='https://tayyib-halal.pages.dev/api/operator/trust';
const now=Math.floor(Date.now()/1000),today=new Date().toISOString().slice(0,10);
const future=(days=120)=>{const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const config={HUB_TRUST_ACTIVE:'true',HUB_OPERATOR_ACTIVE:'true',HUB_OPERATOR_TEAM_DOMAIN:'tayyib.cloudflareaccess.com',HUB_OPERATOR_AUD:'internal-operator-app',HUB_OPERATOR_EMAILS:'editor@example.org,verifier@example.org',HUB_VERIFIER_EMAILS:'verifier@example.org'};
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const seed={action:'submit',subjectKey:'product:beef-cubes',evidenceType:'halal_certificate',claim:'Proposed beef supply certification for review',sourceUrl:'https://issuer.example.org/certificates/public/1',scope:'Single proposed beef SKU, facility and defined supply chain',issuer:'Example Issuer (unverified)',validFrom:today,validUntil:future(200),reviewDue:future(90)};
function dbStub(override={}){
 const log=[];
 const state={id:1,status:'pending',submitted_by:'editor@example.org',evidence_type:'halal_certificate',valid_until:future(200),review_due:future(90),version:1};
 const db={log,prepare:sql=>({all:async()=>({results:[{subject_key:'product:beef-cubes',kind:'product',display_name:'Premium Beef Cubes',baseline:'unverified'}]}),bind:(...params)=>{
  log.push({sql,params});return{
   all:async()=>({results:sql.includes('trust_subjects ORDER BY')?[{subject_key:'product:beef-cubes',kind:'product',display_name:'Premium Beef Cubes',baseline:'unverified'}]:[]}),
   first:async()=>state,
   run:async()=>({meta:{changes:1}})
  }
 }})};
 return {db,state,...override};
}
async function signedIdentity(){
 const keys=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await webcrypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='trust-unit-kid';jwk.alg='RS256';jwk.use='sig';
 const token=async(email='editor@example.org',claimsOverride={})=>{
  const claims={iss:'https://tayyib.cloudflareaccess.com',aud:['internal-operator-app'],email,iat:now,exp:now+3600,...claimsOverride};
  const head=b64({alg:'RS256',kid:'trust-unit-kid'}),payload=b64(claims);const data=head+'.'+payload;
  const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(data));return data+'.'+Buffer.from(sig).toString('base64url');
 };
 return {jwk,token};
}
function req(token,method='GET',body=null,url=BASE,origin='https://tayyib-halal.pages.dev'){
 return new Request(url,{method,headers:{'cf-access-jwt-assertion':token||'',...(method==='POST'?{'origin':origin,'content-type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
async function withTokens(fn){
 const {jwk,token}=await signedIdentity();const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({keys:[jwk]});
 try{await fn(token)}finally{globalThis.fetch=original}
}
test('registered trust subjects are only unverified or source-listed',()=>{
 const register=JSON.parse(readFileSync(new URL('../trust/registry.json',import.meta.url),'utf8'));
 const products=JSON.parse(readFileSync(new URL('../catalog/catalog.json',import.meta.url),'utf8')).products;
 const hub=JSON.parse(readFileSync(new URL('../hub/hub.json',import.meta.url),'utf8')).listings;
 assert.equal(register.subjects.length,products.length+hub.length);
 assert.equal(new Set(register.subjects.map(x=>x.key)).size,register.subjects.length);
 assert.ok(register.subjects.every(x=>['unverified','source-listed-only'].includes(x.baseline)));
});
test('date and evidence URL bounds prevent invalid or private sources',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-12-31'),true);
 for(const bad of ['http://example.org','https://localhost/test','https://127.0.0.1/a','https://example.local/path','https://evil.com#secret','https://name:password@example.org/path'])assert.equal(validEvidenceUrl(bad),false,bad);
 assert.equal(validEvidenceUrl('https://issuer.example.org/certificates/2026'),true);
});
test('certification case requires issuer, validity, and future review; non-certificate cannot pretend to be a certificate',()=>{
 assert.equal(validateCase(seed,today),null);
 assert.match(validateCase({...seed,issuer:''},today),/issuer/i);
 assert.match(validateCase({...seed,validUntil:'2020-01-01'},today),/expired|validity/i);
 assert.match(validateCase({...seed,reviewDue:future(250)},today),/review date/i);
 assert.match(validateCase({...seed,subjectKey:'community:central-masjid'},today),/not permitted/);
 assert.match(validateCase({...seed,evidenceType:'supplier_origin'},today),/reserved/);
});
test('evidence endpoints are completely disabled without Access and D1 setup',async()=>{
 assert.equal((await onRequestGet({request:req(''),env:{}})).status,503);
 assert.equal((await onRequestPost({request:req('','POST',seed),env:{}})).status,503);
});
test('editor can read only private subjects and bounded filtered cases',async()=>withTokens(async(token)=>{
 const state=dbStub();const env={...config,WAITLIST_DB:state.db};
 let result=await onRequestGet({request:req(await token(),'GET',null,BASE+'?view=subjects'),env});assert.equal(result.status,200);
 let data=await result.json();assert.equal(data.subjects[0].baseline,'unverified');assert.equal(data.canVerify,false);assert.equal(data.publication,'separate-git-approval-only');
 result=await onRequestGet({request:req(await token(),'GET',null,BASE+'?view=history&id=9'),env});assert.equal(result.status,200);assert.equal((await result.json()).publication,'never-automatic');
 result=await onRequestGet({request:req(await token(),'GET',null,BASE+'?view=history&id=invalid'),env});assert.equal(result.status,400);
 result=await onRequestGet({request:req(await token('verifier@example.org'),'GET',null,BASE+'?status=due'),env});assert.equal(result.status,200);
 data=await result.json();assert.equal(data.canVerify,true);assert.match(state.db.log.at(-1).sql,/review_due/);
 result=await onRequestGet({request:req(await token(),'GET',null,BASE+'?status=published'),env});assert.equal(result.status,400);
 result=await onRequestGet({request:req(await token(),'GET',null,BASE+'?status=pending&before=NaN'),env});assert.equal(result.status,400);
}));
test('evidence submission is server-bound, source-referenced, and never publishes',async()=>withTokens(async(token)=>{
 const state=dbStub();const env={...config,WAITLIST_DB:state.db};
 const auth=await token();
 let result=await onRequestPost({request:req(auth,'POST',seed,BASE,'https://malicious.example'),env});assert.equal(result.status,403);
 result=await onRequestPost({request:req(auth,'POST',{...seed,sourceUrl:'http://localhost/private'}),env});assert.equal(result.status,400);
 result=await onRequestPost({request:req(auth,'POST',seed),env});assert.equal(result.status,201);
 const data=await result.json();assert.equal(data.status,'pending');assert.equal(data.publication,'never-automatic');assert.match(data.caseRef,/^[0-9a-f-]{36}$/);
 const sql=state.db.log.at(-1);assert.match(sql.sql,/INSERT INTO trust_cases/);assert.match(sql.sql,/FROM trust_subjects/);assert.equal(sql.params.at(-1),'product:beef-cubes');
}));
test('independent verifier required; case submitter cannot accept own claim',async()=>withTokens(async(token)=>{
 const state=dbStub();const env={...config,WAITLIST_DB:state.db};
 const decision={action:'review',id:1,version:1,decision:'accepted',note:'I reviewed issuer and scope against independently provided evidence'};
 let result=await onRequestPost({request:req(await token(),'POST',decision),env});assert.equal(result.status,403);
 state.state.submitted_by='verifier@example.org';
 result=await onRequestPost({request:req(await token('verifier@example.org'),'POST',decision),env});assert.equal(result.status,403);
 state.state.submitted_by='editor@example.org';
 result=await onRequestPost({request:req(await token('verifier@example.org'),'POST',{...decision,version:2}),env});assert.equal(result.status,409);
 state.state.review_due=today;
 result=await onRequestPost({request:req(await token('verifier@example.org'),'POST',decision),env});assert.equal(result.status,409);
 state.state.review_due=future(90);
 result=await onRequestPost({request:req(await token('verifier@example.org'),'POST',decision),env});assert.equal(result.status,200);
 const body=await result.json();assert.equal(body.publication,'not-published');assert.equal(body.version,2);assert.match(state.db.log.at(-1).sql,/status=\?1/);
}));
test('accepted record can be disputed by editor; no self-publication action exists',async()=>withTokens(async(token)=>{
 const state=dbStub();state.state.status='accepted';const env={...config,WAITLIST_DB:state.db};
 const decision={action:'dispute',id:1,version:1,note:'Issuer has withdrawn the certificate; treat as disputed pending checks'};
 const response=await onRequestPost({request:req(await token(),'POST',decision),env});assert.equal(response.status,200);assert.equal((await response.json()).status,'disputed');
 const blocked=await onRequestPost({request:req(await token(),'POST',{action:'publish',id:1}),env});assert.equal(blocked.status,400);
}));
test('DB trigger enforces audit, immutable evidence and independent review',()=>{
 const sql=readFileSync(new URL('../migrations/0004_trust_register.sql',import.meta.url),'utf8');
 for(const name of ['trg_trust_case_insert_audit','trg_trust_case_transition_guard','trg_trust_case_review_guard','trg_trust_case_status_audit','trg_trust_case_evidence_immutable','trg_trust_audit_immutable_update','trg_trust_audit_immutable_delete'])assert.ok(sql.includes(name));
});
test('trust UI is Access-only, non-indexed and has no client-side credentials',()=>{
 const html=readFileSync(new URL('../public/operator/trust/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/operator/trust/trust.js',import.meta.url),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/different reviewer/i);assert.match(html,/trust-confirm/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|HUB_OPERATOR_AUD|HUB_VERIFIER_EMAILS/);
 assert.match(js,/showModal/);assert.match(js,/Review due/);
});
