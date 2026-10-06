// ============================================
// 《大明国策》批G · 后宫储位与夺嫡（harem_prince.js）
// ============================================
// 目标：把浅层后宫深化为皇嗣权谋子系统——皇子出生→成长→资质→立储→夺嫡→监国。
// 核心状态 GameState.haremPrince = {
//   princes:[{id,name,mother,rank,age,aptitude,martial,civil,virtue,education,eldest,favored}],
//   heirId, dispute(夺嫡压力 0-100), ... }
// 反爽铁律：立储无绝对最优解（嫡庶/长幼/贤能权衡）；处置各有权衡代价；无白嫖。
// 史据：《明史》卷113-114·后妃传 / 卷119-120·诸王传 / 卷21·光宗本纪（国本之争）
//       台词引文逐条核卷次宁换不编；数值与代际分化注明「演绎」。
// 铁律：全逻辑 try-catch、id/class 常量化、整文化计数器挂链尾、edict 永久 DOM 不动。
// ============================================

// —— 常量（hp/HP_ 前缀防冲突）——
const HP_BIRTH_CD = 4;        // 产子冷却（章）
const HP_SEQUESTER_CD = 6;    // 安定后宫冷却（章）
const HP_OP_CD = 4;           // 立储/废储/监国/诫勉/安抚冷却（章）
const HP_CROWN_CONFIRM = 8;   // 告庙后需若干章太子位方稳固
const HP_REGEN_SPAN = 6;      // 监国一任章数（6 章 = 1.5 年）
const HP_ADULT_AGE = 16;      // 成年（可监国）
const HP_DISPUTE_HIGH = 60;   // 夺嫡高压阈值 → 卷入党争清议
const HP_APT_LOW = 45;        // 资质低 → 储君隐患（庸）
const HP_ANNUAL_GROW = 1;     // 每章皇子年龄增长（季=章）

const HP_EDU = {
    'taifu': { name: '太傅教经', cost: 150,
        civil: 2.2, aptitude: 1.2, virtue: 0.8, martial: -0.3,
        desc: '经筵之教，启智明理。', src: '《明史》卷114·后妃传' },
    'wushi': { name: '武师教骑', cost: 150,
        martial: 2.4, civil: -0.4, aptitude: 0.7, virtue: 0.1,
        desc: '驰马试剑，尚武之风。', src: '演绎（明代皇子骑射之教）' },
    'free':  { name: '放任自流', cost: 0,
        aptitude: -0.5, virtue: -0.6, civil: 0.1, martial: 0.2,
        desc: '不设师傅，随其本性。', src: '演绎' }
};

const HP_NAME_POOL = ['朱翊','朱常','朱由','朱慈','朱载','朱祁','朱厚','朱祐'];
const HP_RANK_NAME = ['皇后','贵妃','妃','嫔','贵人','宫女'];

// —— 状态初始化（含开场种子：后妃育子入皇嗣）——
function initHaremPrinceState() {
    var st = { princes: [], heirId: null, dispute: 0,
        tick: 0, cd: {}, lastBirthTick: -99, lastGrowTick: -99, lastDisputeTick: -99, lastDisruptTick: -99,
        crownTicks: 0, deposed: [], pendingRegency: null, regencyTick: 0 };
    try { st.princes = hpSeedPrinces(); } catch (e) { st.princes = []; }
    return st;
}

// 由既有后宫（consorts 育子数）确定性播种开场皇子
function hpSeedPrinces() {
    var out = [];
    try {
        var consorts = (GameState.harem && GameState.harem.consorts) || [];
        var namePool = (GameState.harem && GameState.harem.princeNames) || HP_NAME_POOL;
        var nameIdx = 0;
        for (var gi = 0; gi < consorts.length && out.length < 6; gi++) {
            var cm = consorts[gi];
            var sons = cm.sons || 0;
            for (var sI = 0; sI < sons && out.length < 6; sI++) {
                var baseApt = 50;
                if (cm.family === '外戚A') baseApt = 58;
                else if (cm.family === '外戚B') baseApt = 55;
                else if (cm.family === '外戚C') baseApt = 52;
                baseApt += Math.floor((cm.favor || 50) * 0.15); // 母宠增高先天资质略优（子以母贵·演绎）
                baseApt = Math.max(35, Math.min(75, baseApt + Math.floor(hpDet(nameIdx) * 6)));
                var name = namePool[nameIdx % namePool.length] || '朱';
                out.push(hpMakePrince({
                    id: 'hp_seed_' + nameIdx,
                    name: name,
                    mother: cm.name || ('妃' + (gi + 1)),
                    rank: cm.rank || 1,
                    eldest: (out.length === 0),
                    aptitude: baseApt,
                    age: 8 + nameIdx % 6
                }));
                nameIdx++;
            }
        }
    } catch (e) {}
    return out;
}

