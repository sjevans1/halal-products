import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(join(root, 'catalog/catalog.json'), 'utf8'));
const publicPath = join(root, 'public');
const homePath = join(publicPath, 'index.html');
const imageDir = join(publicPath, 'assets');
const productIds = new Set();
const bundleIds = new Set();
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validCategory = new Set(['freezer', 'ready', 'pantry']);
const esc = (str) => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const productLink = p => `/products/${p.id}/`;
const bundleLink = b => `/collections/${b.id}/`;
const byId = Object.fromEntries(data.products.map(p=>[p.id,p]));
function fail(message) {throw new Error('Catalogue validation: ' + message)}
function must(cond, message) { if(!cond) fail(message) }
for (const p of data.products) {
  must(idPattern.test(p.id) && !productIds.has(p.id), `invalid/duplicate product id ${p.id}`);
  productIds.add(p.id);
  must(validCategory.has(p.category), `category invalid for ${p.id}`);
  must(p.name && p.tagline && p.summary && p.story, `missing product copy for ${p.id}`);
  must(Array.isArray(p.occasions) && p.occasions.length >= 2, `missing uses for ${p.id}`);
  must(Array.isArray(p.details) && p.details.length >= 2, `missing disclaimers for ${p.id}`);
  must(/^[a-z0-9-]+\.webp$/.test(p.image) && existsSync(join(imageDir,p.image)), `missing/invalid art ${p.id}`);
}
for (const p of data.products) {
  must(p.related?.every(id => productIds.has(id) && id !== p.id), `unknown related product ${p.id}`);
}
for (const b of data.bundles) {
  must(idPattern.test(b.id) && !bundleIds.has(b.id), `invalid/duplicate edit ${b.id}`);
  bundleIds.add(b.id);
  must(b.name && b.description && b.subtitle && b.label, `missing edit copy ${b.id}`);
  must(b.products.length >= 2 && new Set(b.products).size === b.products.length, `edit needs unique products ${b.id}`);
  must(b.products.every(id=>productIds.has(id)), `invalid edit composition ${b.id}`);
}

const productCard = (p,i) => `
          <article class="product-card" data-category="${esc(p.category)}" data-product="${esc(p.id)}">
            <a class="product-photo product-photo-link" href="${productLink(p)}" aria-label="View ${esc(p.name)} details"><span class="concept-tag">ILLUSTRATIVE CONCEPT</span><img src="/assets/${esc(p.image)}" loading="lazy" width="800" height="800" alt="Illustrative Tayyib Halal packaging concept: ${esc(p.name)}"></a>
            <button class="product-save" type="button" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}" aria-pressed="false">♡</button>
            <div class="product-meta"><span>${String(i+1).padStart(2,'0')} / ${esc(p.categoryLabel.toUpperCase())}</span><span aria-hidden="true">↗</span></div>
            <h3><a href="${productLink(p)}">${esc(p.name)}</a></h3><p>${esc(p.summary)}</p>
            <div class="product-actions"><a class="product-more" href="${productLink(p)}">View product <span aria-hidden="true">→</span></a><button class="product-quick" type="button" data-detail="${esc(p.id)}">Quick look</button></div>
          </article>`;

const editCard = (b,i) => `
        <article class="edit-card">
          <a class="edit-cover" href="${bundleLink(b)}" aria-label="Explore ${esc(b.name)}">
            <span class="edit-number">THE TAYYIB EDIT / 0${i+1}</span>
            <div class="edit-composition">${b.products.map((id,j)=>`<img src="/assets/${esc(byId[id].image)}" width="460" height="460" loading="lazy" alt="${esc(byId[id].name)} concept" class="edit-product edit-pos-${j}">`).join('')}</div>
            <span class="edit-overlay">EXPLORE THE EDIT ↗</span>
          </a><span class="edit-label">${esc(b.label)}</span><h3><a href="${bundleLink(b)}">${esc(b.name)}</a></h3><p>${esc(b.description)}</p>
        </article>`;

