(() => {
  'use strict';
  const data=window.TAYYIB_HUB;
  if(!data||!Array.isArray(data.listings)) return;
  const $=(s,root=document)=>root.querySelector(s);
  const create=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el};
  const directory=$('#directory-results');
  if(directory){
    const query=$('#directory-query'),parish=$('#directory-parish'),kind=$('#directory-kind');
    const params=new URLSearchParams(location.search);if(['mosque','organization','business','food'].includes(params.get('kind')))kind.value=params.get('kind');
    if(data.listings.some(x=>x.parish===params.get('parish')))parish.value=params.get('parish');
    function card(l){
      const el=create('article','directory-card');
      const meta=create('div','directory-meta');
      meta.append(create('span','directory-tag',l.kind==='mosque'?'Mosque':l.kind==='organization'?'Community / certification resource':l.kind));
      meta.append(create('span','directory-tag source-listed','Source listed · not independently checked'));
      // Source dates reflect when a published reference was viewed, not verification of the venue.
      const age=Math.floor((Date.now()-Date.parse(l.sourceCheckedAt+'T00:00:00Z'))/86400000);
      if(Number.isFinite(age)&&age>90){
        const message=age>180?'Older source · confirm directly':'Source recheck suggested';
        meta.append(create('span','directory-tag source-warning',message));
      }
      const title=create('h3','',l.name);const location=create('p','directory-location',l.locality);
      const summary=create('p','',l.summary);const footer=create('footer');
      const a=create('a','', 'View original source ↗');a.href=l.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
      const date=create('span','','Source viewed: '+l.sourceCheckedAt);footer.append(a,date);
      const actions=create('div','directory-actions');const detail=create('a','directory-detail-link','View listing details →');detail.href='/places/'+encodeURIComponent(l.id)+'/';const correction=create('a','directory-correct-link','Suggest an update');correction.href='/contribute/?record='+encodeURIComponent(l.id)+'&intent=correction';actions.append(detail,correction);
      el.append(meta,title,location,summary,footer,actions);return el;
    }
    function render(){
      const q=query.value.trim().toLocaleLowerCase();
      const items=data.listings.filter(x=>(kind.value==='all'||x.kind===kind.value)&&(parish.value==='all'||x.parish===parish.value)&&(!q||[x.name,x.parish,x.locality,x.summary,x.kind].join(' ').toLocaleLowerCase().includes(q)));
      directory.replaceChildren(...items.map(card));
      $('#directory-count').textContent=`${items.length} of ${data.listings.length} source-referenced entries`;
      $('#directory-empty').hidden=items.length!==0;
    }
    for(const field of [query,parish,kind])field.addEventListener(field===query?'input':'change',render);
    render();
  }
  const dialog=$('#hub-recipe-dialog');
  if(dialog){
    let recipe=null,serves=4;
    function amount(ing){const n=ing.quantity*serves/recipe.serves;const val=Number.isInteger(n)?String(n):String(Math.round(n*100)/100);return [val,ing.unit,ing.name].filter(Boolean).join(' ')}
    function ingredients(){const list=$('#hub-recipe-ingredients');list.replaceChildren(...recipe.ingredients.map(ing=>create('li','',amount(ing))));$('#hub-servings-output').value=serves;}
    document.querySelectorAll('[data-recipe-open]').forEach(b=>b.addEventListener('click',()=>{
      recipe=data.recipes.find(x=>x.id===b.dataset.recipeOpen);if(!recipe)return;
      serves=recipe.serves;$('#hub-recipe-title').textContent=recipe.title;$('#hub-recipe-desc').textContent=recipe.summary;
      const img=$('#hub-recipe-image');img.src='/assets/'+recipe.image;img.alt='Prepared '+recipe.title;
      $('#hub-recipe-steps').replaceChildren(...recipe.steps.map(s=>create('li','',s)));
      $('#hub-copy-status').textContent='';ingredients();dialog.showModal();
    }));
    $('#hub-recipe-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    $('#hub-servings-minus').addEventListener('click',()=>{serves=Math.max(1,serves-1);ingredients()});
    $('#hub-servings-plus').addEventListener('click',()=>{serves=Math.min(16,serves+1);ingredients()});
    $('#hub-copy-shopping').addEventListener('click',async()=>{
      const text=`${recipe.title} — shopping list for ${serves}\n${recipe.ingredients.map(ing=>'• '+amount(ing)).join('\n')}`;
      try{await navigator.clipboard.writeText(text);$('#hub-copy-status').textContent='Shopping list copied.'}catch{$('#hub-copy-status').textContent='Copy unavailable in this browser. Select the ingredients above instead.'}
    });
  }
})();
