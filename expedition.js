// ============================================
// 《大明国策》批3 · 辽东出征（九边命将出师）
// 史据：《明史》卷95·兵志九边 / 卷171·王越传 / 卷195·王守仁传 / 卷198·杨一清传 /
//      卷238·李成梁李如松麻贵传 / 卷250·孙承宗传 / 卷259·袁崇焕熊廷弼传 /
//      卷271·满桂传 / 萨尔浒杜松战殁（《明史》杜松传）
// 反爽铁律：调饷必出库、抽兵必损军力，四种战果皆有代价，绝不白嫖。
// ============================================

const EXP_PAY_SILVER = [0, 1000, 2000, 4000];   // 太仓银（即国库）
const EXP_PAY_FOOD = [0, 500, 1000];            // 军粮
const EXP_TROOP_RATIOS = [0.3, 0.5, 0.7];       // 军力抽调比例
const EXP_MIN_ARMY = 20;                        // 军力不足20不可出师
const EXP_DEATH_CHANCE = 0.3;                   // 败退演变为帅殁之概率（杜松故事）

// ---- 帅池（按剧本年代适配；卒于开局前者不入） ----
const EXP_GENERALS = {
    chenghua: [
        { name: '王越',   ability: 88, loyalty: 75, src: '《明史》卷171·王越传：红盐池之捷，两昼夜行八百里，捣其老营，获妇女驼马数十万。' },
        { name: '朱永',   ability: 76, loyalty: 70, src: '《明史》·朱永传：将门世胄，成化朝屡佩将军印，积功封保国公。' },
        { name: '赵辅',   ability: 70, loyalty: 65, src: '《明史》·赵辅传：成化初佩征蛮将军印，与都御史韩雍定大藤峡。' }
    ],
    zhengde: [
        { name: '仇钺',   ability: 74, loyalty: 70, src: '《明史》·仇钺传：正德五年安化王寘鐇反，钺阳附而阴为内应，遂擒寘鐇。' },
        { name: '王守仁', ability: 92, loyalty: 80, src: '《明史》卷195·王守仁传：宁王宸濠反，守仁躬率乌合之众，四十日而成擒。' },
        { name: '杨一清', ability: 85, loyalty: 75, src: '《明史》卷198·杨一清传：总制三边，练卒筑垒；后与太监张永合谋除刘瑾。' }
    ],
    wanli: [
        { name: '李成梁', ability: 90, loyalty: 65, src: '《明史》卷238·李成梁传：镇辽二十二年，先后奏大捷者十，师出必捷，威振绝域。' },
        { name: '李如松', ability: 88, loyalty: 70, src: '《明史》卷238·李如松传：提督蓟辽，平壤之战亲先士卒，倭大溃；后土蛮犯辽东，中伏力战死。' },
        { name: '麻贵',   ability: 82, loyalty: 65, src: '《明史》卷238·麻贵传：果毅骁捷，东西两镇并著威名，时称东李西麻。' }
    ],
    tianqi: [
        { name: '孙承宗', ability: 90, loyalty: 85, src: '《明史》卷250·孙承宗传：督师蓟辽，城宁远、复锦州，拓地二百里。' },
        { name: '熊廷弼', ability: 86, loyalty: 60, src: '《明史》卷259·熊廷弼传：守辽一年，部署甫定而经抚不和，身殁传首。' },
        { name: '袁崇焕', ability: 88, loyalty: 75, src: '《明史》卷259·袁崇焕传：宁远之役，偕满桂死守，发红夷炮却敌。' },
        { name: '满桂',   ability: 80, loyalty: 70, src: '《明史》卷271·满桂传：宁远被围，桂与崇焕死守，帝大喜，擢总兵官。' }
    ]
};

const EXP_OUTCOME_NAMES = ['大捷', '惨胜', '败退', '帅殁'];

// ---- 工具 ----
function expTick() {
    try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; }
}

// 出师期间：该边镇其他动作锁定
function expeditionLocks(key) {
    try {
        if (typeof GameState === 'undefined' || !GameState.mapData || !GameState.mapData.expedition) return false;
        return GameState.mapData.expedition.key === key;
    } catch (e) { return false; }
}

function expDeadList() {
    try {
        if (!GameState.mapData.expDead) GameState.mapData.expDead = [];
        return GameState.mapData.expDead;
    } catch (e) { return []; }
}

function expRegionName(key) {
    try {
        const r = (typeof MAP_REGIONS !== 'undefined') ? MAP_REGIONS.find(x => x.key === key) : null;
        return r ? r.name : key;
    } catch (e) { return key; }
}

