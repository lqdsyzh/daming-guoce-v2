// ============================================
// 《大明国策》v6.0 批A 验证套件（朝政总览看板）
// A1 overview.js 接线静态断言（index/modules/script/style + 新文件）
// A2 运行时 DOM mock 渲染 renderOverview（资源卡/派系/预警/主线）
// A3 下钻 overviewGoto + 默认落地 overview + 预警触发
// 门槛：≥30项 0失败；不触碰 edict 永久DOM / 已决政事区
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

// —— DOM mock ——
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
        insertBefore(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
        removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
        querySelector() { return null; }, querySelectorAll() { return []; },
        addEventListener() {}, removeEventListener() {}, getAttribute() { return ''; }, setAttribute() {},
        offsetWidth: 0
    };
    return el;
}
function matchSel(el, sel) {
    if (!sel) return false;
    const s = String(sel).trim();
    if (s.indexOf('.') === 0) return el._cls.contains(s.slice(1));
    if (s.indexOf('#') === 0) return el.id === s.slice(1);
    return el.tagName === s.toUpperCase() || (el.__tag === s);
}
function hasAncestor(el, sel, doc) {
    let p = el.parentNode;
    while (p) { if (matchSel(p, sel)) return true; p = p.parentNode; }
    return false;
}

function buildSeed() {
    const els = {};
    function mk(id) { if (!els[id]) { els[id] = makeEl(id); } return els[id]; }
    const body = makeEl('document.body'); body.__tag = 'body';
    // center-panel（总览渲染目标）
    mk('center-panel');
    // menu-tabs + 若干 menu-tab（含 overview / politics）
    const tabs = mk('menu-tabs');
    [['overview', '览'], ['politics', '政'], ['finance', '赋'], ['military', '兵'], ['economy', '财'], ['markets', '市'], ['famine', '荒'], ['map', '图'], ['personnel', '人']].forEach(pair => {
        const t = makeEl('mt_' + pair[0]);
        t.__tag = 'div'; t.dataset.tab = pair[0]; t._cls.add('menu-tab'); t.textContent = pair[1];
        tabs.appendChild(t); els['mt_' + pair[0]] = t;
    });
    // edict 永久 DOM 骨架（不得被总览触碰）
    ['edict-from', 'edict-title', 'edict-content', 'season-banner', 'resource-list', 'faction-list', 'news-list', 'history-list', 'stability-level', 'stability-fill'].forEach(mk);
    const doc = {
        body, _els: els, __c: 0,
        getElementById(id) { if (!els[id]) { els[id] = makeEl(id); } return els[id]; },
        querySelector(sel) { for (const k in els) { if (matchSel(els[k], sel)) return els[k]; } return null; },
        querySelectorAll(sel) {
            let out = [];
            // 支持后代选择器 '#menu-tabs .menu-tab'
            if (String(sel).indexOf(' ') > 0) {
                const parts = String(sel).trim().split(/\s+/);
                const last = parts[parts.length - 1];
                const ancestors = parts.slice(0, -1);
                for (const k in els) {
                    const el = els[k];
                    if (matchSel(el, last) && ancestors.every(a => hasAncestor(el, a, doc))) out.push(el);
                }
                return out;
            }
            for (const k in els) { if (matchSel(els[k], sel)) out.push(els[k]); }
            return out;
        },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, documentElement: makeEl('html'), head: makeEl('head'), readyState: 'loading'
    };
    body.appendChild(tabs); body.appendChild(mk('center-panel'));
    return { doc, els };
}
const seed = buildSeed();
const document = seed.doc;

const sandbox = {
    console, setTimeout: (f) => { f(); return 1; }, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
    Math, JSON, Date, Error, Array, Object, String, Number, Boolean, Map, Set, RegExp, undefined, NaN, Infinity,
    isNaN, isFinite, parseInt, parseFloat, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
    document, window: { document },
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; }, clear() { this._s = {}; } },
    navigator: { userAgent: 'node' }, location: { href: '', hostname: 'localhost' }, requestAnimationFrame: () => 0,
    getComputedStyle: () => ({}), performance: { now: () => 0 }, AudioContext: function(){}, webkitAudioContext: null,
    confirm: () => true, alert: () => {}, BroadcastChannel: function(){}, Image: function(){}, HTMLElement: function(){}
};
sandbox.window.document = document;
vm.createContext(sandbox);

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
function loadAll() { for (const f of scriptFiles) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }); } }
try { loadAll(); } catch (e) { console.error('加载失败: ' + e.message); process.exit(1); }
function R(code) { try { return vm.runInContext(code, sandbox); } catch (e) { console.log('  [run异常] ' + e.message); return undefined; } }
function fresh(s) { R(`initGame('${s || 'chenghua'}');`); }
function ov() { return R(`renderOverview();`) || ''; }

