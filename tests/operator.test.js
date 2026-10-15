import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {authorize} from '../src/operator-auth.js';
import {onRequestGet,onRequestPost} from '../functions/api/operator/suggestions.js';

const BASE='https://tayyib-halal.pages.dev/api/operator/suggestions';
const envBase={HUB_OPERATOR_ACTIVE:'true',HUB_OPERATOR_TEAM_DOMAIN:'tayyib.cloudflareaccess.com',HUB_OPERATOR_AUD:'test-access-app',HUB_OPERATOR_EMAILS:'editor@example.org'};
const originalFetch=globalThis.fetch;
const b64=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
const future=()=>Math.floor(Date.now()/1000);
async function identity(){
 const keys=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await webcrypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test-kid';jwk.use='sig';jwk.alg='RS256';
 const make=async overrides=>{
  const now=future();const claims={iss:'https://tayyib.cloudflareaccess.com',aud:['test-access-app'],email:'editor@example.org',iat:now,exp:now+3600,...overrides};
  const pieces=[b64({alg:'RS256',kid:'test-kid',typ:'JWT'}),b64(claims)];
  const signature=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(pieces.join('.')));
  return `${pieces.join('.')}.${Buffer.from(signature).toString('base64url')}`;
 };
 return {jwk,make};
}
const req=(token,method='GET',payload=null,origin=new URL(BASE).origin)=>new Request(BASE+(method==='GET'?'?status=pending':''),{method,headers:{'cf-access-jwt-assertion':token||'',...(method==='POST'?{'origin':origin,'content-type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(payload)}:{})});
const db={prepare:sql=>({bind:(...args)=>({all:async()=>({results:[{id:7,kind:'listing',title:'Example listing',source_url:'https://example.org',note:'Check source',review_status:'pending'}]}),sql,args})})};

test('operator endpoints remain unavailable until explicitly configured',async()=>{
 const response=await onRequestGet({request:req('fake'),env:{}});assert.equal(response.status,503);
 const x=await onRequestPost({request:req('fake','POST',{id:7,decision:'approved',note:'Enough evidence'}),env:{}});assert.equal(x.status,503);
});
test('spoofed Cloudflare email headers, unsigned tokens and unauthorized identity rejected',async()=>{
 const {jwk,make}=await identity();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 try{
  assert.equal((await authorize({request:req('broken'),env:{...envBase,WAITLIST_DB:db}})).error.status,401);
  const token=await make({email:'outsider@example.org'});
  assert.equal((await authorize({request:req(token),env:{...envBase,WAITLIST_DB:db}})).error.status,403);
  const wrongAud=await make({aud:['wrong']});assert.equal((await authorize({request:req(wrongAud),env:{...envBase,WAITLIST_DB:db}})).error.status,401);
  const expired=await make({exp:future()-1});assert.equal((await authorize({request:req(expired),env:{...envBase,WAITLIST_DB:db}})).error.status,401);
  const valid=await make();const tampered=valid.split('.');tampered[1]=b64({...JSON.parse(Buffer.from(tampered[1],'base64url').toString()),email:'editor@example.org',exp:future()+7200});
  assert.equal((await authorize({request:req(tampered.join('.')),env:{...envBase,WAITLIST_DB:db}})).error.status,401);
 }finally{globalThis.fetch=prior}
});
test('valid operator may read a bounded pending queue, without public output',async()=>{
 const {jwk,make}=await identity();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 try{
  const response=await onRequestGet({request:req(await make()),env:{...envBase,WAITLIST_DB:db}});
  assert.equal(response.status,200);const data=await response.json();assert.equal(data.items[0].id,7);assert.equal(data.publication,'never-automatic');
 }finally{globalThis.fetch=prior}
});
test('mutations require same-origin, bound data, meaningful note, and atomic auditable decision',async()=>{
 const {jwk,make}=await identity();const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});
 let stored=null;const audited={prepare:sql=>({bind:(...params)=>({sql,params})}),batch:async statements=>{stored=statements;return[{meta:{changes:1}},{meta:{changes:1}}]}};
 try{
  const token=await make();const settings={...envBase,WAITLIST_DB:audited};
  const input={id:7,decision:'approved',note:'Original source needs editorial follow-up'};
  assert.equal((await onRequestPost({request:req(token,'POST',input,'https://evil.example'),env:settings})).status,403);
  assert.equal((await onRequestPost({request:req(token,'POST',{...input,note:'short'}),env:settings})).status,400);
  const ok=await onRequestPost({request:req(token,'POST',input),env:settings});assert.equal(ok.status,200);assert.equal((await ok.json()).publication,'not-published');
  assert.equal(stored.length,2);assert.match(stored[0].sql,/review_status='pending'/);assert.match(stored[1].sql,/hub_moderation_audit/);
  assert.equal(stored[0].params[1],'editor@example.org');
  const conflict=await onRequestPost({request:req(token,'POST',input),env:{...settings,WAITLIST_DB:{...audited,batch:async()=>[{meta:{changes:0}},{meta:{changes:0}}]}}});
  assert.equal(conflict.status,409);
 }finally{globalThis.fetch=prior}
});
test('operator HTML is non-indexed and does not embed privileged credentials',()=>{
 const html=readFileSync(new URL('../public/operator/index.html',import.meta.url),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/Review ≠ Publish/);
 assert.doesNotMatch(html,/HUB_OPERATOR_EMAILS|HUB_OPERATOR_AUD|Authorization: Bearer/);
 const js=readFileSync(new URL('../public/operator/operator.js',import.meta.url),'utf8');
 assert.match(js,/textContent/);assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage/);
});
