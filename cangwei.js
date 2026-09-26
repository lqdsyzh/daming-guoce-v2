// ============================================
// 《大明国策》批3 · 厂卫系统 + 内帑博弈 + 和解彩蛋 + 结局回响
// 史据：《明史》卷94·刑法志二（驾帖付锦衣卫监刑官）／
//      卷95·刑法志三（"廷杖、东西厂、锦衣卫、镇抚司狱……杀人至惨，而不丽于法"）／
//      卷304·宦官传一（汪直提督西厂、刘瑾设内行厂）／
//      卷305·宦官传二（万历矿税使四出）／卷307·佞幸传（纪纲骄横伏诛）／
//      卷181·刘健谢迁传（疏请诛瑾）／卷170·于谦传（谥忠肃）等
// 反爽铁律：侦查/清洗/矿税皆有代价链，卫力坐大必反噬，绝不白嫖。
// ============================================

// ---- 常量（限频与阈值，均入存档链校验范围） ----
const CW_ARCHIVE_MAX = 20;      // 档案环形缓冲：20条
const CW_SPY_CD = 2;            // 缇骑侦查冷却：每机构2章
const CW_HEAD_CD = 2;           // 厂公任免冷却：每机构2章
const CW_TICKET_CD = 3;         // 请驾帖冷却：3章（科道不肯滥签）
const CW_AID_CD = 2;            // 发内帑助军冷却：2章
const CW_TICKET_MAX = 3;        // 驾帖至多存3
const CW_POWER_CAP = 99;        // 卫力上限0-99
const CW_BACKFIRE_AT = 80;      // 卫力≥80触发反噬判定
const CW_BACKFIRE_RESET = 60;   // 反噬后卫力回整肃值
const CW_MINER_TICK = 4;        // 矿监税监：每4章结算一次

// ---- 厂卫机构（按剧本史实可用） ----
const CANGWEI_INSTS = [
    {
        key: 'jinyiwei', name: '锦衣卫', head: '指挥使', scripts: 'all',
        basePower: 30, eunuchDefault: false,
        desc: '掌亲军、司诏狱，缇骑四出，天下重情法司莫敢问。',
        src: '《明史》卷95·刑法志三：锦衣卫之狱，太祖尝用之，后已禁止，其复用亦自成祖时。'
    },
    {
        key: 'dongchang', name: '东厂', head: '提督太监', scripts: 'all',
        basePower: 35, eunuchDefault: true,
        desc: '永乐十八年置，缉谋逆妖言大奸恶，虽锦衣卫亦伺察之。',
        src: '《明史》卷95·刑法志三：东厂之设，始于永乐十八年。'
    },
    {
        key: 'xichang', name: '西厂', head: '提督汪直', scripts: ['chenghua'],
        basePower: 40, eunuchDefault: true,
        desc: '横尤东厂，屡兴大狱，南北侦逮，官民惴恐。',
        src: '《明史》卷304·宦官传一：汪直年少用事，帝命直提督西厂（成化十三年置）。'
    },
    {
        key: 'neihang', name: '内行厂', head: '提督刘瑾', scripts: ['zhengde'],
        basePower: 45, eunuchDefault: true,
        desc: '尤酷烈，并东西厂卫亦在伺察之列。',
        src: '《明史》卷304·宦官传一：刘瑾改惜薪司外薪厂为办事厂，荣府旧仓地为内行厂，自领之。'
    }
];

const CW_CRIMES = ['贪墨', '纳贿', '结党', '僭越', '卖官', '枉法'];

// ---- 和解彩蛋：政敌对（据《明史》实际政争核实；批2十三对关系皆为同党，无政敌对，故另立实有政争之对） ----
const RECONCILE_PAIRS = [
    {
        key: 'jian_jin', a: '刘健', b: '刘瑾',
        desc: '正德元年，健为首辅，率同列上疏极言瑾奸恶，请置之法；瑾衔之切骨，逐健归田。',
        src: '《明史》卷181·刘健传、卷304·刘瑾传（演绎：上亲为和解，赐宴便殿）'
    },
    {
        key: 'qian_jin', a: '谢迁', b: '刘瑾',
        desc: '迁与健同疏请诛瑾，致仕归；瑾憾不已，摭他事欲中之。',
        src: '《明史》卷181·谢迁传、卷304·刘瑾传（演绎：上亲为和解，两臣再拜）'
    }
];

