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
    
    // 直接通过 JS 模拟游戏进行 + 截图
    await page.evaluate(() => {
        // 关弹窗
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
        
        // 直接设置几个事件历史
        const hist = [
            { era: '天启三年', season: '春', month: '孟', type: 'internal', 
              title: '厂卫构陷', decision: '先派人暗查' },
            { era: '天启三年', season: '春', month: '仲', type: 'border', 
              title: '鞑靼犯边', decision: '出兵迎击' },
            { era: '天启三年', season: '春', month: '季', type: 'economy', 
              title: '官仓空虚', decision: '令地方自筹' }
        ];
        GameState.history = hist;
        GameState.decisionsCount = 3;
        
        // 修改一些数值
        GameState.stats.treasury = 3200;
        GameState.stats.stability = 28;
        GameState.stats.corruption = 65;
        GameState.factions.eunuch = 75;
        GameState.factions.civil = 45;
        
        // 强制更新
        updateUI();
        renderHistory();
        
        // 中央显示当前事件
        document.getElementById('edict-from').textContent = '司礼监·急奏';
        document.getElementById('edict-title').textContent = '京察大计';
        document.getElementById('edict-content').textContent = '六年京察，考核群臣。阉党势大，陛下当如何决断？';
    });
    await page.waitForTimeout(500);
    
    // 截图：游戏中期
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v4_tianqi_mid.png',
        fullPage: false
    });
    
    // 触发破产结局
    await page.evaluate(() => {
        GameState.stats.treasury = -40000;
        GameState.stats.stability = 15;
        GameState.stats.corruption = 80;
        GameState.factions.eunuch = 90;
        if (typeof triggerEnding === 'function') {
            triggerEnding('bankrupt');
        }
    });
    await page.waitForTimeout(800);
    
    // 截图：结局
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/v4_ending.png',
        fullPage: false
    });
    
    await browser.close();
    console.log('OK');
})();
