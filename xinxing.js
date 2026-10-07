// ============================================================
// 《大明国策》v6.6 批L-乙 · 皇帝心性养成（仁/严/勇/谋 四向）
// 反爽游哲学：帝王性格由决策累积——不可重置，养成决定论。
// 仁：爱民养士；严：重典肃纪；赋：决策勇猛；决：谋远权重。
// 心性影响：诏书效果、紧急处变应对、派系反应、起居注评价。
// 全部符号带 XX_/xx 前缀，独立追加式，不触碰既有关键逻辑。
// 史据：《明史·本纪》各帝御极条目风格侧写；《大学》"修身齐家治国平天下"。
// 注意：本文件使用顶层 function 声明（与 qiuzhuji.js 等批一致）。
// ============================================================

// 心性档位（基于0-100四向分值，按主导项取档）
var XX_TRAITS = [
    { key: 'ren', label: '仁', desc: '宽和爱民' },
    { key: 'yan', label: '严', desc: '重典肃纪' },
    { key: 'yong', label: '勇', desc: '英武果决' },
    { key: 'mou', label: '谋', desc: '深谋远虑' }
];

function xxInit() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        if (!GameState.xinxing || typeof GameState.xinxing !== 'object') {
            GameState.xinxing = {
                ren: 50,      // 仁（爱民养士）
                yan: 50,      // 严（重典肃纪）
                yong: 50,     // 勇（英武果决）
                mou: 50,      // 谋（深谋远虑）
                acts: [],     // 关键心性决策（最多 60 条）
                lastTick: -1,
                _lastKey: null
            };
        }
        xxEnsure(GameState.xinxing);
    } catch (e) {}
}

function xxEnsure(x) {
    try {
        if (!x) return;
        if (typeof x.ren !== 'number') x.ren = 50;
        if (typeof x.yan !== 'number') x.yan = 50;
        if (typeof x.yong !== 'number') x.yong = 50;
        if (typeof x.mou !== 'number') x.mou = 50;
        if (!Array.isArray(x.acts)) x.acts = [];
        if (typeof x.lastTick !== 'number') x.lastTick = -1;
    } catch (e) {}
}

// 调整心性（限幅 0-100）
function xxAdjust(deltas, reason) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        xxInit();
        var x = GameState.xinxing;
        if (!deltas || typeof deltas !== 'object') return null;
        var keys = ['ren', 'yan', 'yong', 'mou'];
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (typeof deltas[k] === 'number') {
                x[k] = Math.max(0, Math.min(100, x[k] + deltas[k]));
            }
        }
        // 记录关键决策（变化量>3 才记）
        var total = (Math.abs(deltas.ren || 0) + Math.abs(deltas.yan || 0) +
                     Math.abs(deltas.yong || 0) + Math.abs(deltas.mou || 0));
        if (total >= 3 && reason) {
            var key = (GameState.currentYear || 0) + '-' + (GameState.currentSeason || 0) + '|' + reason;
            if (x._lastKey !== key) {
                x._lastKey = key;
                x.acts.push({
                    year: GameState.currentYear || 0,
                    season: GameState.currentSeason || 0,
                    reason: reason,
                    delta: { ren: deltas.ren || 0, yan: deltas.yan || 0, yong: deltas.yong || 0, mou: deltas.mou || 0 }
                });
                if (x.acts.length > 60) x.acts.shift();
            }
        }
        return x;
    } catch (e) { return null; }
}

// 主导性格（返最高项 key）
function xxDominant() {
    try {
        var x = GameState.xinxing;
        var keys = XX_TRAITS;
        var best = keys[0], bestVal = x.ren;
        if (x.yan > bestVal) { best = keys[1]; bestVal = x.yan; }
        if (x.yong > bestVal) { best = keys[2]; bestVal = x.yong; }
        if (x.mou > bestVal) { best = keys[3]; bestVal = x.mou; }
        return best;
    } catch (e) { return XX_TRAITS[0]; }
}

// 性格差反馈（取某项分值的形容词）：>70 仁/严/勇/谋圣，<30 仁/严/勇/谋缺
function xxLevelWord(v) {
    if (typeof v !== 'number') return '';
    if (v >= 85) return '至圣';
    if (v >= 70) return '深';
    if (v >= 55) return '中';
    if (v >= 40) return '浅';
    return '缺';
}

// 每季 tick（只巡检，不主动调；除非被策划主动接入决策系统）
function xxTick() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        xxInit();
        var x = GameState.xinxing;
        var nowTick = (typeof GameState.tick === 'number') ? GameState.tick :
            ((GameState.currentYear * 4) + (GameState.currentSeason || 0));
        if (x.lastTick === nowTick) return;
        x.lastTick = nowTick;
        return x;
    } catch (e) { return null; }
}

