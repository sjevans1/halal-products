"""SHOP-01 offline Chromium acceptance. Never accesses the internet or customer data."""
import json,re,base64,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
html=(ROOT/'public/plan/index.html').read_text()
css='\n'.join((ROOT/'public'/p).read_text() for p in ('styles.css','catalog.css','plan.css'))
code=(ROOT/'public/plan.js').read_text()
data=(ROOT/'public/plan-data.js').read_text()
page_markup=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '',html)
page_markup=re.sub(r'<script[^>]+defer></script>','',page_markup)
page_markup=page_markup.replace('</head>',f'<style>{css}</style></head>').replace('</body>',f'<script>{data}</script><script>{code}</script></body>')
with sync_playwright() as p:
 binary=shutil.which('chromium') or shutil.which('google-chrome')
 browser=p.chromium.launch(headless=True,executable_path=binary,args=['--no-sandbox','--disable-dev-shm-usage']) if binary else p.chromium.launch(headless=True,args=['--no-sandbox'])
 for width in (1440,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(page_markup,wait_until='domcontentloaded')
  assert page.locator('.plan-product').count()==5,width
  assert page.locator('#plan-count').inner_text()=='0 of 5 ideas selected'
  assert page.locator('#plan-copy').is_disabled()
  assert page.locator('#plan-clear').is_disabled()
  assert page.locator('text=Not for sale. J$ price').count()==5
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),width
  assert page.locator('.plan-product-photo img').count()==5
  if width in (1440,390):
   # This off-network harness substitutes first-party source images as data URLs.
   # The deployed website continues using its normal /assets/* URLs.
   data_urls={}
   for item in json.loads(data.split('=',1)[1].strip().rstrip(';'))['products']:
    raw=(ROOT/'public/assets'/item['image']).read_bytes()
    data_urls[item['id']]='data:image/webp;base64,'+base64.b64encode(raw).decode()
   page.evaluate('urls => document.querySelectorAll(".plan-product").forEach((row,i)=>{let ids=Object.keys(urls);row.querySelector("img").src=urls[ids[i]];})',data_urls)
   page.wait_for_timeout(350)
   page.evaluate('window.scrollTo(0,0)')
   page.screenshot(path=str(ROOT/f'preview-plan-{width}.png'),full_page=True,animations='disabled')
  page.locator('button[aria-label="Add Premium Beef Cubes concept to idea list"]').click()
  assert page.locator('#plan-count').inner_text()=='1 of 5 ideas selected'
  assert '1 × Premium Beef Cubes' in page.locator('#plan-preview').inner_text()
  page.locator('button[aria-label="Increase Premium Beef Cubes quantity"]').click()
  assert '2 × Premium Beef Cubes' in page.locator('#plan-preview').inner_text()
  for n in range(25):
   plus=page.locator('button[aria-label="Increase Premium Beef Cubes quantity"]')
   if plus.is_disabled():break
   plus.click()
  assert '12 × Premium Beef Cubes' in page.locator('#plan-preview').inner_text()
  assert page.locator('button[aria-label="Increase Premium Beef Cubes quantity"]').is_disabled()
  page.locator('#plan-copy').click()
  assert page.locator('#plan-fallback').is_visible()
  assert 'not an order' in page.locator('#plan-fallback-text').input_value().lower()
  page.on('dialog',lambda dialog:dialog.dismiss())
  page.locator('#plan-clear').click()
  assert '12 × Premium Beef Cubes' in page.locator('#plan-preview').inner_text()
  page.locator('.plan-remove').first.click()
  assert page.locator('#plan-count').inner_text()=='0 of 5 ideas selected'
  assert page.locator('#plan-copy').is_disabled()
  assert not errors,(width,errors)
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),width
  print(f'PASS SHOP-01 Chromium {width}: selection, bounds, clear cancel, clipboard fallback, no overflow/errors')
  page.close()
 browser.close()