// ---- 史实谥号表（逐条核《明史》，无谥可考者宁缺毋录） ----
const MING_POSTHUMOUS = {
    '杨士奇': { shi: '文贞', src: '《明史》卷148·杨士奇传：赠太师，谥文贞' },
    '杨荣':   { shi: '文敏', src: '《明史》卷148·杨荣传：赠太师，谥文敏' },
    '杨溥':   { shi: '文定', src: '《明史》卷148·杨溥传：赠太师，谥文定' },
    '李东阳': { shi: '文正', src: '《明史》卷181·李东阳传：明代文臣谥文正者，东阳为始' },
    '刘健':   { shi: '文靖', src: '《明史》卷181·刘健传：嘉靖五年卒，谥文靖' },
    '谢迁':   { shi: '文正', src: '《明史》卷181·谢迁传：谥文正' },
    '王越':   { shi: '襄敏', src: '《明史》卷171·王越传：弘治十一年卒，谥襄敏' },
    '王守仁': { shi: '文成', src: '《明史》卷195·王守仁传：隆庆初，追赠新建侯，谥文成' },
    '杨一清': { shi: '文襄', src: '《明史》卷198·杨一清传：数年后，追谥文襄' },
    '于谦':   { shi: '忠肃', src: '《明史》卷170·于谦传：万历中，改谥忠肃' },
    '张居正': { shi: '文忠', src: '《明史》卷213·张居正传：谥文忠' },
    '戚继光': { shi: '武毅', src: '《明史》卷212·戚继光传：谥武毅' }
};

// ---- 结局回响·史官总评（按结局类型） ----
const END_LEGACY_VERDICTS = {
    mandate_lost: '天命既去，虽缇骑满城亦不能缚人心；社稷之亡，亡于失民。',
    bankrupt: '府库之竭，非一日之贪；矿税盈帑而天下耗，可胜叹哉！',
    military_collapse: '九边不守，非无将也，饷匮而士散也；帅臣殉边，血犹殷鉴。',
    population_collapse: '生民十不存三，史册所载，未之多见；为人君者，可不惧乎！',
    peaceful_end: '二十载而海内粗安，史臣执笔，姑书曰：守成之主，功过相参。'
};

// ---- 工具 ----
function cwTick() {
    try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; }
}

function initCangweiState() {
    const insts = {};
    CANGWEI_INSTS.forEach(c => {
        insts[c.key] = { power: c.basePower, eunuch: !!c.eunuchDefault, cd: -99, headCd: -99, spyBoost: false };
    });
    return {
        insts: insts, archives: [], totalArchives: 0,
        evidence: [], evidenceSeq: 1,
        tickets: 0, ticketCd: -99, aidCd: -99,
        miners: false, minerCount: 0,
        backfireCd: 0, revenge: {}, depleted: false
    };
}

// 旧档兜底（存档链补默认：构造器缺失字段一律补齐）
function ensureCangweiState() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        if (!GameState.cangwei) GameState.cangwei = initCangweiState();
        const cw = GameState.cangwei;
        const base = initCangweiState();
        if (!cw.insts) cw.insts = base.insts;
        if (!cw.archives) cw.archives = [];
        if (!cw.evidence) cw.evidence = [];
        if (!cw.revenge) cw.revenge = {};
        CANGWEI_INSTS.forEach(c => { if (!cw.insts[c.key]) cw.insts[c.key] = base.insts[c.key]; });
        ['totalArchives', 'evidenceSeq', 'tickets', 'ticketCd', 'aidCd', 'minerCount', 'backfireCd', 'depleted', 'miners'].forEach(k => {
            if (cw[k] === undefined) cw[k] = base[k];
        });
        return cw;
    } catch (e) { return null; }
}

function cwInstAvailable(key) {
    try {
        const c = CANGWEI_INSTS.find(x => x.key === key);
        if (!c) return false;
        if (c.scripts === 'all') return true;
        return !!(GameState.script && c.scripts.indexOf(GameState.script.id) >= 0);
    } catch (e) { return false; }
}

function cwAliveInsts() {
    try { return CANGWEI_INSTS.filter(c => cwInstAvailable(c.key)); } catch (e) { return []; }
}

// 数值直调（rate类0-100钳制；钱粮不钳下限，可入负——内帑枯竭由此触发）
function cwStat(key, delta) {
    try {
        const s = GameState.stats;
        const rateKeys = ['stability', 'prestige', 'mandate', 'corruption', 'militaryPower', 'adminEfficiency', 'culture', 'tech', 'commerce', 'agriculture'];
        if (rateKeys.indexOf(key) >= 0) s[key] = Math.max(0, Math.min(100, s[key] + delta));
        else s[key] = s[key] + delta;
        return s[key];
    } catch (e) { return 0; }
}

function cwFac(cat, delta) {
    try {
        const f = GameState.factions;
        f[cat] = Math.max(0, Math.min(100, f[cat] + delta));
        return f[cat];
    } catch (e) { return 0; }
}

function cwArchive(text) {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        cw.archives.unshift({ text: text, tick: cwTick() });
        if (cw.archives.length > CW_ARCHIVE_MAX) cw.archives.pop();
        cw.totalArchives += 1;
    } catch (e) {}
}

function cwSfx(kind) {
    try { if (typeof DamingSFX !== 'undefined' && DamingSFX) DamingSFX.play(kind); } catch (e) {}
}

function cwMinisterByPos(cat, idx) {
    try {
        const arr = (GameState.ministers || {})[cat] || [];
        return arr[idx] || null;
    } catch (e) { return null; }
}

