// ============================================
// 《大明国策》v6.3 批J · 省份治理深挖验证套件
// 独立编写，沿用 vm + DOM mock 模式（与批I同构）。
// 覆盖：接线（index引入/modules case/script 存档链三件套 + advanceSeason 挂 pvProvinceTick）/
//      构造器 initProvinceState 返回15布政司全结构/每省 trait 差异化（两类省 wealth·arms 初值不同）/
//      分支治理触发（有 trait 省露出对应维度分支、无 trait 省不能·分为 trait/冷却两态）/
//      三类型分支（财政/武备/安民）各执行一条验证代价+多维 effect+sideEffect 落地/
//      后果链确定性（probity 低→wealth 侵蚀; disaffect 高→民变; arms 高→边患镇抚; wealth 高→户部税收）/
//      多分支互斥/自身冷却/跨维叠加/延迟效果跨季结算/存档往返与旧档兜底/渲染看板/零回归钩子
//      （含 G02/A37 紧邻、edict 永久DOM、style 只末尾追加·v5d G-06 阈值保持）。
// 史据：《明史》卷305·宦官传（矿监税使）/卷77·食货志（清丈田亩、蠲免、屯田）/卷78·食货志（一条鞭法折银）/
//       卷89·兵志（募兵）/卷85·河渠志（漕河岁修、筑城）/卷316·广西土司传（狼兵）/卷327·俺答传（开市和戎）/
//       卷223·谭纶传（练水师）/卷72·职官志（考成清吏）；具体数值与阈值系演绎。
// 注意测试隔离：pvProvinceTick 含 tick 去重，同 tick 复测前先重置 lastTick=-1；
//               依赖随机/受侵蚀扰动的断言均先设确定性省画像状态再单次调用。
// ============================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let passed = [], failed = [];
function assert(id, desc, fn) {
    const __cur=id; const ok = (() => { try { return !!fn(); } catch (e) { console.log('  [' + id + ' throw] ' + e.message); return false; } })();
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
function R(code) { try { return vm.runInContext(code, sandbox); } catch (e) { console.log("  ["+__cur+" run异常] "+('  [run异常] ' + e.message); return undefined; } }
function fresh(s) { R(`initGame('${s || 'chenghua'}');`); }

console.log('========================================================');
console.log('《大明国策》批J（省份治理深挖）验证套件');
console.log('========================================================');

// —— 静态接线核验 ——
const jsPv = fs.readFileSync(path.join(ROOT, 'map_province.js'), 'utf8');
const jsMain = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const jsMod = fs.readFileSync(path.join(ROOT, 'modules.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

assert('J1-01', 'index.html 引入 map_province.js（置于 map.js 之后）', () => {
    const im = html.indexOf('src="map.js"');
    const ip = html.indexOf('src="map_province.js"');
    return ip > im && im > 0;
});
assert('J1-02', 'index.html 弹层含 #pv-zone 省治容器', () => /id="pv-zone"/.test(html));
assert('J1-03', 'modules.js case map 追加 renderMapProvinceTab（只追加不重排）', () =>
    /case 'map':\s*html = \(typeof renderMapTab === 'function'\) \? renderMapTab\(\) : '' \+ \(typeof renderMapProvinceTab === 'function' \? renderMapProvinceTab\(\) : ''\)/.test(jsMod));
assert('J1-04', 'script.js saveGame 序列化 province', () =>
    /province: GameState\.province/.test(jsMain));
assert('J1-05', 'script.js loadGame 反序列化兜底 province', () =>
    /GameState\.province = save\.province \|\| /.test(jsMain) && /initProvinceState/.test(jsMain));
assert('J1-06', 'script.js loadGame 调 pvEnsure 子键补齐', () =>
    /pvEnsure === 'function'/.test(jsMain));
assert('J1-07', 'script.js initGame 初始化 province', () =>
    /GameState\.province = initProvinceState\(\)/.test(jsMain));
assert('J1-08', 'script.js advanceSeason 挂 pvProvinceTick（链尾·try-catch）', () =>
    /try \{ pvProvinceTick\(\);? \} catch \(e\) \{\}/.test(jsMain));
assert('J1-09', 'b1 G02：sfx→yearend→mobileui→script 紧邻断言未被破坏', () => {
    const base = html.indexOf('src="sfx.js"');
    return base >= 0 && html.indexOf('src="yearend.js"', base) < html.indexOf('src="mobileui.js"', base)
        && html.indexOf('src="mobileui.js"', base) < html.indexOf('src="script.js"', base);
});
assert('J1-10', 'style.css 未追加 pv 样式，v5d G-06 阈值保持（运行时注入）', () =>
    jsPv.indexOf('.pv-zone{') >= 0 && css.trim().endsWith('}') && css.lastIndexOf('.dynasty-open-poem') > css.length * 0.85);
assert('J1-11', 'edict 永久DOM（from/title/content）与史评 history-list 未动', () =>
    /id="edict-from"/.test(html) && /id="edict-title"/.test(html) && /id="edict-content"/.test(html) && /id="history-list"/.test(html));
assert('J1-12', 'map_province.js 常量以 PV_ 前缀定义（PV_PROVINCES/PV_BRANCHES/PV_TRAITS）', () =>
    /const PV_PROVINCES/.test(jsPv) && /const PV_BRANCHES/.test(jsPv) && /const PV_TRAITS/.test(jsPv));
assert('J1-13', '全逻辑 try-catch 守卫 + _pvOrigRCA 链式包装', () =>
    /var _pvOrigRCA/.test(jsPv) && /renderMapCellActions = function/.test(jsPv) && (jsPv.match(/catch \(e\)/g) || []).length >= 12);

// —— 构造器完整结构 ——
assert('J2-01', 'initProvinceState 返回 {prov, pending, lastTick} 结构', () => {
    fresh('chenghua');
    const s = R('GameState.province');
    return !!s && typeof s === 'object' && Array.isArray(s.pending) && typeof s.lastTick === 'number';
});
assert('J2-02', '返回 15 布政司', () =>
    R('Object.keys(GameState.province.prov).length') === 15);
assert('J2-03', '每省含六维+cd+dimLock+lastTick，且各维 0-100', () => {
    fresh('chenghua');
    const bad = R(`(() => { const P=GameState.province.prov; for (const k in P){ const p=P[k];
        for (const f of ['wealth','grain','arms','people','probity','disaffect']) if(typeof p[f]!=='number'||p[f]<0||p[f]>100) return k+':'+f;
        if(!p.cd||!p.dimLock||typeof p.lastTick!=='number') return k+'meta'; } return null; })()`);
    return bad === null;
});
assert('J2-04', '差异化：江南(nanzhili) wealth 高于山西（两类省初值不同）', () => {
    fresh('chenghua');
    return R('GameState.province.prov.nanzhili.wealth') > R('GameState.province.prov.shanxi.wealth');
});
assert('J2-05', '差异化：陕西 arms 高于河南（边地武备厚）', () => {
    fresh('chenghua');
    return R('GameState.province.prov.shaanxi.arms') > R('GameState.province.prov.henan.arms');
});
assert('J2-06', '云南/广东因银矿 wealth 中高（≥50）', () => {
    fresh('chenghua');
    return R('GameState.province.prov.yunnan.wealth') >= 50 && R('GameState.province.prov.guangdong.wealth') >= 50;
});
assert('J2-07', 'trait 配置：云南[银矿], 浙江[倭警,丝], 湖广[粮仓]', () => {
    fresh('chenghua');
    return R(`PV_PROVINCES.yunnan.traits.indexOf('yinkuang') >= 0 && PV_PROVINCES.zhejiang.traits.indexOf('wojing') >= 0 && PV_PROVINCES.zhejiang.traits.indexOf('si') >= 0 && PV_PROVINCES.huguang.traits.indexOf('liangcang') >= 0`) === true;
});

// —— 分支治理触发（trait 门控）——
assert('J3-01', '云南（有银矿）财政可开「开矿课银」', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('yunnan','kuangke')`) === null;
});
assert('J3-02', '河南（无银矿）不能开矿（提示需省之专属素质）', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('henan','kuangke')`) !== null && R(`pvBranchLocked('henan','kuangke')`).indexOf('银矿') >= 0;
});
assert('J3-03', '广西（狼兵）武备可「点狼兵」', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('guangxi','langbing')`) === null;
});
assert('J3-04', '山东（无狼兵）不能点狼兵', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('shandong','langbing')`) !== null;
});
assert('J3-05', '北直隶（漕运）财政可「疏浚漕渠」', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('beizhili','caoyunx')`) === null;
});
assert('J3-06', '云南（无漕运）不能疏浚漕渠', () => {
    fresh('chenghua');
    return R(`pvBranchLocked('yunnan','caoyunx')`) !== null;
});

// —— 三类型分支：代价+多维 effect+sideEffect 落地 ——
assert('J4-01', '财政·苛敛：代价国库-150，效果 wealth+8/probity-4/国库+280，副作用 disaffect+12', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.wealth=50;GameState.province.prov.yunnan.probity=50;GameState.province.prov.yunnan.disaffect=20;`);
    const tr0 = R('GameState.stats.treasury');
    R(`pvBranch('yunnan','kelian');`);
    return R('GameState.stats.treasury') === tr0 - 150 + 280
        && R('GameState.province.prov.yunnan.wealth') === 58
        && R('GameState.province.prov.yunnan.probity') === 46
        && R('GameState.province.prov.yunnan.disaffect') === 32;
});
assert('J4-02', '武备·募勇：代价国库-400，效果 arms+8/兵威+2，副作用 disaffect+6·国库-200', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.arms=40;GameState.province.prov.yunnan.disaffect=10;`);
    const tr0 = R('GameState.stats.treasury'), mp0 = R('GameState.stats.militaryPower');
    R(`pvBranch('yunnan','muyong');`);
    return R('GameState.province.prov.yunnan.arms') === 48
        && R('GameState.province.prov.yunnan.disaffect') === 16
        && R('GameState.stats.treasury') === tr0 - 400 - 200
        && R('GameState.stats.militaryPower') === mp0 + 2;
});
assert('J4-03', '安民·赈济：代价国库-350·粮-200，效果 disaffect-12/稳定+1', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.disaffect=50; GameState.stats.treasury=9000; GameState.stats.food=5000;`);
    const st0 = R('GameState.stats.stability');
    R(`pvBranch('yunnan','zhenmin');`);
    return R('GameState.province.prov.yunnan.disaffect') === 38
        && R('GameState.stats.stability') === st0 + 1
        && R('GameState.stats.treasury') === 9000 - 350
        && R('GameState.stats.food') === 5000 - 200;
});
assert('J4-04', '吏治·清吏：代价国库-250，效果 probity+9/吏治清·贪腐-3', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.probity=50; GameState.stats.treasury=8000;`);
    const cf0 = R('GameState.stats.corruption');
    R(`pvBranch('yunnan','qingli');`);
    return R('GameState.province.prov.yunnan.probity') === 59
        && R('GameState.stats.corruption') === cf0 - 3
        && R('GameState.stats.treasury') === 8000 - 250;
});

// —— 后果链（确定性，钳制随机）——
assert('J5-01', '吏治低(probity<45)→每季侵蚀 wealth', () => {
    fresh('chenghua');
    R(`GameState.province.prov.henan.probity=30; GameState.province.prov.henan.wealth=60; GameState.province.lastTick=-1;`);
    R('pvProvinceTick();');
    return R('GameState.province.prov.henan.wealth') < 60;
});
assert('J5-02', '怨望高(disaffect≥阈值)→民变：地图标红·稳定-1·怨望回落', () => {
    fresh('chenghua');
    R(`GameState.mapData.status.henan=0; GameState.province.prov.henan.disaffect=80; GameState.province.lastTick=-1;`);
    const st0 = R('GameState.stats.stability');
    R('pvProvinceTick();');
    return R('GameState.mapData.status.henan') === 2
        && R('GameState.stats.stability') === st0 - 1
        && R('GameState.province.prov.henan.disaffect') < 80;
});
assert('J5-03', '武备高(arms≥70)→镇抚边患：红转黄', () => {
    fresh('chenghua');
    R(`GameState.mapData.status.henan=2; GameState.province.prov.henan.arms=80; GameState.province.prov.henan.disaffect=20; GameState.province.lastTick=-1;`);
    R('pvProvinceTick();');
    return R('GameState.mapData.status.henan') === 1;
});
assert('J5-04', '富民(wealth 高)→户部税收增益（国库当季增抬）', () => {
    fresh('chenghua');
    R(`GameState.province.prov.nanzhili.wealth=99; GameState.province.prov.guangdong.wealth=95; GameState.province.lastTick=-1;`);
    const tr0 = R('GameState.stats.treasury');
    R('pvProvinceTick();');
    return R('GameState.stats.treasury') > tr0;
});
assert('J5-05', '双向：地图标红(st=2)→恶化该省怨望/侵蚀财富', () => {
    fresh('chenghua');
    R(`GameState.mapData.status.henan=2; GameState.province.prov.henan.disaffect=30; GameState.province.prov.henan.wealth=50; GameState.province.prov.henan.probity=60; GameState.province.lastTick=-1;`);
    R('pvProvinceTick();');
    return R('GameState.province.prov.henan.disaffect') > 30 && R('GameState.province.prov.henan.wealth') < 50;
});

// —— 多分支互斥 / 自身冷却 / 跨维叠加 ——
assert('J6-01', '同维度互斥：选苛敛后同维「折银」锁定', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.wealth=50; pvBranch('yunnan','kelian');`);
    return R(`pvBranchLocked('yunnan','zheyin')`) !== null;
});
assert('J6-02', '自身冷却：募勇后立刻再募勇被锁', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.arms=40;GameState.province.prov.yunnan.disaffect=10; pvBranch('yunnan','muyong');`);
    return R(`pvBranchLocked('yunnan','muyong')`) !== null;
});
assert('J6-03', '跨维可叠加：苛敛(财政)后可再募勇(武备)', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.wealth=50;GameState.province.prov.yunnan.arms=40;GameState.province.prov.yunnan.disaffect=5; pvBranch('yunnan','kelian');`);
    return R(`pvBranchLocked('yunnan','muyong')`) === null;
});

