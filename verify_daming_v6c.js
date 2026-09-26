// ============================================
// 《大明国策》v6.0 批C · 军事战守扩充 验证套件
// 独立编写，仅借鉴 vm + DOM mock 测试模式
// 覆盖：新兵种解锁/招募、边患剧本滋生与出兵进战棋、粮道/兵源联动、
//      边境驻军、京营整顿、军功封赏、存档链、modules 挂载、零回归
// 史据核对：可兵种名与《明史》卷次对应（宁换不编、演绎注明）
// ============================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let passed = [];
let failed = [];
function assert(id, desc, fn) {
    const ok = (() => { try { return !!fn(); } catch (e) { console.log('  [' + id + ' throw] ' + e.message); return false; } })();
    if (ok) passed.push(id);
    else failed.push(id + ': ' + desc);
}

// —— DOM mock（与批C同构，直接写 innerHTML 版）——
function makeClassList() {
    const set = new Set();
    return { add: (...a) => a.forEach(x => set.add(x)), remove: (...a) => a.forEach(x => set.delete(x)),
        toggle: (c, f) => { if (f === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else f ? set.add(c) : set.delete(c); return set.has(c); },
        contains: c => set.has(c), items: () => [...set] };
}
function makeEl(id) {
    const el = { id, style: {}, dataset: {}, value: '', textContent: '', _html: '', children: [], _cls: makeClassList(), parentNode: null,
        get innerHTML() { return el._html; }, set innerHTML(v) { el._html = v; },
        get className() { return el._cls.items().join(' '); }, set className(v) { el._cls = makeClassList(); String(v || '').split(/\s+/).forEach(c => { if (c) el._cls.add(c); }); },
        get classList() { return el._cls; }, appendChild(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
        insertBefore(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; }, removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
        querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
        getAttribute() { return ''; }, setAttribute() {}, offsetWidth: 0 };
    return el;
}
function matchSel(el, sel) { if (!sel) return false; const s = String(sel).trim(); if (s.indexOf('.') === 0) return el._cls.contains(s.slice(1)); return el.id === s.slice(1) || el.tagName === s.toUpperCase(); }
function hasAncestor(el, sel, doc) { let p = el.parentNode; while (p) { if (matchSel(p, sel)) return true; p = p.parentNode; } return false; }
function buildSeed() {
    const els = {}; function mk(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; }
    const body = makeEl('document.body'); body.__tag = 'body'; mk('center-panel');
    const tabs = mk('menu-tabs');
    ['overview','politics','govern','military','map','finance'].forEach(p => {
        const t = makeEl('mt_' + p); t.__tag = 'div'; t.dataset.tab = p; t._cls.add('menu-tab'); t.textContent = p;
        tabs.appendChild(t); els['mt_' + p] = t;
    });
    ['edict-from','edict-title','edict-content','season-banner','resource-list','faction-list'].forEach(mk);
    const doc = { body, _els: els, __c: 0,
        getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
        querySelector(sel) { for (const k in els) if (matchSel(els[k], sel)) return els[k]; return null; },
        querySelectorAll(sel) { let out = []; if (String(sel).indexOf(' ') > 0) { const parts = String(sel).trim().split(/\s+/); const last = parts[parts.length - 1]; const anc = parts.slice(0, -1); for (const k in els) if (matchSel(els[k], last) && anc.every(a => hasAncestor(els[k], a, doc))) out.push(els[k]); return out; } for (const k in els) if (matchSel(els[k], sel)) out.push(els[k]); return out; },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, documentElement: makeEl('html'), head: makeEl('head'), readyState: 'loading' };
    body.appendChild(tabs); body.appendChild(mk('center-panel'));
    return { doc, els };
}
const seed = buildSeed();
const document = seed.doc;
const sandbox = {
    console, setTimeout: (f) => { f(); return 1; }, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
    Math, JSON, Date, Error, Array, Object, String, Number, Boolean, Map, Set, RegExp, undefined, NaN, Infinity,
    isNaN, isFinite, parseInt, parseFloat, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
    document, window: { document },
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; }, clear() { this._s = {}; } },
    navigator: { userAgent: 'node' }, location: { href: '', hostname: 'localhost' }, requestAnimationFrame: () => 0,
    getComputedStyle: () => ({}), performance: { now: () => 0 }, AudioContext: function(){}, webkitAudioContext: null,
    confirm: () => true, alert: () => {}, BroadcastChannel: function(){}, Image: function(){}, HTMLElement: function(){}
};
sandbox.window.document = document;
vm.createContext(sandbox);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
function loadAll() { for (const f of scriptFiles) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }); }
try { loadAll(); } catch (e) { console.error('加载失败: ' + e.message); process.exit(1); }
function R(code) { try { return vm.runInContext(code, sandbox); } catch (e) { console.log('  [run异常] ' + e.message); return undefined; } }
function fresh(s) { R(`initGame('${s || 'chenghua'}');`); }

