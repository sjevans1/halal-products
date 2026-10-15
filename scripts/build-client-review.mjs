#!/usr/bin/env node
/** Generates the sanitized public client-review artefact from public/.
 *  Usage: node scripts/build-client-review.mjs [--verify-only]
 *
 *  Output: dist/client-review (disposable, never committed, published only by
 *  scripts/deploy-client-review.sh). The artefact excludes the operator and
 *  steward workspaces, carries no Pages Functions and no D1 bindings, and adds
 *  the review indexing controls. The verifier below fails the build whenever a
 *  private surface leaks into the output; do not weaken those checks.
 */
import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src=path.join(root,'public');
const out=path.join(root,'dist','client-review');
const verifyOnly=process.argv.includes('--verify-only');

const REMOVE=['operator','steward','steward-portal.js','steward-portal.css'];
const ROBOTS="User-agent: *\nDisallow: /\n# Client review build. Indexing controls only; this file is not access security.\n";
const HEADERS=`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Robots-Tag: noindex, nofollow
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: https://challenges.cloudflare.com; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
`;

// The /contribute/ honesty box points readers at the excluded steward workspace;
// the whole sentence goes rather than leaving a dangling phrase.
const PORTAL_SENTENCE='<p>Already independently approved? <a href="/steward/">View your assigned listing</a>.</p>';

async function* walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='.wrangler')continue;const p=path.join(dir,entry.name);if(entry.isDirectory())yield* walk(p);else yield p;}}

if(!verifyOnly){
  await rm(out,{recursive:true,force:true});
  await mkdir(out,{recursive:true});
  await cp(src,out,{recursive:true});
  for(const rel of REMOVE)await rm(path.join(out,rel),{recursive:true,force:true});
  await writeFile(path.join(out,'robots.txt'),ROBOTS);
  await writeFile(path.join(out,'_headers'),HEADERS);
  let pruned=0;
  for await(const file of walk(out)){
    if(!file.endsWith('.html'))continue;
    const html=await readFile(file,'utf8');
    let next=html.split(PORTAL_SENTENCE).join('');
    next=next.replace(/<a\b[^>]*href="\/(?:steward|operator)\/[^"]*"[^>]*>[\s\S]*?<\/a>/g,'');
    if(next!==html){await writeFile(file,next);pruned++;}
  }
  console.log(`Client review artefact generated at ${path.relative(root,out)} (links pruned in ${pruned} page(s))`);
}

// ---- verification: any private-surface leak fails the build
const problems=[];
for(const rel of ['operator','steward'])if(existsSync(path.join(out,rel)))problems.push(`private directory present: ${rel}/`);
let files=0;
for await(const file of walk(out)){
  files++;
  const rel=path.relative(out,file);
  const text=await readFile(file,'utf8').catch(()=>'');
  if(file.endsWith('.html')&&/href="\/(?:steward|operator)\//.test(text))problems.push(`link to private surface: ${rel}`);
  if(/steward-portal\.(js|css)/.test(text))problems.push(`steward portal asset reference: ${rel}`);
  if(/HUB_OPERATOR_ACTIVE|HUB_STEWARD_ACTIVE|HUB_EDITORIAL_ACTIVE|HUB_TRUST_ACTIVE|TURNSTILE_SECRET|CLOUDFLARE_API_TOKEN|CF_API_TOKEN/.test(text))problems.push(`secret or private flag name: ${rel}`);
}
for(const must of ['index.html','404.html','robots.txt','_headers','privacy.html','discover/index.html','kitchen/index.html','learn/ingredients/index.html','products/beef-cubes/index.html','places/central-masjid/index.html','contribute/index.html'])if(!existsSync(path.join(out,must)))problems.push(`missing expected file: ${must}`);
if(existsSync(path.join(out,'functions')))problems.push('functions directory must never be part of the client artefact');
if(problems.length){console.error('CLIENT REVIEW VERIFY FAILED:');for(const p of problems)console.error(' -',p);process.exit(1);}
console.log(`Client review verify PASS: ${files} files, no private surfaces, no functions, review robots.txt and noindex headers in place`);
