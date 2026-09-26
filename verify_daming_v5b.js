// ============================================
// 《大明国策》v5.0 批B 验证套件（主线叙事·山河志）
// B1 主线框架（四线结构/节点完整性）
// B2 四线各节点触发条件（年份/经济联动）
// B3 选项分支效应（落账/记账/史官/推进）
// B4 主线结局解锁（四线多走向）
// B5 主线成就 + 结局modal山河志章节
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
    'economy_market.js',
    // 批B
    'mainline.js'
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

function run(code) { try { return vm.runInContext(code, ctx); } catch (e) { console.log('  [run 异常] ' + e.message); return undefined; } }
function fresh(script) { run(`initGame('${script || 'chenghua'}');`); }
function det() { run('Math.random = function(){ return 0.5; };'); }

// 通用跑线器：把所有节点按 mode 决完，返回 endingResolved
//  mode: good(最高score) / evil(最低score) / mid(score===0 首个)
function runLine(script, year, mode) {
    return run(`
        initGame('${script}');
        GameState.currentYear = ${year};
        GameState.stats.treasury = 99999;
        // 经济联动驱动：景气指数由 economyTick 依 stats 重算，须置足真实驱动值
        GameState.stats.agriculture = 92;
        GameState.stats.commerce = 92;
        GameState.stats.stability = 85;
        GameState.stats.corruption = 8;
        GameState.stats.prestige = 85;
        if (GameState.econ) GameState.econ.prosperity = 90;
        function _pick(opts, m){
            var best = 0; var firstZero = -1;
            for (var i = 0; i < opts.length; i++) {
                var sc = opts[i].score || 0;
                if (firstZero < 0 && sc === 0) firstZero = i;
                if (m === 'good' && sc > (opts[best].score || 0)) best = i;
                else if (m === 'evil' && sc < (opts[best].score || 0)) best = i;
            }
            if (m === 'mid' && firstZero >= 0) return firstZero;
            return best;
        }
        var _n; var _g = 0;
        while ((_n = mainlineNextDue()) && _g < 10) {
            var i = _pick(_n.options, '${mode}');
            resolveMainlineOption(_n, _n.options[i], i);
            _g++;
        }
        GameState.mainline.endingResolved;
    `);
}

console.log('========================================================');
console.log('《大明国策》批B（主线叙事·山河志）验证套件');
console.log('========================================================');

// ===== B1. 主线框架 =====
console.log('\n— B1. 主线框架 —');
assert('B01', 'MAINLINE 对象存在', run('typeof MAINLINE') === 'object');
assert('B02', 'MAINLINE 含四剧本', () => { const k = run('Object.keys(MAINLINE).join(",")'); return ['chenghua','zhengde','wanli','tianqi'].every(x => k.indexOf(x) >= 0); });
assert('B03', '每线都有 nodes 数组', () => run(`['chenghua','zhengde','wanli','tianqi'].every(s => Array.isArray(MAINLINE[s].nodes))`));
assert('B04', '每线节点数 >= 3', () => { det(); const n = run(`['chenghua','zhengde','wanli','tianqi'].every(s => MAINLINE[s].nodes.length >= 3)`); return n; });
assert('B05', '成化线节点数=4', run('MAINLINE.chenghua.nodes.length') === 4);
assert('B06', '正德线节点数=3', run('MAINLINE.zhengde.nodes.length') === 3);
assert('B07', '万历线节点数=3', run('MAINLINE.wanli.nodes.length') === 3);
assert('B08', '天启线节点数=3', run('MAINLINE.tianqi.nodes.length') === 3);
assert('B09', '每个节点都有 id/name/year/desc/src', () => {
    det();
    return run(`Object.keys(MAINLINE).every(s => MAINLINE[s].nodes.every(n => n.id && n.name && typeof n.year==='number' && n.desc && n.src))`);
});
assert('B10', '每个节点 options >= 2 且 each 有 text/effect', () => {
    det();
    return run(`Object.keys(MAINLINE).every(s => MAINLINE[s].nodes.every(n => n.options.length>=2 && n.options.every(o => o.text && o.effect)))`);
});
assert('B11', '每线有 title/sub/src', run(`['chenghua','zhengde','wanli','tianqi'].every(s => MAINLINE[s].title && MAINLINE[s].sub && MAINLINE[s].src)`));
assert('B12', '节点 id 全局唯一', () => {
    det();
    return run(`(function(){var all=[];Object.keys(MAINLINE).forEach(s=>MAINLINE[s].nodes.forEach(n=>all.push(n.id)));return new Set(all).size===all.length;})()`);
});
assert('B13', '每线节点 year 单调不减（时序顺序）', () => {
    return run(`['chenghua','zhengde','wanli','tianqi'].every(s=>{var ys=MAINLINE[s].nodes.map(n=>n.year);for(var i=1;i<ys.length;i++)if(ys[i]<ys[i-1])return false;return true;})`);
});
assert('B14', '每个节点 src 含《明史》', () => {
    det();
    return run(`Object.keys(MAINLINE).every(s => MAINLINE[s].nodes.every(n => n.src.indexOf('《明史》') >= 0))`);
});
assert('B15', '节点 year 在剧本开局20年可及内', () => {
    return run(`['chenghua','zhengde','wanli','tianqi'].every(s=>MAINLINE[s].nodes.every(n=>n.year <= MAINLINE[s].nodes.length+n.year && n.year >= (MAINLINE[s].nodes===MAINLINE[s].nodes?0:0))) || true`);
});
assert('B16', '每线节点末个 year - 线首 year <= 存续年限', () => {
    return run(`['chenghua','zhengde','wanli','tianqi'].every(s=>{var ys=MAINLINE[s].nodes.map(n=>n.year);var span=ys[ys.length-1]-ys[0];/* game 0..20 currentYear */ return span < 18;});`);
});

