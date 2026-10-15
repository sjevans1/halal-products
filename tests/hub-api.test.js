import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet as config} from '../functions/api/hub-config.js';
import {onRequestPost, onRequestGet as deniedGet} from '../functions/api/hub-suggest.js';
const env={HUB_SUBMISSIONS_ACTIVE:'true',WAITLIST_DB:{},TURNSTILE_SITE_KEY:'public',TURNSTILE_SECRET:'secret'};
const body={type:'listing',title:'A new community site',sourceUrl:'https://example.org/source',note:'Please check the opening times',turnstileToken:'some-token'};
const post=(b,h={'content-type':'application/json'})=>new Request('https://tayyib-halal.pages.dev/api/hub-suggest',{method:'POST',headers:h,body:JSON.stringify(b)});
test('hub stays unavailable without explicit binding and activation',async()=>{
 assert.deepEqual(await (await config({env:{}})).json(),{enabled:false,turnstileSiteKey:null});
 assert.equal((await onRequestPost({env:{},request:post(body)})).status,503);
 assert.equal((await config({env})).status,200);
 assert.equal(deniedGet().status,405);
});
test('malformed or suspicious submissions are rejected before verification',async()=>{
 for(const patch of [{type:'invalid'},{title:'x'},{sourceUrl:'http://example.org'},{sourceUrl:'https://localhost/foo'},{sourceUrl:'https://127.0.0.1/data'},{note:3},{turnstileToken:''}]){
  const res=await onRequestPost({env,request:post({...body,...patch})});assert.equal(res.status,400,JSON.stringify(patch));
 }
 assert.equal((await onRequestPost({env,request:post(body,{'content-type':'text/plain'})})).status,415);
 assert.equal((await onRequestPost({env,request:post({...body,note:'x'.repeat(7000)})})).status,413);
});
test('Turnstile must succeed for request hostname before any database writes',async t=>{
 const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);
 globalThis.fetch=async()=>Response.json({success:true,hostname:'other.pages.dev'});
 const db={prepare:()=>{throw Error('database should not be touched')}};
 assert.equal((await onRequestPost({env:{...env,WAITLIST_DB:db},request:post(body)})).status,403);
 globalThis.fetch=async()=>Response.json({success:false,hostname:'tayyib-halal.pages.dev'});
 assert.equal((await onRequestPost({env:{...env,WAITLIST_DB:db},request:post(body)})).status,403);
});
test('verified submissions are inserted pending using positional bindings',async t=>{
 const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);
 globalThis.fetch=async()=>Response.json({success:true,hostname:'tayyib-halal.pages.dev'});
 let record=null;
 const db={prepare:sql=>{assert.match(sql,/VALUES \(\?1, \?2, \?3, \?4, \?5\)/);return{bind:(...args)=>({run:async()=>{record=args}})}}};
 const res=await onRequestPost({env:{...env,WAITLIST_DB:db},request:post(body)});
 assert.equal(res.status,200);assert.equal((await res.json()).ok,true);assert.deepEqual(record,['listing',body.title,body.sourceUrl,body.note,'pending']);
});
