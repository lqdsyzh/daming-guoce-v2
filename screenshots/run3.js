const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    page.on('pageerror', e => console.log('ERR:', e.message));
    
    await page.goto('http://localhost:8771/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 选天启
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(2000);
    
    // 直接触发奏折
    await page.evaluate(() => {
        if (typeof generateMemorialQueue === 'function' && typeof showMemorial === 'function') {
            const queue = generateMemorialQueue();
            if (queue.length > 0) {
                GameState.memorialQueue = queue;
                showMemorial(queue[0]);
            }
        }
    });
    await page.waitForTimeout(800);
    
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v30_memorial.png' });
    
    await browser.close();
    console.log('done');
})();
