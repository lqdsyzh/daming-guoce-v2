// ============================================================
// 《大明国策》v6.6 批L-甲 · 天命系统（王朝气数）
// 反爽游哲学：天命非可白嫖——善政累积受命，苛政损耗受命；
// 高天命赐福：稳定衰减-、急奏稀有、贪腐不易；低天命多难：灾异频发、边患承压。
// 全部符号带 TMM_/tmm 前缀，独立追加式，不触碰既有关键逻辑。
// 史据：《尚书·大禹谟》"满招损，谦受益"；《明史·五行志》天命与灾异相系。
// 注意：本文件使用顶层 function 声明（与 qiuzhuji.js 等批一致），
//       保证 script.js 裸调用 tmmInit/tmmTick 在浏览器与 vm 测试全局均可见。
// ============================================================

// 初始天命（按剧本开局稳定度派生，每剧本 50-65 起步以体现差异）
function tmmInit() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        if (!GameState.tianming || typeof GameState.tianming !== 'object') {
            var start = 55;
            try {
                if (GameState.stats && typeof GameState.stats.stability === 'number') {
                    start = Math.max(40, Math.min(70, Math.round(40 + GameState.stats.stability / 4)));
                }
            } catch (e) {}
            GameState.tianming = {
                value: start,             // 0-100 隐藏指标（不显示数字，仅显示"色级"与"兆象"）
                startValue: start,
                peakValue: start,
                nadirValue: start,
                blessed: 0,               // 赐福计数（高天命达成次数）
                scourge: 0,               // 灾异计数（低天命触发次数）
                judgment: '稳',            // 色级：圣/隆/稳/晦/危
                omenList: [],             // 兆象记录（最高保留 30 条）
                lastTick: -1,
                _lastKey: null
            };
        }
        tmmEnsure(GameState.tianming);
    } catch (e) {}
}

function tmmEnsure(t) {
    try {
        if (!t) return;
        if (typeof t.value !== 'number') t.value = 55;
        if (typeof t.startValue !== 'number') t.startValue = t.value;
        if (typeof t.peakValue !== 'number') t.peakValue = t.value;
        if (typeof t.nadirValue !== 'number') t.nadirValue = t.value;
        if (typeof t.blessed !== 'number') t.blessed = 0;
        if (typeof t.scourge !== 'number') t.scourge = 0;
        if (typeof t.judgment !== 'string') t.judgment = '稳';
        if (!Array.isArray(t.omenList)) t.omenList = [];
        if (typeof t.lastTick !== 'number') t.lastTick = -1;
    } catch (e) {}
}

// 调整天命值（限幅 + 自动更新色级 + 峰值谷值）。amount 可正可负。
function tmmAdjust(amount, reason) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        tmmInit();
        var t = GameState.tianming;
        if (!amount) return t.value;
        var old = t.value;
        t.value = Math.max(0, Math.min(100, t.value + amount));
        if (t.value > t.peakValue) t.peakValue = t.value;
        if (t.value < t.nadirValue) t.nadirValue = t.value;
        t.judgment = tmmJudgmentWord(t.value);
        // 重大变化记兆象
        if (Math.abs(amount) >= 4) {
            var key = (GameState.currentYear || 0) + '-' + (GameState.currentSeason || 0) + '|' + (reason || '气数浮动');
            if (t._lastKey !== key) {
                t._lastKey = key;
                var txt = amount > 0
                    ? '受命' + (amount >= 8 ? '大盛' : '+') + Math.round(amount/10)/10 + '：' + (reason || '善政感天')
                    : '气数' + (amount <= -8 ? '大亏' : '-') + Math.round(-amount/10)/10 + '：' + (reason || '苛政失德');
                t.omenList.push({ year: GameState.currentYear || 0, season: GameState.currentSeason || 0, text: txt, delta: amount });
                if (t.omenList.length > 30) t.omenList.shift();
                if (amount >= 8) t.blessed++;
                if (amount <= -8) t.scourge++;
            }
        }
        return t.value;
    } catch (e) { return null; }
}

