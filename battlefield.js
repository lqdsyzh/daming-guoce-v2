// ============================================
// 《大明国策》v5.0 批C · 战棋/回合制小战引擎（通用战术层）
// 供「出师辽东」与「平叛战」两种战斗调用，微操布阵/士气/地形/火器
// 史据：《明史》兵志一·戎政 / 兵志三·营制（三大营） / 兵志四·火器（神机营佛郎机红衣） /
//       卷95·兵志九边 / 卷198·杨一清传（三边） / 卷238·李成梁传 /
//       卷178·郧阳韩雍（平叛） / 卷228·李化龙传（播州） / 卷276
// 反爽铁律：战斗必有代价——调饷抽兵、军需逐回合焚烧、战败追责、撤军损威。
// 纯前端零依赖，回合制（玩家决策→点「进」执行→看战报→下一回合），手机响应式。
// ============================================

// ---------- 战场常量 ----------
var BF_ROWS = 5;
var BF_COLS = 5;
var BF_MAX_TURNS = 8;

// 地形：{ 名, def加成, atk折损 }
var BF_TERRAINS = {
    plain:    { name: '平原', def: 1.0,  atk: 1.0 },
    mountain: { name: '山地', def: 1.30, atk: 0.9 },
    forest:   { name: '林地', def: 1.15, atk: 0.95 },
    river:    { name: '河流', def: 1.20, atk: 0.7 },
    city:     { name: '城池', def: 1.60, atk: 0.55 },
    pass:     { name: '关隘', def: 1.50, atk: 0.6 }
};

// 我方兵种
var BF_PLAYER_TYPES = {
    shenji: { name: '神机营',   role: 'firearm', atk: 1.35, def: 0.75, morale: 1.2 },
    jing:   { name: '京营三大营', role: 'line',   atk: 1.05, def: 1.10, morale: 1.0 },
    bian:   { name: '边军',     role: 'line',   atk: 1.15, def: 1.20, morale: 1.1 },
    shui:   { name: '水师',     role: 'navy',   atk: 0.95, def: 0.90, morale: 0.9 }
};

// 敌兵种
var BF_ENEMY_TYPES = {
    beilu:  { name: '北虏',   role: 'cav',   atk: 1.30, def: 0.85, morale: 0.9 },
    wokou:  { name: '倭寇',   role: 'ambus', atk: 1.20, def: 0.80, morale: 1.0 },
    panjun: { name: '叛军',   role: 'horde', atk: 0.95, def: 0.70, morale: 0.6 },
    tusi:   { name: '土司兵', role: 'line',  atk: 1.05, def: 1.00, morale: 0.8 },
    wubing: { name: '吴三桂兵', role: 'line', atk: 1.15, def: 1.05, morale: 0.9 }
};

// 战术指令：{ 士气消耗, 倍率, 克制 }
var BF_TACTICS = {
    attack:   { name: '进攻',    morale: 0,  mult: 1.25, beat: 'flank' },
    defend:   { name: '防守',    morale: 2,  mult: 0.55, beat: 'attack' },
    flank:    { name: '迂回',    morale: 3,  mult: 1.10, beat: 'supervise' },
    assault:  { name: '突袭',    morale: 5,  mult: 1.45, beat: 'flank' },
    volley:   { name: '火器齐射', morale: 6,  mult: 1.80, beat: 'cav' },
    supervise:{ name: '督战',    morale: -8, mult: 0.35, beat: 'none' }
};

// 布阵位形
var BF_FORMATIONS = {
    front:  { name: '先锋', atkMul: 1.2, defMul: 0.9 },
    center: { name: '中军', atkMul: 1.0, defMul: 1.1 },
    wing1:  { name: '左翼', atkMul: 1.1, defMul: 0.95 },
    wing2:  { name: '右翼', atkMul: 1.1, defMul: 0.95 },
    rear:   { name: '后队', atkMul: 0.85, defMul: 1.05 }
};

var BF_OUTCOME_NAMES = ['大捷', '惨胜', '相持', '败退', '帅殁', '撤军'];

// ---------- 状态兜底（存档链三件套之一：构造器默认） ----------
function initBattlefieldState() {
    return { active: false, mode: 'none', regionKey: null, regionName: '', gen: null, turn: 0,
             maxTurns: BF_MAX_TURNS, phase: 'idle', result: null, log: [], player: null,
             enemy: null, board: null, supply: { silverPerTurn: 0, foodPerTurn: 0, unpaid: 0 },
             flags: {}, createdAt: 0, _troopsSent: 0, _silver: 0, _food: 0 };
}
function bfEnsure() {
    try {
        if (!GameState.battlefield || typeof GameState.battlefield.phase === 'undefined') {
            GameState.battlefield = initBattlefieldState();
        }
    } catch (e) { try { GameState.battlefield = initBattlefieldState(); } catch (e2) {} }
    return GameState.battlefield;
}
function bfTick() {
    try { return (typeof getMapTick === 'function') ? getMapTick() : 1; } catch (e) { return 1; }
}
function bfRegionName(key) {
    try {
        const r = (typeof MAP_REGIONS !== 'undefined') ? MAP_REGIONS.find(function (x) { return x.key === key; }) : null;
        return r ? r.name : key;
    } catch (e) { return key; }
}

