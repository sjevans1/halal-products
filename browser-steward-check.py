"""Contained Chromium journeys; no live requests, host navigation or Cloudflare."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

root=Path(__file__).parent/'public'
assets={name:(root/name).read_text() for name in ['hub-data.js','hub.js','steward.js']}

def page_markup(path,params='',enabled=False):
    source=root / path.strip('/') / 'index.html'
    html=source.read_text()
    css=''.join(f'<style>{(root/file).read_text()}</style>' for file in ['styles.css','hub.css','steward.css'])
    for file in ['styles.css','hub.css','steward.css']:
        html=html.replace(f'<link rel="stylesheet" href="/{file}">','')
    html=html.replace('</head>',css+'</head>')
    for script in ['hub-data.js','hub.js','steward.js']:
        html=html.replace(f'<script src="/{script}" defer></script>','')
    mode='true' if enabled else 'false'
    setup=f'''<script>
    window.__sends=[];window.__reject=false;
    window.turnstile={{render:(id,config)=>{{window.__challenge=config;return 1}},reset:()=>{{}}}};
    window.fetch=async function(url,opts){{
      if(url==='/api/hub-config')return {{ok:true,json:async()=>({{enabled:{mode},turnstileSiteKey:'test-key'}})}};
      if(url==='/api/hub-suggest'){{window.__sends.push(JSON.parse(opts.body));return window.__reject?{{ok:false,json:async()=>({{error:'Security verification failed.'}})}}:{{ok:true,json:async()=>({{ok:true}})}}}}
      return {{ok:false,json:async()=>({{error:'Unavailable'}})}};
    }};
    </script>'''
    params_literal=json.dumps(params)
    steward=assets['steward.js'].replace('new URLSearchParams(location.search)',f'new URLSearchParams({params_literal})')
    return html.replace('<head>','<head><base href="https://tayyib.local/">',1).replace('</body>',setup+'<script>'+assets['hub-data.js']+'</script><script>'+assets['hub.js']+'</script><script>'+steward+'</script></body>')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,720)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(page_markup('/discover/'),wait_until='load')
        assert page.locator('.directory-card').count()==15
        assert page.locator('.directory-actions .directory-detail-link').count()==15
        assert page.locator('.directory-card').first.locator('.directory-detail-link').get_attribute('href')=='/places/central-masjid/'
        page.set_content(page_markup('/places/central-masjid/'),wait_until='load')
        assert 'Not independently verified' in page.locator('.place-status').inner_text()
        assert 'Source viewed' in page.locator('.place-evidence').inner_text()
        assert 'record=central-masjid' in page.locator('.place-side a').get_attribute('href')
        page.set_content(page_markup('/contribute/','?record=central-masjid&intent=correction'),wait_until='load')
        assert page.locator('#steward-title').input_value()=='Central Masjid'
        assert page.locator('#steward-source').input_value().startswith('https://')
        assert page.locator('#steward-context').is_visible()
        assert page.locator('#steward-submit').is_disabled()
        page.locator('input[value="event"]').check()
        assert page.locator('#steward-context').is_hidden()
        page.locator('input[value="correction"]').check()
        assert page.locator('#steward-context').is_visible()
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),(label,'overflow')
        assert not errors,(label,errors)
        if label in ('desktop','mobile'):
            page.set_content(page_markup('/contribute/','?intent=representative'),wait_until='load')
            page.evaluate('() => { document.scrollingElement.scrollTop=0; window.scrollTo(0,0); }')
            page.wait_for_timeout(250)
            page.screenshot(path=str(root.parent/f'preview-steward-{label}.png'),full_page=True)
        print(f'{label}: source-aware listing, correction prefill, radio choices, disabled submission PASS')
        page.close()
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(page_markup('/contribute/','?record=central-masjid&intent=correction',enabled=True),wait_until='load')
    page.wait_for_function('window.__challenge!==undefined')
    page.evaluate("window.__challenge.callback('turnstile-token-valid')")
    assert page.locator('#steward-submit').is_enabled()
    page.locator('#steward-submit').click()
    assert 'Please acknowledge' in page.locator('#steward-status').inner_text()
    page.locator('#steward-understand').check()
    page.locator('#steward-submit').click()
    assert 'Please explain' in page.locator('#steward-status').inner_text()
    page.locator('#steward-note').fill('Please check the address against the official source.')
    page.evaluate('window.__reject=true')
    page.locator('#steward-submit').click()
    assert page.locator('.hub-form-status.error').is_visible()
    assert page.evaluate('window.__sends.length')==1
    payload=page.evaluate('window.__sends[0]')
    assert payload['type']=='correction'
    assert payload['note'].startswith('Existing listing ID: central-masjid.')
    assert page.locator('#steward-submit').is_disabled()
    page.evaluate("window.__challenge.callback('turnstile-token-valid-2');window.__reject=false")
    page.locator('#steward-submit').click()
    assert 'received for human review' in page.locator('#steward-status').inner_text()
    assert page.locator('#steward-submit').is_disabled()
    assert page.evaluate('window.__sends.length')==2
    assert not errors,errors
    print('enabled simulation: validation, rejected request, safe success, and Turnstile reset PASS')
    page.close();browser.close()