// 心性加成（供诏书/紧急处变使用）：返回修饰参数
function xxEdictMod(key) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return 1;
        var x = GameState.xinxing;
        if (!x) return 1;
        var v = x[key];
        if (typeof v !== 'number') return 1;
        // 70+ 加成 +25%，30- 减益 -20%
        if (v >= 70) return 1.25;
        if (v < 30) return 0.8;
        return 1;
    } catch (e) { return 1; }
}

// 心性看板
function renderXinxingTab() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return '';
        xxInit();
        var x = GameState.xinxing;
        var dom = xxDominant();
        var html = '<div class="xx-board" id="xx-board">';
        html += '<div class="xx-head"><span class="xx-title">心性 · 帝王四向</span>';
        html += '<span class="xx-sub">· 御极久矣，君德四向渐成</span></div>';
        // 主导性格牌
        html += '<div class="xx-dominant"><span class="xx-dominant-label">主性</span>';
        html += '<span class="xx-dominant-key xx-key-' + dom.key + '">' + dom.label + '</span>';
        html += '<span class="xx-dominant-desc">' + dom.desc + '</span></div>';
        // 四向分值表
        html += '<div class="xx-grid">';
        html += xxGridItem('ren', '仁', '宽和爱民、礼贤下士', x.ren);
        html += xxGridItem('yan', '严', '重典肃纪、赏罚分明', x.yan);
        html += xxGridItem('yong', '勇', '英武果决、挥军征伐', x.yong);
        html += xxGridItem('mou', '谋', '深谋远虑、庙算无遗', x.mou);
        html += '</div>';
        // 决策点列表
        var acts = (x.acts || []).slice(-8).reverse();
        if (acts.length) {
            html += '<div class="xx-act-head">近期心迹</div><ul class="xx-act-list">';
            for (var i = 0; i < acts.length; i++) {
                var a = acts[i];
                html += '<li class="xx-act-item">'
                    + '<span class="xx-act-yr">' + (a.year || '—') + '年</span>'
                    + '<span class="xx-act-reason">' + (a.reason || '') + '</span>'
                    + '<span class="xx-act-delta">'
                    + xxDeltaChip('仁', a.delta.ren)
                    + xxDeltaChip('严', a.delta.yan)
                    + xxDeltaChip('勇', a.delta.yong)
                    + xxDeltaChip('谋', a.delta.mou)
                    + '</span></li>';
            }
            html += '</ul>';
        } else {
            html += '<div class="xx-empty">主上初御极，四向未分。</div>';
        }
        // 诏书加成提示
        html += '<div class="xx-mod">';
        html += '<div class="xx-mod-head">诏书与处变加成</div>';
        html += '<div class="xx-mod-grid">';
        html += xxModChip('仁', '减税赈济效果', x.ren);
        html += xxModChip('严', '吏治整饬效果', x.yan);
        html += xxModChip('勇', '军务决断效果', x.yong);
        html += xxModChip('谋', '庙算情报效果', x.mou);
        html += '</div></div>';
        html += '</div>';
        return html;
    } catch (e) { return ''; }
}

function xxGridItem(key, label, desc, v) {
    var word = xxLevelWord(v);
    var cls = 'xx-mid';
    if (v >= 70) cls = 'xx-high';
    else if (v < 30) cls = 'xx-low';
    return '<div class="xx-cell xx-key-' + key + ' ' + cls + '">'
        + '<div class="xx-cell-key">' + label + '</div>'
        + '<div class="xx-cell-word">' + word + '</div>'
        + '<div class="xx-cell-bar"><div class="xx-cell-bar-fill" style="width:' + Math.max(0, Math.min(100, v)) + '%"></div></div>'
        + '<div class="xx-cell-desc">' + desc + '</div>'
        + '</div>';
}

function xxDeltaChip(label, d) {
    if (!d || d === 0) return '';
    var sign = d > 0 ? '+' : '';
    return '<span class="xx-chip xx-chip-' + (d > 0 ? 'up' : 'down') + '">' + label + sign + d + '</span>';
}

function xxModChip(key, label, v) {
    var mod = xxEdictMod(key);
    var cls = mod > 1 ? 'xx-mod-up' : (mod < 1 ? 'xx-mod-down' : 'xx-mod-mid');
    return '<div class="xx-mod-chip ' + cls + '">'
        + '<div class="xx-mod-label">' + label + '</div>'
        + '<div class="xx-mod-rate">' + (mod > 1 ? '+25%' : (mod < 1 ? '-20%' : '0')) + '</div>'
        + '<div class="xx-mod-val">心性 ' + Math.round(v) + '</div></div>';
}

