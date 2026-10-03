// ============================================
// 《大明国策》批5 · 自动理政模式（便利性）
// 稳健/激进/随机 三偏好；年数上限；重大急奏/决策暂停；失误积累反爽游
// ============================================

const AUTO_PREFS = ['稳健', '激进', '随机'];

function initAutoModeState() {
    return { on: false, pref: '稳健', yearsLimit: 5, elapsedYears: 0, paused: false, mistakes: 0 };
}

function _auto() { return GameState.autoMode; }

// 开关
function autoToggle() {
    try {
        const a = _auto(); a.on = !a.on;
        a.paused = false;
        pushNews('内侍', a.on ? '自动理政已开，依所定方略代行庶政。' : '自动理政已罢，陛下亲决。', 'normal');
        _autoRenderBadge();
        if (typeof renderScreen === 'function') renderScreen();
    } catch (e) {}
}

// 设偏好
function autoSetPref(p) {
    try { if (AUTO_PREFS.indexOf(p) < 0) return; _auto().pref = p; _autoRenderBadge(); } catch (e) {}
}
// 设年数上限
function autoSetYears(n) {
    try { const a = _auto(); a.yearsLimit = Math.max(1, Math.min(50, n)); } catch (e) {}
}
// 暂停（重大事件/需决策时调用）
function autoPause(reason) {
    try { const a = _auto(); if (!a.on) return; a.paused = true; a.mistakes += 1; pushNews('自动', `自动理政暂歇：${reason}（决策失误累积+1）`, 'danger'); _autoRenderBadge(); } catch (e) {}
}
// 恢复
function autoResume() { try { const a = _auto(); if (a.on) a.paused = false; _autoRenderBadge(); } catch (e) {} }

// 每季自动处理（b5Tick）
function autoTick() {
    try {
        const a = _auto(); if (!a || !a.on) return;
        // 年数上限
        if (a.elapsedYears >= a.yearsLimit) { a.on = false; a.paused = false; pushNews('内侍', `自动理政已至${a.yearsLimit}年之限，请陛下复议。`, 'danger'); _autoRenderBadge(); return; }
        a.elapsedYears++;
        if (a.paused) { a.mistakes += 1; if (a.mistakes > 0) a.mistakes += 0; // 暂停期间不免失误
            return; }
        // 依偏好选无害缺省治理
        const s = GameState.stats;
        let msg;
        if (a.pref === '稳健') { s.stability = Math.min(100, s.stability + 1); msg = '奉行守成，仓廪稍实。'; }
        else if (a.pref === '激进') { s.treasury = Math.max(0, s.treasury - 2); s.stability = Math.min(100, s.stability + 2); msg = '锐意兴革，恐劳民力。'; }
        else { const r = Math.random(); s.stability = Math.min(100, s.stability + (r > 0.5 ? 1 : 0)); msg = '因时制宜，随机应变。'; }
        // 失误累积：满6次必出一桩乱政
        a.mistakes += 1;
        if (a.mistakes >= 6) { a.mistakes = 0; s.adminEfficiency = Math.max(0, (s.adminEfficiency || 0) - 3); pushNews('自动失误', '代行庶政多所乖谬，胥吏中饱，朝纲小紊！', 'danger'); }
        if (a.mistakes % 3 === 0) pushNews('自动', `已历${a.elapsedYears}年。${msg}`, 'normal');
        _autoRenderBadge();
    } catch (e) {}
}

// 角标
function _autoRenderBadge() {
    try {
        const badge = document && document.getElementById('auto-badge');
        if (!badge) return;
        const a = _auto();
        if (a.on) {
            badge.style.display = 'inline-block';
            badge.textContent = `⚙ 自动[${a.pref}]${a.paused ? '·暂停' : ''} ${a.elapsedYears}/${a.yearsLimit}年`;
        } else badge.style.display = 'none';
    } catch (e) {}
}

// renderAutoTab 设置面板（挂 tech/emperor tab 尾部）
function renderAutoTab() {
    try {
        const a = _auto();
        const prefBtns = AUTO_PREFS.map(p => `<button class="btn" onclick="autoSetPref('${p}')" ${a.pref === p ? 'style="font-weight:bold"' : ''}>${p}</button>`).join(' ');
        return `<div class="report-card"><div class="report-title">⚙ 自动理政模式（挂机）</div>
            <div class="report-text">
                <button class="btn" onclick="autoToggle()">${a.on ? '停用自动理政' : '启用自动理政'}</button>
                偏好：${prefBtns}　
                <button class="btn" onclick="autoResume()">恢复（退出暂停）</button>
            </div>
            <div class="report-text">年数上限 <input id="auto-years" type="number" value="${a.yearsLimit}" min="1" max="50" style="width:60px" onchange="autoSetYears(+this.value)">　
                当前${a.on ? '已运行' + a.elapsedYears + '年' + (a.paused ? '·暂停' : '') : '未启用'}　失误累积：${a.mistakes}</div>
            <div class="report-text"><i>鉴戒：全自动理政徒增决策失误之累，遇重大急奏/关键决策自动暂停待陛下亲定。</i></div>
        </div>`;
    } catch (e) { return ''; }
}

console.log('✓ 批5·自动理政加载完成');