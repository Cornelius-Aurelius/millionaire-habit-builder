from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
url='about:blank'
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+(root/'styles.css').read_text()+'</style>')
html=html.replace('<script defer src="core.js"></script>','').replace('<script defer src="app.js"></script>','')
html=html.replace('</body>','<script>'+(root/'core.js').read_text()+'</script><script>'+(root/'app.js').read_text()+'</script></body>')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    widths=[280,320,375,430,768,1024,1440]
    for w in widths:
        page=browser.new_page(viewport={'width':w,'height':800},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.evaluate("""() => {const storage={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=String(v)},removeItem:k=>{delete storage[k]}}});}""")
        page.set_content(html,wait_until='load')
        page.locator('#goal').fill('Build a freelance design business')
        page.locator('#pace').select_option('steady')
        page.locator('#planForm button[type=submit]').click()
        page.wait_for_timeout(150)
        assert page.locator('#tracker').is_visible(),f'Form did not build at {w}'
        assert page.locator('#calendar .day').count()==30
        assert page.locator('#dailyTasks input[type=checkbox]').count()==3
        assert not page.locator('#calendar .day').nth(1).is_enabled()
        checks=page.locator('#dailyTasks input[type=checkbox]')
        for i in range(3):checks.nth(i).check()
        assert page.locator('#daysDone').inner_text().startswith('1')
        assert page.locator('#tasksDone').inner_text().startswith('3 of 90')
        page.locator('#dayNote').fill('Made progress without rushing')
        page.locator('#dayNote').blur()
        page.wait_for_timeout(50)
        page.screenshot(path=str(root/'tests'/f'screen_{w}.png'),full_page=True)
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
        print(f'width={w}, overflow={overflow}, errors={errors}')
        assert not overflow,f'overflow {w}'
        assert not errors,f'js errors {w}: {errors}'
        if w==375:
            saved=page.evaluate('localStorage.getItem("cornelius_millionaire_habit_builder_v2")')
            assert 'Made progress' in saved and '"startDate"' in saved,'persistence'
            assert page.locator('#daysDone').inner_text().startswith('1'),'progress'
            assert 'Made progress' in page.locator('#dayNote').input_value(),'journal persistence'
            # Backup export, refresh and import. Do not rely on downloads to inspect bytes here.
            with page.expect_download() as info:page.locator('#exportJson').click()
            download=info.value
            assert download.suggested_filename.endswith('.json')
            page.on('dialog',lambda d:d.accept())
            page.locator('#clearPlan').click()
            assert page.locator('#emptyState').is_visible()
            page.locator('#goal').fill('<img src=x onerror=alert(1)>')
            page.locator('#planForm button[type=submit]').click()
            assert page.locator('#tracker').is_visible()
            assert page.locator('img[src="x"]').count()==0,'injection'
        page.close()
    browser.close()
print('All 7 viewport & workflow checks passed')