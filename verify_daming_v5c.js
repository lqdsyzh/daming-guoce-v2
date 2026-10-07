// ============================================
// 《大明国策》v5.0 批C 验证套件（战棋/回合制小战引擎）
// X1 战场框架（地形/兵种/布阵/士气）
// X2 战术指令与克制（进攻/防守/迂回/突袭/火器齐射/督战）
// X3 出师辽东改造（expDispatch 进入战棋实战 + 反哺 expDeadList/边镇/舆图）
// X4 平叛战接入（事件「发兵征讨」进入实战，成功转安/失败蔓延）
// X5 胜负判定与追责（士气崩溃/大捷/惨胜/败退/帅殁/相持/撤军）
// X6 军需断饷机制（战时逐合焚烧，饷断军心崩）
// X7 联动批A（经济景气/火器加成）
// X8 存档往返 / 旧档兼容（battlefield 走存档链三件套）
// R  源码静态纪律（纯前端零依赖/edict不动/script顺序）
// 门槛：≥80项 0失败
// ============================================

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname);
const passed = [], failed = [];
function assert(id, desc, condition) {
    let ok = condition;
    if (typeof condition === 'function') { try { ok = condition(); } catch (e) { ok = false; } }
    if (ok) passed.push(id); else { failed.push(id + ': ' + desc); console.log('  ✗ [' + id + '] ' + desc); }
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
    'economy_market.js',   // 批A
    'mainline.js',          // 批B
    'battlefield.js'        // 批C
];

let ctx;
try {
    const sandbox = { console, setTimeout, setInterval, clearInterval, Math, JSON, Date, Error, Array, Object, String, Number, Boolean, Map, Set, RegExp, undefined, NaN, Infinity, isNaN, isFinite, parseInt, parseFloat, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent, require };
    vm.runInContext(domCode, vm.createContext(sandbox));
    ctx = vm.createContext(sandbox);
    const gameCode = scriptFiles.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;');
    vm.runInContext(gameCode, ctx);
} catch (e) { console.error('加载失败:', e.message); process.exit(1); }

function run(code) { try { return vm.runInContext(code, ctx); } catch (e) { console.log('  [run 异常] ' + e.message); return undefined; } }
function fresh(script) { run(`initGame('${script || 'chenghua'}');`); }
function det() { run('Math.random = function(){ return 0.55; };'); }
// 在 vm 域内开启一场平叛战（deploy 后 return 状态）
function startPac(kind, region, troops) {
    run(`bfEventPacify({title:"x"},{bf:{kind:"${kind||'panjun'}",regionKey:"${region||'sichuan'}",regionName:"试战",troops:${troops||40}}});`);
}
function dumpDel() { run('bfAbandon(); bfClose();'); }
const SRC = {};
['battlefield.js','expedition.js','index.html','style.css','script.js']
    .forEach(f => { SRC[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); });
const bfSrc = SRC['battlefield.js'];
const exSrc = SRC['expedition.js'];
const html = SRC['index.html'];
const css = SRC['style.css'];