// 帅池：剧本名将 + 军事大臣池（剔除下狱/阵亡者；名将亦剔除殁于王事者）
function expCandidates() {
    try {
        const out = [];
        const dead = expDeadList();
        (EXP_GENERALS[GameState.script ? GameState.script.id : 'chenghua'] || []).forEach((g, i) => {
            if (dead.indexOf(g.name) < 0) out.push({ key: 'famous:' + i, name: g.name, ability: g.ability, loyalty: g.loyalty, src: g.src, source: 'famous' });
        });
        const mil = (GameState.ministers && GameState.ministers.military) || [];
        mil.forEach((m, i) => {
            if (m.jailed || m.dead) return;
            out.push({ key: 'pool:' + i, name: m.name, ability: m.ability || 70, loyalty: m.loyalty || 60, src: '《明史》兵志：九边总兵之选，视其才望。', source: 'pool', cat: 'military', idx: i });
        });
        return out;
    } catch (e) { return []; }
}

// 四因子（0-1）：军力 / 军心 / 帅能（能力0.7+忠心0.3） / 饷足（太仓0.6+军粮0.4）
function expFactors(gen, silver, food, troops) {
    try {
        return {
            army: Math.min(1, troops / 45),
            morale: (GameState.factions.military || 0) / 100,
            gen: (gen.ability / 100) * 0.7 + (gen.loyalty / 100) * 0.3,
            pay: (silver / 4000) * 0.6 + (food / 1000) * 0.4
        };
    } catch (e) { return { army: 0, morale: 0, gen: 0, pay: 0 }; }
}

// ================= 出师浮层 =================
function openExpModal(key) {
    try {
        if (typeof GameState === 'undefined' || !GameState.mapData) return;
        const r = (typeof MAP_REGIONS !== 'undefined') ? MAP_REGIONS.find(x => x.key === key) : null;
        if (!r || !r.border) return;
        if ((GameState.mapData.status[key] || 0) !== 2) {
            pushNews('舆图', `${r.name}未至叛乱灾荒之境，不劳王师。`, 'normal');
            return;
        }
        if (GameState.mapData.expedition) {
            pushNews('舆图', '大军已出，不宜两线兴师。', 'normal');
            return;
        }
        if ((GameState.stats.militaryPower || 0) < EXP_MIN_ARMY) {
            pushNews('舆图', '京营边军凋敝，兵力不足，未可出师。', 'critical');
            return;
        }
        try { DamingSFX.play('urgent'); } catch (e) {}
        window._expSel = { key: key, gen: null, silver: 0, food: 0, troops: 0 };
        document.getElementById('exp-title').textContent = `命将出师 · ${r.name}`;
        document.getElementById('exp-subtitle').textContent = '选帅 → 调饷 → 抽兵 → 具本出师（战报以急奏呈递，下一章即到）';
        renderExpModal();
        document.getElementById('exp-modal').classList.add('active');
    } catch (e) {}
}

function closeExpModal() {
    try {
        document.getElementById('exp-modal').classList.remove('active');
        window._expSel = null;
    } catch (e) {}
}

function expPickGen(key) {
    try {
        if (!window._expSel) return;
        const c = expCandidates().find(x => x.key === key);
        if (!c) return;
        window._expSel.gen = { name: c.name, ability: c.ability, loyalty: c.loyalty, src: c.src, source: c.source, cat: c.cat, idx: c.idx };
        renderExpModal();
    } catch (e) {}
}

function expSetPay(kind, val) {
    try {
        if (!window._expSel) return;
        if (kind === 'silver') window._expSel.silver = val;
        else window._expSel.food = val;
        renderExpModal();
    } catch (e) {}
}

function expSetTroops(ratio) {
    try {
        if (!window._expSel) return;
        window._expSel.troops = Math.round((GameState.stats.militaryPower || 0) * ratio);
        renderExpModal();
    } catch (e) {}
}

