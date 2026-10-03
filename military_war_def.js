// ============================================
// 《大明国策》v6.0 批C · 军事战守扩充（战守 · 粮道 · 兵源 · 军功）
// 独立文件，挂载于 military tab 尾部；与 battlefield.js / expedition.js /
//   military_ops_ext.js 联动，best 复用战场引擎（wrStartBattle 包裹 bfStart）。
// 史据（本文件）：《明史》卷89·兵志一（戎政·卫所募兵·屯田）/
//  卷91·兵志三（营制·京营）/ 卷92·兵志四（车营·火器·募勇）/
//  卷212·谭纶传（募浙闽义勇）/ 卷222·张居正传（饬武备）/
//  卷198·杨一清传（三边粮饷）/ 卷95·兵志九边（粮饷转运）/
//  俺答入寇（卷327·鞑靼传）/ 倭寇（卷322·日本传）/
//  播州杨应龙（卷228·李化龙传）/ 奢安之乱（卷249·王三善传）/
//  流寇（卷309·流贼传）
// 反爽铁律：募勇伤民望、驻军耗饷、军功封赏耗内帑、粮道断士气溃——绝无白嫖。
// ============================================

// ---------- 战守状态（存档链三件套之一：构造器默认） ----------
function initWarDefState() {
    return {
        // 新兵种解锁/招募：ready 是否可入战，level 军力等级，recruited 已募营数
        units: {
            chelun: { ready: false, level: 1, recruited: 0, unlockTick: 0 },   // 车营（工价·整饬解锁）
            xinjun: { ready: false, level: 1, recruited: 0, unlockTick: 0 },   // 京营新军（练兵+研究院解锁）
            muyong: { ready: false, level: 1, recruited: 0, unlockTick: 0 }    // 募勇（可重复募，代价民望）
        },
        // 边患剧本（出现的潜在边患，靠出兵平之 / 平叛战合流）
        threats: {
            anda:   { regionKey: 'datong',  name: '俺答叩关', kind: 'beilu',  active: false, level: 1, cd: 0, desc: '俺答拥众犯边，大同宣府俱警。' },
            wokou:  { regionKey: 'zhejiang',name: '倭寇入寇', kind: 'wokou',  active: false, level: 1, cd: 0, desc: '倭奴抄掠浙闽，市舶萧条。' },
            tusi:   { regionKey: 'guizhou', name: '土司反叛', kind: 'tusi',   active: false, level: 1, cd: 0, desc: '播州杨应龙/奢安之乱类，土司构兵。' },
            liukou: { regionKey: 'henan',   name: '流寇四起', kind: 'liukou', active: false, level: 1, cd: 0, desc: '饥民流亡，啸聚为盗，流贼纵横。' }
        },
        // 粮道：畅通度0-100（受农业景气与国库存粮影响，断则战时士气溃）
        supplyLine: 70,
        // 兵源：在籍可征（与人口/征兵关联），募勇/出师抽此
        levyPool: 100,
        // 边境驻军：{ regionKey: level } 每季耗饷守边，防边患滋生
        garrison: {},
        // 京营整顿冷却（防连点）
        jingRevampCd: 0,
        // 军功封赏累积
        merit: 0,
        lastSatTick: 0
    };
}
function ensureWarDefState() {
    try {
        if (!GameState.warDef || typeof GameState.warDef.supplyLine === 'undefined') {
            GameState.warDef = initWarDefState();
        } else {
            // 旧档兜底：补齐缺失子键
            var w = GameState.warDef;
            if (!w.units) w.units = initWarDefState().units;
            ['chelun', 'xinjun', 'muyong'].forEach(function (k) {
                if (!w.units[k]) w.units[k] = { ready: false, level: 1, recruited: 0, unlockTick: 0 };
            });
            if (!w.threats) w.threats = initWarDefState().threats;
            ['anda', 'wokou', 'tusi', 'liukou'].forEach(function (k) {
                if (!w.threats[k]) { w.threats[k] = initWarDefState().threats[k]; }
            });
            if (typeof w.supplyLine !== 'number') w.supplyLine = 70;
            if (typeof w.levyPool !== 'number') w.levyPool = 100;
            if (!w.garrison) w.garrison = {};
            if (typeof w.merit !== 'number') w.merit = 0;
        }
    } catch (e) { try { GameState.warDef = initWarDefState(); } catch (e2) {} }
    return GameState.warDef;
}
function _wr() { try { ensureWarDefState(); return GameState.warDef; } catch (e) { return null; } }