// ---------- 网格地形 ----------
function bfBuildBoard() {
    var g = [], r, c;
    for (r = 0; r < BF_ROWS; r++) {
        var row = [];
        for (c = 0; c < BF_COLS; c++) {
            var t = 'plain';
            if (r === 2 && (c === 0 || c === 4)) t = 'mountain';
            if (r === 1 && c === 2) t = 'forest';
            if (r === 3 && c === 2) t = 'river';
            if (r === 2 && c === 2) t = 'city';
            if (r === 2 && c === 1) t = 'pass';
            row.push({ t: t, def: BF_TERRAINS[t].def, atk: BF_TERRAINS[t].atk, r: r, c: c });
        }
        g.push(row);
    }
    return g;
}

// ---------- 单位工厂 ----------
function bfMkUnit(id, name, type, mult) {
    var t = BF_PLAYER_TYPES[type] || BF_ENEMY_TYPES[type] || { atk: 1, def: 1, morale: 1 };
    return { id: id, name: name, type: type, role: t.role || 'line',
             atk: Math.round(t.atk * mult * 100) / 100, def: t.def, mor: t.morale || 1.0,
             size: 50, alive: true };
}

// ---------- 生成我方部队 ----------
function bfGenPlayerUnits(troops, gen, mode) {
    var units = [];
    var bi = 0;
    var m = GameState.milOps && GameState.milOps.camps ? GameState.milOps : null;
    var firearms = m && m.firearms ? m.firearms : 0;
    if (firearms >= 1 && troops >= 25) {
        units.push(bfMkUnit('p' + (bi++), BF_PLAYER_TYPES.shenji.name, 'shenji', 1.35));
    }
    var jing = m && m.camps.jing ? m.camps.jing : 1;
    units.push(bfMkUnit('p' + (bi++), BF_PLAYER_TYPES.jing.name, 'jing', 1.0 + jing * 0.03));
    var bian = m && m.camps.bian ? m.camps.bian : 1;
    units.push(bfMkUnit('p' + (bi++), BF_PLAYER_TYPES.bian.name, 'bian', 1.0 + bian * 0.04));
    if (mode !== 'expedition') {
        var shui = m && m.camps.shui ? m.camps.shui : 1;
        units.push(bfMkUnit('p' + (bi++), BF_PLAYER_TYPES.shui.name, 'shui', 0.8 + shui * 0.03));
    }
    var scale = 0.55 + (troops / 100) * 0.45;
    units.forEach(function (u) {
        u.atk = Math.round(u.atk * scale * 100) / 100;
        u.size = Math.max(20, Math.round((troops / units.length) * (u.role === 'navy' ? 0.5 : 1)));
    });
    return units;
}

// ---------- 生成敌方部队（按战种），支持测试注入 ----------
function bfGenEnemyUnits(kind, difficulty) {
    var d = Math.max(0.7, Math.min(1.5, difficulty || 1.0));
    var units = [];
    var ei = 0;
    var mk = function (type, label, mult) {
        var t = BF_ENEMY_TYPES[type] || BF_ENEMY_TYPES.panjun;
        units.push(bfMkUnit('e' + (ei++), label || t.name, type, 1.0));
    };
    if (kind === 'wokou') { mk('wokou', '倭寇前队', 1.0); mk('wokou', '倭寇劲旅', 1.1); mk('panjun', '海寇步队', 0.8); }
    else if (kind === 'panjun') { mk('panjun', '叛军前阵', 1.0); mk('panjun', '叛军中坚', 1.05); mk('beilu', '裹胁之众', 0.7); }
    else if (kind === 'tusi') { mk('tusi', '土司精兵', 1.05); mk('tusi', '土司劲旅', 1.1); mk('panjun', '土兵支属', 0.8); }
    else if (kind === 'wubing') { mk('wubing', '吴兵前部', 1.1); mk('wubing', '吴兵铁骑', 1.2); mk('beilu', '吴藩步队', 0.95); }
    else { mk('beilu', '虏骑前部', 1.0); mk('beilu', '虏骑中坚', 1.15); mk('beilu', '虏棋步队', 0.9); }
    units.forEach(function (u) { u.atk = Math.round(u.atk * d * 100) / 100; u.size = 50 + Math.floor(Math.random() * 30); });
    return units;
}

