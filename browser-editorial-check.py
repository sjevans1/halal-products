"""Local mock-only browser smoke of editorial workflows; NOT Cloudflare acceptance."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
html=(root/'public/operator/editorial/index.html').read_text()
css1=(root/'public/operator/operator.css').read_text()
css2=(root/'public/operator/editorial/editorial.css').read_text()
js=(root/'public/operator/editorial/editorial.js').read_text()
html=html.replace('<link rel="stylesheet" href="/operator/operator.css">',f'<style>{css1}</style>').replace('<link rel="stylesheet" href="/operator/editorial/editorial.css">',f'<style>{css2}</style>')
html=html.replace('<script src="/operator/editorial/editorial.js" defer></script>','')
mock='''<script>window.__editorialActions=[]; window.fetch=async function(url,options){
 const method=options?.method||'GET';
 if(method==='POST'){
  const payload=JSON.parse(options.body);window.__editorialActions.push(payload);
  return new Response(JSON.stringify({ok:true,id:payload.id||31,revision:(payload.revision||0)+1,status:payload.action==='submit'?'submitted':'draft',publication:'not-published'}),{status:200,headers:{'content-type':'application/json'}});
 }
 if(String(url).includes('history='))return new Response(JSON.stringify({ok:true,history:[{revision:1,action:'created',actor:'editor@example.org',note:'Saved private draft',created_at:'2026-10-15'}]}));
 const query=new URL(String(url),'https://tayyib-halal.pages.dev').searchParams;
 const status=query.get('status')||'draft';
 const entry={id:31,kind:'guide',slug:'halal-introduction-guide',title:'Getting started with halal living',summary:'A gentle introduction and source-linked starting point for readers.',body:'This development example is not published; qualified reviewers must approve it before inclusion anywhere in public content.',sourceUrl:'https://example.org/guide',parish:'',eventDate:'',status,createdBy:'editor@example.org',revision:2,updatedAt:'2026-10-15'};
 return new Response(JSON.stringify({ok:true,items:[entry],nextCursor:null,canReview:true,publication:'manual-source-review-only'}),{headers:{'content-type':'application/json'}});
};</script>'''
html=html.replace('</body>',mock+'<script>'+js+'</script></body>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,w,h in [('desktop',1440,900),('tablet',768,950),('mobile',390,844),('small',320,720)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(150)
  assert not errors,errors
  assert page.locator('.editorial-entry').count()==1
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),f'{name}: horizontal scroll'
  page.screenshot(path=str(root/f'preview-editorial-{name}.png'),full_page=True)
  page.get_by_role('button',name='Submit for review').click()
  assert page.locator('#editorial-confirm').is_visible()
  page.get_by_role('button',name='Cancel').click()
  page.wait_for_timeout(50)
  assert page.evaluate('window.__editorialActions.length')==0,'Cancel changed proposal'
  page.get_by_role('button',name='For review',exact=True).click()
  page.wait_for_timeout(130)
  page.get_by_role('button',name='Accept internally').click()
  assert 'at least 20 characters' in page.locator('#editorial-status').inner_text()
  page.locator('.review-note textarea').fill('Original primary source needs reviewer confirmation, internal only')
  page.get_by_role('button',name='Accept internally').click()
  assert page.locator('#editorial-confirm').is_visible()
  page.locator('#editorial-confirm button[value="confirm"]').click()
  page.wait_for_timeout(190)
  assert page.evaluate('window.__editorialActions.some(a=>a.action==="review")')
  assert not errors,errors
  print(name,'EDITORIAL UI PASS')
  page.close()
 browser.close()
