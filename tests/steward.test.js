import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const hub=JSON.parse(read('hub/hub.json'));

test('15 source-referenced listing details have an honest independent status',()=>{
  for(const listing of hub.listings){
    const path=`public/places/${listing.id}/index.html`;
    assert.ok(existsSync(new URL(path,root)),path);
    const html=read(path);
    assert.match(html,/name="robots" content="noindex,follow"/);
    assert.ok(html.includes('Not independently verified'));
    assert.ok(html.includes('Source viewed'));
    assert.ok(html.includes(`record=${listing.id}&amp;intent=correction`));
    assert.ok(html.includes('Not confirmed by Tayyib'));
    assert.ok(html.includes('href="/steward.css"'));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes('Back to Find Halal Jamaica'));
    assert.doesNotMatch(html,/(Add to cart|buy now|verified halal partner)/i);
  }
});
test('directory connects each listing with two clear actions',()=>{
  const script=read('public/hub.js');
  assert.match(script,/directory-detail-link/);
  assert.match(script,/directory-correct-link/);
  assert.match(script,/source-listed/);
  assert.match(read('public/discover/index.html'),/contribute\/\?intent=listing/);
});
test('one contribution journey supports community, beginners and responsible organizations',()=>{
  const html=read('public/contribute/index.html');
  for(const text of ['Correct an existing listing','Suggest a place or business','Share an upcoming gathering','I represent an organization'])assert.ok(html.includes(text));
  assert.match(html,/id="steward-submit" type="submit" disabled/);
  assert.match(html,/id="steward-understand" type="checkbox" required/);
  assert.match(html,/id="steward-status"/);
  assert.match(html,/do not include phone numbers or private information/);
  assert.match(html,/noindex,follow/);
  const js=read('public/steward.js');
  assert.match(js,/\/api\/hub-config/);
  assert.match(js,/\/api\/hub-suggest/);
  assert.match(js,/challengeToken = null/);
  assert.match(js,/inFlight = true/);
  assert.match(js,/Representative suggestion \(identity not verified\)/);
  assert.doesNotMatch(html,/passport|national ID|credit card|account password/i);
});
test('events and partnerships use a single moderated contribution path',()=>{
  const events=read('public/events/index.html');
  const partners=read('public/partners/index.html');
  assert.match(events,/href="\/contribute\/\?intent=event"/);
  assert.doesNotMatch(events,/id="hub-suggest-form"/);
  assert.match(partners,/href="\/contribute\/\?intent=listing"/);
  assert.match(partners,/href="\/contribute\/\?intent=representative"/);
  assert.match(partners,/stylesheet" href="\/steward.css"/);
});
test('public contribution endpoints stay closed without explicit configuration',()=>{
  assert.match(read('functions/api/hub-config.js'),/HUB_SUBMISSIONS_ACTIVE/);
  assert.match(read('functions/api/hub-suggest.js'),/pending/);
  assert.doesNotMatch(read('public/steward.js'),/localStorage|sessionStorage|document.cookie/);
});
