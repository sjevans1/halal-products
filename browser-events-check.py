"""EVENT-01 contained Chromium UX: no live Cloudflare credentials or false organizer data."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent/'public'

def markup():
    html=(ROOT/'events/index.html').read_text().replace('<head>','<head><base href="https://tayyib.local/">',1)
    for name in ['styles.css','hub.css','events-explore.css']:
        html=html.replace(f'<link rel="stylesheet" href="/{name}">',f'<style>{(ROOT/name).read_text()}</style>')
    for name in ['hub-data.js','hub.js','events-explore.js']:
        html=html.replace(f'<script src="/{name}" defer></script>','')
    html=html.replace('</body>',f'<script>{(ROOT/"events-explore.js").read_text()}</script></body>')
    return html

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content(markup(),wait_until='load')
        assert page.get_by_role('heading',name='No approved upcoming events yet.').count()==1
        assert page.locator('#events-controls').count()==0
        assert page.locator('[data-ramadan-step]').count()==4
        assert page.locator('#ramadan-progress').inner_text().startswith('0 of 4')
        page.locator('[data-ramadan-step]').nth(0).check()
        page.locator('[data-ramadan-step]').nth(2).check()
        assert page.locator('#ramadan-progress').inner_text().startswith('2 of 4')
        page.locator('#ramadan-reset').click()
        assert page.locator('#ramadan-progress').inner_text().startswith('0 of 4')
        assert page.locator('#ramadan-reset').is_disabled()
        assert page.locator('a[href="/contribute/?intent=event"]').count() == 1
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), f'{label}: horizontal overflow'
        assert not errors,(label,errors)
        page.screenshot(path=str(Path(__file__).parent/f'preview-events-{label}.png'),full_page=True)
        print(label,'event empty state + Ramadan checklist PASS')
        page.close()
    browser.close()
