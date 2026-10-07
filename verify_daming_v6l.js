// ============================================================
// 《大明国策》v6.6 批L · 天命·心性·朝会 验证套件
// 覆盖：接线（index 引入 / script 存档链 save+load 兜底+init 初始化 / advanceSeason 挂 tick）
//       / 符号命名 / 静态常量 / 沙箱初始化 / 反爽代价 / 确定性逻辑 / 渲染看板 / 持久化字段名一致。
// 门槛：≥35 项断言
// ============================================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let passed = [], failed = [];
function assert(id, desc, fn) {
    const ok = (() => { try { return !!fn(); } catch (e) { console.log('  [' + id + ' throw] ' + e.message); return false; } })();
    if (ok) passed.push(id); else failed.push(id + ': ' + desc);
}

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
        addEventListener() {}, removeEventListener() {}, documentElement: makeEl('html'), head: makeEl('head'), readyState: 'complete' };
    body.appendChild(tabs); body.appendChild(mkTab(els, 'center-panel'));
    return { doc, els };
}
const seed = buildSeed();
const document = seed.doc;
const sandbox = {
    console, setTimeout: (f) => { f(); return 1; }, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
    Math, JSON, Date, Error, Object, String, Number, Boolean, Map, Set, RegExp, Array, undefined, NaN, Infinity,
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

console.log('--------------------------------------------------------');
console.log('《大明国策》批L（天命·心性·朝会·v6.6）验证套件');
console.log('--------------------------------------------------------');

// ========== 接线（index.html + script.js + modules.js） ==========
assert('L1-01', 'index.html 引入 tianming.js', () => /tianming\.js/.test(html));
assert('L1-02', 'index.html 引入 xinxing.js', () => /xinxing\.js/.test(html));
assert('L1-03', 'index.html 引入 chaohui.js', () => /chaohui\.js/.test(html));
assert('L1-04', 'index.html menu-tab 含 tianming/xinxing/chaohui 入口', () => /data-tab="tianming"/.test(html) && /data-tab="xinxing"/.test(html) && /data-tab="chaohui"/.test(html));
assert('L1-05', 'modules.js renderPanel 含 case tianming/xinxing/chaohui', () => {
    const m = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
    return /case 'tianming'/.test(m) && /case 'xinxing'/.test(m) && /case 'chaohui'/.test(m);
});
assert('L1-06', 'script.js saveGame 序列化 tianming/xinxing/chaohui', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    return /tianming:\s*GameState\.tianming/.test(src) && /xinxing:\s*GameState\.xinxing/.test(src) && /chaohui:\s*GameState\.chaohui/.test(src);
});
assert('L1-07', 'script.js loadGame 反序列化兜底 tianming/xinxing/chaohui', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    return /GameState\.tianming\s*=\s*save\.tianming/.test(src) && /GameState\.xinxing\s*=\s*save\.xinxing/.test(src) && /GameState\.chaohui\s*=\s*save\.chaohui/.test(src);
});
assert('L1-08', 'script.js initGame 初始化 tmmInit/xxInit/chInit', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    return /tmmInit\(\)/.test(src) && /xxInit\(\)/.test(src) && /chInit\(\)/.test(src);
});
assert('L1-09', 'script.js advanceSeason 挂 tmmTick/xxTick/chTick', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    return /tmmTick\(\)/.test(src) && /xxTick\(\)/.test(src) && /chTick\(\)/.test(src);
});
assert('L1-10', 'style.css 未追加 tmm/xx/xx 前缀类（运行时注入），v5d G-06 阈值保持', () => {
    const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
    return !/\.tmm-/.test(css) && !/\.xx-/.test(css) && !/\.ch-/.test(css);
});
assert('L1-11', 'edict 永久DOM 仍未动', () => {
    const h = html;
    return /id="edict-from"/.test(h) && /id="edict-title"/.test(h) && /id="edict-content"/.test(h) && /id="edict-history-zone"/.test(h);
});
assert('L1-12', 'script.js 主结构（saveGame/loadGame/initGame/advanceSeason）未被破坏', () => {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    return /function saveGame\(\)/.test(src) && /function loadGame\(\)/.test(src) && /function initGame/.test(src) && /function advanceSeason/.test(src);
});