// 构造一名皇子（确定性基线 + 演绎微扰脱敏）
function hpMakePrince(o) {
    o = o || {};
    var base = (o.aptitude !== undefined) ? o.aptitude : (48 + Math.floor(hpDet(o.seed || 0) * 12));
    var virtue = Math.max(30, Math.min(80, Math.round(55 + hpDet((o.name || '') + 'v') * 14)));
    return {
        id: o.id || ('hp_' + Date.now() + '_' + Math.floor(Math.random() * 1e5)),
        name: o.name || '皇子',
        mother: o.mother || '后宫',
        rank: o.rank || 1,
        age: o.age !== undefined ? o.age : 6,
        aptitude: Math.max(30, Math.min(90, Math.round(base))),
        civil:   o.civil   !== undefined ? o.civil   : Math.max(35, Math.min(65, Math.round(45 + hpDet(base) * 10))),
        martial: o.martial !== undefined ? o.martial : Math.max(35, Math.min(65, Math.round(45 + hpDet(base + 7) * 10))),
        virtue:  o.virtue  !== undefined ? o.virtue  : virtue,
        education: o.education || 'free',
        eldest: !!o.eldest,
        favored: !!o.favored
    };
}

// 确定性伪随机 -1..1（替代 Math.random，便于测试钳制）
function hpDet(seed) {
    var x = (typeof seed === 'string') ? hpHash(seed) : (seed === undefined ? 1 : (seed | 0));
    x = (x ^ (x >>> 16)) * 0x21f0aaad; x = (x ^ (x >>> 15)) * 0x735a2d97; x = x ^ (x >>> 15);
    return ((x % 11) - 5) / 5;      // -> -1..1
}
function hpHash(s) {
    var h = 7; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h;
}

// 当前「章」计数（复用舆图 tick）
function hpTick() {
    try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; }
}

// 状态兜底（旧档/子键缺失补齐，不覆盖既有）
function hpEnsure() {
    try {
        if (!GameState.haremPrince || typeof GameState.haremPrince !== 'object') {
            GameState.haremPrince = initHaremPrinceState();
            return;
        }
        var st = GameState.haremPrince;
        if (!st.princes) st.princes = [];
        if (st.heirId === undefined) st.heirId = null;
        if (st.dispute === undefined) st.dispute = 0;
        if (!st.cd) st.cd = {};
        if (st.lastBirthTick === undefined) st.lastBirthTick = -99;
        if (st.lastGrowTick === undefined) st.lastGrowTick = -99;
        if (st.lastDisputeTick === undefined) st.lastDisputeTick = -99;
        if (st.lastDisruptTick === undefined) st.lastDisruptTick = -99;
        if (st.crownTicks === undefined) st.crownTicks = 0;
        if (!st.deposed) st.deposed = [];
        if (st.pendingRegency === undefined) st.pendingRegency = null;
        if (st.regencyTick === undefined) st.regencyTick = 0;
    } catch (e) {}
}

function hpFindPrince(id) {
    try { var st = GameState.haremPrince || {}; for (var i = 0; i < (st.princes || []).length; i++) { if (st.princes[i].id === id) return 0 + st.princes[i]; } return null; }
    catch (e) { return null; }
}
// 返回引用（可直接改）
function hpFindRef(id) {
    try { var st = GameState.haremPrince || {}; for (var i = 0; i < (st.princes || []).length; i++) { if (st.princes[i].id === id) return st.princes[i]; } return null; }
    catch (e) { return null; }
}
function hpCls(v) {
    return v >= 65 ? 'hp-good' : (v >= HP_APT_LOW ? 'hp-warn' : 'hp-bad');
}
function hpAbilityBar(label, v, cls) {
    return '<div class="hp-ab"><span class="hp-ab-name">' + label + '</span><div class="hp-bar"><div class="hp-fill ' + cls + '" style="width:' + Math.max(0, Math.min(100, v)) + '%"></div></div><span class="hp-ab-val">' + v + '</span></div>';
}

