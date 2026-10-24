// ============================================
// 《大明国策》批R(v7.1) 地图数据大具现（map_overlay.js）验证
// 验证：
//   R1) 接线与函数（index.html / 核心函数 / 覆盖接管）
//   R2) 数据层（四角角标/城俗/资源/灾异/军力/边患等级）
//   R3) 注入端到端（面板 + 6 图层 + 不破坏真舆图）
//   R4) 降级健壮（空态/最小 HTML 不崩溃 + localStorage 开关）
// ============================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WORK = '/Coze/Drive/扣子/daming-guoce';
const html = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const sandbox = {
    console,
    localStorage: { _data: {}, setItem(k, v) { this._data[k] = v; }, getItem(k) { return this._data[k] || null; }, clear() { this._data = {}; } },
    window: {}, Date: Date, Math, JSON,
    alert: () => {}, setTimeout: () => {}, clearTimeout: () => {},
    requestAnimationFrame: () => {}, cancelAnimationFrame: () => {},
    setInterval: () => {}, clearInterval: () => {},
    pushNews: () => {}, renderPanel: () => {}, updateUI: () => {},
    renderScreen: () => {},
    document: { getElementById: () => ({ classList: { add() {}, remove() {}, contains() { return false; } }, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, textContent: '', innerHTML: '', insertAdjacentHTML() {}, style: {} }), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, innerHTML: '', textContent: '' }), body: { appendChild() {} }, head: { appendChild() {} } },
    prompt: () => null, confirm: () => false,
    GameState: { stats: {}, currentYear: 1, currentSeason: 0, currentMonth: 0,
        script: { id: 'chenghua' }, mapData: null, province: null,
        tianming: null, xinxing: null, chaohui: null, gameOver: false },
    DamingSFX: { play: () => {} }, expeditionLocks: () => false, openExpModal: () => {}
};
sandbox.global = sandbox; sandbox.globalThis = sandbox;
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);

let loaded = 0;
for (const f of FILES) {
    const p = path.join(WORK, f);
    if (!fs.existsSync(p)) continue;
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f }); loaded++; }
    catch (e) {}
}
console.log(`加载 ${loaded}/${FILES.length} 个脚本`);

let pass = 0, fail = 0; const fails = [];
function assert(id, name, fn) {
    try { if (fn()) pass++; else { fail++; fails.push(id + ':' + name); } }
    catch (e) { fail++; fails.push(id + ':' + name + ' EX:' + e.message); }
}
const R = (code) => vm.runInContext(code, sandbox);

// ====== R1: 接线与函数 ======
assert('R1-01', 'index.html 含 map_overlay.js', () => html.indexOf('map_overlay.js') >= 0);
assert('R1-02', 'map_overlay.js 加载于 map_interact.js 之后', () => html.indexOf('map_interact.js') >= 0 && html.indexOf('map_overlay.js') > html.indexOf('map_interact.js'));
assert('R1-03', '核心函数齐全', () => {
    const names = ['v7olInject', 'v7olRenderCorners', 'v7olRenderPop', 'v7olRenderResource', 'v7olRenderCalamity', 'v7olRenderMilitary', 'v7olRenderThreatLevel', 'v7olToggle', 'v7olLsGet', 'v7olLsSet', 'v7olPanelHtml', 'v7olWrap'];
    return names.every(n => typeof R(n) === 'function');
});
assert('R1-04', '图层清单 6 项', () => {
    const L = R('V7OL_LAYERS');
    return L && ['corners', 'pop', 'res', 'cal', 'mil', 'lv'].every(k => L[k]);
});

// ====== R2: 数据层 ======
assert('R2-01', '四角角标含四标题与库银/存粮格式化', () => R(`(function(){
    GameState.stats = { mandate:70, prestige:60, stability:55, treasury:8000, food:12000, militaryFood:1500, militaryPower:8000 };
    GameState.econ = { prices:{grain:{v:1.0}}, prosperity:62 };
    GameState.zaiyi = { pending:[] };
    GameState.warDef = { threats:{} };
    GameState.factions = { military:60 };
    GameState.milOps = { camps:{jing:2,bian:1,shui:1}, firearms:0, marshal:null };
    const h = v7olRenderCorners();
    return h.indexOf('天命国本')>=0 && h.indexOf('国库府藏')>=0 && h.indexOf('民生市井')>=0 && h.indexOf('军威边烽')>=0 && h.indexOf('8000两')>=0 && h.indexOf('1.2万石')>=0;
})()`) === true);
assert('R2-02', '城俗标签含 32 城 pop 文案', () => R(`(function(){
    const h = v7olRenderPop();
    return h.indexOf('百万京畿')>=0 && h.indexOf('税赋半天下')>=0 && h.indexOf('天下第一关')>=0;
})()`) === true);
assert('R2-03', '资源产地含盐铁银舶，市舶关闭显示「禁」', () => R(`(function(){
    GameState.econ = { shibo:0 };
    const h = v7olRenderResource();
    return h.indexOf('盐')>=0 && h.indexOf('铁')>=0 && h.indexOf('银')>=0 && h.indexOf('舶')>=0 && h.indexOf('>禁<')>=0 && h.indexOf('漕')>=0;
})()`) === true);
assert('R2-04', '市舶开启后显示「通」并变绿', () => R(`(function(){
    GameState.econ = { shibo:1 };
    const h = v7olRenderResource();
    return h.indexOf('>通<')>=0 && h.indexOf('#1E8449')>=0;
})()`) === true);
assert('R2-05', '灾异空态返回空，非空落 ⚠', () => R(`(function(){
    GameState.zaiyi = { pending:[] };
    const e0 = v7olRenderCalamity();
    GameState.zaiyi = { pending:[{key:'旱',label:'旱灾',title:'关中大旱'}] };
    const e1 = v7olRenderCalamity();
    return e0 === '' && e1.indexOf('⚠')>=0 && e1.indexOf('旱灾')>=0;
})()`) === true);
assert('R2-06', '军力具现含三营与挂帅', () => R(`(function(){
    GameState.milOps = { camps:{jing:2,bian:3,shui:1}, firearms:1, marshal:'王越' };
    GameState.generals = { list:[] };
    const h = v7olRenderMilitary();
    return h.indexOf('京')>=0 && h.indexOf('边')>=0 && h.indexOf('水')>=0 && h.indexOf('帅·王越')>=0 && h.indexOf('鸟铳')>=0;
})()`) === true);
assert('R2-07', '外任将领散落镇所', () => R(`(function(){
    GameState.generals = { list:[{name:'李成梁', status:'外任', base:'辽东'}] };
    const h = v7olRenderMilitary();
    return h.indexOf('将李成梁')>=0;
})()`) === true);
assert('R2-08', '边患等级 Lv 数字直标', () => R(`(function(){
    GameState.warDef = { threats:{ anda:{active:true, regionKey:'datong', level:3} } };
    const h = v7olRenderThreatLevel();
    return h.indexOf('Lv3')>=0;
})()`) === true);

