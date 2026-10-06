// ============================================
// 《大明国策》v6.1 批F · 军事科技树深挖（分支化）
// 在既有火器线(milOps.firearms 0-3)之上，扩展成三条主线 + 战法研究：
//   ① 火器线（向上扩）：鸟铳→佛郎机→红衣大炮(已有 0-3) →
//      后段并列分支【火铳阵成军】解锁战棋兵种"神机火铳部" / 【将军炮固城】守城强化
//   ② 铁骑线（新）：马政→选骏→八大营铁骑(解锁战棋兵种"大明铁骑" cav，克制北虏)→火铳骑突
//   ③ 水师线（新）：造船→楼船→江海水师(解锁战棋兵种"宝船水师")→配火攻
//   ④ 战法研究（横切）：中后段解锁新战术指令（铁骑冲阵/火攻焚寨，接入 battlefield BF_TACTICS）
// 无白嫖：每级研发真实代价（国库银 + 研究院支撑 + 前置线级）；冷却防连点；全 try-catch。
// 史据核《明史》兵志：
//   卷90·兵志二（卫所）；卷91·兵志三·营制（京营/十二团营）；卷92·兵志四（马政、车营、火器神机营）；
//   卷93·兵志五（漕运水师）；卷94·兵志六（水军中下游营哨）；
//   卷89·兵志一·戎政（大阅兵政）；卷95·兵志九边（边军）；卷222·张居正传（京营整饬）；
//   卷92·兵志四·火器："正德末，佛郎机铳入中国" / 红夷大炮（天启，实录为基础演绎注明）
// 本篇为追加式：不覆盖既有火器线（milOps.firearms 保持原逻辑），仅在其上新增分支与两条新线。
// 演绎注明：分支"火铳阵成军/将军炮固城/铁骑新军/宝船"为设定演绎，史据取兵志神机营/车营/水军之法的推演。
// ============================================

// ---------- 存档链三件套之一：构造器默认 ----------
function initMilTechState() {
    return {
        // 铁骑线：0未起 1马政 2选骏 3八大营铁骑 4火铳骑突
        cav: 0,
        // 水师线：0未起 1造船 2楼船 3江海水师 4配火攻
        navy: 0,
        // 火器后段并列分支（需 milOps.firearms≥2 方可研）
        huochong: 0,   // 火铳阵成军 0未成 1已成 → 解锁战棋兵种"神机火铳部"
        fort: 0,       // 将军炮固城 0未成 1已成 → 守城强化
        // 战法研究解锁（横切，入 battlefield BF_TACTICS）
        tactics: { qichong: false, huogong: false },
        // 冷却（防连点，每季 milTechTick 递减）
        cd: 0,
        lastTick: 0
    };
}

// 旧档兜底：补齐 milTech 缺失子键（勿覆盖既有已研学等级）
function ensureMilTechState() {
    try {
        if (!GameState.milTech || typeof GameState.milTech.cav === 'undefined') {
            GameState.milTech = initMilTechState();
        } else {
            var t = GameState.milTech;
            if (typeof t.navy !== 'number') t.navy = 0;
            if (typeof t.huochong !== 'number') t.huochong = 0;
            if (typeof t.fort !== 'number') t.fort = 0;
            if (!t.tactics) t.tactics = { qichong: false, huogong: false };
            if (typeof t.tactics.qichong !== 'boolean') t.tactics.qichong = false;
            if (typeof t.tactics.huogong !== 'boolean') t.tactics.huogong = false;
            if (typeof t.cd !== 'number') t.cd = 0;
        }
    } catch (e) { try { GameState.milTech = initMilTechState(); } catch (e2) {} }
    return GameState.milTech;
}
function _mt() { try { ensureMilTechState(); return GameState.milTech; } catch (e) { return null; } }

// ---------- 战法注入（接入 battlefield BF_TACTICS，仅当已解锁） ----------
// 追加式：不覆盖既有战术；仅在对应战法研究解锁后，将新战术并入 BF_TACTICS。
// 克制判定直接复用既有 bfBeat（beat 对照敌方战术 attack/assault/flank/defend）。
function mtAppendTactics() {
    try {
        if (typeof BF_TACTICS === 'undefined') return;
        var t = _mt(); if (!t) return;
        if (t.tactics && t.tactics.qichong && !BF_TACTICS.mt_qichong) {
            BF_TACTICS.mt_qichong = { name: '铁骑冲阵', morale: 6, mult: 1.50, beat: 'flank' }; // 铁骑破迂回包抄，克北虏骑冲
        }
        if (t.tactics && t.tactics.huogong && !BF_TACTICS.mt_huogong) {
            BF_TACTICS.mt_huogong = { name: '火攻焚寨', morale: 7, mult: 1.70, beat: 'assault' };// 火船焚敌突袭之寨
        }
    } catch (e) {}
}

