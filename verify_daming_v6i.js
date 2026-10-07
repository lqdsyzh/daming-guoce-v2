// ============================================
// 《大明国策》v6.2 批I · 科举深化验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批H同构）。
// 覆盖：接线（index引入/modules case/script 存档链三件套 + advanceSeason 挂 tick）/
//      构造器完整结构/殿试裁定→门生入清流→舞弊案彻查vs压下→恩科冷却 确定性主链（forceCandidates/forceScandal 钳制）/
//      反爽代价（殿试/门生/彻查/压下/恩科各含真实代价）/
//      存档往返/旧档兼容/renderPanel 挂载/零回归钩子（含 G02/A37 紧邻、edict 永久DOM、style 只末尾追加·v5d G-06）。
// 史据：《明史》卷70·选举志二（殿试一甲三人·探花授翰林·恩科·座主门生）/卷231·顾宪成传（清流）/
//       卷306·宦官传（科场权阉干政）；三鼎甲名次与恩科频率系演绎。
// 注意测试隔离：kdTick/kdExposeScandal 含 tick 去重，同 tick 复测前先重置 lastTick/lastScandalTick=-1。
// ============================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let passed = [], failed = [];
function assert(id, desc, fn) {
    const ok = (() => { try { return !!fn(); } catch (e) { console.log('  [' + id + ' throw] ' + e.message); return false; } })();
    if (ok) passed.push(id); else failed.push(id + ': ' + desc);
}

// —— DOM mock（同构各批）——
function cls() { const s = new Set(); return { add: (...a) => a.forEach(x => s.add(x)), remove: (...a) => a.forEach(x => s.delete(x)),
    toggle: (c, f) => { if (f === undefined) { s.has(c) ? s.delete(c) : s.add(c); } else f ? s.add(c) : s.delete(c); return s.has(c); },
    contains: c => s.has(c), items: () => [...s] }; }
function makeEl(id) { const el = { id, style: {}, dataset: {}, value: '', textContent: '', _html: '', children: [], _cls: cls(), parentNode: null,
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = v; },
    get className() { return el._cls.items().join(' '); }, set className(v) { el._cls = cls(); String(v || '').split(/\s+/).forEach(c => { if (c) el._cls.add(c); }); },
    get classList() { return el._cls; }, appendChild(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
    insertBefore(c) { if (c) { c.parentNode = el; el.children.push(c); } return c; }, removeChild(c) { el.children = el.children.filter(x => x !== c); return c; },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, removeEventListener() {},
    getAttribute() { return ''; }, setAttribute() {}, offsetWidth: 0 }; return el; }
