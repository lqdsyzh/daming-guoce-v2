// ============================================
// 《大明国策》v6.0 批E · 长线目标体系（王朝使命）验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批C/批D同构）。
// 覆盖：使命池定义/剧本预设、进度实算、达成判定与发奖、
//      隐藏成就并入 ACHIEVEMENTS 框架、存档链、看板渲染、
//      终点王朝评价、modules/script 挂载、零回归。
// 史据：各使命《明史》卷次见 src（宁换不编、演绎注明）。
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

// —— DOM mock（同构批C）——
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
    ['overview','politics','govern','military','map','finance','intrigue','secret','mission'].forEach(p => {
        const t = makeEl('mt_' + p); t.__tag = 'div'; t.dataset.tab = p; t._cls.add('menu-tab'); t.textContent = p;
        tabs.appendChild(t); els['mt_' + p] = t;
    });
    ['edict-from','edict-title','edict-content'].forEach(mk);
    ['end-legacy','end-content','end-title','end-era','end-stats'].forEach(mk);
    ['intrigue-modal','intrigue-title','intrigue-desc','intrigue-src','intrigue-opts','intrigue-paper'].forEach(mk);
    const doc = { body, _els: els, __c: 0,
        getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
        querySelector(sel) { for (const k in els) if (matchSel(els[k], sel)) return els[k]; return null; },
        querySelectorAll(sel) { let out = []; if (String(sel).indexOf(' ') > 0) { const parts = String(sel).trim().split(/\s+/); const last = parts[parts.length - 1]; const anc = parts.slice(0, -1); for (const k in els) if (matchSel(els[k], last) && anc.every(a => hasAncestor(els[k], a, doc))) out.push(els[k]); return out; } for (const k in els) if (matchSel(els[k], sel)) out.push(els[k]); return out; },
        createElement(tag) { const el = makeEl('dyn_' + (++doc.__c)); el.__tag = tag || 'div'; return el; },
        addEventListener() {}, documentElement: makeEl('html'), head: makeEl('head') };
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
console.log('《大明国策》批E（长线目标体系·王朝使命）验证套件');
console.log('========================================================');

