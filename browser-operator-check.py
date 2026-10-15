"""Operator UI smoke. API results are mocked; never claims real Cloudflare Access/D1 acceptance."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).parent
html=(root/'public/operator/index.html').read_text()
css=(root/'public/operator/operator.css').read_text()
js=(root/'public/operator/operator.js').read_text()
html=html.replace('<link rel="stylesheet" href="/operator/operator.css">','<style>'+css+'</style>')
html=html.replace('<script src="/operator/operator.js" defer></script>','')
html=html.replace('</body>','<script>'+js+'</script></body>')

with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for label,width,height in [('desktop',1440,900),('mobile',390,844),('small',320,720)]:
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    mock="""<script>window.fetch=async function(url,opts){const data=opts?.method==='POST'?{ok:true,decision:'approved',publication:'not-published'}:{ok:true,items:[{id:12,kind:'listing',title:'Suggested restaurant listing',source_url:'https://example.org/listing',note:'Suggested by a visitor, source should be confirmed directly.',review_status:'pending',created_at:'2026-10-15T07:00:00Z'}],nextCursor:null,publication:'never-automatic'};return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}})}</script>"""
    page.set_content(html.replace('<script>'+js+'</script>',mock+'<script>'+js+'</script>'),wait_until='load')
    page.wait_for_timeout(170)
    assert not errors,errors
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),label
    assert page.locator('.item').count()==1
    assert page.get_by_role('button',name='Mark reviewed').is_visible()
    assert page.get_by_role('button',name='Reject submission').is_visible()
    page.screenshot(path=str(root/f'preview-operator-{label}.png'),full_page=True)
    page.get_by_role('button',name='Mark reviewed').click()
    assert 'at least 10 characters' in page.locator('#status').inner_text()
    page.locator('textarea').fill('Original source checked: further review required')
    page.get_by_role('button',name='Mark reviewed').click()
    assert page.locator('#review-confirm').is_visible()
    page.locator('#confirm-action').click()
    page.wait_for_timeout(80)
    assert not errors,errors
    print(label,'operator review UI PASS')
    page.close()
  browser.close()