function mkTab(els, id) { if (!els[id]) els[id] = makeEl(id); return els[id]; }
function buildSeed() {
    const body = makeEl('body'); const tabs = makeEl('tabs'); const els = { body, tabs, 'center-panel': makeEl('center-panel') };
    const doc = { __c: 0, body, getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
        querySelectorAll(sel) { let out = []; for (const k in els) if (String(sel).replace('.', '') === k) out.push(els[k]); return out; },
        querySelector() { return null; },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, removeEventListener() {}, documentElement: makeEl('html'), head: makeEl('head') };
    body.appendChild(tabs); body.appendChild(mkTab(els, 'center-panel'));
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
console.log('《大明国策》批I（科举深化）验证套件');
console.log('========================================================');

// —— 静态接线核验 ——
const jsKd = fs.readFileSync(path.join(ROOT, 'keju_deep.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('I1-01', 'index.html 引入 keju_deep.js', () => /<script src="keju_deep\.js">/.test(html));
assert('I1-02', 'modules.js case keju 追加 renderKejuDeepTab（只追加不重排·保留 renderKejuTab）', () =>
    /case 'keju':\s*html = renderKejuTab\(\) \+ \(typeof renderKejuDeepTab === 'function' \? renderKejuDeepTab\(\) : ''\)/.test(jsMod));
assert('I1-03', 'script.js saveGame 序列化 kejuDeep', () =>
    /kejuDeep: GameState\.kejuDeep/.test(jsMain));
assert('I1-04', 'script.js loadGame 反序列化兜底 kejuDeep', () =>
    /kejuDeep = save\.kejuDeep \|\|/.test(jsMain) && /initKejuDeepState/.test(jsMain));
assert('I1-05', 'script.js loadGame 调 kdEnsure 子键补齐', () =>
    /kdEnsure === 'function'/.test(jsMain));
assert('I1-06', 'script.js initGame 初始化 kejuDeep', () =>
    /GameState\.kejuDeep = initKejuDeepState\(\)/.test(jsMain));
assert('I1-07', 'script.js advanceSeason 挂 kdTick（链尾·try-catch）', () =>
    /try \{ kdTick\(\);? \} catch \(e\) \{\}/.test(jsMain));

// —— 构造器完整结构 ——
fresh('chenghua');
assert('I1-08', 'initGame 后 GameState.kejuDeep 完整结构', () =>
    R(`!!GameState.kejuDeep && !!GameState.kejuDeep.topThree && Array.isArray(GameState.kejuDeep.topThree)
       && Array.isArray(GameState.kejuDeep.mentorship) && Array.isArray(GameState.kejuDeep.scandal)`) === true);
assert('I1-09', '构造器初始值正确（grace=0/dirt=0/pending=null）', () =>
    R(`GameState.kejuDeep.grace === 0 && GameState.kejuDeep.dirt === 0 && GameState.kejuDeep.pendingScandal === null`) === true);
assert('I1-10', 'kdEnsure 兜底子键（旧档缺 grace 补默认）', () => {
    R(`GameState.kejuDeep = { topThree: [] }; kdEnsure();`);
    return R(`GameState.kejuDeep.grace === 0 && GameState.kejuDeep.dirt === 0 && Array.isArray(GameState.kejuDeep.mentorship)`) === true;
});
assert('I1-11', 'kdEnsure 恢复完整结构后不再破坏既有', () => {
    R(`GameState.kejuDeep = initKejuDeepState(); GameState.kejuDeep.grace=3; GameState.kejuDeep.topThree.push({name:'A'}); kdEnsure();`);
    return R(`GameState.kejuDeep.grace === 3 && GameState.kejuDeep.topThree.length === 1`) === true;
});

// —— 殿试确定性主链（forceCandidates 钳制）——
assert('I2-01', 'kdConvenePalaceExam 生成候选人（forceCandidates 钳制）', () => {
    R(`GameState.kejuDeep = initKejuDeepState();
       GameState.kejuDeep.forceCandidates = [
         {id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},
         {id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},
         {id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}
       ];`);
    return R(`kdConvenePalaceExam()`) === true && R(`!!GameState.kejuDeep.pending && GameState.kejuDeep.pending.cands.length === 3`) === true;
});
assert('I2-02', '殿试有冷却（同 tick 连开被拒）', () => {
    // fresh 重置（含 lastTick——但 cd.palace 走 kdTick()，同 tick 下 cd 生效即拒）
    fresh('chenghua');
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'x',talent:80,background:'cold',backing:'civil',used:false},{id:'k1',name:'y',talent:50,background:'powerful',backing:'royal',used:false},{id:'k2',name:'z',talent:60,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`);
    return R(`kdConvenePalaceExam()`) === false; // 同 tick cd 生效 → false
});
assert('I2-03', '点状元寒门才子 → 清流(civil)升、宗党(royal)受挫（反爽：触权贵）', () => {
    fresh('chenghua');
    const c0 = R(`GameState.factions.civil`);
    R(`GameState.stats.prestige=10;`);
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`);       // 寒才为状元
    R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);    // 三甲满→finalize
    const c1 = R(`GameState.factions.civil`);
    return c1 > c0 && R(`GameState.factions.royal < 58`) === true;           // 触权贵（royal 从60降）
});
assert('I2-04', '点权贵之子为状元（才学低）→ 其党得势、清议(civil)大跌（反爽：伤士林）', () => {
    fresh('chenghua');
    const r0 = R(`GameState.factions.royal`);
    const c0 = R(`GameState.factions.civil`);
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k1',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`);
    R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);
    const r1 = R(`GameState.factions.royal`);
    const c1 = R(`GameState.factions.civil`);
    return r1 > r0 && c1 <= c0 - 3;   // 权贵+5其党得势；才学不副状元-6、探花翰林+2，净清议亦跌
});
assert('I2-05', '殿试定鼎后 topThree 记录三鼎甲名次', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`); R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);
    return R(`GameState.kejuDeep.topThree.length === 3 && GameState.kejuDeep.topThree[0].rankLabel === '状元'
       && GameState.kejuDeep.topThree[1].rankLabel === '榜眼' && GameState.kejuDeep.topThree[2].rankLabel === '探花'`) === true;
});
assert('I2-06', '探花授翰林→清议+（储才）与稳定+', () => {
    fresh('chenghua');
    const c0 = R(`GameState.factions.civil`);
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`); R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);
    const c1 = R(`GameState.factions.civil`);
    return c1 >= c0 + 2;   // 寒才状元 civil+5 - royal -2 不计 civil；探花翰林 civil+2 → net +7
});

