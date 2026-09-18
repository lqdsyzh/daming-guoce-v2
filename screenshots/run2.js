const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    const errs = [];
    page.on('pageerror', e => errs.push('ERR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('CON: ' + m.text()); });
    
    await page.goto('http://localhost:8770/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 选剧本
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(2000);
    
    // 关事件弹窗
    await page.evaluate(() => {
        const m = document.getElementById('event-modal');
        if (m) m.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 截图1：年tab - 述职
    await page.click('[data-tab="decade"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v21_summary.png' });
    
    // 派系
    await page.click('[onclick*="factions"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v21_factions.png' });
    
    // 成就
    await page.click('[onclick*="achievements"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v21_achievements.png' });
    
    // 手册
    await page.click('[onclick*="handbook"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v21_handbook.png' });
    
    console.log('错误:', errs.length);
    errs.slice(0, 3).forEach(e => console.log(' ', e));
    
    await browser.close();
})();
