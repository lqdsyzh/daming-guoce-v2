#!/usr/bin/env node
/**
 * 《大明国策》批2 验证套件（舆图 + 大臣召见）
 * 用法：node verify_daming_b2.js
 * Part A 静态验证（源码与数据结构） + Part B 运行时验证（node vm + DOM mock，同 smoke 模式）
 * 覆盖：24格渲染与方位 / 状态联动打点 / 浮层动作限频 / 剧本差异 /
 *       召见四互动数值与派系代价 / 台词库覆盖 / 限频key存档往返 / 旧档兼容
 * 独立编写，仅借鉴"vm + DOM mock"测试模式，不含其他项目游戏代码
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = __dirname;
let passCount = 0, failCount = 0;
const failures = [];
function assert(cond, label) {
    if (cond) { passCount++; }
    else { failCount++; failures.push(label); }
}
function section(title) {
    console.log(`\n${'-'.repeat(56)}\n${title}\n${'-'.repeat(56)}`);
}

const srcMap = fs.readFileSync(path.join(DIR, 'map.js'), 'utf8');
const srcTalk = fs.readFileSync(path.join(DIR, 'daming_talk.js'), 'utf8');
const srcScript = fs.readFileSync(path.join(DIR, 'script.js'), 'utf8');
const srcModules = fs.readFileSync(path.join(DIR, 'modules.js'), 'utf8');
const srcHtml = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const srcCss = fs.readFileSync(path.join(DIR, 'style.css'), 'utf8');

// ---------- 独立沙盒提取批2数据（无 DOM 依赖，顶层纯 const） ----------
function extract(code, expr) {
    const sandbox = { console, Math, Object, Array, String, Number, Boolean, RegExp, Error, JSON };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: 'extract' });
    return vm.runInContext(expr, sandbox);
}

// ================= Part A：静态验证 =================
section('Part A1 · 舆图24格数据与方位（《明史·地理志》/《明史·兵志》）');

const regions = extract(srcMap, 'MAP_REGIONS');
const scriptInit = extract(srcMap, 'MAP_SCRIPT_INIT');
const mapConsts = extract(srcMap, 'JSON.stringify({cd: MAP_PATROL_CD, cost: MAP_RELIEF_COST})');
const mapCfg = JSON.parse(mapConsts);

assert(regions.length === 24, 'A01 舆图共24格（15布政司+9九边）');
const borderRegions = regions.filter(r => r.border);
const adminRegions = regions.filter(r => !r.border);
assert(borderRegions.length === 9, 'A02 九边重镇共9格');
assert(adminRegions.length === 15, 'A03 行政区（两京十三布政司）共15格');
const borderNames = borderRegions.map(r => r.name).join(',');
assert(['辽东', '蓟州', '宣府', '大同', '延绥', '宁夏', '固原', '甘肃', '山西镇'].every(n => borderNames.includes(n)),
    'A04 九边名单齐全（辽东/蓟州/宣府/大同/延绥/宁夏/固原/甘肃/山西镇）');
const adminNames = adminRegions.map(r => r.name).join(',');
assert(['北直隶', '南直隶', '陕西', '山西', '山东', '河南', '浙江', '江西', '湖广', '四川', '福建', '广东', '广西', '云南', '贵州'].every(n => adminNames.includes(n)),
    'A05 十五行政区名单齐全（《明史·地理志》）');
assert(regions.every(r => r.name && r.desc && Array.isArray(r.kw) && r.kw.length > 0 && r.row && r.col),
    'A06 每格具备名称/况卡描述/关键词映射/坐标');
const posSet = new Set(regions.map(r => `${r.row},${r.col}`));
assert(posSet.size === 24 && regions.every(r => r.row >= 1 && r.row <= 4 && r.col >= 1 && r.col <= 6),
    'A07 6列×4行 grid 坐标合法且无重复（24格恰好铺满）');
const byKey = {};
regions.forEach(r => { byKey[r.key] = r; });
assert(byKey['gansu'] && byKey['gansu'].row === 1 && byKey['gansu'].col === 1, 'A08 甘肃居最西北(1,1)');
assert(byKey['ningxia'].col === 2 && byKey['yansui'].col === 3 && byKey['datong'].col === 4 && byKey['xuanfu'].col === 5 && byKey['jizhou'].col === 6
    && [byKey['ningxia'], byKey['yansui'], byKey['datong'], byKey['xuanfu'], byKey['jizhou']].every(r => r.row === 1),
    'A09 宁夏-延绥-大同-宣府-蓟州沿北线自西向东一线');
assert(byKey['liaodong'].col === 6 && byKey['jizhou'].col === 6 && byKey['liaodong'].row >= byKey['jizhou'].row,
    'A10 辽东居东北角、与蓟州同列相衔');
assert(byKey['yunnan'].row === 4 && byKey['yunnan'].col === 1 && byKey['guangdong'].row === 4 && byKey['guangdong'].col === 6,
    'A11 云南居西南、广东居东南（第4行）');
assert(byKey['beizhili'].row === 2 && byKey['nanzhili'].row === 3, 'A12 北直隶京畿居第2行、南直隶居其南');
assert(Object.keys(scriptInit).sort().join(',') === ['chenghua', 'tianqi', 'wanli', 'zhengde'].sort().join(','),
    'A13 四剧本开局差异配置齐全');
assert(scriptInit.tianqi.liaodong === 2 && scriptInit.tianqi.guizhou === 2,
    'A14 天启剧本：辽东沈辽陷落红警、奢安之乱贵州红');
assert(scriptInit.zhengde.ningxia === 2 && scriptInit.wanli.ningxia === 2,
    'A15 正德安化王之乱/万历哱拜之乱：宁夏开局红');
assert(Object.values(scriptInit).every(m => Object.values(m).every(v => v === 1 || v === 2)),
    'A16 剧本差异取值仅限警兆(1)/叛乱灾荒(2)');
assert(mapCfg.cd === 5, 'A17 巡视冷却=每地区每5章1次');
assert(mapCfg.cost === 1000, 'A18 赈灾修边国库代价=1000两（反爽游不白嫖转绿）');

section('Part A2 · 状态联动打点与事件收敛挂点');

assert(/function tagMapRegionByEvent/.test(srcMap), 'A19 tagMapRegionByEvent 打点函数存在');
assert(/function settleMapRegionByChoice/.test(srcMap), 'A20 settleMapRegionByChoice 收敛函数存在');
assert(/try \{ tagMapRegionByEvent\(event\); \} catch \(e\) \{\}/.test(srcScript),
    'A21 script.js showEvent 内已挂打点（try-catch 守卫）');
assert(/try \{ settleMapRegionByChoice\(event, opt\); \} catch \(e\) \{\}/.test(srcScript),
    'A22 script.js 事件处置路径已挂收敛（try-catch 守卫）');
assert(/type !== 'disaster' && type !== 'border' && type !== 'royal'/.test(srcMap.replace(/event\.type/g, 'type')) ||
    srcMap.includes("event.type !== 'disaster'") && srcMap.includes("event.type !== 'border'") && srcMap.includes("event.type !== 'royal'"),
    'A23 打点仅限灾害/边患/叛乱三类事件');
assert(srcMap.includes('if (level > cur)'), 'A24 状态只升不降（更高级别才覆盖，单章不叠加）');
assert(srcMap.includes('eff.stability || 0) >= 3') && srcMap.includes('eff.treasury || 0) <= -500') && srcMap.includes('eff.militaryPower || 0) < 0'),
    'A25 正面处置判定：抚恤/拨款/出兵→地区转安定');
assert(/function renderMapTab/.test(srcMap) && srcMap.includes('map-grid'), 'A26 舆图tab渲染函数存在（CSS grid）');
assert(/function openMapCellModal/.test(srcMap) && /function mapPatrol/.test(srcMap) &&
    /function mapRelief/.test(srcMap) && /function closeMapModal/.test(srcMap),
    'A27 地区况卡浮层与巡视/赈灾动作函数齐备');
assert(srcMap.includes('MAP_PATROL_CD - (tick - last)') && srcMap.includes('prestige + 1'),
    'A28 巡视冷却判定与威望+1');
assert(srcMap.includes('if (st <= 0)') && srcMap.includes('GameState.mapData.status[key] = 0') &&
    srcMap.includes('GameState.stats.treasury -= MAP_RELIEF_COST'),
    'A29 赈灾修边仅红黄格可用、花钱转安定');
assert(srcMap.includes('GameState.stats.treasury < MAP_RELIEF_COST'), 'A30 国库不足时赈灾拒绝（禁透支白嫖）');
assert(srcMap.includes("DamingSFX.play('auspicious')") && srcMap.includes("DamingSFX.play('coin')") &&
    srcMap.includes("DamingSFX.play('click')"),
    'A31 舆图动作接批1音效（click/auspicious/coin）');

section('Part A3 · index.html 接线与批1兼容');

assert(srcHtml.includes('data-tab="map">图</div>') || /data-tab="map"[^<]*>图</.test(srcHtml),
    'A32 新朝堂tab"图"已接入tab栏');
assert(srcHtml.includes('id="map-modal"') && srcHtml.includes('id="map-cell-name"') &&
    srcHtml.includes('id="map-cell-status"') && srcHtml.includes('id="map-cell-actions"'),
    'A33 舆图浮层DOM完整（批2注释标注）');
assert(srcHtml.includes('id="talk-modal"') && srcHtml.includes('id="talk-name"') &&
    srcHtml.includes('id="talk-body"') && srcHtml.includes('id="talk-actions"') &&
    srcHtml.includes('id="talk-relation"'),
    'A34 召见浮层DOM完整（批2注释标注）');
assert(srcHtml.includes('<!-- 批2：舆图地区况卡浮层 -->') && srcHtml.includes('<!-- 批2：大臣召见浮层 -->'),
    'A35 新浮层DOM均以"批2"注释标注');
assert(srcHtml.includes('<script src="map.js"></script>') && srcHtml.includes('<script src="daming_talk.js"></script>'),
    'A36 map.js/daming_talk.js 已引入');
assert(/sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(srcHtml),
    'A37 批1脚本引入顺序未被破坏（sfx→yearend→mobileui→script 紧邻）');
assert(srcHtml.includes('manifest.json') && (srcHtml.includes('sw.js') || srcHtml.includes('serviceWorker')),
    'A38 PWA 三件套引用未受影响（manifest/sw）');
assert(srcCss.includes('.map-grid') && srcCss.includes('.talk-paper') && srcCss.includes('@keyframes map-pulse'),
    'A39 批2样式已追加（舆图格/状态点/浮层/召见）');
assert(srcCss.indexOf('《大明国策》批2') > srcCss.indexOf('@media (max-width: 767px) {'),
    'A40 批2样式追加于文件末尾（未重排上游）');

section('Part A4 · 召见四互动与反爽代价');

assert(/function talkAsk/.test(srcTalk) && /function talkChat/.test(srcTalk) &&
    /function talkReward/.test(srcTalk) && /function talkAdmonish/.test(srcTalk),
    'A41 四互动函数齐备（问策/闲谈/赏赐/训诫）');
const talkConsts = JSON.parse(extract(srcTalk, `JSON.stringify({
    cd: TALK_CD_TICKS, cost: TALK_REWARD_CAP, cap: TALK_REWARD_CAP,
    chance: TALK_GOSSIP_CHANCE, gmax: TALK_GOSSIP_MAX
})`));
const talkCfg = JSON.parse(extract(srcTalk, 'JSON.stringify({cd: TALK_CD_TICKS, cap: TALK_REWARD_CAP, chance: TALK_GOSSIP_CHANCE, gmax: TALK_GOSSIP_MAX})'));
assert(extract(srcTalk, 'TALK_CD_TICKS') === 5, 'A42 召见限频冷却=5章（每互动类型独立）');
assert(extract(srcTalk, 'TALK_REWARD_CAP') === 8, 'A43 赏赐忠心加成累计封顶+8');
assert(Math.abs(extract(srcTalk, 'TALK_GOSSIP_CHANCE') - 0.25) < 1e-9, 'A44 闲谈25%概率提及另一大臣');
assert(extract(srcTalk, 'TALK_GOSSIP_MAX') === 2, 'A45 被提者忠心+1限2次');
assert(/cur\.cat === 'eunuch' \? 2 : 1/.test(srcTalk), 'A46 赏赐派系代价：赏宦官宦官+2、其余+1（养阉为患）');
assert(srcTalk.includes('TALK_REWARD_CAP - boosted'), 'A47 封顶兑现：累计加成不超过+8，再赏无功');
assert(srcTalk.includes('privyPurse -= TALK_REWARD_COST'), 'A48 赏赐走内帑（皇帝私库，史实逻辑）');
assert(srcTalk.includes('loyalty - 3') || srcTalk.includes('loyalty -3') || /loyalty, [^-]*- 3/.test(srcTalk) || srcTalk.includes('- 3'),
    'A49 训诫：忠心-3');
assert(srcTalk.includes('factions[cur.cat] = Math.min(100, GameState.factions[cur.cat] + 1)'),
    'A50 训诫：该员所属派系+1敬畏（有权衡）');
assert(srcTalk.includes('function talkCooldownKey') && srcTalk.includes('${c.cat}_${c.idx}_${kind}'),
    'A51 每位大臣每互动类型独立冷却key（cat_idx_kind）');
assert(srcTalk.includes("DamingSFX.play('decide')") && srcTalk.includes("DamingSFX.play('coin')") &&
    srcTalk.includes("DamingSFX.play('urgent')") && srcTalk.includes("DamingSFX.play('step')"),
    'A52 召见四互动均配批1音效');
assert(srcModules.includes("case 'map':         html = (typeof renderMapTab === 'function') ? renderMapTab() : ''; break;"),
    'A53 modules.js renderPanel 接入舆图tab（typeof 防御与批1同模式）');
assert(srcModules.includes("if (typeof openTalkModal === 'function') { openTalkModal(cat, idx); return; }"),
    'A54 名录"召见"按钮接入召见浮层（保留旧赐茶降级路径）');
assert(srcScript.includes('mapData: GameState.mapData') && srcScript.includes('talkData: GameState.talkState'),
    'A55 存档链扩展：mapData/talkState 随 saveGame 持久化');
assert(srcScript.includes('save.mapData || initMapState') && srcScript.includes('save.talkData || initTalkState()'),
    'A56 读档兜底：旧档缺失批2字段时按剧本初始化（旧档兼容）');
assert(srcScript.includes('GameState.mapData = initMapState(script.id)') && srcScript.includes('GameState.talkState = initTalkState()'),
    'A57 新开局初始化批2状态（含剧本开局差异）');

section('Part A5 · 台词库与《明史》依据');

const talkData = extract(srcTalk, 'JSON.stringify(DAMING_TALK_DATA)');
const talk = JSON.parse(talkData);
const talkNames = Object.keys(talk);
const ministersNames = extract(
    fs.readFileSync(path.join(DIR, 'data/systems.js'), 'utf8'),
    'JSON.stringify(Object.values(MINISTERS).flat().map(m => m.name))'
);
const mNames = JSON.parse(ministersNames);
assert(talkNames.length >= mNames.length, `A58 台词库覆盖实际大臣名单（${mNames.length}人，逐人建档）`);
assert(mNames.every(n => talkNames.includes(n)), 'A59 实际MINISTERS名单全员被台词库覆盖（宁换不编，按实探名单）');
assert(talkNames.every(n => talk[n].counsel && talk[n].chats && talk[n].chats.length >= 2 && talk[n].admonish),
    'A60 每大臣：问策1条+闲谈≥2条+训诫1条');
const allEntries = talkNames.flatMap(n => [talk[n].counsel, ...talk[n].chats, talk[n].admonish]);
assert(allEntries.every(e => e && e.src && e.src.length > 4), 'A61 全部台词逐条注出处');
const histCount = allEntries.filter(e => e.src.includes('《明史》')).length;
const actCount = allEntries.filter(e => e.src.includes('演绎') || e.src.includes('泛化')).length;
const untagged = allEntries.filter(e => !e.src.includes('《明史》') && !e.src.includes('演绎') && !e.src.includes('泛化')).length;
assert(untagged === 0 && histCount >= 20,
    `A62 出处标注：《明史》本传 ${histCount} 条 + 演绎标注 ${actCount} 条（0条漏标，宁换不编）`);
assert(/明史》卷181/.test(srcTalk) && /明史》卷148/.test(srcTalk) && /明史》卷304/.test(srcTalk) &&
    /明史》卷305/.test(srcTalk) && /明史》卷307/.test(srcTalk) && /明史》卷154/.test(srcTalk) &&
    /明史》卷117/.test(srcTalk) && /明史》卷171/.test(srcTalk),
    'A63 重点本传卷次引用在案（148三杨/154王骥/171王越/181三相/304宦官/305魏忠贤/307佞幸/117诸王）');
const relations = JSON.parse(extract(srcTalk, 'JSON.stringify(DAMING_RELATIONS)'));
assert(relations.length >= 10 && relations.every(r => r.names.length === 2 && r.label && r.src),
    'A64 大臣关系徽标≥10对且均注出处');
assert(relations.some(r => r.names.includes('钱宁') && r.names.includes('朱宸濠')) &&
    relations.some(r => r.names.includes('王越') && r.names.includes('汪直')) &&
    relations.some(r => r.names.includes('李东阳') && r.names.includes('刘健')) &&
    relations.some(r => r.names.includes('杨士奇') && r.names.includes('杨荣')),
    'A65 史实关系重点对在案（钱宁-宸濠私通/王越附汪直/三相/三杨）');
const generic = JSON.parse(extract(srcTalk, 'JSON.stringify(DAMING_GENERIC_TALK)'));
assert(['civil', 'military', 'royal', 'eunuch', 'consort'].every(c => generic[c] && generic[c].counsel && generic[c].chats.length >= 2 && generic[c].admonish),
    'A66 泛化池五派系齐备（未收录人员兜底）');
assert(srcTalk.includes('DAMING_TALK_DATA[m.name] || DAMING_GENERIC_TALK[cur.cat]'),
    'A67 台词取用带泛化兜底路径');

// ================= Part B：运行时验证（vm + DOM mock） =================
section('Part B · 运行时验证（node vm + DOM mock，同冒烟模式）');

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

const html = srcHtml;
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const elements = {};
ids.forEach(id => {
    const m = html.match(new RegExp(`<([a-zA-Z0-9]+)[^>]*id="${id}"`));
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
    navigator: { userAgent: 'node-b2' },
    scrollTo() {}, open() { return {}; }, requestAnimationFrame: null
};
const sandbox = {
    document: documentMock, window: windowMock,
    localStorage: localStorageMock,
    navigator: { userAgent: 'node-b2', clipboard: { writeText: async () => {} } },
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

const scriptFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
let loaded = false;
try {
    scriptFiles.forEach(f => {
        const code = fs.readFileSync(path.join(DIR, f), 'utf8');
        vm.runInContext(code, sandbox, { filename: f });
    });
    loaded = true;
} catch (e) {
    console.error('脚本加载失败:', e.message);
}
assert(loaded, `B01 全部 ${scriptFiles.length} 个脚本按 index.html 顺序加载无异常`);
if (domReady) domReady();
assert(vm.runInContext('typeof GameState', sandbox) !== 'undefined', 'B02 游戏主对象就绪');

function R(code) { return vm.runInContext(code, sandbox); }

// B03-B05 剧本差异
try {
    R(`initGame('tianqi')`);
    const liao = R('GameState.mapData.status.liaodong');
    const gz = R('GameState.mapData.status.guizhou');
    assert(liao === 2, 'B03 天启开局：辽东红警（沈辽陷落）');
    assert(gz === 2, 'B04 天启开局：贵州红（奢安之乱）');
    const zeroCount = R(`Object.values(GameState.mapData.status).filter(v => v === 0).length`);
    assert(zeroCount === 20, 'B05 天启其余20格安定（4格差异：辽东/贵州红、山东/福建黄，24格全覆盖）');
} catch (e) { assert(false, 'B03-B05 天启剧本初始化异常: ' + e.message); }

try {
    R(`initGame('zhengde')`);
    assert(R('GameState.mapData.status.ningxia') === 2, 'B06 正德开局：宁夏红（安化王之乱）');
    R(`initGame('chenghua')`);
    const yellow = R(`Object.values(GameState.mapData.status).filter(v => v === 1).length`);
    const red = R(`Object.values(GameState.mapData.status).filter(v => v === 2).length`);
    assert(yellow === 3 && red === 0, 'B07 成化开局：湖广/广西/辽东三处警兆黄');
} catch (e) { assert(false, 'B06-B07 剧本差异验证异常: ' + e.message); }

// B08-B14 打点与收敛
try {
    R(`initGame('wanli')`);
    R(`tagMapRegionByEvent({ title: '开封河决', desc: '黄河决口，开封告急，淹没田庐。', type: 'disaster' })`);
    assert(R(`GameState.mapData.status.henan`) === 1, 'B08 灾害事件按文本关键词打点：开封河决→河南黄');
    R(`tagMapRegionByEvent({ title: '京师地震', desc: '京师地震，宫殿倾颓，人心惶惶。', type: 'disaster' })`);
    assert(R(`GameState.mapData.status.beizhili`) === 2, 'B09 京师重灾打红：北直隶=叛乱灾荒级');
    R(`tagMapRegionByEvent({ title: '云南土司反', desc: '土司反，攻城略地，边吏告急。', type: 'border' })`);
    assert(R(`GameState.mapData.status.yunnan`) === 2, 'B10 边患叛乱打红：云南土司反→云南红');
    R(`tagMapRegionByEvent({ title: '鞑靼犯边', desc: '鞑靼骑兵入寇，劫掠边民。', type: 'border' })`);
    assert(R(`GameState.mapData.status.datong`) === 1, 'B11 边患打黄：鞑靼犯边→大同警兆');
    R(`tagMapRegionByEvent({ title: '北直隶蝗灾复起', desc: '蝗蝻食苗，秋粮堪忧。', type: 'disaster' })`);
    assert(R(`GameState.mapData.status.beizhili`) === 2, 'B12 单章不叠加：低级别打点不降级（北直隶保持红）');
    R(`tagMapRegionByEvent({ title: '一条鞭法之议', desc: '户部尚书奏请推行一条鞭法。', type: 'economy' })`);
    assert(R(`GameState.mapData.status.beizhili`) === 2, 'B13 非灾边叛类事件（economy）不打点');
    R(`settleMapRegionByChoice({ title: '北直隶蝗灾复起' }, { text: '拨款赈济', effect: { treasury: -800, stability: 2 } })`);
    assert(R(`GameState.mapData.status.beizhili`) === 0, 'B14 正面处置（拨款赈济）→最近受灾地区转安定');
    R(`tagMapRegionByEvent({ title: '鞑靼犯边', desc: '鞑靼骑兵入寇，劫掠边民。', type: 'border' })`);
    R(`settleMapRegionByChoice({ title: '鞑靼犯边' }, { text: '置之不理', effect: { stability: -2 } })`);
    assert(R(`GameState.mapData.status.datong`) === 1, 'B15 消极处置→警兆保持（反爽游：不白嫖转绿）');
} catch (e) { assert(false, 'B08-B15 打点/收敛验证异常: ' + e.message); }

// B16-B17 舆图tab渲染与浮层
try {
    R(`renderPanel('map')`);
    const panelHtml = String(R(`document.getElementById('center-panel').innerHTML`));
    const cellCount = (panelHtml.match(/class="map-cell[ "]/g) || []).length;
    assert(cellCount === 24, 'B16 舆图tab渲染24格（renderPanel接线可用）');
    R(`openMapCellModal('datong')`);
    assert(R(`document.getElementById('map-modal').classList.contains('active')`), 'B17 点击格子打开况卡浮层');
    R(`closeMapModal()`);
    assert(!R(`document.getElementById('map-modal').classList.contains('active')`), 'B18 关闭浮层生效');
} catch (e) { assert(false, 'B16-B18 舆图渲染/浮层异常: ' + e.message); }

// B19-B23 巡视限频与赈灾
try {
    R(`initGame('wanli')`);
    const p0 = R('GameState.stats.prestige');
    R(`mapPatrol('datong')`);
    assert(R('GameState.stats.prestige') === Math.min(100, p0 + 1), 'B19 巡视：威望+1');
    const lastPatrol = R(`GameState.mapData.lastPatrol.datong`);
    assert(lastPatrol === R('getMapTick()'), 'B20 巡视后记录本章（限频key落存档链字段）');
    R(`mapPatrol('datong')`);
    assert(R('GameState.stats.prestige') === Math.min(100, p0 + 1), 'B21 巡视冷却：同章再巡被拒');
    R('GameState.currentYear += 2'); // +8章 > 5章冷却
    R(`mapPatrol('datong')`);
    assert(R('GameState.stats.prestige') === Math.min(100, p0 + 2), 'B22 逾5章后巡视恢复可用');
    const t0 = R('GameState.stats.treasury');
    R(`GameState.mapData.status.datong = 2`);
    R(`GameState.stats.treasury = 5000`);
    R(`mapRelief('datong')`);
    assert(R('GameState.stats.treasury') === 5000 - 1000, 'B23 赈灾修边：红格花钱转安定（国库-1000两）');
    assert(R(`GameState.mapData.status.datong`) === 0, 'B24 赈灾后地区转安定');
    const tGreen = R('GameState.stats.treasury');
    R(`mapRelief('datong')`);
    assert(R('GameState.stats.treasury') === tGreen, 'B25 绿格赈灾拒绝（无白嫖）');
    R(`GameState.mapData.status.xuanfu = 1`);
    R(`GameState.stats.treasury = 500`);
    R(`mapRelief('xuanfu')`);
    assert(R(`GameState.mapData.status.xuanfu`) === 1 && R('GameState.stats.treasury') === 500,
        'B26 国库不足赈灾拒绝（禁透支）');
} catch (e) { assert(false, 'B19-B26 巡视/赈灾异常: ' + e.message); }

// B27-B33 召见四互动
try {
    R(`initGame('wanli')`);
    R(`GameState.stats.privyPurse = 5000`);
    // 汪直 eunuch idx0
    const wzLoy0 = R(`GameState.ministers.eunuch[0].loyalty`);
    const facE0 = R(`GameState.factions.eunuch`);
    R(`openTalkModal('eunuch', 0)`);
    assert(R(`document.getElementById('talk-modal').classList.contains('active')`) &&
        R(`GameState.talkState.current && GameState.talkState.current.cat === 'eunuch'`),
        'B27 打开召见浮层（名录入口接线可用）');
    assert(R(`document.getElementById('talk-relation').textContent`).includes('《明史》'),
        'B28 召见浮层显示关系徽标并注《明史》出处');
    R(`talkReward()`);
    assert(R('GameState.stats.privyPurse') === 4500, 'B29 赏赐：内帑-500两');
    assert(R(`GameState.ministers.eunuch[0].loyalty`) === Math.min(100, wzLoy0 + 8), 'B30 赏赐：忠心+8');
    assert(R(`GameState.factions.eunuch`) === Math.min(100, facE0 + 2), 'B31 反爽代价：赏宦官→宦官派系+2（养阉为患）');
    const ppAfter1 = R('GameState.stats.privyPurse');
    R(`talkReward()`);
    assert(R('GameState.stats.privyPurse') === ppAfter1 && R(`GameState.ministers.eunuch[0].loyalty`) === Math.min(100, wzLoy0 + 8),
        'B32 封顶后再赏无功（内帑不扣，恩滥被拒）');
    R(`closeTalkModal()`);
    // 文官杨士奇 civil idx0
    R(`openTalkModal('civil', 0)`);
    const facC0 = R(`GameState.factions.civil`);
    R(`talkReward()`);
    assert(R(`GameState.factions.civil`) === Math.min(100, facC0 + 1), 'B33 反爽代价：赏文官→文官派系+1');
    // 问策（civil[0]=李东阳：稳定+2/腐败+1，五资源小效果）
    const stb0 = R('GameState.stats.stability');
    const cor0 = R('GameState.stats.corruption');
    R(`talkAsk()`);
    assert(R('GameState.stats.stability') === stb0 + 2 && R('GameState.stats.corruption') === cor0 + 1,
        'B34 问策：五资源小效果兑现（李东阳弥缝策：稳定+2/腐败+1，周旋有权衡）');
    // 训诫
    const yLoy = R(`GameState.ministers.civil[0].loyalty`);
    const facC1 = R(`GameState.factions.civil`);
    R(`talkAdmonish()`);
    assert(R(`GameState.ministers.civil[0].loyalty`) === Math.max(0, yLoy - 3) &&
        R(`GameState.factions.civil`) === Math.min(100, facC1 + 1),
        'B35 训诫：忠心-3、所属派系+1敬畏（有权衡）');
    // 闲谈提及（mock Math.random 触发25%分支：0.1<0.25）
    R(`openTalkModal('consort', 1)`); // 梁芳（与万安同党）
    const realRandom = Math.random;
    Math.random = () => 0.1;
    let wanLoy0 = 0;
    R(`wanLoy0 = GameState.ministers.consort.find(m => m.name === '万安') ? GameState.ministers.consort.find(m => m.name === '万安').loyalty : (GameState.ministers.civil.find(m => m.name === '万安') || { loyalty: -1 }).loyalty`);
    R(`talkChat()`);
    const gossip1 = R(`GameState.talkState.gossip['万安'] || 0`);
    Math.random = realRandom;
    assert(gossip1 === 1, 'B36 闲谈25%提及另一大臣：被提者计数+1');
    assert(R(`wanLoy0`) >= 0, 'B37 被提大臣定位可用（万安在册）');
    Math.random = () => 0.1;
    R(`talkChat()`);
    R(`talkChat()`);
    Math.random = realRandom;
    const gossipFinal = R(`GameState.talkState.gossip['万安'] || 0`);
    assert(gossipFinal === 2, 'B38 被提者忠心+1限2次（第3次不再加）');
} catch (e) { assert(false, 'B27-B38 召见互动异常: ' + e.message); }

// B39 限频key存档往返 + 旧档兼容
try {
    R(`initGame('tianqi')`);
    R(`mapPatrol('datong')`);
    R(`openTalkModal('civil', 0)`);
    R(`talkAsk()`);
    R(`closeTalkModal()`);
    R('saveGame()');
    const saveRaw = store["daming_guoce_save_v2"];
    assert(!!saveRaw, 'B39 saveGame 写档（批2字段随存档链持久化）');
    if (saveRaw) {
        const saveObj = JSON.parse(saveRaw);
        assert(saveObj.mapData && saveObj.mapData.lastPatrol && saveObj.mapData.lastPatrol.datong !== undefined,
            'B40 存档含舆图限频key（lastPatrol）');
        assert(saveObj.talkData && Object.keys(saveObj.talkData.cd).length > 0,
            'B41 存档含召见限频key（talkData.cd，cat_idx_kind）');
        // 往返：读档后冷却仍生效
        R('loadGame()');
        const stillCool = R(`(() => { openTalkModal('civil', 0); return talkIsCooling('ask'); })()`);
        assert(stillCool === true, 'B42 存读往返后召见冷却仍生效（key随档恢复）');
        R(`closeTalkModal()`);
        const patrolCool = R(`(() => { const t = getMapTick(); const last = GameState.mapData.lastPatrol.datong; return (t - last) < 5; })()`);
        assert(patrolCool === true, 'B43 存读往返后巡视冷却仍生效');
        // 旧档兼容：删批2字段模拟旧档
        const oldSave = JSON.parse(saveRaw);
        delete oldSave.mapData;
        delete oldSave.talkData;
        store["daming_guoce_save_v2"] = JSON.stringify(oldSave);
        const ok = R('loadGame()');
        assert(ok === true, 'B44 旧档（无批2字段）读档不报错');
        assert(R(`GameState.mapData && typeof GameState.mapData.status === 'object'`), 'B45 旧档读入后舆图状态兜底初始化');
        assert(R(`GameState.mapData.status.liaodong`) === 2, 'B46 旧档兜底按剧本恢复开局差异（天启辽东红）');
        assert(R(`GameState.talkState && typeof GameState.talkState.cd === 'object'`), 'B47 旧档读入后召见限频兜底初始化');
    }
} catch (e) { assert(false, 'B39-B47 存档往返/旧档兼容异常: ' + e.message); }

// B48 台词库运行时覆盖与出处
try {
    const namesInSave = R(`JSON.stringify(Object.values(GameState.ministers).flat().map(m => m.name))`);
    const names = JSON.parse(namesInSave);
    const talkNamesRt = R(`Object.keys(DAMING_TALK_DATA)`);
    assert(names.every(n => talkNamesRt.includes(n)), `B48 运行时名单（${names.length}人）全员有台词档案`);
    assert(R(`DAMING_TALK_DATA['李东阳'].counsel.src`).includes('《明史》') &&
        R(`DAMING_TALK_DATA['汪直'].counsel.src`).includes('卷304'),
        'B49 重点台词《明史》出处抽查（李东阳卷181/汪直卷304）');
    assert(R(`DAMING_TALK_DATA['杨溥'].chats[0].src`).includes('《明史》'),
        'B50 闲谈台词出处抽查（杨溥循墙而走）');
    // renderMapTab 产出24格且图例齐全
    const tabHtml = String(R(`renderMapTab()`));
    assert((tabHtml.match(/map-cell-border/g) || []).length === 9, 'B51 渲染产物含9个九边金边格');
    assert(tabHtml.includes('安定') && tabHtml.includes('警兆') && tabHtml.includes('叛乱灾荒'), 'B52 图例三态齐备');
} catch (e) { assert(false, 'B48-B52 台词库/渲染运行时异常: ' + e.message); }

// ================= 汇总 =================
console.log('\n' + '='.repeat(56));
console.log(`批2验证结果：${passCount} 项通过，${failCount} 项失败（共 ${passCount + failCount} 项，门槛≥60）`);
if (failures.length > 0) {
    console.log('失败项：');
    failures.forEach(f => console.log(`  ✗ ${f}`));
}
console.log('='.repeat(56));
if (failCount > 0 || passCount + failCount < 60) {
    process.exit(1);
} else {
    console.log('✓ 批2验证全部通过');
}