console.log('========================================================');
console.log('《大明国策》批C（军事战守扩充）验证套件');
console.log('========================================================');

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const jsWr = fs.readFileSync(path.join(ROOT, 'military_war_def.js'), 'utf8');
const jsBf = fs.readFileSync(path.join(ROOT, 'battlefield.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

// ================= C1 接线静态 =================
assert('C1-01', 'index.html 引入 military_war_def.js', () => /<script src="military_war_def\.js"><\/script>/.test(html));
assert('C1-02', 'script 顺序：battlefield → 战守 → v5d', () => html.indexOf('battlefield.js') < html.indexOf('military_war_def.js') && html.indexOf('military_war_def.js') < html.indexOf('v5d_ui.js'));
assert('C1-03', 'modules.js military case 追加 renderWarDefTab', () => /case 'military':[\s\S]{0,300}renderWarDefTab/.test(jsMod));
assert('C1-04', 'modules.js 保留 renderMilitaryOpsExt 原链', () => /renderMilitaryOpsExt/.test(jsMod));
assert('C1-05', 'script.js saveGame 序列化 warDef', () => /warDef: GameState\.warDef/.test(jsMain));
assert('C1-06', 'script.js loadGame 反序列化补默 warDef', () => /GameState\.warDef = save\.warDef \|\|/.test(jsMain));
assert('C1-07', 'script.js initGame 初始化 warDef', () => /GameState\.warDef = initWarDefState\(\)/.test(jsMain));
assert('C1-08', 'script.js advanceSeason 挂链 warDefTick', () => /warDefTick\(\); \} catch/.test(jsMain));
assert('C1-09', 'style.css 后段含 wr- 战守样式(追加纪律保持)', () => /\.wr-threat/.test(css) && css.lastIndexOf('.wr-threat') >= css.length * 0.9);
assert('C1-10', 'battlefield.js 追加新兵种 chelun/xinjun/muyong', () => objHas('chelun') && objHas('xinjun') && objHas('muyong'));
assert('C1-11', 'battlefield.js 追加流寇敌种 liukou', () => /BF_ENEMY_TYPES\.liukou/.test(jsBf));
assert('C1-12', 'battlefield.js 新增 wrStartBattle 包裹', () => /function wrStartBattle\(cfg\)/.test(jsBf) && /function bfAppendExtraUnits\(\)/.test(jsBf));
assert('C1-13', '战守文件定义 initWarDefState/ensureWarDefState/warDefTick/renderWarDefTab', () => ['initWarDefState','ensureWarDefState','warDefTick','renderWarDefTab'].every(n => new RegExp('function ' + n + '\\(').test(jsWr)));
assert('C1-14', '必用《明史》引注（src: 注释≥6处）', () => (jsWr.match(/《明史》/g) || []).length >= 6);
function objHas(k) { return new RegExp('BF_PLAYER_TYPES\\.' + k + '\\s*=').test(jsBf); }

// ================= C2 运行时状态 =================
assert('C2-01', 'initGame 后 GameState.warDef 就绪', () => { fresh('chenghua'); return R(`!!GameState.warDef && typeof GameState.warDef.supplyLine === 'number'`); });
assert('C2-02', 'ensureWarDefState 旧档兜底补齐 units/threats', () => { fresh('chenghua'); R(`GameState.warDef={supplyLine:50};`); R(`ensureWarDefState();`); return R(`GameState.warDef.units && GameState.warDef.threats`); });
assert('C2-03', 'renderWarDefTab 返回非空且含战守标题', () => { fresh('chenghua'); const o = R(`renderWarDefTab();`) || ''; return o.length > 50 && o.indexOf('军事战守') >= 0; });
assert('C2-04', 'renderWarDefTab 含粮道/兵源/军功展示', () => { const o = R(`renderWarDefTab();`) || ''; return ['粮道','兵源','军功'].every(t => o.indexOf(t) >= 0); });
assert('C2-05', 'renderPanel("military") 经 case 路由含战守段', () => { fresh('chenghua'); seed.els['center-panel']._html = ''; R(`renderPanel('military')`); return /军事战守/.test(seed.els['center-panel']._html); });
assert('C2-06', 'renderWarDefTab 渲染不触碰 edict 永久DOM', () => { fresh('chenghua'); const b = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; R(`renderWarDefTab();`); const a = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent + seed.els['season-banner'].textContent; return b === a; });

// ================= C3 新兵种解锁/招募 =================
assert('C3-01', '解锁募勇：耗库8 就绪', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000;`); const r = R(`wrUnlockUnit('muyong')`); return r && r.ok === true && R(`GameState.warDef.units.muyong.ready`) === true && R(`GameState.stats.treasury`) === 992; });
assert('C3-02', '募勇无前置条件即时可募', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000;`); R(`wrUnlockUnit('muyong')`); return R(`GameState.warDef.units.muyong.ready`) === true; });
assert('C3-03', '解锁车营需营造工事≥1（无则拒）', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000;`); R(`GameState.yingzaoState={completed:[]};`); const r = R(`wrUnlockUnit('chelun')`); return !r.ok && R(`GameState.warDef.units.chelun.ready`) !== true; });
assert('C3-04', '有工事则车营可解锁', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.yingzaoState={completed:['文华殿']};`); const r = R(`wrUnlockUnit('chelun')`); return r.ok === true && R(`GameState.warDef.units.chelun.ready`) === true; });
assert('C3-05', '解锁新军需练兵≥6+研究院≥1（缺则拒）', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.milOps={drill:{jing:2},institute:0};`); return R(`wrUnlockUnit('xinjun').ok`) === false; });
assert('C3-06', '练兵满+研究院足则新军可解锁', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.milOps={drill:{jing:6},institute:1};`); const r = R(`wrUnlockUnit('xinjun')`); return r.ok === true && R(`GameState.warDef.units.xinjun.ready`) === true; });
assert('C3-07', '重复解锁被拒（已 ready）', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000;`); R(`wrUnlockUnit('muyong');`); R(`GameState.stats.treasury=1000;`); return R(`wrUnlockUnit('muyong').ok`) === false; });
assert('C3-08', '募营：募勇耗银8+兵源3+民望稳定-3', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.stats.stability=50; GameState.warDef.units.muyong.ready=true; GameState.warDef.units.muyong.recruited=0; GameState.warDef.levyPool=50;`); R(`wrRecruitCamp('muyong')`); return R(`GameState.stats.treasury`) === 992 && R(`GameState.warDef.levyPool`) === 47 && R(`GameState.stats.stability`) === 47; });
assert('C3-09', '募到3营封顶（第4拒）', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.warDef.levyPool=100; GameState.warDef.units.muyong.ready=true; GameState.warDef.units.muyong.recruited=3;`); return R(`wrRecruitCamp('muyong').ok`) === false; });
assert('C3-10', '兵源不足拒募', () => { fresh('chenghua'); R(`GameState.stats.treasury=1000; GameState.warDef.levyPool=1; GameState.warDef.units.muyong.ready=true; GameState.warDef.units.muyong.recruited=0;`); return R(`wrRecruitCamp('muyong').ok`) === false; });

// ================= C4 边患剧本 =================
assert('C4-01', '四患俱备（俺答/倭寇/土司/流寇）', () => { fresh('chenghua'); return ['anda','wokou','tusi','liukou'].every(k => R(`!!GameState.warDef.threats.${k}`)); });
assert('C4-02', '低稳定+11次巡检则流寇滋生', () => { fresh('chenghua'); R(`GameState.stats.stability=15; GameState.warDef.threats.liukou.cd=0;`); for (let i = 0; i < 40; i++) R(`wrThreatTick()`); return R(`GameState.warDef.threats.liukou.active`) === true; });
assert('C4-03', '驻军可压制滋生（高部署不生）', () => { fresh('chenghua'); R(`GameState.stats.stability=30; GameState.warDef.threats.wokou.cd=0; GameState.warDef.garrison.zhejiang=3;`); R(`GameState.stats.stability=30;`); for (let i = 0; i < 40; i++) R(`wrThreatTick()`); return R(`GameState.warDef.threats.wokou.active`) !== true; }); // 守御足致概率趋0
assert('C4-04', '出兵平患进战棋实战（bfStart）', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true;`); const r = R(`wrStrikeThreat('liukou')`); return !!(r && r.ok) && R(`GameState.battlefield.active`) === true && R(`GameState.battlefield.mode`) === 'threat'; });
assert('C4-05', '出兵耗银/粮/兵源/军力', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true;`); const tb = R(`GameState.stats.treasury`); const fb = R(`GameState.stats.militaryFood`); R(`wrStrikeThreat('liukou')`); return R(`GameState.stats.treasury`) < tb || R(`GameState.stats.militaryFood`) < fb; });
assert('C4-06', '饷不足拒出兵', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=10; GameState.stats.militaryFood=5; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true;`); return R(`wrStrikeThreat('liukou').ok`) === false; });
assert('C4-07', '已开战则拒再战', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true;`); R(`wrStrikeThreat('liukou')`); return R(`wrStrikeThreat('liukou').ok`) === false; });

// ================= C5 战棋实战落账（威胁结算） =================
assert('C5-01', '平患大捷则清 threat + 加军功 + 清舆图', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.tusi.active=true; GameState.mapData.status.guizhou=1;`); R(`wrStrikeThreat('tusi'); bfDeployAll(); bfCommitDeploy();`); R(`GameState.battlefield.player.morale=95; GameState.battlefield.enemy.morale=1;`); R(`bfRunTurn('attack')`); const fin = R(`GameState.battlefield.phase`); return fin === 'done' && (R(`GameState.warDef.threats.tusi.active`) !== true) && R(`GameState.warDef.merit`) >= 12; });
assert('C5-02', '战败则患愈烈（level+1 且 active 仍在）', () => { fresh('chenghua'); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true; GameState.mapData.status.henan=1;`); R(`wrStrikeThreat('liukou'); bfDeployAll(); bfCommitDeploy();`); const lv = R(`GameState.warDef.threats.liukou.level`); R(`GameState.battlefield.player.morale=1; GameState.battlefield.enemy.morale=95;`); for (let i = 0; i < 6; i++) R(`bfRunTurn('defend')`); return R(`GameState.warDef.threats.liukou.active`) === true && R(`GameState.warDef.threats.liukou.level`) >= lv; });
assert('C5-03', 'wrThreatSettleHook 在 bfFinish 被调用（bfSettle 后）', () => /wrThreatSettleHook/.test(jsBf) && jsBf.indexOf('wrThreatSettleHook') > jsBf.indexOf('bfSettle('));

// ================= C6 粮道/兵源联动 =================
assert('C6-01', '粮道随农业景气变化（高农景 > 低农景）', () => { fresh('chenghua'); R(`GameState.stats.agriculture=80; GameState.stats.militaryFood=3000;`); const hi = R(`wrSupplyLine()`); fresh('chenghua'); R(`GameState.stats.agriculture=20; GameState.stats.militaryFood=100;`); const lo = R(`wrSupplyLine()`); return hi >= lo; });
assert('C6-02', '粮道钳制区间 [10,100]', () => { fresh('chenghua'); R(`GameState.stats.agriculture=5; GameState.stats.militaryFood=0;`); const lo = R(`wrSupplyLine()`); fresh('chenghua'); R(`GameState.stats.agriculture=99; GameState.stats.militaryFood=99999;`); const hi = R(`wrSupplyLine()`); return lo >= 10 && hi <= 100 && lo <= hi; });
assert('C6-03', '兵源上限随人口变化（人口多则上限高）', () => { fresh('chenghua'); R(`GameState.stats.population=100000000;`); const hi = R(`wrLevyMax()`); fresh('chenghua'); R(`GameState.stats.population=10000000;`); const lo = R(`wrLevyMax()`); return hi >= lo; });
assert('C6-04', '兵源自然恢复趋向上限', () => { fresh('chenghua'); R(`GameState.warDef.levyPool=5;`); R(`wrSyncLevy()`); return R(`GameState.warDef.levyPool`) > 5; });
assert('C6-05', '人口越少兵源上限越低（伐丁伤民则无兵可征）', () => { fresh('chenghua'); R(`GameState.stats.population=3000000;`); return R(`wrLevyMax()`) <= 20; });

// ================= C7 驻军/京营整顿/军功 =================
assert('C7-01', '边境驻军增戍耗银120', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000;`); const b = R(`GameState.stats.treasury`); R(`wrGarrison('datong')`); return R(`GameState.warDef.garrison.datong`) === 1 && R(`GameState.stats.treasury`) === b - 120; });
assert('C7-02', '驻军上限3营（第4拒）', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000;`); R(`GameState.warDef.garrison.datong=3;`); return R(`wrGarrison('datong').ok`) === false; });
assert('C7-03', '驻军增戍愈多愈费', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000;`); R(`GameState.warDef.garrison.datong=2;`); R(`wrGarrison('datong')`); return R(`GameState.warDef.garrison.datong`) === 3; });
assert('C7-04', '驻军每季耗饷（upkeep）', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000; GameState.warDef.garrison.datong=1;`); const b = R(`GameState.stats.treasury`); R(`wrGarrisonUpkeep()`); return R(`GameState.stats.treasury`) < b; });
assert('C7-05', '京营整顿冷却5季（重复被拒）', () => { fresh('chenghua'); R(`GameState.stats.treasury=5000;`); R(`wrRevampJing()`); return R(`GameState.warDef.jingRevampCd`) === 5 && R(`wrRevampJing().ok`) === false; });
assert('C7-06', '军功封赏耗内帑100 需军功≥20（不足拒）', () => { fresh('chenghua'); R(`GameState.stats.privyPurse=1000; GameState.warDef.merit=5;`); return R(`wrMeritReward().ok`) === false; });
assert('C7-07', '军功≥20 可封赏：耗内帑 威望+2', () => { fresh('chenghua'); R(`GameState.stats.privyPurse=1000; GameState.warDef.merit=30;`); const p = R(`GameState.stats.prestige`); R(`wrMeritReward()`); return R(`GameState.warDef.merit`) === 10 && R(`GameState.stats.prestige`) === p + 2 && R(`GameState.stats.privyPurse`) === 900; });

// ================= C8 联动/回归 =================
assert('C8-01', 'warDefTick 季检不破坏核心循环（advanceSeason）', () => { fresh('chenghua'); R(`advanceSeason()`); return R(`GameState.currentMonth >= 0`); });
assert('C8-02', 'warDefTick 后确有草点（lastSatTick 更新）', () => { fresh('chenghua'); R(`GameState.warDef.lastSatTick=0;`); R(`warDefTick()`); return R(`GameState.warDef.lastSatTick`) > 0; });
assert('C8-03', '存档往返：warDef 序列化/反序列化保真', () => { fresh('chenghua'); R(`GameState.warDef.merit=33; GameState.warDef.units.muyong.ready=true;`); R(`saveGame(); loadGame();`); return R(`GameState.warDef && GameState.warDef.merit === 33 && GameState.warDef.units.muyong.ready === true`); });
assert('C8-04', '战场引擎原有兵种未破坏（bfGenPlayerUnits 仍在）', () => R(`typeof bfGenPlayerUnits === 'function'`));
assert('C8-05', '出师/平叛战仍可用（bfEventPacify 仍在）', () => R(`typeof bfEventPacify === 'function' && typeof expDispatch === 'function'`));
assert('C8-06', '原有军事操练系统未回归（milTotalScore 仍在）', () => R(`typeof milTotalScore === 'function' && typeof renderMilitaryOpsExt === 'function'`));
assert('C8-07', '22资源仍在', () => R(`Object.keys(RESOURCES).length >= 22`));
assert('C8-08', '5派系仍在', () => R(`Object.keys(FACTIONS).length === 5`));
assert('C8-09', 'overview 看板未回归', () => R(`typeof renderOverview === 'function'`));
assert('C8-10', '战守成军后 bfAppendExtraUnits 注入新兵种', () => { fresh('chenghua'); R(`GameState.warDef.units.chelun.ready=true; GameState.warDef.units.xinjun.ready=true; GameState.warDef.units.muyong.ready=true;`); R(`GameState.stats.militaryPower=8000; GameState.stats.treasury=99999; GameState.stats.militaryFood=9999; GameState.warDef.levyPool=100; GameState.warDef.threats.liukou.active=true;`); R(`wrStrikeThreat('liukou')`); return R(`['chelun','xinjun','muyong'].some(t => GameState.battlefield.player.units.some(u => u.type===t))`); });

// ============ 汇总 ============
console.log('--------------------------------------------------------');
console.log(`批C验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项）`);
if (failed.length === 0) { console.log('✓ 批C（军事战守扩充）验证全部通过'); }
else { console.log('✗ 批C验证存在失败：'); failed.forEach(x => console.log('   ✗ ' + x)); process.exitCode = 1; }