"""A11Y-01: actual Chromium contrast and keyboard checks of readable, light-surface text.
Emulates the static Pages build without requiring Cloudflare or public network access.
This checks representative computed text pairs; not a substitute for assistive-tech audit.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent/'public'

def html(route):
    file=root/'index.html' if route=='/' else root/route.strip('/')/'index.html'
    text=file.read_text().replace('<head>','<head><base href="https://tayyib.local/">',1)
    for css in root.glob('*.css'):
        text=text.replace(f'<link rel="stylesheet" href="/{css.name}">',f'<style>{css.read_text()}</style>')
    for js in root.glob('*.js'):
        text=text.replace(f'<script src="/{js.name}" defer></script>', '')
    modules=['catalog-data.js','app.js'] if route=='/' else (['hub-data.js','hub.js','discover-explore.js'] if route=='/discover/' else ['hub-data.js','hub.js'] if route=='/learn/' else [])
    text=text.replace('</body>',''.join(f'<script>{(root/m).read_text()}</script>' for m in modules)+'</body>')
    return text

checks={
 '/': ['.eyebrow.dark','.product-card p','.product-meta','.edit-label','.trust-grid small','.footer-bottom','.home-hub-feature .home-hub-label','.home-hub-card:not(.home-hub-feature) .home-hub-label'],
 '/discover/':['.eyebrow.dark','.directory-card p','.directory-card footer span','.directory-count','.footer-bottom'],
 '/learn/':['.eyebrow.dark','.hub-guide-card .guide-chip','.hub-guide-card p','.footer-bottom'],
 '/products/beef-cubes/':['.detail-tagline','.breadcrumb','.eyebrow.dark','.footer-bottom'],
}
# Samples avoid dark gradient mastheads and images, whose rendered backgrounds cannot
# be measured correctly from transparent computed background-color alone.
measure='''sel => {
 const e=document.querySelector(sel);if(!e) return {missing:true};
 const col=x=>{const m=x.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const c=m[1].split(/[,\\s]+/).map(Number);return c.slice(0,3).concat(c[3]===undefined?1:c[3]);};
 const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const l=arr=>{const v=arr.map(x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 const ancestors=[];for(let p=e;p;p=p.parentElement)ancestors.push(p);
 let b=[249,248,242];for(const p of ancestors.reverse()){const c=col(getComputedStyle(p).backgroundColor);if(c)b=blend(c,b)}
 const c=blend(col(getComputedStyle(e).color),b);
 return {ratio:+((Math.max(l(b),l(c))+.05)/(Math.min(l(b),l(c))+.05)).toFixed(2),color:getComputedStyle(e).color,background:b.map(Math.round),text:e.textContent.trim().slice(0,32)}
}'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    total=0
    for width,height in [(1440,900),(390,844),(320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        def intercept(route):
            resource=(root/route.request.url.split('tayyib.local/',1)[-1].split('?',1)[0]).resolve()
            if root.resolve() in resource.parents and resource.is_file():
                mime='image/webp' if resource.suffix=='.webp' else 'image/svg+xml' if resource.suffix=='.svg' else 'text/plain'
                route.fulfill(status=200,body=resource.read_bytes(),content_type=mime)
            else:
                route.fulfill(status=404,body='Not found')
        page.route('**/*',intercept)
        for route,selectors in checks.items():
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html(route),wait_until='domcontentloaded')
            page.wait_for_timeout(90)
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(route,width,'horizontal overflow')
            for selector in selectors:
                val=page.evaluate(measure,selector)
                assert not val.get('missing'),(route,selector,'missing')
                assert val['ratio']>=4.5,(route,width,selector,val)
                total+=1
            assert not errors,(route,width,errors)
        page.set_content(html('/'),wait_until='domcontentloaded')
        page.keyboard.press('Tab')
        assert page.locator(':focus').get_attribute('class')=='skip-link','keyboard must start with skip link'
        assert page.locator('.skip-link').evaluate('(el)=>getComputedStyle(el).outlineStyle')!='none','skip focus must be visible'
        if width<950:
            t=page.locator('.mobile-menu-toggle')
            t.click()
            assert t.get_attribute('aria-expanded')=='true','open menu announced'
            t.click()
            assert t.get_attribute('aria-expanded')=='false','closed menu announced'
            assert page.locator('.mobile-menu-toggle').evaluate('(e)=>e.getBoundingClientRect().width')>=44,'mobile touch target'
        page.emulate_media(reduced_motion='reduce')
        assert page.evaluate("getComputedStyle(document.documentElement).scrollBehavior")=='auto','reduced motion respected'
        page.emulate_media(reduced_motion='no-preference')
        if width in [1440,390]:
            page.screenshot(path=str(root.parent/f'preview-accessibility-home-{width}.png'),full_page=True)
        print(width,'PASS contrast, keyboard, navigation, reduced motion, no overflow')
        page.close()
    browser.close()
    print(f'PASS: {total} measured text samples >= 4.5:1 across desktop and mobile')
