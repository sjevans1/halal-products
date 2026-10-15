import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditContent,inspectSourceDate} from '../scripts/content-audit.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const base=()=>({hub:read('hub/hub.json'),catalog:read('catalog/catalog.json'),ingredients:read('hub/ingredient-guide.json'),today:'2026-10-15'});
test('source age is measured from last viewed public reference, not independent verification',()=>{
 assert.deepEqual(inspectSourceDate('2026-10-15','2026-10-15'),{ageDays:0,state:'source-recent'});
 assert.equal(inspectSourceDate('2026-07-16','2026-10-15').state,'recheck-due');
 assert.equal(inspectSourceDate('2026-04-01','2026-10-15').state,'source-stale');
 assert.throws(()=>inspectSourceDate('2026-02-30','2026-10-15'));
 assert.throws(()=>inspectSourceDate('2027-01-01','2026-10-15'));
});
test('base content has no fake certified businesses, unsourced events or source errors',()=>{
 const r=auditContent(base());
 assert.equal(r.blocking.length,0);assert.equal(r.counts.recent,15);assert.equal(r.counts.certified,0);
 assert.match(r.sourceMeaning,/NOT evidence/);
});
test('aging content becomes due/stale without false closure or disabling a published source',()=>{
 const input=base();input.hub.listings[0].sourceCheckedAt='2026-01-01';
 const report=auditContent(input);assert.equal(report.counts.stale,1);assert.equal(report.blocking.length,0);
 assert.equal(report.entries[0].reviewState,'source-stale');
});
test('expired certificate claim, future source dates and fake event approval block release',()=>{
 const x=base();x.hub.listings[0].halalStatus='certified';x.hub.listings[0].certification={certifier:'Mock',scope:'single SKU',evidenceUrl:'https://example.org/cert',expiresAt:'2025-01-01'};
 assert.ok(auditContent(x).blocking.some(e=>e.includes('Expired or unsupported')));
 x.hub.listings[0].halalStatus='not-applicable';delete x.hub.listings[0].certification;x.hub.listings[0].sourceCheckedAt='2027-01-01';
 assert.ok(auditContent(x).blocking.some(e=>e.includes('future')));
 x.hub.listings[0].sourceCheckedAt='2026-10-15';x.hub.events.push({id:'invented',title:'Unapproved party',sourceUrl:'https://example.org',date:'2027-01-01',approved:false});
 assert.ok(auditContent(x).blocking.some(e=>e.includes('Event lacks approval')));
});
test('the public directory makes no independent verification or source freshness claims',()=>{
 const app=readFileSync(new URL('../public/hub.js',import.meta.url),'utf8');
 assert.match(app,/source-warning/);assert.match(app,/Source viewed/);assert.match(app,/not independently checked/);
 assert.doesNotMatch(app,/halalStatus\s*=\s*['"]certified['"]/);
});