// ====== R3: 注入端到端 ======
assert('R3-01', '整图渲染含图层开关面板 6 复选框', () => R(`(function(){
    GameState.stats = { mandate:70, prestige:60, stability:55, treasury:8000, food:4000, militaryFood:1500, militaryPower:8000 };
    GameState.econ = { prices:{grain:{v:1.0}}, prosperity:62, shibo:0 };
    GameState.zaiyi = { pending:[] };
    GameState.warDef = { threats:{} };
    GameState.factions = { military:60 };
    GameState.milOps = { camps:{jing:1,bian:1,shui:1}, firearms:0, marshal:null };
    GameState.generals = { list:[] };
    const h = renderMapV68Tab();
    const ck = (h.match(/type="checkbox"/g)||[]).length;
    return h.indexOf('v7ol-panel')>=0 && ck >= 6;
})()`) === true);
assert('R3-02', '整图渲染含 6 图层 id', () => R(`(function(){
    GameState.stats = {}; GameState.econ = {}; GameState.zaiyi = { pending:[] }; GameState.warDef = {}; GameState.factions = {}; GameState.milOps = {}; GameState.generals = { list:[] };
    const h = renderMapV68Tab();
    return ['v7ol-corners','v7ol-pop','v7ol-res','v7ol-cal','v7ol-mil','v7ol-lv'].every(id => h.indexOf('id="'+id+'"')>=0);
})()`) === true);
assert('R3-03', '注入不破坏真舆图关键元素', () => R(`(function(){
    GameState.stats = {}; GameState.econ = {}; GameState.zaiyi = { pending:[] }; GameState.warDef = {}; GameState.factions = {}; GameState.milOps = {}; GameState.generals = { list:[] };
    const h = renderMapV68Tab();
    return h.indexOf('万里长城')>=0 && h.indexOf('朝鲜')>=0 && h.indexOf('嘉峪关')>=0 && h.indexOf('fill="rgba(244,232,208,0.16)"')>=0;
})()`) === true);
assert('R3-04', 'v7olInject 对最小 HTML 仅注入图层不注入面板', () => R(`(function(){
    const out = v7olInject('<svg></svg>');
    return out.indexOf('v7ol-corners')>=0 && out.indexOf('v7ol-panel')<0;
})()`) === true);
assert('R3-05', '图层开关 localStorage 读写', () => R(`(function(){
    v7olLsSet({corners:0, pop:1});
    const off = v7olOn('corners');
    const on = v7olOn('pop');
    v7olToggle('pop', false);
    return off === false && on === true && v7olOn('pop') === false;
})()`) === true);

// ====== R4: 降级健壮 ======
assert('R4-01', 'v7olInject(空值/非字符串)不崩溃', () => {
    try { R(`v7olInject(null)`); R(`v7olInject('')`); R(`v7olInject(undefined)`); return true; } catch (e) { return false; }
});
assert('R4-02', '空 GameState 各 render 不崩溃返回字符串', () => R(`(function(){
    GameState.stats = {}; GameState.econ = {}; GameState.zaiyi = {}; GameState.warDef = {}; GameState.factions = {}; GameState.milOps = {}; GameState.generals = {};
    const fns = [v7olRenderCorners, v7olRenderPop, v7olRenderResource, v7olRenderCalamity, v7olRenderMilitary, v7olRenderThreatLevel];
    return fns.every(f => { try { const r = f(); return typeof r === 'string'; } catch(e){ return false; } });
})()`) === true);

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批R（v7.1 地图数据大具现）验证套件');
console.log('--------------------------------------------------------');
console.log(`批R验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥18）`);
if (fail > 0) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
if (pass >= 18 && fail === 0) { console.log('✓ 批R（v7.1 地图数据大具现）验证全部通过'); process.exit(0); }
else { console.log('✗ 批R验证未通过'); process.exit(1); }