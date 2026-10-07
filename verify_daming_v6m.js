// ============================================
// 《大明国策》批M(v6.7) 大明山河全舆图验证
// ============================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WORK = '/Coze/Drive/扣子/daming-guoce';
const FILES = [
    'script.js', 'data/state.js', 'data/init.js',
    'data/faction.js', 'data/events.js', 'data/season.js',
    'data/advisor.js', 'data/decree.js', 'data/mission.js',
    'data/market.js', 'data/weather.js', 'data/troop.js',
    'data/province.js', 'data/calendar.js',
    'modules.js', 'modules2.js', 'modules3.js',
    'auto.js', 'battlefield.js', 'cangwei.js', 'court_session.js',
    'daming_talk.js', 'diplomacy_interact.js', 'economy_market.js',
    'expedition.js', 'harem_interact.js', 'govern.js',
    'mainline.js', 'map.js', 'map_v67.js', 'map_province.js',
    'imperial.js', 'minister.js', 'rebel.js',
    'qiuzhuji.js', 'tianming.js', 'xinxing.js', 'chaohui.js',
    'zongfan.js', 'selection.js', 'tribute.js',
    'cangwei.js', 'advice_ext.js', 'achievements.js', 'achievements_ext.js',
    'censor.js', 'secret.js', 'share.js', 'compare.js',
    'famine.js', 'intrigue.js', 'emperor.js', 'prince.js',
    'longevity.js', 'archive.js', 'lifecycle.js', 'liuxiu.js',
    'ji.js', 'unlock.js', 'sound.js', 'visual.js'
];

const sandbox = {
    console,
    localStorage: { _data: {}, setItem(k,v){this._data[k]=v;}, getItem(k){return this._data[k]||null;}, clear(){this._data={};} },
    window: {},
    Date: Date,
    Math, JSON,
    alert: () => {},
    setTimeout: () => {}, clearTimeout: () => {},
    requestAnimationFrame: () => {}, cancelAnimationFrame: () => {},
    pushNews: () => {}, renderPanel: () => {}, updateUI: () => {},
    document: { getElementById: () => ({ classList: { add(){}, remove(){}, contains(){return false;} }, addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, textContent:'', innerHTML:'' }), addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[] },
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
sandbox.global = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);

let loaded = 0, missing = [];
for (const f of FILES) {
    const p = path.join(WORK, f);
    if (!fs.existsSync(p)) { missing.push(f); continue; }
    const code = fs.readFileSync(p, 'utf-8');
    try { vm.runInContext(code, sandbox, { filename: f }); loaded++; }
    catch (e) { if (!/^var /.test(e.message)) console.error(`加载${f}: ${e.message}`); }
}
console.log(`加载 ${loaded} 个脚本${missing.length?'（'+missing.length+' 缺）':''}`);

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

// ====== M1: 接线 ======
assert('M1-01', 'renderMapV67Tab 是函数', () => typeof R('renderMapV67Tab') === 'function');
assert('M1-02', 'MAP_V67_REGIONS 定义且是对象', () => {
    const v = R('MAP_V67_REGIONS');
    return v && typeof v === 'object' && Object.keys(v).length >= 20;
});
assert('M1-03', 'MAP_V67_CITIES 定义且 ≥30 城', () => {
    const v = R('MAP_V67_CITIES');
    return Array.isArray(v) && v.length >= 30;
});
assert('M1-04', 'MAP_V67_MOUNTAINS 至少 5 大山脉', () => {
    const v = R('MAP_V67_MOUNTAINS');
    return Array.isArray(v) && v.length >= 5;
});
assert('M1-05', 'MAP_V67_GREATWALL 是字符串', () => typeof R('MAP_V67_GREATWALL') === 'string' && R('MAP_V67_GREATWALL').length > 30);
assert('M1-06', 'MAP_V67_RIVERS 4 条河流', () => {
    const v = R('MAP_V67_RIVERS');
    return v && typeof v === 'object' && Object.keys(v).length >= 4 && v.changjiang && v.huanghe;
});

