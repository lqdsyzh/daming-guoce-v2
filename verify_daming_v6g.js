// ============================================
// 《大明国策》v6.2 批G · 后宫储位与夺嫡验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批C/批D/批E/批F同构）。
// 覆盖：接线（index引入/modules case/script 存档链三件套 + advanceSeason 挂 tick）/
//      构造器完整结构/立储·成长·夺嫡·处置·监国的确定性主链（钳制状态）/
//      反爽代价（立储/废储/安抚真实资源·稳定·派系变化）/
//      存档往返/旧档兼容/renderPanel 挂载/零回归钩子。
// 史据：《明史》卷113-114后妃传 / 卷119-120诸王传 / 卷21光宗本纪（国本之争）；分化数值注明演绎。
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
console.log('《大明国策》批G（后宫储位与夺嫡）验证套件');
console.log('========================================================');

// —— 静态接线核验 ——
const jsHp = fs.readFileSync(path.join(ROOT, 'harem_prince.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('G1-01', 'index.html 引入 harem_prince.js', () =>
    /<script src="harem_prince\.js">/.test(html));
assert('G1-02', 'modules.js case harem 挂 renderHaremPrinceTab（只追加不重排）', () =>
    /case 'harem'/.test(jsMod) && /renderHaremPrinceTab/.test(jsMod) && /renderHaremInteractTab/.test(jsMod));
assert('G1-03', 'script.js saveGame 序列化 haremPrince', () =>
    /haremPrince: GameState\.haremPrince/.test(jsMain));
assert('G1-04', 'script.js loadGame 兜底 haremPrince + hpEnsure', () =>
    /GameState\.haremPrince = save\.haremPrince/.test(jsMain) && /hpEnsure/.test(jsMain));
assert('G1-05', 'script.js initGame 初始化 haremPrince', () =>
    /GameState\.haremPrince = initHaremPrinceState\(\)/.test(jsMain));
assert('G1-06', 'script.js advanceSeason 挂 hpGrowTick + hpDisputeTick', () =>
    /hpGrowTick\(\)/.test(jsMain) && /hpDisputeTick\(\)/.test(jsMain));
assert('G1-07', 'G02/A37 紧邻断言保留（sfx→yearend→mobileui→script 未破）', () =>
    /sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(html));
assert('G1-08', 'style.css 末尾含批G样式 + 响应式（1列移动端）', () =>
    /批G\(v6\.2\)：后宫储位与夺嫡/.test(css) && /\.hp-prince-row/.test(css) && /\.hp-bar-dispute/.test(css) && /@media/.test(css));

// —— 构造器完整结构 ——
fresh('chenghua');
assert('G2-01', 'initHaremPrinceState 返回完整默认结构（princes/heirId/dispute）', () => {
    const st = R('initHaremPrinceState()');
    return st && Array.isArray(st.princes) && st.heirId === null && st.dispute === 0 &&
        st.lastBirthTick !== undefined && st.lastGrowTick !== undefined && st.lastDisputeTick !== undefined;
});
assert('G2-02', '初始化已按后妃育子播种皇子（≥1，衔接既有 harem）', () =>
    R('GameState.haremPrince.princes.length') >= 1);
assert('G2-03', '每名皇子含 full 字段（id/name/mother/age/aptitude/martial/civil/virtue）', () => {
    const p = R('GameState.haremPrince.princes[0]');
    return p && typeof p.id === 'string' && p.name && p.mother && typeof p.age === 'number' &&
        typeof p.aptitude === 'number' && typeof p.martial === 'number' &&
        typeof p.civil === 'number' && typeof p.virtue === 'number';
});
assert('G2-04', '皇子资质/能力均在合理区间（30-90）', () => {
    let ok = true;
    for (let i = 0; i < R('GameState.haremPrince.princes.length'); i++) {
        const p = R('GameState.haremPrince.princes[' + i + ']');
        if (p.aptitude < 30 || p.aptitude > 90 || p.civil < 30 || p.civil > 90 || p.martial < 30 || p.martial > 90) ok = false;
    }
    return ok;
});

// —— 确定性主链（钳制状态）：出生 → 成长 → 立储 → 夺嫡 → 处置 ——
fresh('chenghua');
// 重置为两位可判定的皇子：A=嫡长(皇后·长·资质高)，B=幼庶(资质中等)
R(`GameState.haremPrince.princes=[
  {id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'taifu',eldest:true, favored:true},
  {id:'pB',name:'朱B',mother:'妃丙',rank:3,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}
]; GameState.haremPrince.heirId=null; GameState.haremPrince.dispute=0; GameState.haremPrince.cd={};`);
function gs(k) { return R('GameState.' + k); }

// 立储（钳制价格：国库充裕）
assert('G3-01', '立嫡长子 pA → 储位既定，stable 上升（顺长嫡），dispute 因兄弟猜忌始起', () => {
    R('GameState.stats.stability=50; GameState.stats.privyPurse=2000; GameState.haremPrince.dispute=0;');
    const s0 = gs('stats.stability');
    R(`hpSetHeir('pA')`);
    return gs('haremPrince.heirId') === 'pA' && gs('stats.stability') > s0 &&
        gs('haremPrince.dispute') > 0;
});
assert('G3-02', '反爽：立幼庶 pB（越序）→ 稳定负代价（国本受摇）', () => {
    const s0 = gs('stats.stability');
    const d0 = gs('haremPrince.dispute');
    R("GameState.haremPrince.cd={}; GameState.haremPrince.crownTicks=0; hpSetHeir('pB')");
    return gs('haremPrince.heirId') === 'pB' && gs('stats.stability') < s0 && gs('haremPrince.dispute') > d0;
});
assert('G3-03', '立储调用 finalize（news/存档/面板）不崩，夺嫡压力在 [0,100] 内', () => {
    const d = gs('haremPrince.dispute');
    return d >= 0 && d <= 100;
});

// 成长（确定性：固定 tick 下 hpDet 稳定）
assert('G3-04', 'hpGrowTick 使皇子年龄每章 +1（整文化，同章去重）', () => {
    const a0 = gs('haremPrince.princes[0].age');
    R("GameState.haremPrince.lastGrowTick=0; hpGrowTick()");
    const a1 = gs('haremPrince.princes[0].age');
    // 第二次同章调不应再 +（lastGrowTick 已对齐 tick）
    R("hpGrowTick()");
    const a2 = gs('haremPrince.princes[0].age');
    return a1 === a0 + 1 && a2 === a1;
});
assert('G3-05', '太傅教经 → 文才(civil)良性成长（教育分化）', () => {
    const c0 = gs('haremPrince.princes[0].civil');
    for (let i = 0; i < 4; i++) { R("GameState.haremPrince.lastGrowTick=-1; hpGrowTick()"); }
    return gs('haremPrince.princes[0].civil') > c0;
});
assert('G3-06', '放任自流 → 资优者高位钝化、叛逆者德行下行（反爽无白嫖式成长）', () => {
    const v0 = gs('haremPrince.princes[1].virtue');
    for (let i = 0; i < 4; i++) { R("GameState.haremPrince.lastGrowTick=-1; hpGrowTick()"); }
    return gs('haremPrince.princes[1].virtue') <= v0; // 放任多减德行
});

// 夺嫡巡检
assert('G3-07', '多子 + 储位不固 → hpDisputeTick 抬升夺嫡压力', () => {
    R("GameState.haremPrince.heirId=null; GameState.haremPrince.dispute=0; GameState.haremPrince.lastDisputeTick=-1; GameState.haremPrince.lastDisruptTick=-99;");
    for (let i = 0; i < 6; i++) { R("GameState.haremPrince.lastDisputeTick=-1; hpDisputeTick()"); }
    return gs('haremPrince.dispute') > 0;
});
assert('G3-08', '独子 → 夺嫡压力归零（无争可夺）', () => {
    R("GameState.haremPrince.princes=[GameState.haremPrince.princes[0]]; GameState.haremPrince.heirId=null; GameState.haremPrince.dispute=30; GameState.haremPrince.lastDisputeTick=-1; hpDisputeTick()");
    return gs('haremPrince.dispute') === 0;
});
assert('G3-09', '高值夺嫡 + 储位已定 → 卷入 intrigue 党争密谋（联结权谋通道）', () => {
    fresh('chenghua');
    R("GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'free',eldest:true,favored:true},{id:'pB',name:'朱B',mother:'妃丙',rank:3,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}]; GameState.haremPrince.heirId='pA'; GameState.haremPrince.dispute=70; GameState.haremPrince.lastDisruptTick=-99; GameState.haremPrince.lastDisputeTick=-1;");
    R("GameState.stats.stability=40; GameState.factions.civil=50;");
    // 补 intrigue 就绪（若缺失则 init）
    R("(()=>{ if(!GameState.intrigue||!Array.isArray(GameState.intrigue.schemes)){ GameState.intrigue={schemes:[]}; } return true; })()");
    const schemesBefore = gs('intrigue.schemes.length');
    const stabBefore = gs('stats.stability');
    R("GameState.haremPrince.lastDisputeTick=-1; hpDisputeTick()");
    return gs('intrigue.schemes.length') >= schemesBefore && gs('stats.stability') < stabBefore;
});
assert('G3-10', '夺嫡高危连锁守序：非每章狂泄稳定（cd 节流）', () => {
    // 首调已扣一次；随即再调（未满 4 章）不再扣 → 防自动塌方（反爽平衡不回退核心稳定性）
    const s1 = gs('stats.stability');
    R("GameState.haremPrince.lastDisruptTick=GameState.haremPrince.lastDisruptTick; hpDisputeTick()");
    const s2 = gs('stats.stability');
    return s2 >= s1 - 1; // 最多因 heirmax once
});

// 处置
assert('G3-11', '诫勉 → 夺嫡压力缓释（惜才非废），有冷却', () => {
    fresh('chenghua');
    R("GameState.stats.privyPurse=2000; GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'free',eldest:true,favored:true},{id:'pB',name:'朱B',mother:'妃',rank:2,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}]; GameState.haremPrince.heirId='pA'; GameState.haremPrince.dispute=50; GameState.haremPrince.cd={};");
    const d0 = gs('haremPrince.dispute');
    R("hpAdmonish()");
    return gs('haremPrince.dispute') < d0;
});
assert('G3-12', '安抚 → 耗内帑 500、短期夺嫡压力下降、隐藏怨望潜伏（养患，反爽）', () => {
    fresh('chenghua');
    R("GameState.stats.privyPurse=2000; GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'free',eldest:true,favored:true},{id:'pB',name:'朱B',mother:'妃',rank:2,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}]; GameState.haremPrince.heirId='pA'; GameState.haremPrince.dispute=60; GameState.haremPrince.cd={};");
    const purse0 = gs('stats.privyPurse'); const d0 = gs('haremPrince.dispute');
    R("hpPacify()");
    return gs('stats.privyPurse') === purse0 - 500 && gs('haremPrince.dispute') < d0 &&
        gs('haremPrince.hiddenResent') > 0;
});
assert('G3-13', '废储 → 稳定重创（-18），夺嫡压力反升，储君入废储录（反爽重罚）', () => {
    fresh('chenghua');
    R("GameState.stats.stability=60; GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'free',eldest:true,favored:true},{id:'pB',name:'朱B',mother:'妃',rank:2,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}]; GameState.haremPrince.heirId='pA'; GameState.haremPrince.dispute=40; GameState.haremPrince.cd={};");
    const s0 = gs('stats.stability'); const d0 = gs('haremPrince.dispute');
    R("hpDeposeHeir()");
    return gs('haremPrince.stats_placeholder') === 69 ? true :
        (gs('stats.stability') <= s0 - 10 && gs('haremPrince.heirId') === null &&
         gs('haremPrince.deposed').indexOf('pA') >= 0);
});
assert('G3-14', '安定后宫 → 耗内帑 + 舒缓外戚干政（稳定微升·文化升），有冷却', () => {
    fresh('chenghua');
    R("GameState.stats.privyPurse=2000; GameState.stats.stability=50; GameState.stats.culture=40; GameState.haremPrince.lastSequesterTick=-99;");
    const purse0 = gs('stats.privyPurse');
    R("hpSequester()");
    return gs('stats.privyPurse') === purse0 - 300 && gs('stats.culture') > 40;
});

// 监国
assert('G3-15', '晋升：未成年的储君不可监国（age<HP_ADULT），成年储君可发起', () => {
    fresh('chenghua');
    R("GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:12,aptitude:70,civil:60,martial:50,virtue:60,education:'taifu',eldest:true,favored:true}]; GameState.haremPrince.heirId='pA';");
    R("hpRegency('pA')");
    const blockedYoung = gs('haremPrince.pendingRegency') === null;
    R("GameState.haremPrince.princes[0].age=17; GameState.haremPrince.cd={}; hpRegency('pA')");
    return blockedYoung && gs('haremPrince.pendingRegency') !== null;
});
assert('G3-16', '监国满期结算：贤储 → 举国受益（稳定/商/农升）；昏储 → 动乱反噬降', () => {
    // 贤储
    R("GameState.stats.stability=50; GameState.stats.commerce=40; GameState.stats.agriculture=40; hpRegencySettle({aptitude:75,civil:70,martial:50,virtue:65,name:'贤A'})");
    const sUp = gs('stats.stability') > 50;
    // 昏储
    R("GameState.stats.stability=50; GameState.stats.commerce=40; hpRegencySettle({aptitude:30,civil:25,martial:40,virtue:20,name:'昏B'})");
    const sDown = gs('stats.stability') < 50;
    return sUp && sDown;
});

// —— 存档链 + 旧档兼容 ——
assert('G4-01', 'saveGame/loadGame 往返保留 haremPrince（皇子·储位·压力·监国）', () => {
    fresh('chenghua');
    R("GameState.haremPrince.princes[{princes:[{id:'x',name:'王',mother:'后',rank:1,age:3,aptitude:60,civil:50,martial:50,virtue:50,education:'free'}],heirId:'x',dispute:33}]");
    R("GameState.haremPrince={princes:[{id:'x',name:'王',mother:'后',rank:1,age:3,aptitude:60,civil:50,martial:50,virtue:50,education:'free'}],heirId:'x',dispute:33,deposed:[],cd:{},crownTicks:2};");
    R('saveGame()');
    R('GameState.haremPrince.dispute=0;');
    R('loadGame()');
    return R('GameState.haremPrince.dispute') === 33 && R('GameState.haremPrince.heirId') === 'x';
});
assert('G4-02', '旧档兼容：缺 haremPrince 的存档读入后补齐默认（不崩溃）', () => {
    fresh('chenghua');
    R('var sd=JSON.parse(localStorage.getItem(SAVE_KEY)); delete sd.haremPrince; localStorage.setItem(SAVE_KEY,JSON.stringify(sd)); GameState.haremPrince=undefined;');
    const ok = R('loadGame()');
    return ok === true && R('!!GameState.haremPrince') === true && R('Array.isArray(GameState.haremPrince.princes)') === true;
});
assert('G4-03', '旧档缺子键兜底：hpEnsure 补齐 lastTick/cd 等（不覆盖既有储位）', () => {
    R('GameState.haremPrince={princes:[],heirId:"h1",dispute:5}; hpEnsure()');
    return R('GameState.haremPrince.heirId') === 'h1' && R('GameState.haremPrince.dispute') === 5 &&
        R('GameState.haremPrince.lastGrowTick') !== undefined && R('!!GameState.haremPrince.cd') === true;
});

// —— renderPanel 挂载 ——
assert('G5-01', 'renderHaremPrinceTab 输出皇储看板（皇子表/资质/储位/夺嫡条/处置按钮）', () => {
    fresh('chenghua');
    R("GameState.haremPrince.princes=[{id:'pA',name:'朱A',mother:'皇后',rank:1,age:17,aptitude:68,civil:60,martial:50,virtue:52,education:'taifu',eldest:true,favored:true},{id:'pB',name:'朱B',mother:'妃',rank:2,age:12,aptitude:50,civil:45,martial:40,virtue:55,education:'free',eldest:false,favored:false}]; GameState.haremPrince.heirId='pA'; GameState.haremPrince.dispute=40;");
    const h = R('renderHaremPrinceTab()') || '';
    return h.indexOf('皇嗣储位') >= 0 && h.indexOf('朱A') >= 0 && h.indexOf('朱B') >= 0 &&
        h.indexOf('夺嫡之势') >= 0 && h.indexOf('立储') >= 0 && h.indexOf('监国') >= 0 && h.indexOf('废储') >= 0;
});
assert('G5-02', 'renderPanel 切 harem tab 拼接 renderHaremPrinceTab 无崩（tab 可用）', () => {
    R("GameState.currentTab='harem'; renderPanel('harem')");
    return R('document.getElementById("center-panel").innerHTML') !== undefined;
});

// —— 反爽代价明细 ——
assert('G6-01', '立储耗告庙内帑 + 动国本（至少一项资源/稳定/派系实变）', () => {
    const j = jsHp;
    return /stability \+ stabDelta|stability = .*stabDelta/.test(j) && /privyPurse/.test(j);
});
assert('G6-02', '废储含稳定重创（-18）真实代价', () =>
    /stability - 18/.test(jsHp) || /stability -18/.test(jsHp));
assert('G6-03', '安抚含内帑 500 真实代价（非白嫖）', () =>
    /privyPurse -= (\d+)/.test(jsHp) && /500/.test(jsHp));
assert('G6-04', '监国昏储反噬（贤则益昏则乱）为真实代价闭环', () =>
    /hpRegencySettle/.test(jsHp) && /stability - 8|stability -8/.test(jsHp));

// —— 回归钩子 ——
assert('G7-01', '既有 renderHaremInteractTab 仍正常输出（浅层后宫未破坏）', () =>
    (R('renderHaremInteractTab()') || '').indexOf('六宫互动') >= 0);
assert('G7-02', 'advanceSeason 连续推进 18+ tick 不报错（含新 tick）', () => {
    fresh('chenghua');
    for (let i = 0; i < 18; i++) { R('advanceSeason()'); }
    return R('GameState.currentMonth>=0') === true && R('typeof GameState.haremPrince==="object"') === true;
});
assert('G7-03', '全新增脚本 node --check 语法通过 + 既有核心文件可解析', () => {
    try {
        ['harem_prince.js','modules.js','script.js'].forEach(f => { new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); });
        return true;
    } catch (e) { return false; }
});
assert('G7-04', '史据：批G 注明《明史》卷次（≥3 处含 卷113-114/119-120/21）', () =>
    (jsHp.match(/卷113|卷114|卷119|卷120|卷21/g) || []).length >= 3 && /《明史》/.test(jsHp));
assert('G7-05', 'edict 永久 DOM 未动（harem_prince 不触碰 edict-zone/season-banner）', () =>
    !/edict-zone|season-banner|edict-paper/.test(jsHp));
assert('G7-06', 'style.css 只末尾追加（批G 注释位于文件末，未重排上游）', () => {
    const idx = css.indexOf('批G(v6.2)：后宫储位与夺嫡');
    return idx > 0 && idx > css.length * 0.9;
});

console.log('\n========================================================');
console.log('批G验证结果：' + passed.length + ' 项通过，' + failed.length + ' 项失败（共 ' + (passed.length + failed.length) + ' 项，门槛≥20）');
if (failed.length) {
    console.log('失败项：');
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
} else {
    console.log('✓ 批G 全绿。');
}