// ---------- 兵源联动：征募兵役与人口关联 ----------
// 兵源 levyPool 上限受人口支撑：人口多则兵力充盈，寡则劳师伤民。
function wrLevyMax() {
    try {
        var pop = GameState.stats.population || 60000000;
        // 每千万人口约 +20 兵源；上限100
        return Math.max(20, Math.min(100, Math.round(pop / 10000000 * 15)));
    } catch (e) { return 100; }
}
function wrSyncLevy() {
    try {
        var w = _wr(); if (!w) return;
        var max = wrLevyMax();
        // 兵源自然恢复：每季向 in-progress 移动少量（人口在籍生息）
        if (w.levyPool < max) w.levyPool = Math.min(max, w.levyPool + 5);
    } catch (e) {}
}

// ---------- 粮道联动：农业景气 × 国库存粮 → 畅通度（影响战时士气） ----------
function wrSupplyLine() {
    try {
        var w = _wr(); if (!w) return 70;
        var agr = GameState.stats.agriculture || 50;
        var food = GameState.stats.militaryFood || 0;
        var base = 40 + (agr - 30);                    // 农业景气决定粮道根基
        var stock = Math.min(30, Math.floor(food / 200)); // 存粮兜底
        var s = base + stock;
        // 反向侵蚀：此前断饷则缓慢修复
        s = (s + w.supplyLine) / 2;
        w.supplyLine = Math.max(10, Math.min(100, Math.round(s)));
        return w.supplyLine;
    } catch (e) { return 70; }
}

// 战时兵源耗损（打赢补兵，败北折兵）——由出师/边患战结算回调
function wrConsumeLevy(n) {
    try { var w = _wr(); if (!w) return; w.levyPool = Math.max(0, (w.levyPool || 100) - (n || 0)); } catch (e) {}
}

// ---------- 新兵种解锁 / 招募（都有代价 + 条件 + 冷却） ----------
var WR_UNIT_COSTS = {
    // key: { 解锁银两, 条件描述, 每募营银, 每募营民望代价, 每募营兵源占, 明史注 }
    chelun: { unlockSilver: 40,  need: '需工部营造车驾（工事≥1）', campSilver: 15, campReput: 1, campLevy: 6, src: '《明史》卷92车营：战车居前，神统在后，防胡骑冲突。' },
    xinjun: { unlockSilver: 60,  need: '需研究院 + 京营练兵（milOps.drill.jing≥6）', campSilver: 20, campReput: 1, campLevy: 8, src: '《明史》卷222张居正：饬武备，汰老弱，补壮健，京营一新。' },
    muyong: { unlockSilver: 8,   need: '募勇随时可募（民望代价重）', campSilver: 8,  campReput: 3, campLevy: 3, src: '《明史》卷212谭纶：募浙中敢死之士、闽中才力骁捷者，厚其饷。' }
};