function renderExpModal() {
    try {
        const sel = window._expSel;
        const body = document.getElementById('exp-body');
        if (!sel || !body) return;
        const cand = expCandidates();
        const genCards = cand.map(c => {
            const on = sel.gen && sel.gen.name === c.name;
            return `<div class="exp-gen ${on ? 'exp-gen-on' : ''}" onclick="expPickGen('${c.key}')">
                <b>${c.name}</b><span>能 ${c.ability} · 忠 ${c.loyalty}</span>
                <div class="exp-gen-src">${c.src}</div>
            </div>`;
        }).join('');
        const paySilver = EXP_PAY_SILVER.map(v =>
            `<button class="cw-btn exp-pay ${sel.silver === v ? 'exp-pay-on' : ''}" ${v > GameState.stats.treasury ? 'disabled' : ''} onclick="expSetPay('silver',${v})">太仓银 ${v}</button>`
        ).join('');
        const payFood = EXP_PAY_FOOD.map(v =>
            `<button class="cw-btn exp-pay ${sel.food === v ? 'exp-pay-on' : ''}" ${v > GameState.stats.militaryFood ? 'disabled' : ''} onclick="expSetPay('food',${v})">军粮 ${v}</button>`
        ).join('');
        const troops = EXP_TROOP_RATIOS.map(r => {
            const n = Math.round((GameState.stats.militaryPower || 0) * r);
            const on = sel.troops === n && n > 0;
            return `<button class="cw-btn exp-pay ${on ? 'exp-pay-on' : ''}" onclick="expSetTroops(${r})">抽军 ${n}（${Math.round(r * 100)}%）</button>`;
        }).join('');
        let factorHtml = '';
        if (sel.gen) {
            const f = expFactors(sel.gen, sel.silver, sel.food, sel.troops);
            factorHtml = `<div class="exp-factor">四因子预估——军力 ${(f.army * 100).toFixed(0)} · 军心 ${(f.morale * 100).toFixed(0)} · 帅能 ${(f.gen * 100).toFixed(0)} · 饷足 ${(f.pay * 100).toFixed(0)}</div>`;
        }
        const ready = sel.gen && sel.troops > 0;
        body.innerHTML = `
            <h4 class="exp-sec">一、选帅（名将视年代在册）</h4>
            <div class="exp-gens">${genCards}</div>
            <h4 class="exp-sec">二、调饷（太仓银+军粮，二选一或并用；足饷者胜算高）</h4>
            <div class="exp-pay-row">${paySilver}</div>
            <div class="exp-pay-row">${payFood}</div>
            <h4 class="exp-sec">三、兵力调度（即抽即减，师还按战果补员）</h4>
            <div class="exp-pay-row">${troops}</div>
            ${factorHtml}
            <div class="exp-dispatch-row">
                <button class="cw-btn cw-btn-danger" onclick="expDispatch()" ${ready ? '' : 'disabled'}>具本出师</button>
                <span class="exp-hint">饷随本发（即刻出库），师期一章。</span>
            </div>`;
    } catch (e) {}
}

