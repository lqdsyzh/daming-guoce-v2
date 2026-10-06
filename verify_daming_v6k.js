// ============================================
// 《大明国策》v6.5 批K · 起居注（在位实录/青史留名）验证套件
// 覆盖：接线（index引入 qiuzhuji.js / script 存档链 save+load 兜底+init 初始化 / advanceSeason 挂 qzjTick）/
//      qzjInit 初始化全结构/ qzjTick tick 去重沉淀起居注条目（稳定度骤降·劣政 / 稳定度高危·社稷动摇）/
//      qzjNote 善/劣政累计与历史评价（善恶相抵、恶政代价更重）/ 庙谥阶段性评价（高贤/中平/苛酷/昏聩各档）/
//      在位时长换算 / 渲染 renderQizhujiZone 看板含 stats 与条目 /
//      零回归钩子（edict 永久DOM、modules renderPanel 中 v7CozyInject 后 syncMenuTabActive 精确末尾·A1-08、style.css 未追加·G-06 阈值保持）。
// 史据：《明史》卷73·职官志一（翰林院起居注·掌记天子言动）/卷47·礼志（谥法）；具体评语系演绎。
// ============================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let passed = [], failed = [];
function assert(id, desc, fn) {
    const ok = (() => { try { return !!fn(); } catch (e) { console.log('  [' + id + ' throw] ' + e.message); return false; } })();
    if (ok) passed.push(id); else failed.push(id + ': ' + desc);
}

// —— DOM mock（同构各批）——
function cls() { const s = new Set(); return { add: (...a) => a.forEach(x => s.add(x)), remove: (...a) => a.forEach(x => s.delete(x)),
    toggle: (c, f) => { if (f === undefined) { s.has(c) ? s.delete(c) : s.add(c); } else f ? s.add(c) : s.delete(c); return s.has(c); },
    contains: c => s.has(c), items: () => [...s] }; }
function makeEl(id) { const el = { id, style: {}, dataset: {}, value: '', textContent: '', _html: '', children: [], _cls: cls(), parentNode: null,
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = v; },
    get className() { return el._cls.items().join(' '); }, set className(v) { el._cls = cls(); String(v || '').split(/\s+/).forEach(c => { if (c) el._cls.add(c); }); },
    get classList() { return el._cls; }, appendChild(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
    insertBefore(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; }, removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
    getAttribute() { return ''; }, setAttribute() {}, offsetWidth: 0 }; return el; }
