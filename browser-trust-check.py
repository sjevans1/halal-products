"""Private trust console visual/interaction simulation. No real Cloudflare Access or D1."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).parent
html=(root/'public/operator/trust/index.html').read_text()
for path in ['operator/operator.css','operator/trust/trust.css']:
    html=html.replace(f'<link rel="stylesheet" href="/{path}">','<style>'+(root/'public'/path).read_text()+'</style>')
js=(root/'public/operator/trust/trust.js').read_text()
html=html.replace('<script src="/operator/trust/trust.js" defer></script>','')
api_mock='''<script>
 const TODAY=new Date();const future=(days)=>{const d=new Date(TODAY);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
 const testCases=[{id:9,case_ref:'ref-9',subject_key:'product:beef-cubes',display_name:'Premium Beef Cubes',kind:'product',evidence_type:'supplier_origin',claim:'Proposed proof of origin pending independent review',source_url:'https://example.org/evidence',issuer:'',scope:'Only this product and one proposed supplier',review_due:future(60),valid_until:null,status:'pending',effective_status:'pending',submitted_by:'editor@example.org',created_at:'2026-10-15T09:00:00Z',version:1}];
 window.fetch=async (url,opts={})=>{
  const u=new URL(url,'https://tayyib.local');let response;
  if(u.searchParams.get('view')==='history')response={ok:true,items:[{id:14,case_id:9,action:'submitted',actor:'editor@example.org',note:'Evidence filed for review',created_at:'2026-10-15T08:00:00Z'}],nextCursor:null};
  else if(u.searchParams.get('view')==='subjects')response={ok:true,subjects:[{subject_key:'product:beef-cubes',kind:'product',display_name:'Premium Beef Cubes',baseline:'unverified'},{subject_key:'community:central-masjid',kind:'community',display_name:'Central Masjid',baseline:'source-listed-only'}],canVerify:true};
  else if(opts.method==='POST'){
   const body=JSON.parse(opts.body);window._lastAction=body.action;
   if(body.action==='review'){testCases[0].status=body.decision;testCases[0].effective_status=body.decision;testCases[0].version++;}
   response={ok:true,status:body.decision||'pending',publication:'not-published'};
  }else response={ok:true,items:testCases.filter(t=>t.status===(u.searchParams.get('status')||'pending')),nextCursor:null,canVerify:true};
  return new Response(JSON.stringify(response),{status:200,headers:{'content-type':'application/json'}});
 };
 </script>'''
html=html.replace('</body>',api_mock+'<script>'+js+'</script></body>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for label,w,h in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,720)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(200)
  assert not errors,(label,errors)
  assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth'),f'Overflow at {label}'
  assert page.locator('.item').count()==1,label
  assert page.locator('#submit-case').is_enabled()
  assert page.get_by_role('button',name='Accept evidence').is_visible()
  page.screenshot(path=str(root/f'preview-trust-{label}.png'),full_page=True)
  if label=='desktop':
   page.get_by_role('button',name='View audit history').click()
   assert page.locator('#trust-history').is_visible()
   page.locator('#trust-history-entries').get_by_text('Evidence filed for review').wait_for(timeout=3000)
   page.get_by_role('button',name='Close history').click()
   page.get_by_role('button',name='Accept evidence').click()
   assert 'at least 20' in page.locator('#trust-message').inner_text()
   page.locator('.item textarea').fill('Original issuer and scope checked independently for this case')
   page.get_by_role('button',name='Accept evidence').click()
   assert page.locator('#trust-confirm').is_visible()
   page.get_by_role('button',name='Confirm decision').click()
   page.wait_for_timeout(100)
   assert not page.locator('#trust-confirm').is_visible()
   assert page.evaluate('window._lastAction')=='review'
   assert 'No public content changed' in page.locator('#trust-message').inner_text()
  print(label,'evidence workflow PASS; overflow=False; browser errors=0')
  page.close()
 browser.close()
