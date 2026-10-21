import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePublicEvents,upcomingEvents,formatJamaicaEventDate} from '../scripts/event-policy.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const seed={id:'organizer-announced-example',title:'Community information session',summary:'An informative gathering announced on an organizer page.',organizer:'Example organizer for tests only',kind:'learning',parish:'Kingston',locality:'Kingston, Jamaica',sourceUrl:'https://jamaicahalalcouncil.org/events/confirmed-meeting',sourceCheckedAt:'2026-10-20',startsAt:'2026-11-20T18:30:00-05:00',endsAt:'2026-11-20T20:30:00-05:00',approved:true,approvedBy:'Independent editor',reviewedAt:'2026-10-20'};
const validate=(e)=>validatePublicEvents([e],'2026-10-20');
test('real public dataset starts with no imagined events',()=>{
 const hub=JSON.parse(read('hub/hub.json'));assert.deepEqual(hub.events,[]);assert.deepEqual(validatePublicEvents(hub.events,'2026-10-20'),[]);
});
test('approved source-linked Jamaica-local event passes model',()=>{
 assert.equal(validate(seed)[0].id,seed.id);
 assert.match(formatJamaicaEventDate(seed.startsAt),/Nov/);
});
test('event model rejects unapproved, unsourced, invalid date or scope',()=>{
 const bad=[{approved:false},{approvedBy:''},{reviewedAt:'2026-10-21'},{sourceUrl:'http://example.org'},{sourceUrl:'https://example.com/item'},{sourceCheckedAt:'2026-02-30'},{parish:'Not a parish'},{kind:'concert'},{startsAt:'2026-11-20T18:30:00Z'},{startsAt:'2026-02-30T18:30:00-05:00'},{endsAt:'2026-11-19T20:30:00-05:00'},{title:'<b>Injected</b>'},{parish:'Islandwide',locality:'Hidden venue'}];
 for(const patch of bad)assert.throws(()=>validate({...seed,...patch}),Error,JSON.stringify(patch));
 assert.throws(()=>validatePublicEvents([seed,seed],'2026-10-20'),/duplicate/);
});
test('expired events are not displayed and results are chronological',()=>{
 const soon={...seed,id:'sooner',startsAt:'2026-11-01T10:00:00-05:00',endsAt:'2026-11-01T12:00:00-05:00'};
 const expired={...seed,id:'past',startsAt:'2026-10-19T10:00:00-05:00',endsAt:'2026-10-19T12:00:00-05:00'};
 assert.deepEqual(upcomingEvents([seed,expired,soon],Date.parse('2026-10-20T00:00:00Z')).map(e=>e.id),['sooner',seed.id]);
});
test('event page exposes no fake calendar, but has useful planning and true disabled state',()=>{
 const html=read('public/events/index.html');
 assert.match(html,/No approved upcoming events yet/);
 assert.match(html,/id="ramadan-progress"/);
 assert.match(html,/id="ramadan-reset"/);
 assert.match(html,/href="\/contribute\/\?intent=event"/);
 assert.match(html,/RAMADAN &amp; EID/);
 assert.doesNotMatch(html,/2026 Ramadan starts|Jummah at 1 PM|confirmed upcoming this week/);
 const js=read('public/events-explore.js');assert.match(js,/data-event-id/);assert.match(js,/data-ramadan-step/);
});
