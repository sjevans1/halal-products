import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {validEmail,validSource,validDay,validGrant,validProposal} from '../src/steward-policy.js';
import {listingIds} from '../src/steward-listings.js';
import {onRequestGet as operatorGet,onRequestPost as operatorPost} from '../functions/api/operator/stewards.js';
import {onRequestGet as stewardGet,onRequestPost as stewardPost} from '../functions/api/steward/proposals.js';
const domain='tayyib.cloudflareaccess.com';
const base='https://tayyib-halal.pages.dev';
const env={HUB_OPERATOR_ACTIVE:'true',HUB_OPERATOR_TEAM_DOMAIN:domain,HUB_OPERATOR_AUD:'operator-app',HUB_OPERATOR_EMAILS:'reviewer@example.org',HUB_STEWARD_GRANTS_ACTIVE:'true',HUB_STEWARD_GRANT_REVIEWERS:'reviewer@example.org',HUB_STEWARD_ACTIVE:'true',HUB_STEWARD_TEAM_DOMAIN:domain,HUB_STEWARD_AUD:'steward-app'};
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
let cache;
async function keys(){if(cache)return cache;const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);const jwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);Object.assign(jwk,{kid:'steward-kid',alg:'RS256',use:'sig'});
 cache={jwk,make:async(email,aud,claims={})=>{const now=Math.floor(Date.now()/1000),body={iss:`https://${domain}`,aud:[aud],email,iat:now,exp:now+3600,...claims},parts=[b64({alg:'RS256',kid:'steward-kid'}),b64(body)];const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(parts.join('.')));return `${parts.join('.')}.${Buffer.from(sig).toString('base64url')}`}};return cache;}
