const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    page.on('requestfailed', r => console.log('FAILED:', r.url(), r.failure()?.errorText));
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 检查数据
    const hasData = await page.evaluate(() => {
        const scripts = Array.from(document.scripts).map(s => s.src || '<inline>');
        return {
            scriptCount: scripts.length,
            scripts: scripts,
            bodyText: document.body.textContent.substring(0, 200)
        };
    });
    console.log(JSON.stringify(hasData, null, 2));
    
    await browser.close();
})();