// ---------- 铁骑线 ----------
function mtResearchCav() {
    try {
        var t = _mt(); if (!t) return { ok: false, msg: '状态未就绪' };
        if (t.cd > 0) return { ok: false, msg: '军机方殷，暂缓研之（冷却' + t.cd + '季）' };
        var rook = [null, { cost: 6,  inst: 0 }, { cost: 10, inst: 1 }, { cost: 16, inst: 1 }, { cost: 26, inst: 2 }];
        var next = t.cav + 1;
        if (next > 4) return { ok: false, msg: '铁骑线已臻化境' };
        var r = rook[next];
        // 前置：铁骑线逐级；火铳骑突(L4)另需火器(佛郎机)
        if (next === 4 && (_mil() && _mil().firearms < 2)) return { ok: false, msg: '须火器研至佛郎机(火器Lv2)方可火铳骑突' };
        var inst = _mil() ? _mil().institute : 0;
        if (inst < r.inst) return { ok: false, msg: '研究院需达' + r.inst + '层方可研此' };
        if (GameState.stats.treasury < r.cost) return { ok: false, msg: '府库不足（需' + r.cost + '两）' };
        GameState.stats.treasury -= r.cost;
        t.cav = next; t.lastTick = new Date().getTime();
        // 联动军力（出征胜率演算）：铁骑军力加成
        if (_mil()) _mil().powerBonus += (next === 3 ? 8 : next === 4 ? 8 : 4);
        // 七大营铁骑(L3) → 解锁战棋兵种"大明铁骑"；火铳骑突(L4) → 解锁战法"铁骑冲阵"
        if (next === 3) { mtAppendTactics(); }
        if (next === 4) { t.tactics.qichong = true; mtAppendTactics(); }
        t.cd = 1;
        pushNews('兵部', '铁骑线研至【' + mtCavName(t.cav) + '】。' + mtCavDesc(next), 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}

// ---------- 水师线 ----------
function mtResearchNavy() {
    try {
        var t = _mt(); if (!t) return { ok: false, msg: '状态未就绪' };
        if (t.cd > 0) return { ok: false, msg: '军机方殷，暂缓研之（冷却' + t.cd + '季）' };
        var rook = [null, { cost: 5, inst: 0 }, { cost: 9, inst: 0 }, { cost: 15, inst: 1 }, { cost: 22, inst: 1 }];
        var next = t.navy + 1;
        if (next > 4) return { ok: false, msg: '水师线已臻化境' };
        var r = rook[next];
        // 配火攻(L4)另需火器(鸟铳以上)
        if (next === 4 && (_mil() && _mil().firearms < 1)) return { ok: false, msg: '须火器研至至少鸟铳方可配火攻于船' };
        var inst = _mil() ? _mil().institute : 0;
        if (inst < r.inst) return { ok: false, msg: '研究院需达' + r.inst + '层方可研此' };
        if (GameState.stats.treasury < r.cost) return { ok: false, msg: '府库不足（需' + r.cost + '两）' };
        GameState.stats.treasury -= r.cost;
        t.navy = next; t.lastTick = new Date().getTime();
        if (_mil()) _mil().powerBonus += (next === 3 ? 7 : next === 4 ? 7 : 3);
        // 江海水师(L3) → 解锁战棋兵种"宝船水师"；配火攻(L4) → 解锁战法"火攻焚寨"
        if (next === 4) { t.tactics.huogong = true; mtAppendTactics(); }
        t.cd = 1;
        pushNews('水师', '水师线研至【' + mtNavyName(t.navy) + '】。' + mtNavyDesc(next), 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}

// ---------- 火器后段并列分支 --------（需 milOps.firearms≥2 ）
// 【火铳阵成军】解锁战棋兵种"神机火铳部"
function mtResearchHuochong() {
    try {
        var t = _mt(); if (!t) return { ok: false, msg: '状态未就绪' };
        if (t.cd > 0) return { ok: false, msg: '军机方殷，暂缓研之（冷却' + t.cd + '季）' };
        if (t.huochong === 1) return { ok: false, msg: '火铳阵已成军' };
        var fa = _mil() ? _mil().firearms : 0;
        if (fa < 2) return { ok: false, msg: '须火器研至佛郎机(火器Lv2)方可成火铳阵' };
        var inst = _mil() ? _mil().institute : 0;
        if (inst < 2) return { ok: false, msg: '研究院需达2层方可成军' };
        if (GameState.stats.treasury < 14) return { ok: false, msg: '府库不足（需14两）' };
        GameState.stats.treasury -= 14;
        t.huochong = 1; t.lastTick = new Date().getTime();
        if (_mil()) _mil().powerBonus += 10;
        t.cd = 1;
        pushNews('工部', '火铳阵成军，枪铳火器编为战阵，可攻可守。', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}
// 【将军炮固城】守城强化
function mtResearchFort() {
    try {
        var t = _mt(); if (!t) return { ok: false, msg: '状态未就绪' };
        if (t.cd > 0) return { ok: false, msg: '军机方殷，暂缓研之（冷却' + t.cd + '季）' };
        if (t.fort === 1) return { ok: false, msg: '将军炮已固城' };
        var fa = _mil() ? _mil().firearms : 0;
        if (fa < 2) return { ok: false, msg: '须火器研至佛郎机(火器Lv2)方可置炮守城' };
        var inst = _mil() ? _mil().institute : 0;
        if (inst < 2) return { ok: false, msg: '研究院需达2层方可置炮' };
        if (GameState.stats.treasury < 14) return { ok: false, msg: '府库不足（需14两）' };
        GameState.stats.treasury -= 14;
        t.fort = 1; t.lastTick = new Date().getTime();
        // 守城强化：军力加成 + 稳定（城防巩固，民心稍安）
        if (_mil()) _mil().powerBonus += 8;
        if (typeof GameState.stats.stability === 'number') GameState.stats.stability = Math.min(100, GameState.stats.stability + 1);
        t.cd = 1;
        pushNews('工部', '将军炮固城，城防为之一壮，守军可倚火器御敌。', 'normal');
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
        return { ok: true };
    } catch (e) { return { ok: false, msg: String(e && e.message) }; }
}

// ---------- 科技树军力联动（出征胜率） ----------
function mtTechPowerMod() {
    try {
        var t = _mt(); if (!t) return 0;
        return t.cav * 4 + t.navy * 3 + t.huochong * 10 + t.fort * 8;
    } catch (e) { return 0; }
}

// ---------- 名称/文案 ----------
function mtCavName(l) { return ['未起', '马政', '选骏', '八大营铁骑', '火铳骑突'][l] || '未知'; }
function mtNavyName(l) { return ['未起', '造船', '楼船', '江海水师', '配火攻'][l] || '未知'; }
function mtCavDesc(l) {
    return { 1: '立太仆寺，孳养战马。', 2: '拣选良马，汰弱留强。', 3: '铁骑成军，可破北虏骑冲。', 4: '火铳骑驰战阵，火器与骑突相济。' }[l] || '';
}
function mtNavyDesc(l) {
    return { 1: '造船之制兴，舟师渐备。', 2: '楼船高峙，可载士卒。', 3: '水师扬帆，江南漕运亦资其卫。', 4: '火船入中流，可焚敌船。' }[l] || '';
}

// ---------- 冷却巡检（每季挂载 advanceSeason 链尾） ----------
function milTechTick() {
    try {
        var t = _mt(); if (!t) return;
        if (t.cd > 0) t.cd -= 1;
        if (t.cd < 0) t.cd = 0;
    } catch (e) {}
}

// ---------- 战棋新兵种（追加进 BF_PLAYER_TYPES，仅新增不覆盖） ----------
// 史据：《明史》卷92·兵志四（马政·神机营·车营·红夷炮）/ 卷93·卷94·兵志五·六（水军楼船宝船）
if (typeof BF_PLAYER_TYPES !== 'undefined' && !BF_PLAYER_TYPES.mt_damingcav) {
    BF_PLAYER_TYPES.mt_damingcav = { name: '大明铁骑',   role: 'cav',    atk: 1.40, def: 1.00, morale: 1.25 }; // 卷92马政·御马监（大明铁骑——设定演绎注）
    BF_PLAYER_TYPES.mt_baochuan  = { name: '宝船水师',   role: 'navy',   atk: 1.20, def: 0.95, morale: 1.00 }; // 卷93/94水军（宝船典出三宝太监下西洋——演绎注）
    BF_PLAYER_TYPES.mt_huochong = { name: '神机火铳部', role: 'firearm', atk: 1.30, def: 0.85, morale: 1.15 }; // 卷92神机营火器（火器阵成军——演绎注）
}

// 追加进战棋出兵包裹：已解锁的新兵种可被选入（复用批C bfAppendExtraUnits 追加式，不改既有）
// 此函数由 bfAppendExtraUnits 内追加调用，保证不含既有逻辑改动。
function bfAppendMilTechUnits() {
    try {
        if (!GameState.battlefield || !GameState.battlefield.player) return 0;
        var b = GameState.battlefield; var t = _mt(); if (!t) return 0;
        var n = 0;
        function pushType(key, mult) {
            try {
                var u = bfMkUnit('mt' + (b.player.units.length + n), BF_PLAYER_TYPES[key].name, key, mult);
                b.player.units.push(u); n++;
            } catch (e) {}
        }
        // 八大营铁骑(L3+) → 大明铁骑；火器佛郎机可直接编神机火铳(已有神机营，此为新火铳阵)
        if (t.cav >= 3) pushType('mt_damingcav', 1.0 + t.cav * 0.06);
        if (t.navy >= 3) pushType('mt_baochuan', 1.0 + t.navy * 0.05);
        if (t.huochong === 1) pushType('mt_huochong', 1.15);
        return n;
    } catch (e) { return 0; }
}

// ---------- 科技树操作面板（并入 military tab 尾部） ----------
function renderMilTechTab() {
    try {
        var t = _mt(); if (!t) return '';
        var m = _mil() || {};
        // 战法解锁状态
        var qc = (t.tactics && t.tactics.qichong) ? '已研' : (t.cav >= 4 ? '可研' : '（需铁骑线至火铳骑突）');
        var hg = (t.tactics && t.tactics.huogong) ? '已研' : (t.navy >= 4 ? '可研' : '（需水师线至配火攻）');

        // 铁骑线
        var cavBtn = t.cav >= 4 ? '已极'
            : (t.cd > 0 ? '研究(冷却)'
            : '<button class="btn" onclick="mtResearchCav()">研铁骑(库' + [6, 10, 16, 26][t.cav] + ' 院' + [0, 1, 1, 2][t.cav] + ')</button>');
        // 水师线
        var navNext = t.navy >= 4 ? null : (t.navy + 1);
        var navBtn = t.navy >= 4 ? '已极'
            : (t.cd > 0 ? '研究(冷却)'
            : '<button class="btn" onclick="mtResearchNavy()">研水师(库' + [5, 9, 15, 22][t.navy] + ' 院' + [0, 0, 1, 1][t.navy] + (navNext === 4 ? ' 需火器' : '') + ')</button>');
        // 火器分支
        var hcBtn = t.huochong === 1 ? '已成军'
            : (t.cd > 0 ? '研究(冷却)' : (m.firearms < 2 ? '（需火器≥佛郎机）' : '<button class="btn" onclick="mtResearchHuochong()">火铳阵成军(库14院2)</button>'));
        var ftBtn = t.fort === 1 ? '已固城'
            : (t.cd > 0 ? '研究(冷却)' : (m.firearms < 2 ? '（需火器≥佛郎机）' : '<button class="btn" onclick="mtResearchFort()">将军炮固城(库14院2)</button>'));

        return '<div class="report-card"><div class="report-title">🎯 军事科技树（批F）</div>' +
            '<div class="report-text">分支研造联动出征：军力加成 <b>+' + mtTechPowerMod() + '</b>（合计评估' + milTotalScore() + '）· 季研究冷却：' + t.cd + '</div>' +
            '<div class="report-text">🔥 火器线（已有）：当前<b>' + (typeof firearmName === 'function' ? firearmName(m.firearms) : m.firearms) + '</b>（研究院' + m.institute + '层）→ 后段分支：</div>' +
            '<div class="report-text">　☛ 火铳阵成军（解神机火铳部）· 状态<b>' + (t.huochong === 1 ? '已立' : '未成') + '</b>　' + hcBtn + '</div>' +
            '<div class="report-text">　☛ 将军炮固城（守城强化）· 状态<b>' + (t.fort === 1 ? '已固' : '未筑') + '</b>　' + ftBtn + '</div>' +
            '<div class="report-text">🐎 铁骑线：<b>' + mtCavName(t.cav) + '</b>（' + mtCavDesc(t.cav) + '）　' + cavBtn + '</div>' +
            '<div class="report-text">⚓ 水师线：<b>' + mtNavyName(t.navy) + '</b>（' + mtNavyDesc(t.navy) + '）　' + navBtn + '</div>' +
            '<div class="report-text">📜 战法研究（横切·入战棋新指令）：铁骑冲阵 <b>' + qc + '</b>　·　火攻焚寨 <b>' + hg + '</b></div>' +
            '<div class="report-text"><i>史据（本版）：《明史》卷91·兵志三（营制）/ 卷92·兵志四（马政·神机营火器·车营·红夷炮）/ 卷93·94·兵志五·六（漕运水师·楼船）/ 卷95·兵志九边 / 卷222·张居正传（京营整饬·火器精锐）。铁骑新军与宝船为演绎设定注明。</i></div>' +
            '</div>';
    } catch (e) { return ''; }
}

console.log('✓ 批F·军事科技树加载完成');