// 样式运行时注入（不追加 style.css 末尾）
function xxInjectStyles() {
    try {
        if (window._xxInjected) return;
        window._xxInjected = true;
        var st = document.createElement('style');
        st.id = 'xx-inline';
        st.textContent =
            '.xx-board{padding:12px;background:linear-gradient(160deg,rgba(58,138,90,0.10),rgba(184,137,58,0.06));border:1px solid rgba(58,138,90,0.5);border-radius:6px;margin-top:4px;}' +
            '.xx-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;}' +
            '.xx-title{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:20px;color:#3a8a5a;letter-spacing:3px;}' +
            '.xx-sub{font-size:12px;color:#5a4a3a;}' +
            '.xx-dominant{display:flex;align-items:center;gap:10px;background:rgba(244,232,208,0.65);border-left:3px solid #3a8a5a;padding:8px 14px;border-radius:3px;margin-bottom:10px;}' +
            '.xx-dominant-label{font-size:12px;color:#5a4a3a;}.xx-dominant-key{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:28px;letter-spacing:6px;}.xx-key-ren .xx-dominant-key{color:#8b2c1a;}.xx-key-yan .xx-dominant-key{color:#5a2f0f;}.xx-key-yong .xx-dominant-key{color:#a0261a;}.xx-key-mou .xx-dominant-key{color:#3a6b8a;}' +
            '.xx-dominant-desc{font-size:13px;color:#2a1f15;}' +
            '.xx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px;}' +
            '.xx-cell{background:rgba(244,232,208,0.65);border:1px solid rgba(58,138,90,0.4);border-radius:5px;padding:8px 10px;}' +
            '.xx-cell-key{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:18px;color:#3a8a5a;display:inline-block;margin-right:8px;}' +
            '.xx-cell-word{font-size:11px;color:#5a4a3a;display:inline-block;}.xx-high .xx-cell-word{color:#2d6a3f;}.xx-low .xx-cell-word{color:#7a1f1f;}' +
            '.xx-cell-bar{height:6px;background:rgba(58,138,90,0.18);border-radius:3px;overflow:hidden;margin:6px 0;}' +
            '.xx-cell-bar-fill{height:100%;background:linear-gradient(90deg,#3a8a5a,#5aaa7a);}' +
            '.xx-cell-desc{font-size:11px;color:#5a4a3a;line-height:1.4;}' +
            '.xx-act-head{font-size:12px;color:#3a8a5a;font-weight:600;margin-bottom:6px;border-top:1px dashed rgba(58,138,90,0.3);padding-top:6px;}' +
            '.xx-act-list{list-style:none;margin:0;padding:0;}.xx-act-item{display:flex;gap:8px;padding:5px 8px;border-bottom:1px dashed rgba(58,138,90,0.25);font-size:12px;line-height:1.5;flex-wrap:wrap;}' +
            '.xx-act-item:last-child{border-bottom:none;}.xx-act-yr{flex:0 0 38px;font-family:monospace;font-size:11px;color:#3a8a5a;}.xx-act-reason{flex:1 1 auto;color:#2a1f15;}.xx-act-delta{flex:0 0 auto;display:flex;gap:3px;flex-wrap:wrap;}' +
            '.xx-chip{display:inline-block;padding:1px 5px;border-radius:2px;font-size:10px;font-weight:600;}.xx-chip-up{background:rgba(45,106,63,0.18);color:#2d6a3f;}.xx-chip-down{background:rgba(122,31,31,0.15);color:#7a1f1f;}' +
            '.xx-empty{font-size:13px;color:#5a4a3a;padding:8px;text-align:center;font-style:italic;}' +
            '.xx-mod{border-top:1px dashed rgba(58,138,90,0.3);padding-top:8px;}.xx-mod-head{font-size:12px;color:#3a8a5a;font-weight:600;margin-bottom:6px;}' +
            '.xx-mod-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;}' +
            '.xx-mod-chip{padding:6px 8px;border-radius:4px;text-align:center;}' +
            '.xx-mod-up{background:rgba(45,106,63,0.18);border:1px solid rgba(45,106,63,0.5);}.xx-mod-mid{background:rgba(184,137,58,0.18);border:1px solid rgba(184,137,58,0.4);}.xx-mod-down{background:rgba(122,31,31,0.15);border:1px solid rgba(122,31,31,0.4);}' +
            '.xx-mod-label{font-size:11px;color:#2a1f15;}.xx-mod-rate{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:18px;color:#3a8a5a;margin:2px 0;}.xx-mod-up .xx-mod-rate{color:#2d6a3f;}.xx-mod-down .xx-mod-rate{color:#7a1f1f;}.xx-mod-val{font-size:10px;color:#5a4a3a;}';
        if (document.head) document.head.appendChild(st);
    } catch (e) {}
}

// 顶层对齐：DOMContentLoaded 注入样式
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', xxInjectStyles);
    else { try { xxInjectStyles(); } catch (e) {} }
}