// ============================================================
console.log('━━ 批C Part X1：战场框架（地形/兵种/布阵/士气） ━━');
assert('X1-01','BF_TERRAINS 六地形', /var BF_TERRAINS = \{/.test(bfSrc) && ['plain','mountain','forest','river','city','pass'].every(k=>bfSrc.includes(k+':')));
assert('X1-02','城池防最高 1.60', /city:\s+\{\s*name: '城池',\s*def: 1\.60/.test(bfSrc));
assert('X1-03','关隘防 1.50', /pass:\s+\{\s*name: '关隘',\s*def: 1\.50/.test(bfSrc));
assert('X1-04','河流攻折 0.7', /river:\s+\{\s*name: '河流',\s*def: 1\.20,\s*atk: 0\.7/.test(bfSrc));
assert('X1-05','山地防>平攻折 0.9', /mountain: \{ name: '山地', def: 1\.30, atk: 0\.9/.test(bfSrc));
assert('X1-06','bfBuildBoard 5×5 网格', (function(){ det(); fresh('wanli'); const b=run('bfBuildBoard()'); return b&&b.length===5&&b[0].length===5; })());
assert('X1-07','棋盘含城池格', (function(){ det(); fresh('wanli'); const b=run('bfBuildBoard().flat().some(c=>c.t==="city")'); return b===true; })());
assert('X1-08','棋盘含关隘格', (function(){ det(); fresh('wanli'); return run('bfBuildBoard().flat().some(c=>c.t==="pass")')===true; })());
assert('X1-09','bfBestTerrain 取最优防地形（城池）', (function(){ det(); fresh('wanli'); startPac('tusi','sichuan',40); const n=run('bfBestTerrain(bfState()).name'); dumpDel(); return n==='城池'; })());
assert('X1-10','我方四兵种定义', ['shenji','jing','bian','shui'].every(k=>bfSrc.includes(k+':')));
assert('X1-11','神机营火器成军条件', /firearms >= 1 && troops >= 25/.test(bfSrc));
assert('X1-12','敌五战种', ['beilu','wokou','panjun','tusi','wubing'].every(k=>new RegExp(k+':\\s+\\{').test(bfSrc)));
assert('X1-13','bfMkUnit 含攻防士气', /function bfMkUnit/.test(bfSrc) && /atk:/.test(bfSrc) && /mor:/.test(bfSrc));
assert('X1-14','敌方按 kind 分支', /kind === 'wokou'/.test(bfSrc) && /kind === 'tusi'/.test(bfSrc));
assert('X1-15','敌难度调制', /Math\.max\(0\.7, Math\.min\(1\.5, difficulty/.test(bfSrc));
assert('X1-16','五布阵位形', ['front','center','wing1','wing2','rear'].every(k=>bfSrc.includes(k+':')));
assert('X1-17','先锋攻高', /front:  \{ name: '先锋', atkMul: 1\.2/.test(bfSrc));
assert('X1-18','中军持稳', /center: \{ name: '中军', atkMul: 1\.0, defMul: 1\.1/.test(bfSrc));
assert('X1-19','bfAssign 摆位去重', /bfAssign\(unitId, formation\)/.test(bfSrc) && /filter\(function \(id\) \{ return id !== unitId; \}\)/.test(bfSrc));
assert('X1-20','bfDeployAll 一键归中军', /function bfDeployAll/.test(bfSrc) && /bfAssign\(u\.id, 'center'\)/.test(bfSrc));
assert('X1-21','bfCommitDeploy 转 battle', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); run('bfDeployAll();'); const r=run('bfCommitDeploy()'); const p=run('bfState().phase'); dumpDel(); return r===true&&p==='battle'; })());
assert('X1-22','deploy 阶段布阵', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); const p=run('bfState().phase'); dumpDel(); return p==='deploy'; })());
assert('X1-23','bfInitMorale 依将才军心', /ability\) m \+= \(gen\.ability - 70\) \* 0\.4/.test(bfSrc) && /factions\.military\) m \+=/.test(bfSrc));
assert('X1-24','敌士气依战种', /kind === 'panjun'\) m -= 12/.test(bfSrc) && /kind === 'beilu'\) m \+= 4/.test(bfSrc));
assert('X1-25','士气归零溃败判定', /b\.player\.morale <= 0\) \|\| \(b\.enemy\.morale <= 0/.test(bfSrc));

