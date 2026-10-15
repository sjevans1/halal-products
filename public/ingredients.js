(() => {
 'use strict';
 const $=(s,root=document)=>root.querySelector(s),all=(s,root=document)=>[...root.querySelectorAll(s)];
 const input=$('#ingredient-query'),count=$('#ingredient-count'),empty=$('#ingredient-empty'),cards=all('.ingredient-card');
 let active='all';
 function apply(){const q=input.value.trim().toLocaleLowerCase();let shown=0;
  for(const card of cards){const match=(active==='all'||card.dataset.group===active)&&(!q||card.dataset.search.includes(q));card.hidden=!match;if(match)shown++}
  count.textContent=`${shown} of ${cards.length} topics shown`;empty.hidden=shown!==0;
 }
 input.addEventListener('input',apply);
 all('[data-ingredient-filter]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.ingredientFilter;all('[data-ingredient-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));apply()}));
 const checks=all('[data-ingredient-check]');const progress=$('#check-progress');
 checks.forEach(c=>c.addEventListener('change',()=>{progress.textContent=`${checks.filter(x=>x.checked).length} of ${checks.length} questions considered. This is not certification.`}));
 $('#copy-supplier-questions').addEventListener('click',async()=>{
  const questions=(window.TAYYIB_INGREDIENTS?.questions||[]);const text='Tayyib Halal | questions to ask suppliers (not certification)\n'+questions.map((q,i)=>`${i+1}. ${q}`).join('\n');
  try{if(!navigator.clipboard?.writeText)throw Error('Copy unavailable');await navigator.clipboard.writeText(text);$('#copy-message').textContent='Supplier questions copied. Check the issuer and source.'}
  catch{$('#copy-message').textContent='Automatic copying is unavailable. You can review and copy the questions from each topic above.'}
 });
 apply();
})();
