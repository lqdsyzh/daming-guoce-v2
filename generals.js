// ============================================
// 《大明国策》批P(v7.0) · 将星录（军事将领体系深挖）
// 将领从「一个名字」升级为「有血有肉的人」：
//   能力／忠诚／年龄／状态（在朝·外任·病·亡·反）
//   忠诚动态演算 → 低忠在外将拥兵自重、举兵反叛（需平叛）
//   赏赐（耗内帑）提忠、罢免（削威望+军心）
//   挂帅真正引用将领，能力影响三大营整饬成败与出征演算
// 史据：能力／忠诚／列传引文全部沿用 expedition.js 之 EXP_GENERALS，
//      各条出处均为《明史》（卷171 王越 / 卷195 王守仁 / 卷198 杨一清 /
//      卷238 李成梁·李如松·麻贵 / 卷250 孙承宗 / 卷259 熊廷弼·袁崇焕 / 卷271 满桂）。
//      表字／年龄／镇所为演绎性设定（正史有据者录，无确据者留空）。
// ============================================

// 将领家世补白（表字／年齿／主要镇戍方向；演绎性，不另立史据）
const GEN_ARCHIVE = {
    chenghua: {
        '王越':   { zi: '世昌', age: 40, base: '延绥' },
        '朱永':   { zi: '',     age: 40, base: '大同' },
        '赵辅':   { zi: '',     age: 50, base: '两广' }
    },
    zhengde: {
        '仇钺':   { zi: '',     age: 41, base: '宁夏' },
        '王守仁': { zi: '伯安', age: 34, base: '南赣' },
        '杨一清': { zi: '应宁', age: 52, base: '固原' }
    },
    wanli: {
        '李成梁': { zi: '汝契', age: 47, base: '辽东' },
        '李如松': { zi: '子茂', age: 24, base: '辽东' },
        '麻贵':   { zi: '',     age: 40, base: '大同' }
    },
    tianqi: {
        '孙承宗': { zi: '稚绳', age: 58, base: '蓟辽' },
        '熊廷弼': { zi: '飞百', age: 52, base: '辽东' },
        '袁崇焕': { zi: '元素', age: 37, base: '辽东' },
        '满桂':   { zi: '',     age: 40, base: '宣大' }
    }
};

const GEN_REBEL_LOYALTY = 45;   // 忠诚低于此值且在镇，有拥兵反叛之虞
const GEN_SICK_AGE = 64;        // 年过此，有衰病谢世之虞

// 将领状态层初始化（旧档缺失时兜底）
function initGeneralsState() {
    const id = (GameState.script && GameState.script.id) || 'chenghua';
    const list = [];
    try {
        const pool = (typeof EXP_GENERALS !== 'undefined' && EXP_GENERALS[id]) ? EXP_GENERALS[id] : [];
        pool.forEach(function (g) {
            const arch = (GEN_ARCHIVE[id] && GEN_ARCHIVE[id][g.name]) || {};
            list.push({
                name: g.name,
                zi: arch.zi || '',
                ability: g.ability,
                loyalty: g.loyalty,
                age: arch.age || 40,
                base: arch.base || '九边',
                status: '在朝',   // 在朝 / 外任 / 病 / 亡 / 反
                src: g.src || ''
            });
        });
    } catch (e) { }
    return { list: list, tick: 0, rebel: null, marshalAbility: 70 };
}

function ensureGeneralsState() {
    try {
        if (!GameState.generals) { GameState.generals = initGeneralsState(); }
        if (!GameState.generals.list) { GameState.generals.list = []; }
        if (GameState.generals.rebel === undefined) { GameState.generals.rebel = null; }
        if (GameState.generals.marshalAbility === undefined) { GameState.generals.marshalAbility = 70; }
    } catch (e) { }
}

function genRoster() {
    try { ensureGeneralsState(); return GameState.generals.list; } catch (e) { return []; }
}

function genFind(name) {
    try { return genRoster().find(function (g) { return g.name === name; }) || null; } catch (e) { return null; }
}

function genStatusName(g) {
    return { '在朝': '在朝', '外任': '在镇', '病': '卧病', '亡': '谢世', '反': '反叛' }[g.status] || g.status;
}

// 挂帅：引用将领能力，使三大营整饬／出征演算随之而变
function genMakeMarshal(name) {
    try {
        const g = genFind(name);
        if (!g) { pushNews('兵部', '此人不在将星录中，未可挂帅。', 'normal'); return; }
        if (g.status === '亡') { pushNews('兵部', `${g.name}已谢世，未可复用。`, 'danger'); return; }
        if (g.status === '反') { pushNews('兵部', `${g.name}已反，岂容再领兵。`, 'danger'); return; }
        if (g.status === '病') { pushNews('兵部', `${g.name}卧病，未可出征。`, 'normal'); return; }
        // 兼容旧 milOps.marshal（字符串），同时写入能力值
        if (GameState.milOps) {
            GameState.milOps.marshal = g.name;
            GameState.milOps.marshalAbility = g.ability;
        }
        if (GameState.generals) { GameState.generals.marshalAbility = g.ability; }
        // 已在镇者不重复记外任；在朝者转为外任
        if (g.status === '在朝') { g.status = '外任'; }
        pushNews('兵部', `${g.name}${g.zi ? '（字' + g.zi + '）' : ''}挂帅，节制三大营。将略${g.ability}，忠心${g.loyalty}。`, 'normal');
        renderScreen();
    } catch (e) { }
}

