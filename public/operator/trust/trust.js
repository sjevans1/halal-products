(() => {
 'use strict';
 const $=(s,root=document)=>root.querySelector(s),all=(s,root=document)=>[...root.querySelectorAll(s)];
 const form=$('#trust-form'),select=$('#subject'),type=$('#evidence-type'),items=$('#trust-items'),message=$('#trust-message'),refresh=$('#refresh-cases'),more=$('#trust-more');
 const types={product:[['halal_certificate','Halal certificate'],['supplier_origin','Supplier origin'],['ingredient_label','Ingredients & allergens'],['food_safety','Food safety']],community:[['listing_accuracy','Listing accuracy'],['community_contact','Community contact']]};
 let status='pending',cursor=null,canVerify=false,loading=false;
 const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n};
 const setMessage=text=>{message.textContent=text};
 async function request(url,opts={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});const json=await r.json().catch(()=>null);if(!r.ok||!json?.ok)throw Error(json?.error||`Request failed (${r.status})`);return json;}
 function setTypes(){type.replaceChildren(new Option('Choose evidence category',''));const kind=select.value.split(':')[0];for(const [id,label] of (types[kind]||[]))type.append(new Option(label,id));}
 async function loadSubjects(){
  try{const d=await request('/api/operator/trust?view=subjects');select.replaceChildren(new Option('Choose an internal subject',''));
   $('#subject-count').textContent=String(d.subjects.length);for(const s of d.subjects){const option=new Option(`${s.display_name} · ${s.baseline}`,s.subject_key);select.append(option)}
   canVerify=Boolean(d.canVerify);$('#submit-case').disabled=false;setTypes();setMessage('Private register available. Public certification is never affected by internal review.');
  }catch(err){select.replaceChildren(new Option('Staff access and database required',''));$('#submit-case').disabled=true;setMessage(err.message+' This tool stays unavailable until operator access is configured.');}
 }
 select.addEventListener('change',setTypes);
 function confirmReview(entry,decision){return new Promise(resolve=>{
  const d=$('#trust-confirm');d.returnValue='';$('#trust-confirm-title').textContent=decision==='disputed'?'Flag a dispute':decision==='accepted'?'Accept evidence for internal record':'Reject evidence';
  $('#trust-confirm-description').textContent=`Confirm ${decision} for ${entry.display_name}? This records an internal-only, audited decision. No public listing, certification claim, product, or event will be changed.`;
  d.addEventListener('close',()=>resolve(d.returnValue==='confirm'),{once:true});d.showModal();
 })}
 function render(entry){
  const card=el('article',undefined,'item');card.append(el('div',`${entry.subject_key} · case #${entry.id}`,'eyebrow'),el('h3',entry.display_name));
  card.append(el('span',entry.evidence_type.replaceAll('_',' '),'tag'),el('span',entry.effective_status==='recheck-required'?'Review due / expired':entry.effective_status,'tag '+(entry.effective_status==='recheck-required'?'due':entry.effective_status)));
  card.append(el('p',entry.claim));
  const link=el('a','View original source ↗','source');link.href=entry.source_url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
  const details=el('div',undefined,'review-details');details.append(el('p',`Scope: ${entry.scope}`),el('p',`Issuer supplied: ${entry.issuer||'Not provided'}`),el('p',`Valid until: ${entry.valid_until||'Not applicable'} · Review due: ${entry.review_due}`),el('p',`Filed: ${entry.created_at} · By: ${entry.submitted_by}`));
  if(entry.reviewed_by)details.append(el('p',`Decision: ${entry.status} · reviewer: ${entry.reviewed_by} · note: ${entry.review_note}`));card.append(details);
  const historyButton=el('button','View audit history ↗','history-open');historyButton.type='button';historyButton.addEventListener('click',()=>loadHistory(entry));card.append(historyButton);
  const decisions=entry.status==='pending'&&canVerify?['accepted','rejected']:entry.status==='accepted'?['disputed']:[];
  if(decisions.length){const actions=el('div',undefined,'actions');const label=el('label','Evidence assessment / reason (20–500 characters)','review-label');const note=el('textarea');note.minLength=20;note.maxLength=500;note.placeholder='Describe what was checked, outstanding concerns, and evidence limitations';label.append(note);actions.append(label);
   for(const decision of decisions){const labelName=decision==='accepted'?'Accept evidence':decision==='rejected'?'Reject evidence':'Flag dispute';const button=el('button',labelName,decision==='accepted'?'approve':decision==='disputed'?'warning':'reject');button.type='button';button.addEventListener('click',async()=>{
     const value=note.value.trim();if(value.length<20){setMessage('A meaningful review note of at least 20 characters is required.');note.focus();return}
     if(!await confirmReview(entry,decision))return;
     all('button',actions).forEach(x=>x.disabled=true);note.disabled=true;
     try{const body={action:decision==='disputed'?'dispute':'review',id:entry.id,version:entry.version,note:value};if(decision!=='disputed')body.decision=decision;
      await request('/api/operator/trust',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});await loadCases(true);setMessage(`Case #${entry.id} recorded as ${decision}. No public content changed.`);
     }catch(err){setMessage(err.message);all('button',actions).forEach(x=>x.disabled=false);note.disabled=false}
   });actions.append(button)}card.append(actions)}
  return card;
 }
 async function loadHistory(entry){
  const dialog=$('#trust-history'),list=$('#trust-history-entries');list.replaceChildren(el('p','Loading source and review history…'));
  $('#trust-history-title').textContent=`Audit history · Case #${entry.id}`;
  dialog.showModal();
  try{
   const events=[];let cursor=null;let pages=0;
   do{
    const result=await request(`/api/operator/trust?view=history&id=${entry.id}${cursor?'&before='+cursor:''}`);
    events.push(...result.items);cursor=result.nextCursor;pages++;
   }while(cursor&&pages<4);
   list.replaceChildren();
   if(!events.length)list.append(el('p','No audit entries. Flag for operator investigation.'));
   for(const e of events){const row=el('div',undefined,'history-entry');row.append(el('strong',`${e.action} · ${e.created_at}`),el('p',`Actor: ${e.actor}`),el('p',e.note));list.append(row)}
   if(cursor)list.append(el('p','Additional older history exists. Contact an administrator for the full audit export.'));
  }catch(err){list.replaceChildren(el('p',`History unavailable: ${err.message}`))}
 }
 $('#history-close').addEventListener('click',()=>$('#trust-history').close());
 async function loadCases(reset=false){if(loading)return;loading=true;refresh.disabled=true;more.disabled=true;
  if(reset){cursor=null;items.replaceChildren()}setMessage(`Loading ${status} evidence cases…`);
  try{const d=await request(`/api/operator/trust?status=${status}${cursor?'&before='+cursor:''}`);canVerify=Boolean(d.canVerify);for(const x of d.items)items.append(render(x));cursor=d.nextCursor;more.hidden=!cursor;
   setMessage(items.children.length?`${items.children.length} ${status} cases displayed; internal review only.`:`No ${status} evidence cases. Nothing is assumed verified.`);
  }catch(err){setMessage(err.message+' Private operator Access is required.');more.hidden=true}
  finally{refresh.disabled=false;more.disabled=false;loading=false}
 }
 form.addEventListener('submit',async event=>{event.preventDefault();const values={action:'submit',subjectKey:select.value,evidenceType:type.value,claim:$('#claim').value,sourceUrl:$('#evidence-url').value,scope:$('#scope').value,issuer:$('#issuer').value,validFrom:$('#valid-from').value||null,validUntil:$('#valid-until').value||null,reviewDue:$('#review-due').value};
  const button=$('#submit-case');button.disabled=true;
  try{await request('/api/operator/trust',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(values)});form.reset();setTypes();status='pending';all('[data-trust-status]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.trustStatus===status)));await loadCases(true);setMessage('Evidence submitted for a different, authorized reviewer. Not published.');}
  catch(err){setMessage(err.message);setTimeout(()=>message.scrollIntoView({block:'nearest',behavior:'auto'}),0)}finally{button.disabled=false}
 });
 all('[data-trust-status]').forEach(b=>b.addEventListener('click',()=>{status=b.dataset.trustStatus;all('[data-trust-status]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));loadCases(true)}));
 refresh.addEventListener('click',()=>loadCases(true));more.addEventListener('click',()=>loadCases());
 loadSubjects().then(()=>loadCases(true));
})();