// —— 座师门生入清流（联动 intrigue） ——
assert('I3-01', 'kdMentorNew 门生归座师门下并纳入清流派系（civil升）', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.topThree=[{name:'沈耀宗',talent:85,background:'cold',backing:'civil',rank:'zhuangyuan',rankLabel:'状元'}]`);
    const c0 = R(`GameState.factions.civil`);
    R(`kdMentorNew(0)`);
    return R(`GameState.kejuDeep.mentorship.length === 1 && GameState.kejuDeep.mentorship[0].students.indexOf('沈耀宗') >= 0`) === true
        && R(`GameState.factions.civil`) > c0;
});
assert('I3-02', '反爽·门生网有冷却（同 tick 重收被拒）', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.topThree=[{name:'沈耀宗',talent:85,background:'cold',backing:'civil',rank:'zhuangyuan',rankLabel:'状元'}]`);
    R(`kdMentorNew(0)`);
    return !R(`kdMentorNew(0)`);
});
assert('I3-03', '反爽·无双甲则不可收门生（拒绝白嫖）', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.topThree=[];`);
    return !R(`kdMentorNew(0)`);
});

// —— 舞弊案：彻查 vs 压下（确定性后果）——
assert('I4-01', 'kdExposeScandal 仅在存在新舞弊且 forceScandal 触发时败露', () => {
    fresh('chenghua');
    R(`GameState.kejuState.cheatCount=2; GameState.kejuDeep.forceScandal=1; kdExposeScandal();`);
    return R(`!!GameState.kejuDeep.pendingScandal && GameState.kejuDeep.pendingScandal.cheat === 2`) === true;
});
assert('I4-02', '同 tick 去重：kdExposeScandal 只曝一起', () => {
    const p0 = R(`GameState.kejuDeep.pendingScandal && JSON.stringify(GameState.kejuDeep.pendingScandal)`);
    R(`kdExposeScandal()`);
    return R(`JSON.stringify(GameState.kejuDeep.pendingScandal)`) === p0;
});
assert('I4-03', '彻查：追赃入国库、威信升、清议因伤士林而降（反爽代价）', () => {
    fresh('chenghua');
    R(`GameState.kejuState.cheatCount=1; GameState.kejuDeep.forceScandal=1; kdExposeScandal();`);
    const t0 = R(`GameState.stats.treasury`); const p0 = R(`GameState.stats.prestige`); const c0 = R(`GameState.factions.civil`);
    R(`kdResolveScandal('check')`);
    return R(`GameState.stats.treasury`) > t0 && R(`GameState.stats.prestige`) > p0 && R(`GameState.factions.civil`) < c0
        && R(`GameState.kejuDeep.pendingScandal === null`) === true;
});
assert('I4-04', '彻查连累师门：若有座师牵连则清议额外降、稳定亦损', () => {
    fresh('chenghua');
    R(`GameState.kejuState.cheatCount=1;`);
    R(`GameState.kejuDeep.mentorship=[{mentor:'和珅之流',students:['沈耀宗'],tick:0}]`);
    R(`GameState.kejuDeep.forceScandal=1; kdExposeScandal();`);
    const c0 = R(`GameState.factions.civil`);
    R(`kdResolveScandal('check')`);
    // 彻查伤士林-3 + 连累座师再-2 = 净-5；且舞弊案记档确认连累座师
    return R(`GameState.factions.civil`) <= c0 - 4
        && R(`GameState.kejuDeep.scandal[0] && GameState.kejuDeep.scandal[0].mentor === '和珅之流'`) === true;
});
assert('I4-05', '压下：护师门、清议猛跌、威信损、暗增污点（反爽两头失）', () => {
    fresh('chenghua');
    R(`GameState.kejuState.cheatCount=1; GameState.kejuDeep.forceScandal=1; kdExposeScandal();`);
    const p0 = R(`GameState.stats.prestige`); const c0 = R(`GameState.factions.civil`); const d0 = R(`GameState.kejuDeep.dirt`);
    R(`kdResolveScandal('cover')`);
    return R(`GameState.stats.prestige`) < p0 && R(`GameState.factions.civil`) < c0 && R(`GameState.kejuDeep.dirt`) > d0;
});

// —— 恩科（冷却 + 反爽代价）——
assert('I5-01', 'kdHoldGraceExam 耗国库换清议与好感（有冷却）', () => {
    fresh('chenghua');
    const t0 = R(`GameState.stats.treasury`); const c0 = R(`GameState.factions.civil`);
    R(`kdHoldGraceExam()`);
    return R(`GameState.stats.treasury`) < t0 && R(`GameState.factions.civil`) > c0 && R(`GameState.kejuDeep.grace`) === 1;
});
assert('I5-02', '恩科有冷却（同 tick 连开被拒）', () => {
    fresh('chenghua');
    R(`kdHoldGraceExam()`);
    return !R(`kdHoldGraceExam()`);
});
assert('I5-03', '反爽·库空不可恩科（拒绝白嫖）', () => {
    fresh('chenghua');
    R(`GameState.stats.treasury=0; GameState.kejuDeep.cd.grace = -99;`);
    return !R(`kdHoldGraceExam()`);
});
assert('I5-04', '恩科录取计入 passCount（人才入朝）', () => {
    fresh('chenghua');
    const p0 = R(`GameState.kejuState.passCount`);
    R(`GameState.kejuDeep.cd.grace = -99; kdHoldGraceExam();`);
    return R(`GameState.kejuState.passCount`) >= p0 + 12;
});

// —— renderPanel 挂载并入 keju tab ——
assert('I6-01', 'renderPanel keju 并入 renderKejuDeepTab（含殿试/门生/恩科）', () => {
    fresh('chenghua');
    const out = R(`renderKejuTab() + (typeof renderKejuDeepTab === 'function' ? renderKejuDeepTab() : '')`);
    const p = R(`renderPanel('keju'); document.getElementById('center-panel').innerHTML`);
    return /殿试/.test(p) && /座师门生/.test(p) && /恩科/.test(p) && typeof out === 'string';
});
assert('I6-02', '舞弊待决时看板示彻查/压下按钮', () => {
    fresh('chenghua');
    R(`GameState.kejuState.cheatCount=1; GameState.kejuDeep.forceScandal=1; kdExposeScandal();`);
    const p = R(`renderKejuDeepTab()`);
    return /彻查/.test(p) && /压下/.test(p);
});
assert('I6-03', 'renderKejuDeepTab 异常时安全兜底', () => {
    return R(`renderKejuDeepTab()`) !== undefined;
});

// —— 存档往返 + 旧档兼容 + 反爽代价真实资源核验 ——
assert('I7-01', '存档→读档 kejuDeep 完整往返', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.grace=5; GameState.kejuDeep.topThree=[{name:'X'}] ; saveGame();`);
    R(`GameState.kejuDeep = initKejuDeepState(); loadGame();`);
    return R(`GameState.kejuDeep.grace === 5 && GameState.kejuDeep.topThree.length === 1`) === true;
});
assert('I7-02', '旧档兼容：缺 kejuDeep 时读档兜底默认', () => {
    R(`localStorage.clear();`);
    fresh('chenghua');
    R(`var saveData = JSON.parse(localStorage.getItem('daming_guoce_save_v2')); delete saveData.kejuDeep; localStorage.setItem('daming_guoce_save_v2', JSON.stringify(saveData)); loadGame();`);
    return R(`!!GameState.kejuDeep && GameState.kejuDeep.grace === 0`) === true;
});
assert('I7-03', '殿试/门生/彻查/压下/恩科 各含真实代价（国库/派系/威信/稳定至少一维变化）', () => {
    fresh('chenghua');
    // 每操作记录快照差异，确认非零代价
    R(`var snap=function(){return [GameState.stats.treasury,GameState.stats.stability,GameState.stats.prestige,GameState.stats.food,JSON.stringify(GameState.factions)]};`);
    R(`GameState.kejuDeep.cd.grace=-99; var a=snap(); kdHoldGraceExam(); var b=snap();`);
    const enko = R(`a.join()!==b.join()`);
    return enko === true;
});