// 赏赐：耗内帑提忠（反叛者不可赎）
function genReward(name) {
    try {
        const g = genFind(name);
        if (!g) return;
        if (g.status === '反' || g.status === '亡') { pushNews('内帑', '此情不可用金银挽回。', 'danger'); return; }
        const purse = (GameState.stats.privyPurse !== undefined) ? GameState.stats.privyPurse : 0;
        if (purse < 500) { pushNews('内帑', '内帑不足以颁赏。', 'danger'); return; }
        GameState.stats.privyPurse -= 500;
        g.loyalty = Math.min(100, g.loyalty + 12);
        pushNews('内帑', `赐${g.name}内帑五百两，其心少安，忠心升至${g.loyalty}。`, 'normal');
        renderScreen();
    } catch (e) { }
}

// 罢免：削威望军心，令其还朝（反叛者诛之，见平叛）
function genDismiss(name) {
    try {
        const g = genFind(name);
        if (!g) return;
        if (g.status === '反' || g.status === '亡') return;
        if (g.status === '在朝') { pushNews('兵部', `${g.name}本在朝，无从罢免。`, 'normal'); return; }
        g.status = '在朝';
        g.loyalty = Math.max(5, g.loyalty - 15);
        GameState.stats.prestige = Math.max(0, GameState.stats.prestige - 2);
        if (GameState.factions.military !== undefined) GameState.factions.military = Math.max(0, GameState.factions.military - 3);
        if (GameState.milOps && GameState.milOps.marshal === g.name) GameState.milOps.marshal = null;
        pushNews('兵部', `夺${g.name}兵权还朝，朝野侧目。军心浮动，忠心降至${g.loyalty}。`, 'normal');
        renderScreen();
    } catch (e) { }
}

// 平叛：出师讨逆，耗军力饷银；或诛或赦
function genPutDown(mode) {
    try {
        const rb = GameState.generals && GameState.generals.rebel;
        if (!rb || !rb.name) { pushNews('兵部', '眼前并无反者。', 'normal'); return; }
        const g = genFind(rb.name);
        if (!g || g.status !== '反') { GameState.generals.rebel = null; return; }
        if ((GameState.stats.militaryPower || 0) < 15) { pushNews('兵部', '兵力不敷，无力讨逆。', 'danger'); return; }
        GameState.stats.militaryPower -= 12;
        GameState.stats.treasury = Math.max(0, GameState.stats.treasury - 800);
        if (mode === '赦') {
            g.status = '在朝';
            g.loyalty = Math.max(50, Math.min(70, g.loyalty + 10));
            GameState.stats.prestige = Math.min(100, GameState.stats.prestige + 4);
            pushNews('平叛', `${g.name}势穷归命，陛下贷其死，收兵还朝。军心安。`, 'normal');
        } else {
            g.status = '亡';
            GameState.stats.prestige = Math.min(100, GameState.stats.prestige + 6);
            pushNews('平叛', `${g.name}伏诛，传首九边，以儆效尤。威望大增。`, 'normal');
        }
        GameState.generals.rebel = null;
        renderScreen();
    } catch (e) { }
}

// 将星巡检（每季首月执行一轮）
function genTick() {
    try {
        ensureGeneralsState();
        if (GameState.currentMonth !== 0) return;   // 仅季首执行
        const st = GameState.generals;
        st.tick = (st.tick || 0) + 1;

        const morale = (GameState.factions.military !== undefined) ? GameState.factions.military : 60;
        const corruption = (GameState.stats.corruption !== undefined) ? GameState.stats.corruption : 40;

        st.list.forEach(function (g) {
            if (g.status === '亡' || g.status === '反' || g.status === '病') return;

            // 年龄增长（每季 0.25 岁，即一年一岁）
            g.age += 0.25;

            // 忠诚漂移：在朝者缓缓向皇恩回笼；在镇者受腐败军心侵蚀
            if (g.status === '在朝') {
                if (g.loyalty < 70) g.loyalty = Math.min(70, g.loyalty + 1);
            } else if (g.status === '外任') {
                const drift = (0.4 + corruption * 0.008) - (morale - 60) * 0.001;
                g.loyalty = Math.max(0, Math.round((g.loyalty - drift) * 10) / 10);
            }

            // 衰病谢世（老将且在外任／低忠更易）
            if (g.age > GEN_SICK_AGE && Math.random() < 0.015) {
                g.status = '病';
                pushNews('兵部', `${g.name}积劳成疾，卧病不起。`, 'normal');
                return;
            }

            // 拥兵反叛（低忠且在镇）
            if (g.status === '外任' && g.loyalty < GEN_REBEL_LOYALTY && !st.rebel) {
                const p = (GEN_REBEL_LOYALTY - g.loyalty) / 220;
                if (Math.random() < p) {
                    g.status = '反';
                    st.rebel = { name: g.name };
                    GameState.stats.prestige = Math.max(0, GameState.stats.prestige - 6);
                    GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 2);
                    GameState.stats.militaryPower = Math.max(0, GameState.stats.militaryPower - 8);
                    GameState.stats.stability = Math.max(0, GameState.stats.stability - 3);
                    if (GameState.factions.military !== undefined) GameState.factions.military = Math.max(0, GameState.factions.military - 5);
                    pushNews('肘腋之变', `镇边大将${g.name}拥兵自重，已举反旗！边镇动摇，须速平之。`, 'critical');
                }
            }
        });
    } catch (e) { }
}

