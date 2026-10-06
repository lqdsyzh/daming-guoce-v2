// ============================================
// 《大明国策》v6.2 批H · 宗藩制度验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批G同构）。
// 覆盖：接线（index引入/modules case/script 存档链三件套 + advanceSeason 挂 tick）/
//      构造器完整结构/封藩·禄米膨胀·减宗禄·削藩(一次vs渐进)·藩乱·平乱三择的确定性主链（钳制状态+forceRevokeRoll）/
//      反爽代价（封藩/减禄/削藩/平乱真实资源·稳定·派系·天命·威望变化）/
//      存档往返/旧档兼容/renderPanel 挂载/零回归钩子（含 G02/A37 紧邻、edict 永久DOM、style 只末尾追加）。
// 史据：《明史》卷82·食货志（宗禄）/卷116-119·诸王传/卷7·成祖本纪（靖难·削藩之戒）；数值注明演绎。
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
console.log('《大明国策》批H（宗藩制度）验证套件');
console.log('========================================================');

// —— 静态接线核验 ——
const jsZf = fs.readFileSync(path.join(ROOT, 'zongfan.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('H1-01', 'index.html 引入 zongfan.js', () =>
    /<script src="zongfan\.js">/.test(html));
assert('H1-02', 'index.html menu-tabs 加 zongfan 钮', () =>
    /data-tab="zongfan"/.test(html));
assert('H1-03', 'modules.js case zongfan 挂 renderZongfanTab（只新增不重排 case）', () =>
    /case 'zongfan'/.test(jsMod) && /renderZongfanTab/.test(jsMod));
assert('H1-04', 'script.js saveGame 序列化 zongfan', () =>
    /zongfan: GameState\.zongfan/.test(jsMain));
assert('H1-05', 'script.js loadGame 兜底 zongfan + zfEnsure', () =>
    /GameState\.zongfan = save\.zongfan/.test(jsMain) && /zfEnsure/.test(jsMain));
assert('H1-06', 'script.js initGame 初始化 initZongfanState', () =>
    /GameState\.zongfan = initZongfanState\(\)/.test(jsMain));
assert('H1-07', 'script.js advanceSeason 挂 zfBurdenTick', () =>
    /zfBurdenTick\(\)/.test(jsMain));
assert('H1-08', 'G02/A37 紧邻断言保留（sfx→yearend→mobileui→script 未破）', () =>
    /sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(html));
assert('H1-09', 'style.css 末尾含批H样式 + 响应式（1列移动端）', () =>
    /批H\(v6\.2\)：宗藩制度/.test(css) && /\.zf-v-row/.test(css) && /\.zf-bar/.test(css) && /@media/.test(css));

// —— 构造器完整结构 ——
fresh('chenghua');
assert('H2-01', 'initZongfanState 返回完整默认结构（vassals/fiefBurden/recall/revolt）', () => {
    const st = R('initZongfanState()');
    return st && Array.isArray(st.vassals) && typeof st.fiefBurden === 'number' &&
        st.recall === 0 && st.revolt === null &&
        st.lastBurdenTick !== undefined && st.lastRevoltTick !== undefined;
});
assert('H2-02', '初始化已播种开国宗藩（≥1藩）', () =>
    R('GameState.zongfan.vassals.length') >= 1);
assert('H2-03', '每藩含 full 字段（id/name/region/fief/reward/generation/martial/loyalty）', () => {
    const v = R('GameState.zongfan.vassals[0]');
    return v && typeof v.id === 'string' && v.name && v.region && v.fief &&
        typeof v.reward === 'number' && typeof v.generation === 'number' &&
        typeof v.martial === 'number' && typeof v.loyalty === 'number';
});
assert('H2-04', 'fiefBurden 初始在 0-1 合理区间且>0', () => {
    const b = R('GameState.zongfan.fiefBurden');
    return b > 0 && b <= 1;
});

// —— 确定性主链：封藩 → 禄米膨胀 → 减宗禄 → 削藩(一次/渐进) → 藩乱 → 平乱三择 ——
fresh('chenghua');
// 重置为两位可判定的藩：A=忠高，B=忠低
R(`GameState.zongfan.vassals=[
  {id:'vA',name:'忠王',region:'陕西·西安',fief:'西安府封地',reward:2000,generation:1,martial:45,loyalty:85,source:'测试'},
  {id:'vB',name:'佞王',region:'山东·济南',fief:'济南府封地',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'}
]; GameState.zongfan.fiefBurden=(2000+2000)/30000; GameState.zongfan.cd={}; GameState.zongfan.revolt=null;
 GameState.zongfan.recall=0; GameState.zongfan.revokeCount=0; GameState.stats.treasury=50000;`);

// —— 封藩 ——
assert('H3-01', 'zfEnfeoff：国库充足时新增藩、支出册封费、负担上升、稳定+、宗室派系+', () => {
    const n0 = R('GameState.zongfan.vassals.length');
    const trea0 = R('GameState.stats.treasury');
    const bur0 = R('GameState.zongfan.fiefBurden');
    const stab0 = R('GameState.stats.stability');
    const roy0 = R('GameState.factions.royal');
    R('GameState.zongfan.cd.enfeoff=-99');
    const ok = R('zfEnfeoff()');
    return ok === true &&
        R('GameState.zongfan.vassals.length') === n0 + 1 &&
        R('GameState.stats.treasury') === trea0 - 3000 &&
        R('GameState.zongfan.fiefBurden') > bur0 &&
        R('GameState.stats.stability') >= stab0 &&
        R('GameState.factions.royal') >= roy0;
});
assert('H3-02', 'zfEnfeoff：国库不足时拒绝且无副作用', () => {
    R('GameState.stats.treasury=500; GameState.zongfan.cd.enfeoff=-99;');
    const n0 = R('GameState.zongfan.vassals.length');
    const trea0 = R('GameState.stats.treasury');
    const ok = R('zfEnfeoff()');
    return ok === false && R('GameState.zongfan.vassals.length') === n0 && R('GameState.stats.treasury') === trea0;
});

// —— 禄米膨胀 ——
assert('H3-03', 'zfBurdenTick：同tick去重（两次调用不重复结算）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.lastBurdenTick=-1;`);
    R('zfBurdenTick();');
    const tA1 = R('GameState.zongfan.vassals[0].reward');
    const trea1 = R('GameState.stats.treasury');
    R('zfBurdenTick();');   // 同一tick，应早退
    const tA2 = R('GameState.zongfan.vassals[0].reward');
    const trea2 = R('GameState.stats.treasury');
    return tA1 === tA2 && trea1 === trea2 && tA1 > 2000;
});
assert('H3-04', 'zfBurdenTick：换章后禄米随世代膨胀、负担升高、国库每章扣宗禄', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:2,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.fiefBurden=(2000+2000)/30000; GameState.stats.treasury=50000; GameState.currentSeason=2; GameState.zongfan.lastBurdenTick=-1;`);
    const rewardA0 = R('GameState.zongfan.vassals[0].reward');
    const rewardB0 = R('GameState.zongfan.vassals[1].reward');
    const trea0 = R('GameState.stats.treasury');
    const bur0 = R('GameState.zongfan.fiefBurden');
    R('zfBurdenTick();');
    // 代代膨胀：generation2 涨得比 generation1 多
    return R('GameState.zongfan.vassals[0].reward') === rewardA0 + 20 &&
        R('GameState.zongfan.vassals[1].reward') === rewardB0 + 40 &&
        R('GameState.stats.treasury') < trea0 &&
        R('GameState.zongfan.fiefBurden') > bur0;
});

// —— 减宗禄 ——
assert('H3-05', 'zfReduceStipend：削减禄米、宗室怨望（忠诚↓）派系↓、负担↓', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},]
      ; GameState.zongfan.fiefBurden=2000/30000; GameState.zongfan.cd.reduce=-99; GameState.factions.royal=50;`);
    const loy0 = R('GameState.zongfan.vassals[0].loyalty');
    const rev0 = R('GameState.zongfan.vassals[0].reward');
    const roy0 = R('GameState.factions.royal');
    const ok = R('zfReduceStipend("vA")');
    return ok === true &&
        R('GameState.zongfan.vassals[0].reward') < rev0 &&
        R('GameState.zongfan.vassals[0].loyalty') < loy0 &&
        R('GameState.factions.royal') < roy0 &&
        R('GameState.zongfan.fiefBurden') < rev0 / 30000;
});