function cwAllMinisters() {
    try {
        const out = [];
        Object.values(GameState.ministers || {}).forEach(arr => (arr || []).forEach(m => { if (m) out.push(m); }));
        return out;
    } catch (e) { return []; }
}

// ================= 模块A · 厂卫三功能 =================

// 1) 缇骑侦查（2章冷却/机构；卫力+2；得柄或空手，概率随目标清廉度；宦官掌厂侦查加锐）
function cwSpy() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const instSel = (document.getElementById('cw-spy-inst')||{value:'',selectedIndex:0});
        const tgtSel = (document.getElementById('cw-spy-target')||{value:'',selectedIndex:0});
        if (!instSel || !tgtSel) return;
        const instKey = instSel.value;
        if (!cwInstAvailable(instKey)) return;
        const inst = cw.insts[instKey];
        const instDef = CANGWEI_INSTS.find(x => x.key === instKey);
        const tick = cwTick();
        if (tick - inst.cd < CW_SPY_CD) {
            pushNews('厂卫', `${instDef.name}缇骑方出，须再候 ${CW_SPY_CD - (tick - inst.cd)} 章。`, 'normal');
            renderCangweiTab();
            return;
        }
        const tgt = tgtSel.value || '';
        let prob = 0.45, target = null, tgtName = '';
        if (tgt.indexOf('fac:') === 0) {
            const cat = tgt.slice(4);
            const members = cwAllMinisters().filter(m => GameState.ministers[cat] && GameState.ministers[cat].indexOf(m) >= 0 && !m.jailed && !m.dead);
            if (members.length === 0) { pushNews('厂卫', '彼辈已无在任之人，无从侦起。', 'normal'); return; }
            const avgInt = members.reduce((a, m) => a + (m.integrity || 50), 0) / members.length;
            prob = 0.45 + (100 - avgInt) / 200;
            target = members.sort((a, b) => (a.integrity || 50) - (b.integrity || 50))[0];
            tgtName = cat === 'civil' ? '文官' : cat === 'eunuch' ? '宦官' : cat === 'military' ? '武将' : cat === 'consort' ? '外戚' : '宗室';
        } else if (tgt.indexOf('cat:') === 0) {
            const parts = tgt.split(':');
            target = cwMinisterByPos(parts[1], parseInt(parts[2], 10));
            if (!target || target.jailed || target.dead) { pushNews('厂卫', '其人不在其位，无从侦起。', 'normal'); return; }
            prob = 0.45 + (100 - (target.integrity || 50)) / 200;
            tgtName = target.name;
        } else { return; }
        if (inst.spyBoost) prob += 0.1;   // 宦官掌厂：侦查效率+
        inst.cd = tick;
        inst.power = Math.min(CW_POWER_CAP, inst.power + 2);   // 滥用则卫力坐大
        cwSfx('step');
        if (Math.random() < prob) {
            const crime = CW_CRIMES[Math.floor(Math.random() * CW_CRIMES.length)];
            let cat = 'civil', idx = -1;
            Object.keys(GameState.ministers).forEach(c => {
                const i = GameState.ministers[c].indexOf(target);
                if (i >= 0) { cat = c; idx = i; }
            });
            cw.evidence.push({ id: 'E' + cw.evidenceSeq, name: target.name, cat: cat, idx: idx, crime: crime, used: false });
            cw.evidenceSeq += 1;
            cwArchive(`缇骑探得${target.name}${crime}之柄`);
            pushNews('厂卫', `${instDef.name}缇骑探得${target.name}${crime}实迹，柄在朝廷。`, 'critical');
        } else {
            cwArchive(`${instDef.name}缇骑侦${tgtName}，逻卒空手而归`);
            pushNews('厂卫', `${instDef.name}缇骑侦伺${tgtName}，月余无所得，空手复命。`, 'normal');
        }
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 把柄处置：拿捏（忠-8）或抄家（内帑+3、官心/清议-2）
function cwUseEvidence(id, action) {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const ev = cw.evidence.find(x => x.id === id);
        if (!ev || ev.used) return;
        const m = cwMinisterByPos(ev.cat, ev.idx);
        if (action === 'squeeze') {
            if (!m || m.dead) { ev.used = true; renderCangweiTab(); return; }
            m.loyalty = Math.max(0, m.loyalty - 8);
            ev.used = true;
            cwArchive(`以${ev.crime}之柄拿捏${ev.name}，其人惶恐`);
            pushNews('厂卫', `以把柄拿捏${ev.name}，其人自危，忠心 -8。`, 'normal');
            cwSfx('decide');
        } else if (action === 'confiscate') {
            cwStat('privyPurse', 3);
            cwFac('civil', -2);   // 官心（清议）-2：科道哗然
            ev.used = true;
            cwArchive(`籍${ev.name}家，得银入内帑，清议沸腾`);
            pushNews('厂卫', `籍没${ev.name}家资入内帑（+3），清议大哗，文官 -2。`, 'critical');
            cwSfx('coin');
        }
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 2) 诏狱清洗（下狱：稳定-2、清议-2、卫力+3、目标派系报复概率+）
function cwJail(cat, idx) {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const m = cwMinisterByPos(cat, idx);
        if (!m || m.jailed || m.dead) return;
        m.jailed = true;
        cwStat('stability', -2);
        cwFac('civil', -2);   // 清议-2
        cw.revenge[cat] = (cw.revenge[cat] || 0) + 1;
        const jin = cw.insts.jinyiwei;
        if (jin) jin.power = Math.min(CW_POWER_CAP, jin.power + 3);
        cwArchive(`诏狱收系${m.name}，朝野侧目`);
        pushNews('厂卫', `缇骑逮${m.name}下诏狱。清议汹汹：稳定 -2、文官 -2，${(GameState.factions && cat) ? '' : ''}其党衔恨。`, 'critical');
        cwSfx('urgent');
        try { if (typeof closeTalkModal === 'function' && GameState.talkState && GameState.talkState.current) closeTalkModal(); } catch (e) {}
        renderCangweiTab();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}

