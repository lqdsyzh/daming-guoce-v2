// ============================================
// 《大明国策》批I · 科举深化（keju_deep.js）
// ============================================
// 目标：把浅层科举深化为反爽治理——殿试裁定三鼎甲（才学 vs 背景权衡）、
//       座师门生认同（清流派系·或成党祸）、科场舞弊案东窗事发（彻查 vs 压下两难）、
//       恩科加开（耗国库换士林好感·有冷却）。
// 核心状态 GameState.kejuDeep = {
//   topThree:[{name,talent,background,backing,rank}],   // 三鼎甲（一甲三人）
//   mentorship:[{mentor,students,tick}],                // 座师门生网
//   scandal:[...], pendingScandal:{...},                // 舞弊案
//   grace (恩科次数), dirt (暗浊污点), cd:{...},
//   lastScandalTick, lastTick }
// 反爽铁律：殿试点错伤清议或触权贵；门生网是双刃剑；舞弊彻查伤情面、压下损朝廷；
//           恩科耗民力。均无白嫖，各含真实代价。
// 史据：《明史》卷70·选举志二（殿试三甲/探花授翰林/恩科/座主门生）；卷231·顾宪成传（清流）；
//       卷306·宦官传/佞幸（科场权阉干政·丁酉科场案范畴）；丁酉科场案见《明史》卷70选举志。
//       三鼎甲名次授官与恩科频率按明制取意，属「演绎简化」。
// 铁律：全逻辑 try-catch、id/class 常量化、kd/KD_ 前缀防冲突、整数化计数器挂链尾、
//       edict 永久 DOM 不动、style.css 只末尾追加（本文件因 v5d G-06 阈值仅余 5 字节，
//       改为运行时注入自包含 .kd-* 样式，不动 style.css，见交付说明）。
// ============================================

// —— 常量（kd/KD_ 前缀防冲突）——
var KD_GRACE_COST   = 800;   // 恩科之费（两·演绎，取正科之半，示民力耗）
var KD_GRACE_CD     = 4;     // 恩科冷却（章）
var KD_PALACE_CD    = 2;     // 殿试冷却（章）
var KD_MENTOR_CD    = 2;     // 座师收徒冷却（章）
var KD_GRACE_PASS   = 12;    // 恩科加额录取（人·演绎）
var KD_CAND_HIGH    = 70;    // 状元才学「高」阈值（才学>=此为当之无愧）
var KD_SRC = '《明史》卷70·选举志二';
var KD_SRC_FULL = '《明史》卷70·选举志二（殿试一甲三人/状元授修撰·榜眼探花授编修/恩科）/卷231·顾宪成传（清流）/卷306·宦官传（科场权阉干政·丁酉科场案范畴）；三鼎甲名次与恩科频率系演绎简化。';

var KD_CAND_NAMES = ['沈耀宗','顾庭兰','徐廷芝','周文苑','郑士衡','王慎言','李东川','刘慕白','赵怀瑾','钱清远'];
var KD_BACKING = { powerful: 'royal', cold: 'civil' };  // 权贵子→宗党；寒门才→清流

