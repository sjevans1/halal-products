import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const hub=JSON.parse(read('hub/hub.json'));
const publicHtml=read('public/index.html');
test('hub pages are real local routes with a shared premium experience',()=>{
 for(const path of ['discover','community','learn','kitchen','events','partners']){
  const html=read(`public/${path}/index.html`);
  assert.match(html,/id="main"/);assert.match(html,/Skip to content/);assert.match(html,/<link rel="stylesheet" href="\/hub.css"/);
  assert.match(html,/\/discover\//);assert.match(html,/\/community\//);assert.match(html,/\/learn\//);
  assert.match(html,/noindex,follow/);assert.doesNotMatch(html,/Add to cart|Buy now|Certified by/i);
 }
 assert.match(publicHtml,/id="explore"/);
 for(const path of ['/discover/','/community/','/learn/','/kitchen/','/events/'])assert.ok(publicHtml.includes(path));
});
test('directory data is sourced, identifiable and never promoted into certification without evidence',()=>{
 assert.ok(hub.listings.length>=10);
 const ids=new Set();
 for(const l of hub.listings){
  assert.ok(!ids.has(l.id));ids.add(l.id);
  assert.match(l.sourceUrl,/^https:\/\//);
  assert.match(l.sourceCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(l.listingStatus,'source-listed');
  assert.notEqual(l.halalStatus,'certified');
  assert.equal(l.prayerTimesConfirmed,false);
  assert.equal(l.openingHoursConfirmed,false);
 }
 assert.equal(hub.listings.filter(l=>l.kind==='business'||l.kind==='food').length,0);
 assert.match(read('public/discover/index.html'),/not been independently confirmed|not independently checked/);
});
test('only human-approved, sourced events can appear in public listing',()=>{
 assert.equal(hub.events.length,0);
 assert.match(read('public/events/index.html'),/No approved upcoming events yet/);
 assert.doesNotMatch(read('public/events/index.html'),/2026 Ramadan starts|Jummah at 1 PM/);
});
test('learning and recipe stories have assets, sources and accurate product links',()=>{
 assert.ok(hub.guides.length>=4);
 for(const g of hub.guides){assert.ok(g.sources.length);for(const s of g.sources)assert.match(s.url,/^https:\/\//)}
 for(const r of hub.recipes){assert.ok(existsSync(new URL(`public/assets/${r.image}`,root)));assert.ok(r.ingredients.every(i=>i.quantity>0));assert.ok(r.steps.length>=3)}
 assert.match(read('public/kitchen/index.html'),/servings-control/);
 assert.match(read('public/learn/index.html'),/fatwas/);
});
test('submissions have explicit gate and no accidental public publication path',()=>{
 const endpoint=read('functions/api/hub-suggest.js');
 assert.match(endpoint,/HUB_SUBMISSIONS_ACTIVE/);assert.match(endpoint,/turnstile\/v0\/siteverify/);assert.match(endpoint,/'pending'/);
 assert.doesNotMatch(endpoint,/UPDATE hub_suggestions SET review_status|SELECT \* FROM hub_suggestions/);
 assert.match(read('public/events/index.html'),/href="\/contribute\/\?intent=event"/);
});