// 开释（清议稍平）
function cwRelease(cat, idx) {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const m = cwMinisterByPos(cat, idx);
        if (!m || !m.jailed || m.dead) return;
        m.jailed = false;
        cwFac('civil', 1);
        cwArchive(`开释${m.name}出狱，清议稍平`);
        pushNews('厂卫', `诏狱开释${m.name}，文官 +1，然狱吏已饱其私囊。`, 'normal');
        cwSfx('click');
        renderCangweiTab();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}

// 请驾帖（科道佥签，威望-1，3章一候；处决之程序要件）
function cwRequestTicket() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const tick = cwTick();
        if (tick - cw.ticketCd < CW_TICKET_CD) {
            pushNews('厂卫', '科道方佥驾帖，不肯滥签，须再候数章。', 'normal');
            return;
        }
        if (cw.tickets >= CW_TICKET_MAX) {
            pushNews('厂卫', '驾帖已有存者，毋庸再请。', 'normal');
            return;
        }
        cw.ticketCd = tick;
        cw.tickets += 1;
        cwStat('prestige', -1);
        cwArchive('赴刑科请驾帖，给事中佥签');
        pushNews('厂卫', '驾帖既得（刑科佥签，威望 -1）。《明史》卷94：重囚三覆奏毕，仍请驾帖，付锦衣卫监刑官。', 'normal');
        cwSfx('seal');
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 处决（须驾帖；错杀忠臣忠诚≥70者民望-3；卫力+5、稳定-2、文官-1）
function cwExecute(cat, idx) {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const m = cwMinisterByPos(cat, idx);
        if (!m || !m.jailed || m.dead) return;
        if (cw.tickets < 1) {
            pushNews('厂卫', '处决重辟，必先请驾帖——科道无佥签，法不可行。', 'critical');
            return;
        }
        cw.tickets -= 1;
        m.dead = true;
        m.jailed = false;
        cwStat('stability', -2);
        cwFac('civil', -1);
        cw.revenge[cat] = (cw.revenge[cat] || 0) + 1;
        const jin = cw.insts.jinyiwei;
        if (jin) jin.power = Math.min(CW_POWER_CAP, jin.power + 5);
        cwArchive(`西市处决${m.name}，都人聚观`);
        pushNews('厂卫', `驾帖付狱，${m.name}弃市。稳定 -2、文官 -1，其党衔恨入骨。`, 'critical');
        cwSfx('urgent');
        if (m.loyalty >= 70) {
            cwStat('mandate', -3);   // 民望（天命）-3
            cwArchive(`${m.name}素有忠誉而死非其罪，物论冤之`);
            pushNews('厂卫', `${m.name}清誉素著而死非其罪，物论冤之——民望大失（天命 -3）。`, 'critical');
        }
        try { if (typeof closeTalkModal === 'function' && GameState.talkState && GameState.talkState.current) closeTalkModal(); } catch (e) {}
        renderCangweiTab();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}