// —— 削藩（一次性：忠高则从）——
assert('H3-06', 'zfRevoke("one")：忠高+roll高→除爵归朝、抄禄入国、负担降、recall+', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:85,source:'测试'},]
      ; GameState.zongfan.fiefBurden=2000/30000; GameState.zongfan.recall=0; GameState.zongfan.cd.revoke=-99;
      GameState.zongfan.forceRevokeRoll=1; GameState.stats.treasury=50000; var bur0=GameState.zongfan.fiefBurden;`);
    const n0 = R('GameState.zongfan.vassals.length');
    const ok = R('zfRevoke("vA","one")');
    return ok === true && R('GameState.zongfan.vassals.length') === n0 - 1 &&
        R('GameState.stats.treasury') > 50000 &&
        R('GameState.zongfan.recall') > 0 &&
        R('GameState.zongfan.fiefBurden') === 0;
});

// —— 削藩（一次性：忠低+roll低→藩乱）——
assert('H3-07', 'zfRevoke("one")：忠低+roll低→藩乱爆发（revolt置藩、稳定大跌、军力折损）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.revolt=null; GameState.zongfan.cd.revoke=-99; GameState.zongfan.lastRevoltTick=-1;
      GameState.zongfan.forceRevokeRoll=-1; GameState.stats.stability=60; GameState.stats.militaryPower=500;`);
    const n0 = R('GameState.zongfan.vassals.length');
    const ok = R('zfRevoke("vB","one")');
    return ok === false && R('GameState.zongfan.vassals.length') === n0 &&   // 藩未除、待平乱
        R('GameState.zongfan.revolt') === 'vB' &&
        R('GameState.stats.stability') < 60 &&
        R('GameState.stats.militaryPower') < 500;
});

