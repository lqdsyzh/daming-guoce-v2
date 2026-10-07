// ============================================
// 《大明国策》v5.0 批D · 界面/立绘升级（收官）
// 纯前端零依赖；全部新逻辑 try-catch 守卫；只动视觉层不动数值/逻辑
// edict 永久DOM 不动；style.css 只追加末尾
// 立绘用 inline SVG 内联绘制（积分不足时替代 PNG 素材，不依赖图片文件）
// 包装既有函数：先存原引用(匿名/赋值模式)，再以具名函数覆盖全局——
//   关键：必须沿用既有 "var _orig=X; X=function(){}" 模式，
//   不得用 function 声明覆盖，否则 hoisting 会在捕获原引用之前就把全局替换掉。
// ============================================

// ---------- D2 立绘 SVG 生成器 ----------
// 按大臣类型(civil/military/eunuch/royal/consort) 生成写实国风冠服半身剪影
var D5 = (function () {
    function svgURI(svg) { try { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); } catch (e) { return ''; } }
    function portraitSVG(cat) {
        var robe, cin, wing, crest, patch, faceTint, glow;
        if (cat === 'military') { robe = '#8a5a2b'; cin = '#2b2b2b'; wing = '#5a4a3a'; crest = '#c0392b'; patch = '#7d3c1f'; faceTint = '#e8b98a'; glow = '#b8893a'; }
        else if (cat === 'eunuch') { robe = '#7d1f1f'; cin = '#1f1f1f'; wing = '#3a3a3a'; crest = '#1f1f1f'; patch = '#8b2c1a'; faceTint = '#f0d9bd'; glow = '#b8893a'; }
        else if (cat === 'royal') { robe = '#c9a23a'; cin = '#1a1a1a'; wing = '#c9a23a'; crest = '#1a1a1a'; patch = '#8b2c1a'; faceTint = '#f0d9bd'; glow = '#e8c86a'; }
        else { robe = '#7d4a8a'; cin = '#2a2a2a'; wing = '#1f1f1f'; crest = '#1f1f1f'; patch = '#4a7d6a'; faceTint = '#e8c091'; glow = '#b8893a'; }
        var hat;
        if (cat === 'civil') {
            hat = '<rect x="58" y="40" width="124" height="34" rx="8" fill="' + cin + '"/>' +
                  '<rect x="30" y="52" width="26" height="8" rx="3" fill="' + cin + '"/>' +
                  '<rect x="184" y="52" width="26" height="8" rx="3" fill="' + cin + '"/>' +
                  '<rect x="52" y="66" width="136" height="12" rx="4" fill="#1f1f1f"/>';
        } else if (cat === 'military') {
            hat = '<path d="M60 74 Q64 30 120 26 Q176 30 180 74 L172 62 Q120 50 68 62 Z" fill="#3a3a3a"/>' +
                  '<path d="M120 22 Q128 26 124 34 L112 34 Q112 24 120 22 Z" fill="#c0392b"/>' +
                  '<ellipse cx="120" cy="40" rx="10" ry="6" fill="#b8893a"/>';
        } else if (cat === 'eunuch') {
            hat = '<path d="M96 64 Q108 34 120 34 Q136 34 144 60 Q136 74 120 74 Q108 72 96 64 Z" fill="#3a3a3a"/>' +
                  '<rect x="96" y="70" width="48" height="6" rx="2" fill="#1f1f1f"/>';
        } else {
            hat = '<path d="M72 66 Q78 36 120 32 Q162 36 168 64 Q164 76 120 78 Q80 76 72 66 Z" fill="' + cin + '"/>' +
                  '<path d="M88 40 L120 24 L152 40" stroke="' + glow + '" stroke-width="2.5" fill="none"/>';
        }
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="120" height="160">' +
            '<defs><radialGradient id="d5bg" cx="50%" cy="42%" r="72%">' +
            '<stop offset="0%" stop-color="#3a2c1c"/><stop offset="100%" stop-color="#171210"/></radialGradient></defs>' +
            '<rect x="2" y="2" width="236" height="316" rx="14" fill="url(#d5bg)" stroke="' + glow + '" stroke-width="2"/>' +
            '<rect x="9" y="9" width="222" height="302" rx="10" fill="none" stroke="rgba(184,137,58,0.4)" stroke-width="1"/>' +
            '<ellipse cx="120" cy="86" rx="34" ry="42" fill="' + faceTint + '" stroke="#b98a5a" stroke-width="1.5"/>' +
            '<path d="M106 82 q4 -6 9 0" stroke="#5a3a22" stroke-width="1.2" fill="none"/>' +
            '<path d="M125 82 q4 -6 9 0" stroke="#5a3a22" stroke-width="1.2" fill="none"/>' +
            '<path d="M114 100 h12" stroke="#5a3a22" stroke-width="1.4"/>' +
            (cat === 'military' ? '<path d="M102 128 q18 10 36 0 l-8 22 h-20 z" fill="#3a2a22"/>' : '') +
            (cat === 'civil' ? '<path d="M92 118 q28 22 56 0 l-10 18 h-36 z" fill="#3a2a22"/>' : '') +
            hat +
            '<path d="M24 320 Q40 150 60 118 Q84 150 120 148 Q156 150 180 118 Q200 150 216 320 Z" fill="' + robe + '" stroke="#000" stroke-opacity="0.25"/>' +
            '<path d="M96 128 L120 158 L144 128 L132 196 L108 196 Z" fill="' + robe + '" opacity="0.55"/>' +
            '<rect x="96" y="176" width="48" height="44" rx="4" fill="#f4e8d0" stroke="#000" stroke-opacity="0.2"/>' +
            '<rect x="100" y="180" width="40" height="36" rx="3" fill="none" stroke="#7d4a8a" stroke-opacity="0.5"/>' +
            '<path d="M60 292 Q120 272 180 292" stroke="' + glow + '" stroke-width="2" fill="none" opacity="0.7"/>' +
            '</svg>'
        );
    }
    var MAP = {
        civil: portraitSVG('civil'),
        military: portraitSVG('military'),
        eunuch: portraitSVG('eunuch'),
        royal: portraitSVG('royal'),
        consort: portraitSVG('civil')
    };
    function uri(cat) { return svgURI(MAP[cat] || MAP.civil); }
    return { uri: uri };
})();

