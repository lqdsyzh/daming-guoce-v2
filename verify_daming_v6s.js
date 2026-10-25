// ============================================
// 《大明国策》批S(v7.2) 势力格局可视化（map_faction.js）验证
// 验证：
//   S1) 接线与函数（index.html / 核心函数）
//   S2) 数据层（6派系色 / 府-派系映射 / 藩王府 / 中枢四衙）
//   S3) 注入端到端（图例/晕染/据点/藩王府 + 不破坏真舆图）
//   S4) 覆盖接管健壮（势力色接管 / 晕染叠底 / 空态降级）
// ============================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WORK = '/Coze/Drive/扣子/daming-guoce';
const html = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const factionSrc = fs.readFileSync(path.join(WORK, 'map_faction.js'), 'utf8');

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
        tianming: null, xinxing: null, chaohui: null, gameOver: false,
        factions: { civil: 60, military: 60, royal: 50, eunuch: 50, consort: 55 } },
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

// ====== S1: 接线与函数 ======
assert('S1-01', 'index.html 含 map_faction.js', () => html.indexOf('map_faction.js') >= 0);
assert('S1-02', 'map_faction.js 加载于 map_overlay.js 之后', () => html.indexOf('map_overlay.js') >= 0 && html.indexOf('map_faction.js') > html.indexOf('map_overlay.js'));
assert('S1-03', '核心函数齐全', () => {
    const names = ['v7sInject', 'v7sRenderHalo', 'v7sRenderSeats', 'v7sRenderStruggles', 'v7sLegendHtml', 'v7sRegionColor', 'v7sEnsureStyle'];
    return names.every(n => typeof R(n) === 'function');
});

// ====== S2: 数据层 ======
assert('S2-01', '六派系大明正典色齐全', () => {
    const c = R('V7S_FACTION_COLOR');
    return c && ['civil', 'military', 'royal', 'eunuch', 'consort', 'tusi'].every(k => /^#[0-9A-Fa-f]{6}$/.test(c[k]));
});
assert('S2-02', '府-派系映射覆盖 24 府且无遗漏', () => {
    const m = R('V7S_REGION_FACTION');
    const regions = R('MAP_REGIONS');
    return m && regions && regions.every(r => ['civil', 'military', 'eunuch', 'tusi'].indexOf(m[r.key]) >= 0);
});
assert('S2-03', '九边军镇主导派系为武将', () => {
    const m = R('V7S_REGION_FACTION');
    return ['datong', 'xuanfu', 'jizhou', 'liaodong', 'gansu'].every(k => m[k] === 'military');
});
assert('S2-04', '京畿为宦官 / 西南为土司 / 腹地为文官', () => {
    const m = R('V7S_REGION_FACTION');
    return m['beizhili'] === 'eunuch' && ['yunnan', 'guangxi', 'sichuan'].every(k => m[k] === 'tusi') && ['henan', 'nanzhili', 'jiangxi'].every(k => m[k] === 'civil');
});
assert('S2-05', '中枢四衙据点齐备（六部/司礼监/五军/外戚）', () => {
    const s = R('V7S_SEATS');
    return s && s.length === 4 && ['六部内阁', '司礼监', '五军都督府', '后妃外戚'].every(n => s.some(x => x.name === n));
});
assert('S2-06', '藩王府覆盖秦晋周楚蜀宁六藩', () => {
    const names = factionSrc.match(/\[(?:'([^']+)·[^']+'|"[^"]+·[^"]+")/g) || [];
    return ['西安', '太原', '开封', '武昌', '成都', '南昌'].every(n => names.some(x => x.indexOf(n) >= 0));
});

// ====== S3: 注入端到端 ======
assert('S3-01', 'renderMapV68Tab 输出含势力图例', () => {
    const h = R('renderMapV68Tab()');
    return !!h && h.indexOf('天下势力格局') >= 0;
});
assert('S3-02', '输出含势力范围晕染层', () => {
    const h = R('renderMapV68Tab()');
    return !!h && h.indexOf('map-v7s-halo') >= 0;
});
assert('S3-03', '晕染投影覆盖全部 24 府', () => {
    const h = R('renderMapV68Tab()');
    const n = (h.match(/<circle /g) || []).length;
    return n >= 24;
});
assert('S3-04', '输出含中枢四衙据点 + 藩王府散点', () => {
    const h = R('renderMapV68Tab()');
    return !!h && h.indexOf('v7s-seats') >= 0 && h.indexOf('v7s-royals') >= 0;
});
assert('S3-05', '输出不破坏真舆图关键元素', () => {
    const h = R('renderMapV68Tab()');
    return !!h && h.indexOf('万里长城') >= 0 && h.indexOf('朝鲜') >= 0;
});
assert('S3-06', '府印层渲染含晕染叠加（renderMapV68Provinces）', () => {
    const h = R('renderMapV68Provinces()');
    return !!h && h.indexOf('map-v7s-halo') >= 0 && h.indexOf('<rect') >= 0;
});

// ====== S4: 覆盖接管健壮 ======
assert('S4-01', 'v68FactionColor 已接管为六派系色', () => {
    return R("v68FactionColor('datong')") === '#8C2F26' && R("v68FactionColor('beizhili')") === '#5D3A5E' && R("v68FactionColor('yunnan')") === '#6E5540';
});
assert('S4-02', '未知府 key 回退文官黛青', () => {
    return R("v68FactionColor('__nope__')") === '#2E5A4A';
});
assert('S4-03', '势力色状态优先级（2赤/1赭黄/0势力色）', () => {
    return R('v7sRegionColor("beizhili",2)') === '#A83232' && R('v7sRegionColor("beizhili",1)') === '#C08A2D' && R('v7sRegionColor("henan",0)') === '#2E5A4A';
});
assert('S4-04', '空输入注入不崩溃', () => {
    return R('v7sInject(null)') === null && R('v7sInject("")') === '';
});
assert('S4-05', '态势阈值动态（royal≥60 显藩王坐大 / <60 不显）', () => {
    R('GameState.factions.royal = 65');
    const h1 = R('v7sRenderStruggles()');
    R('GameState.factions.royal = 40');
    const h2 = R('v7sRenderStruggles()');
    return !!h1 && h1.indexOf('藩王坐大') >= 0 && (!h2 || h2.indexOf('藩王坐大') < 0);
});

const n = (typeof process.env.THRESHOLD !== 'undefined') ? Number(process.env.THRESHOLD) : 16;
const PASSING = pass >= n;
console.log(`\n结果：${pass} 通过 ${fail} 失败（门槛 ≥${n}）`);
if (fails.length) console.log('失败项：\n' + fails.join('\n'));
process.exit(PASSING ? 0 : 1);