/** Explicit, mobile-first proposal UX; no client-side authorization decisions. */
(()=>{
'use strict';
const $=s=>document.querySelector(s), data=window.TAYYIB_HUB;
const status=$('#steward-status'),list=$('#steward-assignments'),panel=$('#propose-panel'),form=$('#proposal-form'),dialog=$('#proposal-confirm');
let grants=[],selected=null,sending=false;
function note(el,message){el.textContent=message}
function choice(grant){
 selected=grant;panel.hidden=false;
 $('#proposal-url').value='';$('#proposal-note').value='';note($('#proposal-status'),`Preparing update for ${label(grant.listing_id)}. Nothing is published automatically.`);
 panel.scrollIntoView({block:'start',behavior:'instant'});$('#proposal-url').focus();
}
function label(id){return data?.listings?.find(x=>x.id===id)?.name||id}
function render(){list.replaceChildren();if(!grants.length){const p=document.createElement('p');p.textContent='No active assignments are available. If you represent a local organization, start with a public-source contribution and wait for an independent review.';list.append(p);return;}
 for(const g of grants){const row=document.createElement('div');row.className='portal-assignment';const info=document.createElement('div'),k=document.createElement('small'),h=document.createElement('h3'),p=document.createElement('p');k.textContent='SOURCE-LISTED COMMUNITY PLACE';h.textContent=label(g.listing_id);p.textContent=`Assignment expires ${g.expires_at}. Changes still require independent review.`;const link=document.createElement('a');link.href=`/places/${encodeURIComponent(g.listing_id)}/`;link.textContent='View current source-listed page ↗';info.append(k,h,p,link);const button=document.createElement('button');button.type='button';button.textContent='Suggest an update ↗';button.addEventListener('click',()=>choice(g));row.append(info,button);list.append(row);}
}
async function load(){try{const response=await fetch('/api/steward/proposals',{cache:'no-store'});if(!response.ok)throw Error(response.status===503?'Representative access is not activated yet.':'Assignments are unavailable or access was denied.');const d=await response.json();grants=Array.isArray(d.grants)?d.grants:[];note(status,grants.length?`${grants.length} assigned listing${grants.length===1?'':'s'}. Only authorized proposals are accepted.`:'No active stewardship permissions found.');render();}catch(e){grants=[];note(status,e.message||'Assignments unavailable.');render();}}
form.addEventListener('submit',e=>{e.preventDefault();if(!selected||sending)return;const url=$('#proposal-url').value.trim(),message=$('#proposal-note').value.trim();try{const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.includes('.')||u.username||u.password)throw Error('bad');}catch{note($('#proposal-status'),'Please provide a public HTTPS source.');return;}if(message.length<30){note($('#proposal-status'),'Please explain the proposed change in at least 30 characters.');return;}dialog.showModal();});
$('#proposal-cancel').addEventListener('click',()=>dialog.close());
$('#proposal-confirm-send').addEventListener('click',async()=>{if(sending||!selected)return;sending=true;$('#proposal-confirm-send').disabled=true;$('#proposal-submit').disabled=true;dialog.close();note($('#proposal-status'),'Submitting for review…');
 try{const r=await fetch('/api/steward/proposals',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({grantId:selected.id,sourceUrl:$('#proposal-url').value.trim(),note:$('#proposal-note').value.trim()})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Submission failed.');note($('#proposal-status'),'Your proposed update is pending staff review. The public listing has not changed.');form.reset();}catch(e){note($('#proposal-status'),e.message||'Unable to send. Nothing was published.');}finally{sending=false;$('#proposal-confirm-send').disabled=false;$('#proposal-submit').disabled=false;}
});
load();
})();
