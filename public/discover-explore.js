/* DISC-01. Local, transparent directory exploration without accounts, tracking or geolocation. */
(() => {
  'use strict';
  const root=document.querySelector('#directory');
  if(!root || !window.TAYYIB_HUB || !Array.isArray(window.TAYYIB_HUB.listings)) return;
  const query=root.querySelector('#directory-query');
  const parish=root.querySelector('#directory-parish');
  const kind=root.querySelector('#directory-kind');
  const count=root.querySelector('#directory-count');
  const status=root.querySelector('#discover-share-status');
  const reset=root.querySelector('#discover-reset');
  const share=root.querySelector('#discover-share');
  const buttons=[...root.querySelectorAll('[data-parish-choice]')];
  if(!query || !parish || !kind || !count || !status || !reset || !share || buttons.length===0) return;

  const knownParishes=new Set([...parish.options].map(o=>o.value));
  const knownKinds=new Set([...kind.options].map(o=>o.value));
  const params=new URLSearchParams(window.location.search);
  const initialQuery=params.get('q');
  if(initialQuery && initialQuery.length<=80) query.value=initialQuery;
  if(params.get('parish') && !knownParishes.has(params.get('parish'))) parish.value='all';
  if(params.get('kind') && !knownKinds.has(params.get('kind'))) kind.value='all';

  const sync=()=>{
    for(const button of buttons) button.setAttribute('aria-pressed',String(button.dataset.parishChoice===parish.value));
    reset.hidden=!(query.value.trim() || parish.value!=='all' || kind.value!=='all');
    const current=new URL(window.location.href);
    // These are local navigation state, not transmitted to a server by the application.
    for(const key of ['q','parish','kind'])current.searchParams.delete(key);
    if(query.value.trim())current.searchParams.set('q',query.value.trim().slice(0,80));
    if(parish.value!=='all')current.searchParams.set('parish',parish.value);
    if(kind.value!=='all')current.searchParams.set('kind',kind.value);
    const next=current.pathname+current.search+current.hash;
    if(next!==window.location.pathname+window.location.search+window.location.hash){
      try{window.history.replaceState(null,'',next)}catch{/* Opaque local preview origin: filters still work without shareable URL sync. */}
    }
    status.textContent='';
  };
  if(query.value)query.dispatchEvent(new Event('input',{bubbles:true}));
  buttons.forEach(button=>button.addEventListener('click',()=>{
    parish.value=button.dataset.parishChoice;
    parish.dispatchEvent(new Event('change',{bubbles:true}));
    count.focus({preventScroll:true});
  }));
  for(const control of [query,parish,kind])control.addEventListener(control===query?'input':'change',sync);
  reset.addEventListener('click',()=>{
    query.value=''; parish.value='all'; kind.value='all';
    query.dispatchEvent(new Event('input',{bubbles:true}));
    parish.dispatchEvent(new Event('change',{bubbles:true}));
    kind.dispatchEvent(new Event('change',{bubbles:true}));
    query.focus();
  });
  share.addEventListener('click',async()=>{
    const value=window.location.href;
    try{
      if(!navigator.clipboard || !navigator.clipboard.writeText)throw Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      status.textContent='Link copied. It will open with your current filters.';
    }catch{
      status.textContent='Copy the link below to share these results.';
      let fallback=root.querySelector('#discover-share-fallback');
      if(!fallback){fallback=document.createElement('input');fallback.id='discover-share-fallback';fallback.className='discover-share-fallback';fallback.type='text';fallback.readOnly=true;fallback.setAttribute('aria-label','Shareable search link');status.after(fallback);}
      fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();
    }
  });
  sync();
})();
