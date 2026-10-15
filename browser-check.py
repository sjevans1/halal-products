"""In-browser UI and generated-page verification without outside network access."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).parent
css=(root/'public/styles.css').read_text()+'\n'+(root/'public/catalog.css').read_text()
app=(root/'public/app.js').read_text()
data=(root/'public/catalog-data.js').read_text()

def markup(path, with_app=False):
    html=path.read_text()
    html=html.replace('<head>','<head><base href="https://tayyib.local/">',1)
    html=html.replace('<link rel="stylesheet" href="/styles.css">',f'<style>{css}</style>')
    html=html.replace('<link rel="stylesheet" href="/catalog.css">','')
    if with_app:
        html=html.replace('<script src="/catalog-data.js" defer></script>','')
        html=html.replace('<script src="/app.js" defer></script>','')
        html=html.replace('</body>',f'<script>{data}</script><script>{app}</script></body>')
    return html

def intercept(route):
    path=route.request.url.split('tayyib.local',1)[-1].split('?',1)[0]
    if path.startswith('/assets/'):
        file=(root/'public'/path.lstrip('/')).resolve()
        if file.is_file() and (root/'public/assets').resolve() in file.parents:
            kind='image/webp' if file.suffix=='.webp' else 'image/svg+xml'
            return route.fulfill(status=200,body=file.read_bytes(),content_type=kind)
    if path=='/api/config':
        return route.fulfill(status=200,body='{"enabled":false,"turnstileSiteKey":null}',content_type='application/json')
    return route.fulfill(status=404,body='Not found')

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,760)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.route('https://tayyib.local/**',intercept)
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(markup(root/'public/index.html',with_app=True),wait_until='load')
        page.evaluate("() => document.querySelectorAll('img').forEach(i => {if (i.id !== 'modal-product-image') i.loading='eager'})")
        page.wait_for_function("() => [...document.querySelectorAll('img')].filter(i => i.id !== 'modal-product-image').every(i => i.complete && i.naturalWidth>0)", timeout=12000)
        page.screenshot(path=str(root/f'preview-{label}.png'),full_page=True)
        loaded=page.evaluate("() => [...document.querySelectorAll('img')].filter(i=>i.id!=='modal-product-image').every(i=>i.complete && i.naturalWidth>0)")
        assert loaded,f'{label}: broken image'
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'{label}: overflow'
        assert not errors,(label,errors)
        assert page.locator('.product-card').count()==5
        assert page.locator('.edit-card').count()==3
        print(label,'PASS',page.locator('img').count(),'images loaded')
        if label=='desktop':
            page.get_by_role('button',name='Pantry & spice').click()
            assert page.locator('.product-card:visible').count()==2
            page.get_by_role('button',name='All products').click()
            page.locator('button[data-save="spice"]').click()
            assert page.locator('.saved-count').inner_text()=='1'
            page.get_by_role('button',name='Open saved products').click()
            assert page.locator('#saved-dialog').is_visible()
            page.get_by_role('button',name='Close saved products').click()
            page.get_by_role('button',name='Search website').click()
            page.locator('#site-search').fill('sausages')
            assert page.locator('.search-result').count()>=1
            page.get_by_role('button',name='Close search').click()
            page.locator('button[data-detail="ground-beef"]').click()
            assert page.locator('#product-dialog').is_visible()
            assert '/products/ground-beef/' in page.locator('#modal-product-link').get_attribute('href')
            assert page.locator('#modal-product-image').evaluate('(i)=>i.complete && i.naturalWidth>0')
            page.keyboard.press('Escape')
            assert not page.locator('#product-dialog').is_visible()
            page.locator('[data-recipe="curry"]').click()
            assert page.locator('#recipe-dialog').is_visible()
            page.keyboard.press('Escape')
            assert not page.locator('#recipe-dialog').is_visible()
            assert page.get_by_role('button',name='Join the list').is_disabled()
            print('desktop category, save, search, quick view and recipe journeys PASS')
            for rel,heading in [('products/beef-cubes/index.html','Premium Beef Cubes'),('collections/sunday-pot/index.html','The Sunday Pot Edit')]:
                page.set_content(markup(root/'public'/rel),wait_until='load')
                assert page.get_by_role('heading',name=heading,exact=True).is_visible(),heading
                assert page.evaluate('() => [...document.querySelectorAll("img")].every(i=>i.complete && i.naturalWidth>0)'),rel
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),rel
            print('generated product and curated-edit pages PASS')
        if label=='mobile':
            page.get_by_role('button',name='Open menu').click()
            assert page.locator('#mobile-nav').is_visible()
            page.get_by_role('link',name='Learn',exact=True).last.click()
            assert not page.locator('#mobile-nav').is_visible()
            print('mobile menu PASS')
        page.close()
    browser.close()