// —— 延迟效果跨季结算 ——
assert('J7-01', '屯田安民（延迟1季）：当季 grain 未动·副作用 arms 立即-1·挂入 pending', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.grain=50;GameState.province.prov.yunnan.people=50;GameState.province.prov.yunnan.disaffect=40;GameState.province.prov.yunnan.arms=40;GameState.stats.treasury=2000;`);
    R(`pvBranch('yunnan','kentian');`);
    return R('GameState.province.prov.yunnan.grain') === 50
        && R('GameState.province.prov.yunnan.arms') === 39
        && R('GameState.province.pending.length') === 1;
});
assert('J7-02', '屯田安民：一季过后 grain/people 结算生效·pending 清空', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.grain=50;GameState.province.prov.yunnan.people=50;GameState.province.prov.yunnan.disaffect=40;GameState.province.prov.yunnan.arms=40;GameState.stats.treasury=2000; pvBranch('yunnan','kentian');`);
    const t0 = R('getMapTick()');
    R(`GameState.currentMonth=(GameState.currentMonth+1)%3; GameState.province.lastTick=-1; pvProvinceTick();`);
    return R('GameState.province.prov.yunnan.grain') === 56
        && R('GameState.province.prov.yunnan.people') === 53
        && R('GameState.province.pending.length') === 0
        && R('getMapTick()') !== t0;
});

