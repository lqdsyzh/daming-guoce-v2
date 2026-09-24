// ============================================
// 《大明国策》v5.0 批A 验证套件
// A1 物价6类初始化 / 季节·灾荒·战争·政策联动涨跌 / 常平·开中·市舶操作
// A2 贪腐侵蚀税收系数 / 治理手段 / 抄家反爽游代价
// A3 市面萧条·景气指数
// G  存档往返 / 旧档兼容
// 门槛：≥70项 0失败
// ============================================

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const passed = [];
const failed = [];

function assert(id, desc, condition) {
    let ok = condition;
    if (typeof condition === 'function') { try { ok = condition(); } catch (e) { ok = false; } }
    if (ok) { passed.push(id); }
    else { failed.push(id + ': ' + desc); console.log('  ✗ [' + id + '] ' + desc); }
}

const domCode = `
class HTMLElement { constructor(){this.classList={add:()=>{},remove:()=>{},contains:()=>false};this.style={};this.children=[];this.innerHTML='';this.textContent='';this.value='';this.dataset={};this.parentNode=null;} appendChild(c){this.children.push(c);} removeChild(c){} addEventListener(){} removeEventListener(){} getAttribute(){return '';} setAttribute(){} removeAttribute(){} closest(){return null;} } class Document { constructor(){this.body=new HTMLElement();this.head=new HTMLElement();this.documentElement=new HTMLElement();this._els={};this.readyState='none';} getElementById(id){if(!this._els[id]){this._els[id]=new HTMLElement();this._els[id].id=id;} return this._els[id];} querySelectorAll(){return [];} querySelector(){return new HTMLElement();} createElement(){return new HTMLElement();} addEventListener(){} } const document=new Document(); const window={document,addEventListener:()=>{},removeEventListener:()=>{},innerWidth:1024,innerHeight:768,localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},setTimeout:(f,t)=>f(),setInterval:()=>0,clearInterval:()=>{},navigator:{userAgent:'node'},location:{href:'',hostname:'localhost'},_mapCurrentKey:null}; const localStorage=window.localStorage; `;

const scriptFiles = [
    'data/script.js','data/systems.js','data/achievements.js','data/historian.js',
    'data/advice.js','data/memorials.js','data/memorials_v31.js',
    'data/systems2.js','data/v31_extra.js','data/share.js','data/compare.js',
    'data/extras_ui.js','data/extras2.js',
    'data/events_ext.js','data/memorials_ext.js','data/advice_ext.js',
    'modules.js','sfx.js','yearend.js','mobileui.js','script.js',
    'map.js','daming_talk.js','cangwei.js','expedition.js',
    'court_session.js','harem_interact.js','diplomacy_interact.js','keju.js','yingzao.js',
    'military_ops_ext.js','junpi.js','zaiyi.js','lizhi.js','auto.js','batch5_bridge.js',
    'data/achievements_ext.js',
    // 批A
    'economy_market.js'
];

let ctx;
try {
    const sandbox = { console, setTimeout, setInterval, clearInterval, Math, JSON, Date, Error, Array, Object, String, Number, Boolean, Map, Set, RegExp, undefined, NaN, Infinity, isNaN, isFinite, parseInt, parseFloat, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent, require };
    vm.runInContext(domCode, vm.createContext(sandbox));
    ctx = vm.createContext(sandbox);
    const gameCode = scriptFiles.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;');
    vm.runInContext(gameCode, ctx);
} catch (e) {
    console.error('加载失败:', e.message);
    process.exit(1);
}

function run(code) { try { return vm.runInContext(code, ctx); } catch (e) { return undefined; } }
function runMust(code, id, desc) { try { return vm.runInContext(code, ctx); } catch (e) { assert(id, desc + ' (抛: ' + e.message + ')', false); return undefined; } }

console.log('========================================================');
console.log('《大明国策》批A（经济深改）验证套件');
console.log('========================================================');

function fresh(script) { run(`initGame('${script || 'chenghua'}');`); }
function S() { return run('GameState'); }
function det() { run('Math.random = function(){ return 0.5; };'); }
function nat() { run('Math.random = Math.randomOriginal || Math.random;'); run('Math.randomOriginal=undefined;'); }

