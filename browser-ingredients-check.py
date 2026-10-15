"""Local multi-viewport guide smoke, no network or live Cloudflare deployment."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
html=(root/'public/learn/ingredients/index.html').read_text()
for sheet in ['styles.css','ingredients.css']:
    html=html.replace(f'<link rel="stylesheet" href="/{sheet}">','<style>'+(root/'public'/sheet).read_text()+'</style>')
for script in ['ingredients-data.js','ingredients.js']:
    html=html.replace(f'<script src="/{script}" defer></script>','')
html=html.replace('</body>', ''.join('<script>'+(root/'public'/script).read_text()+'</script>' for script in ['ingredients-data.js','ingredients.js'])+'</body>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for label,w,h in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,720)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(80)
  assert not errors,(label,errors)
  assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth'),f'horizontal overflow: {label}'
  assert page.locator('.ingredient-card:visible').count()==14
  page.screenshot(path=str(root/f'preview-ingredients-{label}.png'),full_page=True)
  page.locator('#ingredient-query').fill('gelatin')
  assert page.locator('.ingredient-card:visible').count()==1
  page.locator('#ingredient-query').fill('no matching label xyz')
  assert page.locator('#ingredient-empty').is_visible()
  page.locator('#ingredient-query').fill('')
  page.get_by_role('button',name='Animal sources').click()
  assert page.locator('.ingredient-card:visible').count()==4
  page.get_by_role('button',name='All topics').click()
  page.locator('[data-ingredient-check]').first.check()
  assert '1 of 5' in page.locator('#check-progress').inner_text()
  page.locator('.ingredient-card details').first.locator('summary').click()
  assert page.locator('.ingredient-card details').first.get_attribute('open') is not None
  assert not errors,(label,errors)
  print(label,'ingredient guide PASS')
  page.close()
 browser.close()