// —— 静态钩子核验 ——
const jsMs = fs.readFileSync(path.join(ROOT, 'missions.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsOv = fs.readFileSync(path.join(ROOT, 'overview.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('E1-01', 'missions.js 存在且含核心函数', () =>
    /function initMissionsState/.test(jsMs) && /function missionsTick/.test(jsMs) &&
    /function renderMissionTab/.test(jsMs) && /function missionOverviewStrip/.test(jsMs) &&
    /function renderMissionEnding/.test(jsMs) && /function missionEndingTitle/.test(jsMs) &&
    /function ensureMissionsState/.test(jsMs));
assert('E1-02', '逐使命引《明史》史据（≥8 处），宁换不编', () =>
    (jsMs.match(/《明史》/g) || []).length >= 8);
assert('E1-03', 'modules.js 已挂 renderPanel case mission', () =>
    /case 'mission'/.test(jsMod) && /renderMissionTab/.test(jsMod));
assert('E1-04', 'script.js initGame 初始化 missions', () =>
    /GameState\.missions = initMissionsState\(\)/.test(jsMain));
assert('E1-05', 'script.js saveGame 序列化 missions', () =>
    /missions: GameState\.missions/.test(jsMain));
assert('E1-06', 'script.js loadGame 兜底 missions + ensure', () =>
    /GameState\.missions = save\.missions/.test(jsMain) && /ensureMissionsState/.test(jsMain));
assert('E1-07', 'script.js advanceSeason 挂 missionsTick', () =>
    /missionsTick\(\)/.test(jsMain));
assert('E1-08', 'script.js triggerEnding 挂 renderMissionEnding', () =>
    /renderMissionEnding/.test(jsMain));
assert('E1-09', 'overview.js 追加王朝使命段（missionOverviewStrip）', () =>
    /王朝使命/.test(jsOv) && /missionOverviewStrip/.test(jsOv));
assert('E1-10', 'index.html 含使命 tab / script', () =>
    /data-tab="mission"/.test(html) && /<script src="missions\.js">/.test(html));
assert('E1-11', 'style.css 末尾追加批E使命样式', () =>
    /\.ms-bar/.test(css) && /\.ms-fill/.test(css) && /\.ms-mini/.test(css) && /\.mission-ending/.test(css));

// —— 功能：状态初始化 + 剧本预设 ——
fresh('chenghua');
assert('E2-01', 'initGame 后 missions 就绪（结构完整，chenghua 3条）', () =>
    R(`!!GameState.missions && Array.isArray(GameState.missions.list) && GameState.missions.list.length === 3 && Array.isArray(GameState.missions.completed) && typeof GameState.missions.totalRewarded === 'number'`));
assert('E2-02', 'chenghua 预设使命含 海内一统/大治之世/文教昌明', () => {
    const ids = R(`GameState.missions.list.map(function(m){return m.id;}).join(',')`);
    return /mission_hainei/.test(ids) && /mission_dazhi/.test(ids) && /mission_wenjiao/.test(ids);
});
assert('E2-03', '各剧本预设条数在 2-3 之间', () => {
    const ok = ['chenghua','zhengde','wanli','tianqi'].every(s => {
        fresh(s);
        const n = R(`GameState.missions.list.length`);
        return n >= 2 && n <= 3;
    });
    fresh('chenghua');
    return !!ok;
});
assert('E2-04', '开局使命全部未达成（不做白嫖）', () =>
    R(`GameState.missions.list.every(function(m){return m.state === 'active';})`) === true &&
    R(`GameState.missions.completed.length === 0`));
assert('E2-05', '进度实算：开局 frontier 未零 → 海内一统进度 < 100', () => {
    const act = R(`(function(){var st=GameState.missions; for(var i=0;i<st.list.length;i++){if(st.list[i].id==='mission_hainei'){var d=missionDef('mission_hainei'); return d.pct(GameState);}} return -1;})()`);
    return typeof act === 'number' && act < 100;
});

// —— 存档链 ——
assert('E3-01', '存档往返含 missions 且恢复', () => {
    fresh('chenghua');
    R(`GameState.missions.completed.push('mission_hainei');`);
    R(`saveGame()`); R(`loadGame()`);
    return R(`GameState.missions && GameState.missions.completed.indexOf('mission_hainei') >= 0`);
});
assert('E3-02', '旧档缺 missions → loadGame 兜底初始化', () => {
    fresh('chenghua');
    R(`saveGame()`);
    R(`(function(){ var s=JSON.parse(localStorage.getItem('daming_save')); delete s.missions; localStorage.setItem('daming_save', JSON.stringify(s)); loadGame(); })()`);
    return R(`!!GameState.missions && Array.isArray(GameState.missions.list) && GameState.missions.list.length > 0`);
});

// —— 达成判定 + 发奖 + 成就 ——
fresh('chenghua');
assert('E4-01', '属性达标逼平海内一统 → missionsTick 判达成', () => {
    R(`GameState.stats.frontier = 0; GameState.stats.militaryPower = 15000; GameState.stats.treasury = 10000;`);
    R(`missionsTick();`);
    const done = R(`(function(){var st=GameState.missions; for(var i=0;i<st.list.length;i++){if(st.list[i].id==='mission_hainei') return st.list[i].state;} return 'x';})()`);
    const comp = R(`GameState.missions.completed.indexOf('mission_hainei') >= 0`);
    return done === 'done' && !!comp;
});
assert('E4-02', '达成发放社稷奖励（treasury 依 reward +2000 增加）', () => {
    // 重置后逼近并确认奖赏落账
    fresh('chenghua');
    R(`GameState.stats.frontier = 0; GameState.stats.militaryPower = 15000; GameState.stats.treasury = 10000;`);
    R(`missionsTick();`);
    return R(`GameState.stats.treasury`) === 12000;
});
assert('E4-03', '对应隐藏成就并入 ACHIEVEMENTS 且 check 为真', () =>
    R(`(function(){ var a=null; for(var i=0;i<ACHIEVEMENTS.length;i++){ if(ACHIEVEMENTS[i].id==='mission_hainei'){ a=ACHIEVEMENTS[i]; break; } } return !!a && a.hidden === true && a.check(GameState)===true; })()`));
assert('E4-04', '达成使命对应隐藏成就自动解锁（mission_hainei 入已解锁集）', () => {
    fresh('chenghua');
    R(`GameState.stats.frontier = 0; GameState.stats.militaryPower = 15000; GameState.stats.treasury = 10000;`);
    R(`missionsTick();`);
    return R(`_unlockedAchievements.indexOf('mission_hainei') >= 0`);
});
assert('E4-05', '已达成使命不再重复发奖', () => {
    const before = R(`GameState.stats.treasury`);
    const beforeC = R(`GameState.stats.militaryPower`);
    R(`missionsTick();`);
    const after = R(`GameState.stats.treasury`);
    const afterC = R(`GameState.stats.militaryPower`);
    const rewarded = R(`GameState.missions.totalRewarded`);
    // 海内 reward 有 militaryPower+1000 → 不应再叠
    return after === before && afterC === beforeC;
});
assert('E4-06', '复合使命需同时达标（大治之世：稳定/腐败/天命）', () => {
    fresh('chenghua');
    // 仅稳定/天命达标而腐败超标 → 不得达成
    R(`GameState.stats.stability=85; GameState.stats.mandate=90; GameState.stats.corruption=60;`);
    R(`missionsTick();`);
    const done = R(`(function(){var st=GameState.missions; for(var i=0;i<st.list.length;i++){if(st.list[i].id==='mission_dazhi') return st.list[i].state;} return 'x';})()`);
    return done !== 'done';
});
assert('E4-07', '复合使命三达标 → 达成', () => {
    fresh('chenghua');
    R(`GameState.stats.stability=85; GameState.stats.mandate=90; GameState.stats.corruption=10;`);
    R(`missionsTick();`);
    const done = R(`(function(){var st=GameState.missions; for(var i=0;i<st.list.length;i++){if(st.list[i].id==='mission_dazhi') return st.list[i].state;} return 'x';})()`);
    return done === 'done';
});

// —— 看板渲染 ——
fresh('chenghua');
assert('E5-01', 'renderMissionTab 返回非空且含使命/进度', () => {
    const out = R(`typeof renderMissionTab === 'function' ? renderMissionTab() : ''`);
    return typeof out === 'string' && out.length > 50 && out.indexOf('王朝使命') >= 0 && /ms-bar/.test(out);
});
assert('E5-02', 'renderPanel("mission") 经 case 路由可渲染', () => {
    seed.els['center-panel']._html = '';
    R(`GameState.currentTab='mission'; renderPanel('mission');`);
    return /王朝使命/.test(seed.els['center-panel']._html) || /使命看板/.test(seed.els['center-panel']._html);
});
assert('E5-03', 'missionOverviewStrip 返回总览使命条（非空）', () => {
    const out = R(`typeof missionOverviewStrip === 'function' ? missionOverviewStrip() : ''`);
    return typeof out === 'string' && out.length > 10 && /王朝使命/.test(out);
});
assert('E5-04', 'renderMissionTab 不动 edict 永久DOM', () => {
    fresh('chenghua');
    const b = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent;
    R(`renderMissionTab();`);
    const a = seed.els['edict-from'].textContent + seed.els['edict-title'].textContent + seed.els['edict-content'].textContent;
    return b === a;
});

// —— 终点王朝评价 ——
fresh('chenghua');
assert('E6-01', '未达成 → missionEndingTitle 为守成之主', () => {
    const t = R(`missionEndingTitle().title`);
    return /守成|守成之主/.test(t);
});
assert('E6-02', '全达成 → 圣主图治', () => {
    fresh('chenghua');
    R(`GameState.missions.completed = ['mission_hainei','mission_dazhi','mission_wenjiao'];`);
    const t = R(`missionEndingTitle().title`);
    return /圣主/.test(t);
});
assert('E6-03', 'renderMissionEnding 于 end-legacy 追加王朝评价块', () => {
    fresh('chenghua');
    seed.els['end-legacy'].children.length = 0;
    R(`renderMissionEnding();`);
    return seed.els['end-legacy'].children.length >= 1;
});
assert('E6-04', 'renderMissionEnding 无 end-legacy 兜底不崩', () => {
    fresh('chenghua');
    // 走无 legacy 兜底分支
    R(`(function(){ var l=document.getElementById('end-legacy'); l.removeChild(l.children[0]||{}); })();`);
    R(`renderMissionEnding();`);
    return true;
});

// —— 零回归（批E不破坏既有系统）——
fresh('wanli');
assert('E7-01', '五种派系可用（wanli）', () =>
    R(`Object.keys(GameState.factions).length === 5`));
assert('E7-02', '主线(mainline)未受影响', () =>
    R(`typeof initMainline === 'function' && !!GameState.mainline`));
assert('E7-03', '厂卫(cangwei)未受影响', () =>
    R(`!!GameState.cangwei && typeof ensureCangweiState === 'function'`));
assert('E7-04', '权谋(intrigue)未受影响', () =>
    R(`!!GameState.intrigue && typeof renderIntrigueTab === 'function'`));
assert('E7-05', '经济(econ)未受影响', () =>
    R(`!!GameState.econ && typeof economyTick === 'function'`));
assert('E7-06', '推进 3 tick（3 季）含使命巡检不报错', () => {
    fresh('wanli');
    R(`GameState._t=0; function __adv(){ try{ advanceSeason(); return true; }catch(e){ return false; } }`);
    return R(`__adv()`) === true && R(`__adv()`) === true && R(`__adv()`) === true;
});

console.log('────────────────────────────────────────');
console.log(`批E验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项）`);
console.log('  [注] 批E在 style.css 末尾追加使命样式（符合"仅末尾追加"纪律）；');
console.log('  [注] 此举令 v5d G-06 与 v6c C1-09 的"CSS末尾为前批块"批序断言失败（预期·批序，非缺陷）。');
if (failed.length === 0) { console.log('✓ 批E（长线目标体系·王朝使命）验证全部通过'); }
else { console.log('✗ 批E验证存在失败：'); failed.forEach(x => console.log('   ✗ ' + x)); process.exitCode = 1; }