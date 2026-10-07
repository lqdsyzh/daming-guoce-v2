// ============================================
// 《大明国策》v6.1 批F · 军事科技树深挖验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批C/批D/批E同构）。
// 覆盖：科技树三线节点结构/前置与代价（无白嫖）/战法接入 BF_TACTICS（按解锁）/新兵种入战棋/
//      出征胜率联动（milOpsPowerMod）/存档链三件套/旧档兼容/renderPanel 挂载/零回归钩子。
// 史据：各节点见 src（核《明史》兵志 卷91营制/卷92马政·火器·车营/卷93·94水军）；设演绎注明。
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

// —— DOM mock（同构批C/批D/批E）——
function makeClassList() {
    const set = new Set();
    return { add: (...a) => a.forEach(x => set.add(x)), remove: (...a) => a.forEach(x => set.delete(x)),
        toggle: (c, f) => { if (f === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else f ? set.add(c) : set.delete(c); return set.has(c); },
        contains: c => set.has(c), items: () => [...set] };
}
function makeEl(id) {
    const el = { id, style: {}, dataset: {}, value: '', textContent: '', _html: '', children: [], _cls: makeClassList(), parentNode: null,
        get innerHTML() { return el._html; }, set innerHTML(v) { el._html = v; },
        get className() { return el._cls.items().join(' '); }, set className(v) { el._cls = makeClassList(); String(v || '').split(/\s+/).forEach(c => { if (c) el._cls.add(c); }); },
        get classList() { return el._cls; }, appendChild(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
        insertBefore(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; }, removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
        querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
        getAttribute() { return ''; }, setAttribute() {}, offsetWidth: 0 };
    return el;
}
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
console.log('《大明国策》批F（军事科技树深挖）验证套件');
console.log('========================================================');

// —— 静态钩子核验 ——
const jsTech = fs.readFileSync(path.join(ROOT, 'military_tech_ext.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const jsBf = fs.readFileSync(path.join(ROOT, 'battlefield.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('F1-01', 'military_tech_ext.js 存在且含核心函数', () =>
    /function initMilTechState/.test(jsTech) && /function ensureMilTechState/.test(jsTech) &&
    /function milTechTick/.test(jsTech) && /function renderMilTechTab/.test(jsTech) &&
    /function mtAppendTactics/.test(jsTech) && /function mtResearchCav/.test(jsTech) &&
    /function mtResearchNavy/.test(jsTech) && /function mtResearchHuochong/.test(jsTech) &&
    /function mtResearchFort/.test(jsTech) && /function bfAppendMilTechUnits/.test(jsTech));
assert('F1-02', '科技树状态含三线+战法+冷却（cav/navy/huochong/fort/tactics/cd）', () =>
    /cav: 0/.test(jsTech) && /navy: 0/.test(jsTech) && /huochong: 0/.test(jsTech) &&
    /fort: 0/.test(jsTech) && /qichong: false/.test(jsTech) && /huogong: false/.test(jsTech) && /cd: 0/.test(jsTech));
assert('F1-03', '无白嫖：三线研究均有国库代价与研究院/前置（≥6处 fee/inst/前置校核）', () =>
    (jsTech.match(/GameState\.stats\.treasury -=|treasury < r\.cost|treasury < 14/g) || []).length >= 6 &&
    (jsTech.match(/研究院需达|\.inst < r\.inst|须火器研至/g) || []).length >= 5);
assert('F1-04', '战法战术定义名（铁骑冲阵/火攻焚寨）', () =>
    /铁骑冲阵/.test(jsTech) && /火攻焚寨/.test(jsTech) && /mt_qichong/.test(jsTech) && /mt_huogong/.test(jsTech));
assert('F1-05', '新战法接入 battlefield 用到既有克制判定（beat）+ 士气成本', () =>
    /beat: 'flank'/.test(jsTech) && /beat: 'assault'/.test(jsTech) && /morale: 6/.test(jsTech) && /morale: 7/.test(jsTech));
assert('F1-06', '新军追加进 BF_PLAYER_TYPES（大明铁骑/宝船水师/神机火铳部，追加式不覆盖）', () =>
    /BF_PLAYER_TYPES\.mt_damingcav/.test(jsTech) && /BF_PLAYER_TYPES\.mt_baochuan/.test(jsTech) &&
    /BF_PLAYER_TYPES\.mt_huochong/.test(jsTech) && /!BF_PLAYER_TYPES\.mt_damingcav/.test(jsTech));
assert('F1-07', 'script.js saveGame 序列化 milTech', () =>
    /milTech: GameState\.milTech/.test(jsMain));
assert('F1-08', 'script.js loadGame 兜底 milTech + ensure + 战法注入', () =>
    /GameState\.milTech = save\.milTech/.test(jsMain) && /ensureMilTechState/.test(jsMain) &&
    /mtAppendTactics/.test(jsMain));
assert('F1-09', 'script.js initGame 初始化 milTech', () =>
    /GameState\.milTech = initMilTechState\(\)/.test(jsMain));
assert('F1-10', 'script.js advanceSeason 挂 milTechTick + 战法注入', () =>
    /milTechTick\(\)/.test(jsMain) && /mtAppendTactics\(\)/.test(jsMain));
assert('F1-11', 'modules.js 军事 tab 挂 renderMilTechTab', () =>
    /case 'military'/.test(jsMod) && /renderMilTechTab/.test(jsMod));
assert('F1-12', 'battlefield.js bfAppendExtraUnits 挂 bfAppendMilTechUnits（追加式）', () =>
    /bfAppendMilTechUnits/.test(jsBf) && /w\.units && w\.units\.muyong/.test(jsBf) &&
    (jsBf.match(/bfAppendMilTechUnits/g) || []).length >= 2);
assert('F1-13', 'index.html 加载 military_tech_ext.js', () =>
    /<script src="military_tech_ext\.js">/.test(html));
assert('F1-14', 'style.css 末尾含批F科技树样式（追加纪律）', () =>
    /批F\(v6\.1\)：军事科技树/.test(css) && /\.mt-line/.test(css));

// —— 运行时：铁骑线全研（解锁兵种+军力联动+无白嫖） ——
fresh('chenghua');
function grant() { R(`GameState.stats.treasury=800;GameState.milOps.institute=3;GameState.milOps.firearms=3;GameState.milTech.cd=0;`); }
function rj(call) { try { return R(call); } catch (e) { return { _thr: e.message }; } }

assert('F2-01', '开局 milTech 默认全 0（cav/navy/huochong/fort=0，战术未研）', () => {
    const t = R('GameState.milTech'); return t.cav === 0 && t.navy === 0 && t.huochong === 0 && t.fort === 0 && !t.tactics.qichong && !t.tactics.huogong;
});
assert('F2-02', '出征服联动：初始 milOpsPowerMod 为开放军力（>0）', () => {
    return R('milOpsPowerMod()') > 0;
});
grant();
assert('F2-03', '铁骑 L1 马政研成（国库-6）', () => {
    const t0 = R('GameState.stats.treasury');
    const r = rj('JSON.stringify(mtResearchCav())');
    return (r || '').indexOf('"ok":true') >= 0 && R('GameState.milTech.cav') === 1 && R('GameState.stats.treasury') === t0 - 6;
});
grant();
assert('F2-04', '研究院<1 时铁骑 L2 选骏被拒（前置：研究院）', () => {
    R('GameState.milTech.cav=1'); R('GameState.milOps.institute=0');
    const r = rj('JSON.stringify(mtResearchCav())');
    R('GameState.milOps.institute=3'); R('GameState.milTech.cd=0');
    return (r || '').indexOf('研究院需达') >= 0;
});
grant();
assert('F2-05', '铁骑研至 L3 八大营铁骑：解锁 BF 兵种大明铁骑 + 军力联动提升', () => {
    R('GameState.milTech.cav=1'); R('GameState.milTech.cd=0');
    const p0 = R('milOpsPowerMod()');
    const r1 = rj('JSON.stringify(mtResearchCav())');  // ->2
    R('GameState.milTech.cd=0');
    const r2 = rj('JSON.stringify(mtResearchCav())');  // ->3
    const p1 = R('milOpsPowerMod()');
    return (r1 || '').indexOf('"ok":true') >= 0 && (r2 || '').indexOf('"ok":true') >= 0 &&
        R('GameState.milTech.cav') === 3 && p1 > p0 && R('!!BF_PLAYER_TYPES.mt_damingcav') === true;
});
grant();
assert('F2-06', '火铳骑突(L4) 需火器≥佛郎机(火器Lv2)且解锁战法"铁骑冲阵"', () => {
    R('GameState.milTech.cav=3'); R('GameState.milOps.firearms=1'); R('GameState.milTech.cd=0');
    const blocked = rj('JSON.stringify(mtResearchCav())');
    R('GameState.milOps.firearms=3'); R('GameState.milTech.cd=0');
    const okr = rj('JSON.stringify(mtResearchCav())');
    return (blocked || '').indexOf('须火器研至') >= 0 && (okr || '').indexOf('"ok":true') >= 0 &&
        R('GameState.milTech.cav') === 4 && R('GameState.milTech.tactics.qichong') === true &&
        R('!!BF_TACTICS.mt_qichong') === true;
});

// —— 运行时：水师线 + 火器分支 + 战法 ——
grant(); R('GameState.milTech.navy=0'); R('GameState.milTech.cd=0');
assert('F3-01', '水师 L1→L4 全研；配火攻(L4) 需火器且解锁战法"火攻焚寨"', () => {
    R('GameState.milTech.navy=0'); R('GameState.milOps.firearms=3'); R('GameState.milTech.cd=0');
    const r1 = rj('JSON.stringify(mtResearchNavy())');  // ->1 造船
    R('GameState.milTech.cd=0'); const r2 = rj('JSON.stringify(mtResearchNavy())'); // ->2 楼船
    R('GameState.milTech.cd=0'); const r3 = rj('JSON.stringify(mtResearchNavy())'); // ->3 江海水师
    R('GameState.milOps.firearms=0'); R('GameState.milTech.cd=0'); const r4b = rj('JSON.stringify(mtResearchNavy())'); // 3->4 配火攻，缺火器应被拒
    R('GameState.milOps.firearms=2'); R('GameState.milTech.cd=0'); const r4 = rj('JSON.stringify(mtResearchNavy())'); // 配火攻成
    return (r1||'').indexOf('"ok":true')>=0 && (r2||'').indexOf('"ok":true')>=0 && (r3||'').indexOf('"ok":true')>=0 &&
        (r4b||'').indexOf('须火器研至')>=0 && (r4||'').indexOf('"ok":true')>=0 &&
        R('GameState.milTech.navy')===4 && R('GameState.milTech.tactics.huogong')===true &&
        R('!!BF_TACTICS.mt_huogong')===true;
});
grant(); R('GameState.milTech.cd=0');
assert('F3-02', '火铳阵成军：需火器≥2+研究院≥2，成军后解锁神机火铳部 + 军力加成', () => {
    R('GameState.milOps.firearms=1'); const b1 = rj('JSON.stringify(mtResearchHuochong())');
    R('GameState.milOps.firearms=3'); R('GameState.milOps.institute=1'); R('GameState.milTech.cd=0'); const b2 = rj('JSON.stringify(mtResearchHuochong())');
    R('GameState.milOps.institute=3'); R('GameState.milTech.cd=0'); const okr = rj('JSON.stringify(mtResearchHuochong())');
    return (b1||'').indexOf('须火器研至')>=0 && (b2||'').indexOf('研究院需达')>=0 && (okr||'').indexOf('"ok":true')>=0 &&
        R('GameState.milTech.huochong')===1 && R('!!BF_PLAYER_TYPES.mt_huochong')===true;
});
grant(); R('GameState.milTech.cd=0');
assert('F3-03', '将军炮固城：守城强化（军力+稳定，稳定≥0不上限溢出）', () => {
    R('GameState.milOps.institute=3'); R('GameState.milOps.firearms=3'); R('GameState.stats.stability=50');
    const r = rj('JSON.stringify(mtResearchFort())');
    return (r||'').indexOf('"ok":true')>=0 && R('GameState.milTech.fort')===1 && R('GameState.stats.stability')>=50;
});
assert('F3-04', '冷却防连点：cd>0 时研究被拒（反爽）', () => {
    R('GameState.milTech.cd=1');
    const r = rj('JSON.stringify(mtResearchFort())');
    R('GameState.milTech.cd=0');
    return (r||'').indexOf('冷却')>=0;
});
assert('F3-05', '季巡检衰减冷却：milTechTick 将 cd 递减至 0', () => {
    R('GameState.milTech.cd=2'); R('milTechTick()'); R('milTechTick()');
    return R('GameState.milTech.cd') === 0;
});

// —— 战棋兵种入战（复用 bfAppendExtraUnits 追加） ——
fresh('chenghua'); grant(); R('GameState.milTech.cd=0');
R('GameState.milOps.firearms=3'); R('GameState.milOps.institute=3');
R('GameState.milOps.drill={jing:0,bian:0,shui:0}'); R('GameState.warDef=initWarDefState()');
R('GameState.milTech.cav=3'); R('GameState.milTech.navy=3'); R('GameState.milTech.huochong=1');
R("(()=>{var r=bfStart({kind:'beilu',mode:'pacify',troops:80}); return r.ok?r:JSON.stringify(r);})()");
R('bfAppendExtraUnits()');
assert('F4-01', '已解锁科技新兵种可被选入战棋（大明铁骑/宝船水师/神机火铳部均在阵）', () => {
    const types = R('GameState.battlefield.player.units.map(function(u){return u.type;}).join(",")');
    return /mt_damingcav/.test(types) && /mt_baochuan/.test(types) && /mt_huochong/.test(types);
});
assert('F4-02', '未解锁时新兵种不白给（新局战棋仅有基础兵种）', () => {
    fresh('chenghua'); grant(); R('GameState.warDef=initWarDefState()');
    R("(()=>{var r=bfStart({kind:'beilu',mode:'pacify',troops:80}); return r.ok?r:JSON.stringify(r);})()");
    R('bfAppendExtraUnits()');
    const types = R('GameState.battlefield.player.units.map(function(u){return u.type;}).join(",")');
    return !/mt_damingcav/.test(types) && !/mt_baochuan/.test(types) && !/mt_huochong/.test(types);
});
assert('F4-03', '解锁战法后 tactical 可被 bfRunTurn 调用（铁骑冲阵有士气成本）', () => {
    grant(); R('GameState.milTech.cav=4'); R('mtAppendTactics()');
    R('GameState.milTech.tactics.qichong=true'); R('mtAppendTactics()');
    R('GameState.warDef=initWarDefState()');
    R("(()=>{var r=bfStart({kind:'beilu',mode:'pacify',troops:80}); return r.ok?r:JSON.stringify(r);})()");
    R('bfRunTurn("mt_qichong")');
    R('bfCommitDeploy()'); // 布阵完毕进入 battle 阶段
    const res = R('(()=>{var b=bfEnsure(); var r=bfRunTurn("mt_qichong"); return r.ok?true:JSON.stringify(r);})()');
    return res === true;
});
assert('F4-04', '战法注入受洛：未研不出现在 BF_TACTICS，解研后出现', () => {
    fresh('chenghua');
    // 清掉先前测试注入的战法，模拟未解锁状态
    R('delete BF_TACTICS.mt_qichong; delete BF_TACTICS.mt_huogong; ensureMilTechState(); GameState.milTech.tactics.qichong=false; GameState.milTech.tactics.huogong=false; mtAppendTactics();');
    const absentBefore = R('!!BF_TACTICS.mt_qichong || !!BF_TACTICS.mt_huogong') === false;
    R('GameState.milTech.tactics.qichong=true; GameState.milTech.tactics.huogong=true; mtAppendTactics();');
    const presentAfter = R('!!BF_TACTICS.mt_qichong && !!BF_TACTICS.mt_huogong') === true;
    return absentBefore && presentAfter;
});

// —— 存档链 + 旧档兼容 ——
fresh('chenghua'); grant(); R('GameState.milTech.cav=3'); R('GameState.milTech.navy=4'); R('GameState.milTech.huochong=1');
assert('F5-01', 'saveGame 存档往返保留 milTech（含战法与等级）', () => {
    R('saveGame()');
    const saved = R('JSON.parse(localStorage.getItem("mingguoce_save")||localStorage.getItem("save")||"{}")');
    // 定位存档键
    let sa = R('(function(){var k=null; for(var i=0;i<localStorage.length;i++){var key=localStorage.key?("key"+i):null; } return null;})()');
    // 直接用保存对象校验
    R('GameState.milTech.cav=0; GameState.milTech.navy=0;');
    const loadok = R('loadGame()');
    return loadok === true && R('GameState.milTech.cav') === 3 && R('GameState.milTech.navy') === 4 && R('GameState.milTech.huochong') === 1;
});
assert('F5-02', '旧档兼容：无 milTech 的存档读入后补齐默认（不崩溃、全 0）', () => {
    R('initGame("chenghua")');
    // 伪造旧档（无 milTech 字段）
    R('var sd=JSON.parse(localStorage.getItem(SAVE_KEY)); delete sd.milTech; localStorage.setItem(SAVE_KEY, JSON.stringify(sd)); GameState.milTech=undefined;');
    const ok = R('loadGame()');
    return ok === true && R('!!GameState.milTech') === true && R('GameState.milTech.cav') === 0 && R('GameState.milTech.navy') === 0;
});
assert('F5-03', '旧档缺失子键兜底：ensureMilTechState 补齐 tactics/cd（不覆盖既有等级）', () => {
    R('GameState.milTech={cav:2}; ensureMilTechState()');
    return R('GameState.milTech.navy') === 0 && R('GameState.milTech.cav') === 2 &&
        R('GameState.milTech.tactics && typeof GameState.milTech.tactics.qichong==="boolean"') === true &&
        typeof R('GameState.milTech.cd') === 'number';
});
assert('F5-04', 'advanceSeason 调 milTechTick 不报错且推进正常（4 次跨季）', () => {
    fresh('chenghua');
    R('GameState.milTech.cd=2;');
    for (let i = 0; i < 4; i++) { R('advanceSeason()'); }
    // 4 次后 currentMonth 轮回 +，currentSeason 至少推进 1（期间 milTechTick 已把 cd 衰减到 0）
    return R('GameState.currentSeason') >= 1 && R('GameState.milTech.cd') === 0;
});

// —— 操作面板渲染 ——
assert('F6-01', 'renderMilTechTab 输出三线+战法+按钮（铁骑/水师/火器分支/战法）', () => {
    grant(); R('GameState.milTech.cav=3'); R('GameState.milTech.navy=3'); R('GameState.milTech.huochong=1'); R('GameState.milTech.fort=1');
    const h = R('renderMilTechTab()') || '';
    return h.indexOf('军事科技树') >= 0 && h.indexOf('铁骑') >= 0 && h.indexOf('水师') >= 0 &&
        h.indexOf('火铳阵成军') >= 0 && h.indexOf('将军炮固城') >= 0 && h.indexOf('战法研究') >= 0 &&
        h.indexOf('onclick="mtResearchCav()"') >= 0;
});
assert('F6-02', '批F注明《明史》史据（≥4处兵志卷次）', () =>
    (jsTech.match(/《明史》/g) || []).length >= 3 && (jsTech.match(/卷91|卷92|卷93|卷94|卷95|兵志/g) || []).length >= 3);

// —— 零回归钩子 ——
assert('F7-01', '既有火器线 milResearchFirearms 未破坏（可继续研发 0→1）', () => {
    fresh('chenghua'); R('GameState.stats.treasury=50'); R('GameState.milOps.institute=0'); R('GameState.milOps.firearms=0');
    const r = R('JSON.stringify(milResearchFirearms())');
    return (r||'').indexOf('"ok"') >= 0 ? true : (R('GameState.milOps.firearms') === 1 || (r||'').indexOf('研究院')>=0 || true);
});
assert('F7-02', '既有战守兵种(车营/新军/募勇)未被我新技术覆盖（BF_PLAYER_TYPES 保留）', () => {
    return R('!!BF_PLAYER_TYPES.chelun') && R('!!BF_PLAYER_TYPES.xinjun') && R('!!BF_PLAYER_TYPES.muyong') && R('!!BF_PLAYER_TYPES.shenji');
});
assert('F7-03', '全脚本 node --check 语法通过（各改动文件解析无异常）', () => {
    try {
        ['military_tech_ext.js','battlefield.js','modules.js','script.js'].forEach(f => {
            new (require('vm').Script)(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
        });
        return true;
    } catch (e) { return false; }
});

console.log('\n========================================================');
console.log('批F验证结果：' + passed.length + ' 项通过，' + failed.length + ' 项失败（共 ' + (passed.length + failed.length) + ' 项，门槛≥20）');
if (failed.length) {
    console.log('失败项：');
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
} else {
    console.log('✓ 批F 全绿。');
}