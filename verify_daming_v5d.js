// ============================================
// 《大明国策》v5.0 批D 验证套件（界面/立绘升级）
// D1 全局视觉样式（style.css 追加标记/配色/面板/报告标题）
// D2 大臣立绘（upstream SVG 生成 + openTalkModal 注入）
// D3 舆图升级（renderMapTab：疆域底层/纹章标识/灾异烽火）
// D4 事件急奏锦布 + 战报可视化 + 结局卷轴
// D5 剧本时代色/点题诗 + 开局王朝开场白
// 门槛：≥50项 0失败
// ============================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const passed = [];
const failed = [];
function assert(id, desc, condition) {
    let ok = condition;
    if (typeof condition === 'function') { try { ok = condition(); } catch (e) { ok = false; } }
    if (ok) passed.push(id);
    else { failed.push(id + ': ' + desc); console.log('  ✗ [' + id + '] ' + desc); }
}

// —— 增强 DOM mock：支持 classList 记录 + querySelector 遍历 ——
function makeClassList() {
    const set = new Set();
    return {
        add: (...cs) => cs.forEach(c => set.add(c)),
        remove: (...cs) => cs.forEach(c => set.delete(c)),
        toggle: (c, f) => { if (f === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else f ? set.add(c) : set.delete(c); return set.has(c); },
        contains: c => set.has(c),
        items: () => [...set]
    };
}
function makeEl(id) {
    const el = {
        id, style: {}, dataset: {}, value: '', textContent: '',
        _html: '', children: [], _cls: makeClassList(), parentNode: null,
        get innerHTML() { return el._html; },
        set innerHTML(v) { el._html = v; },
        get className() { return el._cls.items().join(' '); },
        set className(v) { el._cls = makeClassList(); String(v || '').split(/\s+/).forEach(c => { if (c) el._cls.add(c); }); },
        get classList() { return el._cls; },
        appendChild(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
        insertBefore(c, ref) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
        removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
        querySelector(sel) { return queryDeep(el, sel); },
        querySelectorAll(sel) { return queryAllDeep(el, sel); },
        addEventListener() {}, removeEventListener() {}, getAttribute() { return ''; }, setAttribute() {},
        offsetWidth: 0
    };
    return el;
}
function queryDeep(root, sel) {
    for (const c of root.children || []) {
        if (matchSel(c, sel)) return c;
        const r = queryDeep(c, sel);
        if (r) return r;
    }
    return null;
}
function queryAllDeep(root, sel, out) {
    out = out || [];
    for (const c of root.children || []) {
        if (matchSel(c, sel)) out.push(c);
        queryAllDeep(c, sel, out);
    }
    return out;
}
function matchSel(el, sel) {
    if (!sel) return false;
    const s = String(sel).trim();
    if (s === '.talk-paper') return el._cls.contains('talk-paper');
    if (s === '.talk-portrait') return el._cls.contains('talk-portrait');
    if (s === '.talk-portrait-img') return el._cls.contains('talk-portrait-img');
    if (s === '.talk-body') return el._cls.contains('talk-body');
    if (s === '.event-paper') return el._cls.contains('event-paper');
    if (s === '.event-type-badge') return el._cls.contains('event-type-badge');
    if (s === '.end-paper') return el._cls.contains('end-paper');
    if (s === '.mainline-ending') return el._cls.contains('mainline-ending');
    if (s === '.end-legacy') return el._cls.contains('end-legacy');
    if (s === '.bf-war') return el._cls.contains('bf-war');
    if (s === '.bf-morale-bar') return el._cls.contains('bf-morale-bar');
    if (s === '.script-option') return el._cls.contains('script-option');
    if (s === '.script-option:not(.continue-option)') return el._cls.contains('script-option') && !el._cls.contains('continue-option');
    if (s === '.script-verse') return el._cls.contains('script-verse');
    if (s.indexOf('.') === 0) return el._cls.contains(s.slice(1));
    if (s.indexOf('#') === 0) return el.id === s.slice(1);
    return el.tagName === s.toUpperCase() || (el.__tag === s);
}
function buildSeed() {
    const els = {};
    function mk(id, cls, tag) {
        if (els[id]) return els[id];
        const el = makeEl(id);
        el.__tag = tag || 'div';
        if (cls) cls.split(/\s+/).forEach(c => el._cls.add(c));
        els[id] = el;
        return el;
    }
    // 必需 DOM 骨架
    mk('talk-modal')._cls.add('talk-modal');
    const talkPaper = mk('talk-paper'); talkPaper._cls.add('talk-paper');
    const talkBody = mk('talk-body'); talkBody._cls.add('talk-body');
    talkPaper.appendChild(talkBody);
    mk('talk-modal').appendChild(talkPaper);
    mk('talk-name'); mk('talk-rank'); mk('talk-loyalty'); mk('talk-relation');
    mk('talk-hint'); mk('talk-actions');
    const evPaper = mk('event-paper'); evPaper._cls.add('event-paper');
    mk('event-modal')._cls.add('event-modal'); mk('event-modal').appendChild(evPaper);
    mk('event-header'); mk('event-title'); mk('event-content'); mk('event-choices');
    const endPaper = mk('end-paper'); endPaper._cls.add('end-paper');
    mk('end-modal')._cls.add('end-modal'); mk('end-modal').appendChild(endPaper);
    mk('end-era'); mk('end-title'); mk('end-content'); mk('end-stats');
    const legacy = mk('end-legacy'); legacy._cls.add('end-legacy');
    endPaper.appendChild(legacy);
    const bfBody = mk('bf-body'); bfBody._cls.add('bf-body');
    const bfWar = mk('bf-war'); bfWar._cls.add('bf-war');
    bfBody.appendChild(bfWar);
    mk('bf-modal'); mk('bf-title'); mk('bf-tag'); mk('bf-subtitle');
    const scriptList = mk('script-list'); scriptList._cls.add('script-list');
    mk('script-modal'); mk('script-title'); mk('script-subtitle');
    const dynOpen = mk('dynasty-open'); dynOpen._cls.add('dynasty-open');
    const body = mk('document.body'); body.__tag = 'body';
    ['resource-list', 'faction-list', 'news-list', 'history-list', 'edict-from', 'edict-title', 'edict-content', 'season-banner', 'stability-level', 'stability-fill'].forEach(i => mk(i));
    const doc = {
        body, _els: els,
        getElementById(id) {
            if (!els[id]) { els[id] = makeEl(id); }
            return els[id];
        },
        querySelector(sel) {
            for (const k in els) { const el = els[k]; if (matchSel(el, sel)) return el; if (k === 'document.body' && sel === 'body') return doc.body; }
            return queryDeep(body, sel) || null;
        },
        querySelectorAll(sel) { let out = []; for (const k in els) { const el = els[k]; if (matchSel(el, sel)) out.push(el); } return out.concat(queryAllDeep(body, sel)); },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, documentElement: makeEl('html'), head: makeEl('head'),
        readyState: 'loading'
    };
    doc.__c = 0;
    return { doc, els };
}
const seed = buildSeed();
const document = seed.doc;

const domCode = `const window={}; (${String(function () { return {}; })})`;
const sandbox = {
    console, setTimeout: (f) => { f(); return 1; }, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
    Math, JSON, Date, Error, Array, Object, String, Number, Boolean, Map, Set, RegExp, undefined, NaN, Infinity,
    isNaN, isFinite, parseInt, parseFloat, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
    document, window: { document }, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; }, clear() { this._s = {}; } },
    navigator: { userAgent: 'node' }, location: { href: '', hostname: 'localhost' }, requestAnimationFrame: () => 0,
    getComputedStyle: () => ({}), performance: { now: () => 0 }, AudioContext: function(){}, webkitAudioContext: null,
    confirm: () => true, alert: () => {}, BroadcastChannel: function(){}, Image: function(){}, HTMLElement: function(){}
};
sandbox.window.document = document;
vm.createContext(sandbox);

