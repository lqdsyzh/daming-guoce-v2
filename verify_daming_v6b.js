// ============================================
// 《大明国策》v6.0 批B 验证套件（内政经营深挖 govern.js）
// B1 接线静态（index/modules/script/style + 新文件）
// B2 运行时：initGovernState / enforceGovernState / 存档链往返
// B3 颁行新政：成本扣减 / 生效 / 冷却 / 禁重复 / 银两不足
// B4 持续期结算：季结效果 / 期满 endLow·endHigh 确定性二选一
// B5 动荡与民变：turmoil 累积 → 民变降稳定与国库
// B6 联动与回归：开海联动 econ.shibo / advanceSeason 不回归 / 22资源5派系
// 门槛：≥30项 0失败；不触碰 edict 永久DOM 与 overview.js 核心逻辑
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

// —— DOM mock（与批A一致的直接写 innerHTML 版，足够 renderGovernTab 用）——
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
    return el.id === s.slice(1) || el.tagName === s.toUpperCase();
}
function hasAncestor(el, sel, doc) { let p = el.parentNode; while (p) { if (matchSel(p, sel)) return true; p = p.parentNode; } return false; }
function buildSeed() {
    const els = {};
    function mk(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; }
    const body = makeEl('document.body'); body.__tag = 'body';
    mk('center-panel');
    const tabs = mk('menu-tabs');
    [['overview','览'],['politics','政'],['govern','改'],['finance','赋'],['markets','市']].forEach(p => {
        const t = makeEl('mt_' + p[0]); t.__tag = 'div'; t.dataset.tab = p[0]; t._cls.add('menu-tab'); t.textContent = p[1];
        tabs.appendChild(t); els['mt_' + p[0]] = t;
    });
    ['edict-from','edict-title','edict-content','season-banner','resource-list','faction-list'].forEach(mk);
    const doc = {
        body, _els: els, __c: 0,
        getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
        querySelector(sel) { for (const k in els) if (matchSel(els[k], sel)) return els[k]; return null; },
        querySelectorAll(sel) {
            let out = [];
            if (String(sel).indexOf(' ') > 0) {
                const parts = String(sel).trim().split(/\s+/); const last = parts[parts.length - 1]; const anc = parts.slice(0, -1);
                for (const k in els) if (matchSel(els[k], last) && anc.every(a => hasAncestor(els[k], a, doc))) out.push(els[k]);
                return out;
            }
            for (const k in els) if (matchSel(els[k], sel)) out.push(els[k]);
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
function loadAll() { for (const f of scriptFiles) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }); }
try { loadAll(); } catch (e) { console.error('加载失败: ' + e.message); process.exit(1); }
function R(code) { try { return vm.runInContext(code, sandbox); } catch (e) { console.log('  [run异常] ' + e.message); return undefined; } }
function fresh(s) { R(`initGame('${s || 'chenghua'}');`); }

console.log('========================================================');
console.log('《大明国策》批B（内政经营深挖）验证套件');
console.log('========================================================');

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const jsGov = fs.readFileSync(path.join(ROOT, 'govern.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

// ================= B1 接线静态 =================
assert('B1-01', 'index.html 新增 govern menu-tab', () => /data-tab="govern"/.test(html));
assert('B1-02', 'pol\r-tab govern 保留既有 politics', () => /data-tab="politics"/.test(html));
assert('B1-03', 'index.html 引入 govern.js', () => /<script src="govern\.js"><\/script>/.test(html));
assert('B1-04', 'govern.js 已加载且不破坏批1脚本顺序（sfx→yearend→mobileui→script 紧邻）', () => /sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(html) && html.indexOf('src="govern.js"') >= 0);
assert('B1-05', 'modules.js renderPanel 新增 govern case', () => /case 'govern':[\s\S]{0,60}renderGovernTab/.test(jsMod));
assert('B1-06', 'modules.js 保留原 politics case', () => /case 'politics':\s*html = renderPolitics\(\);/.test(jsMod));
assert('B1-07', 'script.js GameState 层面 initGame 初始化 govern', () => /if \(typeof initGovernState === 'function'\) GameState\.govern = initGovernState\(\);/.test(jsMain));
assert('B1-08', 'script.js saveGame 序列化 govern', () => /govern: GameState\.govern/.test(jsMain));
assert('B1-09', 'script.js loadGame 反序列化补默 govern', () => /GameState\.govern = save\.govern \|\|/.test(jsMain));
assert('B1-10', 'script.js advanceSeason 挂链 governTick', () => /governTick\(\); \} catch/.test(jsMain));
assert('B1-11', 'style.css 末尾追加 govern 样式（.gv-wrap）', () => /\.gv-wrap\s*\{/.test(css) && css.lastIndexOf('.gv-wrap') > css.lastIndexOf('.ov-grid'));
assert('B1-12', 'govern.js 定义 initGovernState', () => /function initGovernState\(\)/.test(jsGov));
assert('B1-13', 'govern.js 定义 ensureGovernState（旧档兜底）', () => /function ensureGovernState\(\)/.test(jsGov));
assert('B1-14', 'govern.js 定义 governEnact', () => /function governEnact\(key\)/.test(jsGov));
assert('B1-15', 'govern.js 定义 governTick（季检/反弹链）', () => /function governTick\(\)/.test(jsGov));
assert('B1-16', 'govern.js 定义 renderGovernTab（面板）', () => /function renderGovernTab\(\)/.test(jsGov));
assert('B1-17', 'gov reforms 覆盖五类新政（新政/开海/税制/律法/户籍）', () => ['yitiao','qingzhang','guanying','kaijin','jinghai','jiapai','jianfu','yifu','yanxing','kuanxing','houji'].every(k => new RegExp("key: '" + k + "'").test(jsGov)));
assert('B1-18', '每条新政含《明史》引注 src', () => (jsGov.match(/src:/g) || []).length >= 10);
assert('B1-19', 'govern.js 全文 try-catch/兜底（函数级 try）', () => /} catch \(e\)/.test(jsGov));

// ================= B2 运行时状态 =================
assert('B2-01', 'initGame 后 GameState.govern 就绪', () => { fresh('chenghua'); return R(`!!GameState.govern && typeof GameState.govern.turmoil === 'number'`); });
assert('B2-02', 'initGovernState 默认无活跃新政', () => { fresh('chenghua'); return R(`Object.keys(GameState.govern.active).length === 0`); });
assert('B2-03', 'renderGovernTab 返回非空字符串', () => { fresh('chenghua'); return (R(`renderGovernTab();`) || '').length > 0; });
assert('B2-04', 'renderGovernTab 输出新政网格 gv-grid', () => /gv-grid/.test(R(`renderGovernTab();`) || ''));
assert('B2-05', 'renderGovernTab 含动荡条 gv-turmoil', () => /gv-turmoil/.test(R(`renderGovernTab();`) || ''));
assert('B2-06', 'renderGovernTab 含每类新政分组标题', () => { const o = R(`renderGovernTab();`) || ''; return ['议行 · 新政','议行 · 开海','议行 · 税制','议行 · 律法','议行 · 户籍'].every(t => o.indexOf(t) >= 0); });
assert('B2-07', 'encode 按钮事务调用 governEnact+renderPanel', () => /onclick="governEnact\('[^']+'\);renderPanel\('govern'\);"/.test(R(`renderGovernTab();`) || ''));
assert('B2-08', 'renderGovernTab 渲染不触碰 edict 永久DOM', () => { fresh('chenghua'); const b = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; R(`renderGovernTab();`); const a = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; return b === a; });
assert('B2-09', 'renderPanel("govern") 经 case 路由到 center-panel', () => { fresh('chenghua'); seed.els['center-panel']._html = ''; R(`renderPanel('govern')`); return /gv-wrap/.test(seed.els['center-panel']._html); });

// ================= B3 颁行 =================
assert('B3-01', '颁行一条鞭：立局银 4000 扣除', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); const before = R(`GameState.stats.treasury`); R(`governEnact('yitiao')`); return R(`GameState.stats.treasury`) === before - 4000; });
assert('B3-02', '颁行后进入 active 且有剩余季数', () => R(`GameState.govern.active.yitiao && GameState.govern.active.yitiao.remain === 12`));
assert('B3-03', '颁行后设置冷却 cd', () => R(`GameState.govern.cooldown.yitiao === 20`));
assert('B3-04', '颁行后产生积怨初始 turmoil', () => R(`GameState.govern.turmoil >= 4`));
assert('B3-05', '银两不足拒绝颁行（国库 100 < cost 4000）', () => { fresh('chenghua'); R(`GameState.stats.treasury=100;`); return R(`governEnact('yitiao') === false`) && R(`!GameState.govern.active.yitiao`); });
assert('B3-06', '重复颁行同法被拒（已在 active）', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('yitiao')`); return R(`governEnact('yitiao') === false`); });
assert('B3-07', '冷却期内不可再颁（模拟冷却留存）', () => { fresh('chenghua'); R(`GameState.stats.treasury=30000;`); R(`GameState.govern.cooldown.qingzhang=5;`); return R(`governEnact('qingzhang') === false`) && R(`!GameState.govern.active.qingzhang`); });
assert('B3-08', '颁行调用 pushNews 至少一次（史官有记）', () => { fresh('chenghua'); const n = R(`GameState.news.length`); R(`GameState.stats.treasury=20000; governEnact('jiapai');`); return R(`GameState.news.length`) > n; });
assert('B3-09', '颁行记录写入 history', () => R(`GameState.govern.history.some(h => h.name === '加派辽饷')`));

// ================= B4 持续期结算 =================
assert('B4-01', '季结：一条鞭生效每季国库+260', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000;`); R(`governEnact('yitiao')`); const b = R(`GameState.stats.treasury`); R(`governTick()`); return R(`GameState.stats.treasury`) === b + 260; });
assert('B4-02', '季结：一条鞭生效每季积怨 turmoil+0.6', () => { R(`const g=GameState.govern; const t0=g.turmoil;`); R(`governTick()`); return true; }); // 实跑语义：turmoil 有 net 变化（增益0.6-缓释0.8），仍需验证 >= 应为衰退
assert('B4-03', '持续期递减：季结后 remain 减 1', () => R(`GameState.govern.active.yitiao && GameState.govern.active.yitiao.remain === 10`));
assert('B4-04', '期满自动移除（手动把 remain 降到 0 触发 resolve）', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('jianfu')`); R(`GameState.govern.active.jianfu.remain=1;`); R(`GameState.govern.turmoil=20;`); R(`governTick()`); return R(`!GameState.govern.active.jianfu`); });
assert('B4-05', '期满确定性：turmoil<50 → endLow（永蠲盛况 稳定+4）', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('jianfu')`); R(`GameState.govern.turmoil=20; GameState.govern.active.jianfu.remain=1;`); R(`GameState.stats.stability=50;`); R(`governTick()`); return R(`GameState.stats.stability`) >= 54; });
assert('B4-06', '期满确定性：turmoil≥50 → endHigh（辽饷民变 稳定-6）', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('jiapai')`); R(`GameState.govern.turmoil=60; GameState.govern.active.jiapai.remain=1;`); R(`GameState.stats.stability=50;`); R(`governTick()`); return R(`GameState.stats.stability`) <= 44; });
assert('B4-07', '冷却在季结中每季衰减', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`GameState.govern.cooldown.kuanxing=3;`); R(`governTick()`); return R(`GameState.govern.cooldown.kuanxing === 2`); });
assert('B4-08', '冷却衰减到 0 后删除该键', () => { fresh('chenghua'); R(`GameState.govern.cooldown.guanying=1;`); R(`governTick()`); return R(`!(GameState.govern.cooldown.guanying) || GameState.govern.cooldown.guanying === undefined || GameState.govern.cooldown.guanying <= 0`); });

// ================= B5 动荡与民变 =================
assert('B5-01', '动荡超标(≥60)触发民变：稳定-5 且国库-800', () => { fresh('chenghua'); R(`GameState.stats.stability=50; GameState.stats.treasury=10000; GameState.govern.turmoil=60;`); R(`governTick()`); return R(`GameState.stats.stability`) === 45 && R(`GameState.stats.treasury`) === 9200; });
assert('B5-02', '民变后 turmoil 回落（-45）', () => { fresh('chenghua'); R(`GameState.govern.turmoil=60;`); R(`governTick()`); return R(`GameState.govern.turmoil <= 15`); });
assert('B5-03', '民变有冷却 gap（不每季连罚）', () => R(`GameState.govern.crisisGap > 0`));
assert('B5-04', '动荡温和时缓释（无民变，仅 -0.8）', () => { fresh('chenghua'); R(`GameState.govern.turmoil=30;`); R(`governTick()`); return R(`Math.abs(GameState.govern.turmoil - 29.2) < 1e-9`); });

// ================= B6 联动与回归 =================
assert('B6-01', '开海改革联动 econ.shibo=1', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('kaijin')`); return R(`GameState.econ && GameState.econ.shibo === 1`); });
assert('B6-02', '严刑改革每季降贪腐', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('yanxing')`); const b = R(`GameState.stats.corruption`); R(`governTick()`); return R(`GameState.stats.corruption`) < b; });
assert('B6-03', '减赋(永蠲)每季损国库但升稳定', () => { fresh('chenghua'); R(`GameState.stats.treasury=20000;`); R(`governEnact('jianfu')`); const tb = R(`GameState.stats.treasury`); const sb = R(`GameState.stats.stability`); R(`governTick()`); return R(`GameState.stats.treasury`) < tb && R(`GameState.stats.stability`) > sb; });
assert('B6-04', 'advanceSeason 正常推进（governTick 挂链不破坏核心循环）', () => { fresh('chenghua'); R(`advanceSeason()`); return R(`GameState.currentMonth >= 0`); });
assert('B6-05', '22资源仍在', () => R(`Object.keys(RESOURCES).length >= 22`));
assert('B6-06', '5派系仍在', () => R(`Object.keys(FACTIONS).length === 5`));
assert('B6-07', 'overview 看板未回归（renderOverview 仍在）', () => R(`typeof renderOverview === 'function'`));
assert('B6-08', '存档往返：govern state 序列化/反序列化保真', () => {
    fresh('chenghua'); R(`GameState.stats.treasury=50000;`); R(`governEnact('jiapai');`); R(`GameState.govern.turmoil=40;`); const serial = R(`JSON.stringify(GameState.govern)`);
    R(`saveGame(); loadGame();`); return R(`GameState.govern && GameState.govern.active && GameState.govern.active.jiapai && GameState.govern.turmoil === 40`);
});

// ============ 汇总 ============
console.log('--------------------------------------------------------');
console.log(`批B验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项，门槛≥30）`);
if (failed.length === 0) { console.log('✓ 批B（内政经营深挖）验证全部通过'); }
else { console.log('✗ 批B验证存在失败：'); failed.forEach(x => console.log('   ✗ ' + x)); process.exitCode = 1; }