function wrUnlockUnit(kind) {
    try {
        var w = _wr(); if (!w || !WR_UNIT_COSTS[kind]) return { ok: false, msg: '无此兵种' };
        var c = WR_UNIT_COSTS[kind];
        if (w.units[kind].ready) return { ok: false, msg: '此军已立，无需再办' };
        // 条件
        if (kind === 'chelun') {
            var build = GameState.yingzaoState && GameState.yingzaoState.completed ? GameState.yingzaoState.completed.length : 0;
            if (build < 1) return { ok: false, msg: c.need };
        }
        if (kind === 'xinjun') {
            var drill = GameState.milOps && GameState.milOps.drill ? GameState.milOps.drill.jing : 0;
            var inst = GameState.milOps ? GameState.milOps.institute : 0;
            if (drill < 6 || inst < 1) return { ok: false, msg: c.need };
        }
        if (GameState.stats.treasury < c.unlockSilver) return { ok: false, msg: '府库不足，难以兴军' };
        GameState.stats.treasury -= c.unlockSilver;
        w.units[kind].ready = true;
        w.units[kind].recruited = 1;
        w.units[kind].unlockTick = bfTick();
        if (typeof pushNews === 'function') pushNews('兵部', kind === 'muyong'
            ? '召募义勇成营，凡四方愿从军者皆入之。民情颇扰。'
            : (kind === 'chelun' ? '车营成军，战车神铳相为表里。' : '京营新军练成，壁垒一新。'), 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}

// 募勇扩营（车营/新军可再募壮军力，代价民望/兵源/银）
function wrRecruitCamp(kind) {
    try {
        var w = _wr(); if (!w || !WR_UNIT_COSTS[kind]) return { ok: false };
        var c = WR_UNIT_COSTS[kind];
        if (!w.units[kind].ready) return { ok: false, msg: '此军尚未立营' };
        if (w.units[kind].recruited >= 3) return { ok: false, msg: '此军已至极限，再募则糜饷' };
        if (GameState.stats.treasury < c.campSilver) return { ok: false, msg: '府库不足' };
        if (w.levyPool < c.campLevy) return { ok: false, msg: '兵源不足（在籍可征已罄）' };
        GameState.stats.treasury -= c.campSilver;
        w.levyPool -= c.campLevy;
        w.units[kind].recruited++;
        if (w.units[kind].recruited >= 2) w.units[kind].level++;
        // 民望代价：募勇最重
        if (GameState.stats && typeof GameState.stats.stability === 'number') {
            GameState.stats.stability = Math.max(0, GameState.stats.stability - c.campReput);
        }
        if (GameState.factions && GameState.factions.civil) {
            GameState.factions.civil = Math.max(0, GameState.factions.civil - c.campReput);
        }
        if (typeof pushNews === 'function') pushNews('兵部', kind + ' 又募一营，共' + w.units[kind].recruited + '营，民力告乏。(' + c.src + ')', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false }; }
}

// ---------- 边患剧本：滋生 → 可出兵平之（进战棋实战） ----------
// 每季滋生一次（有概率），滋生则置威胁 active，可点出兵布阵。
function wrThreatTick() {
    try {
        var w = _wr(); if (!w) return;
        // 冷却流逝
        Object.keys(w.threats).forEach(function (k) {
            if (w.threats[k].cd > 0) w.threats[k].cd--;
            if (!w.threats[k].active && w.threats[k].cd <= 0) {
                // 滋生机率：受稳定度与边患压制影响
                var stab = GameState.stats.stability || 50;
                var guard = wrGarrisonGuard(k);
                var raw = (60 - stab) / 100 - guard * 0.12;
                // 重兵戍守（≥2营）且民尚安（稳定≥25）则边靖无患；否则有生变之机
                var prob = (guard >= 2 && stab >= 25) ? 0 : Math.max(0.02, raw);
                if (Math.random() < prob) {
                    w.threats[k].active = true;
                    var t = w.threats[k];
                    if (GameState.mapData && GameState.mapData.status) {
                        GameState.mapData.status[t.regionKey] = Math.max(GameState.mapData.status[t.regionKey] || 0, 1);
                    }
                    if (typeof pushNews === 'function') pushNews('边警', '【' + t.name + '】' + t.desc + '（' + t.src + '）', 'critical');
                }
            }
        });
    } catch (e) {}
}
// 驻军压制某威胁滋生的守护值
function wrGarrisonGuard(threatKey) {
    try {
        var w = _wr(); var t = w.threats[threatKey];
        if (!t) return 0;
        var g = w.garrison[t.regionKey] || 0;
        return g;
    } catch (e) { return 0; }
}

// 出兵平边患 → 进战棋实战（复用 battlefield 引擎）
function wrStrikeThreat(threatKey) {
    try {
        var w = _wr(); if (!w) return { ok: false };
        var t = w.threats[threatKey];
        if (!t || !t.active) return { ok: false, msg: '此患未起，无兵可进' };
        if (GameState.battlefield && GameState.battlefield.active) return { ok: false, msg: '战事方殷，未可再兴' };
        // 出兵代价：抽兵源 + 出军（wrStartBattle 内含调饷）
        var troops = Math.round((GameState.stats.militaryPower || 0) * (0.4 + (t.level || 1) * 0.1));
        if (troops <= 20) return { ok: false, msg: '京营边军凋敝，兵不足支' };
        var silver = 300 + (t.level || 1) * 100;
        var food = 200 + (t.level || 1) * 80;
        if (GameState.stats.treasury < silver || GameState.stats.militaryFood < food) {
            return { ok: false, msg: '饷粮不继，未可轻进' };
        }
        // 抽兵源（从在籍）
        if (w.levyPool < 10) return { ok: false, msg: '兵源不足，民丁已疲' };
        GameState.stats.militaryPower = Math.max(0, (GameState.stats.militaryPower || 0) - troops);
        GameState.stats.treasury -= silver;
        GameState.stats.militaryFood -= food;
        w.levyPool -= 10;
        // 平叛之王命将衔（复用出师帅池，无帅则以朝廷名义）
        var gen = null;
        var cands = (typeof expCandidates === 'function') ? expCandidates() : [];
        if (cands.length) { var pick = cands[Math.floor(Math.random() * cands.length)]; gen = pick.name ? pick : null; }
        var r = wrStartBattle({
            mode: 'threat', regionKey: t.regionKey, regionName: wdRegionName(t.regionKey),
            kind: t.kind, troops: troops, silver: silver, food: food,
            difficulty: 0.9 + (t.level || 1) * 0.2, gen: gen
        });
        if (r && r.ok) {
            // 记录是平哪患，结算时清 threat
            GameState.battlefield._threatKey = threatKey;
            try { bfOpen(); } catch (e) {}
            return { ok: true };
        }
        return { ok: false, msg: r && r.msg ? r.msg : '兴师未成' };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
function wdRegionName(key) {
    try {
        if (typeof bfRegionName === 'function') return bfRegionName(key);
        return key;
    } catch (e) { return key; }
}

// ---------- 边境驻军：耗饷守边，防边患 + 京营整顿（冷却） ----------
function wrGarrison(regionKey) {
    try {
        var w = _wr(); if (!w) return { ok: false, msg: '无状态' };
        if (!regionKey) return { ok: false, msg: '未择边镇' };
        var cur = w.garrison[regionKey] || 0;
        if (cur >= 3) return { ok: false, msg: '此镇驻军已满，再驻糜饷' };
        var silver = 120 + cur * 80;   // 愈多愈费
        if (GameState.stats.treasury < silver) return { ok: false, msg: '府库不足驻军' };
        GameState.stats.treasury -= silver;
        w.garrison[regionKey] = cur + 1;
        if (typeof pushNews === 'function') pushNews('兵部', wdRegionName(regionKey) + '增戍一营，边墙稍固。', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false }; }
}
function wrRetreatGarrison(regionKey) {
    try {
        var w = _wr(); if (!w || !w.garrison[regionKey]) return { ok: false };
        delete w.garrison[regionKey];
        if (typeof pushNews === 'function') pushNews('兵部', wdRegionName(regionKey) + '撤戍，边备稍弛。', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false }; }
}
// 驻军每季耗饷（同步在 wrTick）
function wrGarrisonUpkeep() {
    try {
        var w = _wr(); if (!w) return;
        Object.keys(w.garrison).forEach(function (k) {
            var lv = w.garrison[k];
            var cost = 40 + lv * 25;
            var had = GameState.stats.treasury >= cost;
            GameState.stats.treasury = Math.max(0, (GameState.stats.treasury || 0) - cost);
            // 饷断则守军哗，削边备
            if (!had) { delete w.garrison[k]; if (GameState.factions) GameState.factions.military = Math.max(0, (GameState.factions.military || 0) - 1); }
        });
    } catch (e) {}
}
function wrRevampJing() {
    try {
        var w = _wr(); if (!w) return { ok: false, msg: '无状态' };
        if (w.jingRevampCd > 0) return { ok: false, msg: '京营新整未久，须缓图（冷却' + w.jingRevampCd + '季）' };
        if (GameState.stats.treasury < 80) return { ok: false, msg: '府库不足' };
        GameState.stats.treasury -= 80;
        w.jingRevampCd = 5;   // 5季冷却
        // 成败：军心在则振，涣则虚耗（反爽游）
        var milF = GameState.factions ? (GameState.factions.military || 50) : 50;
        if (milF >= 55) {
            if (GameState.stats) GameState.stats.militaryPower = Math.min(100, (GameState.stats.militaryPower || 0) + 3);
            if (typeof pushNews === 'function') pushNews('兵部', '京营大阅，汰弱补强，军威复振。', 'normal');
        } else {
            GameState.stats.treasury = Math.max(0, GameState.stats.treasury - 50); // 再耗
            if (typeof pushNews === 'function') pushNews('兵部', '点阅京营，冗食相冒，虚糜国帑，将士离心。', 'critical');
        }
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false }; }
}

// 军功封赏：以战功授爵，耗内帑赐邸，解民望/军心张力（反爽游：耗内帑）
function wrMeritReward() {
    try {
        var w = _wr(); if (!w) return { ok: false };
        if (w.merit < 20) return { ok: false, msg: '战功未著，无勋可酬' };
        if ((GameState.stats.privyPurse || 0) < 100) return { ok: false, msg: '内帑不足，难以赐邸' };
        GameState.stats.privyPurse -= 100;
        w.merit -= 20;
        GameState.stats.prestige = Math.min(100, (GameState.stats.prestige || 0) + 2);
        if (GameState.factions) GameState.factions.military = Math.min(100, (GameState.factions.military || 0) + 2);
        if (typeof pushNews === 'function') pushNews('兵部', '大赉将士，酬其勋劳，军民感奋。(《明史》卷92：武臣以功叙封)', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false }; }
}

// ---------- 战守主巡检（每季挂链；由 advanceSeason 调用） ----------
function warDefTick() {
    try { ensureWarDefState(); } catch (e) {}
    var w = _wr(); if (!w) return;
    // 粮道刷新
    wrSupplyLine();
    // 兵源生息
    wrSyncLevy();
    // 边患滋生（含军功池）
    wrThreatTick();
    // 驻军耗饷
    try { wrGarrisonUpkeep(); } catch (e) {}
    // 京营整顿冷却
    if (w.jingRevampCd > 0) w.jingRevampCd--;
    w.lastSatTick = bfTick();
    // 断粮警示：粮道极低则朝廷震怒
    if (w.supplyLine < 30 && typeof pushNews === 'function') {
        pushNews('户部', '粮道告急，边军嗷嗷待哺，恐有溃变之虞！(', 'critical');
    }
}

// 军功：战斗胜利时由结算回调加（在 bfSettle 处由本文件监听）
function wrAddMerit(v) {
    try { var w = _wr(); if (!w) return; w.merit = (w.merit || 0) + (v || 0); } catch (e) {}
}
// 平边患：以威胁 key 结算——胜利清 active、加军功，失败益患（含副作用）
function wrSettleThreat(key, result) {
    try {
        var w = _wr(); var t = w.threats[key];
        if (!t) return;
        if (result === '大捷' || result === '惨胜') {
            t.active = false; t.cd = 6; // 久安
            t.level = Math.min(3, t.level + 1);
            wrAddMerit(result === '大捷' ? 25 : 12);
            if (GameState.mapData && GameState.mapData.status) GameState.mapData.status[t.regionKey] = 0;
        } else {
            t.active = true; // 患未平
            t.level = Math.min(3, t.level + 1); // 愈演愈烈
            // 副作用：邻近动摇
            if (GameState.mapData && GameState.mapData.status && typeof bfSpreadRebellion === 'function') {
                try { bfSpreadRebellion({ regionKey: t.regionKey }); } catch (e) {}
            }
        }
    } catch (e) {}
}

// 由 battlefield bfFinish 结算末尾调用（mode==='threat'）
function wrThreatSettleHook() {
    try {
        var b = GameState.battlefield;
        if (!b || b.mode !== 'threat' || !b._threatKey) return;
        wrSettleThreat(b._threatKey, b.result);
        b._threatKey = null;
    } catch (e) {}
}

// ---------- 面板渲染（挂 military tab 尾部） ----------
function renderWarDefTab() {
    try {
        var w = _wr(); if (!w) return '';
        var st = GameState.stats || {};
        var html = '<div class="report-card"><div class="report-title">⚔️ 军事战守（批C）</div>';

        // 粮道 + 兵源
        var sl = wrSupplyLine();
        html += '<div class="report-text">粮道畅通 <b>' + sl + '</b>/100（受农业景气与存粮影响；断则战时士气溃）· 兵源 ' +
            w.levyPool + '/' + wrLevyMax() + '（人口支撑）· 军功 <b>' + w.merit + '</b></div>';

        // 新兵种
        html += '<div class="report-text">☛ 新兵种：</div>';
        var uHtml = Object.keys(WR_UNIT_COSTS).map(function (k) {
            var c = WR_UNIT_COSTS[k], u = w.units[k];
            if (!u.ready) {
                return '<span class="wr-unit">' + k + '（未立）' + c.src + ' <button class="btn" onclick="wrUnlockUnit(\'' + k + '\')">兴军(库-' + c.unlockSilver + ')</button></span>';
            }
            return '<span class="wr-unit">' + k + ' 已立 Lv' + u.level + '（募' + u.recruited + '营）' +
                (u.recruited < 3 ? ' <button class="btn" onclick="wrRecruitCamp(\'' + k + '\')">募营(库-' + c.campSilver + ' 民望-' + c.campReput + ')</button>' : '') + '</span>';
        }).join('<br/>');
        html += '<div class="report-text">' + uHtml + '</div>';

        // 边患
        html += '<div class="report-text">☛ 边患（可出兵平之，进战棋实战）：</div>';
        var thHtml = Object.keys(w.threats).map(function (k) {
            var t = w.threats[k];
            var label = t.active
                ? t.name + '·犯边！ ' + (wsStrikeBtn(k))
                : t.name + '（未起' + (t.cd > 0 ? '·靖' + t.cd : '') + '）';
            return '<span class="wr-threat ' + (t.active ? 'wr-threat-on' : '') + '">' + label + '</span>';
        }).join(' ');
        html += '<div class="report-text">' + thHtml + '</div>';

        // 驻军 + 镇名（用九边 border 镇）
        html += '<div class="report-text">☛ 边镇驻军（每季耗饷，防边患）：</div>';
        var garDrop = wdBorderList().map(function (r) {
            var lv = w.garrison[r.key] || 0;
            return r.name + (lv > 0 ? '戍' + lv + '营' : '') +
                ' <button class="btn" onclick="wrGarrison(\'' + r.key + '\')">增戍</button>' +
                (lv > 0 ? ' <button class="btn" onclick="wrRetreatGarrison(\'' + r.key + '\')">撤戍</button>' : '');
        }).join(' ');
        html += '<div class="report-text">' + garDrop + '</div>';

        // 京营整顿 + 军功封赏
        html += '<div class="report-text">☛ <button class="btn" onclick="wrRevampJing()">京营整顿(库-80' + (w.jingRevampCd > 0 ? '·冷却' + w.jingRevampCd : '') + ')</button> ' +
            '<button class="btn" onclick="wrMeritReward()">军功封赏(内帑-100 需军功≥20)</button></div>';

        html += '<div class="report-text"><i>本版史据：《明史》卷89兵志一·戎政 / 卷91·卷92兵志三·四 / 卷95兵志九边 / 卷212谭纶传 / 卷222张居正传 / 卷327鞑靼传 / 卷322日本传 / 卷228李化龙传 / 卷309流贼传。设定与演绎各半。</i></div>';
        html += '</div>';
        return html;
    } catch (e) { return ''; }
}
function wsStrikeBtn(k) {
    return '<button class="btn cw-btn-danger" onclick="wrStrikeThreat(\'' + k + '\')">出兵平之</button>';
}
// 九边 border 镇列表（复用 MAP_REGIONS）
function wdBorderList() {
    try {
        if (typeof MAP_REGIONS !== 'undefined') {
            return MAP_REGIONS.filter(function (r) { return r.border; });
        }
        return [];
    } catch (e) { return []; }
}

console.log('✓ 批C·军事战守扩充加载完成');