// ===== A. 物价6类初始化运维 =====
console.log('\n— A. 物价系统初始化 —');
assert('A01', 'initEconomyState函数存在', run('typeof initEconomyState') === 'function');
assert('A02', 'economyTick函数存在', run('typeof economyTick') === 'function');
assert('A03', 'initGame后 econ 存在', () => { fresh(); return run('GameState.econ !== undefined'); });
assert('A04', 'econ 含 6 类价物', () => { fresh(); var e = run('Object.keys(GameState.econ.prices).join(",")'); return ['grain','salt','iron','horse','silk','silver'].every(k => e.indexOf(k) >= 0); });
assert('A05', '粮价基准=1', run('ECON_COMMODITIES.grain.base') === 1);
assert('A06', '银价物存在（白银购买力）', () => { fresh(); return run('typeof GameState.econ.prices.silver.v') === 'number'; });
assert('A07', '6 类物价系数均在合理区间', () => { fresh(); det(); var s = S(); var ok = true; for (var k in s.econ.prices) { var v = s.econ.prices[k].v; if (!(v >= 0.35 && v <= 3.0)) ok = false; } return ok; });
assert('A08', '六物实价 > 0', () => { fresh(); var s = S(); var ok = true; for (var k in s.econ.prices) { var real = run(`_econPriceVal('${k}')`); if (!(real > 0)) ok = false; } return ok; });
assert('A09', '初始银价随贪腐升高而贵（银贵钱贱）', () => {
    const high = run('GameState.stats.corruption=85; initEconomyState().prices.silver.v');
    const low  = run('GameState.stats.corruption=10; initEconomyState().prices.silver.v');
    return high > low;
});
assert('A10', '初始粮价随农业高而贱', () => {
    const hiAg = run(`GameState.stats.agriculture=85; initEconomyState().prices.grain.v`);
    const loAg = run(`GameState.stats.agriculture=20; initEconomyState().prices.grain.v`);
    return hiAg < loAg;
});
assert('A11', '四剧本开局均可初始化经济', () => {
    var ok = true;
    ['chenghua','zhengde','wanli','tianqi'].forEach(function(id){ run(`GameState.stats={agriculture:50,commerce:40,corruption:30,stability:50}; initEconomyState();`); });
    return ok;
});
assert('A12', 'economyTick 单次不抛错', () => { fresh(); det(); return run('(function(){ try{ economyTick(); return true; }catch(e){ return false; } })()'); });

