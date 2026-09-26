#!/usr/bin/env node
/**
 * 《大明国策》批1 运行时冒烟测试
 * node vm + 极简 DOM mock，加载 index.html 引用的全部 js
 * 验证：核心对象存在 → 一局能推进 ≥4 季（含跨年岁末大计面板）不报错
 * 独立编写，仅借鉴"vm + DOM mock"测试模式，不含其他项目游戏代码
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = __dirname;

// ---------- 极简 DOM mock ----------
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
        removeEventListener(ev, fn) {
            const a = this.listeners[ev] || [];
            const i = a.indexOf(fn);
            if (i >= 0) a.splice(i, 1);
        },
        dispatch(ev, arg) {
            (this.listeners[ev] || []).forEach(fn => fn.call(this, arg || {
                preventDefault() {}, target: this, stopPropagation() {}, closest() { return null; }
            }));
        },
        appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
        removeChild(child) { const i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); },
        remove() { if (this.parentElement) this.parentElement.removeChild(this); },
        prepend(child) { this.children.unshift(child); child.parentElement = this; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; },
        click() { this.dispatch('click'); },
        focus() {}, blur() {},
        closest() { return null; },
        setAttribute() {}, getAttribute() { return null; },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(v) { this._innerHTML = v; this.children = []; }
    };
    return el;
}

// 按 index.html 的 id 预建元素；未知 id 动态创建（模拟浏览器动态 DOM）
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const elements = {};
ids.forEach(id => {
    const re = new RegExp(`<([a-zA-Z0-9]+)[^>]*id="${id}"`);
    const m = html.match(re);
    elements[id] = makeEl(id, m ? m[1] : 'div');
});

let dynSeq = 0;
const dynRegistry = {};

// ---------- 全局环境 mock ----------
const store = {};
localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; }
};

let domReady = null;
const winLoadFns = [];

document = {
    getElementById: id => {
        if (!elements[id]) { elements[id] = makeEl(id, 'div'); dynRegistry[id] = true; }
        return elements[id];
    },
    createElement: tag => makeEl('dyn_' + (++dynSeq), tag),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') domReady = fn; },
    removeEventListener() {},
    body: makeEl('body', 'body'),
    documentElement: makeEl('html', 'html'),
    title: '大明国策',
    hidden: false,
    visibilityState: 'visible'
};

window = {
    addEventListener(ev, fn) { if (ev === 'load') winLoadFns.push(fn); },
    removeEventListener() {},
    location: { href: '', reload() {}, search: '' },
    innerWidth: 1024, innerHeight: 768,
    navigator: { userAgent: 'node-smoke' },
    scrollTo() {},
    open() { return {}; },
    requestAnimationFrame: null
};
navigator = { userAgent: 'node-smoke', clipboard: { writeText: async () => {} } };
location = { href: '', reload() {} };
BroadcastChannel = class { constructor() {} postMessage() {} close() {} addEventListener() {} };
confirm = () => true;
alert = () => {};

class AudioContextMock {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; }
    createOscillator() {
        return {
            type: '', frequency: {
                value: 0, setValueAtTime() {}, linearRampToValueAtTime() {},
                exponentialRampToValueAtTime() {}
            },
            connect() {}, start() {}, stop() {}, disconnect() {}, onended: null
        };
    }
    createGain() {
        return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
    }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {}, disconnect() {}, onended: null }; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
}
AudioContext = AudioContextMock;
webkitAudioContext = AudioContextMock;
requestAnimationFrame = fn => setTimeout(fn, 0);
window.requestAnimationFrame = requestAnimationFrame;
getComputedStyle = () => ({ getPropertyValue: () => '' });
performance = { now: () => Date.now() };

// ---------- 按index.html 顺序加载全部脚本 ----------
const scriptRe = /<script src="([^"]+)"><\/script>/g;
const scriptFiles = [...html.matchAll(scriptRe)].map(m => m[1]);
if (scriptFiles.length === 0) {
    console.error('✗ index.html 中未找到任何 <script src>');
    process.exit(1);
}

const sandbox = {
    document, window, localStorage, navigator, location,
    BroadcastChannel, confirm, alert,
    AudioContext, webkitAudioContext,
    requestAnimationFrame, getComputedStyle, performance,
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    Date, Math, JSON,
    Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Promise,
    Set, Map, Symbol, parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent
};
sandbox.window.document = document;
sandbox.window.localStorage = localStorage;
sandbox.window.AudioContext = AudioContext;
sandbox.window.webkitAudioContext = webkitAudioContext;
sandbox.window.requestAnimationFrame = requestAnimationFrame;
vm.createContext(sandbox);

let failed = false;
function step(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) {
        failed = true;
        console.log(`  ✗ ${name}\n    ⚠ ${e.message}\n${String(e.stack).split('\n').slice(1, 4).join('\n')}`);
    }
}

console.log('='.repeat(56));
console.log('《大明国策》批1 运行时冒烟测试（node vm + DOM mock）');
console.log('='.repeat(56));

step(`1. 加载全部 ${scriptFiles.length} 个脚本（无语法/顶层异常）`, () => {
    scriptFiles.forEach(f => {
        const code = fs.readFileSync(path.join(DIR, f), 'utf8');
        vm.runInContext(code, sandbox, { filename: f });
    });
});

step('2. 核心对象存在（GameState/SCRIPTS/EVENTS/RESOURCES/FACTIONS）', () => {
    for (const name of ['GameState', 'SCRIPTS', 'EVENTS', 'RESOURCES', 'FACTIONS',
        'STABILITY_LEVELS', 'SEASONS', 'SoundFX', 'DamingSFX']) {
        if (vm.runInContext(`typeof ${name}`, sandbox) === 'undefined') {
            throw new Error(`核心对象缺失: ${name}`);
        }
    }
});

step('3. 音效管理器10种音效方法齐备（play case 覆盖）', () => {
    const names = ['click', 'season', 'urgent', 'decide', 'coin',
        'auspicious', 'disaster', 'ending', 'seal', 'step'];
    for (const n of names) {
        vm.runInContext(`DamingSFX.play('${n}')`, sandbox);
    }
});

step('4. DOMContentLoaded 触发初始化（脚本列表/挂载/解锁）', () => {
    if (domReady) domReady();
    else throw new Error('DOMContentLoaded 监听未注册');
});

step('5. 开局：initGame("chenghua") 正常', () => {
    vm.runInContext(`initGame('chenghua')`, sandbox);
    const ok = vm.runInContext(`GameState.script && GameState.script.id === 'chenghua'`, sandbox);
    if (!ok) throw new Error('initGame 后剧本未就绪');
});

step('6. 连续推进 51 tick（≥17季，跨4个岁末大计面板）不报错', () => {
    for (let i = 0; i < 51; i++) {
        vm.runInContext('advanceSeason()', sandbox);
    }
    const st = vm.runInContext(
        `JSON.stringify({ y: GameState.currentYear, s: GameState.currentSeason, d: GameState.decisionsCount })`,
        sandbox);
    console.log(`    → 推进后状态: ${st}`);
    if (vm.runInContext('GameState.currentYear < 4', sandbox)) {
        throw new Error('51 tick 后未跨满 4 个岁末');
    }
});

step('7. 岁末大计面板已生成（五步报告/章法/暂离）', () => {
    const ok = vm.runInContext(`
        (() => {
            if (!YE_STATE.report) return 'report缺失';
            if (YE_STEPS.length !== 5) return '步数!=5';
            if (typeof renderYearEndStep !== 'function') return 'render缺失';
            if (typeof closeYearEndReport !== 'function') return 'close缺失';
            if (typeof stampYearEndSeal !== 'function') return 'seal缺失';
            return 'OK';
        })()
    `, sandbox);
    if (ok !== 'OK') throw new Error(ok);
    // 走一遍五步 + 盖章 + 关闭
    vm.runInContext(`
        YE_STATE.step = 4;
        renderYearEndStep();
        stampYearEndSeal(document.getElementById('ye-seal-btn'));
        closeYearEndReport();
    `, sandbox);
});

step('8. 岁末账本已累计（income/expense 均有项）', () => {
    // 注意：第4个岁末已清零重记，此时应为第5年各季累计或空对象——只验证结构
    const ok = vm.runInContext(`
        (() => {
            const l = GameState.yearLedger;
            if (!l || typeof l !== 'object') return 'ledger缺失';
            if (!l.income || !l.expense) return 'income/expense缺失';
            return 'OK';
        })()
    `, sandbox);
    if (ok !== 'OK') throw new Error(ok);
});

step('9. 存档/读档往返（含批1锚点字段）', () => {
    vm.runInContext('saveGame()', sandbox);
    const ok = vm.runInContext('loadGame()', sandbox);
    if (!ok) throw new Error('loadGame 返回 false');
    const hasAnchor = vm.runInContext(
        `Array.isArray(GameState.factionsYearStart ? Object.keys(GameState.factionsYearStart) : null)`,
        sandbox);
    if (!hasAnchor) throw new Error('factionsYearStart 锚点缺失');
});

step('10. 移动端视图切换（setMobileView 四视图）', () => {
    for (const v of ['left', 'menu', 'right', 'center']) {
        vm.runInContext(`setMobileView('${v}')`, sandbox);
        const on = vm.runInContext(`document.body.classList.contains('mview-${v}')`, sandbox);
        if (!on) throw new Error(`mview-${v} 未生效`);
    }
});

step('11. 音效设置持久化（开关/音量）', () => {
    vm.runInContext(`
        DamingSFX.setEnabled(false);
        DamingSFX.setVolume(30);
        DamingSFX.setEnabled(true);
        DamingSFX.setVolume(75);
    `, sandbox);
    const raw = store['daming_sfx_settings'];
    if (!raw) throw new Error('daming_sfx_settings 未写入');
    const cfg = JSON.parse(raw);
    if (cfg.enabled !== true || cfg.volume !== 75) {
        throw new Error(`持久化值异常: ${raw}`);
    }
});

console.log('='.repeat(56));
if (failed) {
    console.log('✗ 冒烟测试存在失败项');
    process.exit(1);
} else {
    console.log('✓ 冒烟测试全部通过');
}
