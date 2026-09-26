// ============================================
// 《大明国策》v6.0 批B：内政经营深挖（govern.js）
// 新政推行 / 开海通商 / 税制调整 / 律法修订 / 户籍编审
// 铁律：每个新政都是有持续期·效果·反弹链的完整系统——
//       有立局成本(万历掏银)、持续期、每季效果、反弹/代价、冷却。
//       反爽游：每逢增收则损民望或惹派系；解决全靠权衡，无一白嫖。
// 引文核《明史》卷次，宁换不编；游戏数值/风险皆为演绎注明。
// ============================================

// 派系键：civil文官 military军功 royal宗室 eunuch宦官 consort外戚(后妃)
// 资源键：treasury国库 stability稳定 corruption贪腐 commerce商业
//         agriculture农业 adminEfficiency行政 navyPower水军 population人口 mandate天命
function _govC(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ===== 新政定义库 =====
// cost   : 颁布立局一次性耗银（反爽游：先出血）
// dur    : 持续期(季)
// cd     : 冷却(季)，期间不可再颁
// immediate : 颁行当季即时效果
// season : 生效期每季效果（负值即代价）
// turmoil: 每季积怨/动荡增量（积累或缓释民变）
// initialRisk : 颁行即刻积怨
// endLow / endHigh : 期满结算（按 turmoil<50/≥50 二选一，确定性）
var GOV_REFORMS = [
    // ================= 新政推行 =================
    {
        key: 'yitiao', cat: '新政', name: '一条鞭法', icon: '📜',
        desc: '田赋与徭役并征于银，量地计丁、官收官解，总括一州之赋役。',
        costDesc: '立局银 4000 两', cost: { treasury: 4000 },
        dur: 12, cd: 20, initialRisk: 4,
        immediate: { factions: { civil: -5 } },
        season: { stats: { treasury: 260, corruption: -0.3, stability: -0.5 }, factions: { civil: -0.9 } },
        turmoil: 0.6,
        threat: '士绅豪强阻挠，清丈征银伤及既得利益',
        endLow:  { label: '积弊渐清·国课有常', stats: { corruption: -5, adminEfficiency: 2 }, news: '「一条鞭法」渐行，官不收户，积年飞洒之弊渐清。', tone: 'normal' },
        endHigh: { label: '豪强纠合抗折', stats: { stability: -3 }, factions: { civil: -6 }, news: '均徭折银之法，豪强纠合上书抵牾，文官怨怼滋甚。', tone: 'warning' },
        src: '核《明史·食货志二·赋役》：万历九年张居正奏行一条鞭法，"总括一州县之赋役，量地计丁，丁粮毕输于官"。后续反弹/数值系演绎。'
    },
    {
        key: 'qingzhang', cat: '新政', name: '清丈田亩', icon: '🗺️',
        desc: '通行天下丈量田亩，清出宗室勋戚所隐之田，尽数入册起税。',
        costDesc: '立局银 6000 两', cost: { treasury: 6000 },
        dur: 8, cd: 20, initialRisk: 6,
        immediate: { factions: { royal: -4, military: -4 } },
        season: { stats: { treasury: 210, stability: -1.0 }, factions: { royal: -0.8, military: -0.8 } },
        turmoil: 0.9,
        threat: '勋戚豪右隐田被清出，宗室军功怨望日深',
        endLow:  { label: '隐田尽出·赋额大增', stats: { treasury: 800, adminEfficiency: 4 }, news: '丈量讫，共得田亩，隐漏者尽出，国课骤增。', tone: 'normal' },
        endHigh: { label: '豪右藉端生乱', stats: { stability: -5 }, factions: { royal: -6, military: -5 }, news: '清丈未竣而关说沓至，豪右藉丈量生事，民田反被牵累。', tone: 'danger' },
        src: '核《明史·食货志一·田制》：万历六年"帝命天下田亩通行丈量，凡诸王府、勋戚、寺观、军屯田及民间地土皆在所量"。（反弹为演绎）'
    },
    {
        key: 'guanying', cat: '新政', name: '官营盐铁', icon: '🏭',
        desc: '收盐铁之利入官，革私商垄断，权宜解一时之绌。',
        costDesc: '立局银 3000 两', cost: { treasury: 3000 },
        dur: 8, cd: 16, initialRisk: 2,
        season: { stats: { treasury: 180, commerce: -1.2, corruption: 0.2 } },
        turmoil: 0.5,
        threat: '官夺商利，商贾裹足、市廛萧然，蠹吏遂得上下其手',
        endLow:  { label: '官榷有法·盐铁归官', stats: { treasury: 500, commerce: 2 }, news: '官榷盐铁渐立规制，边饷稍纾。', tone: 'normal' },
        endHigh: { label: '盐枭横生·蠹吏弄权', stats: { stability: -3, corruption: 4 }, news: '商禁过严则私贩出，盐枭横于道，蠹吏藉官榷以自肥。', tone: 'warning' },
        src: '核《明史·食货志四·盐法》：明以盐引召商中纳边粮，官私兼济。本篇"官营盐铁"收利入官、革私商系游戏机制演绎。'
    },

    // ================= 开海通商 =================
    {
        key: 'kaijin', cat: '开海', name: '弛海禁·开市舶', icon: '⛵',
        desc: '开放漳州月港一隅通番，设市舶司抽分，海商往来互市。',
        costDesc: '沿海设市舶，无需立局银', cost: {},
        dur: 20, cd: 12, initialRisk: 3,
        season: { stats: { treasury: 150, commerce: 1.5 } },
        turmoil: 0.3,
        threat: '通番日久倭患渐炽，海防疲于奔命',
        endLow:  { label: '市舶岁入可观', stats: { treasury: 900, navyPower: 50 }, news: '月港既开，番舶辐辏，市舶抽分岁入亦称巨万。', tone: 'normal' },
        endHigh: { label: '倭患肆虐·请复海禁', stats: { stability: -4, navyPower: -150 }, news: '通番既久，倭寇借市舶为奸，剽掠沿海，朝野请复海禁。', tone: 'danger' },
        src: '核《明史·食货志五·市舶》：明初因倭寇罢市舶，隆庆初准漳州月港通海互市（后世称"隆庆开关"）。本篇作持续期改革，久开生患系演绎。'
    },
    {
        key: 'jinghai', cat: '开海', name: '兴师靖海', icon: '⚓',
        desc: '整饬沿海卫所、大造战船，水师巡络,以靖海氛。',
        costDesc: '海防糜费 5000 两', cost: { treasury: 5000 },
        dur: 6, cd: 12, initialRisk: 0,
        season: { stats: { navyPower: 40, treasury: -60 } },
        turmoil: -0.6,
        threat: '海防糜费国库、久戍生怨，然可消减积弊',
        endLow:  { label: '海氛以靖', stats: { navyPower: 200 }, news: '水师巡海有年，倭舶敛迹，海疆久安。', tone: 'normal' },
        endHigh: { label: '海防糜费而生怼', stats: { adminEfficiency: -3 }, news: '造舰募水师靡费浩繁，而海患未绝，人言凿凿。', tone: 'warning' },
        src: '核《明史·食货志五·市舶》及戚继光经营水军诸事：明中后期重水师靖倭。本篇"兴师靖海"机制为演绎。'
    },

    // ================= 税制调整 =================
    {
        key: 'jiapai', cat: '税制', name: '加派辽饷', icon: '💰',
        desc: '因辽左军兴，按亩加派辽饷，骤增国用。',
        costDesc: '加派即增课，无需立局银',
        cost: {},
        dur: 10, cd: 16, initialRisk: 6,
        season: { stats: { treasury: 220, stability: -1.2 }, factions: { civil: -0.6 } },
        turmoil: 1.0,
        threat: '三饷加派民不堪命，揭竿在即，士大夫亦怨',
        endLow:  { label: '辽事方亟·不得不取', stats: { treasury: 600, adminEfficiency: 2 }, news: '加派所入，尽输辽左军前，国用稍纾而人心渐离。', tone: 'warning' },
        endHigh: { label: '民力已竭·请罢加派', stats: { stability: -6, agriculture: -4 }, factions: { civil: -6 }, news: '加派既重，民不聊生，流民甚众，朝臣交章请罢加派。', tone: 'danger' },
        src: '核《明史·食货志二》：万历末因辽饷骤加田赋，天启以降三饷丛出，民力大困。本篇借"辽饷"机制系演绎惩戒反爽之训。'
    },
    {
        key: 'jianfu', cat: '税制', name: '永蠲赋税', icon: '🌾',
        desc: '蠲免田租以苏民困，普天之下与民更始。',
        costDesc: '蠲免国课，岁入为绌',
        cost: {},
        dur: 12, cd: 20, initialRisk: 0,
        season: { stats: { treasury: -180, stability: 1.2, agriculture: 1.0 }, factions: { military: -0.3 } },
        turmoil: -0.6,
        threat: '蠲赋虽得民心，然国用不继、边饷难供',
        endLow:  { label: '民乐其生', stats: { stability: 4, population: 600000 }, news: '蠲租之诏既下，闾阎称庆，流民渐归。', tone: 'normal' },
        endHigh: { label: '府库空虚·边饷告匮', stats: { treasury: -800, stability: -3 }, factions: { military: -5 }, news: '蠲赋太过，边军月饷不能时给，军心浮动，武臣怨言。', tone: 'warning' },
        src: '核《明史·食货志二》：各朝屡有灾免、蠲租恤民之诏。本篇"永蠲赋税"长时免赋致国用绌系游戏权衡演绎。'
    },
    {
        key: 'yifu', cat: '税制', name: '徭役改折银', icon: '🧾',
        desc: '丁役折银征派，官雇役以充，民得免身赴之劳。',
        costDesc: '编审折银需规费 2000 两', cost: { treasury: 2000 },
        dur: 8, cd: 16, initialRisk: 2,
        season: { stats: { treasury: 160, agriculture: -0.8, stability: -0.4 } },
        turmoil: 0.5,
        threat: '折银则农事乏乎、田塘失修，隅役反滋弊端',
        endLow:  { label: '民免力役·官雇役作', stats: { stability: 3, palaceWork: 0 }, news: '徭役折银，民得尽力南亩，官以银雇役，公私两便。', tone: 'normal' },
        endHigh: { label: '折银成虐·白役滋扰', stats: { stability: -4, corruption: 3 }, news: '折银不以时给，胥吏白役盘剥，力役之弊转甚。', tone: 'warning' },
        src: '核《明史·食货志二·赋役》：明中叶均徭、里甲多折银征派。本篇利弊权衡系演绎。'
    },

    // ================= 律法修订 =================
    {
        key: 'yanxing', cat: '律法', name: '严刑峻法', icon: '⚖️',
        desc: '重绳贪墨，峻斥奸伪，法网加密以肃纲纪。',
        costDesc: '更定律例需银 500 两', cost: { treasury: 500 },
        dur: 8, cd: 16, initialRisk: 2,
        season: { stats: { corruption: -1.0, stability: -0.6 }, factions: { consort: -0.4 } },
        turmoil: 0.6,
        threat: '刑峻则民怨亦峻，酷吏或借此罗织邀功',
        endLow:  { label: '贪墨敛迹', stats: { corruption: -6, adminEfficiency: 3 }, news: '法网既密，吏不敢贪，吏治为之肃然。', tone: 'normal' },
        endHigh: { label: '酷吏罗织·横被无告', stats: { stability: -5, corruption: 2 }, news: '严刑过峻，酷吏借端构陷，庶民无辜瘐死，怨声载道。', tone: 'danger' },
        src: '核《明史·刑法志》：《大明律》重惩贪墨，洪武朝尤以峻法治吏。本篇后续酷吏之弊系游戏演绎。'
    },
    {
        key: 'kuanxing', cat: '律法', name: '宽刑省狱', icon: '🕊️',
        desc: '停刑恤狱、矜疑宽宥，囹圄为之一空。',
        costDesc: '恤录重囚需银 300 两', cost: { treasury: 300 },
        dur: 8, cd: 16, initialRisk: 0,
        season: { stats: { corruption: 0.8, stability: 0.8 }, factions: { civil: 0.5 } },
        turmoil: -0.5,
        threat: '宽纵则奸宄得生、贪贿复萌',
        endLow:  { label: '囹圄一空·民称仁政', stats: { stability: 4, prestige: 3 }, news: '停刑省狱，矜疑多所宽宥，天下颂为仁政。', tone: 'normal' },
        endHigh: { label: '奸民复出·法纪浸弛', stats: { corruption: 6, stability: -3 }, news: '刑弛既久，奸宄无所畏惮，贪墨复萌，法纪浸弛。', tone: 'warning' },
        src: '核《明史·刑法志》：历代遇恩诏恤囚、矜疑减等为常制。宽刑致法弛系游戏权衡演绎。'
    },

    // ================= 户籍编审 =================
    {
        key: 'houji', cat: '户籍', name: '编审黄册', icon: '📚',
        desc: '重编赋役黄册，清隐漏丁口，正户口之籍。',
        costDesc: '户部编审糜费 2000 两', cost: { treasury: 2000 },
        dur: 6, cd: 14, initialRisk: 3,
        season: { stats: { treasury: 140, corruption: -0.2, population: 40000 } },
        turmoil: 0.6,
        threat: '编审扰民、间阁生事，胥吏或藉编审敲剥',
        endLow:  { label: '户口有籍·丁粮可稽', stats: { treasury: 700, adminEfficiency: 3 }, news: '黄册既成，户口丁粮一一可稽，隐漏之弊十去其七。', tone: 'normal' },
        endHigh: { label: '编审滋扰·胥吏剥民', stats: { stability: -4, corruption: 3 }, news: '编审黄册，胥吏下县藉名科敛，小民被扰者众。', tone: 'warning' },
        src: '核《明史·食货志一·户口》：洪武十四年诏天下府州县编赋役黄册，以户为准、核田定籍。本篇反弹系演绎。'
    }
];

// ===== 状态 =====
function initGovernState() {
    return {
        active: {},      // key -> {key, remain, year, season}
        cooldown: {},    // key -> 剩余冷却(季)
        turmoil: 0,      // 动荡/积怨 0-100
        history: []      // {key,name,year,season}
    };
}
// 兼容旧档兜底
function ensureGovernState() {
    if (!GameState.govern) GameState.govern = initGovernState();
    const g = GameState.govern;
    if (typeof g !== 'object' || !g.active || !g.cooldown || typeof g.turmoil !== 'number') {
        const fresh = initGovernState();
        g.active = g.active || fresh.active;
        g.cooldown = g.cooldown || fresh.cooldown;
        if (typeof g.turmoil !== 'number') g.turmoil = 0;
        g.history = Array.isArray(g.history) ? g.history : [];
    }
    return g;
}
function _gov() { return ensureGovernState(); }

// ===== 效果落地（stats / factions 分门别类，只读实际KEY，不写死字段）=====
function _govApplyDeltas(deltas) {
    if (!deltas) return;
    try {
        if (deltas.stats) {
            for (const k in deltas.stats) {
                if (k in GameState.stats && typeof GameState.stats[k] === 'number') {
                    GameState.stats[k] = GameState.stats[k] + deltas.stats[k];
                }
            }
        }
        if (deltas.factions) {
            for (const k in deltas.factions) {
                if (k in GameState.factions && typeof GameState.factions[k] === 'number') {
                    GameState.factions[k] = _govC(GameState.factions[k] + deltas.factions[k], 0, 100);
                }
            }
        }
    } catch (e) {}
}

// ===== 颁行新政 =====
function governEnact(key) {
    try {
        const r = GOV_REFORMS.find(function (x) { return x.key === key; });
        if (!r) { pushNews('新政', '该法未载官牍。', 'danger'); return false; }
        const g = _gov();
        if (g.active[key]) { pushNews('新政', `「${r.name}」正在推行中。`, 'normal'); return false; }
        if ((g.cooldown[key] || 0) > 0) { pushNews('新政', `「${r.name}」方有前辙，尚在冷却，未可遽复。`, 'normal'); return false; }
        // 立局成本校验
        if (r.cost) {
            for (const c in r.cost) {
                if ((GameState.stats[c] || 0) < r.cost[c]) {
                    pushNews('新政', `国库银两不足，无法颁行「${r.name}」。`, 'warning');
                    return false;
                }
            }
            for (const c in r.cost) GameState.stats[c] -= r.cost[c];
        }
        // 颁行即时效果
        _govApplyDeltas(r.immediate);
        // 开海改革联动经济系统市舶状态
        if (key === 'kaijin') { try { if (GameState.econ) GameState.econ.shibo = 1; } catch (e) {} }
        if (key === 'jinghai') { try { if (GameState.econ) GameState.econ.shiboRisk = 0; } catch (e) {} }
        g.active[key] = { key: key, remain: r.dur, year: GameState.currentYear, season: GameState.currentSeason };
        g.cooldown[key] = r.cd;
        g.turmoil = _govC(g.turmoil + (r.initialRisk || 0), 0, 100);
        g.history.push({ key: key, name: r.name, year: GameState.currentYear, season: GameState.currentSeason });
        pushNews('新政', `颁行「${r.name}」：${r.threat}。`, (r.initialRisk > 3) ? 'warning' : 'normal');
        return true;
    } catch (e) {
        pushNews('新政', '颁行受阻：' + e.message, 'danger');
        return false;
    }
}

// ===== 期满结算（确定性：按 turmoil 高低二选一）=====
function _govResolve(r, g) {
    if (!r) return;
    try {
        const node = (g.turmoil >= 50) ? r.endHigh : r.endLow;
        if (!node) return;
        _govApplyDeltas(node);
        if (node.news) pushNews('新政', node.news, node.tone || 'normal');
    } catch (e) {}
}

// ===== 每季巡检（advanceSeason挂链，try-catch）=====
function governTick() {
    try {
        const g = _gov(); if (!g) return;
        const s = GameState.stats; if (!s) return;
        // 冷却衰减
        for (const k in g.cooldown) {
            g.cooldown[k] = Math.max(0, g.cooldown[k] - 1);
            if (g.cooldown[k] === 0) delete g.cooldown[k];
        }
        // 活跃新政逐季结算
        for (const key in g.active) {
            const r = GOV_REFORMS.find(function (x) { return x.key === key; });
            const a = g.active[key];
            if (!a || !r) { delete g.active[key]; continue; }
            _govApplyDeltas(r.season);
            if (r.turmoil) g.turmoil = _govC(g.turmoil + r.turmoil, 0, 100);
            a.remain--;
            if (a.remain <= 0) { _govResolve(r, g); delete g.active[key]; }
        }
        // 民变审查（用当季导入后的 turmoil 判级，再行缓释）
        if (g.turmoil >= 60 && (g.crisisGap || 0) <= 0) {
            // 民变：动荡过甚则揭竿，一损俱损（反爽游）
            s.stability = Math.max(0, (s.stability || 0) - 5);
            s.treasury = Math.max(0, (s.treasury || 0) - 800);
            try { pushNews('新政', '乱象已萌！积怨过甚，民变数起，朝野震动，陛下宜省税宽刑以安民心！', 'danger'); } catch (eN) {}
            g.turmoil = Math.max(0, g.turmoil - 45);
            g.crisisGap = 6;
        } else if ((g.crisisGap || 0) > 0) {
            g.crisisGap--;
        } else {
            g.crisisGap = 0;
        }
        // 动荡缓释
        g.turmoil = _govC(g.turmoil - 0.8, 0, 100);
    } catch (e) {
        try { pushNews('新政', '巡检异常：' + e.message, 'danger'); } catch (e2) {}
    }
}

// ===== 面板渲染（数据驱动，只读 GameState 实际KEY）=====
function renderGovernTab() {
    try {
        const g = _gov();
        const cls = '-gv';
        let html = '<div class="gv-wrap">';
        // 动荡横条
        const t = Math.round(g.turmoil || 0);
        const tTone = t >= 60 ? 'danger' : (t >= 40 ? 'warning' : 'ok');
        html += '<div class="gv-head">';
        html += `<div class="gv-title">内政新政</div>`;
        html += `<div class="gv-turmoil">民心动荡 <span class="gv-tur-${tTone}">${t}/100</span>`;
        html += `<div class="gv-bar"><div class="gv-bar-fill gv-tur-${tTone}" style="width:${t}%"></div></div></div>`;
        html += '<div class="gv-desc">凡新政皆有利有弊、有始有终，血本既出未必善终——慎而颁之。</div>';
        html += '</div>';

        // 活跃新政
        const activeKeys = Object.keys(g.active);
        html += '<div class="gv-sec"><span class="gv-sec-t">○ 推行中</span></div>';
        if (activeKeys.length === 0) {
            html += '<div class="gv-empty">目前无新政在行，天下循用旧章。</div>';
        } else {
            html += '<div class="gv-active-row">';
            activeKeys.forEach(function (key) {
                const r = GOV_REFORMS.find(function (x) { return x.key === key; });
                const a = g.active[key];
                if (!r) return;
                html += `<div class="gv-act-card"><b>${r.icon} ${r.name}</b>`;
                html += `<div class="gv-act-meta"><span>${r.cat}</span><span>余 ${a.remain} 季 · ${r.threat}</span></div>`;
                if (key === 'kaijin') html += '<div class="gv-boost">市舶司抽分中</div>';
                html += '</div>';
            });
            html += '</div>';
        }

        // 可颁新政（按类别分组）
        const cats = ['新政', '开海', '税制', '律法', '户籍'];
        cats.forEach(function (cat) {
            const list = GOV_REFORMS.filter(function (r) { return r.cat === cat; });
            if (list.length === 0) return;
            html += `<div class="gv-sec gv-sec-cat"><span class="gv-sec-t">▣ 议行 · ${cat}</span></div>`;
            html += '<div class="gv-grid">';
            list.forEach(function (r) {
                const active = !!g.active[r.key];
                const cdLeft = Math.max(0, g.cooldown[r.key] || 0);
                const stat = GameState.stats;
                let canAfford = true;
                if (r.cost) for (const c in r.cost) { if ((stat[c] || 0) < r.cost[c]) canAfford = false; }
                // 人类可读的每季效果
                const seas = [];
                if (r.season && r.season.stats) for (const k in r.season.stats) {
                    const d = r.season.stats[k];
                    seas.push((d >= 0 ? 'S+' : '') + d + ' ' + k);
                }
                html += '<div class="gv-card">';
                html += `<div class="gv-card-t">${r.icon} ${r.name} <span class="gv-tag">${cat}</span></div>`;
                html += `<div class="gv-card-desc">${r.desc}</div>`;
                html += '<div class="gv-card-meta">';
                html += `<span>每季：${seas.join('　') || '—'}</span>`;
                html += `<span>${r.costDesc}</span>`;
                html += `<span>行${r.dur}季 · 冷${r.cd}季</span>`;
                html += '</div>';
                html += `<div class="gv-card-risk">⚠ ${r.threat}</div>`;
                const dis = active ? ' 正在推行' : (cdLeft > 0 ? ` 冷却 ${cdLeft} 季` : (!canAfford ? ' 银两不足' : ''));
                html += `<button class="gv-btn${(!active && cdLeft <= 0 && canAfford) ? '' : ' gv-btn-dis'}" onclick="governEnact('${r.key}');renderPanel('govern');" ${(!active && cdLeft <= 0 && canAfford) ? '' : 'disabled'}>` +
                    (active ? '推行中' : (cdLeft > 0 ? '冷却中' : (!canAfford ? '银不足' : '颁行'))) + '</button>';
                html += `<div class="gv-src">${r.src}</div>`;
                html += '</div>';
            });
            html += '</div>';
        });

        // 历史
        html += '<div class="gv-sec"><span class="gv-sec-t">∥ 新政史录</span></div>';
        if (g.history.length === 0) {
            html += '<div class="gv-empty">尚无新政之迹。</div>';
        } else {
            html += '<div class="gv-his">';
            g.history.slice(-12).reverse().forEach(function (h) {
                html += `<div class="gv-his-row"><span>${h.year}年 ${h.season}季</span><b>${h.name}</b></div>`;
            });
            html += '</div>';
        }
        html += '</div>';
        updateUI();
        return html;
    } catch (e) {
        return '<div class="gv-wrap">内政面板异常：' + e.message + '</div>';
    }
}