// 3) 厂公任免（宦官掌厂：宦官+3、侦查效率+；还政武臣：宦官-2、威望-1）
function cwToggleHead(key) {
    try {
        const cw = ensureCangweiState();
        if (!cw || !cwInstAvailable(key)) return;
        const inst = cw.insts[key];
        const instDef = CANGWEI_INSTS.find(x => x.key === key);
        const tick = cwTick();
        if (tick - inst.headCd < CW_HEAD_CD) {
            pushNews('厂卫', `厂公之柄方有更张，未逾 ${CW_HEAD_CD} 章，不宜再动。`, 'normal');
            renderCangweiTab();
            return;
        }
        inst.headCd = tick;
        if (!inst.eunuch) {
            inst.eunuch = true;
            inst.spyBoost = true;
            cwFac('eunuch', 3);
            cwArchive(`以中官掌${instDef.name}，宫府一体`);
            pushNews('厂卫', `命宦官掌${instDef.name}：宦官 +3，耳目愈锐（侦查+一成）。`, 'critical');
        } else {
            inst.eunuch = false;
            inst.spyBoost = false;
            cwFac('eunuch', -2);
            cwStat('prestige', -1);
            cwArchive(`夺${instDef.name}厂公之柄还武臣，中官怨望`);
            pushNews('厂卫', `夺${instDef.name}厂公之柄还武臣：宦官 -2，中官怨望，威望 -1。`, 'critical');
        }
        cwSfx('decide');
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 卫力反噬（卫力≥80时有概率骄横不法——纪纲故事）
function cwCheckBackfire() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return false;
        const tick = cwTick();
        if (tick - cw.backfireCd < 4) return false;
        const hot = cwAliveInsts().find(c => cw.insts[c.key].power >= CW_BACKFIRE_AT);
        if (!hot) return false;
        if (Math.random() >= 0.3) return false;
        cw.backfireCd = tick;
        cw.insts[hot.key].power = CW_BACKFIRE_RESET;
        cwStat('stability', -2);
        cwFac('civil', -2);
        cwStat('prestige', -1);
        cwArchive(`${hot.name}卫力坐大，头目骄横，诏磔之`);
        GameState.pendingEvent = {
            title: '厂卫骄横',
            desc: `${hot.name}卫力坐大，头目骄横不法：诈传诏旨，擅杀无辜，私匿禁物，举朝莫敢言。厂卫噬人，终反噬朝廷。（纪纲故事，《明史》卷307·佞幸传）`,
            type: 'internal',
            options: [
                { text: '罪之，磔于市以谢天下', effect: {} },
                { text: '姑息养奸，许其自效', effect: { stability: -2, eunuch: 1 } }
            ]
        };
        pushNews('厂卫', `${hot.name}头目骄横事发，朝野震恐。`, 'critical');
        return true;
    } catch (e) { return false; }
}

// ================= 模块B · 内帑博弈 =================

// 派/召回矿监税监（万历史实核心痛点）
function cwToggleMiners() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        cw.miners = !cw.miners;
        cw.minerCount = 0;
        if (cw.miners) {
            cwArchive('遣中官出掌矿税，四方骚然');
            pushNews('内帑', '命中官出掌矿税：每4章内帑 +2，然民望 -1、腐败 +1、地方叛乱渐滋（《明史》卷305·宦官传二）。', 'critical');
        } else {
            cwArchive('召回矿监税使，止损于半');
            pushNews('内帑', '召还矿监税使，止损于半——然矿税之害已深。', 'normal');
        }
        cwSfx('decide');
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 每4章结算（由 advanceSeason 巡检调用；也可直接调用以便验证）
function cwMinerTick() {
    try {
        const cw = ensureCangweiState();
        if (!cw || !cw.miners) return false;
        cw.minerCount += 1;
        if (cw.minerCount < CW_MINER_TICK) return false;
        cw.minerCount = 0;
        cwStat('privyPurse', 2);
        cwStat('mandate', -1);     // 民望（天命）-1
        cwStat('corruption', 1);
        pushNews('内帑', '矿监税使进银入库（内帑 +2），而道路怨叹，民望 -1、腐败 +1。', 'critical');
        if (Math.random() < 0.3) {   // 地方叛乱概率微增
            const adminKeys = ['beizhili', 'nanzhili', 'shanxi', 'shandong', 'henan', 'zhejiang', 'jiangxi', 'huguang', 'sichuan', 'fujian', 'guangdong', 'guangxi', 'yunnan', 'guizhou', 'shaanxi'];
            const candidates = adminKeys.filter(k => GameState.mapData && GameState.mapData.status && (GameState.mapData.status[k] || 0) === 0);
            if (candidates.length > 0) {
                const pick = candidates[Math.floor(Math.random() * candidates.length)];
                GameState.mapData.status[pick] = 1;
                const rname = (typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS.find(r => r.key === pick)) ? MAP_REGIONS.find(r => r.key === pick).name : pick;
                pushNews('内帑', `矿税虐民，${rname}地方生变，警兆骤起。`, 'critical');
            }
        }
        return true;
    } catch (e) { return false; }
}

// 发内帑助军（国库<20两时可发：内帑-3→国库+4、军心+1；万历天启"发内帑"故事）
function cwSendAid() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return;
        const tick = cwTick();
        if (GameState.stats.treasury >= 20) {
            pushNews('内帑', '国库尚可支吾，毋庸发内帑——发帑之事，俟国库告竭再议。', 'normal');
            renderCangweiTab();
            return;
        }
        if (GameState.stats.privyPurse < 3) {
            pushNews('内帑', '内帑亦空，无可发者。', 'critical');
            renderCangweiTab();
            return;
        }
        if (tick - cw.aidCd < CW_AID_CD) {
            pushNews('内帑', `内帑方发，不宜屡兴，须再候 ${CW_AID_CD - (tick - cw.aidCd)} 章。`, 'normal');
            renderCangweiTab();
            return;
        }
        cw.aidCd = tick;
        cwStat('privyPurse', -3);
        cwStat('treasury', 4);
        cwFac('military', 1);
        cwArchive('发内帑助军，将士感泣');
        pushNews('内帑', '发内帑金犒边军：内帑 -3、国库 +4、军心 +1（万历三大征发帑故事）。', 'critical');
        cwSfx('coin');
        renderCangweiTab();
        updateUI();
    } catch (e) {}
}