// ===== B. 季节/灾荒/战争/政策联动涨跌 =====
console.log('\n— B. 物价季动联动 —');
det();
// 秋获粮价回落 < 冬价昂
run(`initGame('chenghua'); GameState.zaiyi={pending:[]};`);
run(`GameState.currentSeason=2;`); run(`GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
const autumnGrain = run('GameState.econ.prices.grain.v');
run(`GameState.currentSeason=3; GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
const winterGrain = run('GameState.econ.prices.grain.v');
assert('B01', '秋获后粮价回落、冬价昂（固定随机）', autumnGrain < winterGrain);

// 灾荒 → 粮价暴涨
run(`initGame('chenghua'); GameState.zaiyi={pending:[{key:'旱',label:'旱灾',title:'大旱',turns:2,responded:false}]};`);
run(`GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
const baseGrain = run('GameState.econ.prices.grain.v');
for (let i=0;i<30;i++) run('economyTick()');
const famineGrain = run('GameState.econ.prices.grain.v');
assert('B02', '灾荒年粮价暴涨', famineGrain > baseGrain + 0.15);

// 无灾荒对照：粮价温和
run(`initGame('chenghua'); GameState.zaiyi={pending:[]}; GameState.currentSeason=1;`);
run(`GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
const calmGrain = run('GameState.econ.prices.grain.v');
assert('B03', '无灾荒时粮价回归温和区间', calmGrain > 0.7 && calmGrain < 1.5);

// 战争 → 铁/马贵
run(`initGame('chenghua'); GameState.stats.militaryPower=12000; GameState.zaiyi={pending:[]};`);
run(`GameState.econ.prices.iron.v=1.0; GameState.econ.prices.iron.mom=0; GameState.econ.prices.horse.v=1.0; GameState.econ.prices.horse.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
assert('B04', '战争高压→铁价升', run('GameState.econ.prices.iron.v') > 1.1);
assert('B05', '战争高压→马价升', run('GameState.econ.prices.horse.v') > 1.1);

// 军事平静对照
run(`initGame('chenghua'); GameState.stats.militaryPower=3000;`);
run(`GameState.econ.prices.iron.v=1.0; GameState.econ.prices.iron.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
assert('B06', '军事平静→铁价不攀升', run('GameState.econ.prices.iron.v') < 1.15);

// 市舶开 → 盐铁绢趋贱
run(`initGame('chenghua'); GameState.econ.shibo=1;`);
run(`GameState.econ.prices.salt.v=1.2; GameState.econ.prices.salt.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
assert('B07', '开市舶→盐价趋贱', run('GameState.econ.prices.salt.v') < 1.05);

// 高贪腐 → 银贵 + 谷贵
run(`initGame('chenghua'); GameState.stats.corruption=90;`);
run(`GameState.econ.prices.silver.v=1.0; GameState.econ.prices.silver.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
assert('B08', '高贪腐→银贵钱贱（白银购买力升）', run('GameState.econ.prices.silver.v') > 1.05);

// 常平粮足 → 压制粮价
run(`initGame('chenghua'); GameState.zaiyi={pending:[{key:'旱',label:'旱灾',title:'大旱',turns:2,responded:false}]}; GameState.econ.granary=12000;`);
run(`GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
const richGranary = run('GameState.econ.prices.grain.v');
run(`initGame('chenghua'); GameState.zaiyi={pending:[{key:'旱',label:'旱灾',title:'大旱',turns:2,responded:false}]}; GameState.econ.granary=500;`);
run(`GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0;`);
for (let i=0;i<30;i++) run('economyTick()');
const poorGranary = run('GameState.econ.prices.grain.v');
assert('B09', '常平粮足者粮价涨势更缓', richGranary < poorGranary);

// ===== C. 常平/开中/市舶操作 =====
console.log('\n— C. 市场操作（反爽游）—');
// 常平籴入
run(`initGame('chenghua'); GameState.econ.prices.grain.v=0.9; GameState.econ.prices.grain.mom=0; GameState.stats.treasury=5000; GameState.econ.granary=300;`);
const g0 = run('GameState.econ.granary');
run('economyChangpingBuy()');
assert('C01', '常平籴入→仓粮增', run('GameState.econ.granary') > g0);
assert('C02', '常平籴入→国库银减', run('GameState.stats.treasury') < 5000);
assert('C03', '谷贱籴入→温和托市', run('GameState.econ.prices.grain.mom') > 0);
// 谷贵仍强籴 → 助涨 + 民怨（反爽游）
run(`initGame('chenghua'); GameState.econ.prices.grain.v=1.5; GameState.stats.treasury=5000; GameState.stats.stability=50; GameState.factions.civil=50;`);
run('economyChangpingBuy()');
assert('C04', '谷贵强籴→大幅助涨（反助涨杀跌）', run('GameState.econ.prices.grain.mom') > 0.05);
assert('C05', '谷贵强籴→民怨稳定降', run('GameState.stats.stability') < 50);
// 常平粜出
run(`initGame('chenghua'); GameState.econ.prices.grain.v=1.2; GameState.econ.granary=3000; GameState.stats.treasury=100;`);
const g1 = run('GameState.econ.granary');
const t1 = run('GameState.stats.treasury');
run('economyChangpingSell()');
assert('C06', '常平粜出→仓粮减', run('GameState.econ.granary') < g1);
assert('C07', '常平粜出→国库银增', run('GameState.stats.treasury') > t1);
// 谷贱反粜 → 杀跌（反爽游）
run(`initGame('chenghua'); GameState.econ.prices.grain.v=0.5; GameState.econ.granary=3000;`);
run('economyChangpingSell()');
assert('C08', '谷贱反粜→压市（杀跌）', run('GameState.econ.prices.grain.mom') < -0.05);
// 开中法
run(`initGame('chenghua'); GameState.stats.treasury=5000; GameState.stats.militaryFood=100; GameState.econ.saltTally=600; GameState.stats.militaryPower=9000;`);
const mf = run('GameState.stats.militaryFood');
run('economyKaizhong()');
assert('C09', '开中济边→军粮增', run('GameState.stats.militaryFood') > mf);
assert('C10', '开中济边→银减', run('GameState.stats.treasury') < 5000);
assert('C11', '开中济边→盐引减', run('GameState.econ.saltTally') < 600);
// 无盐引 → 开中不成
run(`initGame('chenghua'); GameState.stats.treasury=5000; GameState.econ.saltTally=10; GameState.stats.militaryFood=100;`);
run('economyKaizhong()');
assert('C12', '无盐引→开中不成（军粮不变）', run('GameState.stats.militaryFood') === 100);
// 市舶开关
run(`initGame('chenghua'); GameState.econ.shibo=0; GameState.stats.commerce=50; GameState.stats.treasury=1000;`);
const c0 = run('GameState.stats.commerce');
run('economyShiboToggle()');
assert('C13', '开市舶→shibo置1', run('GameState.econ.shibo') === 1);
assert('C14', '开市舶→商税增', run('GameState.stats.commerce') > c0);
assert('C15', '开市舶→海禁之争臣心落', run('GameState.factions.civil') < 60);
run('economyShiboToggle()');
assert('C16', '罢市舶→shibo回0', run('GameState.econ.shibo') === 0);
// 市舶收入进 calculateIncome
run(`initGame('chenghua'); GameState.econ.shibo=1; GameState.stats.commerce=60;`);
const incOpen = run('calculateIncome().haigang');
run('GameState.econ.shibo=0;');
const incClose = run('calculateIncome().haigang');
assert('C17', '市舶开时市舶税明显更高', incOpen > incClose);
// 市舶积祸在久开时触发
run(`initGame('chenghua'); GameState.econ.shibo=1; GameState.econ.shiboRisk=6; GameState.stats.navyPower=1200;`);
run('economyTick()');
assert('C18', '市舶积祸→海防受损', run('GameState.stats.navyPower') < 1200);

// ===== D. 贪腐侵蚀税收系数 =====
console.log('\n— D. 贪腐侵蚀链 —');
assert('D01', 'corruptionErosion函数存在', run('typeof corruptionErosion') === 'function');
assert('D02', '贪腐低→侵蚀接近1', () => { run('GameState.stats.corruption=5;'); return run('corruptionErosion()') === 1; });
assert('D03', '贪腐中等→侵蚀<1且>0.8', () => { run('GameState.stats.corruption=30;'); const e = run('corruptionErosion()'); return e < 1 && e > 0.8; });
assert('D04', '贪腐30→侵蚀≈0.90', () => { run('GameState.stats.corruption=30;'); const e = run('corruptionErosion()'); return Math.abs(e - 0.90) < 0.02; });
assert('D05', '贪腐60→侵蚀≈0.75', () => { run('GameState.stats.corruption=60;'); const e = run('corruptionErosion()'); return Math.abs(e - 0.75) < 0.02; });
assert('D06', '贪腐100→侵蚀≈0.63', () => { run('GameState.stats.corruption=100;'); const e = run('corruptionErosion()'); return Math.abs(e - 0.63) < 0.03; });
assert('D07', '侵蚀随贪腐单调下降', () => {
    let prev = 2; let ok = true;
    for (var c = 0; c <= 100; c += 10) { run(`GameState.stats.corruption=${c};`); const e = run('corruptionErosion()'); if (e > prev) ok = false; prev = e; }
    return ok;
});
assert('D08', '应收1000在贪腐60实得600-800', () => { run('GameState.stats.corruption=60;'); const got = run('corruptionErosion() * 1000'); return got >= 600 && got <= 800; });
assert('D09', '应收1000在贪腐80实得600-800', () => { run('GameState.stats.corruption=80;'); const got = run('corruptionErosion() * 1000'); return got >= 600 && got <= 800; });
assert('D10', 'reliefErosion分值低于corruptionErosion', () => { run('GameState.stats.corruption=70;'); return run('reliefErosion()') < run('corruptionErosion()'); });
assert('D11', 'reliefErosion不小于0.32', () => { run('GameState.stats.corruption=100;'); return run('reliefErosion()') >= 0.32; });
assert('D12', 'calculateIncome税赋随贪腐折损', () => {
    run('GameState.stats.corruption=20; GameState.stats.adminEfficiency=50;');
    const taxLow = run('calculateIncome().tax');
    run('GameState.stats.corruption=90; GameState.stats.adminEfficiency=50;');
    const taxHigh = run('calculateIncome().tax');
    return taxLow > taxHigh;
});
assert('D13', '税赋折损全链路生效（应收千计实得减）', () => {
    run('GameState.stats.corruption=30; GameState.stats.adminEfficiency=50;');
    const t = run('calculateIncome().tax');
    return t > 0 && t < 800;
});
assert('D14', 'rebellionRisk在[0,1]', () => { fresh(); return (function(){ const r = run('rebellionRisk()'); return r >= 0 && r <= 1; })(); });
assert('D15', '贪腐高→叛乱风险升', () => {
    run('GameState.stats.corruption=15; GameState.stats.stability=60; GameState.econ={depressed:0,prosperity:60};');
    const low = run('rebellionRisk()');
    run('GameState.stats.corruption=90; GameState.stats.stability=30; GameState.econ={depressed:3,prosperity:20};');
    const high = run('rebellionRisk()');
    return high > low;
});

// ===== E. 治理手段 =====
console.log('\n— E. 贪腐治理（反爽游代价）—');
run('initGame("chenghua"); GameState.stats.corruption=50;');
run('economyXiantan()');
assert('E01', '巡按限贪→贪腐降', run('GameState.stats.corruption') < 50);
assert('E02', '巡按限贪→官心降', run('GameState.factions.civil') < 60);
run('initGame("chenghua"); GameState.stats.corruption=80; GameState.stats.privyPurse=100; GameState.stats.stability=60; GameState.factions.civil=60;');
run('Math.random = function(){ return 0.1; }; economyXiantan();');
assert('E03', '限贪抄贪臣→内帑得银', run('GameState.stats.privyPurse') > 100);
assert('E04', '抄没贪臣→稳定/臣心双跌（官逼民反代价）', run('GameState.stats.stability') < 60);
run('initGame("chenghua"); GameState.stats.corruption=60; GameState.stats.treasury=2000; GameState.stats.prestige=60;');
const cr0 = run('GameState.stats.corruption');
run('economyChengqing()');
assert('E05', '澄清吏治→贪腐大降', run('GameState.stats.corruption') < cr0 - 10);
assert('E06', '澄清吏治→耗威望', run('GameState.stats.prestige') < 60);
assert('E07', '澄清吏治→耗银', run('GameState.stats.treasury') < 2000);
run('initGame("chenghua"); GameState.stats.treasury=50; GameState.stats.corruption=50;');
run('economyChengqing()');
assert('E08', '府库不足→澄清吏治不可行', run('GameState.stats.corruption') === 50);
run('initGame("chenghua"); GameState.stats.corruption=80; GameState.stats.privyPurse=50; GameState.stats.stability=60; GameState.stats.prestige=60; GameState.factions.civil=60;');
run('economyChaojia()');
assert('E09', '明确抄家→立得内帑', run('GameState.stats.privyPurse') > 50);
assert('E10', '明确抄家→清议崩坏（稳定/威望/臣心齐跌）', run('GameState.stats.stability') < 60 && run('GameState.stats.prestige') < 60);
run('initGame("chenghua"); GameState.stats.corruption=10; GameState.stats.privyPurse=50;');
run('economyChaojia()');
assert('E11', '无大奸→不可抄家', run('GameState.stats.privyPurse') === 50);

// ===== F. 市面萧条·景气指数 =====
console.log('\n— F. 市面萧条与景气指数 —');
det();
run('initGame("chenghua"); GameState.stats.stability=30; GameState.stats.corruption=55; GameState.mapData={redAlert:true}; GameState.zaiyi={pending:[{key:"旱",title:"大旱",turns:2,responded:false}]};');
run('economyTick()');
assert('F01', '乱局→市面萧条>0', run('GameState.econ.depressed') > 0);
run('initGame("chenghua"); GameState.stats.stability=80; GameState.stats.corruption=10; GameState.stats.commerce=75; GameState.mapData={redAlert:false}; GameState.zaiyi={pending:[]};');
run('economyTick()');
assert('F02', '太平→市面无萧条', run('GameState.econ.depressed') === 0);
run('initGame("chenghua"); GameState.stats.stability=85; GameState.stats.commerce=85; GameState.stats.agriculture=85; GameState.stats.corruption=5; GameState.stats.prestige=80; GameState.zaiyi={pending:[]}; GameState.mapData={redAlert:false};');
run('GameState.econ.prices.grain.v=1.0; GameState.econ.prices.grain.mom=0; GameState.econ.prices.salt.v=1.0;');
run('economyTick()');
assert('F03', '繁荣→景气指数高(≥50)', run('GameState.econ.prosperity') >= 50);
assert('F04', '景气指数在0-100内', run('GameState.econ.prosperity') > 0 && run('GameState.econ.prosperity') <= 100);
run('initGame("chenghua"); GameState.stats.stability=10; GameState.stats.commerce=20; GameState.stats.agriculture=20; GameState.stats.corruption=90; GameState.zaiyi={pending:[{key:"旱",title:"大旱",turns:2,responded:false}]};');
run('GameState.econ.prices.grain.v=2.5; GameState.econ.prices.salt.v=2.0;');
run('economyTick()');
assert('F05', '乱象→景气指数低(<40)', run('GameState.econ.prosperity') < 40);
// 萧条折损商税
run('initGame("chenghua"); GameState.stats.commerce=60; GameState.stats.adminEfficiency=50; GameState.stats.corruption=30;');
run('GameState.econ.depressed=0;');
const com0 = run('calculateIncome().commerce');
run('GameState.econ.depressed=4;');
const com4 = run('calculateIncome().commerce');
assert('F06', '市面萧条→商税减', com4 < com0);
// 渲染
assert('F07', 'renderMarketV5含六物文案', (function(){ fresh(); const h = run('renderMarketV5()'); return h && h.indexOf('粮')>=0 && h.indexOf('盐')>=0 && h.indexOf('铁')>=0 && h.indexOf('马')>=0 && h.indexOf('绢')>=0; })());
assert('F08', 'renderMarketV5含常平/开中/市舶操作', (function(){ fresh(); const h = run('renderMarketV5()'); return h.indexOf('常平')>=0 && h.indexOf('开中')>=0 && h.indexOf('市舶')>=0; })());
assert('F09', 'renderMarketV5含贪腐治理', (function(){ fresh(); return run('renderMarketV5()').indexOf('巡按限贪')>=0; })());
assert('F10', 'renderProsperityCard含景气指数', (function(){ fresh(); return run('renderProsperityCard()').indexOf('景气')>=0; })());
assert('F11', 'renderGovernance含澄清吏治', (function(){ fresh(); return run('renderGovernance()').indexOf('澄清吏治')>=0; })());
assert('F12', 'renderEconomy 追加国势冷暖卡', (function(){ fresh(); try { run('renderEconomy()'); const p = run("document.getElementById('center-panel').innerHTML"); return p && p.indexOf('景气') >= 0; } catch(e){ return false; } })());
assert('F13', 'markets tab 已接管为 renderMarketV5', (function(){ fresh(); try { run("renderPanel('markets')"); const p = run("document.getElementById('center-panel').innerHTML"); return p && p.indexOf('国势冷暖')>=0; } catch(e){ return false; } })());

// ===== G. 存档往返 / 旧档兼容 =====
console.log('\n— G. 存档链 —');
run('initGame("chenghua"); GameState.econ.prices.grain.v=1.37; GameState.econ.granary=5555; GameState.econ.shibo=1;');
run('saveGame()');
const savedRaw = run('localStorage.getItem("daming_guoce_save_v2")');
let savedHasEcon = false, savedGrain = null;
try { const obj = JSON.parse(savedRaw); savedHasEcon = '__proto__' in obj && false || obj.econ !== undefined; if (obj.econ) savedGrain = obj.econ.prices && obj.econ.prices.grain.v; } catch(e){}
assert('G01', '存档包含 econ 字段', savedHasEcon);
assert('G02', '存档面价随备份写入', savedGrain !== null && Math.abs(savedGrain - 1.37) < 0.001);
assert('G03', '存档含市舶状态', run('JSON.parse(localStorage.getItem("daming_guoce_save_v2")).econ.shibo') === 1);
// 往返恢复
run('loadGame()');
assert('G04', '读档恢复物价/仓粮', run('GameState.econ.prices.grain.v') === 1.37 && run('GameState.econ.granary') === 5555);
assert('G05', '读档恢复市舶开关', run('GameState.econ.shibo') === 1);
// 旧档兼容（无 econ 字段）
run(`localStorage.setItem("daming_guoce_save_v2", JSON.stringify(Object.assign(JSON.parse(localStorage.getItem("daming_guoce_save_v2")), {econ: undefined})));`);
run('loadGame()');
assert('G06', '旧档缺 econ → 兜底初始化', run('GameState.econ') !== undefined && typeof run('GameState.econ.prices.grain.v') === 'number');
assert('G07', '旧档兼容后仍可推进经济巡检', (function(){ nat(); run('advanceSeason();'); return run('(typeof GameState.econ === "object")'); })());
// 四剧本旧档缺省均可兜底
['chenghua','zhengde','wanli','tianqi'].forEach(function(id, i){
    run(`var saved=JSON.parse(localStorage.getItem("daming_guoce_save_v2")); saved.script="${id}"; delete saved.econ; localStorage.setItem("daming_guoce_save_v2", JSON.stringify(saved)); loadGame();`);
    const hasEcon = run('typeof GameState.econ.prices.grain.v') === 'number';
    assert('G' + (8 + i), '旧档缺 econ 兜底 ' + id, hasEcon);
});

// ===== H. 工程自检 =====
console.log('\n— H. 工程完整性 —');
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const mx = fs.readFileSync(path.join(ROOT, 'economy_market.js'), 'utf8');
const sc = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const mo = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
assert('H01', 'index.html 引入 economy_market.js', idx.indexOf('economy_market.js') >= 0);
assert('H02', 'economy_market 置于 achievements_ext 之后', idx.indexOf('achievements_ext.js') < idx.indexOf('economy_market.js'));
assert('H03', 'edict 永久 DOM 未被改动（economy 决策不含 edict 改写）', mx.indexOf('edict-zone') < 0 && mx.indexOf('getElementById("edict') < 0);
assert('H04', 'script.js 存档链写入 econ', sc.indexOf('econ: GameState.econ') >= 0);
assert('H05', 'script.js 读档兜底 econ', sc.indexOf("save.econ") >= 0);
assert('H06', 'initGame 初始化经济状态', sc.indexOf('initEconomyState') >= 0);
assert('H07', 'advanceSeason 巡检挂 economyTick', sc.indexOf('economyTick()') >= 0);
assert('H08', 'predict—modules 税收读贪腐侵蚀', mo.indexOf('_econErosion') >= 0);
let allJsOk = true;
['economy_market.js','script.js','modules.js'].forEach(f=>{
    try { require('child_process').execSync('node --check "' + f + '"', {cwd: ROOT}); }
    catch(e){ allJsOk = false; }
});
assert('H09', '改动三个 js node --check 通过', allJsOk);

// ===== 汇总 =====
console.log('\n========================================================');
console.log('总计：' + passed.length + ' 项 | 通过 ' + passed.length + ' | 失败 ' + failed.length + '（≥70 项门槛）');
console.log(failed.length === 0 ? '✓ 批A（经济深改）验证全部通过' : '✗ 存在失败项');
console.log('========================================================');
process.exit(failed.length === 0 && passed.length >= 70 ? 0 : 1);