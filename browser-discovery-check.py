"""DISC-01 contained Chromium acceptance: real DOM interactions, stubbed History API.
The execution environment blocks navigation to local test hostnames. URL navigation
is structurally tested separately; the visible filter experience is exercised here.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent/'public'
markup=(root/'discover/index.html').read_text()
for name in ['styles.css','hub.css','discover-explore.css']:
    markup=markup.replace(f'<link rel="stylesheet" href="/{name}">',f'<style>{(root/name).read_text()}</style>')
for name in ['hub-data.js','hub.js','discover-explore.js']:
    markup=markup.replace(f'<script src="/{name}" defer></script>','')
markup=markup.replace('<head>','<head><base href="https://tayyib.local/">',1)
# CSS/image references can still be intercepted; no actual requests for these tests.
script="""<script>window.__currentUrl='';window.history.replaceState=(s,t,url)=>{window.__currentUrl=url};</script>"""
markup=markup.replace('</body>',script+''.join(f'<script>{(root/name).read_text()}</script>' for name in ['hub-data.js','hub.js','discover-explore.js'])+'</body>')
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(1440,900),(768,1024),(390,844),(320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(markup,wait_until='load')
        page.locator('.directory-card').first.wait_for()
        assert page.locator('.directory-card').count()==15
        assert page.locator('.discover-parish').count()>=8
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'overflow {width}'
        page.locator('[data-parish-choice="Kingston"]').click()
        assert page.locator('#directory-parish').input_value()=='Kingston'
        assert page.locator('.directory-card').count()==3
        assert 'parish=Kingston' in page.evaluate('window.__currentUrl')
        assert page.locator('[data-parish-choice="Kingston"]').get_attribute('aria-pressed')=='true'
        page.locator('#directory-kind').select_option('organization')
        assert page.locator('.directory-card').count()==1
        assert 'kind=organization' in page.evaluate('window.__currentUrl')
        page.locator('#directory-query').fill('nonexistent-jamaica-site')
        assert page.locator('#directory-empty').is_visible()
        page.locator('#discover-reset').click()
        assert page.locator('.directory-card').count()==15
        assert page.locator('#directory-parish').input_value()=='all'
        assert page.locator('#directory-kind').input_value()=='all'
        assert page.locator('#discover-reset').is_hidden()
        page.locator('#directory-kind').select_option('food')
        assert page.locator('#directory-empty').is_visible()
        assert page.locator('.discover-zero').is_visible()
        page.locator('#discover-share').click()
        assert page.locator('#discover-share-status').inner_text() or page.locator('#discover-share-fallback').count()
        assert not errors,errors
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'overflow {width}'
        page.screenshot(path=str(root.parent/f'preview-discovery-{width}.png'),full_page=True)
        print(f'{width}px PASS: parish chips, filtered results, clear, share, honest empty state, no overflow')
        page.close()
    browser.close()
