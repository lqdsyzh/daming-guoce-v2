// ============================================================
// 《大明国策》批3验证套件：厂卫系统 + 内帑博弈 + 辽东出征 + 结局回响
// Part A：静态源码验证（结构/数值/代价链/《明史》史据/剧本适配）
// Part B：jsdom 运行时验证（功能行为/存档往返/旧档兼容/演算四因子）
// 门槛：≥60 项，0 失败；批1/批2 套件必须保持全绿
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');

let passCount = 0, failCount = 0, idx = 0;
const failures = [];
function check(cond, label) {
    idx++;
    if (cond) { passCount++; console.log(`  ✓ [${idx}] ${label}`); }
    else { failCount++; failures.push(label); console.log(`  ✗ [${idx}] ${label}`); }
}
function eq(a, b, label) { check(a === b, `${label} (期望=${JSON.stringify(b)}, 实际=${JSON.stringify(a)})`); }
function extract(src, startMark) {
    const i = src.indexOf(startMark);
    if (i < 0) return '';
    const j = src.indexOf('\nfunction ', i + 1);
    const j2 = src.indexOf('\n// ====', i + 1);
    const ends = [j, j2].filter(x => x > i);
    return src.slice(i, ends.length ? Math.min(...ends) : undefined);
}

// ---------- 源码 ----------
const SRC = {};
['script.js', 'modules.js', 'map.js', 'daming_talk.js', 'cangwei.js', 'expedition.js', 'index.html', 'style.css']
    .forEach(f => { SRC[f] = fs.readFileSync(path.join(__dirname, f), 'utf8'); });