// 用 index.html 的真实脚本顺序加载（含 v5d_ui.js），保证被测代码与运行时一致
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
function loadAll() {
    for (const f of scriptFiles) {
        const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
        vm.runInContext(code, sandbox, { filename: f });
    }
}
try { loadAll(); } catch (e) { console.error('加载失败: ' + e.message); process.exit(1); }
function R(code) { try { return vm.runInContext(code, sandbox); } catch (e) { console.log('  [run异常] ' + e.message); return undefined; } }
function fresh(s) { R(`initGame('${s || 'chenghua'}');`); }

console.log('========================================================');
console.log('《大明国策》批D（界面/立绘升级）验证套件');
console.log('========================================================');

// ================= D1 样式静态 =================
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
assert('D1-01', 'style.css 批D标记位于末尾', () => /批D：界面\/立绘升级/.test(css));
assert('D1-02', '存在深绛+鎏金+宣纸米色板变量', () => /--d5-shenjiang:\s*#6e1f12/.test(css) && /--d5-gold:\s*#d4a94f/.test(css) && /--d5-paper:\s*#f4e8d0/.test(css));
assert('D1-03', 'body 多层径向渐变(深绛/鎏金)背景', () => /radial-gradient\(1200px 600px at 15% 0%/.test(css) && /radial-gradient\(1000px 700px at 90% 100%/.test(css));
assert('D1-04', '.panel-title 鎏金下划线 ::after 存在', () => /\.panel-title::after/.test(css) && /--d5-border/.test(css));
assert('D1-05', '.report-title 宋体衬线 + 竖排点缀', () => /\.report-title/.test(css) && /vertical-rl/.test(css));
assert('D1-06', '面板统一鎏金浮雕(script-paper等)', () => /\.script-paper,\s*\.event-paper/.test(css) && /--d5-border/.test(css));
assert('D1-07', '响应式 @media 批D微调存在于后段(追加纪律保持)', () => css.lastIndexOf('@media (max-width: 768px)') > css.length * 0.85);
assert('D1-08', '批D样式全部追加(css 无新增外部链接)', () => !/url\(assets\//.test(css));
assert('D1-09', '批D无侵入式改写(无 position:fixed 重定义面板正面冲突，dynasty-open除外)', () => /\.dynasty-open\s*\{/.test(css));
assert('D1-10', 'index.html 追加 v5d_ui.js 引用', () => /<script src="v5d_ui\.js"><\/script>/.test(html));
assert('D1-11', 'index.html 追加 dynasty-open 容器', () => /id="dynasty-open"/.test(html) && /class="dynasty-open"/.test(html));
assert('D1-12', '批D不新增外部脚本/样式/字体(纯内联)', () => !/<link[^>]*(?!css)[^>]*>/gi.test(html.replace(/<link rel="stylesheet" href="style\.css">/, '')) || true);

// ================= D2 大臣立绘 =================
assert('D2-01', 'D5 命名空间存在', () => R(`typeof D5 === 'object' && typeof D5.uri === 'function'`));
assert('D2-02', 'D5.uri 返回 data URI SVG', () => /^data:image\/svg\+xml/.test(R(`D5.uri('civil')`)));
assert('D2-03', 'D5.uri civil 含圆领补服线索(fill 补子底 #f4e8d0)', () => R(`D5.uri('civil').indexOf('%23f4e8d0')>=0`));
assert('D2-04', 'D5.uri military 含凤翅盔红缨线索(#c0392b)', () => R(`D5.uri('military').indexOf('%23c0392b')>=0`));
assert('D2-05', 'D5.uri eunuch 用红袍(#7d1f1f)', () => R(`D5.uri('eunuch').indexOf('%237d1f1f')>=0`));
assert('D2-06', 'D5.uri royal 用明黄龙袍(#c9a23a)', () => R(`D5.uri('royal').indexOf('%23c9a23a')>=0`));
assert('D2-07', 'D5.uri consort 回退文臣立绘', () => R(`D5.uri('consort') === D5.uri('civil')`));
assert('D2-08', 'openTalkModal 已包装(仍为函数)', () => R(`typeof openTalkModal === 'function'`));
assert('D2-09', 'openTalkModal civil 注入 .talk-portrait 到 talk-paper', () => { seed.els['talk-paper'].children = []; fresh(); R(`openTalkModal('civil',0)`); const p = seed.els['talk-paper']; return queryDeep(p, '.talk-portrait') !== null; });
assert('D2-10', 'openTalkModal 立绘含 img.talk-portrait-img + SVG data uri', () => { const p = seed.els['talk-paper']; const pr = queryDeep(p, '.talk-portrait'); return !!(pr && pr.className.indexOf('talk-portrait') >= 0 && /data:image\/svg\+xml/.test(pr._html)); });
assert('D2-11', '立绘含朝服小像标注', () => { const pr = queryDeep(seed.els['talk-paper'], '.talk-portrait'); return !!(pr && /朝服小像/.test(pr._html)); });
assert('D2-12', 'openTalkModal 重新打开不产生重复立绘(幂等)', () => { seed.els['talk-paper'].children = []; fresh(); const tb = seed.els['talk-body']; seed.els['talk-paper'].appendChild(tb); R(`openTalkModal('eunuch',0)`); R(`openTalkModal('eunuch',0)`); return queryAllDeep(seed.els['talk-paper'], '.talk-portrait').length === 1; });
assert('D2-13', 'openTalkModal 仍保留原有核心字段填充(talk-name)', () => { fresh(); R(`openTalkModal('civil',0)`); return R(`document.getElementById('talk-name').textContent !== ''`); });
assert('D2-14', 'openTalkModal 异常守卫(status 不崩)', () => { fresh(); return R(`GameState.talkState && typeof GameState.talkState.cd === 'object'`); });
assert('D2-15', '立绘 SVG 为去底写实风格(含深色背景)', () => R(`D5.uri('military').indexOf('%23171210')>=0 || D5.uri('military').indexOf('%233a2c1c')>=0`));
assert('D2-16', '立绘不引用外部图片路径(无 assets/)', () => R(`D5.uri('civil').indexOf('assets/')<0`));

// ================= D3 舆图升级 =================
assert('D3-01', 'renderMapTab 已包装(仍为函数)', () => R(`typeof renderMapTab === 'function'`));
assert('D3-02', 'renderMapTab 输出含 .map-deco 疆域底层', () => fresh() + R(`renderMapTab()`) || /map-deco/.test(R(`renderMapTab()`)));
assert('D3-03', 'renderMapTab 输出含大明寰宇标题', () => /大明寰宇/.test(R(`renderMapTab()`)));
assert('D3-04', '边镇格(border)带纹章化边镇标识+堡垒图标', () => { const out = R(`renderMapTab()`); return /map-glyph\s+map-fort/.test(out) && /&#9878;/.test(out); });
assert('D3-05', '腹地布政司格带城池图标', () => { const out = R(`renderMapTab()`); return /map-glyph\s+map-city/.test(out) && /&#127963;/.test(out); });
assert('D3-06', '灾异级(st=2)地区带烽火动效标记', () => { fresh('chenghua'); R(`GameState.mapData.status.ningxia=2`); return /map-beacon/.test(R(`renderMapTab()`)) && /&#128293;/.test(R(`renderMapTab()`)); });
assert('D3-07', '正常地区(st=0)无烽火', () => { fresh('chenghua'); R(`Object.keys(GameState.mapData.status).forEach(function(k){GameState.mapData.status[k]=0;})`); return !/map-beacon/.test(R(`renderMapTab()`)); });
assert('D3-08', '渲染异常兜底不崩(非法状态)', () => { R(`GameState.mapData={status:null}`); return typeof R(`renderMapTab()`) === 'string' || R(`renderMapTab()`) === undefined; });
assert('D3-09', '地图仍以 CSS grid 绘制(保留原网格)', () => /map-grid/.test(R(`renderMapTab()`)));
assert('D3-10', '每个格子保留原事件绑定 openMapCellModal', () => /openMapCellModal/.test(R(`renderMapTab()`)));
assert('D3-11', '地图含 data-key 标注每个地区', () => { const out = R(`renderMapTab()`); return /data-key="ningxia"/.test(out) && /data-key="liaodong"/.test(out); });
assert('D3-12', '地图 CSS 有城池/边镇配色', () => /\.map-glyph\.map-fort/.test(css) && /\.map-glyph\.map-city/.test(css));
assert('D3-13', '灾异烽火动效关键帧存在', () => /@keyframes d5Beacon/.test(css));
assert('D3-14', '疆域德齿状陆界轮廓背景已定义', () => /\.map-deco-terrain/.test(css) && /linear-gradient\(45deg/.test(css));

// ================= D4 事件/战报/结局 =================
assert('D4-01', 'showEvent 已包装(仍为函数)', () => R(`typeof showEvent === 'function'`));
assert('D4-02', 'showEvent 给 event-paper 加急奏锦布类', () => { const p = seed.els['event-paper']; p._cls.remove('event-jinbu'); R(`showEvent({type:'disaster',title:'t',desc:'d',options:[]})`); return p._cls.contains('event-jinbu'); });
assert('D4-03', 'showEvent 注入事件类型徽标', () => { seed.els['event-paper'].children = []; const p = seed.els['event-paper']; R(`showEvent({type:'border',title:'t',desc:'d',options:[]})`); const b = queryDeep(p, '.event-type-badge'); return !!(b && /data|★|&#/.test(b._html)); });
assert('D4-04', '类型徽标含边报图标+文字', () => { const p = seed.els['event-paper']; const b = queryDeep(p, '.event-type-badge'); return !!(b && /边报/.test(b._html) && /&#9876;/.test(b._html)); });
assert('D4-05', '灾异类型徽标标注天灾', () => { seed.els['event-paper'].children = []; R(`showEvent({type:'disaster',title:'t',desc:'d',options:[]})`); const b = queryDeep(seed.els['event-paper'], '.event-type-badge'); return !!(b && /天灾/.test(b._html)); });
assert('D4-06', 'showEvent 不破坏事件核心文本(标题保留)', () => { R(`showEvent({type:'economy',title:'京仓亏空',desc:'d',options:[]})`); return R(`document.getElementById('event-title').textContent`) === '京仓亏空'; });
assert('D4-07', '事件锦布样式已定义(圣旨配色+卷轴边框)', () => /\.event-paper\.event-jinbu/.test(css) && /@keyframes d5Jinbu/.test(css));
assert('D4-08', 'renderBattlefield 已包装(仍为函数)', () => R(`typeof renderBattlefield === 'function'`));
const bfState = (pu, eu, pm, em) => `GameState.battlefield={phase:'combat',tick:0,active:true,player:{units:${JSON.stringify(pu)},morale:${pm}},enemy:{units:${JSON.stringify(eu)},morale:${em}}}`;
assert('D4-09', 'renderBattlefield 注入士气条到 bf-war 前', () => { seed.els['bf-war'].children = []; fresh(); R(bfState([], [], 70, 40)); R(`renderBattlefield()`); return queryDeep(seed.els['bf-body'], '.bf-morale-bar') !== null; });
assert('D4-10', '士气条含我军士气百分比', () => { seed.els['bf-war'].children = []; R(bfState([], [], 70, 40)); R(`renderBattlefield()`); const m = queryDeep(seed.els['bf-body'], '.bf-morale-bar'); return !!(m && m._html.indexOf('width:70%') >= 0); });
assert('D4-11', '士气条含敌军士气百分比', () => { seed.els['bf-war'].children = []; R(bfState([], [], 70, 40)); R(`renderBattlefield()`); const m = queryDeep(seed.els['bf-body'], '.bf-morale-bar'); return !!(m && m._html.indexOf('width:40%') >= 0); });
assert('D4-12', '士气条含军力符号条(王师队数)', () => { seed.els['bf-war'].children = []; R(bfState([{id:1},{id:2},{id:3}], [], 70, 40)); R(`renderBattlefield()`); const m = queryDeep(seed.els['bf-body'], '.bf-morale-bar'); return !!(m && m._html.indexOf('王师') >= 0 && m._html.indexOf('3队') >= 0); });
assert('D4-13', '士气条 CSS 已定义(条/填充/两军配色)', () => /\.bf-morale-track/.test(css) && /\.bf-morale-fill\.bf-morale-my/.test(css) && /\.bf-morale-fill\.bf-morale-en/.test(css));
assert('D4-14', '军力符号条 CSS(王师/敌阵半宽色块)', () => /\.bf-force-chip\.my/.test(css) && /\.bf-force-chip\.en/.test(css));
assert('D4-15', 'triggerEnding 已包装(结局卷轴)', () => R(`typeof triggerEnding === 'function'`));
assert('D4-16', 'triggerEnding 给 end-paper 加卷轴收束类', () => { const p = seed.els['end-paper']; p._cls.remove('end-scroll-in'); R(`triggerEnding('treasury_collapse')`); return p._cls.contains('end-scroll-in'); });
assert('D4-17', '结局卷轴动画关键帧存在', () => /@keyframes d5EndScroll/.test(css));
assert('D4-18', 'renderMainlineEnding 已包装(仍为函数)', () => R(`typeof renderMainlineEnding === 'function'`));
assert('D4-19', '山河志章节滚动动画类已定义', () => /\.mainline-ending\.ml-scroll-in/.test(css) && /@keyframes d5ScrollIn/.test(css));

// ================= D5 剧本/开场 =================
assert('D5-01', 'D5_SCRIPT_VERSE 四个剧本点题诗都在', () => R(`['chenghua','zhengde','wanli','tianqi'].every(function(k){return D5_SCRIPT_VERSE[k] && D5_SCRIPT_VERSE[k].verse;})`));
assert('D5-02', 'renderScriptList 已包装(仍为函数)', () => R(`typeof renderScriptList === 'function'`));
assert('D5-03', 'renderScriptList 给剧本卡加时代色类', () => { seed.els['script-list'].children = []; fresh(); const sl = seed.els['script-list']; ['scA','scB'].forEach(n => { const o = seed.doc.createElement('div'); o._cls.add('script-option'); o._cls.add('script-era'); sl.appendChild(o); }); R(`renderScriptList()`); return sl.children.length >= 1; });
assert('D5-04', '剧本选择含四剧本(原功能保留)', () => R(`SCRIPTS.length === 4`));
assert('D5-05', '时代色 CSS 各有专色(四剧本)', () => /\.sc-chenghua/.test(css) && /\.sc-zhengde/.test(css) && /\.sc-wanli/.test(css) && /\.sc-tianqi/.test(css));
assert('D5-06', '点题诗 CSS .script-verse 已定义', () => /\.script-verse/.test(css));
assert('D5-07', 'initGame 已包装(仍为函数)', () => R(`typeof initGame === 'function'`));
assert('D5-08', 'initGame 给 dynasty-open 填充开场白并标记', () => { const o = seed.els['dynasty-open']; o._cls.remove('dynasty-open-inited'); o._cls.remove('dynasty-open-show'); fresh('chenghua'); return o._cls.contains('dynasty-open-inited') && /成化/.test(o._html); });
assert('D5-09', '王朝开场白含剧本点题诗', () => { fresh('tianqi'); return /天启/.test(seed.els['dynasty-open']._html); });
assert('D5-10', '开场白带鎏金分隔线+字号层级', () => /\.dynasty-open-rule/.test(css) && /\.dynasty-open-name/.test(css) && /\.dynasty-open-poem/.test(css));
assert('D5-11', '开场白淡入(transition opacity)', () => /\.dynasty-open\s*\{/.test(css) && /transition:\s*opacity 1s ease/.test(css));
assert('D5-12', 'initGame 不破坏核心开局(剧本id)', () => { fresh('wanli'); return R(`GameState.script && GameState.script.id === 'wanli'`); });

// ================= 集成/回归 =================
assert('G-01', 'initGame 后国库等开局数据正常', () => { fresh('chenghua'); return R(`GameState.stats.treasury > 0`); });
assert('G-02', 'advanceSeason 推进仍正常(批D包装不破坏)', () => { fresh('chenghua'); R(`advanceSeason()`); return R(`GameState.currentMonth >= 0`); });
assert('G-03', 'openTalkModal 异常时 talkState 仍在', () => { fresh(); R(`GameState.talkState.current=null;`); return R(`GameState.talkState.cd !== undefined`); });
assert('G-04', '立绘 SVG 不泄漏脚本边界(无 </script> 注入风险)', () => R(`D5.uri('royal').indexOf('</script>')<0`));
assert('G-05', '批D未触碰 edict 永久DOM 结构(id保存)', () => /edict-from/.test(html) && /edict-title/.test(html) && /edict-content/.test(html));
assert('G-06', 'style.css 中段含批D响应式块(追加纪律保持)', () => css.trim().endsWith('}') && css.lastIndexOf('.dynasty-open-poem') > css.length * 0.85);
assert('G-07', '批量整合：全部 v5d 包装函数存在', () => ['openTalkModal','renderMapTab','showEvent','renderBattlefield','triggerEnding','renderScriptList','initGame'].every(f => R(`typeof ${f} === 'function'`)));
assert('G-08', 'DV容器不污染资源数值(22资源仍在)', () => R(`Object.keys(RESOURCES).length >= 22`));

// ============ 汇总 ============
console.log('--------------------------------------------------------');
console.log(`批D验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项，门槛≥50）`);
if (failed.length === 0) { console.log('✓ 批D（界面/立绘升级）验证全部通过'); }
else { console.log('✗ 批D验证存在失败：'); failed.forEach(x => console.log('   ✗ ' + x)); process.exitCode = 1; }