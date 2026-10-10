// ============================================
// 《大明国策》批Q(v7.0) 地图触动（城市/邻国/关隘点击 + 悬停）验证
// 验证 map_interact.js：
//   Q1) 接线与函数（index.html / 核心函数存在）
//   Q2) 数据层（邻国关系 8 / 关隘防务 10 / 府名映射）
//   Q3) 交互注入（覆盖后渲染含 onclick 回调）
// ============================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WORK = '/Coze/Drive/扣子/daming-guoce';
const html = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const sandbox = {
    console,
    localStorage: { _data: {}, setItem(k,v){this._data[k]=v;}, getItem(k){return this._data[k]||null;}, clear(){this._data={};} },
    window: {}, Date: Date, Math, JSON,
    alert: () => {}, setTimeout: () => {}, clearTimeout: () => {},
    requestAnimationFrame: () => {}, cancelAnimationFrame: () => {},
    setInterval: () => {}, clearInterval: () => {},
    pushNews: () => {}, renderPanel: () => {}, updateUI: () => {},
    renderScreen: () => {},
    document: { getElementById: () => ({ classList: { add(){}, remove(){}, contains(){return false;} }, addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, textContent:'', innerHTML:'', insertAdjacentHTML(){}, style:{} }), addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[], createElement: () => ({ style:{}, setAttribute(){}, appendChild(){}, innerHTML:'', textContent:'' }), body: { appendChild(){} }, head: { appendChild(){} } },
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

// ====== Q1: 接线与函数 ======
assert('Q1-01', 'index.html 含 map_interact.js', () => html.indexOf('map_interact.js') >= 0);
assert('Q1-02', '核心函数齐全', () => {
    const names = ['v7CityCard','v7NationCard','v7WallCard','v7OpenCard','v7CloseCard','v7Tip','v7TipMove','v7TipHide','v7RegionName','v7EnsureStyle','v7MapStop'];
    return names.every(n => typeof R(n) === 'function');
});

// ====== Q2: 数据层 ======
assert('Q2-01', '邻国关系 8 项齐全', () => {
    const v = R('V7_NATION_NOTES');
    return v && ['朝鲜','安南','乌斯藏','日本','缅甸诸邦','老挝','掸邦','兰纳'].every(k => v[k] && v[k].rel && v[k].note);
});
assert('Q2-02', '邻国名与 MING_NEIGHBORS_REAL 一一对应', () => R(`(function(){
    const ns = MING_NEIGHBORS_REAL.map(n => n.cn);
    return ns.every(cn => V7_NATION_NOTES[cn]);
})()`) === true);
assert('Q2-03', '关隘防务覆盖 10 关', () => R(`(function(){
    const nodes = MING_GREATWALL_REAL.nodes;
    return nodes.length === 10 && nodes.every(n => V7_WALL_NOTES[n.name]);
})()`) === true);
assert('Q2-04', '府名映射：beizhili → 北直隶', () => R(`v7RegionName('beizhili')`) === '北直隶');
assert('Q2-05', '府名映射：nanzhili → 南直隶', () => R(`v7RegionName('nanzhili')`) === '南直隶');

// ====== Q3: 交互注入（覆盖后渲染）======
assert('Q3-01', '城市节点注入 v7CityCard 点击', () => R(`(function(){
    const h = renderMapV67Cities();
    return h && h.indexOf('v7CityCard') >= 0 && h.indexOf('style="cursor:pointer"') >= 0 && h.indexOf('v7CityTip') >= 0;
})()`) === true);
assert('Q3-02', '邻国块注入 v7NationCard 点击', () => R(`(function(){
    const h = renderMapV69Neighbors();
    return h && h.indexOf('v7NationCard') >= 0 && h.indexOf('cursor:pointer') >= 0;
})()`) === true);
assert('Q3-03', '邻国名称标注注入点击', () => R(`(function(){
    const h = renderMapV69NeighborLabels();
    return h && h.indexOf('v7NationCard') >= 0;
})()`) === true);
assert('Q3-04', '长城关隘注入 v7WallCard 点击', () => R(`(function(){
    const h = renderMapV69Greatwall();
    return h && h.indexOf('v7WallCard') >= 0 && h.indexOf('嘉峪关') >= 0;
})()`) === true);
assert('Q3-05', '整图渲染含城市/邻国/关隘三者点击回调', () => {
    const h = R('renderMapV68Tab()');
    return h && h.indexOf('v7CityCard') >= 0 && h.indexOf('v7NationCard') >= 0 && h.indexOf('v7WallCard') >= 0;
});
assert('Q3-06', '整图渲染仍含真实疆域（未破坏真舆图）', () => {
    const h = R('renderMapV68Tab()');
    return h && /fill="rgba\(244,232,208,0\.16\)"/.test(h) && h.indexOf('万里长城') >= 0 && h.indexOf('朝鲜') >= 0;
});
assert('Q3-07', '城市点击不冒泡（v7MapStop 注入）', () => R(`(function(){
    const h = renderMapV67Cities();
    return h.indexOf('v7MapStop') >= 0;
})()`) === true);

// ====== Q4: 信息卡内容（不崩溃 + 数据正确）=====
assert('Q4-01', 'v7CityCard 北京不崩溃', () => { try { R(`v7CityCard('北京')`); return true; } catch (e) { return false; } });
assert('Q4-02', 'v7CityCard 无此城不崩溃', () => { try { R(`v7CityCard('不存在城')`); return true; } catch (e) { return false; } });
assert('Q4-03', 'v7NationCard 朝鲜不崩溃', () => { try { R(`v7NationCard('朝鲜')`); return true; } catch (e) { return false; } });
assert('Q4-04', 'v7WallCard 山海关不崩溃', () => { try { R(`v7WallCard('山海关')`); return true; } catch (e) { return false; } });
assert('Q4-05', '邻国关系史据含「万历」字样（朝鲜）', () => R(`V7_NATION_NOTES['朝鲜'].note`) && R(`V7_NATION_NOTES['朝鲜'].note`).toString().indexOf('万历') >= 0);
assert('Q4-06', '关隘防务山海关含「锁钥」/「辽蓟」', () => R(`V7_WALL_NOTES['山海关']`) && R(`V7_WALL_NOTES['山海关']`).toString().indexOf('辽蓟') >= 0);

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批Q（v7.0 地图触动）验证套件');
console.log('--------------------------------------------------------');
console.log(`批Q验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥18）`);
if (fail > 0) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
if (pass >= 18 && fail === 0) { console.log('✓ 批Q（v7.0 地图触动）验证全部通过'); process.exit(0); }
else { console.log('✗ 批Q验证未通过'); process.exit(1); }