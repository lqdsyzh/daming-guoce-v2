// ============================================================
// 《大明国策》v6.5 批K · 起居注（在位实录 / 青史留名）
// 反爽游哲学：史笔如铁，帝王功过皆有记——治世留贤名，乱政遗臭名；
// 玩家可通过善政/恶政积累史评，影响庙谥青史评价（体验界面+玩法纵深+经营功过总结）。
// 全部符号带 QZJ_/qzj 前缀，独立追加式，不触碰既有关键逻辑。
// 史据：《明史》职官志·翰林院起居注；太史令掌天文历数、记录帝王言动。
// 注意：本文件使用顶层 function 声明（与 map_province 等批一致），
//       保证 script.js 裸调用 qzjInit/qzjTick 在浏览器与 vm 测试全局均可见。
// ============================================================
function qzjInit() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        if (!GameState.qizhuji || typeof GameState.qizhuji !== 'object') {
            GameState.qizhuji = {
                started: true,
                years: [],
                stats: {
                    reignYears: 0,
                    goodActs: 0,
                    badActs: 0,
                    stabilityPeak: 0,
                    treasuryPeak: 0,
                    heirCount: 0,
                    warsWon: 0,
                    edictsIssued: 0,
                    memorialsHandled: 0
                },
                historyRating: 0,
                chronicleMark: '',
                lastTick: -1
            };
        }
        qzjEnsure(GameState.qizhuji);
    } catch (e) {}
}

function qzjEnsure(q) {
    try {
        if (!q) return;
        if (!q.years) q.years = [];
        if (!q.stats) q.stats = { reignYears: 0, goodActs: 0, badActs: 0, stabilityPeak: 0, treasuryPeak: 0, heirCount: 0, warsWon: 0, edictsIssued: 0, memorialsHandled: 0 };
        if (typeof q.historyRating !== 'number') q.historyRating = 0;
        if (typeof q.chronicleMark !== 'string') q.chronicleMark = '';
        if (typeof q.lastTick !== 'number') q.lastTick = -1;
    } catch (e) {}
}

// 记录一条起居注（供任意系统调用，带 tag 分类，重复事件按季去重降噪）
function qzjNote(year, season, title, desc, tag) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        qzjInit();
        var q = GameState.qizhuji;
        var st = q.stats;
        var key = year + '-' + season + '|' + title;
        if (q._lastKey === key) return;
        q._lastKey = key;
        q.years.push({ year: year, season: season, title: title, desc: desc || '', tag: tag || 'neutral' });
        if (q.years.length > 120) q.years.shift();
        st.reignYears++;
        if (tag === 'good') st.goodActs++;
        if (tag === 'bad') st.badActs++;
        var delta = (tag === 'good') ? 1.6 : (tag === 'bad') ? -2.4 : 0;
        q.historyRating = Math.max(0, Math.min(100, q.historyRating + delta));
        if (GameState.stats) {
            if (typeof GameState.stats.stability === 'number' && GameState.stats.stability > st.stabilityPeak) st.stabilityPeak = GameState.stats.stability;
            if (typeof GameState.stats.treasury === 'number' && GameState.stats.treasury > st.treasuryPeak) st.treasuryPeak = GameState.stats.treasury;
        }
        qzjUpdateMark(q);
        if (typeof GameState.saveGame === 'function') { try { GameState.saveGame(); } catch (e) {} }
    } catch (e) {}
}

function qzjCount(tag) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        qzjInit(); var q = GameState.qizhuji;
        var st = q.stats;
        if (tag === 'good') st.goodActs++;
        if (tag === 'bad') st.badActs++;
        var delta = (tag === 'good') ? 1.6 : (tag === 'bad') ? -2.4 : 0;
        q.historyRating = Math.max(0, Math.min(100, q.historyRating + delta));
        qzjUpdateMark(q);
    } catch (e) {}
}

// 阶段化庙谥评价（"青史留名"的反爽张力）
function qzjUpdateMark(q) {
    try {
        if (!q) return;
        var r = q.historyRating;
        var mark;
        if (r >= 85) mark = '颂曰：圣德宏施，功昭万世，足以为天下法。';
        else if (r >= 70) mark = '称曰：仁贤之主，勤政爱民，多善政，国赖以安。';
        else if (r >= 55) mark = '评曰：中平之君，有善有失，治效时有反复，朝议纷纭。';
        else if (r >= 40) mark = '讥曰：政多苛酷，民怨渐积，言官屡谏而弗改，耻之。';
        else mark = '贬曰：德凉政虐，海内侧目，社稷之危其殆哉！';
        var yrs = Math.floor(q.stats.reignYears / 4);
        if (yrs > 0) mark += ' · 在位' + yrs + '年。';
        q.chronicleMark = mark;
    } catch (e) {}
}

// 每季巡检：从既有系统自动沉淀起居注条目（只读判断，不重复调 saveGame 造成写放大）
function qzjTick() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        qzjInit();
        var q = GameState.qizhuji;
        var nowTick = (typeof GameState.tick === 'number') ? GameState.tick :
            ((typeof GameState.currentSeason === 'number') ? GameState.currentSeason : 0);
        if (q.lastTick === nowTick) return;
        q.lastTick = nowTick;
        var y = GameState.currentYear, sea = (typeof GameState.currentSeason === 'number') ? GameState.currentSeason : 0;
        if (GameState.stats && typeof GameState.stats.stability === 'number') {
            if (GameState.stats.stability < 25) qzjNote(y, sea, '社稷动摇', '民心离散，稳定度骤降至' + Math.round(GameState.stats.stability) + '，朝野震恐。', 'bad');
            else if (GameState.stats.stability > 85) qzjNote(y, sea, '海内昇平', '社稷稳固，万民归心。', 'good');
        }
        if (GameState.stats && typeof GameState.stats.treasury === 'number' && GameState.stats.treasury < 0) {
            qzjNote(y, sea, '府库告罄', '国库空虚，度支维艰。', 'bad');
        }
        if (GameState.intrigue && typeof GameState.intrigue.decadence === 'number' && GameState.intrigue.decadence > 70) {
            qzjNote(y, sea, '权奸窃柄', '朋党势炽，朝纲日紊。', 'bad');
        }
        qzjUpdateMark(q);
    } catch (e) {}
}

