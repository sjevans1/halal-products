import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/config.js';
import {onRequestPost,onRequestGet as getSubscribe} from '../functions/api/subscribe.js';
const request=(body,headers={'content-type':'application/json'})=>new Request('https://example.pages.dev/api/subscribe',{method:'POST',headers,body:JSON.stringify(body)});
test('list disabled without bindings or explicit activation',async()=>{
 const c=await onRequestGet({env:{}});assert.deepEqual(await c.json(),{enabled:false,turnstileSiteKey:null});
 const r=await onRequestPost({request:request({email:'person@example.com',consent:true}),env:{}});assert.equal(r.status,503);
 const hasBindings=await onRequestGet({env:{WAITLIST_DB:{},TURNSTILE_SECRET:'secret',TURNSTILE_SITE_KEY:'site'}});assert.equal((await hasBindings.json()).enabled,false);
});
test('reject absent consent and invalid emails',async()=>{
 const env={WAITLIST_ACTIVE:'true',WAITLIST_DB:{},TURNSTILE_SECRET:'secret',TURNSTILE_SITE_KEY:'sitekey'};
 let r=await onRequestPost({request:request({email:'bad',consent:true}),env});assert.equal(r.status,400);
 r=await onRequestPost({request:request({email:'person@example.com',consent:false}),env});assert.equal(r.status,400);
 r=await onRequestPost({request:request({email:'person@example.com',consent:true,turnstileToken:''}),env});assert.equal(r.status,400);
});
test('reject non-JSON, oversized and wrong method',async()=>{
 const env={WAITLIST_ACTIVE:'true',WAITLIST_DB:{},TURNSTILE_SECRET:'secret',TURNSTILE_SITE_KEY:'sitekey'};
 let r=await onRequestPost({request:new Request('https://example.pages.dev/api/subscribe',{method:'POST',headers:{'content-type':'text/plain'},body:'hello'}),env});assert.equal(r.status,415);
 r=await onRequestPost({request:request({email:'person@example.com',consent:true,extra:'x'.repeat(5000)}),env});assert.equal(r.status,413);
 r=getSubscribe();assert.equal(r.status,405);
});
test('verified user stored using parameterized SQL',async t=>{
 const original=globalThis.fetch;let stored=null;
 globalThis.fetch=async()=>Response.json({success:true});
 t.after(()=>{globalThis.fetch=original});
 const env={WAITLIST_ACTIVE:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET:'secret',WAITLIST_DB:{prepare:(sql)=>{assert.match(sql,/\?1/);return{bind:(email)=>({run:async()=>{stored=email}})}}}};
 const res=await onRequestPost({request:request({email:'Person@Example.COM',consent:true,turnstileToken:'valid'}),env});
 assert.equal(res.status,200);assert.equal(stored,'person@example.com');
});
test('reject invalid verification without storing',async t=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({success:false});t.after(()=>{globalThis.fetch=original});
 const env={WAITLIST_ACTIVE:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET:'secret',WAITLIST_DB:{prepare:()=>{throw Error('unexpected write')}}};
 const res=await onRequestPost({request:request({email:'person@example.com',consent:true,turnstileToken:'bad'}),env});assert.equal(res.status,403);
});
