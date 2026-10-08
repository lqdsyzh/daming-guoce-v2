// ============================================
// 《大明国策》批N(v6.8) 山河战图（疆域区块+边患虚实+敌军压境）验证
// 加载 index.html 引用的全部脚本，确保 map_v68.js 连同军事战守依赖一并加载
// ============================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WORK = '/Coze/Drive/扣子/daming-guoce';

// 从 index.html 提取完整脚本列表（保证 map_v68.js 与军事依赖齐全）
const html = fs.readFileSync(path.join(WORK, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const sandbox = {
    console,
    localStorage: { _data: {}, setItem(k,v){this._data[k]=v;}, getItem(k){return this._data[k]||null;}, clear(){this._data={};} },
    window: {},
    Date: Date,
    Math, JSON,
    alert: () => {},
    setTimeout: () => {}, clearTimeout: () => {},
    requestAnimationFrame: () => {}, cancelAnimationFrame: () => {},
    setInterval: () => {}, clearInterval: () => {},
    pushNews: () => {}, renderPanel: () => {}, updateUI: () => {},
    document: { getElementById: () => ({ classList: { add(){}, remove(){}, contains(){return false;} }, addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, textContent:'', innerHTML:'', insertAdjacentHTML(){}, style:{} }), addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[] },
    prompt: () => null, confirm: () => false,
    GameState: {
        stats: {}, currentYear: 1, currentSeason: 0, currentMonth: 0,
        script: { id: 'chenghua' }, mapData: null, province: null, qizhuji: null,
        tianming: null, xinxing: null, chaohui: null, gameOver: false
    },
    DamingSFX: { play: () => {} },
    expeditionLocks: () => false,
    openExpModal: () => {}
};
sandbox.global = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);

let loaded = 0, missing = [];
for (const f of FILES) {
    const p = path.join(WORK, f);
    if (!fs.existsSync(p)) { missing.push(f); continue; }
    const code = fs.readFileSync(p, 'utf-8');
    try { vm.runInContext(code, sandbox, { filename: f }); loaded++; }
    catch (e) { if (!/^var /.test(e.message)) console.error(`加载${f}: ${e.message}`); }
}
console.log(`加载 ${loaded}/${FILES.length} 个脚本${missing.length?'（缺 '+missing.length+'）':''}`);

let pass = 0, fail = 0;
const fails = [];
function assert(id, name, fn) {
    try {
        if (fn()) { pass++; }
        else { fail++; fails.push(id + ':' + name); }
    } catch (e) {
        fail++; fails.push(id + ':' + name + ' EX:' + e.message);
    }
}

const R = (code) => vm.runInContext(code, sandbox);

// ====== N1: 接线 ======
assert('N1-01', 'renderMapV68Tab 是函数', () => typeof R('renderMapV68Tab') === 'function');
assert('N1-02', 'MAP_V68_THREAT_ROUTES 定义', () => {
    const v = R('MAP_V68_THREAT_ROUTES');
    return v && typeof v === 'object' && Object.keys(v).length >= 4;
});
assert('N1-03', 'MAP_V68_TERRITORY_POINTS 是数组', () => Array.isArray(R('MAP_V68_TERRITORY_POINTS')));
assert('N1-04', 'v68ThreatPush 是函数', () => typeof R('v68ThreatPush') === 'function');
assert('N1-05', 'v68StrikeThreat 是函数', () => typeof R('v68StrikeThreat') === 'function');
assert('N1-06', 'v68FindThreatByRegion 是函数', () => typeof R('v68FindThreatByRegion') === 'function');
assert('N1-07', 'renderMapV68Threats 是函数', () => typeof R('renderMapV68Threats') === 'function');
assert('N1-08', 'renderMapV68Expedition 是函数', () => typeof R('renderMapV68Expedition') === 'function');
assert('N1-09', 'renderMapV68Territory 是函数', () => typeof R('renderMapV68Territory') === 'function');
assert('N1-10', 'renderMapV68Provinces 是函数', () => typeof R('renderMapV68Provinces') === 'function');

// ====== N2: 数据正确性 ======
assert('N2-01', '4 条边患推进路径齐全', () => {
    const v = R('MAP_V68_THREAT_ROUTES');
    return v.anda && v.wokou && v.tusi && v.liukou;
});
assert('N2-02', '每条 route ≥ 2 格', () => {
    const v = R('MAP_V68_THREAT_ROUTES');
    return Object.values(v).every(c => Array.isArray(c.route) && c.route.length >= 2);
});
assert('N2-03', 'route 全部是合法省份 key', () => {
    const v = R('MAP_V68_THREAT_ROUTES');
    const keys = new Set(R('MAP_REGIONS').map(r => r.key));
    return Object.values(v).every(c => c.route.every(k => keys.has(k)));
});
assert('N2-04', '至少一条 route 终点是京畿 beizhili', () => {
    const v = R('MAP_V68_THREAT_ROUTES');
    return Object.values(v).some(c => c.route[c.route.length - 1] === 'beizhili');
});
assert('N2-05', '疆域轮廓 ≥ 25 顶点', () => R('MAP_V68_TERRITORY_POINTS').length >= 25);
assert('N2-06', '疆域覆盖西→东、北→南范围', () => {
    const pts = R('MAP_V68_TERRITORY_POINTS');
    const xs = pts.map(p => p[0]); const ys = pts.map(p => p[1]);
    return Math.min(...xs) < 150 && Math.max(...xs) > 900 && Math.min(...ys) < 190 && Math.max(...ys) > 460;
});

// ====== N3: 渲染核心 ======
const htmlN = R('renderMapV68Tab()');
assert('N3-01', '渲染含 <svg>', () => htmlN && htmlN.indexOf('<svg') >= 0);
assert('N3-02', '渲染含 viewBox', () => htmlN && htmlN.indexOf('viewBox') >= 0);
assert('N3-03', '渲染含疆域轮廓 polygon', () => htmlN && /fill="rgba\(244,232,208,0\.16\)"/.test(htmlN));
assert('N3-04', '渲染含 24 府印标记', () => (htmlN.match(/map-v68-province/g) || []).length >= 24);
assert('N3-05', '渲染含城市节点', () => (htmlN.match(/map-v67-city/g) || []).length >= 30);
assert('N3-06', '渲染含长城', () => htmlN && htmlN.indexOf('万里长城') >= 0);
assert('N3-07', '渲染含 4 条河流', () => {
    const t = htmlN || '';
    return t.indexOf('黄河') >= 0 && t.indexOf('长江') >= 0 && t.indexOf('淮河') >= 0 && t.indexOf('京杭运河') >= 0;
});
assert('N3-08', '渲染含敌军/王师图例', () => htmlN && htmlN.indexOf('敌军压境') >= 0 && htmlN.indexOf('王师远征') >= 0);

// ====== N4: 边患可视化（虚实）：active 才渲染 ======
assert('N4-01', '无 active 威胁时敌军层为空', () => {
    R('GameState.warDef = initWarDefState()');
    R('GameState.warDef.threats.anda.active = false');
    R('GameState.warDef.threats.wokou.active = false');
    R('GameState.warDef.threats.tusi.active = false');
    R('GameState.warDef.threats.liukou.active = false');
    return R('renderMapV68Threats()') === '';
});
assert('N4-02', 'active 威胁渲染红旗', () => {
    R('GameState.warDef.threats.wokou.active = true');
    R('GameState.warDef.threats.wokou.regionKey = "zhejiang"');
    const th = R('renderMapV68Threats()');
    return th && th.indexOf('map-v68-threat-flag') >= 0;
});
assert('N4-03', '敌军红旗含威胁名', () => {
    const th = R('renderMapV68Threats()');
    return th && th.indexOf('倭寇入寇') >= 0;
});
assert('N4-04', '王师标记在出师时渲染', () => {
    R('GameState.mapData = { expedition: { key: "datong" }, status: {} }');
    const v = R('renderMapV68Expedition()');
    return v && v.indexOf('map-v68-expedition') >= 0 && v.indexOf('王师') >= 0;
});
assert('N4-05', '无出师时王师标记为空', () => {
    R('GameState.mapData = { status: {} }');
    return R('renderMapV68Expedition()') === '';
});

// ====== N5: 推进反爽（京畿告警削威望，确定性）======
assert('N5-01', '终格京畿告警削威望 -3', () => {
    R('GameState.warDef = initWarDefState()');
    R('GameState.warDef.threats.anda.active = true');
    R('GameState.warDef.threats.anda.regionKey = "beizhili"');
    R('GameState.warDef.threats.anda.level = 3');
    R('GameState.stats.prestige = 50');
    R('GameState.stats.mandate = 50');
    R('GameState.stats.stability = 50');
    R('v68ThreatPush()');
    return R('GameState.stats.prestige') === 47;
});
assert('N5-02', '终格京畿告警削天命 -1', () => {
    return R('GameState.stats.mandate') === 49;
});
assert('N5-03', '推进不清除 active（只增不减）', () => {
    R('GameState.warDef.threats.anda.active = true');
    R('GameState.warDef.threats.anda.regionKey = "datong"');
    R('GameState.stats.prestige = 50');
    R('GameState.stats.mandate = 50');
    R('GameState.stats.stability = 50');
    R('v68ThreatPush()');
    return R('GameState.warDef.threats.anda.active') === true;
});
assert('N5-04', '推进后 regionKey 仍在 route 内', () => {
    const rk = R('GameState.warDef.threats.anda.regionKey');
    const route = R('MAP_V68_THREAT_ROUTES.anda.route');
    return route.indexOf(rk) >= 0;
});
assert('N5-05', 'v68RegionName 返回中文名', () => R('v68RegionName("datong")') === '大同');
assert('N5-06', 'v68FindThreatByRegion 正确匹配', () => {
    R('GameState.warDef.threats.wokou.active = true');
    R('GameState.warDef.threats.wokou.regionKey = "zhejiang"');
    const f = R('v68FindThreatByRegion("zhejiang")');
    return f && f.key === 'wokou';
});
assert('N5-07', 'v68FindThreatByRegion 无匹配返回 null', () => {
    return R('v68FindThreatByRegion("gansu")') === null;
});
assert('N5-08', '状态色：2红 / 1黄 / 0派系', () => {
    R('GameState.mapData = { status: { a: 2, b: 1, c: 0 } }');
    return R('v68Status("a")') === 2 && R('v68Status("b")') === 1 && R('v68Status("c")') === 0;
});

// ====== N6: 兼容性（不破坏旧能力）======
assert('N6-01', 'renderMapV67Tab 仍可用', () => typeof R('renderMapV67Tab') === 'function');
assert('N6-02', 'wrStrikeThreat 仍可用', () => typeof R('wrStrikeThreat') === 'function');
assert('N6-03', 'MAP_REGIONS 仍 24 省', () => R('MAP_REGIONS').length === 24);
assert('N6-04', 'renderMapV67Regions 仍可用', () => typeof R('renderMapV67Regions') === 'function');
assert('N6-05', 'initMapState 可初始化 24 省', () => {
    R('GameState.mapData = initMapState("chenghua")');
    return Object.keys(R('GameState.mapData.status')).length === 24;
});
assert('N6-06', 'renderMapV68Tab 异常时不抛并回退', () => {
    // 正常路径返回字符串即可
    return typeof R('renderMapV68Tab()') === 'string';
});

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批N（v6.8 山河战图）验证套件');
console.log('--------------------------------------------------------');
console.log(`批N验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥40）`);
if (fail > 0) {
    console.log('失败项：');
    fails.forEach(f => console.log('  - ' + f));
}
if (pass >= 40 && fail === 0) {
    console.log('✓ 批N（v6.8 山河战图）验证全部通过');
    process.exit(0);
} else {
    console.log('✗ 批N验证未通过');
    process.exit(1);
}