// 将星录面板（挂到军事 tab 尾部）
function renderGenerals() {
    try {
        const list = genRoster();
        if (!list.length) return '';
        const st = GameState.generals;
        const rows = list.map(function (g) {
            const cls = { '在朝': '', '外任': 'gen-out', '病': 'gen-sick', '亡': 'gen-dead', '反': 'gen-rebel' }[g.status] || '';
            const marshalBtn = (g.status === '在朝' || g.status === '外任')
                ? `<button class="btn" onclick="genMakeMarshal('${g.name}')">挂帅</button>` : '';
            const rewardBtn = (g.status !== '亡' && g.status !== '反')
                ? `<button class="btn" onclick="genReward('${g.name}')">赏(内帑500)</button>` : '';
            const dismissBtn = (g.status === '外任')
                ? `<button class="btn" onclick="genDismiss('${g.name}')">罢免</button>` : '';
            return `<div class="gen-row ${cls}"><span class="gen-name">${g.name}${g.zi ? '<small>字' + g.zi + '</small>' : ''}</span>
                <span class="gen-meta">将略 <b>${g.ability}</b> · 忠心 <b>${Math.round(g.loyalty)}</b> · 年 ${Math.floor(g.age)} · ${genStatusName(g)}${g.base ? '（' + g.base + '）' : ''}</span>
                <span class="gen-ops">${marshalBtn}${rewardBtn}${dismissBtn}</span></div>`;
        }).join('');

        let rebelPart = '';
        if (st.rebel && st.rebel.name) {
            rebelPart = `<div class="gen-rebel-alert">⚠ 「${st.rebel.name}」已反，宜速征讨：
                <button class="btn" onclick="genPutDown('诛')">出师讨逆(军-12 饷-800)</button>
                <button class="btn" onclick="genPutDown('赦')">招抚赦免</button></div>`;
        }

        return `<div class="report-card"><div class="report-title">🌟 将星录</div>
            <div class="report-text">各镇名将，身系边陲安危。用人不疑则忠，猜忌寡恩则变。</div>
            ${rows}
            ${rebelPart}
            <div class="report-text"><i>列传引文逐条出自《明史》；表字、年齿、镇所为演绎设定。</i></div>
        </div>`;
    } catch (e) { return ''; }
}

// 样式（CSS 只追加，经运行时注入）
(function () {
    try {
        if (typeof document === 'undefined') return;
        if (document.getElementById('gen-style')) return;
        const st = document.createElement('style');
        st.id = 'gen-style';
        st.textContent = `
.gen-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 2px;border-bottom:1px solid rgba(120,96,56,.18);font-size:13px}
.gen-row:last-child{border-bottom:none}
.gen-name{font-weight:600;color:#4a2f10;min-width:120px}
.gen-name small{color:#8a6a3c;margin-left:4px;font-weight:400}
.gen-meta{color:#6b4f22;flex:1}
.gen-ops{display:flex;gap:4px}
.gen-out .gen-name{color:#1a5a2a}
.gen-sick{opacity:.7}
.gen-dead{opacity:.45;text-decoration:line-through}
.gen-rebel .gen-name,.gen-rebel .gen-meta{color:#a0261a;font-weight:700}
.gen-rebel-alert{background:rgba(160,38,26,.1);border:1px solid #a0261a;color:#8c1f14;padding:8px;border-radius:6px;margin-top:8px;font-size:13px}
.gen-rebel-alert .btn{margin-left:6px}`;
        document.head.appendChild(st);
    } catch (e) { }
})();

// 挂帅兼容：让旧硬编码按钮（李成梁等）也走将星录逻辑
try {
    const _milMarshal = (typeof milMarshal === 'function') ? milMarshal : null;
    milMarshal = function (name) {
        const g = genFind(name);
        if (g) { genMakeMarshal(name); return; }
        if (_milMarshal) { _milMarshal(name); }
    };
} catch (e) { }

console.log('✓ 批P(v7.0)·将星录加载完成');