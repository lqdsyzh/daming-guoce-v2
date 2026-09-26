// ============================================
// 《大明国策》批5 · 整合桥（b5Tick 巡检调度 + UI 初始化）
// ============================================

// 每季巡检总调度（script.js advanceSeason 调用）
function b5Tick() {
    try { if (typeof junpiDailyReset === 'function') junpiDailyReset(); } catch (e) {}
    try { if (typeof lizhiNeglectTick === 'function') lizhiNeglectTick(); } catch (e) {}
    try { if (typeof zaiyiTick === 'function') zaiyiTick(); } catch (e) {}
    try { if (typeof autoTick === 'function') autoTick(); } catch (e) {}
    try { if (typeof milMutinyTick === 'function') milMutinyTick(); } catch (e) {}
    try { if (typeof celebFrontierStreakTick === 'function') celebFrontierStreakTick(); } catch (e) {}
    try { if (typeof checkCelebrations === 'function') checkCelebrations(); } catch (e) {}
    // 御笔批朱按钮状态刷新
    try { refreshJunpiButton(); } catch (e) {}
    // 自动角标刷新
    try { if (typeof _autoRenderBadge === 'function') _autoRenderBadge(); } catch (e) {}
}

// 刷新国事区"御览批朱"按钮的限次数提示
function refreshJunpiButton() {
    try {
        const btn = document.getElementById('junpi-open-btn');
        if (!btn) return;
        const j = (GameState && GameState.junpi) ? GameState.junpi : null;
        const left = Math.max(0, (j && typeof j.perTick === 'number') ? 3 - j.perTick : 3);
        const n = (GameState.memorialQueue || []).length;
        btn.textContent = `御览批朱（${left}${n > 0 ? '·' + n + '奏' : ''}）`;
    } catch (e) {}
}

function initBatch5UI() {
    try {
        // 自动理政角标 + 开关（置于顶部时间控制区）
        let badge = document.getElementById('auto-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'auto-badge';
            badge.className = 'auto-badge';
            badge.style.display = 'none';
            badge.style.cursor = 'pointer';
            badge.addEventListener('click', function () { try { autoToggle(); } catch (e) {} });
            const tc = (document.getElementById && document.getElementById('time-control')) || (document.querySelector && document.querySelector('.time-control'));
            if (tc) tc.appendChild(badge);
        }
        refreshJunpiButton();
        if (typeof _autoRenderBadge === 'function') _autoRenderBadge();
    } catch (e) {}
}

// 初始化后（DOMContentLoaded 之后）同步一次
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    try {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(function () { try { initBatch5UI(); } catch (e) {} }, 0);
        } else {
            document.addEventListener('DOMContentLoaded', function () { try { initBatch5UI(); } catch (e) {} });
        }
    } catch (e) {}
}

console.log('✓ 批5·整合桥加载完成');