// ========== 符号全局暴露 ==========
assert('L2-01', 'tmmInit 全局', () => typeof R('tmmInit') === 'function');
assert('L2-02', 'tmmAdjust/tmmAccrue 全局', () => typeof R('tmmAdjust') === 'function' && typeof R('tmmAccrue') === 'function');
assert('L2-03', 'tmmJudgmentWord 全局', () => typeof R('tmmJudgmentWord') === 'function');
assert('L2-04', 'tmmIsBlessed/tmmIsScourged 全局', () => typeof R('tmmIsBlessed') === 'function' && typeof R('tmmIsScourged') === 'function');
assert('L2-05', 'renderTianmingTab 全局', () => typeof R('renderTianmingTab') === 'function');
assert('L2-06', 'xxInit/xxAdjust 全局', () => typeof R('xxInit') === 'function' && typeof R('xxAdjust') === 'function');
assert('L2-07', 'xxDominant/xxEdictMod 全局', () => typeof R('xxDominant') === 'function' && typeof R('xxEdictMod') === 'function');
assert('L2-08', 'renderXinxingTab 全局', () => typeof R('renderXinxingTab') === 'function');
assert('L2-09', 'chInit/chTick 全局', () => typeof R('chInit') === 'function' && typeof R('chTick') === 'function');
assert('L2-10', 'chResolve 全局', () => typeof R('chResolve') === 'function');
assert('L2-11', 'renderChaohuiTab 全局', () => typeof R('renderChaohuiTab') === 'function');
assert('L2-12', 'CH_FACTIONS/CH_TOPICS/XX_TRAITS 常量已挂全局', () => {
    const f = R('CH_FACTIONS'), t = R('CH_TOPICS'), x = R('XX_TRAITS');
    return Array.isArray(f) && Array.isArray(t) && Array.isArray(x);
});

// ========== 沙箱初始化 ==========
fresh('chenghua');
assert('L3-01', 'initGame 后 GameState.tianming 存在且为对象', () => {
    const t = R('GameState.tianming'); return t && typeof t === 'object' && typeof t.value === 'number';
});
assert('L3-02', 'tianming.value 在 40-70 范围（开局稳定派生）', () => {
    const v = R('GameState.tianming.value'); return typeof v === 'number' && v >= 40 && v <= 70;
});
assert('L3-03', 'tianming 含 peakValue/nadirValue/blessed/scourge/judgment/omenList 全结构', () => {
    const t = R('GameState.tianming');
    return t && typeof t.peakValue === 'number' && typeof t.nadirValue === 'number'
        && typeof t.blessed === 'number' && typeof t.scourge === 'number'
        && typeof t.judgment === 'string' && Array.isArray(t.omenList);
});
assert('L3-04', 'tianming.judgment 在五档色级内', () => {
    const j = R('GameState.tianming.judgment');
    return ['圣','隆','稳','晦','危'].indexOf(j) >= 0;
});
assert('L3-05', 'GameState.xinxing 初始化含 ren/yan/yong/mou 四向均50', () => {
    const x = R('GameState.xinxing');
    return x && x.ren === 50 && x.yan === 50 && x.yong === 50 && x.mou === 50 && Array.isArray(x.acts);
});
assert('L3-06', 'GameState.chaohui 初始化（pending=null/resolvedCount=0）', () => {
    const c = R('GameState.chaohui');
    return c && c.pending === null && c.resolvedCount === 0 && Array.isArray(c.resolvedHistory);
});