// ====== M2: 渲染核心元素存在 ======
const html = R('renderMapV67Tab()');
assert('M2-01', '渲染含 <svg>', () => html && html.indexOf('<svg') >= 0);
assert('M2-02', '渲染含 viewBox', () => html && html.indexOf('viewBox') >= 0);
assert('M2-03', '渲染含 24 布政司节点', () => {
    const matches = (html || '').match(/map-v67-region/g) || [];
    return matches.length >= 24;
});
assert('M2-04', '渲染含 30+ 城市节点', () => {
    const matches = (html || '').match(/map-v67-city/g) || [];
    return matches.length >= 30;
});
assert('M2-05', '渲染含山脉（polygon）', () => html && html.indexOf('<polygon') >= 0);
assert('M2-06', '渲染含长城 path', () => html && html.indexOf('万里长城') >= 0);
assert('M2-07', '渲染含河流 4 条', () => {
    const text = html || '';
    return text.indexOf('黄河') >= 0 && text.indexOf('长江') >= 0 && text.indexOf('淮河') >= 0 && text.indexOf('京杭运河') >= 0;
});
assert('M2-08', '渲染含季节天气背景', () => html && html.indexOf('象·') >= 0);

// ====== M3: 派系色映射 ======
assert('M3-01', '5 派系都有色彩', () => {
    const v = R('MAP_V67_FACTION_COLOR');
    return v && v['wen官'] && v['wujiang'] && v['tusi'] && v['eunuch'] && v['merchant'];
});
assert('M3-02', '派系色都是 #RRGGBB 十六进制', () => {
    const v = R('MAP_V67_FACTION_COLOR');
    return Object.values(v).every(c => /^#[0-9a-fA-F]{6}$/.test(c));
});

// ====== M4: 24 省坐标可靠（不重叠）======
assert('M4-01', '24 省都有 x/y 坐标', () => {
    const v = R('MAP_V67_REGIONS');
    return Object.values(v).every(r => typeof r.x === 'number' && typeof r.y === 'number' && r.x >= 0 && r.x <= 1000 && r.y >= 0 && r.y <= 600);
});
assert('M4-02', '24 省 x/y 唯一无重叠', () => {
    const v = R('MAP_V67_REGIONS');
    const keys = Object.keys(v);
    if (keys.length < 24) return false;
    const seen = new Set();
    for (const k of keys) {
        const tag = v[k].x + ',' + v[k].y;
        if (seen.has(tag)) return false;
        seen.add(tag);
    }
    return true;
});

// ====== M5: 派系影响函数 ======
assert('M5-01', 'getMapV67Faction 是函数', () => typeof R('getMapV67Faction') === 'function');
assert('M5-02', '默认派系能取到', () => {
    const v = R("getMapV67Faction('beizhili')");
    return typeof v === 'string' && v.length > 0;
});
assert('M5-03', '未知省 fallback', () => {
    const v = R("getMapV67Faction('notexist')");
    return v === 'wen官';
});

// ====== M6: 状态色函数 ======
assert('M6-01', 'getMapV67StatusClass 是函数', () => typeof R('getMapV67StatusClass') === 'function');
assert('M6-02', '默认返回 null（用派系色）', () => {
    const v = R("getMapV67StatusClass('beizhili')");
    return v === null;
});

// ====== M7: 反爽代价保留（冷却 + 国库代价）======
assert('M7-01', 'MAP_PATROL_CD = 5（巡视冷却 5 章）', () => R('MAP_PATROL_CD') === 5);
assert('M7-02', 'MAP_RELIEF_COST = 1000（赈灾国库代价）', () => R('MAP_RELIEF_COST') === 1000);
assert('M7-03', '巡视函数仍存在（mapPatrol）', () => typeof R('mapPatrol') === 'function');
assert('M7-04', '赈灾函数仍存在（mapRelief）', () => typeof R('mapRelief') === 'function');

// ====== M8: 兼容性 - openMapCellModal 共用 ======
assert('M8-01', 'openMapCellModal 是函数（共用）', () => typeof R('openMapCellModal') === 'function');
assert('M8-02', 'closeMapModal 是函数', () => typeof R('closeMapModal') === 'function');
assert('M8-03', 'SVG 节点 onclick 调用 openMapCellModal', () => html && html.indexOf("openMapCellModal('beizhili')") >= 0);

// ====== M9: index.html script 串接 ======
const idx = fs.readFileSync(path.join(WORK, 'index.html'), 'utf-8');
assert('M9-01', 'index.html 含 map_v67.js', () => idx.indexOf('map_v67.js') >= 0);
assert('M9-02', 'map_v67.js 在 map.js 之后', () => {
    const a = idx.indexOf('map.js"></script>');
    const b = idx.indexOf('map_v67.js"></script>');
    return a >= 0 && b > a;
});

// ====== M10: modules.js case 'map' 优先 ======
const mod = fs.readFileSync(path.join(WORK, 'modules.js'), 'utf-8');
assert('M10-01', "modules.js case 'map' 优先调 renderMapV67Tab", () => /case 'map':\s*html = \(typeof renderMapV67Tab === 'function'\) \? renderMapV67Tab/.test(mod));

// ====== M11: style.css 末尾包含 .map-svg-* 样式 ======
const css = fs.readFileSync(path.join(WORK, 'style.css'), 'utf-8');
assert('M11-01', 'style.css 末尾包含 .map-svg-wrap', () => css.indexOf('.map-svg-wrap') >= 0);
assert('M11-02', 'style.css 末尾包含 .map-svg', () => css.indexOf('.map-svg{') >= 0);
assert('M11-03', 'style.css 无 @import 外链（避免白屏）', () => !/@import\s+url\([^)]*googleapis/i.test(css));

// ====== M12: 确定性（同种子渲染可复现）======
const html1 = R('renderMapV67Tab()');
const html2 = R('renderMapV67Tab()');
assert('M12-01', '两次渲染完全一致', () => html1 === html2);

// ====== M13: 长江/黄河 polyline 合理性 ======
assert('M13-01', '长江路径含 Q 曲线', () => {
    const v = R('MAP_V67_RIVERS');
    return v.changjiang && v.changjiang.indexOf('Q') >= 0;
});
assert('M13-02', '黄河路径含 Q 曲线', () => {
    const v = R('MAP_V67_RIVERS');
    return v.huanghe && v.huanghe.indexOf('Q') >= 0;
});

// ====== M14: 长城路径含嘉峪关+山海关范围 ======
assert('M14-01', '长城 x 范围跨西→东', () => {
    const v = R('MAP_V67_GREATWALL');
    const pairs = (v.match(/(\d+),(\d+)/g) || []).map(s => s.split(',').map(Number));
    if (pairs.length < 5) return false;
    const xs = pairs.map(p => p[0]);
    return Math.min(...xs) < 150 && Math.max(...xs) > 800;
});

// ====== M15: 城市名都符合明朝 16 世纪地名 ======
assert('M15-01', '城市含北京+南京+西安三大都', () => {
    const v = R('MAP_V67_CITIES');
    const names = v.map(c => c.name);
    return names.indexOf('北京') >= 0 && names.indexOf('南京') >= 0 && names.indexOf('西安') >= 0;
});
assert('M15-02', '含边镇名（嘉峪关/山海关/居庸关）', () => {
    const v = R('MAP_V67_CITIES');
    const names = v.map(c => c.name);
    return names.indexOf('嘉峪关') >= 0 && names.indexOf('山海关') >= 0 && names.indexOf('居庸关') >= 0;
});

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批M（v6.7 大明山河全舆图）验证套件');
console.log('--------------------------------------------------------');
console.log(`批M验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥35）`);
if (fail > 0) {
    console.log('失败项：');
    fails.forEach(f => console.log('  - ' + f));
}
if (pass >= 35 && fail === 0) {
    console.log('✓ 批M（v6.7 大明山河全舆图）验证全部通过');
    process.exit(0);
} else {
    console.log('✗ 批M验证未通过');
    process.exit(1);
}