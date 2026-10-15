import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const parse=f=>JSON.parse(readFileSync(new URL(f,root),'utf8'));
const registry=parse('trust/registry.json');
const catalog=parse('catalog/catalog.json');
const hub=parse('hub/hub.json');
const expected=new Map([
  ...catalog.products.map(p=>['product:'+p.id,{kind:'product',name:p.name,baseline:'unverified',origin:'catalog/catalog.json'}]),
  ...hub.listings.map(l=>['community:'+l.id,{kind:'community',name:l.name,baseline:'source-listed-only',origin:'hub/hub.json'}])
]);
if(!Array.isArray(registry.subjects)||registry.subjects.length!==expected.size)throw Error('Trust register must cover all known product and hub records');
const seen=new Set();
for(const s of registry.subjects){
 if(typeof s.key!=='string'||!/^((product|community):[a-z0-9-]+)$/.test(s.key)||seen.has(s.key)||!expected.has(s.key))throw Error('Invalid or duplicate trust subject: '+s.key);
 const e=expected.get(s.key);
 if(s.kind!==e.kind||s.name!==e.name||s.origin!==e.origin||s.baseline!==e.baseline)throw Error('Trust subject must match source of truth: '+s.key);
 seen.add(s.key);
}
// Migration history is immutable. Adding a subject requires a NEW, reviewed seed migration.
const migrationDir=new URL('migrations/',root);
const planted=new Set();
for(const name of readdirSync(migrationDir).filter(n=>/^\d+_.*\.sql$/.test(n))){
 const sql=readFileSync(new URL(name,migrationDir),'utf8');
 for(const match of sql.matchAll(/INSERT OR IGNORE INTO trust_subjects \(subject_key,kind,display_name,baseline\) VALUES \('([^']+)'/g))planted.add(match[1]);
}
for(const subject of registry.subjects)if(!planted.has(subject.key))throw Error(`Missing trust seed for ${subject.key}; create a new forward-only migration, do not rewrite 0005`);
console.log(`Validated ${seen.size} unverified trust subjects with committed forward-only migration seeds`);
