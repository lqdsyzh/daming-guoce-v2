// ============================================
// 《大明国策》批P(v7.0) 将星录（军事将领体系深挖）验证
// 验证 generals.js：
//   P1) 存档链接线/挂载接线（script.js / modules.js / index.html / military_ops_ext.js）
//   P2) 将领数据层（GEN_ARCHIVE / 阈值 / initGeneralsState 兜底 / 字段齐全）
//   P3) 将领状态机（挂帅/赏赐/罢免/平叛/忠诚漂移/季首限频/面板渲染）
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
    document: { getElementById: () => ({ classList: { add(){}, remove(){}, contains(){return false;} }, addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, textContent:'', innerHTML:'', insertAdjacentHTML(){}, style:{} }), addEventListener(){}, querySelector:()=>null, querySelectorAll:()=>[], head: { appendChild(){} } },
    prompt: () => null, confirm: () => false,
    GameState: { stats: { treasury:10000, privyPurse:5000, prestige:50, mandate:50, stability:50, militaryPower:80, corruption:40, food:1000 },
        factions: { military: 60 }, milOps: { marshal: null, marshalAbility: 70 },
        currentYear: 1, currentSeason: 0, currentMonth: 0,
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

// ====== P1: 接线（源码静态）======
const SCRIPT = fs.readFileSync(path.join(WORK, 'script.js'), 'utf8');
const MODULES = fs.readFileSync(path.join(WORK, 'modules.js'), 'utf8');
const MILOPS = fs.readFileSync(path.join(WORK, 'military_ops_ext.js'), 'utf8');
assert('P1-01', 'index.html 含 generals.js', () => html.indexOf('generals.js') >= 0);
assert('P1-02', 'saveGame 序列化 generals', () => SCRIPT.indexOf('generals: GameState.generals') >= 0);
assert('P1-03', 'loadGame 兜底恢复 save.generals', () => SCRIPT.indexOf('save.generals') >= 0);
assert('P1-04', 'GameState 构造器含 generals: null', () => SCRIPT.indexOf('generals: null') >= 0);
assert('P1-05', 'initGame 初始化 initGeneralsState', () => SCRIPT.indexOf("initGeneralsState()") >= 0);
assert('P1-06', 'advanceSeason 挂 genTick', () => SCRIPT.indexOf("genTick()") >= 0);
assert('P1-07', 'modules.js military 挂 renderGenerals', () => MODULES.indexOf('renderGenerals') >= 0);
assert('P1-08', 'military_ops_ext.js 含 marshalAbility', () => MILOPS.indexOf('marshalAbility') >= 0);

// ====== P2: 数据层 ======
assert('P2-01', 'GEN_ARCHIVE 含 4 剧本', () => {
    const v = R('GEN_ARCHIVE'); return v && ['chenghua','zhengde','wanli','tianqi'].every(k => v[k]);
});
assert('P2-02', 'GEN_REBEL_LOYALTY = 45', () => R('GEN_REBEL_LOYALTY') === 45);
assert('P2-03', 'GEN_SICK_AGE = 64', () => R('GEN_SICK_AGE') === 64);
assert('P2-04', '核心函数齐全', () => {
    const names = ['initGeneralsState','ensureGeneralsState','genRoster','genFind','genStatusName','genMakeMarshal','genReward','genDismiss','genPutDown','genTick','renderGenerals'];
    return names.every(n => typeof R(n) === 'function');
});
assert('P2-05', 'initGeneralsState 生成 chenghua 3 将', () => {
    const v = R('initGeneralsState()');
    return v && Array.isArray(v.list) && v.list.length === 3;
});
assert('P2-06', '将星录字段齐全（王越 能力88/忠75/在朝/史据）', () => {
    const g = R(`initGeneralsState().list.find(g => g.name === '王越')`);
    return g && g.ability === 88 && g.loyalty === 75 && g.status === '在朝' && g.src && g.src.indexOf('明史') >= 0;
});
assert('P2-07', 'ensureGeneralsState 兜底填充 GameState.generals', () => R(`(function(){
    delete GameState.generals; ensureGeneralsState();
    return GameState.generals && Array.isArray(GameState.generals.list) && GameState.generals.list.length === 3 && GameState.generals.rebel === null;
})()`) === true);

// ====== P3: 状态机 ======
assert('P3-01', '挂帅：王越转外任 + 写入能力', () => R(`(function(){
    GameState.generals = initGeneralsState(); GameState.milOps = { marshal: null, marshalAbility: 70 };
    genMakeMarshal('王越');
    const g = genFind('王越');
    return g.status === '外任' && GameState.milOps.marshal === '王越' && GameState.milOps.marshalAbility === 88;
})()`) === true);
assert('P3-02', '挂帅无效名不崩溃', () => { try { R(`GameState.generals = initGeneralsState(); genMakeMarshal('不存在将');`); return true; } catch (e) { return false; } });
assert('P3-03', '赏赐：耗内帑500 提忠12', () => R(`(function(){
    GameState.generals = initGeneralsState(); GameState.stats.privyPurse = 5000;
    const before = genFind('王越').loyalty; genReward('王越');
    return GameState.stats.privyPurse === 4500 && genFind('王越').loyalty === Math.min(100, before + 12);
})()`) === true);
assert('P3-04', '罢免：降忠15 削威望2 削军心3', () => R(`(function(){
    GameState.generals = initGeneralsState(); GameState.stats.prestige = 50; GameState.factions = { military: 60 };
    const g = genFind('王越'); g.status = '外任'; g.loyalty = 80;
    genDismiss('王越');
    return g.status === '在朝' && g.loyalty === 65 && GameState.stats.prestige === 48 && GameState.factions.military === 57;
})()`) === true);
assert('P3-05', '平叛(诛)：反者谢世 + 威望6 军力-12 饷-800', () => R(`(function(){
    GameState.generals = initGeneralsState();
    GameState.stats.prestige = 50; GameState.stats.militaryPower = 80; GameState.stats.treasury = 5000;
    const g = genFind('王越'); g.status = '反'; GameState.generals.rebel = { name: '王越' };
    genPutDown('诛');
    return g.status === '亡' && GameState.stats.prestige === 56 && GameState.stats.militaryPower === 68 && GameState.stats.treasury === 4200 && GameState.generals.rebel === null;
})()`) === true);
assert('P3-06', '平叛(赦)：反者归朝 + 威望4', () => R(`(function(){
    GameState.generals = initGeneralsState();
    GameState.stats.prestige = 50; GameState.stats.militaryPower = 80; GameState.stats.treasury = 5000;
    const g = genFind('王越'); g.status = '反'; GameState.generals.rebel = { name: '王越' };
    genPutDown('赦');
    return g.status === '在朝' && GameState.stats.prestige === 54 && (g.loyalty >= 50 && g.loyalty <= 70);
})()`) === true);
assert('P3-07', '忠诚漂移：在朝低忠向 70 回笼', () => R(`(function(){
    GameState.generals = initGeneralsState(); GameState.currentMonth = 0;
    GameState.factions = { military: 60 }; GameState.stats.corruption = 40;
    const g = genFind('赵辅'); g.status = '在朝'; g.loyalty = 50;
    genTick();
    return g.loyalty > 50 && g.loyalty <= 70;
})()`) === true);
assert('P3-08', '季首限频：非季首 tick 计数器不增', () => R(`(function(){
    GameState.generals = initGeneralsState(); GameState.currentMonth = 1;
    const before = GameState.generals.tick; genTick();
    return GameState.generals.tick === before;
})()`) === true);
assert('P3-09', 'renderGenerals 含标题/将领/挂帅按钮', () => R(`(function(){
    GameState.generals = initGeneralsState();
    const h = renderGenerals();
    return h && h.indexOf('将星录') >= 0 && h.indexOf('王越') >= 0 && h.indexOf('挂帅') >= 0;
})()`) === true);

// ====== 汇总 ======
console.log('--------------------------------------------------------');
console.log('《大明国策》批P（v7.0 将星录）验证套件');
console.log('--------------------------------------------------------');
console.log(`批P验证结果： ${pass} 项通过， ${fail} 项失败（共 ${pass+fail} 项，门槛≥22）`);
if (fail > 0) { console.log('失败项：'); fails.forEach(f => console.log('  - ' + f)); }
if (pass >= 22 && fail === 0) { console.log('✓ 批P（v7.0 将星录）验证全部通过'); process.exit(0); }
else { console.log('✗ 批P验证未通过'); process.exit(1); }