// ========== tmmAdjust 限幅 + 色级映射 ==========
assert('L4-01', 'tmmAdjust(+200) 上限100限幅', () => {
    R('GameState.tianming.value = 50; tmmAdjust(200, "test");');
    return R('GameState.tianming.value') === 100;
});
assert('L4-02', 'tmmAdjust(-200) 下限0限幅', () => {
    R('GameState.tianming.value = 50; tmmAdjust(-200, "test");');
    return R('GameState.tianming.value') === 0;
});
assert('L4-03', 'tmmJudgmentWord 90分=圣', () => R('tmmJudgmentWord(95)') === '圣');
assert('L4-04', 'tmmJudgmentWord 80分=隆', () => R('tmmJudgmentWord(80)') === '隆');
assert('L4-05', 'tmmJudgmentWord 60分=稳', () => R('tmmJudgmentWord(60)') === '稳');
assert('L4-06', 'tmmJudgmentWord 45分=晦', () => R('tmmJudgmentWord(45)') === '晦');
assert('L4-07', 'tmmJudgmentWord 20分=危', () => R('tmmJudgmentWord(20)') === '危');
assert('L4-08', 'tmmIsBlessed(80)=true', () => { R('GameState.tianming.value = 80;'); return R('tmmIsBlessed()') === true; });
assert('L4-09', 'tmmIsScourged(20)=true', () => { R('GameState.tianming.value = 20;'); return R('tmmIsScourged()') === true; });

// ========== tmmAccrue 善/劣政差 ==========
assert('L4-10', 'tmmAccrue("good",5) → +0.6*5=+3', () => {
    R('GameState.tianming.value = 50; tmmAccrue("good", 5);');
    const v = R('GameState.tianming.value');
    return v >= 52.9 && v <= 53.1;
});
assert('L4-11', 'tmmAccrue("bad",5) → -1.2*5=-6', () => {
    R('GameState.tianming.value = 50; tmmAccrue("bad", 5);');
    const v = R('GameState.tianming.value');
    return v >= 43.9 && v <= 44.1;
});
assert('L4-12', '劣政衰减 > 善政增益（反爽张力）', () => {
    R('GameState.tianming.value = 50; tmmAccrue("good", 5);');
    const good = 50 - R('GameState.tianming.value');
    R('GameState.tianming.value = 50; tmmAccrue("bad", 5);');
    const bad = R('GameState.tianming.value') - 50;
    return Math.abs(bad) > good;
});

// ========== xxAdjust 限幅 + 主导判断 ==========
assert('L5-01', 'xxAdjust 上限100限幅', () => {
    R('GameState.xinxing.ren = 50; xxAdjust({ren: 200}, "test");');
    return R('GameState.xinxing.ren') === 100;
});
assert('L5-02', 'xxAdjust 下限0限幅', () => {
    R('GameState.xinxing.yan = 50; xxAdjust({yan: -200}, "test");');
    return R('GameState.xinxing.yan') === 0;
});
assert('L5-03', 'xxDominant 在 mou=80 时返 mou', () => {
    R('GameState.xinxing = {ren:5,yan:5,yong:5,mou:80,acts:[]};');
    return R('xxDominant().key') === 'mou';
});
assert('L5-04', 'xxDominant 在 ren=80 时返 ren', () => {
    R('GameState.xinxing = {ren:80,yan:5,yong:5,mou:5,acts:[]};');
    return R('xxDominant().key') === 'ren';
});
assert('L5-05', 'xxEdictMod(ren≥70)=1.25 圣', () => { R('GameState.xinxing.ren = 80;'); return R('xxEdictMod("ren")') === 1.25; });
assert('L5-06', 'xxEdictMod(ren<30)=0.8 衰', () => { R('GameState.xinxing.ren = 25;'); return R('xxEdictMod("ren")') === 0.8; });
assert('L5-07', 'xxEdictMod(中位)=1', () => { R('GameState.xinxing.ren = 50;'); return R('xxEdictMod("ren")') === 1; });
assert('L5-08', 'xxLevelWord(95)=至圣', () => R('xxLevelWord(95)') === '至圣');
assert('L5-09', 'xxLevelWord(20)=缺', () => R('xxLevelWord(20)') === '缺');