// 内帑枯竭（=0）：宫用挤占国库事件
function cwCheckDepletion() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return false;
        if (GameState.stats.privyPurse > 100) cw.depleted = false;
        if (GameState.stats.privyPurse > 0 || cw.depleted) return false;
        cw.depleted = true;
        GameState.pendingEvent = {
            title: '内帑告匮',
            desc: '内帑空竭，宫中用度无出。中官跪请挪太仓银以充宫用——户部闻之，合署请对。（万历朝故事，《明史》卷305·宦官传二）',
            type: 'economy',
            options: [
                { text: '许之，挪太仓以充宫用', effect: { treasury: -300, eunuch: 2, stability: -1 } },
                { text: '克己不取，宫用减省', effect: { stability: -2, eunuch: -2 } }
            ]
        };
        pushNews('内帑', '内帑告匮，中官日请宫用。', 'critical');
        return true;
    } catch (e) { return false; }
}

// 派系报复（诏狱清洗后，目标派系报复事件概率+）
function cwCheckRevenge() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return false;
        let total = 0, cats = [];
        Object.keys(cw.revenge).forEach(c => {
            if (cw.revenge[c] > 0) { total += cw.revenge[c]; cats.push(c); }
        });
        if (total <= 0) return false;
        if (Math.random() >= total * 0.06) return false;
        const cat = cats[Math.floor(Math.random() * cats.length)];
        cwFac(cat, -1);
        cwStat('stability', -1);
        const names = { civil: '文官', eunuch: '宦官', military: '武将', consort: '外戚', royal: '宗室' };
        pushNews('朝堂', `${names[cat] || '朝臣'}以诏狱之祸相报复，暗中构陷，朝局愈恶。`, 'critical');
        return true;
    } catch (e) { return false; }
}

// ---- 待发事件队列（和解/反噬/枯竭共用；advanceSeason 优先呈现） ----
function consumePendingEvent() {
    try {
        if (typeof GameState === 'undefined' || !GameState || GameState.gameOver) return null;
        const ev = GameState.pendingEvent || null;
        GameState.pendingEvent = null;
        return ev;
    } catch (e) { return null; }
}

// ================= 模块D · 和解彩蛋 =================
// 双方都被召见过后触发"帝为和解"，各+2忠心（一次性key，随 talkData 持久化）
function tryReconcilePairs() {
    try {
        const ts = GameState.talkState;
        if (!ts) return false;
        ts.called = ts.called || {};
        ts.reconciled = ts.reconciled || {};
        let fired = false;
        RECONCILE_PAIRS.forEach(p => {
            if (ts.reconciled[p.key]) return;
            const ma = cwAllMinisters().find(m => m.name === p.a);
            const mb = cwAllMinisters().find(m => m.name === p.b);
            if (!ma || !mb || ma.dead || mb.dead || ma.jailed || mb.jailed) return;
            if (!ts.called[p.a] || !ts.called[p.b]) return;
            ts.reconciled[p.key] = true;
            ma.loyalty = Math.min(100, ma.loyalty + 2);
            mb.loyalty = Math.min(100, mb.loyalty + 2);
            GameState.pendingEvent = {
                title: '帝为和解',
                desc: `${p.desc}上亲为和解，赐宴便殿，两臣再拜，各感悦（忠心各 +2）。〔${p.src}〕`,
                type: 'diplomacy',
                options: [{ text: '允之', effect: {} }]
            };
            pushNews('朝堂', `上为${p.a}、${p.b}和解，二臣忠悃稍复。`, 'critical');
            fired = true;
        });
        return fired;
    } catch (e) { return false; }
}

