const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    await page.goto('http://localhost:8771/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
        const m = document.getElementById('event-modal');
        if (m) m.classList.remove('active');
        const m2 = document.getElementById('memorial-modal');
        if (m2) m2.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    const tabs = ['politics','economy','personnel','impeach','construction','diplomacy',
                   'finance','military','transport','prison','harem','tech','decade'];
    const names = ['pol','eco','per','imp','con','dip','fin','mil','wat','pri','har','tec','dec'];
    
    for (let i = 0; i < tabs.length; i++) {
        await page.click(`[data-tab="${tabs[i]}"]`);
        await page.waitForTimeout(400);
        await page.screenshot({ 
            path: `/workspace/daming_guoce/screenshots/v3_${names[i]}.png`,
            fullPage: false 
        });
    }
    
    await browser.close();
    console.log('done');
})();