// ---------- 各模块包装增强（沿用 var _orig + 具名函数覆盖 模式） ----------

// ==== D2 大臣立绘：包装 openTalkModal ====
var _d5_origOpenTalk = null;
if (typeof openTalkModal === 'function') { _d5_origOpenTalk = openTalkModal; }
openTalkModal = function (cat, idx) {
    if (_d5_origOpenTalk) { try { _d5_origOpenTalk(cat, idx); } catch (e) {} }
    try {
        if (!cat) return;
        var modal = document.getElementById('talk-modal');
        var paper = modal ? modal.querySelector('.talk-paper') : null;
        if (!paper) return;
        var old = paper.querySelector('.talk-portrait');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var wrap = document.createElement('div');
        wrap.className = 'talk-portrait';
        var label = (cat === 'civil' ? '文臣' : cat === 'military' ? '武将' : cat === 'eunuch' ? '宦官' : cat === 'royal' ? '宗室' : '外戚');
        wrap.innerHTML = '<img class="talk-portrait-img" alt="' + label + '立绘" src="' + D5.uri(cat) + '"/>' +
            '<div class="talk-portrait-frame"></div><div class="talk-portrait-label">朝服小像</div>';
        var body = paper.querySelector('.talk-body') || null;
        try { paper.insertBefore(wrap, body); } catch (e) { paper.appendChild(wrap); }
        wrap.classList.remove('talk-portrait-in');
        void wrap.offsetWidth;
        wrap.classList.add('talk-portrait-in');
    } catch (e) {}
};

// ==== D3 舆图升级：包装 renderMapTab ====
var _d5_origRenderMap = null;
if (typeof renderMapTab === 'function') { _d5_origRenderMap = renderMapTab; }
renderMapTab = function () {
    var html = '';
    if (_d5_origRenderMap) { try { html = _d5_origRenderMap(); } catch (e) { html = ''; } }
    try {
        var re = /<div class="map-cell([^"]*)" style="grid-row:([^;]+);grid-column:([^"]+)" onclick="openMapCellModal\('([^']+)'\)">/g;
        var byKey = {};
        try { (typeof MAP_REGIONS !== 'undefined' ? MAP_REGIONS : []).forEach(function (r) { byKey[r.key] = r; }); } catch (e) {}
        if (typeof html.replace === 'function') {
            html = html.replace(re, function (m, cls, row, col, key) {
                var r = byKey[key] || {};
                var isBorder = !!r.border;
                var glyph = isBorder ? '&#9878;' : '&#127963;';
                var glyphCls = isBorder ? 'map-fort' : 'map-city';
                var st = 0;
                try { st = (GameState.mapData && GameState.mapData.status && GameState.mapData.status[key]) || 0; } catch (e2) { st = 0; }
                var beacon = st === 2 ? ' <span class="map-beacon">&#128293;</span>' : '';
                return '<div class="map-cell' + cls + '" style="grid-row:' + row + ';grid-column:' + col + '" onclick="openMapCellModal(\'' + key + '\')" data-key="' + key + '">' +
                    '<span class="map-glyph ' + glyphCls + '">' + glyph + '</span>' +
                    '<span class="map-cell-dot"></span><span class="map-cell-name">' + (r.name || '') + '</span>' + beacon;
            });
        }
        if (typeof html.replace === 'function') {
            var deco = '<div class="map-deco"><div class="map-deco-terrain"></div><div class="map-deco-title">大明寰宇 · 两京十三布政司</div></div>';
            html = html.replace('<div class="map-grid">', deco + '<div class="map-grid">');
        }
    } catch (e) {}
    return html;
};