const request=(endpoint,token,method='GET',body={},origin=base)=>new Request(`${base}${endpoint}`,{method,headers:{'cf-access-jwt-assertion':token,...(method==='POST'?{'content-type':'application/json',origin}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
const grant=()=>({action:'grant',listingId:[...listingIds][0],email:'member@example.org',sourceUrl:'https://example.org/community/committee',expiresAt:'2027-04-15',note:'The committee confirmed their representative and reviewed a dated organization announcement.'});
const db=()=>{let calls=[];return {get calls(){return calls},prepare(sql){return {bind(...args){calls.push({sql,args});return {run:async()=>({meta:{changes:1,last_row_id:14}}),all:async()=>({results:[{id:14,listing_id:[...listingIds][0],email:'member@example.org',source_url:'https://example.org',review_note:'Publicly sourced authority has been checked by an independent reviewer.',issued_by:'reviewer@example.org',expires_at:'2027-04-15',status:'active',revision:1,created_at:'2026-10-15'}]})}}}}}};
async function withKeys(fn){const {jwk,make}=await keys();const previous=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});try{return await fn(make)}finally{globalThis.fetch=previous}}
test('policy is strict about scope, independent reviewer, public source, expiry and bound text',()=>{
 const g=grant();assert.equal(validGrant(g,listingIds,'reviewer@example.org'),null);assert.match(validGrant({...g,listingId:'fake-business'},listingIds,'reviewer@example.org'),/existing/);
 assert.match(validGrant({...g,email:'reviewer@example.org'},listingIds,'reviewer@example.org'),/different/);
 assert.match(validGrant({...g,note:'ok'},listingIds,'reviewer@example.org'),/40/);
 for(const u of ['http://example.org','https://localhost/','https://123.4.5.6','https://username:password@example.org','javascript:alert(1)'])assert.equal(validSource(u),false);
 assert.equal(validSource(g.sourceUrl),true);assert.equal(validEmail(g.email),true);assert.equal(validDay('2026-02-30'),false);
 assert.match(validProposal({grantId:1,sourceUrl:'https://example.org',note:'short'}),/30/);
});
test('steward and grant endpoints default closed',async()=>{
 assert.equal((await operatorGet({request:request('/api/operator/stewards','bad'),env:{}})).status,503);
 assert.equal((await operatorPost({request:request('/api/operator/stewards','bad','POST',grant()),env:{}})).status,503);
 assert.equal((await stewardGet({request:request('/api/steward/proposals','bad'),env:{}})).status,503);
 assert.equal((await stewardPost({request:request('/api/steward/proposals','bad','POST',{}),env:{}})).status,503);
});
test('grant access requires signed operator-only audience, reviewer role and independent contact',async()=>withKeys(async make=>{
 const database=db();const settings={...env,WAITLIST_DB:database};const staff=await make('reviewer@example.org','operator-app');const person=await make('member@example.org','steward-app');
 assert.equal((await operatorGet({request:request('/api/operator/stewards',person),env:settings})).status,401);
 assert.equal((await stewardGet({request:request('/api/steward/proposals',staff),env:settings})).status,401);
 const rows=await operatorGet({request:request('/api/operator/stewards',staff),env:settings});assert.equal(rows.status,200);assert.equal((await rows.json()).items[0].listing_id,[...listingIds][0]);
 const proposed=await operatorPost({request:request('/api/operator/stewards',staff,'POST',grant()),env:settings});assert.equal(proposed.status,201);assert.equal((await proposed.json()).publication,'never-automatic');assert.match(database.calls.at(-1).sql,/INSERT INTO steward_grants/);
 assert.equal((await operatorPost({request:request('/api/operator/stewards',staff,'POST',{...grant(),listingId:'other-parish'},'https://evil.example'),env:settings})).status,403);
 assert.equal((await operatorPost({request:request('/api/operator/stewards',staff,'POST',{...grant(),email:'reviewer@example.org'}),env:settings})).status,400);
}));
test('revoke requires explicit reason and revision, cannot be a dropdown mutation',async()=>withKeys(async make=>{
 const database=db(),settings={...env,WAITLIST_DB:database},staff=await make('reviewer@example.org','operator-app');
 assert.equal((await operatorPost({request:request('/api/operator/stewards',staff,'POST',{action:'revoke',id:14,revision:1,note:'short'}),env:settings})).status,400);
 const result=await operatorPost({request:request('/api/operator/stewards',staff,'POST',{action:'revoke',id:14,revision:1,note:'The delegated relationship was withdrawn by the organization.'}),env:settings});assert.equal(result.status,200);assert.match(database.calls.at(-1).sql,/revision=revision\+1/);assert.match(database.calls.at(-1).sql,/status='active'/);
}));
test('stewards see only their own grant and cannot choose another listing for a write',async()=>withKeys(async make=>{
 const database=db(),settings={...env,WAITLIST_DB:database},member=await make('member@example.org','steward-app');
 const get=await stewardGet({request:request('/api/steward/proposals',member),env:settings});assert.equal(get.status,200);assert.equal((await get.json()).grants[0].id,14);assert.match(database.calls.at(-1).sql,/email=\?1 AND status='active'/);
 const proposal={grantId:14,sourceUrl:'https://example.org/updated-hours',note:'The organizer has updated the listed information. Please independently verify the attached source.'};
 assert.equal((await stewardPost({request:request('/api/steward/proposals',member,'POST',proposal),env:settings})).status,201);
 const inserted=database.calls.at(-1);assert.match(inserted.sql,/INSERT INTO steward_proposals/);assert.match(inserted.sql,/SELECT id,listing_id,email/);assert.match(inserted.sql,/status='active'/);assert.equal(inserted.args.at(-1),'member@example.org');
 assert.equal((await stewardPost({request:request('/api/steward/proposals',member,'POST',{...proposal,listingId:'someone-else'},'https://evil.example'),env:settings})).status,403);
 assert.equal((await stewardPost({request:request('/api/steward/proposals',member,'POST',{...proposal,sourceUrl:'http://bad.example'}),env:settings})).status,400);
 const revokedDb={prepare:()=>({bind:()=>({run:async()=>({meta:{changes:0}})})})};
 assert.equal((await stewardPost({request:request('/api/steward/proposals',member,'POST',proposal),env:{...settings,WAITLIST_DB:revokedDb}})).status,403);
}));
test('private portal excludes raw claim activation and uses explicit confirmation',()=>{
 for(const file of ['../public/steward/index.html','../public/operator/stewards/index.html']){const html=readFileSync(new URL(file,import.meta.url),'utf8');assert.match(html,/noindex,nofollow/);assert.match(html,/<dialog/);assert.doesNotMatch(html,/HUB_STEWARD_AUD|TURNSTILE_SECRET/);}
 const op=readFileSync(new URL('../public/operator/stewards/stewards.js',import.meta.url),'utf8');const portal=readFileSync(new URL('../public/steward-portal.js',import.meta.url),'utf8');for(const code of [op,portal]){assert.doesNotMatch(code,/innerHTML|localStorage|sessionStorage|\bprompt\(/);assert.match(code,/showModal/);}
});
