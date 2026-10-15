import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {validDraft,validPublicSource,validIsoDate,reviewerEnabled} from '../src/editorial-policy.js';
import {onRequestGet,onRequestPost} from '../functions/api/operator/content.js';
const base='https://tayyib-halal.pages.dev/api/operator/content';
const domain='tayyib.cloudflareaccess.com';
const config={HUB_OPERATOR_ACTIVE:'true',HUB_EDITORIAL_ACTIVE:'true',HUB_OPERATOR_TEAM_DOMAIN:domain,HUB_OPERATOR_AUD:'cms-test',HUB_OPERATOR_EMAILS:'writer@example.org,reviewer@example.org',HUB_EDITORIAL_REVIEWERS:'reviewer@example.org'};
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
async function keyset(){const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);const jwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);Object.assign(jwk,{kid:'editor-kid',alg:'RS256',use:'sig'});return {jwk,make:async(email='writer@example.org',o={})=>{const now=Math.floor(Date.now()/1000);const parts=[b64({alg:'RS256',kid:'editor-kid'}),b64({iss:`https://${domain}`,aud:['cms-test'],email,iat:now,exp:now+3600,...o})];const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(parts.join('.')));return `${parts.join('.')}.${Buffer.from(sig).toString('base64url')}`}}}
function request(token,method='GET',payload={},path=base,origin=new URL(base).origin){return new Request(path,{method,headers:{'cf-access-jwt-assertion':token||'',...(method==='POST'?{'origin':origin,'content-type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(payload)}:{})})}
function memoryDb(){let calls=[];let changes=1;const self={get calls(){return calls},set changes(n){changes=n},prepare(sql){return {bind(...args){calls.push({sql,args});return {run:async()=>({meta:{changes,last_row_id:19}}),all:async()=>({results:[{id:19,kind:'guide',slug:'sample-source-guide',title:'Sample community guide',summary:'A sample summary for editorial authoring.',body:'This is a long private sample guide to demonstrate the editorial process without any live claims.',source_url:'https://example.org/article',parish:'',event_date:'',status:'draft',created_by:'writer@example.org',revision:1,updated_at:'2026-10-15'}]}),first:async()=>({id:19})}}}}};return self}
const sample={kind:'guide',slug:'sample-source-guide',title:'Sample community guide',summary:'A sample summary for editorial authoring.',body:'This is a long private sample guide to demonstrate the editorial process without any live claims.',sourceUrl:'https://example.org/article',parish:'',eventDate:''};

test('source policy rejects executable/internal links and invalid event dates',()=>{
 for(const u of ['javascript:alert(1)','http://example.org','https://127.0.0.1/path','https://localhost/page','https://user:pass@example.org','https://example.local/path'])assert.equal(validPublicSource(u),false);
 assert.equal(validPublicSource(sample.sourceUrl),true);assert.equal(validIsoDate('2026-02-30'),false);assert.equal(validIsoDate('2026-12-12'),true);
 assert.equal(validDraft(sample),null);assert.match(validDraft({...sample,kind:'event'}),/parish/);assert.match(validDraft({...sample,kind:'event',parish:'Kingston'}),/date/);
 assert.equal(reviewerEnabled(config,'reviewer@example.org'),true);assert.equal(reviewerEnabled(config,'writer@example.org'),false);
});
test('all editorial operations fail closed before explicit flag, including GET',async()=>{
 assert.equal((await onRequestGet({request:request('abc'),env:{}})).status,503);
 assert.equal((await onRequestPost({request:request('abc','POST',{action:'create',entry:sample}),env:{...config,HUB_EDITORIAL_ACTIVE:'false'}})).status,503);
});
test('writer creates, edits and submits bounded private data, but cannot review',async()=>{
 const {jwk,make}=await keyset();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});const db=memoryDb(),env={...config,WAITLIST_DB:db};
 try{const token=await make();const submitted=await onRequestPost({request:request(token,'POST',{action:'create',entry:sample}),env});assert.equal(submitted.status,201);assert.equal((await submitted.json()).publication,'not-published');assert.match(db.calls[0].sql,/INSERT INTO editorial_entries/);
 const review=await onRequestPost({request:request(token,'POST',{action:'review',id:19,revision:1,decision:'approved',note:'This is a detailed review with evidence.'}),env});assert.equal(review.status,403);
 const edited=await onRequestPost({request:request(token,'POST',{action:'edit',id:19,revision:1,entry:sample}),env});assert.equal(edited.status,200);assert.match(db.calls.at(-1).sql,/created_by=\?7/);
 const submit=await onRequestPost({request:request(token,'POST',{action:'submit',id:19,revision:2}),env});assert.equal(submit.status,200);assert.equal((await submit.json()).status,'submitted');
 const badOrigin=await onRequestPost({request:request(token,'POST',{action:'create',entry:sample},base,'https://bad.example'),env});assert.equal(badOrigin.status,403);
 const malformed=await onRequestPost({request:request(token,'POST',{action:'create',entry:{...sample,body:'short'}}),env});assert.equal(malformed.status,400);
 const listing=await onRequestGet({request:request(token,'GET',{},base+'?status=draft'),env});assert.equal(listing.status,200);const j=await listing.json();assert.equal(j.canReview,false);assert.equal(j.publication,'manual-source-review-only');
 }finally{globalThis.fetch=prior}
});
test('independent reviewer must be on allowlist with a verified JWT and documented reasoning',async()=>{
 const {jwk,make}=await keyset();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});const db=memoryDb();const env={...config,WAITLIST_DB:db};
 try{
  const token=await make('reviewer@example.org');const proposal={action:'review',id:19,revision:2,decision:'approved',note:'Original community source checked; further publication review required.'};
  assert.equal((await onRequestPost({request:request(token,'POST',{...proposal,note:'too brief'}),env})).status,400);
  const result=await onRequestPost({request:request(token,'POST',proposal),env});assert.equal(result.status,200);const value=await result.json();assert.equal(value.publication,'not-published');assert.equal(value.status,'approved');assert.match(db.calls.at(-1).sql,/lower\(created_by\)<>\?2/);
  db.changes=0;assert.equal((await onRequestPost({request:request(token,'POST',proposal),env})).status,409);
  const forged=await make('outside@example.org');assert.equal((await onRequestGet({request:request(forged,'GET'),env})).status,403);
  const wrongAud=await make('reviewer@example.org',{aud:['another-app']});assert.equal((await onRequestGet({request:request(wrongAud,'GET'),env})).status,401);
 }finally{globalThis.fetch=prior}
});
test('publication packet is read-only, only for accepted entries, and does not publish',async()=>{
 const {jwk,make}=await keyset();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 const mock={prepare:sql=>({bind:()=>({first:async()=>sql.includes('approved')?{id:19,kind:'guide',slug:'sample-source-guide',title:sample.title,summary:sample.summary,body:sample.body,source_url:sample.sourceUrl,parish:'',event_date:'',revision:3,acted_by:'reviewer@example.org',action_note:'Internal editorial review only',updated_at:'2026-10-15'}:null})})};
 try{const token=await make();const result=await onRequestGet({request:request(token,'GET',{},base+'?export=19'),env:{...config,WAITLIST_DB:mock}});assert.equal(result.status,200);const packet=(await result.json()).packet;assert.match(packet.publicationStatus,/UNPUBLISHED/);assert.match(packet.requirements.join(' '),/GitHub/);assert.equal(packet.sourceUrl,sample.sourceUrl);
 const bad=await onRequestGet({request:request(token,'GET',{},base+'?export=none'),env:{...config,WAITLIST_DB:mock}});assert.equal(bad.status,400);
 const missing=await onRequestGet({request:request(token,'GET',{},base+'?export=20'),env:{...config,WAITLIST_DB:{prepare:()=>({bind:()=>({first:async()=>null})})}}});assert.equal(missing.status,404);
 }finally{globalThis.fetch=prior}
});
test('private editorial page has no publication controls or credentials',()=>{
 const html=readFileSync(new URL('../public/operator/editorial/index.html',import.meta.url),'utf8');const js=readFileSync(new URL('../public/operator/editorial/editorial.js',import.meta.url),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/separate human-approved source publication/);assert.doesNotMatch(html,/HUB_EDITORIAL_REVIEWERS|HUB_OPERATOR_AUD/);
 assert.match(js,/textContent/);assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage/);
});