// ================= 模块D · 结局回响（身后名） =================
function renderEndLegacy(endType) {
    try {
        const box = document.getElementById('end-legacy');
        if (!box || typeof GameState === 'undefined' || !GameState) return;
        const cw = ensureCangweiState();
        // 编年大事精选3条（开朝首事、朝中要事、末事）
        const hist = GameState.history || [];
        const picks = [];
        if (hist.length > 0) picks.push(hist[hist.length - 1]);
        if (hist.length > 2) picks.push(hist[0]);
        const mid = hist.find(h => /灾|叛|狱|师|帑|矿|乱/.test(h.title || ''));
        if (mid && picks.indexOf(mid) < 0) picks.push(mid);
        const chrono = picks.slice(0, 3).map(h =>
            `<li>第${(h.year || 0) + 1}年${h.season || ''}${h.month || ''}——${h.title}（${h.decision}）</li>`
        ).join('');
        // 忠心最高大臣 + 史实谥号（宁缺毋编）
        let best = null;
        cwAllMinisters().forEach(m => {
            if (m && m.loyalty !== undefined && (!best || m.loyalty > best.loyalty)) best = m;
        });
        let shiHtml;
        if (best && MING_POSTHUMOUS[best.name]) {
            const p = MING_POSTHUMOUS[best.name];
            shiHtml = `忠心最高者为${best.name}（忠 ${best.loyalty}），史载追谥「${p.shi}」〔${p.src}〕`;
        } else if (best) {
            shiHtml = `忠心最高者为${best.name}（忠 ${best.loyalty}）——《明史》无谥可考，宁缺毋录`;
        } else {
            shiHtml = '朝臣名录散佚，无从考谥。';
        }
        // 史官总评（复用史官年鉴文风）
        let note = '';
        try { if (typeof generateHistorianNote === 'function') note = generateHistorianNote() || ''; } catch (e) { note = ''; }
        const verdict = END_LEGACY_VERDICTS[endType] || END_LEGACY_VERDICTS.peaceful_end;
        box.innerHTML = `
            <h3 class="cw-legacy-title">身后名</h3>
            <div class="cw-legacy-sec"><b>编年大事</b>
                <ul class="cw-legacy-chrono">${chrono || '<li>国史无大事可录。</li>'}</ul>
            </div>
            <div class="cw-legacy-sec"><b>厂卫卷宗</b>
                在朝期间缇骑狱案凡 ${cw ? cw.totalArchives : 0} 条；${cw && cw.miners ? '矿监税使四出，讥于人口。' : '未尝以矿税病民。'}
            </div>
            <div class="cw-legacy-sec"><b>臣工盖棺</b>${shiHtml}</div>
            <div class="cw-legacy-sec"><b>史官曰</b>${note ? note + ' ' : ''}${verdict}</div>
            <div class="cw-legacy-src">谥号并据《明史》本传，无谥可考者不录。</div>`;
    } catch (e) {}
}

// ================= 厂卫朝堂面板 =================
function cwPowerBar(p) {
    const w = Math.max(0, Math.min(100, p));
    const cls = w >= 80 ? 'cw-power-bar cw-power-hot' : 'cw-power-bar';
    return `<div class="cw-power-track"><div class="${cls}" style="width:${w}%"></div></div>`;
}

