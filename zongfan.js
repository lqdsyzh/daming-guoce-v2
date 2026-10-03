// ============================================
// 《大明国策》批H · 宗藩制度（zongfan.js·全新系统）
// ============================================
// 目标：明宗室禄米黑洞是最经典的反爽游财政/伦理张力——封藩→禄米逐年膨胀吞国库，
//       削藩→藩王生变动乱风险。封得越爽，后世医保你哭。
// 核心状态 GameState.zongfan = {
//   vassals:[{id,name,region,fief,reward(年禄/两),generation,martial,loyalty(0-100),source}],
//   fiefBurden(宗禄占岁入 0-1), recall(归朝削解累计), revolt(待平藩乱藩id),
//   revokeCount, revoltHistory, tick, cd, lastBurdenTick, lastRevoltTick, ... }
// 反爽铁律：封藩/减禄/削藩/平乱各有真实代价，无白嫖；越拖越痛。
// 史据：《明史》卷82·食货志（宗禄）/ 卷116-119·诸王传 / 卷7·成祖本纪/卷9·宣宗本纪（削藩）
//       台词引文逐条核卷次宁换不编；岁禄折银与代际膨胀系「演绎简化」。
// 铁律：全逻辑 try-catch、id/class 常量化、整数化计数器挂链尾、edict 永久 DOM 不动。
// ============================================

// —— 常量（zf/ZF_ 前缀防冲突）——
const ZF_ANNUAL_INCOME = 30000;   // 名义岁入代理（两），宗禄占岁入比 = 年禄/此值（简化代理·演绎）
const ZF_BURDEN_HIGH   = 0.30;    // 偏高阈值 → 国库显著承压
const ZF_BURDEN_CRIT   = 0.45;    // 临界 → 宗禄成绞索、民乱风险
const ZF_REWARD_GROW   = 20;      // 每章每代际禄米增量基数（两·演绎）
const ZF_REVOLT_LOY    = 55;      // 削藩一次创荣扩时，忠诚低于此则易生叛（配合确定性roll）
const ZF_ENF_CD        = 3;       // 封藩冷却（章）
const ZF_REDUCE_CD     = 3;       // 减宗禄冷却（章）
const ZF_REVOKE_CD     = 3;       // 削藩冷却（章）
const ZF_ENF_FEE       = 3000;    // 一次性册封耗费（王府营建+首供·演绎）
const ZF_BASE_REWARD   = 2000;    // 新藩基础岁禄（两·首代·明亲王岁禄折银简化）
const ZF_STEP_FEE      = 2000;    // 渐进削·过渡安置费
const ZF_FU_FEE        = 3000;    // 招抚之费
const ZF_TAO_FEE       = 5000;    // 讨伐之费
const ZF_AI_FEE        = 4000;    // 哽咽暧昧（内帑/国库私了之费）
const ZF_SRC = '《明史》卷82·食货志/卷116-119·诸王传';

const ZF_REGIONS = ['陕西·西安','山西·太原','北平·蓟城','河南·开封','湖广·武昌','四川·成都',
    '山东·济南','河南·南阳','河南·洛阳','湖广·长沙','江西·南昌','浙江·绍兴','甘肃·兰州','山东·青州'];
const ZF_NAME_POOL = ['秦','晋','燕','周','楚','蜀','鲁','代','肃','辽','宁','岷','谷','韩','沈','唐'];
const ZF_MARTIAL_POOL = [42,51,47,55,44,50,48,52];

// —— 状态初始化（含开场内藩种子：明初诸王就封内地）——
function initZongfanState() {
    var st = { vassals: [], fiefBurden: 0, recall: 0, revolt: null,
        revokeCount: 0, revoltHistory: [], tick: 0, cd: {},
        lastBurdenTick: -99, lastRevoltTick: -99, lastGrowTick: -99 };
    try { st.vassals = zfSeedVassals(); st.fiefBurden = zfTotalReward(st)/ZF_ANNUAL_INCOME; st.fiefBurden=zfClamp01(st.fiefBurden); } catch (e) { st.vassals = []; }
    return st;
}

