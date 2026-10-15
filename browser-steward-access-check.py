"""Offline deterministic UI test for representative and operator portals; no Cloudflare required."""
from pathlib import Path
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parent
css=(p/'public/styles.css').read_text()+(p/'public/steward-portal.css').read_text()
ops_css=(p/'public/operator/stewards/stewards.css').read_text()
listing='central-masjid'
listing_data="window.TAYYIB_HUB={listings:[{id:'central-masjid',name:'Central Masjid',parish:'Kingston'},{id:'dawah-montego',name:'Islamic Da’wah Centre',parish:'St. James'}]};"
representative_mock="""window.__writes=[];window.fetch=async(u,options={})=>{if(options.method==='POST'){window.__writes.push(JSON.parse(options.body));return{ok:true,json:async()=>({ok:true,status:'pending'})}}return {ok:true,json:async()=>({ok:true,grants:[{id:14,listing_id:'central-masjid',expires_at:'2027-04-15'}]})}};"""
operator_mock="""window.__writes=[];window.fetch=async(u,options={})=>{if(options.method==='POST'){window.__writes.push(JSON.parse(options.body));return{ok:true,json:async()=>({ok:true,status:'active'})}}return {ok:true,json:async()=>({ok:true,items:[{id:14,listing_id:'central-masjid',email:'member@example.org',source_url:'https://example.org',review_note:'Independent organization authority has been validated and recorded.',issued_by:'reviewer@example.org',expires_at:'2027-04-15',status:new URL(u,'https://example.org').searchParams.get('status')||'active',revision:1,created_at:'2026-10-15'}]})}};"""

def markup(relative,style,script,mock):
    html=(p/relative).read_text()
    html=html.replace('<link rel="stylesheet" href="/styles.css">','')
    html=html.replace('<link rel="stylesheet" href="/steward-portal.css">','')
    html=html.replace('<link rel="stylesheet" href="/operator/stewards/stewards.css">','')
    html=html.replace('<script src="/hub-data.js" defer></script>','')
    html=html.replace(f'<script src="/{script}" defer></script>','')
    html=html.replace('</head>',f'<style>{style}</style><script>{listing_data}{mock}</script></head>')
    html=html.replace('</body>',f'<script>{(p/"public"/script).read_text()}</script></body>')
    return html
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for label,width,height in [('desktop',1440,900),('tablet',768,1024),('mobile',390,844),('small',320,760)]:
        for role in ('representative','operator'):
            page=b.new_page(viewport={'width':width,'height':height})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            if role=='representative':
                page.set_content(markup('public/steward/index.html',css,'steward-portal.js',representative_mock),wait_until='load')
                page.locator('.portal-assignment button').first.wait_for()
                page.locator('.portal-assignment button').first.click()
                page.locator('#proposal-url').fill('https://example.org/new-details')
                page.locator('#proposal-note').fill('The original organizer has posted new information for this place, please review that source.')
                page.locator('#proposal-submit').click()
                assert page.locator('#proposal-confirm').is_visible()
                page.locator('#proposal-cancel').click()
                assert page.evaluate('window.__writes.length')==0
                page.locator('#proposal-submit').click()
                page.locator('#proposal-confirm-send').click()
                assert page.evaluate('window.__writes.length')==1
                assert page.evaluate('window.__writes[0].grantId')==14
                page.screenshot(path=str(p/f'preview-steward-access-{role}-{label}.png'),full_page=True)
            else:
                page.set_content(markup('public/operator/stewards/index.html',css+ops_css,'operator/stewards/stewards.js',operator_mock),wait_until='load')
                page.locator('.ops-row').first.wait_for()
                page.locator('#grant-listing').select_option('central-masjid')
                page.locator('#grant-email').fill('member2@example.org')
                page.locator('#grant-source').fill('https://example.org/authority')
                page.locator('#grant-expiry').fill('2027-04-15')
                page.locator('#grant-note').fill('Independent team has checked an authorized representative with the original organization.')
                page.locator('#grant-submit').click()
                assert page.locator('#grant-confirm').is_visible()
                page.locator('#grant-cancel').click()
                assert page.evaluate('window.__writes.length')==0
                page.locator('#grant-submit').click()
                page.locator('#grant-confirm-action').click()
                assert page.evaluate('window.__writes.length')==1
                page.screenshot(path=str(p/f'preview-steward-access-{role}-{label}.png'),full_page=True)
            assert not errors,(role,label,errors)
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),(role,label,page.evaluate('document.documentElement.scrollWidth'))
            page.close()
        print(label,'representative/operator journeys PASS')
    b.close()
