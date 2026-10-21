/* Events are sourced and rendered at build time. This only filters visible, approved cards.
 * No analytics, location access, accounts, religious profiling or network calls. */
(() => {
  'use strict';
  const list=document.getElementById('event-list');
  const count=document.getElementById('events-count');
  const controls=document.getElementById('events-controls');
  const noMatch=document.getElementById('events-no-match');
  if(list && controls && count){
    const cards=[...list.querySelectorAll('[data-event-id]')];
    const parish=document.getElementById('events-parish');
    const kind=document.getElementById('events-kind');
    const reset=document.getElementById('events-reset');
    const render=()=>{
      let matched=0, upcoming=0;
      const now=Date.now();
      for(const card of cards){
        const time=Date.parse(card.dataset.endsAt||'');
        const valid=Number.isFinite(time)&&time>now;
        if(valid)upcoming++;
        const visible=valid&&(parish.value==='all'||card.dataset.parish===parish.value)&&(kind.value==='all'||card.dataset.kind===kind.value);
        card.hidden=!visible;
        if(visible)matched++;
      }
      count.textContent=`${matched} of ${upcoming} upcoming organizer-sourced events`;
      noMatch.hidden=matched!==0;
      if(reset)reset.disabled=parish.value==='all'&&kind.value==='all';
    };
    parish.addEventListener('change',render);kind.addEventListener('change',render);
    reset?.addEventListener('click',()=>{parish.value='all';kind.value='all';render();parish.focus();});
    render();
  }
  const steps=[...document.querySelectorAll('[data-ramadan-step]')];
  const progress=document.getElementById('ramadan-progress');
  const reset=document.getElementById('ramadan-reset');
  if(steps.length && progress){
    const update=()=>{const done=steps.filter(x=>x.checked).length;progress.textContent=`${done} of ${steps.length} preparation ideas considered`;reset.disabled=done===0;};
    steps.forEach(step=>step.addEventListener('change',update));
    reset?.addEventListener('click',()=>{steps.forEach(x=>x.checked=false);update();steps[0].focus();});
    update();
  }
})();
