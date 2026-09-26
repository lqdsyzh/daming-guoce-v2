// ============================================
// 《大明国策》v6.0 批A · 朝政总览看板
// 首屏落地页：一屏看全局，免上下长滑，点卡片下钻对应功能。
// 纯前端零依赖；只读 GameState，不做任何持久化；
// 绝不触碰 edict 永久DOM 与已决政事区。
// 全部新逻辑 try-catch 守卫；id/class 常量化。
// ============================================

// ---- 资源卡配置（常量化：key / 文案 / 下钻tab / 阈值） ----
// higher-better 资源：bad(枯竭红) / warn(趋寒黄) / good(充裕绿)
// rebellionRisk 为 lower-better：bad>45 / warn>30 / good<=20
var OVERVIEW_CARDS = [
    { key: 'treasury',      label: '国库',   icon: '银', tab: 'finance',  kind: 'big',   scale: 20000, bad: 2000,  warn: 6000,  good: 15000 },
    { key: 'prestige',      label: '民望',   icon: '望', tab: 'politics', kind: 'v100',  bad: 40,     warn: 60,    good: 80 },
    { key: 'militaryPower', label: '兵力',   icon: '军', tab: 'military', kind: 'big',   scale: 15000, bad: 3000,  warn: 6000,  good: 10000 },
    { key: 'food',          label: '粮草',   icon: '粮', tab: 'economy',  kind: 'big',   scale: 10000, bad: 1000,  warn: 2500,  good: 6000 },
    { key: 'prosperity',    label: '景气',   icon: '市', tab: 'markets',  kind: 'v100',  bad: 40,     warn: 60,    good: 80 },
    { key: 'mandate',       label: '天命',   icon: '命', tab: 'map',      kind: 'v100',  bad: 40,     warn: 60,    good: 80 },
    { key: 'stability',     label: '稳定',   icon: '稳', tab: 'famine',   kind: 'v100',  bad: 40,     warn: 60,    good: 80 },
    { key: 'rebellion',     label: '叛乱',   icon: '乱', tab: 'markets',  kind: 'risk',  bad: 45,     warn: 30,    good: 20 }
];

// ---- 预警项收集（level: critical / warn / info；tab 可点下钻） ----
function overviewCollectWarnings() {
    var out = [];
    try {
        var s = GameState && GameState.stats ? GameState.stats : {};
        var econ = GameState && GameState.econ ? GameState.econ : {};
        var i;
        // 1. 资源枯竭
        for (i = 0; i < OVERVIEW_CARDS.length; i++) {
            var c = OVERVIEW_CARDS[i];
            var val = overviewCardValue(c);
            if (val === null || val === undefined) continue;
            if (c.kind === 'risk') {
                if (val > c.bad) out.push({ level: 'critical', text: '叛乱风险高企 ' + Math.round(val) + '%', tab: c.tab });
                else if (val > c.warn) out.push({ level: 'warn', text: '叛乱风险涌动 ' + Math.round(val) + '%', tab: c.tab });
            } else {
                if (val < c.bad) out.push({ level: 'critical', text: c.label + '告急（' + overviewCardStr(c, val) + '）', tab: c.tab });
                else if (val < c.warn) out.push({ level: 'warn', text: c.label + '偏紧（' + overviewCardStr(c, val) + '）', tab: c.tab });
            }
        }
        // 2. 派系跋扈
        var f = GameState && GameState.factions ? GameState.factions : {};
        if (typeof FACTIONS === 'object' && FACTIONS) {
            for (var k in FACTIONS) {
                if (!FACTIONS.hasOwnProperty(k)) continue;
                var fv = f[k] || 0;
                if (fv > 80) out.push({ level: 'critical', text: FACTIONS[k].name + '跋扈（' + Math.round(fv) + '）', tab: 'personnel' });
            }
        }
        // 3. 待决急奏
        var mq = GameState && GameState.memorialQueue ? GameState.memorialQueue : [];
        if (mq.length > 0) out.push({ level: mq.length > 3 ? 'critical' : 'warn', text: '待决急奏 ' + mq.length + ' 件', tab: 'politics' });
        // 4. 灾异
        var z = GameState && GameState.zaiyi ? GameState.zaiyi : {};
        if (z.pending && z.pending.length > 0) out.push({ level: 'critical', text: '灾异待办 ' + z.pending.length + ' 起', tab: 'famine' });
        // 5. 天象警兆
        var om = GameState && GameState.omen ? GameState.omen : {};
        if (om.eclipse) out.push({ level: 'critical', text: '日食为祟，人心浮动', tab: 'map' });
        if (om.comet) out.push({ level: 'warn', text: '彗星示警，边患将萌', tab: 'map' });
        if ((s.mandate || 0) < 40) out.push({ level: 'critical', text: '天命衰微，神器有危', tab: 'map' });
        // 6. 主线待决
        try {
            if (typeof mainlineNextDue === 'function' && mainlineNextDue() !== null) {
                out.push({ level: 'warn', text: '山河志主线将启，静候明光', tab: 'map' });
            }
        } catch (e) {}
    } catch (e) {}
    // 7. 若无预警
    if (out.length === 0) out.push({ level: 'info', text: '四海升平，暂无急务可奏', tab: '' });
    return out;
}

