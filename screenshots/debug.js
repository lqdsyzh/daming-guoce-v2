const { chromium } = require('/usr/local/lib/node_modules/playwright');

(async () => {
    const browser = await chromium.launch({
        executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1600, height: 1000 }
    });
    const page = await context.newPage();

    const allLogs = [];
    page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => allLogs.push(`[ERROR] ${err.message}`));
    page.on('requestfailed', req => allLogs.push(`[REQFAIL] ${req.url()} - ${req.failure().errorText}`));

    // 1. 首次访问
    await page.goto('http://localhost:8767/index.html', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('✓ 首次访问');

    // 2. 选剧本
    await page.click('.script-option:first-child');
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => ({
        scriptModal: document.getElementById('script-modal').classList.contains('active'),
        eventModal: document.getElementById('event-modal').classList.contains('active'),
        title: document.getElementById('edict-title').textContent,
        era: document.getElementById('era-name').textContent
    }));
    console.log('选剧本后状态:', JSON.stringify(state, null, 2));

    // 3. 刷新
    console.log('\n--- 刷新 ---');
    try {
        await page.reload({ waitUntil: 'networkidle', timeout: 10000 });
        console.log('✓ 刷新成功');
        const after = await page.evaluate(() => ({
            scriptModal: document.getElementById('script-modal').classList.contains('active'),
            eventModal: document.getElementById('event-modal').classList.contains('active'),
            title: document.getElementById('edict-title').textContent
        }));
        console.log('刷新后状态:', JSON.stringify(after, null, 2));
    } catch (e) {
        console.log('✗ 刷新失败:', e.message);
    }

    console.log('\n--- 控制台日志 ---');
    if (allLogs.length === 0) {
        console.log('(无)');
    } else {
        allLogs.forEach(l => console.log(l));
    }

    await browser.close();
})();