// ==== D4 事件急奏锦布：包装 showEvent ====
var _d5_origShowEvent = null;
if (typeof showEvent === 'function') { _d5_origShowEvent = showEvent; }
showEvent = function (event) {
    if (_d5_origShowEvent) { try { _d5_origShowEvent(event); } catch (e) {} }
    try {
        var modal = document.getElementById('event-modal');
        if (!modal) return;
        var paper = modal.querySelector('.event-paper');
        if (!paper) return;
        paper.classList.remove('event-jinbu');
        void paper.offsetWidth;
        paper.classList.add('event-jinbu');
        var type = (event && event.type) || '';
        var typeIcon = { disaster: '&#127777;', border: '&#9876;', internal: '&#129462;', economy: '&#128176;', diplomacy: '&#127760;', royal: '&#128081;' }[type] || '&#128220;';
        var oldBadge = paper.querySelector('.event-type-badge');
        if (oldBadge && oldBadge.parentNode) oldBadge.parentNode.removeChild(oldBadge);
        var badge = document.createElement('div');
        badge.className = 'event-type-badge';
        var tnames = ['天灾', '边报', '内政', '财政', '外事', '宗藩'];
        var tidx = { disaster: 0, border: 1, internal: 2, economy: 3, diplomacy: 4, royal: 5 }[type];
        badge.innerHTML = typeIcon + '<span>' + (tidx !== undefined ? tnames[tidx] : '奏报') + '</span>';
        try { paper.insertBefore(badge, paper.firstChild); } catch (e) {}
    } catch (e) {}
};

// ==== D4 战报可视化：包装 renderBattlefield ====
var _d5_origRenderBf = null;
if (typeof renderBattlefield === 'function') { _d5_origRenderBf = renderBattlefield; }
function d5ForceRows(b) {
    try {
        var rows = [];
        ['player', 'enemy'].forEach(function (side) {
            var count = (b[side].units || []).length;
            var chips = '';
            for (var i = 0; i < count && i < 12; i++) chips += '<i class="bf-force-chip ' + (side === 'player' ? 'my' : 'en') + '"></i>';
            rows.push('<div class="bf-force-row"><span class="bf-force-side">' + (side === 'player' ? '王师' : '敌阵') + '</span><span class="bf-force-chips">' + chips + '</span><span class="bf-force-count">' + count + '队</span></div>');
        });
        return rows.join('');
    } catch (e) { return ''; }
}
renderBattlefield = function () {
    if (_d5_origRenderBf) { try { _d5_origRenderBf(); } catch (e) {} }
    try {
        var body = document.getElementById('bf-body');
        if (!body) return;
        var b = null;
        try { b = typeof bfEnsure === 'function' ? bfEnsure() : null; } catch (e) {}
        if (!b || !b.player || !b.enemy) return;
        var pm = Math.max(0, Math.min(100, b.player.morale || 0));
        var em = Math.max(0, Math.min(100, b.enemy.morale || 0));
        var bar = document.createElement('div');
        bar.className = 'bf-morale-bar';
        bar.innerHTML =
            '<div class="bf-morale-row"><span class="bf-morale-label">我军</span>' +
            '<div class="bf-morale-track"><div class="bf-morale-fill bf-morale-my" style="width:' + pm + '%"></div></div>' +
            '<span class="bf-morale-num">' + pm + '</span></div>' +
            '<div class="bf-morale-row"><span class="bf-morale-label">敌军</span>' +
            '<div class="bf-morale-track"><div class="bf-morale-fill bf-morale-en" style="width:' + em + '%"></div></div>' +
            '<span class="bf-morale-num">' + em + '</span></div>' +
            '<div class="bf-forces">' + d5ForceRows(b) + '</div>';
        var box = body.querySelector('.bf-war');
        if (box) { box.insertBefore(bar, box.firstChild); }
    } catch (e) {}
};