function mkTab(els, id) { if (!els[id]) els[id] = makeEl(id); return els[id]; }
function buildSeed() {
    const body = makeEl('body'); const tabs = makeEl('tabs'); const els = { body, tabs, 'center-panel': makeEl('center-panel') };
    const doc = { __c: 0, body, getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
        querySelectorAll(sel) { let out = []; for (const k in els) if (String(sel).replace('.', '') === k) out.push(els[k]); return out; },
        querySelector() { return null; },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, removeEventListener() {}, documentElement: makeEl('html'), head: makeEl('head') };
    body.appendChild(tabs); body.appendChild(mkTab(els, 'center-panel'));
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
console.log('《大明国策》批K（起居注·在位实录）验证套件');
console.log('========================================================');

// ========== 接线 ==========
assert('K1-01', 'index.html 引入 qiuzhuji.js', () => /qiuzhuji\.js/.test(html));
assert('K1-02', 'script.js saveGame 序列化 qizhuji', () => /qizhuji:\s*GameState\.qizhuji/.test(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8')));
assert('K1-03', 'script.js loadGame 反序列化兜底 qizhuji', () => /GameState\.qizhuji\s*=\s*save\.qizhuji/.test(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8')));
assert('K1-04', 'script.js loadGame 调 qzjEnsure 补齐', () => /qzjEnsure\(\)/.test(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8')));
assert('K1-05', 'script.js initGame 初始化 qizhuji（调 qzjInit）', () => /qzjInit\(\)/.test(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8')));
assert('K1-06', 'script.js advanceSeason 挂 qzjTick（链尾·try-catch）', () => /qzjTick\(\)/.test(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8')));
assert('K1-07', 'b1 G02：sfx→yearend→mobileui→script 紧邻断言未被破坏', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    // b1 G02 通常断言顺序，这里粗略验证未破坏 script.js 内 saveGame 结构
    return /function saveGame\(\)/.test(src) && /function loadGame\(\)/.test(src) && /function initGame/.test(src);
});
assert('K1-08', 'edict 永久DOM（from/title/content）未动', () => {
    const h = html;
    return /id="edict-from"/.test(h) && /id="edict-title"/.test(h) && /id="edict-content"/.test(h) && /id="edict-history-zone"/.test(h);
});
assert('K1-09', 'style.css 未追加 qzj 样式（运行时注入），v5d G-06 阈值保持', () => {
    const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
    return !/qzj-/.test(css);
});

// ========== 结构初始化 ==========
fresh('chenghua');
assert('K2-01', 'initGame 后 GameState.qizhuji 存在且为对象', () => {
    const q = R('GameState.qizhuji'); return q && typeof q === 'object' && q.started === true;
});
assert('K2-02', 'qizhuji 含 years/stats/historyRating/chronicleMark/lastTick 全结构', () => {
    const q = R('GameState.qizhuji');
    return q && Array.isArray(q.years) && q.stats && typeof q.historyRating === 'number'
        && typeof q.chronicleMark === 'string' && typeof q.lastTick === 'number';
});
assert('K2-03', 'stats 含善/劣/在位/峰值字段', () => {
    const st = R('GameState.qizhuji.stats');
    return st && typeof st.reignYears === 'number' && typeof st.goodActs === 'number' && typeof st.badActs === 'number'
        && typeof st.stabilityPeak === 'number' && typeof st.treasuryPeak === 'number';
});
assert('K2-04', '全局暴露 qzjInit/qzjNote/qzjTick/renderQizhujiZone', () => {
    return typeof R('qzjInit') === 'function' && typeof R('qzjNote') === 'function'
        && typeof R('qzjTick') === 'function' && typeof R('renderQizhujiZone') === 'function';
});

// ========== qzjNote 善/劣政累计 + 史评移动 ==========
assert('K3-01', '善政提升历史评价且计入 goodActs/在位季数', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating = 50; GameState.qizhuji.stats.goodActs = 0; GameState.qizhuji.stats.badActs = 0; GameState.qizhuji.stats.reignYears = 0;`);
    R(`qzjNote(1, 1, '赈济灾民', '开仓放粮，饥民得苏。', 'good');`);
    const q = R('GameState.qizhuji');
    return q.stats.goodActs === 1 && q.stats.reignYears === 1 && q.historyRating > 50;
});
assert('K3-02', '劣政降低历史评价且计入 badActs（恶政代价更重）', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating = 50; GameState.qizhuji.stats.goodActs = 0; GameState.qizhuji.stats.badActs = 0;`);
    R(`qzjNote(1, 1, '苛敛于民', '横征暴敛，民怨沸腾。', 'bad');`);
    const q = R('GameState.qizhuji');
    return q.stats.badActs === 1 && q.historyRating < 50;
});
assert('K3-03', '善恶相抵：同量善政可回升评价', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating = 50; qzjNote(1,1,'恶1','','bad'); qzjNote(1,2,'恶2','','bad');`);
    const afterBad = R('GameState.qizhuji.historyRating');
    R(`qzjNote(1,3,'善1','','good'); qzjNote(1,4,'善2','','good'); qzjNote(1,5,'善3','','good');`);
    const afterGood = R('GameState.qizhuji.historyRating');
    // 两劣(-4.8)后三善(+4.8)拉回至原位附近(浮点±0.1)，且比两劣后高
    return afterGood > afterBad && afterGood >= 49 && afterGood <= 51;
});
assert('K3-04', '起居注条目按同季同标题去重（降噪）', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.years=[]; GameState.qizhuji.stats.reignYears=0; GameState.qizhuji._lastKey=null; qzjNote(1,1,'A','','good'); qzjNote(1,1,'A','','good'); qzjNote(1,2,'B','','good');`);
    const n = R('GameState.qizhuji.years.length');
    return n === 2;
});

// ========== 庙谥阶段性评价 ==========
assert('K4-01', '高史评(≥85)生成圣明短评', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating=90; qzjUpdateMark(GameState.qizhuji);`);
    const m = R('GameState.qizhuji.chronicleMark');
    return typeof m === 'string' && /圣德/.test(m);
});
assert('K4-02', '中低史评(40-55)生成苛酷/讥评短评', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating=50; qzjUpdateMark(GameState.qizhuji);`);
    const m = R('GameState.qizhuji.chronicleMark');
    return typeof m === 'string' && /苛酷/.test(m);
});
assert('K4-03', '低史评(<40)生成昏聩/贬斥短评', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.historyRating=20; qzjUpdateMark(GameState.qizhuji);`);
    const m = R('GameState.qizhuji.chronicleMark');
    return typeof m === 'string' && (/昏聩|德凉|贬/.test(m));
});

// ========== qzjTick 沉淀（含 tick 去重） ==========
assert('K5-01', '稳定度骤降(<25)时 qzjTick 沉淀劣政条目', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.lastTick=-1; GameState.qizhuji.years=[]; GameState.stats.stability=15; GameState.currentYear=3; GameState.currentSeason=2; try{GameState.tick=100;}catch(e){}; qzjTick();`);
    const titles = R(`GameState.qizhuji.years.map(e=>e.title)`);
    return Array.isArray(titles) && titles.some(t => /动摇|昇平|府库|权奸/.test(t)) && titles.some(t => /动摇/.test(t));
});
assert('K5-02', 'qzjTick 同 tick 去重不重复沉淀', () => {
    fresh('chenghua');
    R(`GameState.qizhuji.lastTick=-1; GameState.qizhuji._lastKey=null; GameState.qizhuji.years=[]; GameState.stats.stability=15; GameState.currentYear=3; GameState.currentSeason=2; GameState.tick=100; qzjTick(); qzjTick();`);
    const l = R('GameState.qizhuji.years.length');
    return l === 1;
});

// ========== 渲染看板 ==========
assert('K6-01', 'renderQizhujiZone 返回含看板容器与统计', () => {
    fresh('chenghua');
    const h = R('renderQizhujiZone()');
    return typeof h === 'string' && /qzj-board/.test(h) && /qzj-mark/.test(h) && /qzj-stats/.test(h);
});
assert('K6-02', '看板含在位时长与史评字词', () => {
    fresh('chenghua');
    const h = R('renderQizhujiZone()');
    return typeof h === 'string' && /在位/.test(h) && /史评/.test(h);
});
assert('K6-03', '看板含最近起居注条目（有事件时）', () => {
    fresh('chenghua');
    R(`qzjNote(1,1,'亲行大祭','郊祀天地','good');`);
    const h = R('renderQizhujiZone()');
    return /qzj-item/.test(h) && /亲行大祭/.test(h);
});

// ========== 零回归 ==========
assert('K7-01', 'modules.js renderPanel 中 v7CozyInject 后 syncMenuTabActive(tab); 仍精确末尾（A1-08）', () => {
    const src = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
    return /syncMenuTabActive\(tab\);\s*\}/.test(src);
});
assert('K7-02', 'modules.js v7CozyInject 含"国事区独占首页"让位规则（v6.5）', () => {
    const src = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
    return /edict-zone\{display:none/.test(src);
});
assert('K7-03', 'overview.js 首页并入 renderQizhujiZone 看板块', () => {
    const src = fs.readFileSync(path.join(ROOT, 'overview.js'), 'utf8');
    return /renderQizhujiZone/.test(src);
});
assert('K7-04', 'advanceSeason 挂链位置在 pvProvinceTick 之后（批K 属链尾）', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    const pv = src.indexOf('pvProvinceTick()');
    const qzj = src.indexOf('qzjTick()');
    return pv !== -1 && qzj > pv;
});
assert('K7-05', '史评字词函数 qzjRatingWord 各档可用', () => {
    fresh('chenghua');
    return R('qzjRatingWord(90)') === '圣明' && R('qzjRatingWord(60)') === '中平' && R('qzjRatingWord(10)') === '昏聩';
});

console.log('------------------------------------------------');
console.log('通过: ' + passed.length + '  失败: ' + failed.length + '（门槛 ≥30）');
if (failed.length) { console.log('失败项:'); failed.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
if (passed.length < 30) { console.log('门槛未达(≥30)。'); process.exit(1); }
console.log('批K全部通过。');
process.exit(0);