(() => {
  'use strict';
  const catalog = window.TAYYIB_PLAN;
  if (!catalog || !Array.isArray(catalog.products) || catalog.stage !== 'concept-only') return;
  const products = catalog.products;
  const byId = new Map(products.map(p => [p.id, p]));
  const key = 'tayyib.idea-plan.v1';
  const LIMIT = 12;
  const list = document.getElementById('plan-items');
  const preview = document.getElementById('plan-preview');
  const count = document.getElementById('plan-count');
  const status = document.getElementById('plan-status');
  const clear = document.getElementById('plan-clear');
  const copy = document.getElementById('plan-copy');
  const fallback = document.getElementById('plan-fallback');
  const selectText = document.getElementById('plan-fallback-text');
  let plan = [];
  try {
    const persisted = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(persisted)) {
      const seen = new Set();
      for (const r of persisted) {
        if (!r || !byId.has(r.id) || seen.has(r.id) || !Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > LIMIT) continue;
        seen.add(r.id); plan.push({id:r.id,quantity:r.quantity});
      }
    }
  } catch { /* Storage can be unavailable, including private browsing. */ }
  const params = new URLSearchParams(location.search);
  const request = params.get('idea');
  if (request && byId.has(request) && !plan.some(r => r.id === request)) plan.push({id:request,quantity:1});
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(plan)); } catch { /* In-memory fallback. */ }
  }
  function description(row) { return `${row.quantity} × ${byId.get(row.id).name}`; }
  function planText() {
    return ['Tayyib Halal | My idea list',
      'Concepts only. Not an order, quote, reservation or certification.',
      'Prices, weights, availability and halal evidence have not been confirmed.',
      '', ...(plan.length ? plan.map(description) : ['No ideas selected yet.']),
      '', 'Explore Tayyib Halal in your browser.'].join('\n');
  }
  const el = (tag, cls, content) => {const e=document.createElement(tag); if(cls)e.className=cls; if(content!=null)e.textContent=content; return e;};
  function render() {
    const selected = new Set(plan.map(r => r.id));
    list.replaceChildren();
    for (const product of products) {
      const article = el('article','plan-product');
      const link = el('a','plan-product-photo');
      link.href = `/products/${encodeURIComponent(product.id)}/`;
      const img = document.createElement('img');
      img.src = `/assets/${encodeURIComponent(product.image)}`;
      img.alt = `${product.name}, illustrative product packaging`;
      img.loading = 'lazy'; img.width=240; img.height=240;
      link.append(img);
      const info = el('div','plan-product-info');
      info.append(el('span','plan-overline','ILLUSTRATIVE CONCEPT'),el('h3','',product.name));
      const explain = el('p','plan-product-note','Not for sale. J$ price, weight and availability to be confirmed.');
      info.append(explain);
      const controls = el('div','plan-item-controls');
      if (selected.has(product.id)) {
        const row = plan.find(r=>r.id===product.id);
        const dec = el('button','plan-step','−'); dec.type='button'; dec.setAttribute('aria-label',`Decrease ${product.name} quantity`); dec.disabled=row.quantity<=1;
        dec.addEventListener('click',()=>adjust(product.id,-1));
        const qty = el('output','plan-quantity',String(row.quantity));qty.setAttribute('aria-label',`${product.name} planned quantity`);
        const inc = el('button','plan-step','+');inc.type='button';inc.setAttribute('aria-label',`Increase ${product.name} quantity`);inc.disabled=row.quantity>=LIMIT;
        inc.addEventListener('click',()=>adjust(product.id,1));
        const remove=el('button','plan-remove','Remove');remove.type='button';remove.addEventListener('click',()=>{plan=plan.filter(r=>r.id!==product.id);persist();render();status.textContent=`Removed ${product.name} from your ideas.`;});
        controls.append(dec,qty,inc,remove);
      } else {
        const add=el('button','plan-add','Add to my ideas +');add.type='button';add.setAttribute('aria-label',`Add ${product.name} concept to idea list`);
        add.addEventListener('click',()=>{plan.push({id:product.id,quantity:1});persist();render();status.textContent=`Added ${product.name} to your ideas.`;});controls.append(add);
      }
      info.append(controls);article.append(link,info);list.append(article);
    }
    count.textContent=`${plan.length} of ${products.length} ideas selected`;
    preview.replaceChildren();
    if (!plan.length) preview.append(el('p','plan-empty','Your list is empty. Choose an idea to start planning future meals.'));
    else for (const row of plan) preview.append(el('li','',description(row)));
    clear.disabled = copy.disabled = !plan.length;
    fallback.hidden=true;
  }
  function adjust(id,delta){const row=plan.find(r=>r.id===id);if(!row)return;row.quantity=Math.min(LIMIT,Math.max(1,row.quantity+delta));persist();render();status.textContent=`${byId.get(id).name}: ${row.quantity} planned.`;}
  clear.addEventListener('click',()=>{if(!plan.length)return;if(!window.confirm('Clear all your saved Tayyib ideas from this browser?'))return;plan=[];persist();render();status.textContent='Your idea list has been cleared.';});
  copy.addEventListener('click',async()=>{if(!plan.length)return;const text=planText();try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent='Idea list copied. This does not place an order.';}catch{fallback.hidden=false;selectText.value=text;selectText.focus();selectText.select();status.textContent='Clipboard unavailable. Select and copy the list below.';}});
  persist();render();
})();