function overviewCardValue(c) {
    try {
        if (c.kind === 'risk') {
            return (typeof rebellionRisk === 'function') ? (rebellionRisk() * 100) : (GameState.stats.stability || 0);
        }
        if (c.kind === 'prosperity' || c.key === 'prosperity') {
            return (GameState.econ && GameState.econ.prosperity !== undefined) ? GameState.econ.prosperity : 50;
        }
        return GameState.stats ? (GameState.stats[c.key] || 0) : 0;
    } catch (e) { return 0; }
}

function overviewCardStr(c, val) {
    try {
        val = val === undefined ? overviewCardValue(c) : val;
        if (c.key === 'treasury' || c.key === 'privyPurse') return Math.round(val) + '两';
        if (c.kind === 'risk') return Math.round(val) + '%';
        if (c.key === 'population') return Math.round(val / 10000) + '万';
        return String(Math.round(val));
    } catch (e) { return '—'; }
}

function overviewCardStatus(c, val) {
    val = val === undefined ? overviewCardValue(c) : val;
    if (c.kind === 'risk') {
        if (val > c.bad) return 'bad';
        if (val > c.warn) return 'warn';
        return 'good';
    }
    if (val < c.bad) return 'bad';
    if (val < c.warn) return 'warn';
    if (val >= c.good) return 'good';
    return 'ok';
}

function overviewBarWidth(c, val) {
    try {
        if (c.kind === 'v100' || c.kind === 'risk') {
            return Math.max(0, Math.min(100, val));
        }
        // big：按 scale 归一
        return Math.max(0, Math.min(100, (val / (c.scale || 10000)) * 100));
    } catch (e) { return 0; }
}

// ---- 主线进度（只读） ----
function overviewMainline() {
    var info = { name: '', era: '', pct: 0, phase: 'main', total: 0, done: 0, has: false };
    try {
        var line = (typeof MAINLINE === 'object' && MAINLINE)
            ? (MAINLINE[(GameState.script && GameState.script.id)] || MAINLINE.chenghua)
            : null;
        var st = GameState && GameState.mainline ? GameState.mainline : null;
        if (!line) return info;
        var total = (line.nodes || []).length;
        info.name = line.name || '';
        info.era = line.era || '';
        info.total = total;
        if (st) {
            var stage = typeof st.stage === 'number' ? st.stage : 0;
            if (st.phase === 'done') { info.pct = 100; info.done = total; info.phase = 'done'; }
            else { info.done = Math.min(total, stage); info.pct = total ? Math.round(stage / total * 100) : 0; }
        }
        info.has = true;
    } catch (e) {}
    return info;
}