// 确定性开场种子：明初攆封内地之亲王（岁禄按亲王折银、取整·演绎）
function zfSeedVassals() {
    var out = [];
    var seeds = [
        { n:'秦王',   r:'陕西·西安', gen:1, reward:2200, martial:46, loy:58 },
        { n:'晋王',   r:'山西·太原', gen:1, reward:2200, martial:52, loy:55 },
        { n:'周王',   r:'河南·开封', gen:1, reward:2100, martial:44, loy:54 },
        { n:'楚王',   r:'湖广·武昌', gen:1, reward:2000, martial:48, loy:52 }
    ];
    for (var i = 0; i < seeds.length; i++) {
        var s = seeds[i];
        out.push({
            id: 'zf_seed_' + (i + 1),
            name: s.n, region: s.r, fief: s.r.split('·')[1] + '府封地',
            reward: s.reward, generation: s.gen, martial: s.martial,
            loyalty: s.loy, source: '开国宗藩'
        });
    }
    return out;
}

// 状态兜底（旧档/子键缺失补齐，不覆盖既有）
function zfEnsure() {
    try {
        if (!GameState.zongfan || typeof GameState.zongfan !== 'object') {
            GameState.zongfan = initZongfanState();
            return;
        }
        var st = GameState.zongfan;
        if (!st.vassals) st.vassals = [];
        if (st.fiefBurden === undefined) st.fiefBurden = 0;
        if (st.recall === undefined) st.recall = 0;
        if (st.revolt === undefined) st.revolt = null;
        if (st.revokeCount === undefined) st.revokeCount = 0;
        if (!st.revoltHistory) st.revoltHistory = [];
        if (!st.cd) st.cd = {};
        if (st.lastBurdenTick === undefined) st.lastBurdenTick = -99;
        if (st.lastRevoltTick === undefined) st.lastRevoltTick = -99;
        if (st.lastGrowTick === undefined) st.lastGrowTick = -99;
    } catch (e) {}
}

// 当前「章」计数（复用舆图 tick，与批G同构）
function zfTick() {
    try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; }
}

// 确定性伪随机 -1..1（替代 Math.random，便于测试钳制）
function zfDet(seed) {
    var x = (typeof seed === 'string') ? zfHash(seed) : (seed === undefined ? 1 : (seed | 0));
    x = (x ^ (x >>> 16)) * 0x21f0aaad; x = (x ^ (x >>> 15)) * 0x735a2d97; x = x ^ (x >>> 15);
    return ((x % 11) - 5) / 5;      // -> -1..1
}
function zfHash(s) {
    var h = 7; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h;
}
function zfClamp01(v) { return Math.max(0, Math.min(1, +v || 0)); }

function zfFindRef(id) {
    try { var st = GameState.zongfan || {}; for (var i = 0; i < (st.vassals || []).length; i++) { if (st.vassals[i].id === id) return st.vassals[i]; } return null; }
    catch (e) { return null; }
}
function zfTotalReward(st) {
    st = st || GameState.zongfan || {};
    var t = 0; for (var i = 0; i < (st.vassals || []).length; i++) { t += (st.vassals[i].reward || 0); } return t;
}
function zfRecomputeBurden() {
    try { var st = GameState.zongfan; if (!st) return; st.fiefBurden = zfClamp01(zfTotalReward(st) / ZF_ANNUAL_INCOME); } catch (e) {}
}
function zfCls(v) { return v >= 65 ? 'zf-good' : (v >= 45 ? 'zf-warn' : 'zf-bad'); }
function zfBar(label, v, cls) {
    return '<div class="zf-ab"><span class="zf-ab-name">' + label + '</span><div class="zf-bar"><div class="zf-fill ' + cls + '" style="width:' + Math.max(0, Math.min(100, v)) + '%"></div></div><span class="zf-ab-val">' + Math.round(v) + '</span></div>';
}