// —— 削藩（渐进：稳、耗财、不激变）——
assert('H3-08', 'zfRevoke("step")：稳健削除禄四成、耗安置费、不触发藩乱', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vC',name:'渐王',region:'X',fief:'Y',reward:2000,generation:1,martial:48,loyalty:55,source:'测试'},]
      ; GameState.zongfan.revolt=null; GameState.zongfan.cd.revoke=-99; GameState.stats.treasury=50000;`);
    const rev0 = R('GameState.zongfan.vassals[0].reward');
    const ok = R('zfRevoke("vC","step")');
    return ok === true && R('GameState.stats.treasury') === 50000 - 2000 &&
        R('GameState.zongfan.vassals[0].reward') === Math.floor(rev0 * 0.6) &&
        R('GameState.zongfan.revolt') === null;
});

// —— 平乱三择 ——
assert('H3-09', 'zfQuellRevolt(zhaofu)：招抚破财示弱，乱平、藩仍食禄', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.revolt='vB'; GameState.stats.treasury=50000; GameState.stats.prestige=50;`);
    const n0z = R('GameState.zongfan.vassals.length');
    const ok = R('zfQuellRevolt("zhaofu")');
    return ok === true && R('GameState.zongfan.revolt') === null &&
        R('GameState.stats.treasury') === 50000 - 3000 &&
        R('GameState.stats.prestige') < 50 &&
        R('GameState.zongfan.vassals.length') === n0z;
});
assert('H3-10', 'zfQuellRevolt(taofa)：讨伐平乱除藩、破财耗军、天命微损', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.revolt='vB'; GameState.stats.treasury=50000; GameState.stats.mandate=60;`);
    const n0t = R('GameState.zongfan.vassals.length');
    const ok = R('zfQuellRevolt("taofa")');
    return ok === true && R('GameState.zongfan.revolt') === null &&
        R('GameState.stats.treasury') === 50000 - 5000 &&
        R('GameState.zongfan.vassals.length') === n0t - 1 &&
        R('GameState.stats.mandate') < 60;
});
assert('H3-11', 'zfQuellRevolt(aiwei)：哽咽暧昧耗内帑、优柔稳定大跌、藩犹存', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.revolt='vB'; GameState.stats.privyPurse=5000; GameState.stats.treasury=50000; GameState.stats.stability=60;`);
    const n0a = R('GameState.zongfan.vassals.length');
    const ok = R('zfQuellRevolt("aiwei")');
    return ok === true && R('GameState.zongfan.revolt') === null &&
        R('GameState.stats.privyPurse') === 5000 - 4000 &&
        R('GameState.stats.stability') < 60 &&
        R('GameState.zongfan.vassals.length') === n0a;
});