// ---- 主渲染：返回 HTML（renderPanel 写入 center-panel） ----
function renderOverview() {
    try {
        var s = GameState && GameState.stats ? GameState.stats : {};
        var f = GameState && GameState.factions ? GameState.factions : {};
        var econ = GameState && GameState.econ ? GameState.econ : {};
        var yr = (GameState.script ? GameState.script.era : '') + (GameState.currentYear ? ' · 第' + (GameState.currentYear + 1) + '年' : '');

        // 1. 资源卡
        var cards = '';
        for (var i = 0; i < OVERVIEW_CARDS.length; i++) {
            var c = OVERVIEW_CARDS[i];
            var val = overviewCardValue(c);
            var st = overviewCardStatus(c, val);
            var bar = overviewBarWidth(c, val);
            var txt = overviewCardStr(c, val);
            var tag = st === 'bad' ? '危' : st === 'warn' ? '慎' : st === 'good' ? '裕' : '稳';
            cards += '<div class="ov-card ov-' + st + '" onclick="overviewGoto(\'' + c.tab + '\')" title="进入' + (RESOURCES[c.key] ? RESOURCES[c.key].name : c.label) + '（' + c.tab + '）">'
                + '<div class="ov-card-head"><span class="ov-card-icon">' + c.icon + '</span><span class="ov-card-name">' + c.label + '</span><span class="ov-card-tag">' + tag + '</span></div>'
                + '<div class="ov-card-val">' + txt + '</div>'
                + '<div class="ov-card-bar"><div class="ov-card-fill ov-fill-' + st + '" style="width:' + bar + '%"></div></div>'
                + '</div>';
        }

        // 2. 五大派系横条
        var fac = '';
        for (var k in FACTIONS) {
            if (!FACTIONS.hasOwnProperty(k)) continue;
            var fl = FACTIONS[k];
            var fv = Math.round(f[f.kind !== undefined ? f.kind : k] || f[k] || 0);
            var mood = fv > 80 ? 'bad' : fv > 60 ? 'proud' : fv > 40 ? 'wait' : 'low';
            var moodTxt = fv > 80 ? '跋扈' : fv > 60 ? '骄横' : fv > 40 ? '观望' : fv > 20 ? '蛰伏' : '濒散';
            fac += '<div class="ov-fac" onclick="overviewGoto(\'personnel\')"><div class="ov-fac-row">'
                + '<span class="ov-fac-name">' + fl.name + '</span><span class="ov-fac-val ov-fac-' + mood + '">' + moodTxt + ' · ' + fv + '</span></div>'
                + '<div class="ov-fac-bar"><div class="ov-fac-fill ov-fac-fill-' + mood + '" style="width:' + Math.max(0, Math.min(100, fv)) + '%"></div></div>'
                + '</div>';
        }

        // 3. 预警区
        var warns = overviewCollectWarnings();
        var warnHtml = '';
        for (var w = 0; w < warns.length; w++) {
            var ww = warns[w];
            var wtxt = ww.tab ? 'title="点此下钻"' : '';
            var wclick = ww.tab ? ' onclick="overviewGoto(\'' + ww.tab + '\')"' : '';
            warnHtml += '<div class="ov-warn ov-warn-' + ww.level + '"' + wtxt + wclick + '>'
                + '<span class="ov-warn-dot"></span><span class="ov-warn-txt">' + ww.text + '</span>'
                + (ww.tab ? '<span class="ov-warn-go">›</span>' : '')
                + '</div>';
        }

        // 4. 主线进度
        var ml = overviewMainline();
        var mlHtml;
        if (ml.has) {
            var mlTag = ml.phase === 'done' ? '<span class="ov-ml-done">已完成</span>' : '<span class="ov-ml-stage">第 ' + (ml.total ? (ml.done + 1) : 1) + '/' + ml.total + ' 章</span>';
            mlHtml = '<div class="ov-ml" onclick="overviewGoto(\'map\')">'
                + '<div class="ov-ml-head"><span class="ov-ml-name">山河志 · ' + ml.name + '</span>' + mlTag + '</div>'
                + '<div class="ov-ml-bar"><div class="ov-ml-fill" style="width:' + ml.pct + '%"></div></div>'
                + '<div class="ov-ml-meta">' + (ml.era || '') + ' · 进度 ' + ml.pct + '%</div>'
                + '</div>';
        } else {
            mlHtml = '<div class="ov-ml"><div class="ov-ml-head"><span>山河志 · 主线未启</span></div>'
                + '<div class="ov-ml-meta">随年光流转，山河志将徐徐展开。</div></div>';
        }

        // 5. 下卷提示（复用已有控件，仅提示）
        var hint = '<div class="ov-hint">顶部「下季」推进时季 · 「快进1年」连行四时 · 各卡可点击直达</div>';

        return '<div class="overview-board" id="overview-board">'
            + '<div class="ov-title-row"><span class="ov-title">朝政总览</span><span class="ov-sub">' + yr + ' · 安邦体要在目</span></div>'
            + '<div class="ov-section"><div class="ov-sec-title">· 国用军民生计</div><div class="ov-grid">' + cards + '</div></div>'
            + '<div class="ov-section"><div class="ov-sec-title">· 朝堂五派势态</div><div class="ov-fac-grid">' + fac + '</div></div>'
            + '<div class="ov-section"><div class="ov-sec-title">· 急务预警</div><div class="ov-warn-list">' + warnHtml + '</div></div>'
            + '<div class="ov-section"><div class="ov-sec-title">· 主线进程</div>' + mlHtml + '</div>'
            + '<div class="ov-section"><div class="ov-sec-title">· 王朝使命</div>' + missionOverviewStrip() + '</div>'
            + hint
            + '</div>';
    } catch (e) {
        try {
            if (typeof renderPolitics === 'function') return renderPolitics();
        } catch (e2) {}
        return '<div class="report-title">朝政总览</div><div class="report-summary"><div class="summary-item"><div class="summary-label">预览异常</div><div class="summary-value">暂不可用</div></div></div>';
    }
}

// ---- 下钻跳转（与 menu-tab 点击等价） ----
function overviewGoto(tab) {
    try {
        if (!tab || typeof tab !== 'string') return;
        if (GameState) GameState.currentTab = tab;
        // 同步左侧菜单 active
        try {
            var tabs = document.querySelectorAll('#menu-tabs .menu-tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.toggle('active', tabs[i].dataset.tab === tab);
            }
        } catch (e) {}
        // 渲染目标面板
        if (typeof renderPanel === 'function') renderPanel(tab);
        else if (typeof renderScreen === 'function') renderScreen();
    } catch (e) {}
}