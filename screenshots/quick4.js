const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    const errs = [];
    page.on('pageerror', e => errs.push('PAGE: ' + e.message + ' @ ' + e.stack?.split('\n')[1]));
    page.on('console', m => { 
        if (m.type() === 'error') errs.push('CONSOLE: ' + m.text());
        if (m.type() === 'warn') errs.push('WARN: ' + m.text());
    });
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 直接eval脚本测试
    const result = await page.evaluate(() => {
        try {
            // 试图访问 SCRIPTS
            return {
                SCRIPTS: typeof SCRIPTS,
                MINISTERS: typeof MINISTERS,
                TECH_TREE: typeof TECH_TREE,
                WONDERS: typeof WONDERS,
                IMPEACHMENT: typeof IMPEACHMENT,
                windowSCRIPTS: typeof window.SCRIPTS,
                error: '无'
            };
        } catch (e) {
            return { error: e.message };
        }
    });
    console.log('结果:', JSON.stringify(result, null, 2));
    console.log('错误数:', errs.length);
    errs.slice(0, 5).forEach(e => console.log('  ', e));
    
    await browser.close();
})();