console.log('========================================================');
console.log('《大明国策》批A（朝政总览看板）验证套件');
console.log('========================================================');

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const jsOvr = fs.readFileSync(path.join(ROOT, 'overview.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

// ================= A1 接线静态 =================
assert('A1-01', 'index.html 新增 overview menu-tab', () => /data-tab="overview"/.test(html));
assert('A1-02', 'index.html overview tab 为默认 active（原 politics 去 active）', () => /menu-tab active" data-tab="overview"/.test(html) && !/menu-tab active" data-tab="politics"/.test(html));
assert('A1-03', 'index.html 引入 overview.js', () => /<script src="overview\.js"><\/script>/.test(html));
assert('A1-04', 'politics tab 仍保留', () => /data-tab="politics"/.test(html));
assert('A1-05', 'modules.js renderPanel 新增 overview case', () => /case 'overview':[\s\S]{0,120}renderOverview/.test(jsMod));
assert('A1-06', 'modules.js 保留原 politics case', () => /case 'politics':\s*html = renderPolitics\(\);/.test(jsMod));
assert('A1-07', 'modules.js 新增 syncMenuTabActive', () => /function syncMenuTabActive/.test(jsMod));
assert('A1-08', 'syncMenuTabActive 在 renderPanel 末尾被调用（选中态一致）', () => /syncMenuTabActive\(tab\);\s*\}/.test(jsMod));
assert('A1-09', 'script.js 默认 currentTab 改 overview（GameState 定义）', () => /currentTab:\s*'overview'/.test(jsMain));
assert('A1-10', 'script.js initGame 默认 currentTab 改 overview', () => /GameState\.currentTab\s*=\s*'overview';/.test(jsMain));
assert('A1-11', 'script.js loadGame 兜底改 overview', () => /save\.currentTab \|\| 'overview'/.test(jsMain));
assert('A1-12', 'script.js updateUI 兜底改 overview', () => /renderPanel\(GameState\.currentTab \|\| 'overview'\);/.test(jsMain));
assert('A1-13', 'style.css 末尾追加总览样式（.overview-board）', () => /\.overview-board\s*\{/.test(css) && css.lastIndexOf('.ov-grid') > css.length * 0.9);
assert('A1-14', '总览样式含响应式（桌面多列/移动端紧凑）', () => /@media \(max-width: 767px\)[\s\S]{0,200}\.ov-grid/.test(css) && /@media \(min-width: 1400px\)[\s\S]{0,60}\.ov-grid/.test(css));
assert('A1-15', 'overview.js 定义全局 renderOverview', () => /function renderOverview\(\)/.test(jsOvr));
assert('A1-16', 'overview.js 定义全局 overviewGoto', () => /function overviewGoto\(tab\)/.test(jsOvr));
assert('A1-17', 'index.html 外链引序 overview.js 先于 script.js（运行时可解析）', () => html.indexOf('src="overview.js"') < html.indexOf('src="script.js"'));

// ================= A2 运行时渲染 =================
assert('A2-01', 'initGame 默认落地 overview（新局首屏总览）', () => { fresh('chenghua'); return R(`GameState.currentTab === 'overview'`); });
assert('A2-02', 'renderOverview 返回非空字符串', () => { fresh('chenghua'); return ov().length > 0; });
assert('A2-03', 'renderOverview 输出资源卡网格 .ov-grid', () => /ov-grid/.test(ov()));
assert('A2-04', 'renderOverview 生成 8 张资源卡（ov-card）', () => (ov().match(/class="ov-card ov-/g) || []).length === 8);
assert('A2-05', '国库卡 onclick 下钻 finance', () => /ov-card[^>]*onclick="overviewGoto\('finance'\)"/.test(ov()));
assert('A2-06', '兵力卡 onclick 下钻 military', () => /ov-card[^>]*onclick="overviewGoto\('military'\)"/.test(ov()));
assert('A2-07', '景气卡 onclick 下钻 markets', () => /ov-card[^>]*onclick="overviewGoto\('markets'\)"/.test(ov()));
assert('A2-08', '民望卡 onclick 下钻 politics', () => { const o = ov(); const i = o.indexOf('民望'); return i >= 0 && /overviewGoto\('politics'\)/.test(o.slice(Math.max(0, i - 300), i + 60)); });
assert('A2-09', 'renderOverview 含派系横条 .ov-fac', () => /ov-fac-grid/.test(ov()));
assert('A2-10', 'renderOverview 含 5 派系横条', () => (ov().match(/class="ov-fac"/g) || []).length === 5);
assert('A2-11', 'renderOverview 含预警区 .ov-warn-list', () => /ov-warn-list/.test(ov()));
assert('A2-12', 'renderOverview 含主线进度 .ov-ml', () => /ov-ml/.test(ov()));
assert('A2-13', 'renderOverview 含主线进度条 .ov-ml-fill 带百分比宽度', () => /ov-ml-fill" style="width:\d+%"/.test(ov()));
assert('A2-14', 'renderOverview 含下卷提示 .ov-hint（复用顶部控件）', () => /ov-hint/.test(ov()));
assert('A2-15', '常规开局无预警时显示「四海升平」', () => { fresh('chenghua'); R(`GameState.stats.prestige=80;GameState.stats.mandate=80;GameState.stats.stability=80;GameState.stats.treasury=15000;GameState.econ.prosperity=85;GameState.mainline.phase='done';GameState.zaiyi.pending=[];GameState.memorialQueue=[];GameState.omen={eclipse:false,comet:false,mandateLow:false};`); return /四海升平/.test(ov()); });

// ================= A3 预警触发 + 下钻 =================
assert('A3-01', '国库枯竭(<2000) → 资源卡 ov-bad 着色', () => { fresh('chenghua'); R(`GameState.stats.treasury=500;`); return /ov-card ov-bad/.test(ov()); });
assert('A3-02', '国库枯竭 → 预警「国库告急」', () => { fresh('chenghua'); R(`GameState.stats.treasury=500;`); return /国库告急/.test(ov()); });
assert('A3-03', '派系跋扈(>80) → 预警「跋扈」', () => { fresh('chenghua'); R(`GameState.factions.eunuch=92;`); return /宦官集团跋扈/.test(ov()); });
assert('A3-04', '待决急奏>0 → 预警「待决急奏」', () => { fresh('chenghua'); R(`GameState.memorialQueue=[{},{},{}];`); return /待决急奏 3 件/.test(ov()); });
assert('A3-05', '灾异待办>0 → 预警「灾异待办」', () => { fresh('chenghua'); R(`GameState.zaiyi.pending=[{key:'旱',label:'旱灾',title:'大旱',turns:2,responded:false}];`); return /灾异待办 1 起/.test(ov()); });
assert('A3-06', '天命<40 → 预警「天命衰微」', () => { fresh('chenghua'); R(`GameState.stats.mandate=30;`); return /天命衰微/.test(ov()); });
assert('A3-07', '概览渲染不触碰 edict 永久DOM（调用前后文本不变）', () => { fresh('chenghua'); const before = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; ov(); const after = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; return before === after && /edict-from/.test(html); });
assert('A3-08', 'overviewGoto 切换 currentTab', () => { fresh('chenghua'); R(`overviewGoto('military')`); return R(`GameState.currentTab === 'military'`); });
assert('A3-09', 'overviewGoto 渲染目标面板到 center-panel（非空）', () => { fresh('chenghua'); seed.els['center-panel']._html = ''; R(`overviewGoto('finance')`); return seed.els['center-panel']._html.length > 0; });
assert('A3-10', 'overviewGoto 同步菜单 active 到目标 tab', () => { fresh('chenghua'); R(`overviewGoto('markets')`); return seed.els['mt_markets']._cls.contains('active') && !seed.els['mt_overview']._cls.contains('active'); });
assert('A3-11', 'renderPanel(overview) 通过 case 正常路由', () => { fresh('chenghua'); seed.els['center-panel']._html = ''; R(`renderPanel('overview')`); return /ov-grid/.test(seed.els['center-panel']._html); });
assert('A3-12', 'initGame 后 GameState.mainline 就绪（山河志可读）', () => { fresh('chenghua'); return R(`GameState.mainline && typeof GameState.mainline.stage === 'number'`); });

// ================= 回归 =================
assert('R-01', 'advanceSeason 推进仍正常（总览不破坏核心循环）', () => { fresh('chenghua'); R(`advanceSeason()`); return R(`GameState.currentMonth >= 0`); });
assert('R-02', '22资源仍在（未删改数据）', () => R(`Object.keys(RESOURCES).length >= 22`));
assert('R-03', '5派系仍在（未删改数据）', () => R(`Object.keys(FACTIONS).length === 5`));
assert('R-04', 'renderPolitics 保留（政事tab不回归）', () => R(`typeof renderPolitics === 'function'`));
assert('R-05', 'renderOverview 异常兜底不崩（函数仍在）', () => R(`typeof renderOverview === 'function'`));
assert('R-06', 'edict-history 已决政事区 DOM 未动（id保存）', () => /id="history-list"/.test(html) && /id="edict-history-zone"/.test(html));

// ============ 汇总 ============
console.log('--------------------------------------------------------');
console.log(`批A验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项，门槛≥30）`);
if (failed.length === 0) { console.log('✓ 批A（朝政总览看板）验证全部通过'); }
else { console.log('✗ 批A验证存在失败：'); failed.forEach(x => console.log('   ✗ ' + x)); process.exitCode = 1; }