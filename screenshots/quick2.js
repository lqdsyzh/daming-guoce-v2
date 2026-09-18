const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    page.on('pageerror', e => console.log('PAGEERR:', e.message));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 截图
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_check.png' });
    
    const errs = await page.evaluate(() => {
        const all = [];
        for (const k of ['GameState','SCRIPTS','MINISTERS','TECH_TREE','IMPEACHMENT','PROSECUTOR','WONDERS']) {
            all.push(`${k}: ${typeof window[k]}`);
        }
        return all;
    });
    console.log('Globals:', errs);
    
    await browser.close();
})();
