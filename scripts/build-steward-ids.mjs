import {readFileSync,writeFileSync} from 'node:fs';
const hub=JSON.parse(readFileSync(new URL('../hub/hub.json',import.meta.url),'utf8'));
const ids=hub.listings.map(r=>r.id);
if(ids.some(id=>typeof id!=='string'||!/^[a-z][a-z0-9-]{2,70}$/.test(id))||new Set(ids).size!==ids.length)throw Error('Invalid or duplicate steward listing id');
writeFileSync(new URL('../src/steward-listings.js',import.meta.url), `// Generated from hub/hub.json; never authorize a browser-supplied listing ID without this bound.\nexport const listingIds = new Set(${JSON.stringify(ids)});\n`);
console.log(`Prepared ${ids.length} scoped stewardship listing IDs`);
