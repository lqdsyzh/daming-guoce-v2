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
    
    await page.goto('http://localhost:8767/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // 截图1：剧本选择
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_01_select.png',
        fullPage: false
    });
    
    // 选择成化中兴
    await page.click('.script-option:first-child');
    await page.waitForTimeout(1500);  // 等弹窗
    
    // 关掉开局事件弹窗，看主界面
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
    });
    await page.waitForTimeout(500);
    
    // 截图2：主界面（无弹窗）
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_02_main.png',
        fullPage: false
    });
    
    // 现在再触发一个事件，截分屏效果
    await page.evaluate(() => {
        // 触发事件
        if (typeof triggerRandomEvent === 'function') {
            triggerRandomEvent();
        }
    });
    await page.waitForTimeout(800);
    
    // 截图3：右侧分屏弹窗
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_03_sidebar.png',
        fullPage: false
    });
    
    // 模拟玩到中后期
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
        
        // 模拟做了一些决策
        GameState.history = [
            { era: '成化十年', season: '春', month: '孟', type: 'disaster',
              title: '飞蝗蔽天', decision: '开仓赈灾' },
            { era: '成化十年', season: '春', month: '仲', type: 'border',
              title: '鞑靼犯边', decision: '出兵迎击' },
            { era: '成化十年', season: '春', month: '季', type: 'internal',
              title: '厂卫构陷', decision: '先派人暗查' },
            { era: '成化十年', season: '夏', month: '孟', type: 'economy',
              title: '盐政之弊', decision: '严查盐政' },
            { era: '成化十年', season: '夏', month: '仲', type: 'diplomacy',
              title: '朝鲜来贡', decision: '册封' },
            { era: '成化十年', season: '夏', month: '季', type: 'royal',
              title: '万贵妃干政', decision: '抑制外戚' }
        ];
        GameState.decisionsCount = 6;
        GameState.currentYear = 0;
        GameState.currentSeason = 1;
        GameState.currentMonth = 2;
        
        // 修改数值让画面有变化
        GameState.stats.treasury = 6800;
        GameState.stats.food = 4200;
        GameState.stats.stability = 62;
        GameState.stats.corruption = 22;
        GameState.factions.eunuch = 65;
        GameState.factions.consort = 35;
        GameState.stabilityLevel = 1;
        
        // 中央显示
        document.getElementById('edict-from').textContent = '户部·奏报';
        document.getElementById('edict-title').textContent = '漕运淤塞';
        document.getElementById('edict-content').textContent = '运河淤塞，漕运不畅。请旨拨款疏浚。';
        
        updateUI();
        renderHistory();
    });
    await page.waitForTimeout(500);
    
    // 截图4：游戏中期
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_04_midgame.png',
        fullPage: false
    });
    
    // 截图5：天启高难度
    await page.evaluate(() => {
        // 关闭主界面，模拟切剧本
        document.getElementById('script-modal').classList.add('active');
        document.getElementById('event-modal').classList.remove('active');
    });
    await page.waitForTimeout(300);
    
    await page.click('.script-option:nth-child(4)');
    await page.waitForTimeout(1500);
    
    await page.evaluate(() => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
        document.getElementById('edict-from').textContent = '兵部·急报';
        document.getElementById('edict-title').textContent = '辽东告急';
        document.getElementById('edict-content').textContent = '建州女真渐强，辽东边报日紧。';
    });
    await page.waitForTimeout(500);
    
    // 截图5：天启剧本
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_05_tianqi.png',
        fullPage: false
    });
    
    // 触发亡国结局
    await page.evaluate(() => {
        GameState.stats.treasury = -35000;
        GameState.stats.stability = 10;
        GameState.stats.mandate = 15;
        GameState.stats.militaryPower = 2500;
        GameState.factions.eunuch = 95;
        if (typeof triggerEnding === 'function') {
            triggerEnding('mandate_lost');
        }
    });
    await page.waitForTimeout(800);
    
    // 截图6：结局
    await page.screenshot({ 
        path: '/workspace/daming_guoce/screenshots/final_06_ending.png',
        fullPage: false
    });
    
    if (errors.length > 0) {
        console.log('=== 错误 ===');
        errors.forEach(e => console.log(e));
    } else {
        console.log('✓ 无错误');
    }
    
    await browser.close();
})();