// ==== D4 结局山河志卷轴收束：包装 triggerEnding ====
var _d5_origShowEnding = null;
if (typeof triggerEnding === 'function') { _d5_origShowEnding = triggerEnding; }
triggerEnding = function (type) {
    if (_d5_origShowEnding) { try { _d5_origShowEnding(type); } catch (e) {} }
    try {
        var modal = document.getElementById('end-modal');
        var paper = modal ? modal.querySelector('.end-paper') : null;
        if (!paper) return;
        paper.classList.remove('end-scroll-in');
        void paper.offsetWidth;
        paper.classList.add('end-scroll-in');
    } catch (e) {}
};

// ==== D4 山河志章节渲染后叠卷轴动效（包装 renderMainlineEnding）====
var _d5_origML = null;
if (typeof renderMainlineEnding === 'function') { _d5_origML = renderMainlineEnding; }
renderMainlineEnding = function () {
    var ret;
    if (_d5_origML) { try { ret = _d5_origML(); } catch (e) {} }
    try {
        var legacy = document.getElementById('end-legacy');
        if (!legacy) return ret;
        var block = legacy.querySelector('.mainline-ending');
        if (block && block.classList) {
            block.classList.remove('ml-scroll-in');
            void block.offsetWidth;
            block.classList.add('ml-scroll-in');
        }
    } catch (e) {}
    return ret;
};

// ==== D5 剧本时代色 + 点题诗：包装 renderScriptList ====
var D5_SCRIPT_VERSE = {
    chenghua: { eraCls: 'sc-chenghua', verse: '成化中兴 · 承平之业，莫废于惰。' },
    zhengde:  { eraCls: 'sc-zhengde',  verse: '正德驾嬉 · 法度纵弛，祸伏内廷。' },
    wanli:    { eraCls: 'sc-wanli',    verse: '万历三征 · 元气大伤，国本动摇。' },
    tianqi:   { eraCls: 'sc-tianqi',   verse: '天启季世 · 阉党蔽日，辽东烽急。' }
};
var _d5_origScriptList = null;
if (typeof renderScriptList === 'function') { _d5_origScriptList = renderScriptList; }
renderScriptList = function () {
    if (_d5_origScriptList) { try { _d5_origScriptList(); } catch (e) {} }
    try {
        var list = document.getElementById('script-list');
        if (!list) return;
        var opts = list.querySelectorAll('.script-option:not(.continue-option)');
        var scripts = (typeof SCRIPTS !== 'undefined') ? SCRIPTS : [];
        for (var i = 0; i < opts.length && i < scripts.length; i++) {
            var s = scripts[i];
            var meta = D5_SCRIPT_VERSE[s.id] || {};
            if (opts[i].classList) opts[i].classList.add('script-era', meta.eraCls || '');
            if (meta.verse && list.appendChild) {
                var verseEl = document.createElement('div');
                verseEl.className = 'script-verse';
                verseEl.textContent = meta.verse;
                if (opts[i].appendChild) opts[i].appendChild(verseEl);
            }
        }
    } catch (e) {}
};

// ==== D5 开局王朝开场白淡入：包装 initGame ====
var _d5_origInit = null;
if (typeof initGame === 'function') { _d5_origInit = initGame; }
initGame = function (scriptId) {
    if (_d5_origInit) { try { _d5_origInit(scriptId); } catch (e) {} }
    try {
        var meta = {};
        try {
            var sid = (GameState && GameState.script && GameState.script.id) || scriptId;
            meta = (D5_SCRIPT_VERSE[sid] || {});
            meta.name = (GameState.script && (GameState.script.name || GameState.script.era)) || '';
        } catch (e) {}
        var ov = document.getElementById('dynasty-open');
        if (!ov || !document.body) return;
        var poem = meta.verse || '承大统于艰危之秋。';
        ov.innerHTML = '<div class="dynasty-open-rule"></div><div class="dynasty-open-name">' + (meta.name || '大明') + '</div>' +
            '<div class="dynasty-open-poem">' + poem + '</div><div class="dynasty-open-rule"></div>';
        ov.classList.add('dynasty-open-inited');
        ov.classList.remove('dynasty-open-show');
        void ov.offsetWidth;
        ov.classList.add('dynasty-open-show');
        try { setTimeout(function () { try { ov.classList.remove('dynasty-open-show'); } catch (e) {} }, 1200); } catch (e) {}
    } catch (e) {}
};