// 具本出师：即刻扣饷抽兵，出师期间锁该边镇，次章战报以急奏呈递
function expDispatch() {
    try {
        const sel = window._expSel;
        if (!sel || !sel.gen || sel.troops <= 0) return;
        if (GameState.mapData.expedition) return;
        if (sel.silver > GameState.stats.treasury || sel.food > GameState.stats.militaryFood) return;
        GameState.stats.militaryPower = Math.max(0, GameState.stats.militaryPower - sel.troops);
        GameState.stats.treasury -= sel.silver;
        GameState.stats.militaryFood -= sel.food;
        GameState.mapData.expedition = {
            key: sel.key, gen: sel.gen, silver: sel.silver, food: sel.food,
            troops: sel.troops, tick: expTick()
        };
        pushNews('兵部', `命${sel.gen.name}率师${expRegionName(sel.key)}，调太仓银${sel.silver}、军粮${sel.food}，抽军${sel.troops}。`, 'critical');
        try { DamingSFX.play('urgent'); } catch (e) {}
        // 批C：出师进阶为战棋/回合制实战——即刻列阵（军需逐合焚烧，反爽游）
        if (typeof bfStart === 'function') {
            const r = bfStart({ mode: 'expedition', regionKey: sel.key, regionName: expRegionName(sel.key),
                                gen: sel.gen, troops: sel.troops, silver: sel.silver, food: sel.food, kind: 'beilu' });
            if (r && r.ok) { try { bfOpen(); } catch (e) {} }
        }
        closeExpModal();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}

// ================= 战报演算（advanceSeason 事件位调用；走急奏样式） =================
function checkExpeditionArrival() {
    try {
        if (typeof GameState === 'undefined' || !GameState.mapData || !GameState.mapData.expedition) return null;
        // 批C：若出师战场尚未由玩家手战收束（未打完即过季），则弃战/按旧例演算兜底
        if (typeof bfAbandonIfIdle === 'function') bfAbandonIfIdle('expedition');
        const exp = GameState.mapData.expedition;
        GameState.mapData.expedition = null;
        const rname = expRegionName(exp.key);
        const gen = exp.gen;
        const f = expFactors(gen, exp.silver, exp.food, exp.troops);
        const base = 0.3 * f.army + 0.2 * f.morale + 0.25 * f.gen + 0.25 * f.pay;
        const score = base + Math.random() * 0.3;
        let outcome;   // 0大捷 1惨胜 2败退 3帅殁
        if (score >= 1.0) outcome = 0;
        else if (score >= 0.78) outcome = 1;
        else {
            outcome = 2;
            if (Math.random() < EXP_DEATH_CHANCE) outcome = 3;
        }
        // 兵员折损：师还补员按战果（大捷九返、惨胜五返、败退三五返、帅殁二返）
        const refund = [0.9, 0.5, 0.35, 0.2][outcome];
        GameState.stats.militaryPower = Math.min(100, GameState.stats.militaryPower + Math.round(exp.troops * refund));
        let title = '', desc = '', options = [];
        if (outcome === 0) {
            GameState.mapData.status[exp.key] = 0;
            GameState.stats.prestige = Math.min(100, GameState.stats.prestige + 2);
            GameState.stats.mandate = Math.min(100, GameState.stats.mandate + 2);
            title = `${rname}大捷`;
            desc = `${gen.name}提兵出塞，大破虏众，斩馘盈万，俘其名王而还。露布驰阙，献俘庙社，都人聚观，欢声动地。${gen.name ? '〔' + gen.src + '〕' : ''}`;
            options = [{ text: '宣捷告庙，献俘阙下', effect: {}, expChoice: 'none' }];
        } else if (outcome === 1) {
            GameState.mapData.status[exp.key] = 0;
            GameState.factions.military = Math.max(0, GameState.factions.military - 2);
            title = `${rname}惨胜`;
            desc = `${gen.name}与虏血战数昼夜，卒却之，边镇得全，而将士枕骸遍野。捷书至日，上为之不食。${gen.src ? '〔' + gen.src + '〕' : ''}`;
            options = [{ text: '抚恤将士，录功勿忘', effect: {}, expChoice: 'none' }];
        } else if (outcome === 2) {
            GameState.mapData.status[exp.key] = 2;
            GameState.factions.military = Math.max(0, GameState.factions.military - 3);   // 军心-3
            GameState.stats.prestige = Math.max(0, GameState.stats.prestige - 1);
            title = `${rname}败绩`;
            desc = `${gen.name}师老饷匮，虏骑乘之，全军败还，弃甲如山。边报旁午，言官交章，请诛败帅以正法。${gen.src ? '〔' + gen.src + '〕' : ''}`;
            options = [
                { text: '问罪败将，械送诏狱', effect: { military: -1 }, expChoice: 'blame' },
                { text: '宽宥以收军心（威望-1）', effect: { prestige: -1 }, expChoice: 'pardon' }
            ];
        } else {
            GameState.mapData.status[exp.key] = 2;
            GameState.factions.military = Math.max(0, GameState.factions.military - 4);
            GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 1);
            title = `${rname}师殁`;
            desc = `${gen.name}身先士卒，陷阵力战，死于矢石之间——如杜松界凡之殁。讣闻，辍朝恸哭，九边雪涕。${gen.src ? '〔' + gen.src + '〕' : ''}`;
            options = [{ text: '辍朝一日，厚恤其家', effect: {}, expChoice: 'mourn' }];
        }
        // 帅之去留：殁者永除名（名将入阵亡册，朝臣标殁）
        if (outcome === 3) {
            if (gen.source === 'famous') {
                expDeadList().push(gen.name);
            } else if (gen.source === 'pool' && GameState.ministers.military[gen.idx]) {
                GameState.ministers.military[gen.idx].dead = true;
            }
        }
        pushNews('兵部', `${title}：${EXP_OUTCOME_NAMES[outcome]}之报至阙。`, 'critical');
        GameState.mapData.lastReport = { key: exp.key, outcome: outcome, gen: gen.name, title: title };
        return {
            title: title, desc: desc, type: 'war', expReport: true,
            expGen: { name: gen.name, source: gen.source, cat: gen.cat, idx: gen.idx, loyalty: gen.loyalty },
            options: options
        };
    } catch (e) { return null; }
}

// 战报追责/抚恤动态处置（showEvent 选项钩子调用）
function resolveExpeditionChoice(event, opt) {
    try {
        if (!event || !event.expReport || !opt || !opt.expChoice || opt.expChoice === 'none') return;
        const g = event.expGen || {};
        if (opt.expChoice === 'blame') {
            if (g.source === 'pool' && GameState.ministers[g.cat] && GameState.ministers[g.cat][g.idx]) {
                const m = GameState.ministers[g.cat][g.idx];
                m.loyalty = Math.max(0, m.loyalty - 20);
            }
            cwArchiveSafe(`败将${g.name}械送诏狱，军中夺气`);
            pushNews('兵部', `败将${g.name}问罪械送，诸将股栗。`, 'critical');
        } else if (opt.expChoice === 'mourn') {
            if (g.loyalty >= 70) {
                GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil + 1));
            }
            cwArchiveSafe(`恤阵亡名将${g.name}之家，九边感泣`);
            pushNews('兵部', `恤${g.name}后，赠官录子，边人感泣。`, 'critical');
        }
    } catch (e) {}
}

function cwArchiveSafe(text) {
    try { if (typeof cwArchive === 'function') cwArchive(text); } catch (e) {}
}