// ---------- 布阵 ----------
function bfAssign(unitId, formation) {
    try {
        var b = GameState.battlefield;
        if (!b || b.phase !== 'deploy' || !BF_FORMATIONS[formation]) return false;
        var u = b.player.units.find(function (x) { return x.id === unitId; });
        if (!u) return false;
        Object.keys(b.player.formation).forEach(function (k) {
            b.player.formation[k] = b.player.formation[k].filter(function (id) { return id !== unitId; });
        });
        b.player.formation[formation].push(unitId);
        return true;
    } catch (e) { return false; }
}
// 一键归中军（自动布阵兜底）
function bfDeployAll() {
    try {
        var b = GameState.battlefield;
        if (!b || b.phase !== 'deploy') return false;
        b.player.units.forEach(function (u) { bfAssign(u.id, 'center'); });
        return true;
    } catch (e) { return false; }
}
function bfCommitDeploy() {
    try {
        var b = GameState.battlefield;
        if (!b || b.phase !== 'deploy') return false;
        b.phase = 'battle';
        b.turn = 0;
        b.log.push('〔布阵〕三军既定，鸣鼓而进。');
        return true;
    } catch (e) { return false; }
}

// ---------- 联动批A经济景气（战时粮/火器加成） ----------
function bfEconMod() {
    try {
        var mod = 1.0, e = GameState.econ, m = GameState.milOps;
        if (e && typeof e.prosperity === 'number') mod += (e.prosperity - 50) / 200;
        if (m && m.firearms) mod += m.firearms * 0.05;
        if (m && m.ying && m.ying.shenji === 1) mod += 0.08;
        return Math.max(0.7, Math.min(1.6, mod));
    } catch (e) { return 1.0; }
}

// 军需（战时逐回合焚烧；饷断军心崩）
function bfSupplyDrain() {
    try {
        var b = GameState.battlefield;
        if (!b) return {};
        var s = b.supply;
        var hadSilver = GameState.stats.treasury >= s.silverPerTurn;
        var hadFood = GameState.stats.militaryFood >= s.foodPerTurn;
        var tookSilver = Math.min(s.silverPerTurn, GameState.stats.treasury || 0);
        var tookFood = Math.min(s.foodPerTurn, GameState.stats.militaryFood || 0);
        GameState.stats.treasury = Math.max(0, (GameState.stats.treasury || 0) - tookSilver);
        GameState.stats.militaryFood = Math.max(0, (GameState.stats.militaryFood || 0) - tookFood);
        var lack = !(hadSilver && hadFood);
        if (lack) s.unpaid++;
        return { lack: lack, tookSilver: tookSilver, tookFood: tookFood };
    } catch (e) { return { lack: false, tookSilver: 0, tookFood: 0 }; }
}

// ---------- 敌方 AI 出招 ----------
function bfEnemyTactic(b) {
    var m = b.enemy.morale, roll = Math.random();
    if (b.enemy.units.some(function (u) { return u.role === 'cav'; })) {
        return roll < 0.5 ? 'flank' : (roll < 0.8 ? 'attack' : 'assault');
    }
    if (m < 35) return 'defend';
    if (roll < 0.4) return 'attack';
    if (roll < 0.7) return 'assault';
    return 'defend';
}

// ---------- 克制判定（火器克骑冲 cav；战术互克） ----------
function bfBeat(myTac, eneTac) {
    try {
        var info = BF_TACTICS[myTac] || BF_TACTICS.attack;
        if (info.beat === 'cav') return (eneTac === 'flank' || eneTac === 'assault') ? 1 : 0;
        if (info.beat === eneTac) return 1;
        if (BF_TACTICS[eneTac] && BF_TACTICS[eneTac].beat === myTac) return -1;
        return 0;
    } catch (e) { return 0; }
}

function bfFormationMul(b) {
    var m = 1.0, f = b.player.formation;
    if (f && f.front && f.front.length) m += 0.15;
    if (f && f.wing1 && f.wing1.length) m += 0.10;
    if (f && f.wing2 && f.wing2.length) m += 0.10;
    return m;
}

