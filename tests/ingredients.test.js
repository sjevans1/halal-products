import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const data=JSON.parse(read('hub/ingredient-guide.json'));
const html=read('public/learn/ingredients/index.html');
const learn=read('public/learn/index.html');
const js=read('public/ingredients.js');
test('ingredient guide is broad, sourced and does not proclaim individual products certified',()=>{
 assert.equal(data.ingredients.length,14);
 assert.equal(data.reference.url,'https://jamhalco.org/resource/halal-food-general-guide/');
 assert.equal(new Set(data.ingredients.map(i=>i.id)).size,14);
 for(const i of data.ingredients){assert.ok(i.why.length>35);assert.ok(i.ask.length>25);assert.ok(data.groups.some(g=>g.id===i.group))}
 assert.match(html,/not a certification, fatwa/);
 assert.match(html,/should be treated as independently verified/);
});
test('generated site exposes a real searchable guide with local-only UX',()=>{
 assert.match(learn,/href="\/learn\/ingredients\/"/);
 for(const needle of ['id="ingredient-query"','id="ingredient-count"','data-ingredient-check','id="copy-supplier-questions"','/ingredients-data.js','/ingredients.js','halal food'])assert.match(html,new RegExp(needle,'i'));
 assert.match(js,/filter/);assert.match(js,/aria-pressed/);assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage/);
});
test('educational content does not invent a purchasable or certified SKU',()=>{
 assert.doesNotMatch(html,/add to cart|buy now|available for purchase/i);
 assert.doesNotMatch(html,/certified by Tayyib Halal/i);
 assert.equal((html.match(/class="ingredient-card"/g)||[]).length,14);
});