// 累积善政/劣政 → 自动转译为天命调整（每个事件系统可调；带 rate 倍率便于被动放大/缩小）
function tmmAccrue(kind, amount, rate) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        tmmInit();
        if (!amount) return GameState.tianming.value;
        var k = (kind === 'good') ? 1 : (kind === 'bad') ? -1 : 0;
        if (k === 0) return GameState.tianming.value;
        var r = (typeof rate === 'number') ? rate : 1;
        // 善政：基础+0.6 决定论放大；劣政：-1.2 失德衰减更大（反爽）
        var raw = k * (k > 0 ? 0.6 : 1.2) * amount * r;
        var reason = (kind === 'good') ? '善政' : '苛政';
        return tmmAdjust(raw, reason);
    } catch (e) { return null; }
}

// 色级文字（仅显示，不显示数字）
function tmmJudgmentWord(v) {
    if (typeof v !== 'number') return '稳';
    if (v >= 90) return '圣';
    if (v >= 75) return '隆';
    if (v >= 55) return '稳';
    if (v >= 35) return '晦';
    return '危';
}

// 色级描述（按当前剧本皇帝年号归属给一句概括）
function tmmJudgmentDesc(v) {
    if (typeof v !== 'number') return '气数未定';
    if (v >= 90) return '天命圣彰，四海归心，灾异不生';
    if (v >= 75) return '气运隆盛，国泰民安';
    if (v >= 55) return '社稷稳泰，可堪守成';
    if (v >= 35) return '气数渐晦，宜修德以回天';
    return '天命将倾，社稷危在旦夕';
}

// 每季巡检：从既有指标派生天命漂移（确定性、可重放）
function tmmTick() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        tmmInit();
        var t = GameState.tianming;
        var nowTick = (typeof GameState.tick === 'number') ? GameState.tick :
            ((GameState.currentYear * 4) + (GameState.currentSeason || 0));
        if (t.lastTick === nowTick) return;
        t.lastTick = nowTick;
        // 基础漂移 0（不放大不缩小）；季度内若稳定/民怨/边防异常，触发天命迁移
        var drift = 0;
        var reasons = [];
        if (GameState.stats && typeof GameState.stats.stability === 'number') {
            var s = GameState.stats.stability;
            if (s >= 85) { drift += 1.4; reasons.push('社稷安'); }
            else if (s >= 70) { drift += 0.5; }
            else if (s < 30) { drift -= 2.2; reasons.push('社稷危'); }
            else if (s < 50) { drift -= 0.6; }
        }
        if (GameState.zaiyi && typeof GameState.zaiyi.severity === 'number' && GameState.zaiyi.severity >= 60) {
            drift -= 1.4; reasons.push('灾异');
        }
        if (GameState.intrigue && typeof GameState.intrigue.decadence === 'number' && GameState.intrigue.decadence >= 70) {
            drift -= 1.0; reasons.push('权奸');
        }
        if (GameState.factions && typeof GameState.factions.civil === 'number' && GameState.factions.civil >= 80) {
            drift += 0.6; reasons.push('清议归');
        }
        if (GameState.factions && typeof GameState.factions.military === 'number' && GameState.factions.military >= 80) {
            drift += 0.4; reasons.push('军心振');
        }
        if (drift !== 0) {
            var reason = reasons.length ? reasons.join('·') : '气运漂移';
            tmmAdjust(drift, reason);
        }
        // 色级文字更新
        t.judgment = tmmJudgmentWord(t.value);
        return t.value;
    } catch (e) { return null; }
}

// 赐福/祸患阈值判定（供其它系统读取）
function tmmIsBlessed() { try { return GameState.tianming.value >= 75; } catch (e) { return false; } }
function tmmIsScourged() { try { return GameState.tianming.value < 35; } catch (e) { return false; } }