// 选择封藩人选：优先皇嗣系统已成年未就藩之皇子，否则新增宗支（代际+1）
function zfPickCandidate(st) {
    var gen = 1;
    var used = {};
    for (var i = 0; i < (st.vassals || []).length; i++) used[(st.vassals[i].name || '')] = 1;
    var princes = (GameState.haremPrince && GameState.haremPrince.princes) || [];
    for (var j = 0; j < princes.length; j++) {
        var p = princes[j];
        if (p && p.name && !used[p.name]) {
            return { name: p.name, generation: 1, martial: (p.martial || 45), source: '皇子' };
        }
    }
    var maxG = 1;
    for (var k = 0; k < (st.vassals || []).length; k++) { if ((st.vassals[k].generation || 1) > maxG) maxG = st.vassals[k].generation; }
    return { name: '宗支' + (st.vassals.length + 1), generation: maxG + 1, martial: ZF_MARTIAL_POOL[(st.vassals.length || 0) % ZF_MARTIAL_POOL.length], source: '宗支' };
}

function zfMakeVassal(cand, st) {
    cand = cand || {};
    var idx = st.vassals ? st.vassals.length : 0;
    var region = ZF_REGIONS[idx % ZF_REGIONS.length];
    var gen = cand.generation || 1;
    var loy = Math.max(40, Math.min(72, Math.round(52 + zfDet((cand.name || '') + 'loy') * 16)));
    return {
        id: 'zf_' + Date.now() + '_' + (idx || 0),
        name: cand.name || '宗室',
        region: region, fief: region.split('·')[1] + '府封地',
        reward: ZF_BASE_REWARD * gen,
        generation: gen, martial: cand.martial || 45,
        loyalty: loy, source: cand.source || '皇子'
    };
}