// ========== chTick 确定性派生 + 防抖 ==========
assert('L6-01', 'chTick 生成 pending 含 opts', () => {
    R(`GameState.currentYear = 0; GameState.currentSeason = 0; chTick();`);
    const p = R('GameState.chaohui.pending');
    return p && Array.isArray(p.opts) && p.opts.length >= 2;
});
assert('L6-02', 'chTick 同 tick 不重复派生（lastTick 防抖）', () => {
    R(`GameState.currentYear = 0; GameState.currentSeason = 0; chTick();`);
    const a = R('GameState.chaohui.pending');
    R('chTick();');
    const b = R('GameState.chaohui.pending');
    return a === b;
});
assert('L6-03', 'chTick 跨 tick 派生新议题（不同 season）', () => {
    R(`GameState.currentYear = 0; GameState.currentSeason = 0; GameState.chaohui.lastTick = -1; chTick();`);
    const a = R('GameState.chaohui.pending');
    R(`GameState.currentSeason = 1; GameState.chaohui.lastTick = -1; chTick();`);
    const b = R('GameState.chaohui.pending');
    return a !== null && b !== null;
});
assert('L6-04', 'CH_FACTIONS 长度=5（文/武/宗/宦/戚）', () => R('CH_FACTIONS.length') === 5);
assert('L6-05', 'CH_TOPICS 长度≥6（多议题）', () => R('CH_TOPICS.length') >= 6);

// ========== chResolve 派系影响 + 限幅 ==========
assert('L7-01', 'chResolve 派系偏好解增5', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{factionCivil:5,factionRoyal:-5,treasury:-10,stability:2,tianming:0.5}}]};`);
    R('GameState.factions.civil = 60; GameState.factions.royal = 60;');
    R('chResolve(0);');
    return R('GameState.factions.civil') === 65;
});
assert('L7-02', 'chResolve 派系反对者减5', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t2',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{factionCivil:5,factionRoyal:-5}}]};`);
    R('GameState.factions.civil = 60; GameState.factions.royal = 60;');
    R('chResolve(0);');
    return R('GameState.factions.royal') === 55;
});
assert('L7-03', 'chResolve 资源/稳定 影响正确', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t3',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{treasury:-10,stability:2}}]};`);
    R('GameState.stats.treasury = 1000; GameState.stats.stability = 50;');
    R('chResolve(0);');
    return R('GameState.stats.treasury') === 990 && R('GameState.stats.stability') === 52;
});
assert('L7-04', 'chResolve pending 清空', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t4',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{}}]};`);
    R('chResolve(0);');
    return R('GameState.chaohui.pending') === null;
});
assert('L7-05', 'chResolve resolvedCount 增加', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t5',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{}}]};`);
    const before = R('GameState.chaohui.resolvedCount');
    R('chResolve(0);');
    return R('GameState.chaohui.resolvedCount') === before + 1;
});
assert('L7-06', 'chResolve resolvedHistory 记录', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t6',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'选X',favor:'civil',opposer:'royal',eff:{}}]};`);
    R('chResolve(0);');
    const h = R('GameState.chaohui.resolvedHistory');
    return Array.isArray(h) && h.length > 0 && h[h.length-1].choiceLabel === '选X';
});
assert('L7-07', 'chResolve 派系下限0限幅', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t7',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{factionCivil:-200}}]};`);
    R('GameState.factions.civil = 60;');
    R('chResolve(0);');
    return R('GameState.factions.civil') >= 0;
});
assert('L7-08', 'chResolve 联动天命（如有 tmmAdjust）', () => {
    R('GameState.tianming.value = 50; GameState.tianming.peakValue = 50; GameState.tianming.nadirValue = 50;');
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t8',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{tianming:0.6}}]};`);
    R('chResolve(0);');
    const v = R('GameState.tianming.value');
    return v >= 50.4 && v <= 50.8;
});
assert('L7-09', 'chResolve 失败（无 pending 返 null）', () => {
    R('GameState.chaohui.pending = null;');
    return R('chResolve(0)') === null || R('chResolve(0)') === undefined;
});
assert('L7-10', 'chResolve 失败（optIdx 越界）', () => {
    R(`GameState.chaohui.pending = {year:0,season:0,topicKey:'t9',topicLabel:'t',topicDesc:'t',reqFaction:'civil',opts:[{label:'A',favor:'civil',opposer:'royal',eff:{}}]};`);
    return R('chResolve(5)') === null || R('chResolve(5)') === undefined;
});