// ====== 皇嗣看板（并入 'harem' tab）======
function renderHaremPrinceTab() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var princes = st.princes || [];
        var heir = hpFindRef(st.heirId);

        var disputes = '<div class="hp-dispute-row">'
            + '<span class="hp-label">夺嫡之势</span>'
            + '<div class="hp-bar hp-bar-dispute"><div class="hp-fill ' + (st.dispute >= HP_DISPUTE_HIGH ? 'hp-bad' : st.dispute >= 30 ? 'hp-warn' : 'hp-good') + '" style="width:' + Math.max(0, Math.min(100, st.dispute)) + '%"></div></div>'
            + '<span class="hp-val">' + Math.round(st.dispute) + '/100</span></div>';
        if (st.dispute >= HP_DISPUTE_HIGH) {
            disputes += '<div class="hp-warn-text">储位不固，诸子争竞，党争清议已然卷入。</div>';
        }

        var rows = princes.map(function (p, i) {
            var isHeir = (p.id === st.heirId);
            var rankName = HP_RANK_NAME[p.rank - 1] || '选侍';
            var eduName = (HP_EDU[p.education] || HP_EDU.free).name;
            var adult = p.age >= HP_ADULT_AGE;
            var heirBadge = isHeir ? '<span class="hp-heir-badge">储&amp;nbsp;君</span>'
                : (st.heirId && st.dispute > 0 ? '<span class="hp-asp-badge">争&#8203;位</span>' : '');
            var edubtns = Object.keys(HP_EDU).map(function (k) {
                var d = HP_EDU[k];
                var sel = (p.education === k);
                var dis = sel ? '' : (d.cost > 0 && GameState.stats.privyPurse < d.cost);
                return '<button class="hp-btn hp-btn-sm" ' + (dis ? 'disabled' : 'data-sel="' + (sel ? '1' : '0') + '"') + ' onclick="hpSetEducation(\'' + p.id + '\',\'' + k + '\')">' + (sel ? '✓' : '') + { taifu: '经', wushi: '武', free: '自' }[k] + '</button>';
            }).join('');
            var heirBtn = isHeir ? '' :
                '<button class="hp-btn hp-btn-solid" ' + (st.cd.op && hpTick() - st.cd.op < HP_OP_CD ? 'disabled' : '') + ' onclick="hpSetHeir(\'' + p.id + '\')">立储</button>';
            var regenBtn = (isHeir && adult && !st.pendingRegency) ?
                '<button class="hp-btn" onclick="hpRegency(\'' + p.id + '\')">监国</button>' : '';
            return '<div class="hp-prince-row ' + (isHeir ? 'hp-row-heir' : '') + (p.eldest ? ' hp-row-eldest' : '') + '">'
                + '<div class="hp-pname">' + (i + 1) + '. ' + p.name + ' ' + heirBadge + '</div>'
                + '<div class="hp-pmeta">母 ' + p.mother + '（' + rankName + ' · 位' + p.rank + '）· 年 ' + p.age
                + (p.eldest ? ' · <b>长子</b>' : '') + (adult ? ' · <b>成年</b>' : '') + '</div>'
                + hpAbilityBar('资质', p.aptitude, hpCls(p.aptitude))
                + hpAbilityBar('文', p.civil, hpCls(p.civil))
                + hpAbilityBar('武', p.martial, hpCls(p.martial))
                + hpAbilityBar('德', p.virtue, hpCls(p.virtue))
                + '<div class="hp-pedu">教养：' + eduName + ' <span class="hp-edubtns">' + edubtns + '</span></div>'
                + '<div class="hp-pact">' + heirBtn + regenBtn + '</div>'
                + '</div>';
        }).join('');

        var heirInfo;
        if (heir) {
            heirInfo = '储君已定：<b>' + heir.name + '</b>（' + heir.age + '岁 · 资质' + heir.aptitude + '）。'
                + (st.crownTicks >= HP_CROWN_CONFIRM
                    ? '太子位已固。'
                    : '<span class="hp-warn-text">（告庙在途，尚需 ' + (HP_CROWN_CONFIRM - st.crownTicks) + ' 章方固）</span>');
        } else {
            heirInfo = '国本未定——群臣屡请立储，久悬生变（《明史》卷21·光宗本纪·国本之争）。';
        }

        var mgmt = '<div class="hp-mgmt"><div class="section-title">储位处置</div><div class="hp-mgmt-row">'
            + (heir ? '<button class="hp-btn hp-btn-danger" onclick="hpDeposeHeir()">废储</button>' : '')
            + (heir ? '<button class="hp-btn" onclick="hpAdmonish()">诫勉</button>' : '')
            + (heir ? '<button class="hp-btn" onclick="hpPacify()">安抚</button>' : '')
            + '<button class="hp-btn" onclick="hpSequester()">安定后宫</button>'
            + '<button class="hp-btn hp-btn-solid" onclick="hpBirth()">临幸产子</button>'
            + '</div></div>';

        var regenBox = '';
        if (st.pendingRegency) {
            var rp = hpFindRef(st.pendingRegency.princeId);
            regenBox = '<div class="hp-regen">太子<b>' + (rp ? rp.name : '?') + '</b>正监国（' + st.pendingRegency.tick + '/' + HP_REGEN_SPAN + '章），贤昏自见。</div>';
        }

        var hasCost = '（各操作均有章数冷却与文化/内帑/稳定代价）';
        return '<div class="hp-wrap" id="harem-prince-panel">'
            + '<div class="hp-banner">「太子，天下之本也，神器不可久虚。」——《明史》卷21·光宗本纪·国本之争（演绎化）</div>'
            + '<h4 class="section-title">皇嗣储位（国本之重）</h4>'
            + heirInfo
            + disputes
            + '<div class="hp-princes">' + (rows || '<div class="hp-empty">六宫尚无皇子——可「临幸产子」延续宗祧。</div>') + '</div>'
            + regenBox
            + mgmt
            + '<div class="hp-hint">子以母贵：母位份高、恩宠厚者先天资质与位次占优。立储权衡嫡庶·长幼·贤能——立长子则国本稳但储君或庸而生隐患；立贤则利国但祝庶子位长者党怨、夺嫡之势顿起。无绝对最优解。' + hasCost + '</div>'
            + '<div class="hp-src">史据：《明史》卷113-114·后妃传 / 卷119-120·诸王传 / 卷21·光宗本纪；代际数值与分化系演绎。</div>'
            + '</div>';
    } catch (e) {
        return '<div class="hp-wrap">皇嗣暂安。</div>';
    }
}
// ====== 子以母贵：临幸产子（选侍）======
function hpBirth() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (tick - (st.lastBirthTick || -99) < HP_BIRTH_CD) { pushNews('后宫', '后宫安宁未久，不宜频幸。（稍候再往）', 'normal'); return; }
        if (GameState.stats.privyPurse < 200) { pushNews('后宫', '内帑不充，无从颁彩头。', 'normal'); return; }
        var consorts = (GameState.harem && GameState.harem.consorts) || [];
        if (!consorts.length) { pushNews('后宫', '六宫空悬，无从选侍。', 'normal'); return; }
        var chosen = consorts[Math.floor(Math.random() * consorts.length)];
        st.lastBirthTick = tick;
        GameState.stats.privyPurse -= 200;          // 颁赏代价
        var baseApt = 45 + Math.floor(hpDet(st.princes.length) * 12);
        if (chosen.family === '外戚A') baseApt += 6; else if (chosen.family && chosen.family.indexOf('外戚') === 0) baseApt += 3;
        baseApt += Math.floor((chosen.favor || 50) * 0.12);   // 母宠→先天（子以母贵·演绎）
        baseApt = Math.max(32, Math.min(80, baseApt));
        var p = hpMakePrince({ mother: chosen.name, rank: chosen.rank || 3, aptitude: baseApt, age: 0 });
        if (chosen.sons === undefined) chosen.sons = 0;
        chosen.sons = (chosen.sons || 0) + 1;
        (st.princes || (st.princes = [])).push(p);
        pushNews('后宫', chosen.name + ' 诞下皇子「' + p.name + '」，颁赏内帑 200。其戚氏蠢动，觊觎封赏。（演绎·子以母贵）', 'normal');
        // 后宫斗争：若新妃强势或诸妃嫉妒
        if (Math.random() < 0.45) {
            GameState.factions.consort = Math.max(0, Math.min(100, GameState.factions.consort + 2));
            pushNews('后宫', '『' + p.name + '』之生，诸妃相妒，后宫波澜暗起。（演绎）', 'normal');
        }
        try { DamingSFX.play('click'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 教养设定 ======
function hpSetEducation(pid, mode) {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var p = hpFindRef(pid);
        if (!p || !HP_EDU[mode]) return;
        var d = HP_EDU[mode];
        if (d.cost > 0) {
            if (GameState.stats.privyPurse < d.cost) { pushNews('后宫', '内帑不充，难聘师儒。', 'normal'); return; }
            GameState.stats.privyPurse -= d.cost;
        }
        var old = HP_EDU[p.education] || HP_EDU.free;
        if (old.cost > 0) GameState.stats.privyPurse += old.cost;  // 改设返聘（反爽：手中有余才可转圜）
        p.education = mode;
        pushNews('东宫', '改定教习：' + p.name + ' 从「' + old.name + '」改「' + d.name + '」。（' + d.src + '）', 'normal');
        try { DamingSFX.play('click'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 立储（反爽：嫡庶/长幼/贤能权衡，动国本）======
function hpSetHeir(pid) {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.cd.op && tick - st.cd.op < HP_OP_CD) { pushNews('东宫', '储位骤更，群臣瞠目——且缓数章再议。', 'normal'); return; }
        var p = hpFindRef(pid);
        if (!p) return;
        var oldHeir = hpFindRef(st.heirId);
        st.heirId = pid;
        st.cd.op = tick;
        st.crownTicks = 0;               // 告庙重置，需时日稳固
        // 位次判定
        var isEldest = !!p.eldest;
        var isHighRank = p.rank === 1 || p.rank === 2;   // 嫡（皇后/贵妃）或近嫡
        var isAble = p.aptitude >= 55;
        // 稳定变化：长幼顺→稳；越嫡幼立→动
        var stabDelta = 0, civilDelta = 0, consortDelta = 0;
        if (isEldest && isHighRank) stabDelta = 6;          // 立嫡长子，众望
        else if (isEldest) stabDelta = 2;                    // 立长但非嫡，稍予
        else if (isAble) stabDelta = -2;                     // 立贤越序，朝议哗然
        else stabDelta = -5;                                 // 立庸幼，国本动摇
        // 派系：立嫡长→文官官僚(可)较稳；立爱→外戚(consort)喜而文官(civil)惧
        civilDelta = (isEldest || isHighRank) ? 2 : -3;
        consortDelta = (isHighRank) ? 2 : -2;
        GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + stabDelta));
        GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil + civilDelta));
        GameState.factions.consort = Math.max(0, Math.min(100, GameState.factions.consort + consortDelta));
        // 兄弟猜忌：立储后未立者生怨 → dispute 上升（嫡长可轻减）
        var broJealousy = (princesCount(st) - 1);
        if (isEldest && isHighRank) broJealousy = Math.max(0, Math.floor(broJealousy * 0.5));
        st.dispute = Math.max(0, Math.min(100, st.dispute + (8 + broJealousy * 4)));
        // 储君若庸（低资质）→ 记隐患（后续夺嫡巡检放大）
        if (!isAble && st.dispute < 100) st.dispute = Math.min(100, st.dispute + 6);
        var why = (isEldest ? '其长子' : '非长') + '、' + (isHighRank ? '嫡出' : '庶出') + '、' + (isAble ? '尚有贤能' : '资质平庸');
        pushNews('东宫', '册立太子：以' + p.name + '为储（' + why + '）。国本既定，然兄弟猜忌、夺嫡之势' + (st.dispute >= HP_DISPUTE_HIGH ? '骤盛' : '始起') + '。稳定 ' + (stabDelta >= 0 ? '+' : '') + stabDelta + '。（《明史》卷21·光宗本纪·国本之争）', stabDelta < 0 ? 'critical' : 'normal');
        if (oldHeir && oldHeir.id !== pid) pushNews('东宫', '废太子' + oldHeir.name + '兄弟侧目，怨望渐生。（演绎）', 'critical');
        try { DamingSFX.play(stabDelta < 0 ? 'urgent' : 'decide'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 废储（重创国本）======
function hpDeposeHeir() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.cd.op && tick - st.cd.op < HP_OP_CD) { pushNews('东宫', '储位新定，不宜轻废。', 'normal'); return; }
        if (!st.heirId) { pushNews('东宫', '国本未定，何言废储？', 'normal'); return; }
        var p = hpFindRef(st.heirId);
        st.deposed.push(st.heirId);
        st.heirId = null;
        st.cd.op = tick;
        st.crownTicks = 0;
        GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability - 18));  // 重创
        GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil - 8));
        st.dispute = Math.max(0, Math.min(100, st.dispute + 20));  // 废储反激夺嫡
        pushNews('东宫', '废储' + (p ? p.name : '') + '！此断国本之举，朝野震动，群臣交章，夺嫡之势反炽。稳定 -18。（《明史》卷114·后妃传·诸王争储，演绎）', 'critical');
        try { DamingSFX.play('urgent'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 诫勉（缓释夺嫡，惜才非废）======
function hpAdmonish() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.cd.op && tick - st.cd.op < HP_OP_CD) { pushNews('东宫', '频加诫勉反失储君之威。', 'normal'); return; }
        if (!st.heirId) { pushNews('东宫', '国本未定，无所诫勉。', 'normal'); return; }
        st.cd.op = tick;
        st.dispute = Math.max(0, st.dispute - 6);
        st.crownTicks = Math.min(st.crownTicks + 2, HP_CROWN_CONFIRM);
        var p = hpFindRef(st.heirId);
        if (p) p.virtue = Math.max(30, Math.min(80, p.virtue + 3));
        pushNews('东宫', '召储君诫勉，申以纲常，令其勤学修德。夺嫡之势稍缓（-6）。（《明史》卷119·诸王传·端王幼学，演绎）', 'normal');
        try { DamingSFX.play('click'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 安抚（耗内帑养患：短期压势、长期藏患）======
function hpPacify() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.cd.op && tick - st.cd.op < HP_OP_CD) { pushNews('东宫', '抚绥不可频施，恐养骄。', 'normal'); return; }
        if (!st.heirId) { pushNews('东宫', '国本未定，无所安抚。', 'normal'); return; }
        var cost = 500;
        if (GameState.stats.privyPurse < cost) { pushNews('内帑', '出资抚绥，库藏不继。', 'normal'); return; }
        GameState.stats.privyPurse -= cost;
        st.cd.op = tick;
        st.dispute = Math.max(0, st.dispute - 12);
        st.hiddenResent = (st.hiddenResent || 0) + 12;   // 养患潜伏（夺嫡巡检届时放大，演绎）
        pushNews('东宫', '诏出内帑 500 抚绥诸弟，短期内夺嫡之势稍弭（-12）。然赏赍无度，养庸滋怨，隐匿之患潜生。——赏以养士，终贻后忧（反爽）。', 'warn');
        try { DamingSFX.play('decide'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 安定后宫（消耗文化×内帑，防后宫干政）======
function hpSequester() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (tick - (st.lastSequesterTick || -99) < HP_SEQUESTER_CD) { pushNews('后宫', '后宫方安，不宜多动。', 'normal'); return; }
        var cost = 300;
        if (GameState.stats.privyPurse < cost) { pushNews('内帑', '整顿内廷需赍颁赏，库藏不继。', 'normal'); return; }
        GameState.stats.privyPurse -= cost;
        st.lastSequesterTick = tick;
        GameState.factions.consort = Math.max(0, Math.min(100, GameState.factions.consort - 4));
        GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + 1));
        GameState.stats.culture = Math.max(0, Math.min(100, GameState.stats.culture + 2));
        st.dispute = Math.max(0, st.dispute - 3);
        pushNews('后宫', '严整六宫，申明宫禁。外戚敛迹，后宫干政稍遏（文化 +2·稳定性 +1；内帑 -300）。', 'normal');
        try { DamingSFX.play('click'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 太子监国 ======
function hpRegency(pid) {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.cd.regen && tick - st.cd.regen < HP_OP_CD) { pushNews('东宫', '监国方歇，储君宜养。', 'normal'); return; }
        var p = hpFindRef(pid);
        if (!p || p.id !== st.heirId) { pushNews('东宫', '非储君不可监国。', 'normal'); return; }
        if (p.age < HP_ADULT_AGE) { pushNews('东宫', p.name + '尚在冲龄，难任监国。（《明史》卷21·光宗本纪·幼冲在位，演绎）', 'normal'); return; }
        if (st.pendingRegency) { pushNews('东宫', '已有太子监国。', 'normal'); return; }
        st.cd.regen = tick;
        st.pendingRegency = { princeId: pid, tick: 0, startTick: tick };
        pushNews('东宫', '命太子' + p.name + '监国，摄政听事，考其政绩。（《明史》卷119·诸王传·储君监国，演绎）', 'normal');
        try { DamingSFX.play('decide'); } catch (e) {}
        hpCommit();
    } catch (e) {}
}

// ====== 每季巡检：成长 + 夺嫡 + 监国复核 ======
function hpGrowTick() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.lastGrowTick === tick) return;      // 同章去重（整文化）
        st.lastGrowTick = tick;
        // 景气微调（取内政景气）
        var boom = 0;
        try { if (GameState.econ && GameState.econ.boom !== undefined) boom = GameState.econ.boom; } catch (e) {}
        var growthMod = 1 + (boom > 0 ? 0.15 : boom < 0 ? -0.15 : 0);   // 景气影响成长速率（演绎）
        (st.princes || []).forEach(function (p) {
            var d = HP_EDU[p.education] || HP_EDU.free;
            p.age += HP_ANNUAL_GROW;
            var r = hpDet(p.id + '_g' + tick);      // 每章分化
            var dr = hpDet(p.id + '_dv' + tick);
            p.civil = clampP(0 + p.civil, HP_EDU_bump(p.civil, d.civil, r, growthMod));
            p.martial = clampP(0 + p.martial, HP_EDU_bump(p.martial, d.martial, r, growthMod));
            p.aptitude = clampP(0 + p.aptitude, HP_EDU_bump(p.aptitude, d.aptitude, r, growthMod));
            p.virtue = clampP(0 + p.virtue, HP_EDU_bump(p.virtue, d.virtue, dr, growthMod));
        });
        // 储君位稳固累积
        if (st.heirId) st.crownTicks = Math.min(HP_CROWN_CONFIRM, (st.crownTicks || 0) + 1);
        // 监国复核：记章推进
        if (st.pendingRegency) {
            st.pendingRegency.tick = (st.pendingRegency.tick || 0) + 1;
            if (st.pendingRegency.tick >= HP_REGEN_SPAN) {
                var rp = hpFindRef(st.pendingRegency.princeId);
                hpRegencySettle(rp);
                st.pendingRegency = null;
                st.cd.regen = tick;
            }
        }
    } catch (e) {}
}
function HP_EDU_bump(cur, rate, r, gmod) {
    var amt = (cur >= 75) ? rate * 0.25 : rate;      // 高位钝化（反爽：资优成长放缓）
    return cur + amt * gmod + r * 1.5;
}
function clampP(bound, v) { return Math.max(30, Math.min(90, Math.round(v))); }
function princesCount(st) { return (st.princes || []).length; }

