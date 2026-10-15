import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('critical journeys represented in UX',()=>{
 for(const id of ['main','collection','our-way','recipes','halal-guide','questions','join','waitlist-form','product-dialog','recipe-dialog','search-dialog','saved-dialog'])assert.match(index,new RegExp(`id="${id}"`));
});
test('concepts distinguished from commerce',()=>{
 assert.match(index,/CONCEPT PREVIEW/);assert.match(index,/No orders are currently taken/);assert.doesNotMatch(index,/(Add to cart|Buy now|Certified by)/i);
});
test('no unverified social or domain destinations',()=>{
 assert.doesNotMatch(index,/href="https?:\/\//);assert.doesNotMatch(index,/hello@tayyibhalal/);
});
test('input, status and consent accessible',()=>{
 for(const x of ['type="email"','type="checkbox"','aria-live="polite"','type="submit"','autocomplete="email"','novalidate'])assert.ok(index.includes(x));
 assert.match(index,/href="\/privacy.html"/);
});
test('responsive and reduced motion',()=>{
 assert.match(css,/@media\(max-width:680px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('images packed and nonempty',()=>{
 for(const name of ['pouch','montage','seal','jerky','seasoning','meal']){
 const str=readFileSync(new URL(`../public/assets/${name}.b64`,import.meta.url),'utf8').replace(/\s/g,'');
 assert.ok(str.length>1000);assert.match(str,/^[A-Za-z0-9+/]+=*$/);
 }
});
test('no sample sales checkout flows hidden in script',()=>{
 assert.doesNotMatch(script,/stripe|paymentIntent|checkout\.sessions/i);
});
test('static root excludes sensitive source and migrations',()=>{
 const files=readdirSync(new URL('../public/',import.meta.url));for(const name of ['functions','migrations','docs','.dev','tests'])assert.ok(!files.includes(name));
});
