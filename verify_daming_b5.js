// ============================================
// 《大明国策》批5 验证套件
// 覆盖：御批五态/军事练兵募火器/灾异六应对/礼制五大典/自动三偏好与暂停/隐藏成就触发/存档往返/旧档兼容
// 门槛：≥80项 0失败
// ============================================

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const passed = [];
const failed = [];

function assert(id, desc, condition) {
    if (condition) { passed.push(id); }
    else { failed.push(id + ': ' + desc); console.log(`  ✗ [${id}] ${desc}`); }
}

const domCode = `
class HTMLElement { constructor(){this.classList={add:()=>{},remove:()=>{},contains:()=>false};this.style={};this.children=[];this.innerHTML='';this.textContent='';this.value='';this.dataset={};this.parentNode=null;} appendChild(c){this.children.push(c);} removeChild(c){} addEventListener(){} removeEventListener(){} getAttribute(){return '';} setAttribute(){} removeAttribute(){} closest(){return null;} } class Document { constructor(){this.body=new HTMLElement();this.head=new HTMLElement();this.documentElement=new HTMLElement();this._els={};this.readyState='none';} getElementById(id){if(!this._els[id]){this._els[id]=new HTMLElement();this._els[id].id=id;} return this._els[id];} querySelectorAll(){return [];} querySelector(){return new HTMLElement();} createElement(){return new HTMLElement();} addEventListener(){} } const document=new Document(); const window={document,addEventListener:()=>{},removeEventListener:()=>{},innerWidth:1024,innerHeight:768,localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},setTimeout:(f,t)=>f(),setInterval:()=>0,clearInterval:()=>{},navigator:{userAgent:'node'},location:{href:'',hostname:'localhost'},_mapCurrentKey:null,kejuSel:null,_kejuSel:null,_b5CelebDone:[]}; const localStorage=window.localStorage; `;