// 监国结算：贤则举国受益，昏则动乱反噬
function hpRegencySettle(rp) {
    try {
        if (!rp) return;
        var score = rp.aptitude * 0.5 + rp.civil * 0.3 + rp.martial * 0.2 + rp.virtue * 0.4;
        if (score >= 55) {
            GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + 4));
            GameState.stats.commerce = Math.max(0, Math.min(100, GameState.stats.commerce + 3));
            GameState.stats.agriculture = Math.max(0, Math.min(100, GameState.stats.agriculture + 3));
            GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury + 200);
            pushNews('东宫', '太子' + rp.name + '监国贤明，政通人和——稳定 +4、商 +3、农 +3、国库 +200。（演绎·贤储监国）', 'normal');
        } else {
            GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability - 8));
            GameState.stats.commerce = Math.max(0, Math.min(100, GameState.stats.commerce - 3));
            GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury - 300);
            pushNews('东宫', '太子' + rp.name + '监国昏庸，政令乖张，境内骚动——稳定 -8、商 -3、国库 -300。（演绎·昏储监国反噬）', 'critical');
            try { DamingSFX.play('urgent'); } catch (e) {}
        }
    } catch (e) {}
}

// ====== 夺嫡巡检（多子+储位不固→压力升，高值卷入党争/清议）======
function hpDisputeTick() {
    try {
        if (!GameState.haremPrince) GameState.haremPrince = initHaremPrinceState();
        var st = GameState.haremPrince;
        var tick = hpTick();
        if (st.lastDisputeTick === tick) return;
        st.lastDisputeTick = tick;
        var n = princesCount(st);
        if (n < 2) { st.dispute = 0; return; }   // 独子无争
        var heir = hpFindRef(st.heirId);
        var pressure = 0;
        // 储位不固 → 累加
        if (!heir) pressure += 7;                                        // 未立储，群臣屡请
        else {
            if (!(heir.eldest && (heir.rank === 1 || heir.rank === 2))) pressure += 5;  // 非嫡长，储位不固
            if (heir.aptitude < HP_APT_LOW) pressure += 6;               // 储君庸，隐患
        }
        var r = hpDet('dispute' + tick);
        if (heir && !(heir.eldest && heir.rank <= 2)) {
            if (r > 0.2) pressure += Math.floor(r * 6);                  // 兄弟觊觎随机放大
        } else if (r > 0.6) pressure += 2;
        // 多子基数
        pressure += (n >= 3 ? 2 : 1);
        // 每章净变化（含安抚养患潜伏）
        var latent = st.hiddenResent || 0;
        st.dispute = Math.max(0, Math.min(100, st.dispute + pressure - 3 + (latent > 0 ? 2 : 0)));
        if (st.hiddenResent) st.hiddenResent = Math.max(0, st.hiddenResent - 2); // 患慢性浮现
        // 高值连锁：卷入 intrigue 党争 + 清议(civil) + 稳定动荡（守序节流：每4章一次、需储位已定，防自动塌方）
        if (st.dispute >= HP_DISPUTE_HIGH && tick - (st.lastDisruptTick || -99) >= 4) {
            st.lastDisruptTick = tick;
            if (heir) {
                // 姊妹/诸弟争已定之储 → 清议与党争并起
                GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil - 2));
                GameState.factions.consort = Math.max(0, Math.min(100, GameState.factions.consort + 2));
                GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability - 1));
            } else {
                // 国本未定：仅臣下屡谏，扰清议而不遽成内乱（压力归于立储）
                GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil - 1));
            }
            // 卷入权谋：向 intrigue 塞入一张争储密谋（若系统就绪）
            try {
                if (heir && GameState.intrigue && Array.isArray(GameState.intrigue.schemes) && GameState.intrigue.schemes.length < 6) {
                    GameState.intrigue.schemes.push({ id: 'hp_disp_' + tick, name: '储位之争', cat: 'scheme', idx: 0,
                        motive: '争储', key: 'heir', found: false, resolved: false, cd: 0 });
                }
            } catch (e) {}
            try { pushNews('东宫', '夺嫡之势炽盛，清议哗然，党争暗涌。（《明史》卷114·后妃传）', 'critical'); } catch (e) {}
        }
        // 极高值（>85）追加轻微稳定压力（守序），但凡有储仍可见
        if (st.dispute > 85 && heir && tick - (st.lastDisruptTick || -99) >= 4) {
            st.lastDisruptTick = tick;
            GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability - 1));
        }
    } catch (e) {}
}

// ====== 提交（存档 + 刷新）======
function hpCommit() {
    try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
    try { if (typeof updateUI === 'function') updateUI(); } catch (e) {}
    try { if (typeof renderPanel === 'function') renderPanel(GameState.currentTab); } catch (e) {}
}