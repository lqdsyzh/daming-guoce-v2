const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await (await browser.newContext({ viewport: { width: 1800, height: 1100 } })).newPage();
    
    const failed = [];
    page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 选剧本
    await page.click('.script-option:nth-child(4)');  // 万历
    await page.waitForTimeout(2000);
    
    // 关弹窗
    await page.evaluate(() => {
        const m = document.getElementById('event-modal');
        if (m) m.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_main.png' });
    
    // 切到 财
    await page.click('[data-tab="economy"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_economy.png' });
    
    // 切到 人
    await page.click('[data-tab="personnel"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_personnel.png' });
    
    // 切到 兵
    await page.click('[data-tab="military"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_military.png' });
    
    // 切到 技
    await page.click('[data-tab="tech"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_tech.png' });
    
    // 切到 宫
    await page.click('[data-tab="harem"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_harem.png' });
    
    // 切到 礼
    await page.click('[data-tab="diplomacy"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_diplomacy.png' });
    
    // 切到 刑
    await page.click('[data-tab="impeach"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_impeach.png' });
    
    // 切到 工
    await page.click('[data-tab="construction"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_construction.png' });
    
    // 切到 漕
    await page.click('[data-tab="transport"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_transport.png' });
    
    // 切到 囹
    await page.click('[data-tab="prison"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/daming_guoce/screenshots/v2_run_prison.png' });
    
    console.log('失败请求:');
    failed.forEach(f => console.log('  ', f));
    
    await browser.close();
})();