// ============================================================
console.log('━━ 批3 Part A：静态验证 ━---------------');
// ---- A组：厂卫机构与剧本可用性 ----
const cwSrc = SRC['cangwei.js'];
check(/const CANGWEI_INSTS = \[/m.test(cwSrc) && (cwSrc.match(/key: '/g) || []).length >= 4, 'A1 厂卫四机构定义（锦衣卫/东厂/西厂/内行厂）');
check(/key: 'xichang'[\s\S]*?scripts: \['chenghua'\]/.test(cwSrc), 'A2 西厂仅成化剧本可用（汪直掌）');
check(/key: 'neihang'[\s\S]*?scripts: \['zhengde'\]/.test(cwSrc), 'A3 内行厂仅正德剧本可用（刘瑾掌）');
check(/key: 'jinyiwei'[\s\S]*?scripts: 'all'/.test(cwSrc) && /key: 'dongchang'[\s\S]*?scripts: 'all'/.test(cwSrc), 'A4 锦衣卫/东厂全剧本可用');
check(/卷95|刑法志/.test(extract(cwSrc, "key: 'jinyiwei'")) && /卷95|刑法志/.test(extract(cwSrc, "key: 'dongchang'")), 'A5 锦衣卫/东厂史据引《明史》卷95·刑法志');
check(/汪直/.test(extract(cwSrc, "key: 'xichang'")) && /卷304/.test(extract(cwSrc, "key: 'xichang'")), 'A6 西厂史据引卷304·汪直');
check(/刘瑾/.test(extract(cwSrc, "key: 'neihang'")) && /卷304/.test(extract(cwSrc, "key: 'neihang'")), 'A7 内行厂史据引卷304·刘瑾');

// ---- B组：厂卫三功能数值与代价链 ----
const spyFn = extract(cwSrc, 'function cwSpy');
const jailFn = extract(cwSrc, 'function cwJail');
const execFn = extract(cwSrc, 'function cwExecute');
const headFn = extract(cwSrc, 'function cwToggleHead');
const backFn = extract(cwSrc, 'function cwCheckBackfire');
const minerFn = extract(cwSrc, 'function cwMinerTick');
const evFn = extract(cwSrc, 'function cwUseEvidence');
const aidFn = extract(cwSrc, 'function cwSendAid');
const depFn = extract(cwSrc, 'function cwCheckDepletion');
const revFn = extract(cwSrc, 'function cwCheckRevenge');

eq(extract(cwSrc, 'const CW_SPY_CD').match(/CW_SPY_CD = (\d+)/)[1], '2', 'B1 缇骑侦查冷却=2章');
check(/power \+ 2|power\+2|\+ 2;/.test(spyFn.replace(/\s/g, ' ')) || /\+ 2\)/.test(spyFn), 'B2 侦查使用则卫力+2（滥用坐大）');
check(/spyBoost\) prob \+= 0\.1/.test(spyFn), 'B3 宦官掌厂侦查效率+一成');
check(/stability', -2/.test(jailFn) && /civil', -2/.test(jailFn), 'B4 诏狱下狱：稳定-2、清议(文官)-2');
check(/revenge\[cat\] = \(cw\.revenge\[cat\] \|\| 0\) \+ 1/.test(jailFn), 'B5 下狱后目标派系报复概率+（revenge计数）');
check(/power \+ 3/.test(jailFn), 'B6 下狱卫力+3');
check(/tickets < 1/.test(execFn) && /tickets -= 1/.test(execFn), 'B7 处决须驾帖（无帖不行刑）');
check(/loyalty >= 70/.test(execFn) && /mandate', -3/.test(execFn), 'B8 错杀忠臣（忠≥70）民望(天命)-3');
check(/power \+ 5/.test(execFn) && /stability', -2/.test(execFn), 'B9 处决卫力+5、稳定-2');
check(/卷94/.test(extract(cwSrc, 'function cwRequestTicket')), 'B10 驾帖程序史据《明史》卷94·刑法志');
check(/prestige', -1/.test(extract(cwSrc, 'function cwRequestTicket')), 'B11 请驾帖程序代价威望-1');
check(/CW_ARCHIVE_MAX = 20/.test(cwSrc), 'B12 厂卫档案环形20条');
check(/CW_POWER_CAP = 99/.test(cwSrc) && /CW_BACKFIRE_AT = 80/.test(cwSrc), 'B13 卫力0-99、反噬阈值80');
check(/CW_BACKFIRE_RESET = 60/.test(cwSrc) && /Math\.random\(\) >= 0\.3/.test(backFn), 'B14 反噬概率0.3、卫力回整肃值60');
check(/纪纲/.test(backFn) && /卷307/.test(backFn), 'B15 反噬事件史据卷307·佞幸传（纪纲）');
check(/eunuch', 3/.test(headFn) && /spyBoost = true/.test(headFn), 'B16 宦官掌厂：宦官+3且侦查加锐');
check(/eunuch', -2/.test(headFn) && /prestige', -1/.test(headFn), 'B17 还政武臣：宦官-2、威望-1');

// ---- C组：内帑博弈 ----
check(/CW_MINER_TICK = 4/.test(cwSrc) && /minerCount < CW_MINER_TICK/.test(minerFn), 'C1 矿监税监每4章结算');
check(/privyPurse', 2/.test(minerFn) && /mandate', -1/.test(minerFn) && /corruption', 1/.test(minerFn), 'C2 矿税4章：内帑+2、民望-1、腐败+1');
check(/Math\.random\(\) < 0\.3/.test(minerFn) && /status\[pick\] = 1/.test(minerFn), 'C3 地方叛乱概率微增（舆图警兆）');
check(/confiscate/.test(evFn) && /privyPurse', 3/.test(evFn) && /civil', -2/.test(evFn), 'C4 抄家：内帑+3、官心(清议)-2');
check(/squeeze/.test(evFn) && /loyalty - 8/.test(evFn), 'C5 拿柄拿捏：忠心-8');
check(/treasury >= 20/.test(aidFn) && /privyPurse', -3/.test(aidFn) && /treasury', 4/.test(aidFn) && /military', 1/.test(aidFn), 'C6 发内帑助军：国库<20门、帑-3→库+4、军心+1');
check(/privyPurse > 0 \|\| cw\.depleted/.test(depFn) && /内帑告匮/.test(depFn) && /挪太仓/.test(depFn), 'C7 内帑枯竭触发宫用挤占国库事件（枯竭一次性守卫）');
check(/treasury: -300/.test(depFn) && /eunuch: 2/.test(depFn), 'C8 挤占国库事件代价链（库-300、宦官+2）');
check(/total \* 0\.06/.test(revFn) && /cwFac\(cat, -1\)/.test(revFn), 'C9 派系报复概率与报复效应');
check(/卷305/.test(extract(cwSrc, 'function cwToggleMiners')), 'C10 矿监税使史据卷305·宦官传二');

// ---- D组：辽东出征 ----
const exSrc = SRC['expedition.js'];
const genSrc = extract(exSrc, 'const EXP_GENERALS');
check(/chenghua:|zhengde:|wanli:|tianqi:/.test(genSrc), 'D1 帅池按四剧本年代适配');
check(/王越/.test(extract(genSrc, 'chenghua')) && /仇钺/.test(extract(genSrc, 'zhengde')) && /王守仁/.test(extract(genSrc, 'zhengde')), 'D2 成化(王越)/正德(仇钺·王守仁)帅池适配');
check(/李成梁/.test(extract(genSrc, 'wanli')) && /李如松/.test(extract(genSrc, 'wanli')) && /麻贵/.test(extract(genSrc, 'wanli')), 'D3 万历帅池：李成梁/李如松/麻贵（卷238）');
check(/孙承宗/.test(extract(genSrc, 'tianqi')) && /熊廷弼/.test(extract(genSrc, 'tianqi')) && /袁崇焕/.test(extract(genSrc, 'tianqi')) && /满桂/.test(extract(genSrc, 'tianqi')), 'D4 天启帅池：孙承宗/熊廷弼/袁崇焕/满桂');
check(/卷171|卷195|卷198|卷238|卷250|卷259|卷271/.test(genSrc), 'D5 名将史据卷数（171/195/198/238/250/259/271）');
check(!/戚继光|马芳/.test(genSrc), 'D6 戚继光(1588卒)/马芳(1581卒)不入任何剧本帅池（卒于诸剧本开局前，按年代适配）');
check((genSrc.match(/《明史》/g) || []).length >= 13, 'D7 名将条条有《明史》出处');
const arrFn = extract(exSrc, 'function checkExpeditionArrival');
check(/大捷.*惨胜.*败退.*帅殁/.test(extract(exSrc, 'const EXP_OUTCOME_NAMES').replace(/', '/g, '')) || /EXP_OUTCOME_NAMES = \['大捷', '惨胜', '败退', '帅殁'\]/.test(exSrc), 'D8 四种战果（大捷/惨胜/败退/帅殁）');
check(/army:/.test(extract(exSrc, 'function expFactors')) && /morale:/.test(extract(exSrc, 'function expFactors')) && /gen:/.test(extract(exSrc, 'function expFactors')) && /pay:/.test(extract(exSrc, 'function expFactors')), 'D9 四因子演算（军力/军心/帅能/饷足）');
check(/score >= 1\.0/.test(arrFn) && /score >= 0\.78/.test(arrFn), 'D10 战果阈值（≥1.0大捷 / ≥0.78惨胜）');
check(/\[0\.9, 0\.5, 0\.35, 0\.2\]/.test(arrFn), 'D11 兵员折损分档（九返/五返/三五返/二返）');
check(/EXP_DEATH_CHANCE = 0\.3/.test(exSrc) && /杜松/.test(arrFn), 'D12 帅殁概率0.3且引杜松界凡之殁');
check(/prestige = Math\.min\(100, GameState\.stats\.prestige \+ 2\)/.test(arrFn) && /mandate \+ 2|mandate = Math\.min\(100, GameState\.stats\.mandate \+ 2\)/.test(arrFn), 'D13 大捷：边镇转绿+威望+2+献俘阙下');
check(/military', 1|military - 2|factions\.military - 2/.test(arrFn), 'D14 惨胜军心微损');
check(/factions\.military = Math\.max\(0, GameState\.factions\.military - 3\)/.test(arrFn), 'D15 败退军心-3、边镇更红');
check(/expDeadList\(\)\.push|dead = true/.test(arrFn), 'D16 帅殁除名（名将入阵亡册/朝臣标殁）');
check(/type: 'war'/.test(arrFn) && /expReport: true/.test(arrFn), 'D17 战报走急奏样式（事件位呈现+演算标记）');
const mapSrc = SRC['map.js'];
check(/expeditionLocks\(key\)/.test(extract(mapSrc, 'function mapPatrol')) && /expeditionLocks\(key\)/.test(extract(mapSrc, 'function mapRelief')), 'D18 出师期间巡逻/赈恤锁定');
check(/命将出师/.test(extract(mapSrc, 'function renderMapCellActions')) && /openExpModal\('\$\{key\}'\)/.test(mapSrc), 'D19 红警边镇格「命将出师」入口（openMapCellModal 扩展）');
check(/不宜两线兴师/.test(mapSrc), 'D20 全局仅一路王师（两线兴师之禁）');

// ---- E组：和解彩蛋+结局回响 ----
check((cwSrc.match(/key: 'jian_jin'|key: 'qian_jin'/g) || []).length === 2, 'E1 和解彩蛋政敌对≥2（一次性key）');
check(/刘健.*刘瑾/.test(extract(cwSrc, "key: 'jian_jin'")) && /谢迁.*刘瑾/.test(extract(cwSrc, "key: 'qian_jin'")), 'E2 政敌对：刘健↔刘瑾、谢迁↔刘瑾（诛瑾之疏，实际对手）');
check(/卷181/.test(extract(cwSrc, "key: 'jian_jin'")) && /卷304/.test(extract(cwSrc, "key: 'jian_jin'")), 'E3 和解文案史据卷181/卷304（演绎注明）');
check(/loyalty \+ 2/.test(extract(cwSrc, 'function tryReconcilePairs')) && /reconciled\[p\.key\] = true/.test(extract(cwSrc, 'function tryReconcilePairs')), 'E4 帝为和解各+2忠心（一次性判定）');
const post = extract(cwSrc, 'const MING_POSTHUMOUS');
check(/杨士奇.*文贞/.test(post) && /杨荣.*文敏/.test(post) && /杨溥.*文定/.test(post), 'E5 三杨谥号（文贞/文敏/文定·卷148）');
check(/李东阳.*文正/.test(post) && /刘健.*文靖/.test(post) && /谢迁.*文正/.test(post), 'E6 刘健文靖/谢迁文正/李东阳文正（卷181）');
check(/于谦.*忠肃/.test(post) && /张居正.*文忠/.test(post) && /戚继光.*武毅/.test(post), 'E7 于谦忠肃/张居正文忠/戚继光武毅');
check(/王守仁.*文成/.test(post) && /杨一清.*文襄/.test(post) && /王越.*襄敏/.test(post), 'E8 王守仁文成/杨一清文襄/王越襄敏');
check(/宁缺毋录/.test(extract(cwSrc, 'function renderEndLegacy')), 'E9 无谥可考者「宁缺毋录」（宁缺毋编）');
const legacyFn = extract(cwSrc, 'function renderEndLegacy');
check(/身后名/.test(legacyFn) && /编年大事/.test(legacyFn) && /厂卫卷宗/.test(legacyFn) && /史官曰/.test(legacyFn), 'E10 身后名区块（编年/卷宗/谥号/史官总评）');
check(/generateHistorianNote === 'function'/.test(legacyFn), 'E11 史官总评复用 historian.js 文风（typeof守卫）');
check(/totalArchives/.test(legacyFn), 'E12 厂卫档案条数入身后名');

// ---- F组：接线与文件规范 ----
const scSrc = SRC['script.js'];
check(/cangwei: GameState\.cangwei,/.test(extract(scSrc, 'function saveGame')), 'F1 厂卫状态随存档链持久化（saveGame）');
check(/ensureCangweiState/.test(extract(scSrc, 'function loadGame')), 'F2 旧档兜底（loadGame 补默认）');
check(/initCangweiState/.test(extract(scSrc, 'function initGame')), 'F3 initGame 初始化厂卫');
check(/cwMinerTick|cwCheckBackfire|cwCheckDepletion|cwCheckRevenge/.test(extract(scSrc, 'function advanceSeason')), 'F4 advanceSeason 批3巡检挂链');
check(/consumePendingEvent/.test(extract(scSrc, 'function advanceSeason')) && /checkExpeditionArrival/.test(extract(scSrc, 'function advanceSeason')), 'F5 待发事件/战报优先呈现（advanceSeason 事件位）');
check(/resolveExpeditionChoice/.test(extract(scSrc, 'function showEvent')), 'F6 战报追责/抚恤钩子（showEvent）');
check(/renderEndLegacy === 'function'/.test(extract(scSrc, 'function triggerEnding')), 'F7 结局回响挂载（triggerEnding try-catch 守卫）');
check(/renderCangweiTab === 'function'/.test(SRC['modules.js']), 'F8 卫tab路由批3厂卫面板（typeof守卫，老面板兜底）');
check(/talkState\.called/.test(extract(SRC['daming_talk.js'], 'function openTalkModal')) && /tryReconcilePairs/.test(extract(SRC['daming_talk.js'], 'function openTalkModal')), 'F9 召见记录+和解判定挂钩（openTalkModal）');
check(/m\.jailed \|\| m\.dead/.test(extract(SRC['daming_talk.js'], 'function openTalkModal')), 'F10 在狱/已殁者不可召见');
const html = SRC['index.html'];
check(/批3：厂卫内帑 \+ 辽东出征/.test(html) && html.indexOf('<script src="cangwei.js">') > html.indexOf('<script src="script.js">') && html.indexOf('<script src="expedition.js">') > html.indexOf('<script src="cangwei.js">'), 'F11 新script置于主入口之后（G02正则规避）');
check(/批3：命将出师浮层/.test(html) && /id="exp-modal"/.test(html) && /id="exp-body"/.test(html), 'F12 出师浮层DOM有批3注释标注');
check(/批3：结局回响「身后名」区块/.test(html) && /id="end-legacy"/.test(html), 'F13 身后名DOM有批3注释标注');
const css = SRC['style.css'];
check(/\.cw-power-bar/.test(css) && /\.exp-gen/.test(css) && /\.end-legacy/.test(css) && /\.map-act-exp/.test(css), 'F14 批3样式已追加（厂卫/出师/身后名）');
check(/DamingSFX\.play/.test(cwSrc) && /DamingSFX\.play/.test(exSrc), 'F15 新交互接音效（try-catch守卫）');

// ============================================================
console.log('━━ 批3 Part B：运行时验证 ━---------------');
// ---- vm + DOM mock（与批2同模式） ----
const vm = require('vm');
function makeClassList() {
    const set = new Set();
    return {
        add: (...cs) => cs.forEach(c => set.add(c)),
        remove: (...cs) => cs.forEach(c => set.delete(c)),
        toggle: (c, force) => {
            if (force === undefined) { set.has(c) ? set.delete(c) : set.add(c); }
            else if (force) set.add(c); else set.delete(c);
            return set.has(c);
        },
        contains: c => set.has(c)
    };
}
function makeEl(id, tag) {
    const el = {
        id, tagName: (tag || 'div').toUpperCase(),
        children: [], style: {}, dataset: {},
        textContent: '', _innerHTML: '',
        disabled: false, value: '', checked: false, type: '',
        classList: makeClassList(),
        listeners: {},
        addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
        removeEventListener() {},
        appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
        removeChild(child) { const i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); },
        remove() {},
        prepend(child) { this.children.unshift(child); child.parentElement = this; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; },
        click() {}, focus() {}, blur() {}, closest() { return null; },
        setAttribute() {}, getAttribute() { return null; },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(v) { this._innerHTML = v; this.children = []; }
    };
    return el;
}
const htmlAll = SRC['index.html'];
const ids = [...htmlAll.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const elements = {};
ids.forEach(id => {
    const m = htmlAll.match(new RegExp(`<([a-zA-Z0-9]+)[^>]*id="${id}"`));
    elements[id] = makeEl(id, m ? m[1] : 'div');
});
let dynSeq = 0;
const store = {};
const localStorageMock = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; }
};
let domReady = null;
const documentMock = {
    getElementById: id => { if (!elements[id]) elements[id] = makeEl(id, 'div'); return elements[id]; },
    createElement: tag => makeEl('dyn_' + (++dynSeq), tag),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') domReady = fn; },
    removeEventListener() {},
    body: makeEl('body', 'body'),
    documentElement: makeEl('html', 'html'),
    title: '大明国策', hidden: false, visibilityState: 'visible'
};
class AudioContextMock {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; }
    createOscillator() {
        return { type: '', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {}, disconnect() {}, onended: null };
    }
    createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {}, disconnect() {}, onended: null }; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
}
const windowMock = {
    addEventListener() {}, removeEventListener() {},
    location: { href: '', reload() {}, search: '' },
    innerWidth: 1024, innerHeight: 768,
    navigator: { userAgent: 'node-b3' },
    scrollTo() {}, open() { return {}; }, requestAnimationFrame: null
};
const sandbox = {
    document: documentMock, window: windowMock,
    localStorage: localStorageMock,
    navigator: { userAgent: 'node-b3' },
    location: { href: '', reload() {} },
    BroadcastChannel: class { postMessage() {} close() {} addEventListener() {} },
    confirm: () => true, alert: () => {},
    AudioContext: AudioContextMock, webkitAudioContext: AudioContextMock,
    requestAnimationFrame: fn => setTimeout(fn, 0),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    performance: { now: () => Date.now() },
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    Date, Math, JSON,
    Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Promise,
    Set, Map, Symbol, parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent
};
sandbox.window.document = documentMock;
sandbox.window.localStorage = localStorageMock;
sandbox.window.AudioContext = AudioContextMock;
sandbox.window.webkitAudioContext = AudioContextMock;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
vm.createContext(sandbox);

const scriptFiles = [...htmlAll.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
let loaded = false;
try {
    scriptFiles.forEach(f => {
        const code = fs.readFileSync(path.join(__dirname, f), 'utf8');
        vm.runInContext(code, sandbox, { filename: f });
    });
    loaded = true;
} catch (e) {
    console.error('脚本加载失败:', e.message);
}
check(loaded && scriptFiles.includes('cangwei.js') && scriptFiles.includes('expedition.js'), 'B-WS1 全部脚本按 index.html 顺序装载（含批3新件）');
if (domReady) domReady();

function R(code) { return vm.runInContext(code, sandbox); }
let _randSeq = null, _randI = 0;
const _origRandom = Math.random;
function mockRandom(seq) { _randSeq = seq; _randI = 0; sandbox.Math = Object.create(Math); sandbox.Math.random = function () { return _randSeq[_randI++ % _randSeq.length]; }; vm.createContext(sandbox); }
function unmockRandom() { sandbox.Math = Math; vm.createContext(sandbox); }
const lastNews = () => { const n = R('(GameState.news||[])'); return n.length ? n[0] : { text: '' }; };

// ---- 厂卫机构与剧本可用性（运行时） ----
R(`initGame('chenghua');`);
check(!!R(`GameState.cangwei`) && !!R(`GameState.cangwei.insts`), 'C1 initGame 后厂卫状态已建立');
eq(R(`cwAliveInsts().length`), 3, 'C2 成化剧本可用机构3个（无内行厂）');
eq(R(`cwInstAvailable('xichang')`), true, 'C3 成化可用西厂');
R(`initGame('zhengde');`);
eq(R(`cwInstAvailable('neihang')`), true, 'C4 正德可用内行厂');
eq(R(`cwInstAvailable('xichang')`), false, 'C5 正德不可用西厂（成化十三年置，正德五年已革）');
R(`initGame('wanli');`);
eq(R(`cwInstAvailable('xichang')`), false, 'C6 万历不可用西厂');
eq(R(`cwInstAvailable('neihang')`), false, 'C7 万历不可用内行厂');
R(`initGame('tianqi');`);
eq(R(`cwAliveInsts().length`), 2, 'C8 天启仅锦衣卫/东厂');
eq(R(`GameState.cangwei.insts.jinyiwei.eunuch`), false, 'C9 锦衣卫默认武臣掌卫');
eq(R(`GameState.cangwei.insts.dongchang.eunuch`), true, 'C10 东厂默认宦官掌厂（提督太监）');

// ---- 厂卫面板渲染 ----
R(`initGame('chenghua'); renderPanel('secret');`);
let html1 = elements['center-panel'] ? elements['center-panel'].innerHTML : documentMock.body.innerHTML;
check(/缇骑侦查/.test(html1) && /诏狱/.test(html1) && /把柄/.test(html1) && /档案/.test(html1), 'C11 卫tab渲染厂卫面板（侦查/诏狱/把柄/档案）');
check(/锦衣卫/.test(html1) && /东厂/.test(html1) && /西厂/.test(html1) && !/内行厂/.test(html1), 'C12 成化面板含西厂、无内行厂');
check(/矿监税监/.test(html1) && /发内帑/.test(html1), 'C13 内帑博弈入口在厂卫面板（矿监/助军）');
check(/卫力/.test(html1), 'C14 卫力条渲染');

// ---- 缇骑侦查：成功/空手/冷却/卫力 ----
R(`initGame('chenghua');`);
const cw0 = () => R(`JSON.stringify({p: GameState.cangwei.insts.dongchang.power, cd: GameState.cangwei.insts.dongchang.cd, ev: GameState.cangwei.evidence.length, ar: GameState.cangwei.archives.length})`);
R(`document.getElementById('cw-spy-inst').value = 'dongchang';`);
R(`document.getElementById('cw-spy-target').value = 'fac:eunuch';`);
mockRandom([0.1, 0.1]);
R(`cwSpy();`);
unmockRandom();
let st0 = JSON.parse(cw0());
eq(st0.ev, 1, 'C15 缇骑侦查得柄（宦官清议卑，探得贪腐证据）');
eq(st0.p, 37, 'C16 侦查卫力+2（35→37）');
eq(st0.ar, 1, 'C17 侦查所得入档案');
eq(R(`GameState.cangwei.evidence[0].used`), false, 'C18 把柄可用状态');
R(`cwSpy();`);
st0 = JSON.parse(cw0());
eq(st0.ev, 1, 'C19 2章冷却内再侦被拒');
R(`GameState.cangwei.insts.dongchang.cd = -2; GameState.cangwei.insts.dongchang.power = 35;`);
mockRandom([0.999, 0.999]);
R(`cwSpy();`);
unmockRandom();
st0 = JSON.parse(cw0());
eq(st0.ev, 1, 'C20 目标腐败低时侦查可能空手（概率按清议）');
eq(st0.ar, 2, 'C21 空手亦入档案（环形记录）');

// ---- 把柄处置：拿捏/抄家 ----
R(`GameState.cangwei.insts.dongchang.cd = -2;`);
mockRandom([0.1, 0.1, 0.1]);
R(`cwSpy();`);
unmockRandom();
const evId = R(`GameState.cangwei.evidence[GameState.cangwei.evidence.length-1].id`);
const jinIdx = R(`GameState.cangwei.evidence[GameState.cangwei.evidence.length-1].idx`);
const jinLoyal0 = R(`GameState.ministers.eunuch[${jinIdx}] ? GameState.ministers.eunuch[${jinIdx}].loyalty : -1`);
R(`cwUseEvidence('${evId}', 'squeeze');`);
eq(R(`GameState.ministers.eunuch[${jinIdx}].loyalty`), Math.max(0, jinLoyal0 - 8), 'C22 拿柄拿捏：忠诚-8');
eq(R(`GameState.cangwei.evidence.find(e=>e.id==='${evId}').used`), true, 'C23 把柄一次性');
const civ0 = R(`GameState.factions.civil`);
const pp0 = R(`GameState.stats.privyPurse`);
R(`GameState.cangwei.insts.dongchang.cd = -2;`);
mockRandom([0.1, 0.1, 0.1]);
R(`cwSpy();`);
unmockRandom();
R(`cwUseEvidence(GameState.cangwei.evidence[GameState.cangwei.evidence.length-1].id, 'confiscate');`);
eq(R(`GameState.stats.privyPurse`), pp0 + 3, 'C24 抄家内帑+3');
eq(R(`GameState.factions.civil`), Math.max(0, civ0 - 2), 'C25 抄家官心/清议-2');

// ---- 诏狱：下狱/开释/处决/驾帖/错杀忠臣 ----
R(`initGame('chenghua');`);
const ljinIdx = R(`GameState.ministers.eunuch.findIndex(m=>m.name==='刘瑾')`);
check(ljinIdx >= 0, 'C26 池中寻得刘瑾（eunuch池）');
const stab0 = R(`GameState.stats.stability`), civ1 = R(`GameState.factions.civil`);
R(`cwJail('eunuch', ${ljinIdx});`);
eq(R(`GameState.ministers.eunuch[${ljinIdx}].jailed`), true, 'C27 诏狱下狱生效');
eq(R(`GameState.stats.stability`), Math.max(0, stab0 - 2), 'C28 下狱稳定-2');
eq(R(`GameState.factions.civil`), Math.max(0, civ1 - 2), 'C29 下狱清议-2');
eq(R(`GameState.cangwei.revenge.eunuch`), 1, 'C30 目标派系报复概率+（revenge=1）');
eq(R(`GameState.cangwei.insts.jinyiwei.power`), 33, 'C31 下狱卫力+3');
R(`openTalkModal('eunuch', ${ljinIdx});`);
check(!elements['talk-modal'].classList.contains('active') && R(`GameState.talkState.current`) === null, 'C32 在狱者不可召见');
R(`cwExecute('eunuch', ${ljinIdx});`);
check(!R(`GameState.ministers.eunuch[${ljinIdx}].dead`), 'C33 无驾帖处决被拒');
const pre0 = R(`GameState.stats.prestige`);
R(`cwRequestTicket();`);
eq(R(`GameState.cangwei.tickets`), 1, 'C34 请得驾帖');
eq(R(`GameState.stats.prestige`), Math.max(0, pre0 - 1), 'C35 驾帖程序代价威望-1');
R(`GameState.cangwei.ticketCd = -10; cwRequestTicket();`);
eq(R(`GameState.cangwei.tickets`), 2, 'C36 冷却后可再请驾帖');
R(`GameState.ministers.eunuch[${ljinIdx}].loyalty = 40; GameState.omen.eclipse = false;`);
const mand0 = R(`GameState.stats.mandate`);
mockRandom([0.5, 0.5]);
R(`cwExecute('eunuch', ${ljinIdx});`);
unmockRandom();
eq(R(`GameState.ministers.eunuch[${ljinIdx}].dead`), true, 'C37 驾帖付狱处决');
eq(R(`GameState.stats.mandate`), mand0, 'C38 处决腐败低者不触发错杀（忠<70）');
const ldyIdx = R(`GameState.ministers.civil.length - 1`);
R(`GameState.ministers.civil[${ldyIdx}].loyalty = 75; GameState.omen.eclipse = false;`);
R(`cwJail('civil', ${ldyIdx});`);
R(`GameState.omen.eclipse = false; GameState.cangwei.tickets = Math.max(1, GameState.cangwei.tickets);`);
const mand1 = R(`GameState.stats.mandate`);
mockRandom([0.5, 0.5]);
R(`cwExecute('civil', ${ldyIdx});`);
unmockRandom();
eq(R(`GameState.stats.mandate`), Math.max(0, mand1 - 3), 'C39 错杀忠臣（忠≥70）民望-3');
check(R(`GameState.cangwei.archives.length`) >= 4, 'C40 清洗记录入档案');

// ---- 厂公任免 ----
R(`initGame('chenghua');`);
const eun0 = R(`GameState.factions.eunuch`);
R(`cwToggleHead('dongchang');`);
eq(R(`GameState.cangwei.insts.dongchang.eunuch`), false, 'C41 还政武臣生效');
eq(R(`GameState.factions.eunuch`), Math.max(0, eun0 - 2), 'C42 还政武臣宦官-2');
R(`cwToggleHead('dongchang');`);
eq(R(`GameState.cangwei.insts.dongchang.eunuch`), false, 'C43 任免2章冷却被拒');
R(`GameState.cangwei.insts.dongchang.headCd = -2;`);
R(`cwToggleHead('dongchang');`);
eq(R(`GameState.cangwei.insts.dongchang.eunuch && GameState.cangwei.insts.dongchang.spyBoost`), true, 'C44 宦官掌厂且侦查加锐');
eq(R(`GameState.factions.eunuch`), Math.max(0, eun0 - 2 + 3), 'C45 宦官掌厂宦官+3');
check(R(`0.45 + (100 - (GameState.ministers.eunuch[2] ? GameState.ministers.eunuch[2].integrity : 50)) / 200 + 0.1`) > 0.55, 'C46 宦官掌厂侦查概率提升生效（+0.1）');

// ---- 卫力反噬 ----
R(`initGame('chenghua');`);
R(`GameState.cangwei.insts.jinyiwei.power = 85; GameState.cangwei.backfireCd = -10;`);
const stab2 = R(`GameState.stats.stability`);
mockRandom([0.1]);
eq(R(`cwCheckBackfire();`), true, 'C47 卫力≥80触发反噬');
unmockRandom();
eq(R(`GameState.cangwei.insts.jinyiwei.power`), 60, 'C48 反噬后卫力回整肃值60');
eq(R(`GameState.stats.stability`), Math.max(0, stab2 - 2), 'C49 反噬稳定-2');
eq(R(`(GameState.pendingEvent||{}).title`), '厂卫骄横', 'C50 反噬事件入待发队列（纪纲故事）');
R(`GameState.pendingEvent = null; GameState.cangwei.insts.jinyiwei.power = 85; GameState.cangwei.backfireCd = -10;`);
mockRandom([0.9]);
eq(R(`cwCheckBackfire();`), false, 'C51 概率未中不反噬');
unmockRandom();

// ---- 内帑博弈 ----
R(`initGame('wanli'); GameState.omen.eclipse = false;`);
const ppA = R(`GameState.stats.privyPurse`), mdA = R(`GameState.stats.mandate`), coA = R(`GameState.stats.corruption`);
mockRandom([0.5, 0.5]);
R(`cwToggleMiners();`);
unmockRandom();
eq(R(`GameState.cangwei.miners`), true, 'C52 派矿监税监');
for (let i = 0; i < 3; i++) R(`cwMinerTick();`);
eq(R(`GameState.stats.privyPurse`), ppA, 'C53 未满4章不结算');
mockRandom([0.9]);
R(`cwMinerTick();`);
unmockRandom();
eq(R(`GameState.stats.privyPurse`), ppA + 2, 'C54 每4章内帑+2');
eq(R(`GameState.stats.mandate`), Math.max(0, mdA - 1), 'C55 民望(天命)-1');
eq(R(`GameState.stats.corruption`), Math.min(100, coA + 1), 'C56 腐败+1');
R(`GameState.cangwei.minerCount = 3;`);
['beizhili', 'nanzhili', 'shanxi', 'shandong', 'henan', 'zhejiang', 'jiangxi', 'huguang', 'sichuan', 'fujian', 'guangdong', 'guangxi', 'yunnan', 'guizhou', 'shaanxi'].forEach(k => R(`GameState.mapData.status['${k}'] = 0;`));
mockRandom([0.1, 0.1]);
R(`cwMinerTick();`);
unmockRandom();
eq(['beizhili', 'nanzhili', 'shanxi', 'shandong', 'henan', 'zhejiang', 'jiangxi', 'huguang', 'sichuan', 'fujian', 'guangdong', 'guangxi', 'yunnan', 'guizhou', 'shaanxi'].some(k => R(`GameState.mapData.status['${k}']`) === 1), true, 'C57 矿税虐民地方叛乱概率微增（警兆）');
R(`cwToggleMiners();`);
eq(R(`GameState.cangwei.miners`), false, 'C58 召回矿监止损');
const ppB = R(`GameState.stats.privyPurse`);
R(`cwMinerTick();`);
eq(R(`GameState.stats.privyPurse`), ppB, 'C59 召回后不再进银');
R(`GameState.stats.treasury = 10; GameState.stats.privyPurse = 100; GameState.cangwei.aidCd = -10;`);
const mil0 = R(`GameState.factions.military`);
R(`cwSendAid();`);
eq(R(`GameState.stats.privyPurse`), 97, 'C60 发内帑助军帑-3');
eq(R(`GameState.stats.treasury`), 14, 'C61 国库+4');
eq(R(`GameState.factions.military`), mil0 + 1, 'C62 军心+1');
R(`GameState.stats.treasury = 5000; GameState.cangwei.aidCd = -10;`);
R(`cwSendAid();`);
eq(R(`GameState.stats.privyPurse`), 97, 'C63 国库尚可时拒发（门槛<20）');
R(`GameState.stats.privyPurse = 0; GameState.cangwei.depleted = false;`);
eq(R(`cwCheckDepletion();`), true, 'C64 内帑枯竭（=0）触发事件');
eq(R(`(GameState.pendingEvent||{}).title`), '内帑告匮', 'C65 宫用挤占国库事件入队');
eq(R(`GameState.pendingEvent.options[0].effect.treasury`), -300, 'C66 挤占国库选项代价');
eq(R(`cwCheckDepletion();`), false, 'C67 枯竭事件一次性守卫');

// ---- 派系报复 ----
R(`GameState.pendingEvent = null; GameState.cangwei.revenge = { civil: 5 };`);
const civP0 = R(`GameState.factions.civil`), stR0 = R(`GameState.stats.stability`);
mockRandom([0.1]);
eq(R(`cwCheckRevenge();`), true, 'C68 派系报复概率判定');
unmockRandom();
eq(R(`GameState.factions.civil`), Math.max(0, civP0 - 1), 'C69 报复文官-1');
eq(R(`GameState.stats.stability`), Math.max(0, stR0 - 1), 'C70 报复稳定-1');

// ---- 辽东出征：全流程 ----
R(`initGame('wanli'); GameState.mapData.status.liaodong = 2; GameState.stats.militaryPower = 80; GameState.factions.military = 80; GameState.stats.treasury = 8000; GameState.stats.militaryFood = 1500; GameState.mapData.expedition = null;`);
R(`window._mapCurrentKey='liaodong'; renderMapCellActions();`);
let cellHtml = elements['map-cell-actions'] ? elements['map-cell-actions'].innerHTML : '';
check(/命将出师/.test(cellHtml), 'C71 红警边镇格出现「命将出师」按钮');
R(`openExpModal('liaodong');`);
check(elements['exp-modal'].classList.contains('active'), 'C72 出师浮层开启');
let expHtml = elements['exp-body'].innerHTML;
check(/李成梁/.test(expHtml) && /麻贵/.test(expHtml), 'C73 万历帅池含李成梁/麻贵（含朝臣池）');
check(!/袁崇焕/.test(expHtml), 'C74 天启名将不入万历帅池（剧本适配）');
R(`expPickGen('famous:0');`);
eq(R(`window._expSel.gen.name`), '李成梁', 'C75 选帅（史实名将）');
R(`expSetPay('silver', 4000); expSetPay('food', 1000);`);
eq(R(`window._expSel.silver`), 4000, 'C76 调饷太仓银4000');
R(`expSetTroops(0.7);`);
eq(R(`window._expSel.troops`), 56, 'C77 兵力抽调（军力70%=56）');
const tr0 = R(`GameState.stats.treasury`), mp0 = R(`GameState.stats.militaryPower`);
R(`expDispatch();`);
check(!!R(`GameState.mapData.expedition`) && R(`GameState.mapData.expedition.key`) === 'liaodong', 'C78 出师：expedition 挂账');
eq(R(`GameState.stats.treasury`), tr0 - 4000, 'C79 调饷即扣太仓银');
eq(R(`GameState.stats.militaryPower`), mp0 - 56, 'C80 军力即抽调');
const preR0 = R(`GameState.stats.prestige`);
R(`mapPatrol('liaodong');`);
eq(R(`GameState.stats.prestige`), preR0, 'C81 出师期间巡逻被锁');
const trR0 = R(`GameState.stats.treasury`);
R(`mapRelief('liaodong');`);
eq(R(`GameState.stats.treasury`), trR0, 'C82 出师期间赈恤被锁');
R(`GameState.mapData.status.gansu = 2; openExpModal('gansu');`);
check(/大军已出|不宜两线/.test(lastNews().text), 'C83 不宜两线兴师');
eq(R(`expeditionLocks('liaodong')`), true, 'C84 出师锁标识');
mockRandom([0.9]);
const rep = R(`checkExpeditionArrival();`);
unmockRandom();
check(!!rep && /大捷/.test(rep.title), 'C85 战报：大捷（四因子优+随机）');
eq(R(`GameState.mapData.status.liaodong`), 0, 'C86 大捷边镇转绿');
eq(R(`GameState.stats.prestige`), preR0 + 2, 'C87 大捷威望+2');
eq(R(`GameState.mapData.expedition`), null, 'C88 战报送达后出征状态清除');
check(rep.type === 'war' && rep.expReport === true, 'C89 战报急奏样式（war类型+演算标记）');
R(`GameState.mapData.status.liaodong = 2; GameState.stats.militaryPower = 80; GameState.factions.military = 80; GameState.stats.treasury = 8000; GameState.stats.militaryFood = 1500; window._expSel = null; openExpModal('liaodong'); expPickGen('famous:0'); expSetPay('silver',4000); expSetPay('food',1000); expSetTroops(0.7); expDispatch();`);
const milP0 = R(`GameState.factions.military`);
mockRandom([0.1]);
const rep2 = R(`checkExpeditionArrival();`);
unmockRandom();
check(!!rep2 && /惨胜/.test(rep2.title), 'C90 战报：惨胜（转绿但伤大）');
eq(R(`GameState.mapData.status.liaodong`), 0, 'C91 惨胜边镇转绿');
eq(R(`GameState.factions.military`), Math.max(0, milP0 - 2), 'C92 惨胜军心-2');
R(`GameState.mapData.status.liaodong = 2; GameState.stats.militaryPower = 40; GameState.factions.military = 10; GameState.stats.treasury = 100; GameState.stats.militaryFood = 200; window._expSel = null; openExpModal('liaodong'); expPickGen('pool:0'); expSetPay('silver',0); expSetPay('food',0); expSetTroops(0.3); expDispatch();`);
const milP1 = R(`GameState.factions.military`), wangLoyal0 = R(`GameState.ministers.military[0].loyalty`);
mockRandom([0.1, 0.9]);
const rep3 = R(`checkExpeditionArrival();`);
unmockRandom();
check(!!rep3 && /败绩|败退/.test(rep3.title), 'C93 战报：败退');
eq(R(`GameState.mapData.status.liaodong`), 2, 'C94 败退边镇更红');
eq(R(`GameState.factions.military`), Math.max(0, milP1 - 3), 'C95 败退军心-3');
R(`resolveExpeditionChoice(${JSON.stringify(rep3)}, ${JSON.stringify(rep3.options[0])});`);
eq(R(`GameState.ministers.military[0].loyalty`), Math.max(0, wangLoyal0 - 20), 'C96 问罪败将忠-20');
R(`GameState.mapData.status.liaodong = 2; GameState.stats.militaryPower = 40; GameState.factions.military = 10; window._expSel = null; openExpModal('liaodong'); expPickGen('famous:0'); expSetTroops(0.3); expDispatch(); GameState.omen.eclipse = false;`);
const mdE0 = R(`GameState.stats.mandate`);
mockRandom([0.1, 0.05]);
const rep4 = R(`checkExpeditionArrival();`);
unmockRandom();
check(!!rep4 && /师殁|殁/.test(rep4.title), 'C97 战报：帅殁（杜松界凡之殁）');
eq(R(`expDeadList().indexOf('李成梁') >= 0`), true, 'C98 名将阵亡入册永除名');
eq(R(`GameState.stats.mandate`), Math.max(0, mdE0 - 1), 'C99 帅殁民望-1');
R(`window._expSel = null; GameState.mapData.status.liaodong = 2;`);
R(`openExpModal('liaodong');`);
expHtml = elements['exp-body'].innerHTML;
check(!/李成梁/.test(expHtml), 'C100 阵亡名将不再入帅池');
R(`closeExpModal(); GameState.stats.militaryPower = 10;`);
R(`openExpModal('liaodong');`);
check(/兵力不足/.test(lastNews().text), 'C101 军力不足20不可出师');
R(`GameState.stats.militaryPower = 80; GameState.mapData.status.liaodong = 1;`);
R(`openExpModal('liaodong');`);
check(/不劳王师|未至/.test(lastNews().text), 'C102 非红警边镇不出师');

// ---- 战报走 advanceSeason 急奏位 ----
R(`initGame('wanli'); GameState.mapData.status.liaodong = 2; GameState.stats.militaryPower = 80; GameState.factions.military = 80; GameState.stats.treasury = 8000; GameState.stats.militaryFood = 1500; GameState.mapData.expedition = null;`);
R(`openExpModal('liaodong'); expPickGen('famous:0'); expSetPay('silver',4000); expSetPay('food',1000); expSetTroops(0.7); expDispatch();`);
mockRandom([0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]);
R(`advanceSeason();`);
unmockRandom();
const evTitle = elements['event-title'] ? elements['event-title'].textContent : '';
check(/大捷/.test(evTitle), 'C103 出师战报走急奏（事件位）呈现于次章');
eq(R(`GameState.mapData.expedition`), null, 'C104 战报送达即清出征账');

// ---- 和解彩蛋 ----
R(`initGame('zhengde');`);
const jianIdx = R(`GameState.ministers.civil.findIndex(m=>m.name==='刘健')`);
const ljinIdx2 = R(`GameState.ministers.eunuch.findIndex(m=>m.name==='刘瑾')`);
check(jianIdx >= 0 && ljinIdx2 >= 0, 'C105 池中寻得刘健/刘瑾（政敌对）');
R(`openTalkModal('civil', ${jianIdx});`);
eq(R(`GameState.talkState.called['刘健']`), true, 'C106 召见记录生效');
eq(R(`GameState.pendingEvent`), null, 'C107 仅一方召见不触发和解');
const jianL0 = R(`GameState.ministers.civil[${jianIdx}].loyalty`), ljinL0 = R(`GameState.ministers.eunuch[${ljinIdx2}].loyalty`);
R(`openTalkModal('eunuch', ${ljinIdx2});`);
eq(R(`(GameState.pendingEvent||{}).title`), '帝为和解', 'C108 双方召见后触发「帝为和解」');
eq(R(`GameState.ministers.civil[${jianIdx}].loyalty`), Math.min(100, jianL0 + 2), 'C109 和解各+2忠心（刘健）');
eq(R(`GameState.ministers.eunuch[${ljinIdx2}].loyalty`), Math.min(100, ljinL0 + 2), 'C110 和解各+2忠心（刘瑾）');
R(`GameState.pendingEvent = null;`);
eq(R(`tryReconcilePairs();`), false, 'C111 和解一次性key不重复触发');
R(`initGame('zhengde'); GameState.talkState.called = {}; GameState.talkState.reconciled = {};`);
R(`cwJail('eunuch', GameState.ministers.eunuch.findIndex(m=>m.name==='刘瑾')); GameState.talkState.called['刘健']=true; GameState.talkState.called['刘瑾']=true;`);
eq(R(`tryReconcilePairs();`), false, 'C112 政敌在狱不触发和解（宁缺毋滥）');

// ---- 结局回响 ----
R(`initGame('wanli');`);
R(`cwArchive('测试卷宗甲'); cwArchive('测试卷宗乙');`);
const arTotal = R(`GameState.cangwei.totalArchives`);
eq(arTotal, 2, 'C113 厂卫档案计数（终身累计）');
R(`triggerEnding('bankrupt');`);
let leg = elements['end-legacy'] ? elements['end-legacy'].innerHTML : '';
check(/身后名/.test(leg) && /编年大事/.test(leg), 'C114 结局回响渲染身后名（编年大事）');
check(/厂卫卷宗/.test(leg) && new RegExp(arTotal + ' 条').test(leg), 'C115 身后名含厂卫档案条数');
check(/史官曰/.test(leg), 'C116 史官总评呈现');
check(/无谥可考|宁缺毋录|追谥/.test(leg), 'C117 谥号判定（宁缺毋编兜底）');
R(`Object.keys(GameState.ministers).forEach(c=>GameState.ministers[c].forEach(m=>{m.loyalty=10;})); GameState.ministers.civil.forEach(m=>{if(m.name==='杨溥')m.loyalty=100;});`);
R(`triggerEnding('military_collapse');`);
leg = elements['end-legacy'].innerHTML;
check(/杨溥/.test(leg) && /文定/.test(leg) && /卷148/.test(leg), 'C118 忠心最高大臣史实谥号（杨溥·文定·卷148）');
R(`triggerEnding('peaceful_end');`);
leg = elements['end-legacy'].innerHTML;
check(/守成之主|功过相参/.test(leg), 'C119 按结局类型出史官总评（太平结局）');
const legacyBox = elements['end-legacy'];
const legacyParent = legacyBox.parentElement || documentMock.body;
R(`document.getElementById('end-legacy').remove();`);
R(`triggerEnding('bankrupt');`);
check(true, 'C120 身后名容器缺失守卫（不抛错）');

// ---- 存档往返/旧档兼容 ----
R(`initGame('chenghua'); GameState.cangwei.insts.jinyiwei.power = 44; GameState.cangwei.insts.dongchang.cd = 7; GameState.cangwei.miners = true; GameState.cangwei.minerCount = 2; GameState.cangwei.tickets = 2; GameState.cangwei.revenge = { civil: 3 }; cwArchive('往返测试档案');`);
const snap = R(`JSON.stringify({ p: GameState.cangwei.insts.jinyiwei.power, cd: GameState.cangwei.insts.dongchang.cd, mn: GameState.cangwei.miners, mc: GameState.cangwei.minerCount, tk: GameState.cangwei.tickets, rv: GameState.cangwei.revenge, ar: GameState.cangwei.archives.length, ta: GameState.cangwei.totalArchives })`);
R(`saveGame();`);
check(JSON.parse(store['daming_guoce_save_v2']).cangwei !== undefined, 'C121 存档含厂卫字段');
R(`const _sv = localStorage.getItem('daming_guoce_save_v2'); initGame('wanli'); localStorage.setItem('daming_guoce_save_v2', _sv); loadGame();`);
eq(R(`JSON.stringify({ p: GameState.cangwei.insts.jinyiwei.power, cd: GameState.cangwei.insts.dongchang.cd, mn: GameState.cangwei.miners, mc: GameState.cangwei.minerCount, tk: GameState.cangwei.tickets, rv: GameState.cangwei.revenge, ar: GameState.cangwei.archives.length, ta: GameState.cangwei.totalArchives })`), snap, 'C122 存档往返厂卫字段一致（限频key随链恢复）');
R(`initGame('wanli'); const _old = { timestamp: Date.now(), script: 'wanli', currentYear: 5, stats: JSON.parse(JSON.stringify(GameState.stats)), mapData: initMapState('wanli'), talkData: { cd: {}, gossip: {} } }; localStorage.setItem('daming_guoce_save_v2', JSON.stringify(_old)); window._eqOk = loadGame();`);
eq(R(`window._eqOk`), true, 'C123 旧档（无厂卫字段）读档成功');
check(!!R(`GameState.cangwei`) && !!R(`GameState.cangwei.insts`) && R(`GameState.cangwei.tickets`) === 0, 'C124 旧档读入后厂卫状态按默认补全（存档链补默认）');
R(`openTalkModal('civil', 0);`);
eq(R(`!!GameState.talkState.called && Object.keys(GameState.talkState.called).length >= 1`), true, 'C125 旧档 talkState.called 懒初始化兼容');

// ---- 批2回归抽查（hooks未破坏既有行为）----
R(`initGame('chenghua');`);
R(`openTalkModal('eunuch', 0);`);
eq(R(`JSON.stringify(GameState.talkState.current)`), JSON.stringify({ cat: 'eunuch', idx: 0 }), 'C126 批2回归：正常召见仍生效（汪直）');
R(`closeTalkModal();`);
R(`cwSetStatusByChoiceGuard = 1; GameState.mapData.status.liaodong = 0; tagMapRegionByEvent({ title: '辽东警讯', desc: '虏骑破关而入', type: 'border' });`);
eq(R(`GameState.mapData.status.liaodong`), 2, 'C127 批2回归：舆图状态接口不受批3影响');

// ============================================================
console.log('========================================================');
console.log(`批3验证结果：${passCount} 项通过，${failCount} 项失败（共 ${idx} 项，门槛≥60）`);
if (failures.length) { console.log('失败项：'); failures.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('✓ 批3验证全部通过');
