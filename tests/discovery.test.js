import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const hub=JSON.parse(text('hub/hub.json'));
const html=text('public/discover/index.html');
const js=text('public/discover-explore.js');
test('Jamaican visitor wayfinder is visible, accessible and uses actual seeded category counts',()=>{
 assert.match(html,/START WITH WHAT MATTERS TO YOU/);
 assert.match(html,/Find a mosque/);assert.match(html,/Meet the community/);assert.match(html,/New to halal/);
 assert.match(html,/no independently verified restaurants or food businesses/);
 assert.match(html,/aria-label="Choose a parish"/);
 const counts=[...html.matchAll(/data-parish-choice="([^"]+)"[^>]*>[^<]+<small>(\d+)<\/small>/g)];
 assert.equal(counts.length,new Set(hub.listings.map(l=>l.parish)).size+1);
 for(const [,p,n] of counts){assert.equal(+n,p==='all'?hub.listings.length:hub.listings.filter(l=>l.parish===p).length)}
 assert.match(html,/discover-share-status[^>]+role="status"/);
 assert.match(html,/id="discover-reset"/);
 assert.match(html,/discover-explore\.css/);
 assert.match(html,/discover-explore\.js/);
});
test('directory exploration has no invented locations, client-side geolocation or auto-approved claims',()=>{
 assert.equal(hub.listings.filter(l=>['food','business'].includes(l.kind)).length,0);
 assert.doesNotMatch(js,/\.geolocation|localStorage|fetch\(|navigator\.sendBeacon/);
 assert.match(js,/aria-pressed/);assert.match(js,/history\.replaceState/);
 assert.match(js,/query\.dispatchEvent/);
 assert.match(js,/navigator\.clipboard/);
 assert.match(html,/Search places or services/);
 assert.match(html,/not endorsements or confirmed halal certifications/);
});
