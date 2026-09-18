const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    const errs = [];
    page.on('pageerror', e => errs.push('ERR: ' + e.message));
    
    await page.goto('http://localhost:8780/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 选天启
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(2000);
    
    // 关弹窗
    await page.evaluate(() => {
        const m1 = document.getElementById('event-modal');
        if (m1) m1.classList.remove('active');
        const m2 = document.getElementById('memorial-modal');
        if (m2) m2.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 截 选剧本后主界面
    await page.screenshot({ path: '/workspace/daming_guoce_v3/screenshots/v3_final_main.png' });
    
    // 点分享 tab
    await page.click('[data-tab="share"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce_v3/screenshots/v3_share.png' });
    
    // 点对比 tab
    await page.click('[data-tab="compare"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce_v3/screenshots/v3_compare.png' });
    
    // 触发奏折
    await page.evaluate(() => {
        if (typeof showMemorialV31 === 'function') {
            showMemorialV31();
        }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce_v3/screenshots/v3_memorial31.png' });
    
    if (errs.length > 0) {
        console.log('=== 错误 ===');
        errs.forEach(e => console.log(e));
    } else {
        console.log('✓ 无错误');
    }
    
    await browser.close();
})();