// ---------- 开始战斗 ----------
function bfStart(cfg) {
    try {
        bfEnsure();
        if (GameState.battlefield && GameState.battlefield.active) return { ok: false, msg: '战事方殷，未可再兴。' };
        cfg = cfg || {};
        var troops = cfg.troops || (GameState.stats.militaryPower || 0);
        var gen = cfg.gen || null;
        var mode = cfg.mode || 'pacify';
        var b = initBattlefieldState();
        b.active = true; b.mode = mode;
        b.regionKey = cfg.regionKey; b.regionName = cfg.regionName || bfRegionName(cfg.regionKey);
        b.gen = gen; b.turn = 0; b.maxTurns = BF_MAX_TURNS; b.phase = 'deploy';
        b.player = { morale: bfInitMorale(gen, troops), units: bfGenPlayerUnits(troops, gen, mode), formation: { front: [], center: [], wing1: [], wing2: [], rear: [] } };
        b.enemy = { morale: bfEnemyMorale(cfg), units: bfGenEnemyUnits(cfg.kind || 'beilu', cfg.difficulty) };
        b.board = bfBuildBoard();
        b.supply = { silverPerTurn: bfSupplySilver(cfg), foodPerTurn: bfSupplyFood(cfg), unpaid: 0 };
        b._troopsSent = troops;
        b._silver = cfg.silver || 0; b._food = cfg.food || 0;
        b.createdAt = bfTick();
        b.log.push('〔阵前〕' + b.regionName + '兵兴，' + (gen ? gen.name + ' 提督' : '王师') + '列阵，士气 ' + b.player.morale + ' 对 ' + b.enemy.morale + '。');
        GameState.battlefield = b;
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
function bfInitMorale(gen, troops) {
    try {
        var m = 58;
        if (gen && gen.ability) m += (gen.ability - 70) * 0.4;
        if (GameState.factions && GameState.factions.military) m += GameState.factions.military * 0.2;
        if (troops >= 60) m += 6;
        return Math.max(20, Math.min(95, Math.round(m)));
    } catch (e) { return 58; }
}
function bfEnemyMorale(cfg) {
    try {
        var m = 60;
        if (cfg.kind === 'panjun') m -= 12;
        if (cfg.kind === 'beilu') m += 4;
        return Math.max(20, Math.min(95, m));
    } catch (e) { return 60; }
}
function bfSupplySilver(cfg) {
    return cfg.mode === 'pacify' ? 60 : Math.round((cfg.silver || 0) * 0.15) + 80;
}
function bfSupplyFood(cfg) {
    return cfg.mode === 'pacify' ? 40 : Math.round((cfg.food || 0) * 0.2) + 50;
}

// ---------- 执行一回合 ----------
function bfRunTurn(tac) {
    try {
        var b = bfEnsure();
        if (!b.active || b.phase !== 'battle') return { ok: false, msg: '战事未启或已毕。' };
        if (!BF_TACTICS[tac]) return { ok: false, msg: '无此战术。' };
        var info = BF_TACTICS[tac];
        b.turn++;
        if (b.turn > b.maxTurns) return bfFinish('相持');
        var eTac = bfEnemyTactic(b);
        var beat = bfBeat(tac, eTac);
        var ter = bfBestTerrain(b);
        var econ = bfEconMod();
        var famMul = bfFormationMul(b);
        var supply = bfSupplyDrain();
        var lack = supply.lack;
        var morDrift = lack ? (-4 * b.supply.unpaid) : 1;

        // 玩家攻势
        var atkMul = info.mult * famMul * ter.atk * econ;
        if (tac === 'volley' && b.player.units.some(function (u) { return u.type === 'shenji'; })) atkMul *= 1.3;
        atkMul *= (1 + beat * 0.35);
        var pMor = b.player.morale - info.morale + morDrift + (tac === 'supervise' ? 10 : 0);
        // 敌方攻势
        var eInfo = BF_TACTICS[eTac] || BF_TACTICS.attack;
        var eAtkMul = eInfo.mult * ter.atk * econ;
        eAtkMul *= (1 + bfBeat(eTac, tac) * 0.35);
        var eMor = b.enemy.morale - eInfo.morale;
        var pDmg = bfDmgNum(pMor, b.enemy.morale, atkMul);
        var eDmg = bfDmgNum(eMor, b.player.morale, eAtkMul);
        b.player.morale = Math.max(0, Math.min(100, Math.round(pMor - eDmg)));
        b.enemy.morale = Math.max(0, Math.min(100, Math.round(eMor - pDmg)));
        b.player.unitCas = bfCasualties(b.player, eAtkMul);
        b.enemy.unitCas = bfCasualties(b.enemy, atkMul);
        b.log.push(bfTurnReport(tac, eTac, pDmg, eDmg, b, beat, lack, ter));
        GameState.battlefield = b;
        if (bfCheck(b)) return bfFinish(bfJudge(b));
        return { ok: true, report: b.log[b.log.length - 1] };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
function bfBestTerrain(b) {
    var best = BF_TERRAINS.plain, t;
    for (var r = 0; r < BF_ROWS; r++) for (var c = 0; c < BF_COLS; c++) {
        t = b.board[r][c];
        if (t.def > best.def) best = BF_TERRAINS[t.t];
    }
    return best;
}
function bfDmgNum(myMor, eMor, mul) {
    return (8 + Math.random() * 7) * mul * (Math.max(15, myMor) / Math.max(20, eMor)) * 0.62;
}
function bfCasualties(side, mul) {
    return Math.round(Math.min(1, Math.max(0, (mul - 0.6) * 0.4 + (Math.random() - 0.35) * 0.2)) * 8);
}
function bfCheck(b) {
    return (b.player.morale <= 0) || (b.enemy.morale <= 0);
}
function bfJudge(b) {
    if (b.player.morale <= 0) {
        if (b.gen && Math.random() < 0.35) return '帅殁';
        return '败退';
    }
    return b.player.morale >= 60 ? '大捷' : '惨胜';
}
function bfTurnReport(tac, eTac, pDmg, eDmg, b, beat, lack, ter) {
    var pinfo = BF_TACTICS[tac], einfo = BF_TACTICS[eTac];
    var s = '第' + b.turn + '合 · 我军「' + pinfo.name + '」对敌「' + einfo.name + '」（' + ter.name + '）：';
    s += beat > 0 ? '正合克制，' : beat < 0 ? '反为所乘，' : '两军相当，';
    s += '我军士气' + b.player.morale + '（伤敌' + Math.round(pDmg) + '）· 敌军士气' + b.enemy.morale + '（我耗' + Math.round(eDmg) + '）';
    if (lack) s += '· 军需不继！';
    if (b.supply.unpaid > 0) s += '（饷断' + b.supply.unpaid + '合）';
    return s;
}

// ---------- 结束战斗，落账 ----------
function bfFinish(result) {
    try {
        var b = bfEnsure();
        if (!b.active) return { ok: false };
        b.phase = 'done'; b.result = result;
        GameState.battlefield = b;
        var rep = bfSettle(b);
        // v6.0 批C：边患战（threat 模式）落账钩子——清 threat / 加军功 / 患反复
        if (typeof wrThreatSettleHook === 'function') { try { wrThreatSettleHook(); } catch (e) {} }
        if (typeof pushNews === 'function') pushNews('兵部', '【' + rep.title + '】' + rep.text, rep.critical ? 'critical' : 'normal');
        return { ok: true, result: result, report: rep };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
function bfSettle(b) {
    if (b.mode === 'expedition') return bfSettleExpedition(b, b.result);
    return bfSettlePacify(b, b.result);
}

// ---- 出师辽东落账 ----
function bfSettleExpedition(b, r) {
    var st = GameState.stats, status = GameState.mapData && GameState.mapData.status ? GameState.mapData.status : null;
    var key = b.regionKey, text = '', critical = false, title;
    if (r === '大捷') {
        if (status) status[key] = 0;
        st.prestige = Math.min(100, (st.prestige || 0) + 2); st.mandate = Math.min(100, (st.mandate || 0) + 2);
        title = b.regionName + '大捷'; text = '露布驰阙，斩馘盈万。' + (b.gen && b.gen.src ? '〔' + b.gen.src + '〕' : '');
    } else if (r === '惨胜') {
        if (status) status[key] = 0;
        if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 2);
        title = b.regionName + '惨胜'; text = '却敌存边，而枕骸遍野。';
    } else if (r === '相持') {
        if (status) status[key] = 2;
        if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 1);
        st.prestige = Math.max(0, (st.prestige || 0) - 1);
        title = b.regionName + '相持'; text = '旷日持久，胜负未分，劳师糜饷。';
    } else if (r === '败退') {
        if (status) status[key] = 2;
        if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 3);
        st.prestige = Math.max(0, (st.prestige || 0) - 1);
        title = b.regionName + '败绩'; critical = true; text = '师老饷匮，全军败还。';
    } else if (r === '帅殁') {
        if (status) status[key] = 2;
        if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 4);
        st.mandate = Math.max(0, (st.mandate || 0) - 1);
        title = b.regionName + '师殁'; critical = true; text = bfGeneralDeath(b);
    } else {
        if (status && (status[key] || 0) < 2) status[key] = 2;
        st.prestige = Math.max(0, (st.prestige || 0) - 2);
        title = b.regionName + '撤军'; critical = true; text = '收兵而还，军心沮，贼焰愈炽。';
    }
    var refund = { 大捷: 0.9, 惨胜: 0.5, 相持: 0.35, 败退: 0.3, 帅殁: 0.25, 撤军: 0.4 }[r] || 0.3;
    if (b._troopsSent > 0) {
        var m0 = GameState.stats.militaryPower || 0;
        GameState.stats.militaryPower = Math.min(100, m0 + Math.round(b._troopsSent * refund));
        b.log.push('〔班师〕师还补员，军力' + m0 + '→' + GameState.stats.militaryPower);
    }
    if (r === '帅殁' && b.gen) bfGenDeath(b.gen);
    if (GameState.mapData) { GameState.mapData.expedition = null; GameState.mapData.lastReport = { key: b.regionKey, outcome: BF_OUTCOME_NAMES.indexOf(r), gen: b.gen ? b.gen.name : '', title: title }; }
    return { title: title, text: text, critical: critical };
}
function bfGenDeath(gen) {
    try {
        if (typeof expDeadList === 'function') {
            var dl = expDeadList();
            if (dl.indexOf(gen.name) < 0) dl.push(gen.name);
        }
        if (gen.source === 'pool' && GameState.ministers && gen.cat && GameState.ministers[gen.cat] && GameState.ministers[gen.cat][gen.idx]) {
            GameState.ministers[gen.cat][gen.idx].dead = true;
        }
    } catch (e) {}
}
function bfGeneralDeath(b) {
    return (b.gen ? (b.gen.name + '身先士卒，陷阵力战，死于矢石之间——如杜松界凡之殁。') : '主将殁于王事。') + (b.gen && b.gen.src ? '〔' + b.gen.src + '〕' : '');
}

// ---- 平叛战落账 ----
function bfSettlePacify(b, r) {
    var st = GameState.stats, status = GameState.mapData && GameState.mapData.status ? GameState.mapData.status : null;
    var key = b.regionKey, text = '', critical = false, title;
    if (r === '大捷' || r === '惨胜') {
        if (status) status[key] = 0;
        st.prestige = Math.min(100, (st.prestige || 0) + (r === '大捷' ? 2 : 1));
        if (GameState.factions) GameState.factions.military = Math.min(100, (GameState.factions.military || 0) + 1);
        title = b.regionName + (r === '大捷' ? '克平' : '粗定'); text = '渠魁授首，胁从罔治，反侧自安。';
    } else if (r === '相持') {
        if (status && (status[key] || 0) < 2) status[key] = 1;
        title = b.regionName + '未靖'; text = '王师顿兵坚城之下，贼垒未拔。';
    } else if (r === '败退' || r === '帅殁') {
        if (status && (status[key] || 0) < 2) status[key] = 2;
        if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 2);
        st.prestige = Math.max(0, (st.prestige || 0) - 2); st.stability = Math.max(0, (st.stability || 0) - 2);
        critical = true;
        title = b.regionName + '贼势愈炽'; text = r === '帅殁' ? bfGeneralDeath(b) : '王师挫衄，贼势转盛，邻近动摇。';
        bfSpreadRebellion(b);
    } else {
        if (status && (status[key] || 0) < 2) status[key] = 2;
        st.prestige = Math.max(0, (st.prestige || 0) - 2);
        critical = true; title = b.regionName + '撤军纵贼'; text = '师退贼进，养痈遗患。';
    }
    if (r === '帅殁' && b.gen) bfGenDeath(b.gen);
    if (GameState.mapData) GameState.mapData.expedition = null;
    return { title: title, text: text, critical: critical };
}
function bfSpreadRebellion(b) {
    try {
        var status = GameState.mapData && GameState.mapData.status;
        if (!status || typeof MAP_REGIONS === 'undefined') return;
        var regs = MAP_REGIONS, idx = regs.findIndex(function (x) { return x.key === b.regionKey; });
        if (idx >= 0) {
            [-1, 1].forEach(function (o) {
                var cell = regs[idx + o];
                if (cell && (status[cell.key] || 0) < 1) status[cell.key] = 1;
            });
        }
    } catch (e) {}
}

// ---------- 撤军 ----------
function bfWithdraw() {
    try {
        var b = bfEnsure();
        if (!b.active || b.phase === 'done') return { ok: false };
        return bfFinish('撤军');
    } catch (e) { return { ok: false }; }
}
function bfAbandon() {
    try {
        var b = bfEnsure();
        if (!b.active) return;
        b.active = false; b.phase = 'idle'; b.result = null;
        GameState.battlefield = b;
    } catch (e) {}
}

// ---------- 查询辅助（供 UI/验证） ----------
function bfUnitList(side) {
    try {
        var b = GameState.battlefield;
        if (!b) return '';
        var units = side === 'player' ? b.player.units : b.enemy.units;
        return units.map(function (u) { return u.name + '(攻' + u.atk + '防' + u.def + ')'; }).join('、');
    } catch (e) { return ''; }
}
function bfBoardDesc() {
    try {
        var b = GameState.battlefield;
        return b.board.map(function (row) { return row.map(function (c) { return BF_TERRAINS[c.t].name[0]; }).join(''); }).join('/');
    } catch (e) { return ''; }
}
function bfState() { try { return GameState.battlefield; } catch (e) { return null; } }
function bfIsActive() { try { return bfEnsure().active === true; } catch (e) { return false; } }
// ============================================
// 战场 UI 渲染（浮层 exp-modal 类复用，手机响应式）
// ============================================

// 打开战阵浮层
function bfOpen() {
    try {
        var b = bfEnsure();
        if (!b.active) { if (typeof pushNews === 'function') pushNews('兵部', '并无战事在行。', 'normal'); return; }
        renderBattlefield();
        var el = document.getElementById('bf-modal');
        if (el && el.classList) el.classList.add('active');
        try { DamingSFX.play('urgent'); } catch (e) {}
    } catch (e) {}
}
function bfClose() {
    try {
        var el = document.getElementById('bf-modal');
        if (el && el.classList) el.classList.remove('active');
    } catch (e) {}
}

// 渲染战阵浮层
function renderBattlefield() {
    try {
        var b = bfEnsure();
        var title = document.getElementById('bf-title'), st = document.getElementById('bf-subtitle'), body = document.getElementById('bf-body');
        if (!body) return;
        if (title) title.textContent = '战阵 · ' + b.regionName + (b.gen ? '（' + b.gen.name + ' 督师）' : '');
        var tag = document.getElementById('bf-tag');
        if (tag) tag.textContent = b.mode === 'expedition' ? '出师辽东' : '平叛战';
        if (st) st.textContent = '第 ' + b.turn + ' 合 · 我军士气 ' + b.player.morale + ' · 敌军士气 ' + b.enemy.morale;
        var html = '';
        // 战情板
        html += '<div class="bf-war">';
        html += '<div class="bf-boardline">地形：' + bfBoardDesc() + '</div>';
        html += '<div class="bf-sides">';
        html += '<div class="bf-side">我方：' + bfUnitList('player') + '</div>';
        html += '<div class="bf-side">敌方：' + bfUnitList('enemy') + '</div>';
        html += '</div>';
        html += '<div class="bf-supply">军需 · 太仓银每合 ' + b.supply.silverPerTurn + ' / 军粮每合 ' + b.supply.foodPerTurn + (b.supply.unpaid > 0 ? '（断饷 ' + b.supply.unpaid + ' 合，军心大溃！）' : '') + '</div>';
        html += '</div>';

        // 阶段分支
        if (b.phase === 'deploy') {
            html += '<h4 class="exp-sec">布阵（先锋/中军/两翼/后队，摆位影响战局）</h4>';
            var fK = Object.keys(BF_FORMATIONS);
            fK.forEach(function (fk) {
                var ids = b.player.formation[fk] || [];
                var names = ids.map(function (id) { var u = b.player.units.find(function (x) { return x.id === id; }); return u ? u.name : id; }).join('、') || '（空）';
                html += '<div class="bf-form"><span class="bf-form-name">' + BF_FORMATIONS[fk].name + '</span> ' + names +
                    '<span class="bf-form-act">' +
                    b.player.units.filter(function (u) { return ids.indexOf(u.id) < 0; }).map(function (u) {
                        return '<button class="cw-btn bf-mini" onclick="bfAssign(\'' + u.id + '\',\'' + fk + '\')">' + u.name.split('(')[0] + '</button>';
                    }).join('') +
                    '</span></div>';
            });
            html += '<div class="exp-dispatch-row">';
            html += '<button class="cw-btn" onclick="bfDeployAll()">一键归中军</button>';
            html += '<button class="cw-btn cw-btn-danger" onclick="bfCommitDeploy()">鸣鼓出战</button>';
            html += '</div>';
            html += '<div class="exp-hint">摆位：先锋攻高可陷阵，中军持稳，两翼包抄，后队殿后。据城池/关隘者得地形之利。</div>';
        } else if (b.phase === 'battle') {
            html += '<h4 class="exp-sec">战术指令（点「进」执行一合）</h4>';
            html += '<div class="bf-tactics">';
            Object.keys(BF_TACTICS).forEach(function (tk) {
                var t = BF_TACTICS[tk];
                html += '<button class="cw-btn bf-tac" onclick="bfAct(\'' + tk + '\')">' + t.name + '（士气' + (t.morale < 0 ? '+' + (-t.morale) : '-' + t.morale) + '）</button>';
            });
            html += '</div>';
            html += '<div class="bf-econ">时局：经济景气 ' + (GameState.econ && GameState.econ.prosperity ? GameState.econ.prosperity : '—') +
                (GameState.milOps && GameState.milOps.firearms ? ' · 火器研造 Lv' + GameState.milOps.firearms : '') + ' · 地形加成 ×' + bfBestTerrain(b).atk + '</div>';
            html += '<div class="exp-dispatch-row">';
            html += '<button class="cw-btn" onclick="bfAct(\'advance\')">进 → 将军令</button>';
            html += '<button class="cw-btn cw-btn-danger" onclick="bfWithdraw()">撤军（威望-2，边患更甚）</button>';
            html += '</div>';
        } else { // done
            html += '<h4 class="exp-sec">战局已定：' + (b.result || '') + '</h4>';
            html += '<div class="exp-hint">胜负之效已落太仓/军心/舆图。请回銮。</div>';
            html += '<button class="cw-btn cw-btn-danger" onclick="bfFinishReturn()">回 銮</button>';
        }

        // 战报流水（急奏样式）
        if (b.log && b.log.length) {
            html += '<div class="bf-log">';
            b.log.forEach(function (ln) { html += '<div class="bf-logline">☛ ' + ln + '</div>'; });
            html += '</div>';
        }
        body.innerHTML = html;
    } catch (e) { try { var bd = document.getElementById('bf-body'); if (bd) bd.innerHTML = '<div class="exp-hint">战报渲染失败（' + String(e && e.message) + '）</div>'; } catch (e2) {} }
}

// 玩家出招
function bfAct(tac) {
    try {
        var b = bfEnsure();
        if (!b.active) return;
        if (tac === 'advance') { renderBattlefield(); return; }
        bfRunTurn(tac);
        renderBattlefield();
        if (b.phase === 'done') {
            // 落账完成，直接展示
            bfFinishReturn(true);
        }
    } catch (e) {}
}

// 战局结束回銮（落账已在 bfFinish 完成）
function bfFinishReturn(pending) {
    try {
        var b = bfEnsure();
        var rep = b && b.report;
        if (rep && typeof pushNews === 'function') {
            pushNews('兵部', '【' + rep.title + '】' + rep.text, rep.critical ? 'critical' : 'normal');
        }
        // 收尾：出师清账
        if (b && b.mode === 'expedition' && GameState.mapData) GameState.mapData.expedition = null;
        bfClose();
        if (typeof updateUI === 'function') updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}

// 批C：若战场处于未开战(deploy/未结束)且属指定mode，则弃战（供过季兜底）
function bfAbandonIfIdle(mode) {
    try {
        var b = bfEnsure();
        if (!b.active) return;
        if (mode && b.mode !== mode) return;
        if (b.phase === 'deploy' || b.phase === 'battle') {
            // 未打完即过季：弃战，军/饷已扣不再补（反爽游代价）
            b.phase = 'idle'; b.active = false; b.result = null;
            GameState.battlefield = b;
        }
    } catch (e) {}
}

// ---------- 平叛战：事件「发兵征讨」进入战棋实战 ----------
// opt.bf = { kind, regionKey, regionName, troops, silver, food }
function bfEventPacify(event, opt) {
    try {
        if (!opt || !opt.bf) return false;
        var cfg = opt.bf;
        // 先合上事件浮层
        try { var m = document.getElementById('event-modal'); if (m && m.classList) m.classList.remove('active'); } catch (e) {}
        var r = bfStart({ mode: 'pacify', regionKey: cfg.regionKey, regionName: cfg.regionName || bfRegionName(cfg.regionKey),
                          kind: cfg.kind || 'panjun', troops: cfg.troops || Math.round((GameState.stats.militaryPower || 0) * 0.4),
                          gen: cfg.gen || null, silver: cfg.silver, food: cfg.food, difficulty: cfg.difficulty || 1.0 });
        if (r && r.ok) { try { bfOpen(); } catch (e) {} return true; }
        return false;
    } catch (e) { return false; }
}

// ============================================
// 《大明国策》v6.0 批C · 军事战守扩充（挂载于战场引擎末尾）
// 新兵种定义 / 新边患敌种 / 城守·粮道钩子 / 军功榜
// 史据（本节）：《明史》卷92·兵志四（车营、京营新军、募勇）/
//              卷89·兵志一（戎政·卫所募兵）/ 卷91·兵志三（营制）/
//              卷198·杨一清传（三边）/ 卷212·谭纶传（北兵募勇）/
//              卷222·张居正传（京营整饬）/ 俺答入寇（卷327·鞑靼传）/
//              倭寇（卷322·日本传）/ 播州土司杨应龙（卷228·李化龙传）/
//              流寇高迎祥李自成（卷309·流贼传）
// 反爽铁律：新兵种/边患战必有代价——募勇伤民望、驻军耗饷、粮道断则士气溃。
// ============================================

// ---- 新兵种定义（追加进战棋兵种表，仅新增不覆盖）----
if (typeof BF_PLAYER_TYPES !== 'undefined' && !BF_PLAYER_TYPES.chelun) {
    BF_PLAYER_TYPES.chelun = { name: '车营',      role: 'line',   atk: 0.90, def: 1.55, morale: 1.0 }; // 《明史》卷92车营·战车卫所
    BF_PLAYER_TYPES.xinjun = { name: '京营新军',  role: 'line',   atk: 1.30, def: 1.10, morale: 1.25 };// 《明史》卷222张居正整饬
    BF_PLAYER_TYPES.muyong = { name: '募勇',      role: 'line',   atk: 0.85, def: 0.70, morale: 0.6 }; // 《明史》卷212谭纶募北兵
}
if (typeof BF_ENEMY_TYPES !== 'undefined' && !BF_ENEMY_TYPES.liukou) {
    BF_ENEMY_TYPES.liukou = { name: '流寇', role: 'horde', atk: 1.05, def: 0.65, morale: 0.7 }; // 《明史》卷309流贼传
}

// 新兵种籍贯/解锁状态 → 战场挂载（供战守出兵调度调用，push 进我方单位）
function bfAppendExtraUnits() {
    try {
        var b = GameState.battlefield;
        if (!b || !b.player || !GameState.warDef) return 0;
        var w = GameState.warDef;
        var n = 0;
        function pushType(key, name, mult) {
            try {
                var u = bfMkUnit('x' + (b.player.units.length + n), name, key, mult);
                b.player.units.push(u); n++;
            } catch (e) {}
        }
        if (w.units && w.units.chelun && w.units.chelun.ready) pushType('chelun', BF_PLAYER_TYPES.chelun.name, 1.0 + (w.units.chelun.level || 1) * 0.06);
        if (w.units && w.units.xinjun && w.units.xinjun.ready) pushType('xinjun', BF_PLAYER_TYPES.xinjun.name, 1.0 + (w.units.xinjun.level || 1) * 0.05);
        if (w.units && w.units.muyong && w.units.muyong.ready) pushType('muyong', BF_PLAYER_TYPES.muyong.name, 0.7 + (w.units.muyong.level || 1) * 0.05);
        // 批F：军事科技树新兵种（按科技解锁追加，追加式不改既有）
        if (typeof bfAppendMilTechUnits === 'function') { try { n += bfAppendMilTechUnits(); } catch (e) {} }
        return n;
    } catch (e) { return 0; }
}

// 战守出兵包裹：开局 + 追加新兵种（复用战场引擎全部接口）
function wrStartBattle(cfg) {
    try {
        var r = bfStart(cfg);
        if (r && r.ok) { bfAppendExtraUnits(); }
        return r;
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
