// ============================================
// 《大明国策》批O(v6.9) 真舆图（真实历史疆域矢量 + 地理坐标）验证
// 验证 geo_ming.js（historical-basemaps 真实疆域）与 map_v69.js（真舆图渲染）
//   1) 真实疆域/邻国数据齐全（world_1600.geojson 投影裁剪后）
//   2) 城市/布政司坐标真实化（覆盖 MAP_V67_CITIES/REGIONS 手绘坐标）
//   3) 真舆图渲染含真实疆域 path、邻国名称、真实长城/河流、数据源署名
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
    document: { getElementById: () => ({ classList: { add(){}, remove(){}, contains(){return false;} }, addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, textContent:'', innerHTML:'', insertAdjacentHTML(){}, style:{} }), addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[] },
    prompt: () => null, confirm: () => false,
    GameState: { stats: {}, currentYear: 1, currentSeason: 0, currentMonth: 0,
        script: { id: 'chenghua' }, mapData: null, province: null, qizhuji: null,
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

// ====== O1: 数据接线 ======
assert('O1-01', 'MING_TERRITORY_REAL 定义且为数组', () => Array.isArray(R('MING_TERRITORY_REAL')));
assert('O1-02', 'MING_NEIGHBORS_REAL 8 邻国', () => {
    const v = R('MING_NEIGHBORS_REAL'); return Array.isArray(v) && v.length === 8;
});
assert('O1-03', 'MING_CITIES_REAL 32 城', () => {
    const v = R('MING_CITIES_REAL'); return Array.isArray(v) && v.length === 32;
});
assert('O1-04', 'MING_REGIONS_REAL 24 府', () => {
    const v = R('MING_REGIONS_REAL'); return v && typeof v === 'object' && Object.keys(v).length === 24;
});
assert('O1-05', 'MING_GREATWALL_REAL 长城折线', () => {
    const v = R('MING_GREATWALL_REAL'); return v && typeof v.path === 'string' && v.path.indexOf('M') === 0;
});
assert('O1-06', 'MING_RIVERS_REAL 4 条河', () => {
    const v = R('MING_RIVERS_REAL'); return Array.isArray(v) && v.length === 4;
});
assert('O1-07', 'renderMapV69Tab 是函数', () => typeof R('renderMapV69Tab') === 'function');
assert('O1-08', 'renderMapV68Tab 已接管为真舆图', () => R('renderMapV68Tab === renderMapV69Tab'));

// ====== O2: 疆域数据 ======
assert('O2-01', '大明疆域 3 块 polygon', () => R('MING_TERRITORY_REAL.length') === 3);
assert('O2-02', '疆域 path 坐标均在 viewBox 内', () => R(`(function(){
    return MING_TERRITORY_REAL.every(d => {
        const m = d.match(/-?[\\d.]+,-?[\\d.]+/g) || [];
        return m.every(p => { const a=p.split(','); const x=+a[0], y=+a[1]; return x>=-0.5&&x<=1000.5&&y>=-0.5&&y<=600.5; });
    });
})()`) === true);
assert('O2-03', '疆域覆盖西→东（x 跨 <100 至 >900）', () => {
    const xs = R(`(function(){ const a=[]; MING_TERRITORY_REAL.forEach(d=>{const m=d.match(/-?[\\d.]+,-?[\\d.]+/g)||[]; m.forEach(p=>a.push(+p.split(',')[0]));}); return a; })()`);
    return Math.min(...xs) < 100 && Math.max(...xs) > 900;
});
assert('O2-04', '疆域覆盖北→南（y 达 <10 与 >450）', () => {
    const ys = R(`(function(){ const a=[]; MING_TERRITORY_REAL.forEach(d=>{const m=d.match(/-?[\\d.]+,-?[\\d.]+/g)||[]; m.forEach(p=>a.push(+p.split(',')[1]));}); return a; })()`);
    return Math.min(...ys) < 10 && Math.max(...ys) > 450;
});

// ====== O3: 城市/布政司坐标真实化（覆盖生效） ======
assert('O3-01', '北京真实坐标（华北 x≈583）', () => {
    const v = R(`MAP_V67_CITIES.find(c => c.name === '北京')`);
    return v && Math.abs(v.x - 583) < 6 && Math.abs(v.y - 102) < 6;
});
assert('O3-02', '广州真实坐标（岭南 x≈494）', () => {
    const v = R(`MAP_V67_CITIES.find(c => c.name === '广州')`);
    return v && Math.abs(v.x - 494) < 6 && Math.abs(v.y - 438) < 6;
});
assert('O3-03', '嘉峪关在西北（x≈63 近左界）', () => {
    const v = R(`MAP_V67_CITIES.find(c => c.name === '嘉峪关')`);
    return v && v.x < 70 && Math.abs(v.y - 104) < 8;
});
assert('O3-04', '辽东亲镇在东北（x≈777）', () => {
    const v = R(`MAP_V67_REGIONS.liaodong`);
    return v && Math.abs(v.x - 777) < 8 && Math.abs(v.y - 74) < 8;
});
assert('O3-05', '手绘错位已纠正（北京不再 ≈760）', () => {
    const v = R(`MAP_V67_CITIES.find(c => c.name === '北京')`);
    return v && Math.abs(v.x - 760) > 50;
});

// ====== O4: 邻国 ======
assert('O4-01', '邻国含朝鲜/安南/乌斯藏/日本', () => {
    const names = R(`MING_NEIGHBORS_REAL.map(n => n.cn)`);
    return ['朝鲜','安南','乌斯藏','日本'].every(n => names.indexOf(n) >= 0);
});
assert('O4-02', '邻国均有 path', () => R(`MING_NEIGHBORS_REAL.every(n => Array.isArray(n.paths) && n.paths.length >= 1)`));
assert('O4-03', '邻国路径坐标在 viewBox 内', () => R(`(function(){
    return MING_NEIGHBORS_REAL.every(n => n.paths.every(d => {
        const m = d.match(/-?[\\d.]+,-?[\\d.]+/g) || [];
        return m.every(p => { const a=p.split(','); const x=+a[0], y=+a[1]; return x>=-0.5&&x<=1000.5&&y>=-0.5&&y<=600.5; });
    }));
})()`) === true);

// ====== O5: 渲染核心 ======
const htmlO = R('renderMapV68Tab()');
assert('O5-01', '渲染含 <svg> + viewBox', () => htmlO && htmlO.indexOf('<svg') >= 0 && htmlO.indexOf('viewBox') >= 0);
assert('O5-02', '含真实疆域 path（浅米版图）', () => htmlO && /fill="rgba\(244,232,208,0\.16\)"/.test(htmlO));
assert('O5-03', '含邻国渲染（域外暗色）', () => htmlO && /fill="#5A564C"/.test(htmlO));
assert('O5-04', '含邻国名称标注', () => htmlO && htmlO.indexOf('朝鲜') >= 0 && htmlO.indexOf('乌斯藏') >= 0);
assert('O5-05', '含万里长城', () => htmlO && htmlO.indexOf('万里长城') >= 0);
assert('O5-06', '含 4 条河（黄河/长江/淮河/京杭运河）', () => {
    const t = htmlO || '';
    return t.indexOf('黄河') >= 0 && t.indexOf('长江') >= 0 && t.indexOf('淮河') >= 0 && t.indexOf('京杭运河') >= 0;
});
assert('O5-07', '含 24 府印标记', () => (htmlO.match(/map-v68-province/g) || []).length >= 24);
assert('O5-08', '含 30 城节点', () => (htmlO.match(/map-v67-city/g) || []).length >= 30);
assert('O5-09', '含敌军/王师图例', () => htmlO && htmlO.indexOf('敌军压境') >= 0 && htmlO.indexOf('王师远征') >= 0);
assert('O5-10', '含数据源署名（historical-basemaps / CC-BY-SA）', () => htmlO && htmlO.indexOf('historical-basemaps') >= 0 && htmlO.indexOf('CC-BY-SA') >= 0);

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批O（v6.9 真舆图）验证套件');
console.log('--------------------------------------------------------');
console.log(`批O验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥27）`);
if (fail > 0) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
if (pass >= 27 && fail === 0) { console.log('✓ 批O（v6.9 真舆图）验证全部通过'); process.exit(0); }
else { console.log('✗ 批O验证未通过'); process.exit(1); }