// 运行时注入 .kd-* 样式（自包含·不含动 style.css；含移动端响应式）
var KD_CSS =
    '.kd-wrap{font-size:13px;color:#5a2f0f;line-height:1.6;margin-top:10px;border-top:1px dashed #e0d2b0;padding-top:8px}' +
    '.kd-title{font-size:13px;font-weight:700;color:#5a2f0f;margin:6px 0 4px}' +
    '.kd-row{display:flex;align-items:center;gap:8px;margin:5px 0;flex-wrap:wrap}' +
    '.kd-cand{border:1px solid #d9c39a;background:#fffdf4;border-radius:8px;padding:7px 10px;margin:6px 0}' +
    '.kd-cname{font-weight:700;color:#5a2f0f}.kd-cmeta{font-size:12px;color:#7a6a4a;margin:2px 0}' +
    '.kd-rankbtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}' +
    '.kd-btn{background:#f4e8c9;border:1px solid #c9a96a;color:#5a2f0f;border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer}' +
    '.kd-btn:hover{background:#e8d4a8}' +
    '.kd-btn-solid{background:#5a3a12;color:#f7efd6;border-color:#5a3a12}' +
    '.kd-btn-solid:hover{background:#7a5220}' +
    '.kd-btn-d{background:#a33;color:#fff;border-color:#a33}.kd-btn-d:hover{background:#c44}' +
    '.kd-tag{font-size:10px;padding:1px 6px;border-radius:10px}.kd-tag-good{background:#e2ecce;color:#4c6a1f}.kd-tag-bad{background:#f6d6d6;color:#8a1f1f}' +
    '.kd-top{display:flex;gap:8px;margin:6px 0}.kd-top-it{flex:1;border:1px solid #d9c39a;background:#faf3e0;border-radius:8px;padding:5px 8px;text-align:center}' +
    '.kd-top-rank{font-size:11px;color:#9a8a6a}.kd-top-nm{font-weight:700;color:#5a2f0f;font-size:13px}.kd-top-tl{font-size:11px;color:#7a6a4a}' +
    '.kd-sc{border:1px solid #a33;background:#fbeaea;border-radius:8px;padding:8px 12px;font-size:12px;color:#7a1f1f;margin:6px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '.kd-hint{font-size:11px;color:#8a7a5a;line-height:1.7;margin-top:6px}' +
    '.kd-src{font-size:10.5px;color:#9a8a6a;margin-top:3px;line-height:1.5}' +
    '.kd-warn{font-size:11px;color:#a67;margin:3px 0}' +
    '@media (max-width:720px){.kd-row{flex-direction:column;align-items:stretch}.kd-top{flex-direction:column}.kd-rankbtns,.kd-sc{flex-direction:column;align-items:stretch}.kd-btn{text-align:left}}';
var KD_STYLE_INJECTED = false;
function kdInjectStyle() {
    if (KD_STYLE_INJECTED) return;
    KD_STYLE_INJECTED = true;
    try {
        var st = document.createElement('style');
        st.id = 'keju-deep-style';
        st.textContent = KD_CSS;
        if (document.head) document.head.appendChild(st);
    } catch (e) {}
}

// —— 状态初始化 ——
function initKejuDeepState() {
    return { topThree: [], mentorship: [], scandal: [], pendingScandal: null,
        grace: 0, dirt: 0, cd: {}, forceCandidates: null,
        lastScandalTick: -99, lastTick: -99 };
}

// 状态兜底（旧档/子键缺失补齐，不覆盖既有）
function kdEnsure() {
    try {
        if (!GameState.kejuDeep || typeof GameState.kejuDeep !== 'object') {
            GameState.kejuDeep = initKejuDeepState(); return;
        }
        var st = GameState.kejuDeep;
        if (!st.topThree) st.topThree = [];
        if (!st.mentorship) st.mentorship = [];
        if (!st.scandal) st.scandal = [];
        if (st.pendingScandal === undefined) st.pendingScandal = null;
        if (st.grace === undefined) st.grace = 0;
        if (st.dirt === undefined) st.dirt = 0;
        if (!st.cd) st.cd = {};
        if (st.lastScandalTick === undefined) st.lastScandalTick = -99;
        if (st.lastTick === undefined) st.lastTick = -99;
    } catch (e) {}
}

function kdNow() { try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; } }

// 确定性伪随机 -1..1（替代 Math.random，便于测试钳制）
function kdDet(seed) {
    var x = (typeof seed === 'string') ? kdHash(seed) : (seed === undefined ? 1 : (seed | 0));
    x = (x ^ (x >>> 16)) * 0x21f0aaad; x = (x ^ (x >>> 15)) * 0x735a2d97; x = x ^ (x >>> 15);
    return ((x % 11) - 5) / 5;   // -> -1..1
}
function kdHash(s) {
    var h = 7; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h;
}
function kdClamp(v, lo, hi) { v = +v || 0; return Math.max(lo, Math.min(hi, v)); }
function kdFac() { if (!GameState.factions) GameState.factions = {}; return GameState.factions; }
function kdModFac(k, d) { var f = kdFac(); f[k] = kdClamp((f[k] || 50) + d, 0, 100); }

