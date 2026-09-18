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
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto('http://localhost:8766/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 截图1：剧本选择
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/01_select.png',
        fullPage: false
    });
    
    // 点击"成化中兴"
    await page.click('.script-option:first-child');
    await page.waitForTimeout(800);
    
    // 截图2：主界面
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/02_main.png',
        fullPage: false
    });
    
    // 处理3个事件
    for (let i = 0; i < 3; i++) {
        const opts = await page.$$('.decision-option');
        if (opts.length > 0) {
            await opts[Math.floor(Math.random() * opts.length)].click();
            await page.waitForTimeout(600);
        }
    }
    
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/03_after.png',
        fullPage: false
    });
    
    if (errors.length > 0) {
        console.log('=== 错误 ===');
        errors.forEach(e => console.log(e));
    } else {
        console.log('无错误');
    }
    
    await browser.close();
})();