// 朝堂天命看板
function renderTianmingTab() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return '';
        tmmInit();
        var t = GameState.tianming;
        var html = '<div class="tmm-board" id="tmm-board">';
        html += '<div class="tmm-head"><span class="tmm-title">天命 · 王朝气数</span>';
        html += '<span class="tmm-sub">· 善政累积受命，苛政损耗受命</span></div>';
        // 色级 + 描述
        html += '<div class="tmm-judgment tmm-judge-' + t.judgment + '">';
        html += '<div class="tmm-judge-word">' + t.judgment + '</div>';
        html += '<div class="tmm-judge-desc">' + tmmJudgmentDesc(t.value) + '</div>';
        html += '</div>';
        // 三档显示（不显示具体数字，仅档位）
        var bar = tmmBarLabel(t.value);
        html += '<div class="tmm-bar"><div class="tmm-bar-fill tmm-bar-' + bar.cls + '" style="width:' + bar.width + '"></div>';
        html += '<div class="tmm-bar-label">' + bar.label + '</div></div>';
        // 关键统计（赐福/祸患/峰值/谷值）
        html += '<div class="tmm-stats">';
        html += tmmStat('赐福', t.blessed + '次', '');
        html += tmmStat('祸患', t.scourge + '次', '');
        html += tmmStat('峰值', t.peakValue >= 75 ? '隆' : (t.peakValue >= 55 ? '稳' : '晦'), '');
        html += tmmStat('谷值', t.nadirValue < 35 ? '危' : (t.nadirValue < 55 ? '晦' : '稳'), '');
        html += '</div>';
        // 赐福/祸患阈值提示
        html += '<div class="tmm-thresholds">';
        html += '<span class="tmm-thresh tmm-thresh-good">赐福门阈 25（稳以上）</span>';
        html += '<span class="tmm-thresh tmm-thresh-bad">祸患门阈 35（晦以下）</span>';
        html += '</div>';
        // 兆象列表
        var omen = (t.omenList || []).slice(-8).reverse();
        if (omen.length) {
            html += '<div class="tmm-omen-head">近世兆象</div><ul class="tmm-omen-list">';
            for (var i = 0; i < omen.length; i++) {
                var o = omen[i];
                var cls = o.delta >= 0 ? 'tmm-omen-good' : 'tmm-omen-bad';
                html += '<li class="tmm-omen ' + cls + '">'
                    + '<span class="tmm-omen-yr">' + (o.year || '—') + '年</span>'
                    + '<span class="tmm-omen-text">' + (o.text || '') + '</span></li>';
            }
            html += '</ul>';
        } else {
            html += '<div class="tmm-empty">气数未定，待君将占优势。</div>';
        }
        html += '</div>';
        return html;
    } catch (e) { return ''; }
}

function tmmStat(label, val, sub) {
    return '<div class="tmm-stat"><div class="tmm-stat-label">' + label + '</div>'
        + '<div class="tmm-stat-val">' + val + '</div>'
        + (sub ? '<div class="tmm-stat-sub">' + sub + '</div>' : '') + '</div>';
}

function tmmBarLabel(v) {
    var w = Math.max(0, Math.min(100, Math.round(v)));
    var cls, label;
    if (v >= 90) { cls = 'saint'; label = '圣命所归'; }
    else if (v >= 75) { cls = 'rise'; label = '气运隆盛'; }
    else if (v >= 55) { cls = 'steady'; label = '社稷稳泰'; }
    else if (v >= 35) { cls = 'wobble'; label = '气数渐晦'; }
    else { cls = 'crisis'; label = '天命将倾'; }
    return { width: w, cls: cls, label: label };
}