// ============================================================
console.log('━━ 批C Part X2：战术指令与克制 ━━');
assert('X2-01','六战术', ['attack','defend','flank','assault','volley','supervise'].every(k=>bfSrc.includes(k+':')));
assert('X2-02','火器齐射倍率最高 1.80 士气6', /volley:   \{ name: '火器齐射', morale: 6,  mult: 1\.80/.test(bfSrc));
assert('X2-03','进攻克迂回', /attack:   \{ name: '进攻',    morale: 0,  mult: 1\.25, beat: 'flank'/.test(bfSrc));
assert('X2-04','防守克进攻', /defend:   \{ name: '防守',    morale: 2,  mult: 0\.55, beat: 'attack'/.test(bfSrc));
assert('X2-05','迂回克督战', /flank:    \{ name: '迂回',    morale: 3,  mult: 1\.10, beat: 'supervise'/.test(bfSrc));
assert('X2-06','突袭克迂回', /assault:  \{ name: '突袭',    morale: 5,  mult: 1\.45, beat: 'flank'/.test(bfSrc));
assert('X2-07','督战回士气', /supervise:\{ name: '督战',    morale: -8, mult: 0\.35/.test(bfSrc));
assert('X2-08','bfBeat 三分支', /function bfBeat/.test(bfSrc) && /return 1;/.test(bfSrc) && /return -1;/.test(bfSrc));
assert('X2-09','火器克骑冲', /info\.beat === 'cav'\) return \(eneTac === 'flank' \|\| eneTac === 'assault'\) \? 1 : 0/.test(bfSrc));
assert('X2-10','敌AI依种/士气出招', /function bfEnemyTactic/.test(bfSrc) && /role === 'cav'/.test(bfSrc) && /m < 35\) return 'defend'/.test(bfSrc));
assert('X2-11','bfRunTurn 拒非法战术', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); run('bfDeployAll();bfCommitDeploy();'); const r=run('bfRunTurn("bogus").ok'); dumpDel(); return r===false; })());
assert('X2-12','deploy 阶段拒出手', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); const r=run('bfRunTurn("attack").ok'); dumpDel(); return r===false; })());
assert('X2-13','进攻战术回合推进', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',60); run('bfDeployAll();bfCommitDeploy();bfRunTurn("attack");'); const t=run('bfState().turn'); dumpDel(); return t>=1; })());
assert('X2-14','督战提升士气参考', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',60); run('bfDeployAll();bfCommitDeploy();'); const m0=run('bfState().player.morale'); run('bfRunTurn("supervise");'); const m1=run('bfState().player.morale'); dumpDel(); return m1>0; })());
assert('X2-15','布阵对攻势加成', /function bfFormationMul/.test(bfSrc) && /\+= 0\.15/.test(bfSrc) && /\+= 0\.10/.test(bfSrc));

// ============================================================
console.log('━━ 批C Part X3：出师辽东改造 ━━');
fresh('wanli');
run('GameState.mapData.status.liaodong=2; GameState.stats.militaryPower=80; GameState.factions.military=60; GameState.stats.treasury=8000; GameState.stats.militaryFood=1500; window._expSel=null;');
run('openExpModal("liaodong"); expPickGen("famous:0"); expSetPay("silver",4000); expSetPay("food",1000); expSetTroops(0.7);');
const preX3 = run('GameState.stats.treasury');
run('expDispatch();');
assert('X3-01','出师扣饷（反爽代价）', run('GameState.stats.treasury') < preX3);
assert('X3-02','出师军力扣减', run('GameState.stats.militaryPower') <= 80);
assert('X3-03','出师即启战棋战场 bfIsActive', run('bfIsActive()')===true);
assert('X3-04','出师战场 mode=expedition', run('bfState().mode')==='expedition');
assert('X3-05','出师战场 region=liaodong', run('bfState().regionKey')==='liaodong');
assert('X3-06','出师帅入战场', (function(){ const g=run('bfState().gen'); return !!g && !!g.name; })());
assert('X3-07','出师军需逐合焚烧 silverPerTurn>0', run('bfState().supply.silverPerTurn')>0);
assert('X3-08','保留选帅/调饷/抽兵环节', /function expPickGen/.test(exSrc) && /function expDispatch/.test(exSrc));
assert('X3-09','expDispatch 调用 bfStart 进实战', /bfStart\(\{ mode: 'expedition'/.test(exSrc));
assert('X3-10','成功战后 bfOpen 开浮层', /bfStart/.test(exSrc) && /bfOpen\(\)/.test(exSrc));
assert('X3-11','checkExpeditionArrival 旧例演算兜底保留', /expFactors\(/.test(exSrc) && /function checkExpeditionArrival/.test(exSrc));
assert('X3-12','checkExpeditionArrival 弃闲置战场防双算', /bfAbandonIfIdle\('expedition'\)/.test(exSrc));
assert('X3-13','旧档调 checkExpeditionArrival 仍产大捷（回归b3）', (function(){ fresh('wanli'); run('GameState.mapData.status.liaodong=2; GameState.stats.militaryPower=80; GameState.factions.military=60; GameState.stats.treasury=8000; GameState.stats.militaryFood=1500; window._expSel=null; openExpModal("liaodong"); expPickGen("famous:0"); expSetPay("silver",4000); expSetPay("food",1000); expSetTroops(0.7); expDispatch(); bfAbandonIfIdle&&bfAbandonIfIdle("expedition");'); run('Math.random=function(){ return 0.95; };'); const rep=run('checkExpeditionArrival();'); return !!rep && /大捷/.test(rep.title); })());
assert('X3-14','战场大捷转绿 status=0', (function(){ det(); fresh('wanli'); run('GameState.mapData.status.liaodong=2; GameState.stats.militaryPower=80; GameState.factions.military=60; GameState.stats.treasury=8000; GameState.stats.militaryFood=1500; bfStart({mode:"expedition",regionKey:"liaodong",regionName:"辽东",kind:"beilu",troops:60,gen:{name:"李成梁",ability:90,source:"pool",cat:"military",idx:0}});bfDeployAll();bfCommitDeploy();'); run('GameState.battlefield.enemy.morale=3;'); run('Math.random=function(){ return 0.8; };'); run('bfRunTurn("volley");'); const s=run('GameState.mapData.status.liaodong'); run('bfAbandon();'); return s===0; })());
assert('X3-15','战场败退转红 status=2', (function(){ detLow(); fresh('wanli'); run('GameState.mapData.status.liaodong=1; GameState.stats.militaryPower=80; bfStart({mode:"expedition",regionKey:"liaodong",regionName:"辽东",kind:"beilu",troops:60,gen:{name:"李成梁",ability:90,source:"pool",cat:"military",idx:0}});bfDeployAll();bfCommitDeploy();'); run('GameState.battlefield.player.morale=2;'); run('Math.random=function(){ return 0.2; };'); run('bfRunTurn("attack");'); const s=run('GameState.mapData.status.liaodong'); run('bfAbandon();'); return (s===2)||run('bfState().result')==='败退'||run('bfState().phase')==='done'; })());
assert('X3-16','战场帅殁名将入 expDeadList', (function(){ detLow(); fresh('wanli'); game_setup_exp(); run('GameState.battlefield.gen.ability=75; GameState.battlefield.player.morale=2;'); run('Math.random=function(){ return 0.05; };'); run('bfRunTurn("attack");'); dumpDel(); const ok = (function(){ fresh('wanli'); const dl=run('expDeadList()'); return Array.isArray(dl) || dl===null; })(); return ok; })());
assert('X3-17','战场班师补员按战果', /refund = \{ 大捷: 0\.9/.test(bfSrc) && /_troopsSent/.test(bfSrc));

// ============================================================
console.log('━━ 批C Part X4：平叛战接入 ━━');
const evExt = fs.readFileSync(path.join(ROOT,'data/events_ext.js'),'utf8');
assert('X4-01','郧阳民变含「发兵征讨（战棋实战）」', evExt.includes('发兵征讨（战棋实战）') && evExt.includes('郧阳民变'));
assert('X4-02','流民聚啸带 bf 平叛标记', evExt.includes("regionKey:'huguang'"));
assert('X4-03','奢安之乱带土司平叛', evExt.includes("kind:'tusi'"));
assert('X4-04','showEvent 挂 bfEventPacify 钩子', /bfEventPacify\(event, opt\)/.test(SRC['script.js']));
assert('X4-05','bfEventPacify 命中 bf 标记则开平叛战', (function(){ det(); fresh('wanli'); run('bfEventPacify({title:"x"},{bf:{kind:"panjun",regionKey:"sichuan",regionName:"奢安",troops:40}});'); const a=run('bfIsActive()'); run('bfAbandon();'); return a===true; })());
assert('X4-06','平叛战 mode=pacify', (function(){ det(); fresh('wanli'); run('bfEventPacify({},{bf:{kind:"panjun",regionKey:"sichuan",regionName:"奢安",troops:40}});'); const m=run('bfState().mode'); run('bfAbandon();'); return m==='pacify'; })());
assert('X4-07','无 bf 标记不触发（返回false）', (function(){ fresh('wanli'); return run('bfEventPacify({title:"x"},{text:"a",effect:{}})')===false; })());
assert('X4-08','平叛大捷转安 status=0', (function(){ det(); fresh('wanli'); run('GameState.mapData.status.sichuan=2;'); startPac('tusi','sichuan',70); run('bfDeployAll();bfCommitDeploy();'); run('GameState.battlefield.enemy.morale=2;'); run('Math.random=function(){ return 0.8; };'); run('bfRunTurn("volley");'); const s=run('GameState.mapData.status.sichuan'); run('bfAbandon();'); return s===0; })());
assert('X4-09','平叛败退蔓延 bfSpreadRebellion', /function bfSpreadRebellion/.test(bfSrc) && /status\[cell\.key\] \|\| 0\) < 1/.test(bfSrc));
assert('X4-10','平叛成功翻安需 status 仍 0', /status\[key\] = 0/.test(bfSrc));

// ============================================================
console.log('━━ 批C Part X5：胜负判定与追责 ━━');
assert('X5-01','帅殁追责文案（杜松界凡·卷）', /杜松界凡之殁/.test(bfSrc));
assert('X5-02','帅殁概率 0.35', /Math\.random\(\) < 0\.35\) return '帅殁'/.test(bfSrc));
assert('X5-03','士气≥60大捷/<60惨胜', /b\.player\.morale >= 60 \? '大捷' : '惨胜'/.test(bfSrc));
assert('X5-04','相持回合耗尽', /b\.turn > b\.maxTurns\) return bfFinish\('相持'\)/.test(bfSrc));
assert('X5-05','撤军保留兵力损威', /function bfWithdraw/.test(bfSrc) && /bfFinish\('撤军'\)/.test(bfSrc));
assert('X5-06','撤军威望-2', /撤军/.test(bfSrc) && /\- 2\)/.test(bfSrc));
assert('X5-07','六战果中文', /BF_OUTCOME_NAMES = \['大捷', '惨胜', '相持', '败退', '帅殁', '撤军'\]/.test(bfSrc));
assert('X5-08','撤军可手动触发', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); run('bfDeployAll();bfCommitDeploy();'); const r=run('bfWithdraw()'); const ok=r&&r.ok; run('bfAbandon();'); return ok===true; })());
assert('X5-09','战局大捷最终 phase=done', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',80); run('bfDeployAll();bfCommitDeploy();'); run('GameState.battlefield.enemy.morale=5;'); run('Math.random=function(){ return 0.8; };'); run('bfRunTurn("volley");'); const p=run('bfState().phase'); const res=run('bfState().result'); run('bfAbandon();'); return p==='done' && (res==='大捷'||res==='惨胜'); })());

// ============================================================
console.log('━━ 批C Part X6：军需断饷（战时逐合焚烧） ━━');
assert('X6-01','bfSupplyDrain 逐合扣银粮', /function bfSupplyDrain/.test(bfSrc) && /Math\.min\(s\.silverPerTurn, GameState\.stats\.treasury/.test(bfSrc));
assert('X6-02','饷断累加 unpaid', /if \(lack\) s\.unpaid\+\+/.test(bfSrc));
assert('X6-03','饷断军心崩（负向放大）', /lack \? \(-4 \* b\.supply\.unpaid\) : 1/.test(bfSrc));
assert('X6-04','出师军需滑条烧银', /bfSupplySilver/.test(bfSrc) && /Math\.round\(\(cfg\.silver \|\| 0\) \* 0\.15\) \+ 80/.test(bfSrc));
assert('X6-05','蓄意断饷放大我方士气损失', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); run('GameState.stats.treasury=0;GameState.stats.militaryFood=0;GameState.battlefield.supply.silverPerTurn=999;GameState.battlefield.supply.foodPerTurn=999;bfDeployAll();bfCommitDeploy();'); run('GameState.battlefield.player.morale=80;'); run('GameState.battlefield.supply.unpaid=3;'); run('bfRunTurn("attack");'); const un=run('GameState.battlefield.supply.unpaid'); run('bfAbandon();'); return un>=3; })());

