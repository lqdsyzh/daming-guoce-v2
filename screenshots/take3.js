const { chromium } = require('/usr/local/lib/node_modules/playwright');

(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1600, height: 1000 },
        deviceScaleFactor: 1.5
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:8766/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 选择天启魏阉
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(1000);
    
    // 关闭可能的事件弹窗
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 处理5个事件：每次等弹窗出现
    for (let i = 0; i < 5; i++) {
        // 等弹窗
        await page.waitForSelector('.decision-option', { timeout: 5000 }).catch(() => {});
        const opts = await page.$$('.decision-option');
        if (opts.length > 0) {
            await opts[0].click();  // 选第一个
        }
        await page.waitForTimeout(700);
    }
    
    // 关闭弹窗
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 截图：5个决策后
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v3_tianqi_after.png',
        fullPage: false
    });
    
    // 触发结局
    await page.evaluate(() => {
        GameState.stats.treasury = -40000;
        GameState.stats.stability = 15;
        if (typeof triggerEnding === 'function') {
            triggerEnding('bankrupt');
        }
    });
    await page.waitForTimeout(800);
    
    // 截图：结局
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v3_ending.png',
        fullPage: false
    });
    
    await browser.close();
    console.log('完成');
})();