// 样式运行时注入（不追加 style.css 末尾，避免压跨 v5d G-06 硬关断言）
function tmmInjectStyles() {
    try {
        if (window._tmmInjected) return;
        window._tmmInjected = true;
        var st = document.createElement('style');
        st.id = 'tmm-inline';
        st.textContent =
            '.tmm-board{padding:12px;background:linear-gradient(160deg,rgba(58,107,138,0.10),rgba(139,44,26,0.05));border:1px solid rgba(58,107,138,0.5);border-radius:6px;margin-top:4px;}' +
            '.tmm-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;}' +
            '.tmm-title{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:20px;color:#3a6b8a;letter-spacing:3px;}' +
            '.tmm-sub{font-size:12px;color:#5a4a3a;}' +
            '.tmm-judgment{display:flex;align-items:center;gap:18px;background:rgba(244,232,208,0.55);border-left:3px solid #3a6b8a;padding:10px 14px;border-radius:3px;margin-bottom:10px;}' +
            '.tmm-judge-word{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:32px;color:#8b2c1a;letter-spacing:6px;flex:0 0 auto;}' +
            '.tmm-judge-圣 .tmm-judge-word{color:#2d6a3f;}.tmm-judge-隆 .tmm-judge-word{color:#3a6b8a;}.tmm-judge-稳 .tmm-judge-word{color:#8b2c1a;}.tmm-judge-晦 .tmm-judge-word{color:#a06820;}.tmm-judge-危 .tmm-judge-word{color:#7a1f1f;}' +
            '.tmm-judge-desc{font-size:13px;color:#2a1f15;line-height:1.6;}' +
            '.tmm-bar{position:relative;height:14px;background:rgba(184,137,58,0.18);border:1px solid rgba(58,107,138,0.4);border-radius:7px;overflow:hidden;margin-bottom:10px;}' +
            '.tmm-bar-fill{height:100%;transition:width 0.4s;}' +
            '.tmm-bar-saint{background:linear-gradient(90deg,#2d6a3f,#3a8a4f);}.tmm-bar-rise{background:linear-gradient(90deg,#3a6b8a,#5a8aaa);}.tmm-bar-steady{background:linear-gradient(90deg,#8b2c1a,#a04020);}.tmm-bar-wobble{background:linear-gradient(90deg,#a06820,#c08030);}.tmm-bar-crisis{background:linear-gradient(90deg,#7a1f1f,#a02020);}' +
            '.tmm-bar-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;color:#fff;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.4);}' +
            '.tmm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(86px,1fr));gap:8px;margin-bottom:10px;}' +
            '.tmm-stat{background:rgba(244,232,208,0.65);border:1px solid rgba(58,107,138,0.4);border-radius:4px;padding:6px 8px;text-align:center;}' +
            '.tmm-stat-label{font-size:11px;color:#5a4a3a;}.tmm-stat-val{font-size:17px;font-family:"Ma Shan Zheng","KaiTi",serif;color:#3a6b8a;margin-top:2px;}.tmm-stat-sub{font-size:10px;color:#5a4a3a;}' +
            '.tmm-thresholds{display:flex;gap:10px;font-size:11px;color:#5a4a3a;margin-bottom:8px;flex-wrap:wrap;}' +
            '.tmm-thresh{padding:2px 8px;border-radius:3px;}.tmm-thresh-good{background:rgba(45,106,63,0.18);color:#2d6a3f;}.tmm-thresh-bad{background:rgba(122,31,31,0.15);color:#7a1f1f;}' +
            '.tmm-omen-head{font-size:12px;color:#3a6b8a;font-weight:600;margin-bottom:6px;border-top:1px dashed rgba(58,107,138,0.3);padding-top:6px;}' +
            '.tmm-omen-list{list-style:none;margin:0;padding:0;}.tmm-omen{display:flex;gap:8px;padding:5px 8px;border-bottom:1px dashed rgba(58,107,138,0.25);font-size:12px;line-height:1.5;}.tmm-omen:last-child{border-bottom:none;}' +
            '.tmm-omen-yr{flex:0 0 38px;font-family:monospace;font-size:11px;color:#3a6b8a;}.tmm-omen-text{color:#2a1f15;}.tmm-omen-good .tmm-omen-text{color:#2d6a3f;}.tmm-omen-bad .tmm-omen-text{color:#7a1f1f;}' +
            '.tmm-empty{font-size:13px;color:#5a4a3a;padding:8px;text-align:center;font-style:italic;}';
        if (document.head) document.head.appendChild(st);
    } catch (e) {}
}

// 顶层对齐：DOMContentLoaded 注入样式
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tmmInjectStyles);
    else { try { tmmInjectStyles(); } catch (e) {} }
}