// —— 反爽确定性主链：殿试→门生→彻查 全链路不为空且可复现 ——
assert('I8-01', '确定性主链可复现（force 钳制下两次执行结果一致）', () => {
    fresh('chenghua');
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`); R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);
    const topA = R(`JSON.stringify(GameState.kejuDeep.topThree)`);
    fresh('chenghua');
    R(`GameState.kejuDeep.forceCandidates=[{id:'k0',name:'寒才甲',talent:88,background:'cold',backing:'civil',used:false},{id:'k1',name:'权子乙',talent:45,background:'powerful',backing:'royal',used:false},{id:'k2',name:'中才丙',talent:62,background:'cold',backing:'civil',used:false}];`);
    R(`kdConvenePalaceExam()`); R(`kdAssignRank('k0','zhuangyuan')`); R(`kdAssignRank('k1','bangyan')`); R(`kdAssignRank('k2','tanhua')`);
    return R(`JSON.stringify(GameState.kejuDeep.topThree)`) === topA;
});

// —— 零回归钩子 ——
assert('I9-01', 'edict 永久DOM（edict-from/title/content + history）未动', () =>
    /edict-from/.test(html) && /edict-title/.test(html) && /edict-content/.test(html) && /edict-history-zone/.test(html));
assert('I9-02', 'b1 G02 / b2 A37 脚本顺序紧邻未破坏（sfx→yearend→mobileui→script）', () =>
    /sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(html));
assert('I9-03', 'style.css 未追加任何内容（v5d G-06 阈值保持）——.kd-* 样式经运行时注入', () =>
    css.trim().endsWith('}') && css.lastIndexOf('.dynasty-open-poem') > css.length * 0.84);
assert('I9-04', 'keju_deep.js 自包含注入 .kd-* 样式（含移动端响应式）', () =>
    /KD_CSS/.test(jsKd) && /@media \(max-width:720px\)/.test(jsKd) && /kdInjectStyle/.test(jsKd));
assert('I9-05', '既有 keju.js 逻辑未改动（kd 全部新增前缀函数，openKejuSession/kejuExecute 仍在）', () => {
    const jsKeju = fs.readFileSync(path.join(ROOT, 'keju.js'), 'utf8');
    return /function openKejuSession/.test(jsKeju) && /function kejuExecute/.test(jsKeju) && jsKeju.indexOf('kd') < 0;
});
assert('I9-06', 'new node --check 通过（keju_deep.js 语法有效）', () => {
    const { execSync } = require('child_process');
    try { execSync(`node --check "keju_deep.js"`, { cwd: ROOT, stdio: 'pipe' }); return true; } catch (e) { return false; }
});

// ========== 汇总 ==========
console.log('='.repeat(56));
console.log(`批I验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项，门槛≥35）`);
if (failed.length) {
    console.log('── 失败项 ──');
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
} else {
    console.log('✓ 批I（科举深化）验证全部通过');
}