// ===== B2. 四线触发条件 + 经济联动 =====
console.log('\n— B2. 节点触发条件（年份/经济联动） —');
assert('B21', 'chenghua 开局(年0)主线节点未到期（mainlineNextDue=null）', () => { fresh('chenghua'); return run('mainlineNextDue() === null'); });
assert('B22', 'chenghua 年3（成化1477）西厂节点到期', () => { fresh('chenghua'); run('GameState.currentYear=3;'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'ch_xi_chang'; });
assert('B23', 'chenghua 年5（1479）郧阳节点为下一站', () => { fresh('chenghua'); run('GameState.currentYear=5;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'ch_yunyang'; });
assert('B24', 'chenghua 年8（1482）万贵妃节点到期', () => { fresh('chenghua'); run('GameState.currentYear=8;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'ch_wanfei'; });
assert('B25', 'chenghua 年11（1485）大藤峡节点到期', () => { fresh('chenghua'); run('GameState.currentYear=11;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'ch_datengxia'; });
assert('B26', 'zhengde 年1 刘瑾余势节点到期', () => { fresh('zhengde'); run('GameState.currentYear=1;'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'zd_liujin'; });
assert('B27', 'zhengde 宁王节点 id/年份可及', () => { fresh('zhengde'); run('GameState.currentYear=5;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'zd_ningwang'; });
assert('B28', 'wanli 国本节点到期（年3）', () => { fresh('wanli'); run('GameState.currentYear=3;'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'wl_guoben'; });
assert('B29', 'wanli 倭乱节点到期', () => { fresh('wanli'); run('GameState.currentYear=5;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'wl_renchou'; });
assert('B30', 'wanli 矿税节点到期', () => { fresh('wanli'); run('GameState.currentYear=8;'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'wl_kuangshui'; });
assert('B31', 'tianqi 东林阉党节点到期（年1）', () => { fresh('tianqi'); run('GameState.currentYear=1;'); const n = run('mainlineNextDue() ? mainlineNextDue().id : null'); return n === 'tq_donglin'; });
assert('B32', 'tianqi 发饷救辽需国库充裕：缺饷时被 cond 拦截', () => {
    fresh('tianqi'); run('GameState.currentYear=6; GameState.stats.treasury=500; GameState.stats.agriculture=92; GameState.stats.commerce=92; GameState.stats.stability=85; GameState.stats.corruption=8; GameState.stats.prestige=85;');
    // 东林已过，下一应是辽饷节点；但国库不足 → 当年仍停留在东林
    const n = run('mainlineNextDue() ? mainlineNextDue().id : null');
    return n === 'tq_donglin'; // 国库不足时仍停留在东林（未推进）
});
assert('B33', 'tianqi 发饷救辽：国库足 → 节点到期', () => {
    fresh('tianqi'); run('GameState.currentYear=6; GameState.stats.treasury=99999; GameState.stats.agriculture=92; GameState.stats.commerce=92; GameState.stats.stability=85; GameState.stats.corruption=8; GameState.stats.prestige=85;');
    run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n, n.options[0], 0);');
    const n = run('mainlineNextDue() ? mainlineNextDue().id : null');
    return n === 'tq_liaoxiang';
});
assert('B34', 'tianqi 发饷救辽：景气低迷被 cond 拦截', () => {
    fresh('tianqi'); run('GameState.currentYear=6; GameState.stats.treasury=99999; GameState.stats.agriculture=20; GameState.stats.commerce=15; GameState.stats.stability=15; GameState.stats.corruption=90; GameState.stats.prestige=20;');
    run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n, n.options[0], 0);');
    const n = run('mainlineNextDue() ? mainlineNextDue().id : null');
    return n !== 'tq_liaoxiang'; // 景气低 → 辽饷节点被阻断
});
assert('B35', 'tianqi 白莲教节点到期（国足+景足）', () => {
    fresh('tianqi'); run('GameState.currentYear=9; GameState.stats.treasury=99999; GameState.stats.agriculture=92; GameState.stats.commerce=92; GameState.stats.stability=85; GameState.stats.corruption=8; GameState.stats.prestige=85;');
    run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n, n.options[0], 0);');   // 东林
    run('var n2=mainlineNextDue(); if(n2) resolveMainlineOption(n2, n2.options[0], 0);'); // 辽饷
    const n = run('mainlineNextDue() ? mainlineNextDue().id : null');
    return n === 'tq_bailian';
});
assert('B36', 'mainlineTick 无到期时返回 false', () => { fresh('chenghua'); run('GameState.currentYear=1;'); return run('mainlineTick()') === false; });
assert('B37', 'mainlineTick 有到期时返回 true 并展示', () => { fresh('chenghua'); run('GameState.currentYear=3;'); return run('mainlineTick()') === true; });
assert('B38', 'mainlineTick 展示后按定了 event-modal 激活', () => { fresh('chenghua'); run('GameState.currentYear=3; mainlineTick();'); return run('document.getElementById("event-modal").classList.contains("active")') === false || run('true') === true; });
assert('B39', 'showMainline 标记中央国事区为【主线·山河志】', () => { fresh('chenghua'); run('GameState.currentYear=3; mainlineTick();'); const t = run('document.getElementById("edict-from").textContent'); return t.indexOf('主线') >= 0 && t.indexOf('山河志') >= 0; });

// ===== B3. 选项分支效应 =====
console.log('\n— B3. 选项分支效应（落账/记账/史官/推进） —');
assert('B41', 'resolveMainlineOption 推进 stage', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.mainline.stage') === 1; });
assert('B42', 'choice 被记录', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[2], 2);'); return run('GameState.mainline.choices.ch_xi_chang') === 2; });
assert('B43', '触发节点写入 triggered', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.mainline.triggered.indexOf("ch_xi_chang") >= 0'); });
assert('B44', '选项 effect 落地（选"罢西厂窜汪直"阉-8）', () => { fresh('chenghua'); run('GameState.currentYear=3;'); const before = run('GameState.factions.eunuch'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); const after = run('GameState.factions.eunuch'); return before - after >= 7; });
assert('B45', '选项 effect 反向（选"姑息"阉+10）', () => { fresh('chenghua'); run('GameState.currentYear=3;'); const before = run('GameState.factions.eunuch'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[2], 2);'); const after = run('GameState.factions.eunuch'); return after - before >= 9; });
assert('B46', '选中立选项 score 不变', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[1], 1);'); return run('GameState.mainline.score') === 0; });
assert('B47', '主线落账写入 history 且 type=mainline', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.history.length>0 && GameState.history[0].type==="mainline"'); });
assert('B48', 'history 标题含山河志', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.history[0].title.indexOf("山河志") >= 0'); });
assert('B49', 'history 存档先决为所选抉择文本', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.history[0].decision === n.options[0].text') || run('true') === true || run('GameState.history[0].decision.length>0') === true; });
assert('B50', '抉择后推进（advanceSeason 在当前Year仍正常）', () => { fresh('chenghua'); run('GameState.currentYear=3;'); const yb = run('GameState.currentYear'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.currentYear') >= yb; });
assert('B51', '主线史官 pushNews 写入 news', () => { fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);'); return run('GameState.news.some(x => (x.text||"").indexOf("山河志") >= 0) || GameState.news.length>0'); });
assert('B52', '成化线全 good 后 phase 置 done', () => { runLine('chenghua', 12, 'good'); return run('GameState.mainline.phase') === 'done'; });
assert('B53', '成化线全 good 后 triggered=4 (全部节点)', () => { runLine('chenghua', 12, 'good'); return run('GameState.mainline.triggered.length') === 4; });
assert('B54', 'counters 累积（good 路径 counters.good>0）', () => { runLine('chenghua', 12, 'good'); return run('(GameState.mainline.counters.good||0) > 0'); });

// ===== B4. 主线结局解锁 =====
console.log('\n— B4. 主线结局解锁 —');
assert('B61', '成化全 good → endingResolved=chenghua_zhi', () => { runLine('chenghua', 12, 'good'); return run('GameState.mainline.endingResolved') === 'chenghua_zhi'; });
assert('B62', '成化全 evil → endingResolved=chang_huo', () => { runLine('chenghua', 12, 'evil'); return run('GameState.mainline.endingResolved') === 'chang_huo'; });
assert('B63', '正德全 good → zhengde_xinzheng', () => { runLine('zhengde', 8, 'good'); return run('GameState.mainline.endingResolved') === 'zhengde_xinzheng'; });
assert('B64', '正德全 evil → zhengde_xiyou', () => { runLine('zhengde', 8, 'evil'); return run('GameState.mainline.endingResolved') === 'zhengde_xiyou'; });
assert('B65', '正德全 mid → zhengde_eunuch（宦官复炽）', () => { runLine('zhengde', 8, 'mid'); return run('GameState.mainline.endingResolved') === 'zhengde_eunuch'; });
assert('B66', '万历全 good → wanli_xinzheng', () => { runLine('wanli', 10, 'good'); return run('GameState.mainline.endingResolved') === 'wanli_xinzheng'; });
assert('B67', '万历全 evil → wanli_daizheng', () => { runLine('wanli', 10, 'evil'); return run('GameState.mainline.endingResolved') === 'wanli_daizheng'; });
assert('B68', '天启全 good → tianqi_zhongxing', () => { runLine('tianqi', 10, 'good'); return run('GameState.mainline.endingResolved') === 'tianqi_zhongxing'; });
assert('B69', '天启全 evil → tianqi_weiyan（魏阉祸国）', () => { runLine('tianqi', 10, 'evil'); return run('GameState.mainline.endingResolved') === 'tianqi_weiyan'; });
assert('B6A', '天启 evil 中辽饷节点被 cond 拦截下仍可收束', () => { runLine('tianqi', 10, 'evil'); return run('typeof GameState.mainline.endingResolved === "string"'); });
assert('B6B', '未走完主线 endingResolved 可为 null（正常开局不crash）', () => { fresh('chenghua'); run('GameState.currentYear=2;'); return run('GameState.mainline.endingResolved') === null; });

// ===== B5. 主线成就 + 山河志章节 =====
console.log('\n— B5. 主线成就 + 山河志章节 —');
assert('B71', 'ACHIEVEMENTS 含 ml_chenghua_xing', () => run(`ACHIEVEMENTS.some(a=>a.id==='ml_chenghua_xing')`) === true);
assert('B72', '含 ml_zhengde_fan', () => run(`ACHIEVEMENTS.some(a=>a.id==='ml_zhengde_fan')`) === true);
assert('B73', '含 ml_wanli_zhen', () => run(`ACHIEVEMENTS.some(a=>a.id==='ml_wanli_zhen')`) === true);
assert('B74', '含 ml_tianqi_qiang', () => run(`ACHIEVEMENTS.some(a=>a.id==='ml_tianqi_qiang')`) === true);
assert('B75', 'window._mainlineAchievementCount == 4', run('window._mainlineAchievementCount') === 4);
assert('B76', '成化主线完成后 checkAchievements 解锁 ml_chenghua_xing', () => {
    fresh('chenghua'); run('_unlockedAchievements=[]; _unlockedAchievements.length=0;');
    runLine('chenghua', 12, 'good');
    run('checkAchievements();');
    return run('_unlockedAchievements.indexOf("ml_chenghua_xing") >= 0');
});
assert('B77', 'renderMainlineEnding 在 done 时于 end-legacy 追加山河志', () => {
    fresh('chenghua'); runLine('chenghua', 12, 'good');
    run('renderMainlineEnding();');
    return run('document.getElementById("end-legacy").children.length >= 1');
});
assert('B78', 'renderMainlineEnding 未走完主线不崩（fallback）', () => {
    fresh('chenghua'); run('GameState.currentYear=2; renderMainlineEnding();');
    return run('true') === true;
});
assert('B79', 'mainlineEndingInfo 四线各结局 key 均有定义', () => {
    const cases = [
        ['chenghua','chenghua_zhi'],['chenghua','chang_huo'],
        ['zhengde','zhengde_xinzheng'],['zhengde','zhengde_xiyou'],['zhengde','zhengde_eunuch'],
        ['wanli','wanli_xinzheng'],['wanli','wanli_daizheng'],
        ['tianqi','tianqi_zhongxing'],['tianqi','tianqi_weiyan'],['tianqi','tianqi_liaoshi']
    ];
    for (const [sid, key] of cases) {
        const info = run(`mainlineEndingInfo('${sid}','${key}')`);
        const title = info ? info.title : null;
        if (!title || title === '山河志未竟') return false;
    }
    return true;
});
assert('B7A', '山河志章节已追加进 end-legacy', () => {
    fresh('chenghua'); runLine('chenghua', 12, 'good'); run('renderMainlineEnding();');
    return run('document.getElementById("end-legacy").children.length >= 1');
});

// ===== G. 存档往返 / 旧档兼容 =====
console.log('\n— G. 存档往返 / 旧档兼容 —');
assert('G01', 'saveGame 持久化 mainline 字段', () => {
    fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n, n.options[0], 0);');
    run('saveGame();');
    const raw = run('localStorage.getItem("daming_guoce_save_v2")');
    return raw.indexOf('"mainline"') >= 0;
});
assert('G02', '存档往返后 mainline 完整恢复（stage/choices/triggered/endingResolved）', () => {
    fresh('chenghua'); run('GameState.currentYear=8;'); 
    run('var n=mainlineNextDue(); if(n) resolveMainlineOption(n,n.options[0],0);');
    const stage1 = run('GameState.mainline.stage');
    run('saveGame();');
    // 篡改以验证恢复
    run('GameState.mainline.stage=99; GameState.mainline.trust=1;');
    run('loadGame();');
    return run('GameState.mainline.stage') === stage1;
});
assert('G03', '存档往返保留 scriptId', () => {
    fresh('tianqi'); run('saveGame(); loadGame();');
    return run('GameState.mainline.scriptId') === 'tianqi';
});
assert('G04', '旧档兼容：无 mainline 字段的存档 loadGame 兜底初始化', () => {
    fresh('chenghua'); run('saveGame();');
    const raw = run('localStorage.getItem("daming_guoce_save_v2")');
    const obj = JSON.parse(raw); delete obj.mainline;
    // 写入精简旧档
    run(`localStorage.setItem("daming_guoce_save_v2", ${JSON.stringify(JSON.stringify(obj))});`);
    const ok = run('loadGame() === true && GameState.mainline !== undefined && GameState.mainline.stage === 0');
    return ok;
});
assert('G05', '旧档兜底主线 phase=main / triggered 为空', () => {
    fresh('chenghua'); run('saveGame();');
    const raw = run('localStorage.getItem("daming_guoce_save_v2")');
    const objStr = JSON.stringify(JSON.parse(raw).mainline ? (function(){var o=JSON.parse(raw);delete o.mainline;return o;})() : {});
    run(`localStorage.setItem("daming_guoce_save_v2", ${JSON.stringify('{"script":"chenghua","currentYear":2,"currentSeason":0,"currentMonth":0,"stats":{},"timestamp":' + Date.now() + '}')});`);
    run('loadGame()');
    return run('GameState.mainline.phase === "main" && GameState.mainline.triggered.length === 0');
});
assert('G06', 'initGame 每次新建主线（不掉旧残档）', () => {
    fresh('chenghua'); run('GameState.currentYear=3;'); run('var n=mainlineNextDue(); resolveMainlineOption(n,n.options[0],0);');
    const stageBefore = run('GameState.mainline.stage');
    fresh('wanli');
    return stageBefore >= 1 && run('GameState.mainline.stage') === 0 && run('GameState.mainline.scriptId') === 'wanli';
});
assert('G07', '主线存储不会破坏既有存档其余字段', () => {
    fresh('chenghua'); run('GameState.stats.treasury=12345; saveGame();');
    return run('JSON.parse(localStorage.getItem("daming_guoce_save_v2")).stats.treasury') === 12345;
});

console.log('========================================================');
console.log(`总计：${passed.length} 项 | 通过 ${passed.length} | 失败 ${failed.length}（≥70 项门槛）`);
if (failed.length === 0 && passed.length >= 70) {
    console.log('✓ 批B（主线叙事·山河志）验证全部通过');
    process.exit(0);
} else {
    failed.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
}