// ======================= 殿试（kdPalaceExam 系） =======================
// 会试中式者可殿试：生成 3-5 名候选人（才学 vs 背景），玩家裁定三鼎甲。
// 测试可经 st.forceCandidates 钳制候选人。
function kdConvenePalaceExam() {
    try {
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var tick = kdNow();
        if (st.cd.palace && tick - st.cd.palace < KD_PALACE_CD) {
            pushNews('科举', '殿试方绕卷毕，考官磨勘未竟，且缓一缓。', 'normal'); return false;
        }
        var cands = (Array.isArray(st.forceCandidates) && st.forceCandidates.length) ? st.forceCandidates : kdMakeCandidates(st);
        if (!cands || !cands.length) { pushNews('科举', '本科中式之士尚寡，无足殿试。', 'normal'); return false; }
        st.pending = { cands: cands, ranks: {} };
        st.cd.palace = tick;
        pushNews('殿试', '会试中式者进殿对策，恭请陛下裁定一甲名次。（' + KD_SRC + '）', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('decide'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// 生成候选人：才学由确定性种子决定；背景寒门/权贵（权贵者受宗党/内宦庇护）
function kdMakeCandidates(st) {
    var n = 3 + Math.floor(Math.abs(kdDet('n' + (st.grace || 0))) * 1.6 + 0.5); // 3..5（钳制确定性范围内）
    n = kdClamp(n, 3, 5);
    var out = [];
    for (var i = 0; i < n; i++) {
        var sd = kdDet('c' + i + '_' + (st.grace || 0));
        var talent = Math.round(kdClamp(58 + sd * 26, 38, 94));
        var bg = (kdDet('bg' + i) > 0.15) ? 'cold' : 'powerful';   // 多以寒门，间有权贵（更反爽）
        var backing = (bg === 'powerful') ? 'royal' : 'civil';
        out.push({ id: 'kdc_' + i, name: KD_CAND_NAMES[i % KD_CAND_NAMES.length],
            talent: talent, background: bg, backing: backing,
            used: false });
    }
    return out;
}

// 玩家点定某候选人为何名（状元/榜眼/探花）。选中后不可再改，三甲满即殿试毕。
function kdAssignRank(candId, rank) {
    try {
        if (!GameState.kejuDeep || !GameState.kejuDeep.pending) return false;
        var st = GameState.kejuDeep;
        var p = st.pending;
        if (p.ranks && p.ranks[rank]) return false;              // 该名已授
        var c = null;
        for (var i = 0; i < p.cands.length; i++) { if (p.cands[i].id === candId) { c = p.cands[i]; break; } }
        if (!c || c.used) return false;
        c.used = true;
        if (!p.ranks) p.ranks = {};
        p.ranks[rank] = candId;
        if (Object.keys(p.ranks).length >= 3) kdFinalizePalace();
        return true;
    } catch (e) { return false; }
}

// 名次常量：状元=zhuangyuan/榜眼=bangyan/探花=tanhua（明制一甲三人）
var KD_RANK_LABEL = { zhuangyuan: '状元', bangyan: '榜眼', tanhua: '探花' };

// 殿试裁定——三鼎甲名次后果（确定性·反爽权衡）
function kdFinalizePalace() {
    try {
        if (!GameState.kejuDeep || !GameState.kejuDeep.pending) return false;
        var st = GameState.kejuDeep;
        var p = st.pending;
        var rankKeys = ['zhuangyuan', 'bangyan', 'tanhua'];
        var top = [], chk = {}, ev = [];
        for (var r = 0; r < rankKeys.length; r++) {
            var rk = rankKeys[r];
            var cid = p.ranks[rk];
            var c = null;
            for (var i = 0; i < p.cands.length; i++) { if (p.cands[i].id === cid) { c = p.cands[i]; break; } }
            if (!c) return false;
            top.push({ name: c.name, talent: c.talent, background: c.background, backing: c.backing, rank: rk, rankLabel: KD_RANK_LABEL[rk] });
            ev.push(kdDingjiaEffects(c, rk));
        }
        st.topThree = top;
        st.pending = null;
        // 探花授翰林 → 储才清议+
        kdModFac('civil', 2);
        GameState.stats.stability = kdClamp((GameState.stats.stability || 0) + 1, 0, 100);
        var worst = null;
        for (var e = 0; e < ev.length; e++) {
            if (ev[e].worst && (!worst || ev[e].worst > worst)) worst = ev[e].worst;
        }
        pushNews('殿试', '陛下亲擢一甲：' + top.map(function(t){ return t.rankLabel + '·' + t.name; }).join('，') + '。'
            + (worst ? ' ' + worst : '') + '（明制：一甲三名，状元授修撰，榜眼探花授编修·' + KD_SRC + '）', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('good'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// 单名后果：点状元须权衡才学 vs 背景；无绝对最优，点错伤清议或触权贵。
function kdDingjiaEffects(c, rank) {
    var worst = null;
    try {
        if (rank === 'zhuangyuan') {
            if (c.background === 'powerful') {
                // 点权贵之子为状元：其党得势，然若才学不副则士林寒心
                kdModFac(c.backing || 'royal', 5);
                if (c.talent < KD_CAND_HIGH) { kdModFac('civil', -6); worst = '权贵之泽虽厚，士林以才学不副失望，清议稍挫。'; }
                else { kdModFac('civil', -1); }
            } else {
                // 寒门才子为状元：士林悦服，然触权贵侧目
                kdModFac('civil', 5);
                if (c.talent >= KD_CAND_HIGH) { GameState.stats.prestige = kdClamp((GameState.stats.prestige || 0) + 1, 0, 100); }
                kdModFac('royal', -2);
            }
        } else if (rank === 'bangyan') {
            // 榜眼：才学与背景各半，失中则两不得罪亦两不讨好
            if (c.background === 'powerful' && c.talent < KD_CAND_HIGH) { kdModFac('civil', -2); }
            else if (c.background === 'cold' && c.talent >= KD_CAND_HIGH) { GameState.stats.prestige = kdClamp((GameState.stats.prestige || 0) + 1, 0, 100); }
        }
        // 探花后果在 kdFinalizePalace 统一（授翰林·清议+）
        return { worst: worst };
    } catch (e) { return { worst: worst }; }
}

// ======================= 座师门生（kdMentor 系） =======================
// 中式新官归座师门下 → 纳入清流派系（联动 intrigue 党力）；门生网是双刃剑。
function kdMentorNew(mentorIdx) {
    try {
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var tick = kdNow();
        if (st.cd.mentor && tick - st.cd.mentor < KD_MENTOR_CD) {
            pushNews('座师', '座主已各收门生，骤再援引，恐招朋党之讥。', 'normal'); return false;
        }
        var civil = ((GameState.ministers && GameState.ministers.civil) || []).filter(function(m){ return m && !m.jailed && !m.dead && !m.exiled; });
        if (mentorIdx === undefined || mentorIdx >= civil.length) {
            pushNews('座师', '朝中督学主考之臣不备，无从作座主。', 'normal'); return false;
        }
        var m = civil[mentorIdx];
        var stus = (st.topThree || []).slice(0, 3).map(function(t){ return t.name; });
        if (!stus.length) { pushNews('座师', '尚无中式俊彦可列门下，先举殿试再来。', 'normal'); return false; }
        st.cd.mentor = tick;
        // 门生归清流派系：师门气焰（才学愈高，清流愈盛）与座主导引
        var str = 0; for (var i = 0; i < stus.length; i++) { var tl = st.topThree[i] || {}; str += (tl.talent >= KD_CAND_HIGH ? 2 : 0); }
        kdModFac('civil', 2 + str);
        GameState.stats.stability = kdClamp((GameState.stats.stability || 0) + 1, 0, 100);
        m.loyalty = kdClamp((m.loyalty || 50) + 6, 0, 100);
        m.ability = kdClamp((m.ability || 50) + 2, 0, 100);   // 门生相辅
        st.mentorship.push({ mentor: m.name, students: stus.slice(), tick: tick, ability: (m.ability || 50) });
        // 联动 intrigue：若座帅入清流党，则其党力随门生而张（门生可作党羽）
        try {
            if (typeof itLiveMinisters === 'function' && typeof ensureIntrigueState === 'function' && GameState.intrigue) {
                ensureIntrigueState();
                var itm = (GameState.intrigue.memberClique || {})[m.name];
                if (itm && GameState.intrigue.cliques[itm] && GameState.intrigue.cliques[itm].members) {
                    // 座主已在某党：门生自然入其党羽网（党力微张）
                    GameState.intrigue.cliques[itm].power = kdClamp((GameState.intrigue.cliques[itm].power || 0) + (str ? 2 : 1), 0, 100);
                }
            }
        } catch (e) {}
        pushNews('座师', m.name + '收' + stus.join('、') + '为门生，清流之悦，然朋党援引之讥亦随之。（座主门生，明制相沿·' + KD_SRC + '；顾宪成东林结党，' + '《明史》卷231·顾宪成传' + '）', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('decide'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// ======================= 科场舞弊案（kdScandal 系） =======================
// 贿赂考官东窗事发（可由厂卫侦得或偶然败露）→ 玩家处置：彻查 vs 压下（反爽两难）。
function kdExposeScandal() {
    try {
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var tick = kdNow();
        if (st.lastScandalTick === tick) return;   // 去重（同 tick 只曝一起）
        st.lastScandalTick = tick;
        var cheat = (GameState.kejuState && GameState.kejuState.cheatCount) || 0;
        if (cheat <= (st._exposedCheat || 0)) return;   // 有新舞弊才可能败露
        // 确定性：新舞弊是否东窗事发（可经 st.forceScandal 钳制）
        var roll = (typeof st.forceScandal === 'number') ? st.forceScandal : kdDet('scandal' + cheat + '_' + tick);
        if (roll <= -0.55) return;   // 春秋笔法，未败露（确定性·偶败露，非每起皆发）
        st._exposedCheat = cheat;
        var ex = '主考官';
        var mentors = st.mentorship || [];
        var touched = null;
        if (mentors.length && (mentors[mentors.length - 1].students || []).length) {
            touched = mentors[mentors.length - 1];   // 涉弊之官，或师门中人
        }
        st.pendingScandal = {
            examiner: ex, mentor: touched ? touched.mentor : null,
            amount: 300 + Math.floor(Math.abs(kdDet('amt' + cheat)) * 600),
            tick: tick, cheat: cheat
        };
        pushNews('科场', '考试官受赇鬻题，科场舞弊事泄！（' + KD_SRC + '；丁酉科场案之痛）', 'critical');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('urgent'); } catch (e) {}
    } catch (e) {}
}

// 处置舞弊案：mode 'check'=彻查 / 'cover'=压下（反爽两难）
function kdResolveScandal(mode) {
    try {
        if (!GameState.kejuDeep || !GameState.kejuDeep.pendingScandal) { pushNews('科场', '无人受劾，科场宁靖。', 'normal'); return false; }
        var st = GameState.kejuDeep;
        var sc = st.pendingScandal;
        if (mode === 'check') {
            // 彻查：追赃立威、朝廷可信，然伤士林情面、连累师门
            var rec = Math.floor((sc.amount || 0) * 0.6);
            GameState.stats.treasury = kdClamp((GameState.stats.treasury || 0) + rec, -50000, 9e9);
            GameState.stats.prestige = kdClamp((GameState.stats.prestige || 0) + 2, 0, 100);
            GameState.stats.stability = kdClamp((GameState.stats.stability || 0) + 1, 0, 100);
            kdModFac('civil', -3);   // 伤士林情面（朝中翰苑侧目）
            if (sc.mentor) { kdModFac('civil', -2); GameState.stats.stability = kdClamp((GameState.stats.stability || 0) - 1, 0, 100); } // 连累师门
            st.scandal.push({ mode: 'check', recov: rec, mentor: sc.mentor, tick: sc.tick, note: '彻查' });
            pushNews('科场', '诏狱穷治，坐赇' + rec + '两入国库。纲纪稍肃，然翰苑士林以师门授连，寒心窃议。', 'critical');
            try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('warn'); } catch (e) {}
        } else {
            // 压下：护师门、暂安朝局，然朝廷失信、清议猛跌、暗增污点
            if (sc.mentor) kdModFac('royal', 2);   // 被护之党感恩
            GameState.stats.prestige = kdClamp((GameState.stats.prestige || 0) - 3, 0, 100);
            kdModFac('civil', -6);                 // 朝野皆知压案，清议猛跌
            st.dirt = (st.dirt || 0) + 1;          // 暗浊污点（积久损天命·声望）
            st.scandal.push({ mode: 'cover', mentor: sc.mentor, tick: sc.tick, note: '压下（暗添污点）' });
            pushNews('科场', '内廷密旨，寝此狱，护师门而息物议。然天下侧目，清议哗然，朝廷威信为之损。', 'normal');
            try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('urgent'); } catch (e) {}
        }
        st.pendingScandal = null;
        return true;
    } catch (e) { return false; }
}

// ======================= 恩科（kdGraceExam） =======================
// 皇帝加开一科：耗国库换士林好感/人才（有冷却·无白嫖）
function kdHoldGraceExam() {
    try {
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var tick = kdNow();
        if (st.cd.grace && tick - st.cd.grace < KD_GRACE_CD) {
            pushNews('恩科', '方开正科未几，复增恩科，恐旷日废财，諫阻者众。', 'normal'); return false;
        }
        if ((GameState.stats.treasury || 0) < KD_GRACE_COST) {
            pushNews('恩科', '府库不充，无从加科开恩。', 'critical'); return false;
        }
        GameState.stats.treasury = kdClamp((GameState.stats.treasury || 0) - KD_GRACE_COST, -50000, 9e9);
        GameState.stats.food = kdClamp((GameState.stats.food || 0) - 20, 0, 9e9); // 民力耗（粮道微损）
        kdModFac('civil', 4);             // 士林好感
        GameState.stats.prestige = kdClamp((GameState.stats.prestige || 0) + 1, 0, 100);
        if (typeof GameState.kejuState === 'undefined' || !GameState.kejuState) { try { GameState.kejuState = initKejuState(); } catch (e) {} }
        if (GameState.kejuState) GameState.kejuState.passCount = (GameState.kejuState.passCount || 0) + KD_GRACE_PASS;
        st.grace = (st.grace || 0) + 1;
        st.cd.grace = tick;
        pushNews('恩科', '加开恩科，广额录取' + KD_GRACE_PASS + '人。士林欢忭，然耗库' + KD_GRACE_COST + '两、民力亦疲。（明代正科外间有加科曰"恩科"，取意简化·' + KD_SRC + '）', 'normal');
        try { if (typeof DamingSFX !== 'undefined' && DamingSFX.play) DamingSFX.play('coin'); } catch (e) {}
        return true;
    } catch (e) { return false; }
}

// ======================= 每季巡检（kdTick） =======================
// 挂 advanceSeason 链尾（整数化·去重）。当前仅曝舞弊案（据 keju cheatCount 确定性触发）。
function kdTick() {
    try {
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var tick = kdNow();
        if (st.lastTick === tick) return;
        st.lastTick = tick;
        kdExposeScandal();   // 曝舞弊（内部亦按 tick 去重）
    } catch (e) {}
}

// ======================= 科举深化看板（并入 keju tab） =======================
function kdMentorOptions() {
    try {
        var civil = ((GameState.ministers && GameState.ministers.civil) || []).filter(function(m){ return m && !m.jailed && !m.dead && !m.exiled; });
        if (!civil.length) return '<span>朝中文官不备，无从作座主。</span>';
        return '<div class="kd-row">' + civil.map(function(m, i){
            return '<button class="kd-btn" onclick="kdMentorNew(' + i + ')">' + m.name + '收门生</button>';
        }).join('') + '</div>';
    } catch (e) { return ''; }
}

function renderKejuDeepTab() {
    try {
        kdInjectStyle();
        if (!GameState.kejuDeep) GameState.kejuDeep = initKejuDeepState();
        var st = GameState.kejuDeep; kdEnsure();
        var h = '<div class="kd-wrap" id="keju-deep-panel">';

        // —— 殿试 ——
        h += '<div class="kd-title">殿试·三鼎甲（才学 vs 背景，无绝对最优）</div>';
        if (st.pending && st.pending.cands) {
            var done = (st.pending.ranks && Object.keys(st.pending.ranks).length) || 0;
            var candRows = st.pending.cands.map(function(c){
                var used = c.used ? '<span class="kd-tag kd-tag-bad">已授名</span>' : '';
                var btns = ['zhuangyuan','bangyan','tanhua'].map(function(rk){
                    return '<button class="kd-btn' + (rk==='zhuangyuan' ? ' kd-btn-solid' : '') + '" ' +
                        (st.pending.ranks && st.pending.ranks[rk] ? 'disabled' : '') + ' onclick="kdAssignRank(\'' + c.id + '\',\'' + rk + '\')">'
                        + KD_RANK_LABEL[rk] + '</button>';
                }).join('');
                return '<div class="kd-cand"><div class="kd-cname">' + c.name + ' ' + used + '</div>'
                    + '<div class="kd-cmeta">才学 ' + c.talent + ' · ' + (c.background === 'cold' ? '寒门' : '权贵之子') + '</div>'
                    + '<div class="kd-rankbtns">' + btns + '</div></div>';
            }).join('');
            h += '<div>' + candRows + '</div>';
            h += '<div class="kd-warn">已授 ' + done + ' / 3 · 三甲满即定鼎。点才学高者悦士林而触权贵；点权贵子则其党得势、才学不副则伤清议。</div>';
        } else {
            h += '<div class="kd-row"><button class="kd-btn kd-btn-solid" onclick="kdConvenePalaceExam()">举殿试</button>'
                + '<span class="kd-hint-inline" style="font-size:11px;color:#a67">会试中式者方可入闱（演消毒不必科科皆有中式）</span></div>';
        }
        if (st.topThree && st.topThree.length) {
            h += '<div class="kd-top">' + st.topThree.map(function(t){
                return '<div class="kd-top-it"><div class="kd-top-rank">' + t.rankLabel + '</div><div class="kd-top-nm">' + t.name + '</div>'
                    + '<div class="kd-top-tl">才学 ' + t.talent + ' · ' + (t.background === 'cold' ? '寒门' : '权贵') + '</div></div>';
            }).join('') + '</div>';
        }

        // —— 座师门生 ——
        h += '<div class="kd-title">座师门生（纳入清流派系·或成党祸）</div>';
        h += kdMentorOptions();
        if (st.mentorship && st.mentorship.length) {
            h += '<ul style="margin:4px 0 6px;padding-left:18px">' + st.mentorship.slice(-4).map(function(mn){
                return '<li style="font-size:12px;color:#5a2f0f">' + mn.mentor + '门下：' + mn.students.join('、') + '</li>';
            }).join('') + '</ul>';
        }

        // —— 舞弊案 ——
        if (st.pendingScandal) {
            h += '<div class="kd-title">科场舞弊案（东窗事发·彻查 vs 压下）</div>';
            var mt = st.pendingScandal.mentor;
            h += '<div class="kd-sc">考官受赇鬻题' + (mt ? '（牵连座师 ' + mt + '）' : '') + '，坐赃 or 涉案不详。'
                + '<button class="kd-btn kd-btn-d" onclick="kdResolveScandal(\'check\')">彻查</button>'
                + '<button class="kd-btn" onclick="kdResolveScandal(\'cover\')">压下</button>'
                + '</div><div class="kd-warn">彻查：追赃立威，伤士林情面、连累师门；压下：护师门暂安，然朝廷失信、清议猛跌、暗增污点。</div>';
        }

        // —— 恩科 ——
        h += '<div class="kd-title">恩科（耗国库·换士林好感·有冷却）</div>';
        var tick = kdNow();
        var graceCd = (st.cd.grace && tick - st.cd.grace < KD_GRACE_CD) ? (KD_GRACE_CD - (tick - st.cd.grace)) : 0;
        h += '<div class="kd-row"><button class="kd-btn kd-btn-solid" ' + (graceCd ? 'disabled' : '') + ' onclick="kdHoldGraceExam()">加开恩科（' + KD_GRACE_COST + '两）'
            + (graceCd ? '（' + graceCd + '章后）' : '') + '</button>'
            + '<span class="kd-hint-inline" style="font-size:11px;color:#a67">士林欢喜，然耗民力；无白嫖。</span></div>';

        h += '<div class="kd-hint">戒：科举者天下之大公，然铨政之弊，莫甚于座主门生、科场交通。殿试名次、门生网、舞弊处置、恩科加开——皆无最优解，唯权衡得失。' + KD_SRC_FULL + '</div>';
        h += '<div class="kd-src">史据：' + KD_SRC_FULL + '</div>';
        h += '</div>';
        return h;
    } catch (e) {
        return '<div class="kd-wrap">科举深化事宜暂安。</div>';
    }
}