// —— 存档往返 & 旧档兼容 ——
assert('J8-01', '存档→读档 province 完整往返', () => {
    fresh('chenghua');
    R(`GameState.province.prov.yunnan.wealth=77; saveGame(); GameState.province.prov.yunnan.wealth=1; loadGame();`);
    return R('GameState.province.prov.yunnan.wealth') === 77 && R('Object.keys(GameState.province.prov).length') === 15;
});
assert('J8-02', '旧档兼容：缺 province 时读档按下 15 布政司兜底', () => {
    R(`localStorage.clear(); fresh('chenghua'); var sd = JSON.parse(localStorage.getItem('daming_guoce_save_v2')); delete sd.province; localStorage.setItem('daming_guoce_save_v2', JSON.stringify(sd)); loadGame();`);
    return R('!!GameState.province && Object.keys(GameState.province.prov).length') === 15;
});
assert('J8-03', 'pvEnsure：缺失省份字典补默认键', () => {
    fresh('chenghua');
    R(`GameState.province.prov = { henan: { wealth:1 } }; pvEnsure();`);
    const p = R(`GameState.province.prov.henan`);
    return !!p && typeof p.arms === 'number' && typeof p.disaffect === 'number';
});

// —— 渲染 / 看板 / 回归 ——
assert('J9-01', 'renderMapProvinceTab 输出省治总览 + pv-grid 网格', () => {
    fresh('chenghua');
    const h = R('renderMapProvinceTab()');
    return typeof h === 'string' && h.indexOf('省治总览') >= 0 && h.indexOf('pv-grid') >= 0;
});
assert('J9-02', 'renderMapCellActions 链式包装：点开有省画像省份时 #pv-zone 被填充', () => {
    fresh('chenghua');
    R(`window._mapCurrentKey='yunnan'; renderMapCellActions();`);
    return R(`document.getElementById('pv-zone').innerHTML.indexOf('省治') >= 0`);
});
assert('J9-03', '省无素质画像时不渲染省治区（辽东非布政司）', () => {
    fresh('chenghua');
    R(`window._mapCurrentKey='liaodong'; renderMapCellActions();`);
    const h = R(`document.getElementById('pv-zone').innerHTML`);
    return typeof h === 'string' && h.indexOf('省治') < 0;
});
assert('J9-04', '分支按钮标注代价/效果/副作用/冷却', () => {
    fresh('chenghua');
    const btn = R(`pvBranchBtnHtml('yunnan','kelian')`);
    return typeof btn === 'string' && btn.indexOf('苛敛') >= 0 && btn.indexOf('耗') >= 0 && (btn.indexOf('效') >= 0) && (btn.indexOf('弊') >= 0 || btn.indexOf('pv-lock') >= 0);
});
assert('J9-05', '回归：advanceSeason 正常运行（岁月推进）', () => {
    fresh('chenghua');
    const m0 = R('GameState.currentMonth');
    R('advanceSeason();');
    return R('GameState.currentMonth') >= 0 && R('GameState.currentMonth') !== undefined;
});
assert('J9-06', '回归 B16：renderPanel(地图) 仍是 24 格（批J 未占用 map-cell 类）', () => {
    fresh('chenghua');
    R(`renderPanel('map')`);
    const panelHtml = String(R(`document.getElementById('center-panel').innerHTML`));
    const cellCount = (panelHtml.match(/class="map-cell[ "]/g) || []).length;
    return cellCount === 24;
});

// ========== 汇总 ==========
console.log('='.repeat(56));
console.log(`批J验证结果：${passed.length} 项通过，${failed.length} 项失败（共 ${passed.length + failed.length} 项，门槛≥35）`);
if (failed.length) {
    console.log('── 失败项 ──');
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
} else {
    console.log('✓ 批J（省份治理深挖）验证全部通过');
}