const editsSection = `
    <section class="curated section-space" id="edits" aria-labelledby="edits-title">
      <div class="container"><div class="section-heading"><div><div class="eyebrow dark">✦ &nbsp; CURATED WITH INTENTION</div><h2 id="edits-title">The art of <em>coming together.</em></h2><p>Not-for-sale selections that imagine how Tayyib products could complement each other. No bundle prices or stock are confirmed.</p></div><span class="collection-note">02 — CURATED EDITS<br><small>PRODUCT PAIRINGS</small></span></div>
        <div class="edits-grid">${data.bundles.map(editCard).join('\n')}</div>
      </div>
    </section>`;

function inject(markup, token, replacement){
  const start = `<!-- GENERATED ${token} START -->`;
  const end = `<!-- GENERATED ${token} END -->`;
  must(markup.includes(start) && markup.includes(end), `home markers missing: ${token}`);
  return markup.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}${replacement}\n        ${end}`);
}
writeFileSync(join(publicPath,'catalog-data.js'),`window.TAYYIB_CATALOG = ${JSON.stringify(data).replaceAll('<','\\u003c')};\n`);
let home = readFileSync(homePath,'utf8');
home = inject(home,'CATALOGUE',data.products.map(productCard).join('\n'));
home = inject(home,'EDITS',editsSection);
writeFileSync(homePath,home);

const logo = `<a href="/" class="logo" aria-label="Tayyib Halal home"><span class="logo-mark" aria-hidden="true"><span>طَيِّب</span></span><span class="logo-wordmark"><strong>TAYYIB <span>✦</span> HALAL</strong><small>EAT CLEAN. LIVE WELL.</small></span></a>`;
const sharedHeader = `<div class="announcement"><span aria-hidden="true">✦</span> A NEW CHAPTER IN HALAL LIVING IS COMING TO JAMAICA <span aria-hidden="true">✦</span></div><header class="site-header"><div class="container nav-shell">${logo}<nav class="desktop-nav" aria-label="Main navigation"><a href="/#collection">Collection</a><a href="/#edits">Curated edits</a><a href="/#recipes">The table</a><a href="/#halal-guide">Halal living</a></nav><a class="nav-cta" href="/#join">Launch updates ↗</a></div><nav class="detail-mobile-links" aria-label="Browse Tayyib Halal"><a href="/#collection">Products</a><a href="/#edits">Edits</a><a href="/#recipes">Recipes</a><a href="/#halal-guide">Halal living</a></nav></header>`;
const sharedFooter = `<footer class="site-footer"><div class="container footer-main"><div class="footer-brand">${logo}<p>A new home for good food, good company and intentional living—starting in Jamaica.</p></div><div class="footer-links"><div><strong>Explore</strong><a href="/#collection">The collection</a><a href="/#edits">Curated edits</a><a href="/#recipes">Recipes</a></div><div><strong>Information</strong><a href="/#questions">FAQs</a><a href="/privacy.html">Privacy</a><a href="/#join">Launch updates</a></div></div></div><div class="container footer-bottom"><span>© 2026 Tayyib Halal. A brand taking shape.</span><span>Illustrative catalogue · Jamaica</span></div></footer>`;
function frame(title, description, body){
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#103c2e"><meta name="robots" content="noindex,follow"><meta name="description" content="${esc(description)}"><title>${esc(title)} | Tayyib Halal</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/catalog.css"></head><body><a class="skip-link" href="#main">Skip to content</a>${sharedHeader}<main id="main">${body}</main>${sharedFooter}</body></html>`;
}
const relatedCard = p => `<a class="detail-related-item" href="${productLink(p)}"><img src="/assets/${esc(p.image)}" loading="lazy" width="460" height="460" alt="${esc(p.name)} packaging concept"><strong>${esc(p.name)}</strong><span>Explore product →</span></a>`;
function productPage(p) {
 const body=`<div class="container breadcrumb"><a href="/">Home</a><span> / </span><a href="/#collection">The collection</a><span> / </span><strong>${esc(p.name)}</strong></div>
 <section class="container detail-hero"><div class="detail-art"><span class="concept-tag">ILLUSTRATIVE PACKAGING · NOT FOR SALE</span><img src="/assets/${esc(p.image)}" alt="Illustrative branded package for ${esc(p.name)}" width="900" height="900"></div>
 <div class="detail-copy"><span class="eyebrow dark">✦ &nbsp; ${esc(p.line.toUpperCase())}</span><h1>${esc(p.name)}</h1><p class="detail-tagline">${esc(p.tagline)}</p><p>${esc(p.summary)}</p><div class="detail-divider"></div><span class="detail-state">PRODUCT DEVELOPMENT CONCEPT</span><p class="detail-note">This is a visual concept, not a purchasable product. The packaging art may contain unverified illustrative claims; it is not final food labeling or proof of halal certification.</p><a class="button button-green" href="/#join">Follow launch updates ↗</a><a class="text-link" href="/#collection">Back to the collection →</a></div></section>
 <section class="detail-story"><div class="container detail-columns"><div><span class="eyebrow dark">THE TAYYIB STORY</span><h2>Made for good moments.</h2><p>${esc(p.story)}</p><p class="detail-caption">Imagined for the table, with every commercial specification subject to supplier and quality verification.</p></div><div class="detail-usage"><span class="eyebrow dark">AT YOUR TABLE</span><h3>Ways to enjoy</h3><ul>${p.occasions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><strong>From the table:</strong> ${esc(p.recipe)}</p></div></div></section>
 <section class="detail-trust container"><span class="eyebrow dark">WHAT WE STILL NEED TO VERIFY</span><h2>Good food deserves clarity.</h2><ul>${p.details.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>Final sourcing, food safety, ingredient and halal documentation must be verified before any sales or certification claims are published.</p></section>
 <section class="detail-related container"><div class="section-heading"><div><span class="eyebrow dark">KEEP EXPLORING</span><h2>Made to go <em>together.</em></h2></div></div><div class="detail-related-grid">${p.related.map(id=>relatedCard(byId[id])).join('')}</div></section>`;
 return frame(p.name,p.summary,body);
}
function bundlePage(b){
 const items=b.products.map(id=>byId[id]);
 const body=`<div class="container breadcrumb"><a href="/">Home</a><span> / </span><a href="/#edits">Curated edits</a><span> / </span><strong>${esc(b.name)}</strong></div><section class="container bundle-hero"><div><span class="eyebrow dark">✦ &nbsp; ${esc(b.label)}</span><h1>${esc(b.name)}</h1><p class="detail-tagline">${esc(b.subtitle)}</p><p>${esc(b.description)}</p><p class="detail-note">A collection concept only. The individual products are not available for purchase, and this selection is not an orderable or priced bundle.</p><a href="/#join" class="button button-green">Follow launch updates ↗</a></div><div class="bundle-art">${items.map((p,i)=>`<img class="bundle-image bundle-image-${i}" src="/assets/${esc(p.image)}" alt="${esc(p.name)} illustrative package" width="600" height="600">`).join('')}</div></section><section class="container detail-related"><div class="section-heading"><div><span class="eyebrow dark">IN THIS EDIT</span><h2>Considered <em>pairings.</em></h2></div></div><div class="detail-related-grid">${items.map(relatedCard).join('')}</div><a href="/#edits" class="text-link">Explore all curated edits →</a></section>`;
 return frame(b.name,b.description,body);
}
const productsDir = join(publicPath,'products');
const bundlesDir = join(publicPath,'collections');
rmSync(productsDir,{recursive:true,force:true});
rmSync(bundlesDir,{recursive:true,force:true});
for(const p of data.products){const path=join(productsDir,p.id);mkdirSync(path,{recursive:true});writeFileSync(join(path,'index.html'),productPage(p));}
for(const b of data.bundles){const path=join(bundlesDir,b.id);mkdirSync(path,{recursive:true});writeFileSync(join(path,'index.html'),bundlePage(b));}
console.log(`Built ${data.products.length} products and ${data.bundles.length} curated edits`);