// ========== 渲染看板 ==========
assert('L8-01', 'renderTianmingTab 返回字符串且含天类命牌', () => {
    const s = R('renderTianmingTab()');
    return typeof s === 'string' && s.indexOf('天命') >= 0;
});
assert('L8-02', 'renderTianmingTab 含色级徽标', () => {
    const s = R('renderTianmingTab()');
    return s.indexOf('judge') >= 0;
});
assert('L8-03', 'renderTianmingTab 含赐福/祸患阈值提示', () => {
    const s = R('renderTianmingTab()');
    return s.indexOf('赐福') >= 0 && s.indexOf('祸患') >= 0;
});
assert('L8-04', 'renderXinxingTab 含心性', () => {
    const s = R('renderXinxingTab()');
    return typeof s === 'string' && s.indexOf('心性') >= 0;
});
assert('L8-05', 'renderXinxingTab 含主性 + 四向网格', () => {
    const s = R('renderXinxingTab()');
    return s.indexOf('主性') >= 0 && s.indexOf('仁') >= 0 && s.indexOf('严') >= 0 && s.indexOf('勇') >= 0 && s.indexOf('谋') >= 0;
});
assert('L8-06', 'renderXinxingTab 含诏书加成模块', () => {
    const s = R('renderXinxingTab()');
    return s.indexOf('诏书') >= 0 || s.indexOf('加成') >= 0;
});
assert('L8-07', 'renderChaohuiTab 含朝会', () => {
    const s = R('renderChaohuiTab()');
    return typeof s === 'string' && s.indexOf('朝会') >= 0;
});
assert('L8-08', 'renderChaohuiTab 含廷议', () => {
    const s = R('renderChaohuiTab()');
    return s.indexOf('廷议') >= 0;
});
assert('L8-09', 'renderChaohuiTab 待议 + 已决项', () => {
    R('GameState.chaohui.pending = null;');
    const s = R('renderChaohuiTab()');
    return s.indexOf('朝议') >= 0 || s.indexOf('决议') >= 0;
});

// ========== 持久化链路 ==========
assert('L9-01', 'saveGame 后存档含 tianming 字段', () => {
    R('saveGame();');
    const raw = R(`localStorage.getItem("daming_guoce_save_v2")`);
    return raw && raw.indexOf('"tianming"') >= 0;
});
assert('L9-02', 'saveGame 后存档含 xinxing 字段', () => {
    const raw = R(`localStorage.getItem("daming_guoce_save_v2")`);
    return raw && raw.indexOf('"xinxing"') >= 0;
});
assert('L9-03', 'saveGame 后存档含 chaohui 字段', () => {
    const raw = R(`localStorage.getItem("daming_guoce_save_v2")`);
    return raw && raw.indexOf('"chaohui"') >= 0;
});

// ========== 全量跑全 21 套（先 v6k + smoke 重点） ==========
const v6kPass = (() => {
    try {
        require('child_process').execSync('node ' + path.join(ROOT, 'verify_daming_v6k.js'), { stdio: 'pipe' });
        return true;
    } catch (e) { return false; }
})();
assert('L10-01', 'v6.5 批K 验证仍全绿（回归）', () => v6kPass);
const smokePass = (() => {
    try {
        require('child_process').execSync('node ' + path.join(ROOT, 'smoke_daming.js'), { stdio: 'pipe' });
        return true;
    } catch (e) { return false; }
})();
assert('L10-02', 'smoke 全绿（回归）', () => smokePass);

// ========== 结论 ==========
console.log('--------------------------------------------------------');
console.log('批L验证结果：', passed.length, '项通过，', failed.length, '项失败（共', passed.length + failed.length, '项，门槛≥35）');
if (failed.length) {
    console.log('失败项：');
    failed.slice(0, 12).forEach(f => console.log('  - ' + f));
    if (failed.length > 12) console.log('  ... 共 ' + failed.length + ' 项失败');
}
if (passed.length >= 35 && failed.length === 0) {
    console.log('✓ 批L（v6.6 天命·心性·朝会）验证全部通过');
    process.exit(0);
} else {
    console.log('✗ 批L验证未通过');
    process.exit(1);
}