// 首页看板（并入 overview）
function renderQizhujiZone() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return '';
        qzjInit();
        var q = GameState.qizhuji;
        var st = q.stats || {};
        var yrs = Math.floor(st.reignYears / 4);
        var html = '<div class="qzj-board" id="qzj-board">';
        html += '<div class="qzj-head"><span class="qzj-title">起居注 · 在位实录</span>';
        html += '<span class="qzj-sub">· 史笔如铁，功过皆录</span></div>';
        html += '<div class="qzj-mark">' + (q.chronicleMark || '初登大宝，史笔未定。') + '</div>';
        html += '<div class="qzj-stats">';
        html += qzjStat('在位', yrs + '年', '');
        html += qzjStat('史评', Math.round(q.historyRating) + '', '·' + qzjRatingWord(q.historyRating));
        html += qzjStat('善政', st.goodActs || 0, '');
        html += qzjStat('劣政', st.badActs || 0, '');
        html += qzjStat('国库峰值', (st.treasuryPeak || 0) + '两', '');
        html += '</div>';
        var recent = (q.years || []).slice(-6).reverse();
        if (recent.length) {
            html += '<ul class="qzj-list">';
            for (var i = 0; i < recent.length; i++) {
                var e = recent[i];
                html += '<li class="qzj-item qzj-' + (e.tag || 'neutral') + '">'
                    + '<span class="qzj-yr">' + (e.year || '—') + '</span>'
                    + '<span class="qzj-t">' + (e.title || '') + '</span>'
                    + '<span class="qzj-d">' + (e.desc || '') + '</span></li>';
            }
            html += '</ul>';
        } else {
            html += '<div class="qzj-empty">史笔初开，待君开一代之治。</div>';
        }
        html += '</div>';
        return html;
    } catch (e) { return ''; }
}

function qzjStat(label, val, sub) {
    return '<div class="qzj-stat"><div class="qzj-stat-label">' + label + '</div>'
        + '<div class="qzj-stat-val">' + val + '</div>'
        + (sub ? '<div class="qzj-stat-sub">' + sub + '</div>' : '') + '</div>';
}

function qzjRatingWord(r) {
    if (r >= 85) return '圣明';
    if (r >= 70) return '贤达';
    if (r >= 55) return '中平';
    if (r >= 40) return '苛酷';
    return '昏聩';
}

// 样式运行时注入（不追加 style.css 末尾，避免压跨 v5d G-06 硬关断言）
function qzjInjectStyles() {
    try {
        if (window._qzjInjected) return;
        window._qzjInjected = true;
        var st = document.createElement('style');
        st.id = 'qzj-inline';
        st.textContent =
            '.qzj-board{padding:12px;background:linear-gradient(160deg,rgba(184,137,58,0.10),rgba(139,44,26,0.06));border:1px solid rgba(184,137,58,0.5);border-radius:6px;margin-top:4px;}' +
            '.qzj-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;}' +
            '.qzj-title{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:20px;color:var(--accent-gold,#b8893a);letter-spacing:3px;}' +
            '.qzj-sub{font-size:12px;color:var(--ink-light,#5a4a3a);}' +
            '.qzj-mark{font-size:14px;line-height:1.7;color:var(--ink,#2a1f15);background:rgba(184,137,58,0.10);border-left:3px solid var(--accent-gold,#b8893a);padding:6px 10px;margin-bottom:10px;border-radius:2px;}' +
            '.qzj-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;margin-bottom:10px;}' +
            '.qzj-stat{background:rgba(244,232,208,0.65);border:1px solid rgba(184,137,58,0.4);border-radius:4px;padding:6px 8px;text-align:center;}' +
            '.qzj-stat-label{font-size:11px;color:var(--ink-light,#5a4a3a);}' +
            '.qzj-stat-val{font-size:18px;font-family:"Ma Shan Zheng","KaiTi",serif;color:var(--accent-red,#8b2c1a);margin-top:2px;}' +
            '.qzj-stat-sub{font-size:10px;color:var(--ink-light,#5a4a3a);}' +
            '.qzj-list{list-style:none;margin:0;padding:0;}' +
            '.qzj-item{display:flex;align-items:center;gap:8px;padding:5px 8px;border-bottom:1px dashed rgba(184,137,58,0.25);font-size:13px;line-height:1.5;}' +
            '.qzj-item:last-child{border-bottom:none;}' +
            '.qzj-yr{flex:0 0 34px;font-family:monospace;font-size:12px;color:var(--accent-gold,#b8893a);}' +
            '.qzj-t{flex:0 0 auto;font-weight:600;color:var(--ink,#2a1f15);}' +
            '.qzj-d{color:var(--ink-light,#5a4a3a);}' +
            '.qzj-good .qzj-t{color:#2d6a3f;}' +
            '.qzj-bad .qzj-t{color:#a0261a;}' +
            '.qzj-empty{font-size:13px;color:var(--ink-light,#5a4a3a);padding:8px;text-align:center;font-style:italic;}';
        if (document.head) document.head.appendChild(st);
    } catch (e) {}
}

// 顶层对齐：DOMContentLoaded 注入样式
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', qzjInjectStyles);
    else { try { qzjInjectStyles(); } catch (e) {} }
}