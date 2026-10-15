import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
export function inspectSourceDate(checked,today){
 if(typeof checked!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(checked)||typeof today!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Source date must be YYYY-MM-DD');
 const a=new Date(checked+'T00:00:00Z'),b=new Date(today+'T00:00:00Z');
 if(!Number.isFinite(a.valueOf())||a.toISOString().slice(0,10)!==checked||!Number.isFinite(b.valueOf())||b.toISOString().slice(0,10)!==today)throw Error('Invalid calendar date');
 const days=Math.floor((b-a)/86400000);
 if(days<0)throw Error('Source check cannot be in the future');
 return {ageDays:days,state:days>180?'source-stale':days>90?'recheck-due':'source-recent'};
}
export function auditContent({hub,ingredients,catalog,today}){
 const report={asOf:today,sourceMeaning:'Source viewed date, NOT evidence of venue inspection, halal certification or current service',counts:{recent:0,due:0,stale:0,certified:0},entries:[],blocking:[]};
 const ids=new Set();
 const sourceOK=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')}catch{return false}};
 for(const l of hub.listings){
  if(!sourceOK(l.sourceUrl))report.blocking.push(`Invalid source URL on ${l.id}`);
  if(ids.has(l.id))report.blocking.push(`Duplicate listing ${l.id}`);ids.add(l.id);
  let fresh;try{fresh=inspectSourceDate(l.sourceCheckedAt,today)}catch(err){report.blocking.push(`Invalid source date ${l.id}: ${err.message}`);continue}
  report.counts[fresh.state==='source-recent'?'recent':fresh.state==='recheck-due'?'due':'stale']++;
  report.entries.push({id:l.id,name:l.name,parish:l.parish,sourceViewedAt:l.sourceCheckedAt,ageDays:fresh.ageDays,reviewState:fresh.state,halalStatus:l.halalStatus});
  if(l.halalStatus==='certified'){
   report.counts.certified++;
   const cert=l.certification;
   if(!cert||!sourceOK(cert.evidenceUrl)||!cert.certifier||!cert.scope||!cert.expiresAt||cert.expiresAt<today)report.blocking.push(`Expired or unsupported certification claim: ${l.id}`);
  }
 }
 for(const e of hub.events){if(e.approved!==true||!sourceOK(e.sourceUrl)||!e.title||!e.date)report.blocking.push(`Event lacks approval or source: ${e.id||'unknown'}`)}
 for(const g of hub.guides){if(!Array.isArray(g.sources)||!g.sources.length||!g.sources.every(x=>sourceOK(x.url)))report.blocking.push(`Guide missing reliable sources: ${g.id}`)}
 if(!sourceOK(ingredients.reference.url))report.blocking.push('Ingredient guide is missing published source');
 if(catalog.products.some(p=>!p.details?.some(d=>/not yet verified|not verified|required|to be confirmed|awaiting/i.test(d))))report.blocking.push('Product concept missing honest verification warning');
 return report;
}
const run=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(run){
 const today=new Date().toISOString().slice(0,10);
 const report=auditContent({hub:read('hub/hub.json'),ingredients:read('hub/ingredient-guide.json'),catalog:read('catalog/catalog.json'),today});
 if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
 else{
  console.log(`Tayyib community source audit: ${report.asOf}`);
  console.log(`Source references viewed ≤90 days: ${report.counts.recent}; 91–180 days: ${report.counts.due}; >180 days: ${report.counts.stale}; verified certification claims: ${report.counts.certified}`);
  for(const e of report.entries.filter(x=>x.reviewState!=='source-recent'))console.log(`FOLLOW-UP ${e.reviewState}: ${e.id} (${e.ageDays} days; ${e.sourceViewedAt}). Source must be rechecked, not assumed wrong.`);
  console.log(`BLOCKING content issues: ${report.blocking.length}`);
  for(const problem of report.blocking)console.log('BLOCK: '+problem);
 }
 const outArg=process.argv.indexOf('--out');
 if(outArg!==-1){const target=process.argv[outArg+1];if(!target||target.startsWith('-'))throw Error('--out needs a local destination');const full=resolve(target);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,JSON.stringify(report,null,2)+'\n')}
 if(report.blocking.length)process.exitCode=1;
}