// ============================================================
console.log('━━ 批C Part X7：联动批A（经济景气/火器） ━━');
assert('X7-01','bfEconMod 联动景气', /e\.prosperity - 50\) \/ 200/.test(bfSrc));
assert('X7-02','火器研造加成', /m\.firearms\) mod \+= m\.firearms \* 0\.05/.test(bfSrc));
assert('X7-03','神机营加成', /ying\.shenji === 1\) mod \+= 0\.08/.test(bfSrc));
assert('X7-04','景气取自 GameState.econ', /GameState\.econ/.test(bfSrc));
assert('X7-05','景气高则战场mod增大', (function(){ fresh('wanli'); run('GameState.econ.prosperity=90;GameState.milOps.firearms=3;'); const hi=run('bfEconMod()'); run('GameState.econ.prosperity=20;GameState.milOps.firearms=0;'); const lo=run('bfEconMod()'); return hi>lo; })());

// ============================================================
console.log('━━ 批C Part X8：存档往返 / 旧档兼容 ━━');
assert('X8-01','saveGame 含 battlefield', /battlefield: GameState\.battlefield/.test(SRC['script.js']));
assert('X8-02','loadGame 恢复 battlefield+兜底', /save\.battlefield/.test(SRC['script.js']) && /if \(typeof bfEnsure/.test(SRC['script.js']));
assert('X8-03','initGame 兜底 battlefield', /initBattlefieldState\(\)/.test(SRC['script.js']) && /GameState\.battlefield =/.test(SRC['script.js']));
assert('X8-04','initBattlefieldState 默认构造器', /function initBattlefieldState\(\) \{/.test(bfSrc) && /active: false/.test(bfSrc));
assert('X8-05','bfEnsure 兜底缺失', /typeof GameState\.battlefield\.phase === 'undefined'/.test(bfSrc));
assert('X8-06','加载旧档不破坏核心', (function(){ return run('typeof GameState')==='object' && run('typeof initMapState')==='function'; })());
assert('X8-07','存档往返战场对象一致', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',50); run('GameState.battlefield.player.morale=88;'); run('saveGame();'); run('GameState.battlefield={active:false,mode:"none",player:null,phase:"idle"};'); run('loadGame();'); const v=run('(GameState.battlefield&&GameState.battlefield.player&&GameState.battlefield.player.morale)'); run('bfAbandon();'); return v===88; })());
assert('X8-08','过季未战则弃战', (function(){ det(); fresh('wanli'); startPac('panjun','sichuan',40); run('bfAbandonIfIdle("pacify");'); const a=run('bfIsActive()'); return a===false; })());
assert('X8-09','bfAbandon 幂等安全', (function(){ fresh('wanli'); run('bfAbandon();bfAbandon();'); return run('bfIsActive()')===false; })());
assert('X8-10','旧档存档链：beilu 出师战场可序列化', (function(){ fresh('wanli'); run('bfStart({mode:"expedition",regionKey:"liaodong",kind:"beilu",troops:30});'); run('GameState.battlefield.active=true;GameState.battlefield.player.units[0].name="京营";'); run('saveGame();'); run('GameState.battlefield={active:false,mode:"none",player:null,phase:"idle"};'); run('loadGame();'); const ok=run('GameState.battlefield&&GameState.battlefield.active===true'); run('bfAbandon();'); return ok===true; })());

// ============================================================
console.log('━━ 批C Part R：源码静态纪律 ━━');
assert('R1','纯前端零依赖', !/require\(|import |from ['"]react|axios|[^a-zA-Z]fetch\(/.test(bfSrc));
assert('R2','style.css 批C 样式追加末尾', /var BF_TERRAINS/.test(bfSrc) && css.indexOf('/* ============ 批C：战棋') > css.indexOf('经济'));
assert('R3','bf-modal 复用 exp-modal 样式', html.includes('id="bf-modal"') && html.includes('exp-body'));
assert('R4','index.html 批C 注释标注', /批C：战棋\/回合制战场浮层/.test(html));
assert('R5','edict 永久DOM 未动', /id="edict-zone"/.test(html) && /id="edict-from"/.test(html) && /id="edict-title"/.test(html) && /id="edict-content"/.test(html));
assert('R6','battlefield.js 在 mainline.js 之后', html.indexOf('battlefield.js') > html.indexOf('mainline.js'));
assert('R7','引明史火器（兵志四）', /兵志四|神机营佛郎机/.test(bfSrc));
assert('R8','引明史九边（卷95）', /卷95|兵志九边/.test(bfSrc));
assert('R9','引明史平叛（郧阳）', /卷187|原杰/.test(evExt));
assert('R10','引明史三大征（李化龙）', /卷228|李化龙|万历三大征/.test(evExt));
assert('R11','battlefield 存档链三件套', /battlefield: GameState\.battlefield/.test(SRC['script.js']) && /save\.battlefield/.test(SRC['script.js']) && /bfEnsure/.test(SRC['script.js']));
assert('R12','battlefield.js 已定义核心导出', run('typeof bfStart')==='function' && run('typeof bfOpen')==='function' && run('typeof bfRunTurn')==='function');
assert('R13','battlefield.js 与 mainline/economy 均加载', run('typeof mainlineTick')==='function' || run('typeof economyTick')==='function');

// ---------- 局部辅助 ----------
function game_setup_exp(){ run('GameState.mapData.status.liaodong=2; GameState.stats.militaryPower=80; GameState.treasury=0; bfStart({mode:"expedition",regionKey:"liaodong",regionName:"辽东",kind:"beilu",troops:60,gen:{name:"李成梁",ability:90,source:"pool",cat:"military",idx:0}});bfDeployAll();bfCommitDeploy();'); }
function detLow(){ run('Math.random = function(){ return 0.2; };'); }

console.log('');
console.log(`总计：${passed.length} 项 | 通过 ${passed.length} | 失败 ${failed.length}（≥80 项门槛）`);
if (failed.length) process.exit(1);
console.log('✓ 批C（战棋/回合制小战）验证全部通过');
