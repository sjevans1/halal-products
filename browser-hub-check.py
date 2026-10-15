"""Local DOM browser journeys without network access or real Cloudflare."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent/'public';host='https://tayyib.local'

def page_markup(route):
    file=root/'index.html' if route=='/' else root/route.lstrip('/')/'index.html'
    s=file.read_text().replace('<head>','<head><base href="https://tayyib.local/">',1)
    for sheet in ['styles.css','catalog.css','hub.css']:
        s=s.replace(f'<link rel="stylesheet" href="/{sheet}">',f'<style>{(root/sheet).read_text()}</style>')
    for js in ['catalog-data.js','app.js','hub-data.js','hub.js']:
        s=s.replace(f'<script src="/{js}" defer></script>','')
    scripts=['catalog-data.js','app.js'] if route=='/' else ['hub-data.js','hub.js']
    s=s.replace('</body>', ''.join(f'<script>{(root/name).read_text()}</script>' for name in scripts)+'</body>')
    return s

def intercept(route):
    path=route.request.url.split('tayyib.local',1)[-1].split('?',1)[0]
    if path.startswith('/api/'):
        route.fulfill(status=503,body='{"enabled":false,"turnstileSiteKey":null}',content_type='application/json');return
    target=(root/path.lstrip('/')).resolve()
    if target.is_file() and root.resolve() in target.parents:
        content_type={'webp':'image/webp','svg':'image/svg+xml','js':'text/javascript'}.get(target.suffix.lstrip('.'),'text/plain')
        route.fulfill(status=200,body=target.read_bytes(),content_type=content_type);return
    route.fulfill(status=404,body='Not found')

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.route(f'{host}/**',intercept)
        errors=[];bad=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.on('response',lambda resp:bad.append((resp.status,resp.url)) if resp.status>=400 and '/api/' not in resp.url else None)
        for path in ['/','/discover/','/community/','/learn/','/kitchen/','/events/','/partners/']:
            page.set_content(page_markup(path),wait_until='load')
            page.wait_for_timeout(120)
            assert page.get_by_role('main').count()==1,path
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'{label} overflow at {path}'
            assert not errors,(label,path,errors)
            assert not bad,(label,path,bad)
            if path=='/discover/':
                assert page.locator('.directory-card').count()==15
                page.locator('#directory-query').fill('Kingston')
                assert 1<=page.locator('.directory-card').count()<15
                page.locator('#directory-query').fill('zzzxnonexistent')
                assert page.locator('#directory-empty').is_visible()
                page.locator('#directory-query').fill('')
                page.locator('#directory-kind').select_option('organization')
                assert page.locator('.directory-card').count()==2
                page.locator('#directory-kind').select_option('all')
                page.evaluate('''() => {window.TAYYIB_HUB.listings[0].sourceCheckedAt = '2020-01-01';document.querySelector('#directory-query').dispatchEvent(new Event('input',{bubbles:true}));}''')
                assert page.locator('.source-warning').count()>=1, 'Old references need an honest warning'
            if path=='/kitchen/':
                assert page.locator('.hub-recipe').count()==3
                page.locator('[data-recipe-open="curry"]').click()
                assert page.locator('#hub-recipe-dialog').is_visible()
                before=page.locator('#hub-recipe-ingredients').inner_text()
                page.locator('#hub-servings-plus').click()
                assert page.locator('#hub-servings-output').inner_text()=='5'
                assert before!=page.locator('#hub-recipe-ingredients').inner_text()
                page.keyboard.press('Escape')
                assert not page.locator('#hub-recipe-dialog').is_visible()
            if path=='/events/':
                assert page.locator('.events-empty').count()==1
                assert page.locator('a[href="/contribute/?intent=event"]').count() >= 1
        page.set_content(page_markup('/'),wait_until='load')
        page.evaluate('window.scrollTo(0,0)')
        page.wait_for_timeout(250)
        page.screenshot(path=str(root.parent/f'preview-hub-{label}.png'),full_page=True)
        print(f'{label}: all 7 routes PASS; directory, recipe and event controls PASS')
        page.close()
    browser.close()
