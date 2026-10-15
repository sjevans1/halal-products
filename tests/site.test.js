import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const get = path => readFileSync(new URL(path,root),'utf8');
const index=get('public/index.html');
const css=get('public/styles.css');
const script=get('public/app.js');
const catalog=JSON.parse(get('catalog/catalog.json'));
const assets=new URL('public/assets/',root);

test('important journeys represented on landing page',()=>{
 for(const id of ['main','collection','edits','our-way','recipes','halal-guide','questions','join','waitlist-form','product-dialog','recipe-dialog','search-dialog','saved-dialog']) assert.match(index,new RegExp(`id="${id}"`));
});
test('product source is complete and generated into public pages',()=>{
 assert.equal(catalog.products.length,5);
 const ids=new Set();
 for(const p of catalog.products){
   assert.ok(!ids.has(p.id),`duplicate ${p.id}`); ids.add(p.id);
   assert.match(index,new RegExp(`data-product="${p.id}"`));
   const path=`public/products/${p.id}/index.html`;
   assert.ok(existsSync(new URL(path,root)),`missing ${path}`);
   const body=get(path);
   assert.ok(body.includes(p.name));
   assert.ok(body.includes(p.story));
   assert.match(body,/ILLUSTRATIVE PACKAGING/);
   assert.match(body,/not a purchasable product/);
   assert.match(body,/noindex,follow/);
   assert.ok(existsSync(new URL(`public/assets/${p.image}`,root)),`missing ${p.image}`);
   assert.ok(p.details.length>=2);
 }
 assert.equal((index.match(/class="product-card"/g)||[]).length,catalog.products.length);
});
test('bundles have valid, unique catalogue members and real pages',()=>{
 assert.equal(catalog.bundles.length,3);
 const ids=new Set(catalog.products.map(x=>x.id));
 for(const b of catalog.bundles){
   assert.ok(b.products.length>=2);
   assert.equal(new Set(b.products).size,b.products.length);
   assert.ok(b.products.every(x=>ids.has(x)));
   const page=get(`public/collections/${b.id}/index.html`);
   assert.ok(page.includes(b.name));
   assert.match(page,/not an orderable or priced bundle/);
   assert.match(index,new RegExp(`/collections/${b.id}/`));
 }
});
test('all featured recipes include real corresponding photography',()=>{
 for(const name of ['curry-dish','skewers-dish','vegetables-dish']){
   assert.ok(index.includes(`assets/${name}.webp`)||index.includes(`data-brand-asset="${name}"`));
   assert.ok(existsSync(new URL(`public/assets/${name}.webp`,root)));
 }
 assert.doesNotMatch(index,/recipe-art/);
});
test('launch concept disclaimers and no premature commerce',()=>{
 assert.match(index,/ILLUSTRATIVE CONCEPT/);
 assert.match(index,/No orders are currently taken/);
 assert.doesNotMatch(index,/(Add to cart|Buy now|Certified by|Stripe Checkout)/i);
 for(const p of catalog.products) assert.doesNotMatch(p.summary,/certified|guaranteed|available now/i);
});
test('no unverified social or domain destinations',()=>{
 assert.doesNotMatch(index,/href="https?:\/\//);
 assert.doesNotMatch(index,/hello@tayyibhalal/);
});
test('forms, keyboard affordances and reduced motion remain',()=>{
 for(const x of ['type="email"','type="checkbox"','aria-live="polite"','type="submit"','autocomplete="email"','novalidate']) assert.ok(index.includes(x));
 assert.match(index,/href="\/privacy.html"/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('first party WebP images without legacy base64 hydration',()=>{
 assert.doesNotMatch(script,/\.b64|base64/);
 assert.match(script,/catalogue\.products/);
 const files=readdirSync(assets);
 assert.equal(files.filter(f=>f.endsWith('.b64')).length,0);
 const required=['beef-cubes-new','ground-beef','jerk-sausages','qaddid','spice-blend','curry-dish','skewers-dish','vegetables-dish'];
 for(const name of required) assert.ok(files.includes(`${name}.webp`));
});
test('static output excludes server-side and planning data',()=>{
 const files=readdirSync(new URL('public/',root));
 for(const name of ['functions','migrations','docs','.dev','tests','catalog','scripts']) assert.ok(!files.includes(name));
 assert.doesNotMatch(script,/stripe|paymentIntent|checkout\.sessions/i);
});


test('premium Jamaica-specific copy avoids competitor brand wording and em dashes', () => {
  assert.ok(catalog.bundles.some(b => b.id === 'grill-of-the-island' && b.name === 'Grill of the Island'));
  assert.ok(existsSync(new URL('public/collections/grill-of-the-island/index.html', root)));
  assert.ok(!existsSync(new URL('public/collections/island-grill/index.html', root)));
  const scan = dir => {
    for(const entry of readdirSync(dir, {withFileTypes: true})) {
      const path = join(dir,entry.name);
      if(entry.isDirectory()) scan(path);
      else if(/\.(html|js|json)$/.test(entry.name)) {
        const content=readFileSync(path,'utf8');
        assert.ok(!content.includes('—'), `em dash in public copy: ${path}`);
        assert.ok(!/island[ -]grill/i.test(content), `conflicting local business term in public copy: ${path}`);
      }
    }
  };
  scan(new URL('public/',root).pathname);
});
