(() => {
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const items=$('#items'),message=$('#status'),more=$('#more'),refresh=$('#refresh');
  let current='pending',cursor=null,busy=false;
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el};
  function setStatus(text){message.textContent=text}
  async function load(reset=false){
    if(busy)return;
    busy=true;refresh.disabled=true;more.disabled=true;
    if(reset){cursor=null;items.replaceChildren()}
    setStatus('Loading '+current+' submissions…');
    try{
      const url='/api/operator/suggestions?status='+encodeURIComponent(current)+(cursor?'&before='+cursor:'');
      const response=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw Error(data?.error||'Review queue unavailable');
      for(const entry of data.items)items.append(render(entry));
      cursor=data.nextCursor;more.hidden=!cursor;
      setStatus(items.children.length?`${items.children.length} ${current} submissions displayed. Internal review only.`:`No ${current} submissions found.`);
    }catch(err){setStatus(err.message+' Check Cloudflare Access login and operator configuration.');more.hidden=true}
    finally{busy=false;refresh.disabled=false;more.disabled=false}
  }
  function confirmDecision(caption,id){
    return new Promise(resolve=>{
      const dialog=$('#review-confirm');dialog.returnValue='';
      $('#review-confirm-title').textContent=caption;
      $('#review-confirm-description').textContent=`Confirm the internal decision for submission #${id}? This does not publish content.`;
      dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});
      dialog.showModal();
    });
  }
  function render(entry){
    const card=node('article',undefined,'item');const meta=node('header');meta.append(node('span',`${entry.kind} · #${entry.id}`),node('span',entry.created_at));
    card.append(meta,node('h3',entry.title),node('p',entry.note||'No additional note provided.'));
    const link=node('a','Open submitted source ↗','source');link.href=entry.source_url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
    if(entry.review_status==='pending'){
      const label=node('label','Review note (minimum 10 characters)');const input=node('textarea');input.maxLength=500;input.placeholder='Evidence checked, action required, or reason for rejection';label.append(input);card.append(label);
      const actions=node('div',undefined,'actions');
      for(const [decision,caption,cls] of [['approved','Mark reviewed','approve'],['rejected','Reject submission','reject']]){
        const button=node('button',caption,cls);button.type='button';button.addEventListener('click',async()=>{
          const note=input.value.trim();if(note.length<10){setStatus('Provide at least 10 characters explaining the review.');input.focus();return}
          if(!await confirmDecision(caption,entry.id))return;
          input.disabled=true;for(const b of actions.querySelectorAll('button'))b.disabled=true;
          setStatus('Saving internal review decision…');
          try{const response=await fetch('/api/operator/suggestions',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({id:entry.id,decision,note})});const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Review save failed');await load(true)}
          catch(err){setStatus(err.message);input.disabled=false;for(const b of actions.querySelectorAll('button'))b.disabled=false}
        });actions.append(button)
      }
      card.append(actions)
    }else{card.append(node('p',`Internal decision: ${entry.review_status}. ${entry.review_note||''}`,'reviewed'))}
    return card;
  }
  document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.status===current)return;
    current=b.dataset.status;document.querySelectorAll('[data-status]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));load(true)
  }));
  refresh.addEventListener('click',()=>load(true));more.addEventListener('click',()=>load());load(true);
})();