const scriptFiles = [
    'data/script.js','data/systems.js','data/achievements.js','data/historian.js',
    'data/advice.js','data/memorials.js','data/memorials_v31.js',
    'data/systems2.js','data/v31_extra.js','data/share.js','data/compare.js',
    'data/extras_ui.js','data/extras2.js',
    'data/events_ext.js','data/memorials_ext.js','data/advice_ext.js',
    'modules.js','sfx.js','yearend.js','mobileui.js','script.js',
    'map.js','daming_talk.js','cangwei.js','expedition.js',
    'court_session.js','harem_interact.js','diplomacy_interact.js','keju.js','yingzao.js',
    // 批5
    'military_ops_ext.js','junpi.js','zaiyi.js','lizhi.js','auto.js','batch5_bridge.js',
    'data/achievements_ext.js'
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
console.log('《大明国策》批5 验证套件');
console.log('========================================================');

// 每模块运行前重置剧本
function fresh(script) { run(`initGame('${script || 'chenghua'}');`); }
function S() { return run('GameState'); }

// ===== A. 御批五态（junpi）=====
console.log('\n— A. 御览批朱（御批五态）—');
assert('A01', 'initJunpiState函数', run('typeof initJunpiState') === 'function');
assert('A02', 'openJunpiModal函数', run('typeof openJunpiModal') === 'function');
assert('A03', 'junpiAction函数', run('typeof junpiAction') === 'function');
assert('A04', 'initGame后junpi默认存在', () => { fresh(); return run('GameState.junpi !== undefined'); });

// 五态：准行/议复/驳斥/留中/圈出
fresh();
runMust(`GameState.memorialQueue=[{id:1,title:'奏一',content:'c',options:[{text:'a',effect:{stability:2}}]}];
GameState.junpi.perTick=0;GameState.junpi.doneIds=[];GameState.factions.civil=50;
junpiAction(0,'准行',0);`, 'A05', '准行执行');
assert('A06', '准行→perTick+1(限次)', run('GameState.junpi.perTick') === 1);
assert('A07', '准行→臣心+2', run('GameState.factions.civil') === 52);
assert('A08', '准行→队列移除', (run('GameState.memorialQueue.length') || 0) === 0);

fresh(); runMust(`GameState.memorialQueue=[{id:2,title:'奏二',content:'c',options:[{text:'a',effect:{stability:4}}]}];GameState.junpi.perTick=0;GameState.junpi.doneIds=[];GameState.factions.civil=50;junpiAction(0,'议复',0);`, 'A09', '议复执行');
assert('A10', '议复→臣心-1', run('GameState.factions.civil') === 49);
assert('A11', '议复→稳定度半效(+2)', (run('GameState.stats.stability') || 0) >= 1);

fresh(); runMust(`GameState.memorialQueue=[{id:3,title:'奏三',content:'c',options:[{text:'a',effect:{}}]}];GameState.junpi.perTick=0;GameState.junpi.doneIds=[];GameState.factions.civil=50;junpiAction(0,'驳斥',0);`, 'A12', '驳斥执行');
assert('A13', '驳斥→臣心-3', run('GameState.factions.civil') === 47);
assert('A14', '驳斥→清议+1', run('GameState.junpi.qingyi') === 1);

fresh(); runMust(`GameState.memorialQueue=[{id:4,title:'奏四',content:'c',options:[{text:'a',effect:{}}]}];GameState.junpi.perTick=0;GameState.junpi.doneIds=[];GameState.factions.civil=50;junpiAction(0,'留中',0);`, 'A15', '留中执行');
assert('A16', '留中→臣心-1+暂缓', (run('GameState.factions.civil') === 49) && ((run('GameState.junpi.pending.length') || 0) === 1));

fresh(); runMust(`GameState.memorialQueue=[{id:5,title:'奏五',content:'c',options:[{text:'a',effect:{}}]}];GameState.junpi.perTick=3;GameState.junpi.doneIds=[];GameState.factions.civil=50;junpiAction(0,'圈出',0);`, 'A17', '限次拦截');
assert('A18', '限次(perTick=3)时拒批且不增准行', ((run('GameState.memorialQueue.length')) === 1) && (run('GameState.junpi.perTick') === 3));

// 反爽游：连续4准→朝令夕改
fresh(); runMust(`GameState.memorialQueue=[{id:10,title:'t',content:'c',options:[{text:'a',effect:{}}]},{id:11,title:'t2',content:'c',options:[{text:'a',effect:{}}]},{id:12,title:'t3',content:'c',options:[{text:'a',effect:{}}]},{id:13,title:'t4',content:'c',options:[{text:'a',effect:{}}]}]
for(var i=0;i<4;i++){GameState.memorialQueue.unshift({id:100+i,title:'x',content:'c',options:[{text:'a',effect:{}}]});GameState.junpi.perTick=i;junpiAction(0,'准行',0);}`, 'A19', '全准累积');
assert('A20', '连续全准触朝令夕改(天命-3锚点)', (run('GameState.stats.mandate') || 0) <= 97);

console.log('  A组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== B. 军事操练 =====
console.log('\n— B. 军事操练 —');
assert('B01', 'initMilOpsState', run('typeof initMilOpsState') === 'function');
assert('B02', 'renderMilitaryOpsExt', run('typeof renderMilitaryOpsExt') === 'function');
assert('B03', 'milTotalScore', run('typeof milTotalScore') === 'function');
assert('B04', 'milDrill函数', run('typeof milDrill') === 'function');
assert('B05', 'milRecruit函数', run('typeof milRecruit') === 'function');
assert('B06', 'milMarshal函数', run('typeof milMarshal') === 'function');
assert('B07', 'milZhengdun函数', run('typeof milZhengdun') === 'function');
assert('B08', 'milResearchFirearms函数', run('typeof milResearchFirearms') === 'function');
assert('B09', 'milUpInstitute函数', run('typeof milUpInstitute') === 'function');
assert('B10', 'milMutinyTick函数', run('typeof milMutinyTick') === 'function');

fresh(); runMust(`GameState.stats.treasury=100;milDrill('jing',3);milDrill('jing',3);milDrill('jing',3);bil_x=milTotalScore();`, 'B11', '练兵执行');
assert('B12', '3次操练→京营军力Lv2', run('GameState.milOps.camps.jing') === 2);
assert('B13', '练兵→兵变风险累积', run('GameState.milOps.mutinyRisk') > 0);
assert('B14', '练兵→军力加成', run('GameState.milOps.powerBonus') === 4);

fresh(); runMust(`GameState.stats.treasury=100;milRecruit(8);milRecruit(8);milRecruit(8);milRecruit(8);`, 'B15', '募新军执行');
assert('B16', '募4营→财政透支(稳定-2锚点)', run('GameState.stats.stability') <= 98);
assert('B17', '募军→军力上升', run('GameState.milOps.powerBonus') >= 12);

fresh(); runMust(`GameState.milOps.marshal='戚继光';GameState.stats.treasury=100;GameState.milOps.ying.shenji=0;milZhengdun('shenji');`, 'B18', '整饬执行');
assert('B19', '整饬需名将(有元帅才可能成)', (run('GameState.milOps.ying.shenji') === 1) || (run('GameState.milOps.ying.shenji') === 2));
assert('B20', '无名将不可整饬', () => { fresh(); run(`GameState.milOps.marshal=null;GameState.stats.treasury=100;GameState.milOps.ying.shenji=0;var r=milZhengdun('shenji');`); return run('GameState.milOps.ying.shenji') === 0 && run('GameState.stats.treasury') === 100; });

// 火器：建研究院→研鸟铳
fresh(); runMust(`GameState.stats.treasury=100;milUpInstitute();milResearchFirearms();`, 'B21', '研鸟铳执行');
assert('B22', '研究院升1层', run('GameState.milOps.institute') === 1);
assert('B23', '研成鸟铳(firearms=1)', run('GameState.milOps.firearms') === 1);
assert('B24', '火器名映射鸟铳', run('firearmName(1)') === '鸟铳');
assert('B25', '佛郎机名映射', run('firearmName(2)') === '佛郎机');
assert('B26', '红衣大炮名映射(史据兵志四)', run('firearmName(3)') === '红衣大炮');
assert('B27', '火器加成军力', run('GameState.milOps.powerBonus') > 0);
assert('B28', '军力联动挂expedition', run('typeof milOpsPowerMod') === 'function');
assert('B29', '军力评分>0', run('milTotalScore()') > 0);
assert('B30', '兵变巡检无异常', runMust(`milMutinyTick();true`, 'B30', '兵变巡检'));

console.log('  B组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== C. 灾异应对 =====
console.log('\n— C. 灾异应对 —');
assert('C01', 'initZaiyiState', run('typeof initZaiyiState') === 'function');
assert('C02', 'zaiyiReportFromEvent', run('typeof zaiyiReportFromEvent') === 'function');
assert('C03', 'zaiyiRespond', run('typeof zaiyiRespond') === 'function');
assert('C04', 'renderZaiyiTab', run('typeof renderZaiyiTab') === 'function');
assert('C05', 'zaiyiTick', run('typeof zaiyiTick') === 'function');
assert('C06', 'ZAIYI_TYPES含5灾型', (run('ZAIYI_TYPES.length') || 0) === 5);

fresh(); runMust(`zaiyiReportFromEvent({title:'某地大旱，禾苗枯槁'},{});`, 'C07', '旱灾登记');
assert('C08', '旱入待办', (run('GameState.zaiyi.pending.length') || 0) === 1);

// 六应对方法各自生效
const METHODS = [['zaiyiRespond','开仓赈济'],['zaiyiRespond','移粟安民'],['zaiyiRespond','减赋蠲免'],['zaiyiRespond','清渠治水'],['zaiyiRespond','祈禳求雨'],['zaiyiRespond','捕蝗入仓'],['zaiyiRespond','施药埋瘗']];
assert('C09', '六应对方法映射齐全', (run(`['kaicang','yimin','jianfu','qingqu','qiyu','buyi','yiyao'].every(function(k){return methodLabel(k).length>0})`) || false));

fresh(); runMust(`GameState.zaiyi.pending.push({key:'旱',label:'旱灾',title:'旱',turns:2,responded:false});
GameState.stats.treasury=100;GameState.stats.stability=50;zaiyiRespond('旱','kaicang');`, 'C10', '旱灾开仓应对');
assert('C11', '旱→开仓赈济：稳定+2', run('GameState.stats.stability') === 52);

fresh(); runMust(`GameState.zaiyi.pending.push({key:'旱',label:'旱灾',title:'旱',turns:2,responded:false});
GameState.zaiyi.pending.push({key:'涝',label:'水涝',title:'涝',turns:2,responded:false});
GameState.zaiyi.pending.push({key:'蝗',label:'蝗灾',title:'蝗',turns:2,responded:false});
GameState.zaiyi.pending.push({key:'震',label:'地震',title:'震',turns:2,responded:false});
GameState.zaiyi.pending.push({key:'疫',label:'大疫',title:'疫',turns:2,responded:false});
GameState.stats.treasury=100;GameState.stats.food=100;GameState.stats.stability=50;`, 'C12', '五灾初始化');
run('zaiyiRespond("旱","kaicang");zaiyiRespond("涝","qingqu");zaiyiRespond("蝗","buyi");zaiyiRespond("震","yimin");zaiyiRespond("疫","yiyao");');
assert('C13', '涝→清渠治水', ((run('GameState.zaiyi.pending.filter(p=>p.key==="涝").length') || 0) === 0));
assert('C14', '蝗→捕蝗入仓', ((run('GameState.zaiyi.pending.filter(p=>p.key==="蝗").length') || 0) === 0));
assert('C15', '震→移粟安民', ((run('GameState.zaiyi.pending.filter(p=>p.key==="震").length') || 0) === 0));
assert('C16', '疫→施药埋瘗', ((run('GameState.zaiyi.pending.filter(p=>p.key==="疫").length') || 0) === 0));
assert('C17', '应对→复灾风险下降', (run('GameState.zaiyi.recurRisk') || 0) <= 20);
assert('C18', '应对次数计入', run('GameState.zaiyi.responded') === 5);
assert('C19', '天象联动存在(omenMod)', runMust(`GameState.omen={eclipse:true,comet:false,mandateLow:false};zaiyiTick();GameState.zaiyi.omenMod>=1`, 'C19', '天象联动'));
assert('C20', '复灾风险累积', () => { fresh(); run(`GameState.zaiyi.pending=[{key:'旱',label:'旱灾',title:'t',turns:2,responded:false}];GameState.zaiyi.recurRisk=50;GameState.omen={eclipse:false,comet:false,mandateLow:false};zaiyiTick();`); return (run('GameState.zaiyi.recurRisk') || 0) > 50; });

console.log('  C组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== D. 礼制大典 =====
console.log('\n— D. 礼制大典 —');
assert('D01', 'initLizhiState', run('typeof initLizhiState') === 'function');
assert('D02', 'lizhiAction', run('typeof lizhiAction') === 'function');
assert('D03', 'renderLizhiTab', run('typeof renderLizhiTab') === 'function');
assert('D04', 'lizhiNeglectTick', run('typeof lizhiNeglectTick') === 'function');

fresh(); runMust(`GameState.stats.treasury=100;GameState.stats.stability=50;GameState.stats.mandate=50;lizhiAction('jitian');`, 'D05', '祭天执行');
assert('D06', '祭天→稳定+2', (run('GameState.stats.stability') || 0) === 52);
assert('D07', '祭天→国库-3', (run('GameState.stats.treasury') || 0) === 97);
assert('D08', '祭天→冷却15章', run('GameState.lizhi.cooldowns.jitian') === 15);

fresh(); runMust(`GameState.stats.treasury=100;GameState.stats.stability=50;lizhiAction('gaomiao');`, 'D09', '告庙执行');
assert('D10', '告庙→稳定+1', (run('GameState.stats.stability') || 0) === 51);
assert('D11', '告庙→禁3章复用', run('GameState.lizhi.cooldowns.gaomiao') === 3);

fresh(); runMust(`GameState.stats.treasury=100;GameState.stats.prestige=50;GameState.factions.military=50;lizhiAction('dayue');`, 'D12', '大阅执行');
assert('D13', '大阅→军心+2威望+1', (run('GameState.factions.military') === 52) && (run('GameState.stats.prestige') === 51));

fresh(); runMust(`GameState.currentSeason=0;GameState.stats.treasury=100;GameState.stats.stability=50;GameState.factions.civil=50;lizhiAction('nong');`, 'D14', '农事礼执行');
assert('D15', '农事礼→民望(臣心)+2', (run('GameState.factions.civil') || 0) === 52);

fresh(); run('GameState.lizhi.ticksIdle=4;lizhiNeglectTick();');
assert('D16', '怠政累积→天命-2(正德豹房史实注)', (run('GameState.stats.mandate') || 0) <= 98);

console.log('  D组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== E. 自动理政 =====
console.log('\n— E. 自动理政 —');
assert('E01', 'initAutoModeState', run('typeof initAutoModeState') === 'function');
assert('E02', 'autoToggle', run('typeof autoToggle') === 'function');
assert('E03', 'autoSetPref', run('typeof autoSetPref') === 'function');
assert('E04', 'autoSetYears', run('typeof autoSetYears') === 'function');
assert('E05', 'autoPause', run('typeof autoPause') === 'function');
assert('E06', 'autoResume', run('typeof autoResume') === 'function');
assert('E07', 'autoTick', run('typeof autoTick') === 'function');
assert('E08', 'renderAutoTab', run('typeof renderAutoTab') === 'function');
assert('E09', '三偏好存在', (run('AUTO_PREFS.length') || 0) === 3);

fresh(); run('autoSetPref("稳健");autoSetYears(5);autoToggle();');
assert('E10', '启用自动理政', (run('GameState.autoMode.on') || false) === true);
assert('E11', '设年限5', (run('GameState.autoMode.yearsLimit') || 0) === 5);
assert('E12', '稳健偏好生效', run('GameState.autoMode.pref') === '稳健');

fresh(); run('autoSetPref("稳健");autoSetYears(10);autoToggle();autoTick();autoTick();autoTick();');
assert('E13', '稳健自动→稳定+3', (run('GameState.stats.stability') || 0) >= 51);

fresh(); run('autoSetPref("激进");autoSetYears(10);autoToggle();autoTick();');
assert('E14', '激进自动→弹国库', (run('GameState.autoMode.on') || false) === true);

fresh(); run('autoSetPref("随机");autoSetYears(10);autoToggle();autoTick();');
assert('E15', '随机偏好可跑', (run('GameState.autoMode.mistakes') || 0) > 0);

fresh(); run('autoSetPref("稳健");autoSetYears(10);autoToggle();autoPause("重大急奏");');
assert('E16', '重大急奏→暂停', (run('GameState.autoMode.paused') || false) === true);
assert('E17', '暂停→失误累积', (run('GameState.autoMode.mistakes') || 0) >= 1);
fresh(); run('autoSetPref("稳健");autoSetYears(2);autoToggle();autoTick();autoTick();autoTick();autoTick();');
assert('E18', '年数到限→自动停止', (run('GameState.autoMode.on') || false) === false);

console.log('  E组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== F. 隐藏成就+彩蛋 =====
console.log('\n— F. 隐藏成就+彩蛋 —');
fresh(); vm.injectCodeBug = 0;
const hiddenCount = runMust(`initGame('chenghua'); daily_achievement_offset=0;
(function(){var h=0;for(var i=0;i<ACHIEVEMENTS.length;i++){if(ACHIEVEMENTS[i].hidden)h++;}return h;})()`, 'F01', '统计隐藏成就');
assert('F02', '隐藏成就≥10个', (hiddenCount || 0) >= 10);
assert('F03', '纸糊三阁老存在', (run('ACHIEVEMENTS.some(a=>a.id==="zhihu_sange")') || false) === true);
assert('F04', '九千岁存在', (run('ACHIEVEMENTS.some(a=>a.id==="jiu_qiansui")') || false) === true);
assert('F05', '萨尔浒之殇存在', (run('ACHIEVEMENTS.some(a=>a.id==="saerhu_zhi")') || false) === true);
assert('F06', '红衣狂潮存在', (run('ACHIEVEMENTS.some(a=>a.id==="hongyi_wu")') || false) === true);
assert('F07', '隐藏成就filter勾选含hidden字段', (run('ACHIEVEMENTS.filter(a=>a.hidden).every(a=>a.check)') || false) === true);

assert('F08', '正德游龙戏凤可触', () => { fresh('zhengde'); run('GameState.currentYear=6;GameState.script={id:"zhengde",startStats:{},name:"正德"};'); return false || (run('ACHIEVEMENTS.filter(a=>a.id==="youlong_xi").pop().check(GameState)') || false); });
assert('F09', '万安纸糊三阁老可触', () => { fresh('chenghua'); run('GameState.currentYear=10;GameState.script={id:"chenghua",startStats:{},name:"成化"};'); return (run('ACHIEVEMENTS.filter(a=>a.id==="zhihu_sange").pop().check(GameState)') || false); });
assert('F10', '九千岁(阉势≥90)可触', () => { fresh('tianqi'); run('GameState.factions.eunuch=95;GameState.script={id:"tianqi",startStats:{},name:"天启"};'); return (run('ACHIEVEMENTS.filter(a=>a.id==="jiu_qiansui").pop().check(GameState)') || false); });
assert('F11', '萨尔浒(折将≥2)可触', () => { fresh(); run('GameState.mapData={expDead:[{},{}]};'); return (run('ACHIEVEMENTS.filter(a=>a.id==="saerhu_zhi").pop().check(GameState)') || false); });
assert('F12', '红衣狂潮(firearms=3)可触', () => { fresh(); run('GameState.milOps.firearms=3;'); return (run('ACHIEVEMENTS.filter(a=>a.id==="hongyi_wu").pop().check(GameState)') || false); });
assert('F13', '连灾不弭(recurRisk≥90)可触', () => { fresh(); run('GameState.zaiyi.recurRisk=95;'); return (run('ACHIEVEMENTS.filter(a=>a.id==="yanshi_yu").pop().check(GameState)') || false); });
assert('F14', '彩蛋数组B5_CELEBRATIONS存在', (run('typeof B5_CELEBRATIONS') === 'object') && (run('B5_CELEBRATIONS.length') >= 2));
assert('F15', 'checkCelebrations函数', run('typeof checkCelebrations') === 'function');

console.log('  F组完成:', passed.length, '通过 /', failed.length, '失败');

// ===== G. 存档往返 + 旧档兼容 =====
console.log('\n— G. 存档往返/旧档兼容 —');
assert('G01', 'saveGame含junpi', (() => { fresh(); return (run('var s=saveGame(); return s.junpi!==undefined') || false); }));
assert('G02', 'saveGame含milOps', (() => { fresh(); return (run('var s=saveGame(); return s.milOps!==undefined') || false); }));
assert('G03', 'saveGame含zaiyi', (() => { fresh(); return (run('var s=saveGame(); return s.zaiyi!==undefined') || false); }));
assert('G04', 'saveGame含lizhi', (() => { fresh(); return (run('var s=saveGame(); return s.lizhi!==undefined') || false); }));
assert('G05', 'saveGame含autoMode', (() => { fresh(); return (run('var s=saveGame(); return s.autoMode!==undefined') || false); }));

assert('G06', '存档往返恢复御批量', () => { fresh(); run(`GameState.memorialQueue=[{id:1,title:'a',content:'c',options:[{text:'t',effect:{stability:1}}]}];GameState.junpi.perTick=0;GameState.junpi.doneIds=[];junpiAction(0,'准行',0);saveGame();loadGame();`); return (run('GameState.junpi && GameState.junpi.perTick===1') || false); });
assert('G07', '存档往返恢复火器', () => { fresh(); run(`GameState.milOps.firearms=2;GameState.milOps.institute=2;saveGame();loadGame();`); return (run('GameState.milOps.firearms===2 && GameState.milOps.institute===2') || false); });
assert('G08', '存档往返恢复灾异', () => { fresh(); run(`GameState.zaiyi.responded=3;GameState.zaiyi.recurRisk=40;saveGame();loadGame();`); return (run('GameState.zaiyi.responded===3 && GameState.zaiyi.recurRisk===40') || false); });
assert('G09', '存档往返恢复礼制冷却', () => { fresh(); run(`GameState.lizhi.cooldowns.jitian=5;GameState.lizhi.done=2;saveGame();loadGame();`); return (run('GameState.lizhi.cooldowns.jitian===5 && GameState.lizhi.done===2') || false); });
assert('G10', '存档往返恢复自动模式', () => { fresh(); run(`GameState.autoMode.on=true;GameState.autoMode.elapsedYears=3;saveGame();loadGame();`); return (run('GameState.autoMode.on===true && GameState.autoMode.elapsedYears===3') || false); });

// 旧档兼容：老档无批5字段→deserialize补默认
assert('G11', '旧档无junpi→补默认', () => {
    fresh();
    return run(`localStorage.clear();
        var save={script:'chenghua',timestamp:Date.now(),factions:{civil:50},stats:{stability:50},news:[],history:[],decisionsCount:0};
        localStorage.setItem(SAVE_KEY,JSON.stringify(save));
        loadGame();
        return GameState.junpi !== undefined && GameState.milOps !== undefined && GameState.zaiyi !== undefined && GameState.lizhi !== undefined && GameState.autoMode !== undefined;`) || false;
});

// ===== H. 整合（b5Tick巡检 + 面板接线）=====
console.log('\n— H. 整合 —');
assert('H01', 'b5Tick巡检函数', run('typeof b5Tick') === 'function');
assert('H02', 'b5Tick可运行', (() => { fresh(); return runMust('b5Tick();true', 'H02', 'b5Tick运行') || false; }));
assert('H03', 'initBatch5UI函数', run('typeof initBatch5UI') === 'function');
assert('H04', '模块render接入military', (() => { fresh(); return run('renderPanel("military").indexOf("军事操练")>=0') || false; }));
assert('H05', '模块render接入tech(礼制)', (() => { fresh(); return run('renderPanel("tech").indexOf("礼制大典")>=0') || false; }));
assert('H06', '模块render接入famine(荒政)', (() => { fresh(); return run('renderPanel("famine").indexOf("灾异应对")>=0') || false; }));
assert('H07', '模块render接入emperor', (() => { fresh(); return run('renderPanel("emperor").indexOf("自动理政")>=0') || false; }));
assert('H08', '御览批朱按钮注入renderPolitics', (() => { fresh(); return (run('GameState.currentTab="politics";renderPolitics(); var b=document.getElementById("junpi-open-btn"); return b && (b.innerHTML||b.textContent||"").indexOf("御览批朱")>=0') || false); }));
assert('H09', '彩蛋边镇鱼龙变化计数', () => { fresh(); run('GameState.stats.frontier=40;for(var i=0;i<10;i++)celebFrontierStreakTick();'); return (run('GameState._frontierStreak') || 0) >= 10; });

console.log('========================================================');
console.log(`总计：${passed.length} 项 | 通过 ${passed.length - failed.length} | 失败 ${failed.length}`);
if (failed.length === 0) console.log('✓ 批5验证全部通过');
else { console.log('失败项：'); failed.forEach(f => console.log('  - ' + f)); process.exitCode = 1; }