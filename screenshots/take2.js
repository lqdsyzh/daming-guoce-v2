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
    
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto('http://localhost:8766/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 选择成化中兴
    await page.click('.script-option:first-child');
    await page.waitForTimeout(800);
    
    // 关闭可能的事件弹窗
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(300);
    
    // 截图：主界面（无弹窗）
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_main_clean.png',
        fullPage: false
    });
    
    // 推进1季（带结算）
    await page.evaluate(() => {
        // 推进1季，跳过随机事件
        GameState.currentMonth = 2;
        advanceSeason();
    });
    await page.waitForTimeout(500);
    
    // 关闭可能的事件弹窗
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(300);
    
    // 截图：推进1季后（无弹窗）
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_after_settle.png',
        fullPage: false
    });
    
    // 全屏截图
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_full.png',
        fullPage: true
    });
    
    if (errors.length > 0) {
        console.log('=== 错误 ===');
        errors.forEach(e => console.log(e));
    } else {
        console.log('无错误');
    }
    
    await browser.close();
})();
