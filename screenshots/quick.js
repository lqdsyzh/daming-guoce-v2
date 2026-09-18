const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    page.on('pageerror', e => console.log('ERR:', e.message));
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 直接看是否有脚本错误
    const errs = await page.evaluate(() => {
        const all = [];
        ['GameState','SCRIPTS','MINISTERS','TECH_TREE','IMPEACHMENT','PROSECUTOR'].forEach(k => {
            all.push(`${k}: ${typeof window[k]}`);
        });
        return all;
    });
    console.log('Globals:', errs);
    
    await browser.close();
})();
