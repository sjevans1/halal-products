import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateConceptOffers,normalizePlan,planAsText} from '../src/offer-policy.mjs';
const read = p => JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalogue=read('catalog/catalog.json'), offers=read('commerce/offers.json');
test('all five concepts have explicit non-orderable offers with no invented JMD amounts',()=>{
 assert.equal(validateConceptOffers(catalogue,offers),true);
 assert.equal(offers.currency,'JMD');
 assert.equal(offers.items.every(x=>x.priceJmd===null&&x.status==='concept'&&x.availability==='unconfirmed'),true);
 assert.equal(offers.items.length,5);
});
test('build refuses bogus price, unverified availability or missing/duplicate product',()=>{
 for(const mutate of [
  x=>{x.items[0].priceJmd=2500},
  x=>{x.items[0].status='available'},
  x=>{x.items[0].halalEvidence='certified'},
  x=>{x.items[0].availability='in-stock'},
  x=>{x.items[0].packSize='500g'},
  x=>{x.items[1].id=x.items[0].id},
  x=>{x.currency='USD'},
 ]){
  const m=structuredClone(offers);mutate(m);assert.throws(()=>validateConceptOffers(catalogue,m));
 }
});
test('planning data clamps invalid or untrusted quantities and IDs',()=>{
 const ids=catalogue.products.map(p=>p.id);
 assert.deepEqual(normalizePlan([
  {id:ids[0],quantity:2},{id:ids[0],quantity:3},
  {id:'some-unlisted-product',quantity:1},
  {id:ids[1],quantity:999},{id:ids[2],quantity:1.2},
  {id:ids[3],quantity:1}
 ],ids),[{id:ids[0],quantity:2},{id:ids[3],quantity:1}]);
 assert.deepEqual(normalizePlan({bad:1},ids),[]);
});
test('copied list must never look like an order or price quotation',()=>{
 const out=planAsText([{id:'beef-cubes',quantity:2}],catalogue.products);
 assert.match(out,/2 × Premium Beef Cubes/);
 assert.match(out,/not an order/i);
 assert.match(out,/Prices and pack sizes have not been confirmed/);
 assert.doesNotMatch(out,/J\$\s*\d+/);
});
test('visitor journey is generated, accessible and contains no checkout form',()=>{
 const html=readFileSync(new URL('../public/plan/index.html',import.meta.url),'utf8');
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const code=readFileSync(new URL('../public/plan.js',import.meta.url),'utf8');
 assert.match(html,/id="main"/);
 assert.match(html,/id="plan-copy"/);
 assert.match(html,/id="plan-clear"/);
 assert.match(html,/id="plan-status"[^>]*role="status"/);
 assert.match(home,/href="\/plan\/"/);
 for(const p of catalogue.products){const detail=readFileSync(new URL(`../public/products/${p.id}/index.html`,import.meta.url),'utf8'); assert.match(detail,new RegExp(`/plan/\\?idea=${p.id}`));}
 assert.doesNotMatch(html,/Add to cart|Place order|Buy now|Checkout/i);
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|sendBeacon|POST/i);
});
