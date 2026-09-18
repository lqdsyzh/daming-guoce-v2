const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    await page.goto('http://localhost:8780/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
        document.getElementById('event-modal')?.classList.remove('active');
        document.getElementById('memorial-modal')?.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 测每个tab的标题
    const tabs = ['decade','share','compare','emperor','famine','markets','censor','secret','prince'];
    for (const tab of tabs) {
        await page.click(`[data-tab="${tab}"]`);
        await page.waitForTimeout(400);
        const title = await page.evaluate(() => {
            const el = document.querySelector('.report-title') || 
                       document.querySelector('.section-title') || 
                       document.querySelector('.edict-title');
            return el ? el.textContent.substring(0, 30) : 'NONE';
        });
        console.log(`tab=${tab}: 标题="${title}"`);
        await page.screenshot({ 
            path: `/workspace/daming_guoce_v3/screenshots/tab_${tab}.png`,
            fullPage: false 
        });
    }
    
    await browser.close();
})();