// —— 反爽代价核验 ——
assert('H4-01', '封藩含真实代价：一次性耗国库 + 禄米永久膨胀（负担升）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},]
      ; GameState.zongfan.fiefBurden=2000/30000; GameState.zongfan.cd.enfeoff=-99; GameState.stats.treasury=50000;`);
    const bur0e = R('GameState.zongfan.fiefBurden');
    R('zfEnfeoff();');
    return R('GameState.stats.treasury') < 50000 && R('GameState.zongfan.fiefBurden') > bur0e &&
        R('GameState.zongfan.vassals.length') === 2;
});
assert('H4-02', '减宗禄含真实代价：宗室怨望（忠诚↓）+ 宗室派系↓', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},]
      ; GameState.zongfan.cd.reduce=-99; GameState.factions.royal=50;`);
    R('zfReduceStipend("vA");');
    return R('GameState.zongfan.vassals[0].loyalty') < 80 && R('GameState.factions.royal') < 50;
});
assert('H4-03', '削藩含真实代价：一次削成功挫宗室派系/稳定微损；失败则藩乱罪孽深重', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:85,source:'测试'},{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.cd.revoke=-99; GameState.zongfan.forceRevokeRoll=1; GameState.factions.royal=50;`);
    R('zfRevoke("vA","one");');
    const royAfter = R('GameState.factions.royal');
    R(`GameState.zongfan.cd.revoke=-99; GameState.zongfan.forceRevokeRoll=-1; GameState.zongfan.lastRevoltTick=-1; GameState.stats.stability=60;`);
    R('zfRevoke("vB","one");');
    return royAfter < 50 && R('GameState.zongfan.revolt') === 'vB' && R('GameState.stats.stability') < 60;
});
assert('H4-04', '平乱三择各有真实代价（招抚损威望/讨伐损天命耗军/暧昧损内帑与稳定）', () => {
    fresh('chenghua');
    // zhaofu 损威望
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},];
      GameState.zongfan.revolt='vB'; GameState.stats.treasury=50000; GameState.stats.prestige=50;`);
    R('zfQuellRevolt("zhaofu");');
    const pres = R('GameState.stats.prestige');
    // taofa 损天命
    R(`GameState.zongfan.revolt='vB'; GameState.stats.treasury=50000; GameState.stats.mandate=60;`);
    R('zfQuellRevolt("taofa");');
    const mand = R('GameState.stats.mandate');
    // aiwei 损内帑与稳定
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},];
      GameState.zongfan.revolt='vB'; GameState.stats.privyPurse=5000; GameState.stats.stability=60;`);
    R('zfQuellRevolt("aiwei");');
    const stab = R('GameState.stats.stability');
    return pres < 50 && mand < 60 && stab < 60;
});

// —— 回归 / 零破坏 ——
fresh('chenghua');
assert('H5-01', 'renderPanel("zongfan") 挂载并产出宗藩看板HTML', () => {
    R(`updateUI && document.getElementById('center-panel');`);
    R(`renderPanel('zongfan');`);
    const h = R(`document.getElementById('center-panel').innerHTML || ''`);
    return typeof h === 'string' && h.indexOf('宗藩禄米') >= 0 && h.indexOf('zf-hint') >= 0;
});
assert('H5-02', 'renderZongfanTab 含藩王表/禄米账/削减/削藩操作', () => {
    const h = R(`renderZongfanTab()`);
    return typeof h === 'string' && h.indexOf('?') < 0 &&
        /忠王|佞王|秦王|晋王/.test(h) && /zf-v-row/.test(h) && /zfReduceStipend|zfRevoke|zfEnfeoff/.test(h);
});
assert('H5-03', 'renderZongfanTab 在藩乱时渲染平乱三择按钮', () => {
    R(`GameState.zongfan.vassals=[{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'}]; GameState.zongfan.revolt='vB';`);
    const h = R(`renderZongfanTab()`);
    return typeof h === 'string' && /zfQuellRevolt\('zhaofu'|zfQuellRevolt\("zhaofu"/.test(h) &&
        /zfQuellRevolt/.test(h.replace(/zhaofu/,'').replace(/taofa/,'').replace(/aiwei/,''));
});
assert('H5-04', '既有 case h/tribute/prince 未重排破坏（modules 仍含）', () =>
    /case 'tribute'/.test(jsMod) && /case 'prince'/.test(jsMod) && /case 'harem'/.test(jsMod) &&
    jsMod.indexOf("case 'tribute'") < jsMod.indexOf("case 'zongfan'")); // 新增在其后
assert('H5-05', 'edict 永久DOM 未被触碰（index 仍含 edict-zone/season-banner）', () =>
    /edict-zone/.test(html) && /season-banner/.test(html) && !/废弃edict|移除edict/.test(jsZf));
assert('H5-06', 'style.css 只末尾追加（批H注释位于文件末，未重排上游）', () => {
    const idx = css.indexOf('批H(v6.2)：宗藩制度');
    return idx > 0 && idx > css.length * 0.9;
});
assert('H5-07', '存档往返：saveGame→loadGame 恢复 zongfan（含自定义藩）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals.push({id:'zftest',name:'往返藩',region:'X',fief:'Y',reward:3000,generation:2,martial:40,loyalty:60,source:'测试'}); GameState.currentSeason=2;`);
    R('saveGame();');
    R('GameState.zongfan=null;');
    const ok = R('loadGame();');
    return ok === true && R(`GameState.zongfan && GameState.zongfan.vassals.some(function(v){return v.id==='zftest';})`);
});
assert('H5-08', '旧档兼容：无 zongfan 的存档 loadGame 兜底补默认结构', () => {
    fresh('chenghua');
    const save = { script: R('GameState.script.id'), currentYear: 0, currentSeason: 0, currentMonth: 0,
        stats: R('GameState.stats'), timestamp: Date.now() }; // 无 zongfan 字段
    R(`localStorage.setItem('daming_guoce_save_v2', ${JSON.stringify(JSON.stringify(save))});`);
    R('GameState.zongfan=undefined;');
    const ok = R('loadGame();');
    return ok === true && R(`GameState.zongfan && Array.isArray(GameState.zongfan.vassals)`);
});
assert('H5-09', '宗禄每季从国库扣减（延续性支出，非一次性）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:80,source:'测试'},];
      GameState.currentSeason=1; GameState.zongfan.lastBurdenTick=-1;`);
    const t0b = R('GameState.stats.treasury');
    R('zfBurdenTick();');
    return R('GameState.stats.treasury') < t0b;
});
assert('H5-10', '宗室派系(royal)绑定联动：封藩+、减禄/削藩-/藩乱-（路线一致）', () => {
    fresh('chenghua');
    R(`GameState.zongfan.vassals=[{id:'vA',name:'忠王',region:'X',fief:'Y',reward:2000,generation:1,martial:45,loyalty:85,source:'测试'},{id:'vB',name:'佞王',region:'X',fief:'Y',reward:2000,generation:1,martial:55,loyalty:35,source:'测试'},]
      ; GameState.zongfan.cd.enfeoff=-99; GameState.factions.royal=50; GameState.stats.treasury=50000;`);
    R('zfEnfeoff();');            // royal+
    const afterEnf = R('GameState.factions.royal');
    R(`GameState.zongfan.cd.reduce=-99; GameState.factions.royal=50;`);
    R('zfReduceStipend("vA");');  // royal-
    const afterRed = R('GameState.factions.royal');
    return afterEnf > 50 && afterRed < 50;
});

console.log('\n========================================================');
console.log('批H验证结果：' + passed.length + ' 项通过，' + failed.length + ' 项失败（共 ' + (passed.length + failed.length) + ' 项，门槛≥35）');
if (failed.length) {
    console.log('失败项：');
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
} else {
    console.log('✓ 批H 全绿。');
}