function renderCangweiTab() {
    try {
        const cw = ensureCangweiState();
        if (!cw) return '<div class="cw-wrap">厂卫未设。</div>';
        const tick = cwTick();
        // 机构卡
        const instCards = cwAliveInsts().map(c => {
            const inst = cw.insts[c.key];
            const cdRemain = Math.max(0, CW_SPY_CD - (tick - inst.cd));
            const headRemain = Math.max(0, CW_HEAD_CD - (tick - inst.headCd));
            return `<div class="cw-inst-card">
                <div class="cw-inst-head"><b>${c.name}</b><span class="cw-inst-tag">${inst.eunuch ? '宦官掌厂' : '武臣掌卫'}</span></div>
                <div class="cw-inst-desc">${c.desc}</div>
                <div class="cw-inst-power">卫力 ${inst.power}/99 ${cwPowerBar(inst.power)}${inst.spyBoost ? '<span class="cw-boost">侦查加锐</span>' : ''}</div>
                <div class="cw-inst-cd">侦查候 ${cdRemain} 章 · 任免候 ${headRemain} 章</div>
                <button class="cw-btn" onclick="cwToggleHead('${c.key}')">${inst.eunuch ? '夺柄还武臣' : '命宦官掌厂'}</button>
                <div class="cw-inst-src">${c.src}</div>
            </div>`;
        }).join('');
        // 侦查表单
        const instOpts = cwAliveInsts().map(c =>
            `<option value="${c.key}">${c.name}（卫力${cw.insts[c.key].power}${(tick - cw.insts[c.key].cd) >= CW_SPY_CD ? '，可用' : '，候中'}）</option>`
        ).join('');
        const facOpts = [['civil', '文官集团'], ['eunuch', '宦官集团'], ['military', '武将集团'], ['consort', '外戚集团'], ['royal', '宗室藩王']]
            .map(p => `<option value="fac:${p[0]}">${p[1]}</option>`).join('');
        const minOpts = cwAllMinisters()
            .map(m => {
                let cat = '', idx = -1;
                Object.keys(GameState.ministers).forEach(c => {
                    const i = GameState.ministers[c].indexOf(m);
                    if (i >= 0) { cat = c; idx = i; }
                });
                return { m: m, cat: cat, idx: idx };
            })
            .filter(x => x.idx >= 0 && !x.m.jailed && !x.m.dead)
            .map(x => `<option value="cat:${x.cat}:${x.idx}">${x.m.name}</option>`).join('');
        // 诏狱
        const jailed = cwAllMinisters().filter(m => m.jailed && !m.dead);
        const jailList = jailed.length === 0
            ? '<div class="cw-empty">诏狱空虚——人或以为仁政，或以为姑息。</div>'
            : jailed.map(m => {
                let cat = '', idx = -1;
                Object.keys(GameState.ministers).forEach(c => {
                    const i = GameState.ministers[c].indexOf(m);
                    if (i >= 0) { cat = c; idx = i; }
                });
                return `<div class="cw-jail-row"><b>${m.name}</b><span>忠 ${m.loyalty}</span>
                    <button class="cw-btn cw-btn-warn" onclick="cwRelease('${cat}',${idx})">开释</button>
                    <button class="cw-btn cw-btn-danger" onclick="cwExecute('${cat}',${idx})" ${cw.tickets < 1 ? 'disabled' : ''}>处决${cw.tickets < 1 ? '（须驾帖）' : '（用驾帖一）'}</button>
                </div>`;
            }).join('');
        // 把柄
        const evList = cw.evidence.length === 0
            ? '<div class="cw-empty">未得把柄。缇骑出，方有柄可用。</div>'
            : cw.evidence.map(ev => {
                const used = ev.used;
                return `<div class="cw-ev-row ${used ? 'cw-ev-used' : ''}">
                    <b>${ev.name}</b><span class="cw-ev-crime">${ev.crime}之柄</span>
                    ${used ? '<span>已用</span>' : `
                    <button class="cw-btn" onclick="cwUseEvidence('${ev.id}','squeeze')">拿捏（忠-8）</button>
                    <button class="cw-btn" onclick="cwUseEvidence('${ev.id}','confiscate')">抄家（内帑+3）</button>`}
                </div>`;
            }).join('');
        // 档案
        const archives = cw.archives.length === 0
            ? '<div class="cw-empty">厂卫卷宗尚白。</div>'
            : cw.archives.map(a => `<li>${a.text}</li>`).join('');
        const miners = cw.miners
            ? `<div class="cw-miner-on">矿监税使已遣出（${cw.minerCount}/${CW_MINER_TICK} 章后进银）</div>
               <button class="cw-btn cw-btn-warn" onclick="cwToggleMiners()">召回税使（止损）</button>`
            : `<button class="cw-btn cw-btn-danger" onclick="cwToggleMiners()">派矿监税监（每4章内帑+2，民望-1，腐败+1）</button>`;
        const canAid = GameState.stats.treasury < 20 && GameState.stats.privyPurse >= 3;
        return `<div class="cw-wrap">
            <div class="cw-banner">「廷杖、东西厂、锦衣卫、镇抚司狱是已。杀人至惨，而不丽于法。」——《明史》卷95·刑法志三</div>
            <h3 class="section-title">厂卫诸司（卫力坐大必反噬）</h3>
            <div class="cw-inst-list">${instCards}</div>
            <h3 class="section-title">缇骑侦查（每机构2章一候，卫力+2）</h3>
            <div class="cw-spy-form">
                <select id="cw-spy-inst" class="cw-select">${instOpts}</select>
                <select id="cw-spy-target" class="cw-select">
                    <optgroup label="侦一派系">${facOpts}</optgroup>
                    <optgroup label="侦一大臣">${minOpts}</optgroup>
                </select>
                <button class="cw-btn" onclick="cwSpy()">派出缇骑</button>
                <div class="cw-hint">得柄可拿捏（忠-8）、抄家（内帑+3）；概率随目标清廉度，宦官掌厂加锐。</div>
            </div>
            <h3 class="section-title">诏狱（下狱：稳定-2、清议-2；处决须驾帖）</h3>
            <div class="cw-ticket-row">
                <span>驾帖存 ${cw.tickets}（科道佥签，威望-1，3章一候）</span>
                <button class="cw-btn" onclick="cwRequestTicket()">请驾帖</button>
            </div>
            <div class="cw-jail-list">${jailList}</div>
            <h3 class="section-title">把柄档案</h3>
            <div class="cw-ev-list">${evList}</div>
            <h3 class="section-title">内帑博弈（《明史》卷305·矿税使）</h3>
            <div class="cw-miner-box">
                ${miners}
                <div class="cw-aid-box">
                    <span>国库告竭（<20两）时可发内帑助军：内帑-3 → 国库+4、军心+1（万历天启发帑故事）</span>
                    <button class="cw-btn" onclick="cwSendAid()" ${canAid ? '' : 'disabled'}>发内帑助军</button>
                </div>
                <div class="cw-hint">赏赐幸臣（召见·赏）亦出内帑；内帑空竭则宫用挤占国库。</div>
            </div>
            <h3 class="section-title">厂卫档案（环形${CW_ARCHIVE_MAX}条）</h3>
            <ul class="cw-archives">${archives}</ul>
            <div class="cw-src-note">史据：卷94刑法志二（驾帖）·卷95刑法志三（厂卫诏狱）·卷304宦官传一（诸厂提督）·卷305宦官传二（矿税使）·卷307佞幸传（纪纲）。</div>
        </div>`;
    } catch (e) { return '<div class="cw-wrap">厂卫簿册有误。</div>'; }
}
