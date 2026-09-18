const { chromium } = require('/usr/local/lib/node_modules/playwright');

(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1800, height: 1100 }
    });
    const page = await context.newPage();
    
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 1. 剧本选择
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_01_select.png',
        fullPage: false
    });
    
    // 2. 选择天启
    await page.click('.script-option:nth-child(5)');  // 第5个是天启
    await page.waitForTimeout(1500);
    
    // 关事件弹窗，看主界面
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 截图：政事卷主界面
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_02_politics.png',
        fullPage: false
    });
    
    // 切换到"财"卷
    await page.click('[data-tab="economy"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_03_economy.png',
        fullPage: false
    });
    
    // 切换到"人"卷（30大臣）
    await page.click('[data-tab="personnel"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_04_personnel.png',
        fullPage: false
    });
    
    // 切换到"刑"卷（弹劾）
    await page.click('[data-tab="impeach"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_05_impeach.png',
        fullPage: false
    });
    
    // 切换到"工"卷（奇观）
    await page.click('[data-tab="construction"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_06_construction.png',
        fullPage: false
    });
    
    // 切换到"礼"卷（外交）
    await page.click('[data-tab="diplomacy"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_07_diplomacy.png',
        fullPage: false
    });
    
    // 切换到"兵"卷（军事）
    await page.click('[data-tab="military"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_08_military.png',
        fullPage: false
    });
    
    // 切换到"漕"卷
    await page.click('[data-tab="transport"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_09_transport.png',
        fullPage: false
    });
    
    // 切换到"囹"卷（禁府）
    await page.click('[data-tab="prison"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_10_prison.png',
        fullPage: false
    });
    
    // 切换到"宫"卷
    await page.click('[data-tab="harem"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_11_harem.png',
        fullPage: false
    });
    
    // 切换到"技"卷
    await page.click('[data-tab="tech"]');
    await page.waitForTimeout(500);
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_12_tech.png',
        fullPage: false
    });
    
    // 测试刷新
    console.log('--- 测试刷新 ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 刷新后应该自动"继续游戏"
    const afterReload = await page.evaluate(() => ({
        scriptModalActive: document.getElementById('script-modal').classList.contains('active'),
        hasSave: typeof hasSave === 'function' ? hasSave() : 'unknown'
    }));
    console.log('刷新后:', JSON.stringify(afterReload));
    
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v2_13_reload.png',
        fullPage: false
    });
    
    if (errors.length > 0) {
        console.log('=== 错误 ===');
        errors.slice(0, 5).forEach(e => console.log(e));
    } else {
        console.log('✓ 无错误');
    }
    
    await browser.close();
})();