// ====== 封藩（zfEnfeoff）：短期爽、长期禄米黑洞 ======
function zfEnfeoff() {
    try {
        if (!GameState.zongfan) GameState.zongfan = initZongfanState();
        var st = GameState.zongfan; zfEnsure();
        if (st.cd.enfeoff && zfTick() - st.cd.enfeoff < ZF_ENF_CD) {
            pushNews('宗藩', '连章奏请者众，然封典之期未至，且缓缓。', 'normal'); return false;
        }
        if (GameState.stats.treasury < ZF_ENF_FEE) { pushNews('宗藩', '府库不充，难供册封营建之费。', 'normal'); return false; }
        var cand = zfPickCandidate(st);
        if (!cand) { pushNews('宗藩', '宗支尚简，无适封之人（待皇子长成或另议）。', 'normal'); return false; }
        GameState.stats.treasury -= ZF_ENF_FEE;
        var v = zfMakeVassal(cand, st);
        st.vassals.push(v);
        st.cd.enfeoff = zfTick();
        // 反爽：短期稳定+、宗室喜庆、藩王镇守 → 但禄米永久膨胀、占领封地税源
        applyDecision({ stability: +3 });
        GameState.factions = GameState.factions || {};
        GameState.factions.royal = Math.max(20, Math.min(100, (GameState.factions.royal || 50) + 6));
        GameState.stats.militaryPower = Math.max(0, (GameState.stats.militaryPower || 0) + 8); // 藩王镇守之臂（演绎）
        zfRecomputeBurden();
        pushNews('封藩', v.name + '（' + v.generation + '代）册封' + v.region + '，岁禄' + v.reward + '两。宗室额手相庆，然禄米之费，愈滚愈重，后世将有忧。', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('good'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// ====== 禄米膨胀巡检（zfBurdenTick）：每章宗禄随藩数与世代膨胀 ======
function zfBurdenTick() {
    try {
        if (!GameState.zongfan) GameState.zongfan = initZongfanState();
        var st = GameState.zongfan; zfEnsure();
        var tick = zfTick();
        if (st.lastBurdenTick === tick) return;   // 去重（同 tick 只结算一次）
        st.lastBurdenTick = tick;
        var vs = st.vassals || [];
        // 禄米随藩数与世代膨胀：每章每代际加增
        var grown = 0;
        for (var i = 0; i < vs.length; i++) {
            var inc = ZF_REWARD_GROW * (vs[i].generation || 1);
            vs[i].reward = Math.max(100, (vs[i].reward || 0) + inc);
            grown += inc;
        }
        // 宗嗣滋息：每满 ZF_ENF_CD 章按当前藩数可视作一支新增禄（无剩余可封者则记名延续）
        //  —— 简化不自动新增藩王（避免过度随机），仅以禄米加增表达「宗支渐繁」——
        var total = zfTotalReward(st);
        st.fiefBurden = zfClamp01(total / ZF_ANNUAL_INCOME);
        // 本季宗禄支出从国库扣除（每章 = 年禄/4）
        var seasonCost = Math.floor(total / 4);
        GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury - seasonCost);
        // 负担高 → 附加财政与稳定压力
        if (st.fiefBurden >= ZF_BURDEN_HIGH) {
            GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury - Math.floor(total * 0.05));
            GameState.stats.food = Math.max(0, (GameState.stats.food || 0) - Math.floor(seasonCost / 10)); // 粮道折漕承压（联动的简化）
        }
        if (st.fiefBurden >= ZF_BURDEN_CRIT) {
            GameState.stats.stability = Math.max(0, (GameState.stats.stability || 0) - 1);
            if (grown > 0) {
                pushNews('宗禄', '宗禄已占岁入十之' + Math.round(st.fiefBurden * 100) + '——禄米如绞索，民力渐困，盗贼窥伺。（《明史》卷82·食货志·宗禄）', 'critical');
            }
        }
        // 民乱/宗室动荡风险（负担过高且藩忠诚低时）
        if (st.fiefBurden >= ZF_BURDEN_CRIT && GameState.factions && (GameState.factions.royal || 50) < 40) {
            pushNews('宗藩', '宗室因禄米裁削而怨望日炽，或暗通藩镇，密谋有迹。', 'normal');
        }
    } catch (e) {}
}

// ====== 减宗禄（zfReduceStipend）：省钱解困，然宗室怨望 ======
function zfReduceStipend(vassalId) {
    try {
        if (!GameState.zongfan) return false;
        var st = GameState.zongfan;
        var v = zfFindRef(vassalId);
        if (!v) { pushNews('宗藩', '无此藩。', 'normal'); return false; }
        if (st.cd.reduce && zfTick() - st.cd.reduce < ZF_REDUCE_CD) {
            pushNews('宗藩', '连年裁削，切直之议沸然，当稍安。', 'normal'); return false;
        }
        var cut = Math.max(100, Math.floor(v.reward * 0.2));
        v.reward = Math.max(100, v.reward - cut);
        st.cd.reduce = zfTick();
        // 反爽：省钱但宗室怨望（忠诚↓、宗室派系↓），或暗怀异志（可能导致密谋/勾结藩镇）
        v.loyalty = Math.max(20, (v.loyalty || 0) - 8);
        GameState.factions = GameState.factions || {};
        GameState.factions.royal = Math.max(20, (GameState.factions.royal || 50) - 3);
        zfRecomputeBurden();
        pushNews('减宗禄', '削' + v.name + '岁禄' + cut + '两（现' + v.reward + '两）。宗室怨望暗生，或有密谋勾结之虞。', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('warn'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// ====== 削藩（zfRevoke）：高风险核心，一次 vs 渐进 ======
// mode: 'one'(一次削·速效险) | 'step'(渐进削·稳而费)
function zfRevoke(vassalId, mode) {
    try {
        if (!GameState.zongfan) return false;
        var st = GameState.zongfan;
        var v = zfFindRef(vassalId);
        if (!v) { pushNews('宗藩', '无此藩。', 'normal'); return false; }
        if (st.cd.revoke && zfTick() - st.cd.revoke < ZF_REVOKE_CD) {
            pushNews('宗藩', '削藩方略方议，骤然再举恐激变，且徐图。', 'normal'); return false;
        }
        st.cd.revoke = zfTick();
        st.revokeCount = (st.revokeCount || 0) + 1;
        var loyal = v.loyalty || 0;

        if (mode === 'step') {
            // 渐进削：稳，不激变，但耗财耗时就懒（过渡安置费 + 削除）
            if (GameState.stats.treasury < ZF_STEP_FEE) { pushNews('宗藩', '府库不充，难措渐进削藩之安置费。', 'normal'); return false; }
            GameState.stats.treasury -= ZF_STEP_FEE;
            v.reward = Math.max(100, Math.floor(v.reward * 0.6));   // 削四成，分次消解
            v.loyalty = Math.max(20, loyal - 3);
            GameState.factions.royal = Math.max(20, (GameState.factions.royal || 50) - 1);
            st.recall = Math.min(1, (st.recall || 0) + 0.03);
            zfRecomputeBurden();
            pushNews('削藩', '渐削' + v.name + '之禄，分期归朝。稳而后行，然迁延岁月，耗财亦巨（先支安置费' + ZF_STEP_FEE + '两）。', 'normal');
            return true;
        }

        // 一次削（mode 'one'）：速效，然若忠诚不足则藩乱。
        // 确定性 roll：忠诚越高越易从；测试可经 st.forceRevokeRoll 钳制。
        var roll = (typeof st.forceRevokeRoll === 'number') ? st.forceRevokeRoll : zfDet(v.id + 'rev' + st.revokeCount);
        var reqRoll = (ZF_REVOLT_LOY - loyal) / 60;   // loyal=55→0；loyal=85→-0.5；loyal=35→0.333
        if (roll >= reqRoll) {
            // 从削：收爵除藩，抄禄入国，宗室派系挫
            st.vassals = st.vassals.filter(function (x) { return x.id !== vassalId; });
            var confiscate = Math.floor(v.reward * 3);
            GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury + confiscate);
            GameState.factions.royal = Math.max(20, (GameState.factions.royal || 50) - 4);
            st.recall = Math.min(1, (st.recall || 0) + 0.05);
            applyDecision({ stability: -2 });  // 绝亲情、动国本，亦有动荡
            zfRecomputeBurden();
            pushNews('削藩', v.name + '奉诏除爵归朝，所领' + v.region + '收为郡县，抄禄' + confiscate + '两入国库。朝中侧目，宗室寒心。', 'normal');
            return true;
        } else {
            // 藩乱！即刻引爆：藩兵乱 → 稳定崩塌/民变/军力出/需平乱
            zfRevolt(v);
            return false;
        }
    } catch (e) { return false; }
}

// ====== 藩乱（zfRevolt）：削藩激化跨兵/粮道/民变/稳定，需平乱三择 ======
function zfRevolt(v) {
    try {
        if (!GameState.zongfan) GameState.zongfan = initZongfanState();
        var st = GameState.zongfan; zfEnsure();
        var tick = zfTick();
        if (st.lastRevoltTick === tick) return;   // 去重
        st.lastRevoltTick = tick;
        st.revolt = (v && v.id) || null;
        // 藩乱爆发core代价：稳定大跌、民变险、军力与粮出
        GameState.stats.stability = Math.max(0, (GameState.stats.stability || 0) - 10);
        GameState.stats.militaryPower = Math.max(0, (GameState.stats.militaryPower || 0) - 80); // 抽调平乱之军
        GameState.stats.food = Math.max(0, (GameState.stats.food || 0) - 60);                    // 粮道断绝
        GameState.stats.prestige = Math.max(0, (GameState.stats.prestige || 0) - 4);            // 示弱于天下
        GameState.factions = GameState.factions || {};
        GameState.factions.royal = Math.max(20, (GameState.factions.royal || 50) - 5);
        st.revoltHistory.push({ vassalId: v && v.id, name: v && v.name, tick: tick, outcome: 'pending' });
        if (st.revoltHistory.length > 20) st.revoltHistory.shift();
        pushNews('藩乱', (v ? v.name : '藩王') + '举甲称乱，藩兵竟起，烽火遍野，民变随之。若不速定，社稷动摇！', 'critical');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('urgent'); } catch (e) {}
    } catch (e) {}
}

// ====== 平乱三择（zfQuellRevolt）：招抚/讨伐/哽咽暧昧，各有代价 ======
function zfQuellRevolt(mode) {
    try {
        if (!GameState.zongfan) return false;
        var st = GameState.zongfan;
        var vid = st.revolt; if (!vid) return false;
        var v = zfFindRef(vid);
        if (mode === 'zhaofu') {
            // 招抚：俯首就抚、册而不削——耗国库买安，示弱损威望
            if (GameState.stats.treasury < ZF_FU_FEE) { pushNews('藩乱', '招抚之费不继。', 'normal'); return false; }
            GameState.stats.treasury -= ZF_FU_FEE;
            GameState.stats.stability = Math.max(0, (GameState.stats.stability || 0) + 2);   // 暂定
            GameState.stats.prestige = Math.max(0, (GameState.stats.prestige || 0) - 3);      // 示弱
            if (v) { v.loyalty = Math.max(30, (v.loyalty || 0) + 4); v.reward = Math.max(100, (v.reward || 0) + 300); }
            pushNews('藩乱', '以' + ZF_FU_FEE + '两招抚' + (v ? v.name : '叛藩') + '，许其仍食旧禄。乱平而国威稍损，宗室竟以反要挟而得利。', 'normal');
        } else if (mode === 'taofa') {
            // 讨伐：雷霆一击，平乱而元气大伤
            if (GameState.stats.treasury < ZF_TAO_FEE) { pushNews('藩乱', '师出粮秣不继，且从长计。', 'normal'); return false; }
            GameState.stats.treasury -= ZF_TAO_FEE;
            GameState.stats.stability = Math.max(0, (GameState.stats.stability || 0) - 4);   // 兵燹动荡
            GameState.stats.prestige = Math.max(0, (GameState.stats.prestige || 0) + 2);     // 立威
            GameState.stats.militaryPower = Math.max(0, (GameState.stats.militaryPower || 0) - 60); // 军力折损
            GameState.stats.mandate = Math.max(0, (GameState.stats.mandate || 0) - 2);       // 骨肉相残，天命微损
            if (v) {
                st.vassals = st.vassals.filter(function (x) { return x.id !== vid; });
                st.recall = Math.min(1, (st.recall || 0) + 0.04);
            }
            pushNews('藩乱', '王师讨平' + (v ? v.name : '藩乱') + '，斩其渠。乱平而军民死者枕藉，骨肉之憾铭于史册。', 'critical');
        } else {
            // 哽咽暧昧：优柔不决，内帑/国库私了，乱虽寝而宗声益炽、副作用更深
            var fee = ZF_AI_FEE;
            var purse = GameState.stats.privyPurse || 0;
            if (GameState.stats.treasury + purse < fee) { pushNews('藩乱', '私了之费不继。', 'normal'); return false; }
            if (purse >= fee) { GameState.stats.privyPurse -= fee; }
            else { var left = fee - purse; GameState.stats.privyPurse = 0; GameState.stats.treasury = Math.max(-50000, GameState.stats.treasury - left); }
            GameState.stats.stability = Math.max(0, (GameState.stats.stability || 0) - 6);   // 优柔示弱，民怨愈深
            GameState.stats.prestige = Math.max(0, (GameState.stats.prestige || 0) - 4);
            if (v) { v.loyalty = Math.max(25, (v.loyalty || 0) - 3); }
            pushNews('藩乱', '内廷以' + fee + '两私赍弥隙，缓其作乱。然优柔示弱，宗室愈骄，民望愈失。', 'normal');
        }
        st.revolt = null;
        zfRecomputeBurden();
        return true;
    } catch (e) { return false; }
}

// ====== 宗藩看板（新 tab 'zongfan'）=======
function renderZongfanTab() {
    try {
        if (!GameState.zongfan) GameState.zongfan = initZongfanState();
        var st = GameState.zongfan; zfEnsure();
        var vs = st.vassals || [];
        var total = zfTotalReward(st);
        var burden = st.fiefBurden || 0;
        var burdenCls = burden >= ZF_BURDEN_CRIT ? 'zf-bad' : (burden >= ZF_BURDEN_HIGH ? 'zf-warn' : 'zf-good');

        var burdenRow = '<div class="zf-dispute-row">'
            + '<span class="zf-label">宗禄占岁入</span>'
            + '<div class="zf-bar zf-bar-burden"><div class="zf-fill ' + burdenCls + '" style="width:' + Math.max(0, Math.min(100, burden * 100)) + '%"></div></div>'
            + '<span class="zf-val">' + Math.round(burden * 100) + '/100</span></div>';
        if (burden >= ZF_BURDEN_CRIT) burdenRow += '<div class="zf-warn-text">宗禄已及十之' + Math.round(burden * 100) + '——禄米成绞索，民力困、盗贼窥，削藩之议不可再缓。</div>';
        else if (burden >= ZF_BURDEN_HIGH) burdenRow += '<div class="zf-warn-text">宗禄偏高，府库承压，当议裁削宗支。</div>';

        // 藩王表
        var rows;
        if (vs.length === 0) {
            rows = '<div class="zf-empty">藩封已尽收归朝——然而皇皇子孙无穷，禄米之源未绝，慎之。</div>';
        } else {
            rows = vs.map(function (v) {
                var revBtns = '<button class="zf-btn zf-btn-sm" onclick="zfReduceStipend(\'' + v.id + '\')">减禄</button>'
                    + '<button class="zf-btn zf-btn-sm" onclick="zfRevoke(\'' + v.id + '\',\'step\')">渐削</button>'
                    + '<button class="zf-btn zf-btn-sm zf-btn-danger" onclick="zfRevoke(\'' + v.id + '\',\'one\')">一削</button>';
                return '<div class="zf-v-row">'
                    + '<div class="zf-vname">' + v.name + '<span class="zf-vgen">（' + v.generation + '代 · ' + v.source + '）</span></div>'
                    + '<div class="zf-vmeta">封' + v.region + ' · 禄' + v.reward + '两/年</div>'
                    + zfBar('忠诚', v.loyalty, zfCls(v.loyalty))
                    + zfBar('武略', v.martial, zfCls(v.martial))
                    + '<div class="zf-vact">' + revBtns + '</div>'
                    + '</div>';
            }).join('');
        }

        // 平乱框（若有藩乱待平）
        var revoltBox = '';
        if (st.revolt) {
            var rv = zfFindRef(st.revolt);
            revoltBox = '<div class="zf-revolt">藩王' + (rv ? rv.name : '叛藩') + '举甲称乱，烽火遍野！平乱三策：'
                + '<button class="zf-btn zf-btn-solid" onclick="zfQuellRevolt(\'zhaofu\')">招抚</button>'
                + '<button class="zf-btn zf-btn-solid" onclick="zfQuellRevolt(\'taofa\')">讨伐</button>'
                + '<button class="zf-btn" onclick="zfQuellRevolt(\'aiwei\')">哽咽暧昧</button>'
                + '</div>';
        }

        var mgmt = '<div class="zf-mgmt"><div class="section-title">宗藩处置</div><div class="zf-mgmt-row">'
            + '<button class="zf-btn zf-btn-solid" onclick="zfEnfeoff()">封藩（' + ZF_ENF_FEE + '两）</button>'
            + '<span class="zf-hint-inline">封得越爽，后世医保你哭。</span>'
            + '</div></div>';

        return '<div class="zf-wrap" id="zongfan-panel">'
            + '<div class="zf-banner">「亲王之禄，岁赐万石，郡王而下，支庶繁衍，坐食愈众。」——《明史》卷82·食货志·宗禄（节引）</div>'
            + '<h4 class="section-title">宗藩禄米（国之痼疾）</h4>'
            + '<div class="zf-summary"><div class="zf-sum-item"><span class="zf-sum-label">岁宗禄</span><span class="zf-sum-val ink">' + total + '两</span></div>'
            + '<div class="zf-sum-item"><span class="zf-sum-label">藩数</span><span class="zf-sum-val">' + vs.length + '</span></div>'
            + '<div class="zf-sum-item"><span class="zf-sum-label">归朝</span><span class="zf-sum-val">' + Math.round((st.recall || 0) * 100) + '%</span></div></div>'
            + burdenRow
            + '<div class="zf-vassals">' + rows + '</div>'
            + revoltBox
            + mgmt
            + '<div class="zf-hint">封藩御外，然支庶日繁、禄米坐食，宗室遂为国蠹。减禄怨望、削藩生乱——无最优解，唯权衡之。' + ZF_SRC + '；岁禄折银与膨胀系演绎。</div>'
            + '<div class="zf-src">史据：《明史》卷82·食货志（宗禄）/卷116-119·诸王传/卷7·成祖本纪（靖难·削藩之戒）；削藩数值系演绎。</div>'
            + '</div>';
    } catch (e) {
        return '<div class="zf-wrap">宗藩事宜暂安。</div>';
    }
}