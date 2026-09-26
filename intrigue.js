// ============================================================================
// 《大明国策》批D：权谋系统（大臣结党 / 朋党倾轧 / 阴谋暴露 / 廷杖·流放·贬谪）
// ----------------------------------------------------------------------------
// 呼应：20大臣关系网(DAMING_RELATIONS)、五派系(FACTIONS)、厂卫(cangwei)、稳定度。
// 哲学：反爽游——权谋皆有代价与回响，做对了也可能留下裂痕。
//
// 史据（宁换不编，演绎注明）：
//  - 廷杖：《明史·卷九十五·志第七十一·刑法三》"刑法有创之自明，不衷古制者，
//        廷杖、东西厂、锦衣卫、镇抚司狱是已……杖杀朝士，倍蓰前代"。
//        又载"正德十四年，以谏止南巡，廷杖舒芬、黄巩等百四十六人，死者十一人"。
//  - 廷杖+流放：王守仁（王阳明）正德元年杖四十、谪贵州龙场驿丞，见《明史·卷一百九十五·王守仁传》。
//  - 诏狱/酷刑/杨涟左光斗毙狱：《明史·卷九十五·刑法三》"拷杨涟、左光斗辈……明日，涟死"，
//        及《明史·卷二百四十四·杨涟传》。
//  - 结党/朋党：东林讲学结党（《明史·卷二百三十一·顾宪成传》、卷三百五·魏忠贤传，
//        "东林"之名出东林书院）；党争互讦、门户水火，为明亡积弊。
//  - 阉党：司礼监掌印、锦衣缇骑用事，《明史·卷三百五·宦官传》魏忠贤等。
//  - 谪戍/充军：《明史·刑法志》"士大夫罪谪废诛"。
// 其余情节均为游戏演绎，附"演绎"标注。
// ============================================================================

// ---- 权谋参数（整数化，可调） ----
var INTRIGUE_CFG = {
    CLIQUE_MIN_MEMBERS: 3,     // 结成"党"至少需要的大臣数
    CLIQUE_FORM_CD: 6,         // 两次结党尝试的最小间隔（章）
    CLIQUE_GROW_CD: 2,         // 党势增长结算间隔
    FEUD_CD: 5,                // 两党倾轧冷却
    SCHEME_BREW_CD: 3,         // 阴谋酝酿冷却
    EXPOSE_CD: 4,              // 阴谋暴露冷却
    POWER_CAP: 100,            // 党势上限
    AMBITION_HI: 62,           // 构党首领野心门槛
    INTEGRITY_LO: 48,          // 奸党成员廉度阈值（低于→易成奸党）
    LEADER_AMBITION: 66,       // 首领野心门槛
    FORM_PROB: 0.22,           // 每季尝试结党概率
    FEUD_PROB: 0.18,           // 每季党争爆发概率
    SCHEME_PROB: 0.18,         // 每季阴谋酝酿概率
    EXPIRE_AFTER: 40           // 党内无实据久不处理自动松动章数
};

// ---- 党名映射（依派系+属性，史风）----
var INTRIGUE_CLIQUE_NAMES = {
    civil:    { jian: '内阁势党',  qing: '东林清流',  label: '文官' },
    eunuch:   { jian: '阉党',      qing: '内侍近党',  label: '宦官' },
    military: { jian: '边镇武党',  qing: '宿将之党',  label: '武将' },
    consort:  { jian: '戚里党',    qing: '外家亲党',  label: '外戚' },
    royal:    { jian: '宗藩之党',  qing: '宗室亲藩',  label: '宗室' }
};
var INTRIGUE_CAT_LABEL = { civil: '文官', eunuch: '宦官', military: '武将', consort: '外戚', royal: '宗室' };

// 明史回响（廷杖/流放/贬谪/诏狱）——引用卷次，宁换不编
var INTRIGUE_ECHO = {
    tingzhang: '《明史·卷九十五·刑法三》："刑法有创之自明，不衷古制者，廷杖、东西厂、锦衣卫、镇抚司狱是已。是数者，杀人至惨，而不丽于法……杖杀朝士，倍蓰前代。" 正德十四年谏止南巡，杖舒芬、黄巩等百四十六人，死者十一。',
    liufang:   '明代大臣得罪，多谪戍烟瘴边卫、龙场为驿丞。王守仁（王阳明）正因为言触忤刘瑾，杖四十，谪贵州龙场驿丞，处荒服绝域。语在《明史·卷一百九十五·王守仁传》。',
    bianzhe:   '贬谪降秩，明制所常。言官以言获罪，降级调外、削籍为民者累累。语在《明史》刑法志"士大夫罪谪废诛，勿加笞杖"。',
    donglin:   '东林之党，起于讲学。顾宪成讲学东林书院，海内士争附之，指目为"东林党"，与阉党、齐楚浙诸党门户水火，竞相攻讦。语在《明史·卷二百三十一·顾宪成传》、卷三百五·魏忠贤传。',
    yandang:   '阉党炽于天启。魏忠贤擅权，内外大权一归之，廷臣争附为"义子"，制诏狱，戕忠良。语在《明史·卷三百五·宦官传》；卷九十五·刑法三载"拷杨涟、左光斗辈……明日，涟死"。',
    zhaoyu:    '诏狱即锦衣卫狱，幽系惨酷，害无甚于此者。语在《明史·卷九十五·刑法三》。',
    jiegin:    '大臣结党营私、交通内外，历代为祸。宪宗朝汪直建西厂，罗织臣僚；成化十五年诬陷侍郎马文升，廷杖言官。语在《明史·卷九十五·刑法三》、卷三百四·宦官传。'
};

// ---- 阴谋动机（史载罪名，演绎组合）----
var INTRIGUE_SCHEMES = [
    { key: 'jielung',   txt: '结党营私，把持铨叙，援引门生故吏', src: '“大臣结党营私”史鉴：《明史》卷231顾宪成传（东林党）、卷305魏忠贤传（阉党），情节为演绎' },
    { key: 'jiaotong',  txt: '交通内宦，窥伺宫禁，传递私书',       src: '史载阉宦交通外廷：汪直/魏忠贤，见《明史》卷304、305宦官传，情节为演绎' },
    { key: 'budin',     txt: '意图不轨，暗蓄死士，心怀异志',       src: '史载谋逆事：正德宁王朱宸濠反（《明史》卷117诸王传、卷195王守仁传），情节为演绎' },
    { key: 'juyi',      txt: '聚敛藏私，侵吞国帑，肥己营党',       src: '史载权阉侵财：刘瑾籍没家财钜万（《明史》卷304刘瑾传），情节为演绎' }
];

// ======================= 状态区 =======================

function initIntrigueState() {
    return {
        cliques: {},        // id -> {id,name,cat,kind,members:[names],power,foundedTick,lastGrowTick,secrets}
        memberClique: {},   // ministerName -> cliqueId
        leaderOf: {},       // cliqueId -> ministerName（党魁）
        schemes: [],        // {id,name,cat,idx,motive,key,found,resolved,cd}
        feuds: {},          // id -> {id,a,b,lastFlareTick,flareCount,cd}
        punishments: [],    // {name,method,tick,note}  史鉴回响记录
        history: [],        // 权谋大事录
        pending: null,      // 待裁决事件（kind:'scheme'|'feud'）
        lastFormTick: -99, lastGrowTick: -99,
        lastFeudTick: -99, lastSchemeTick: -99, lastExposeTick: -99
    };
}

function ensureIntrigueState() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        if (!GameState.intrigue) GameState.intrigue = initIntrigueState();
        var it = GameState.intrigue;
        var base = initIntrigueState();
        ['cliques','memberClique','leaderOf','schemes','feuds','punishments','history'].forEach(function(k){
            if (!it[k]) it[k] = base[k];
        });
        ['lastFormTick','lastGrowTick','lastFeudTick','lastSchemeTick','lastExposeTick'].forEach(function(k){
            if (it[k] === undefined) it[k] = base[k];
        });
        if (!it.pending) it.pending = null;
        return it;
    } catch (e) { return null; }
}

function itTick() { try { return (typeof getMapTick === 'function') ? getMapTick() : 0; } catch (e) { return 0; } }

// ---- 在任大臣扁平化（跳过已死/在狱/已谪戍）----
function itLiveMinisters() {
    var out = [];
    try {
        Object.keys(GameState.ministers || {}).forEach(function(cat){
            (GameState.ministers[cat] || []).forEach(function(m, i){
                if (m && !m.dead && !m.jailed && !m.exiled) out.push({ cat: cat, idx: i, m: m });
            });
        });
    } catch (e) {}
    return out;
}
function itLiveNames() { return itLiveMinisters().map(function(x){ return x.m.name; }); }
function itFindCatIdx(name) {
    try {
        var cats = Object.keys(GameState.ministers || {});
        for (var c = 0; c < cats.length; c++) {
            var arr = GameState.ministers[cats[c]] || [];
            for (var j = 0; j < arr.length; j++) {
                if (arr[j] && arr[j].name === name) return { cat: cats[c], idx: j, m: arr[j] };
            }
        }
    } catch (e) {}
    return null;
}
function itModLoyalty(name, delta) {
    try {
        var f = itFindCatIdx(name);
        if (f) f.m.loyalty = Math.max(0, Math.min(100, (f.m.loyalty || 50) + delta));
    } catch (e) {}
}
function itModLegacy(name, delta) {
    // 名望/清议（用 integrity 与 faction 微调模拟党内外声望）
    try {
        var f = itFindCatIdx(name);
        if (f) {
            f.m.integrity = Math.max(0, Math.min(100, (f.m.integrity || 50) + delta));
            f.m.faction = Math.max(0, Math.min(100, (f.m.faction || 50) + delta * -0.5));
        }
    } catch (e) {}
}

// ==== 结党 ============================================================
// mechanism: 需 ≥CLIQUE_MIN_MEMBERS 名在任且未结党大臣，同派系优先，具史载关系(DAMING_RELATIONS)更强。
function itTryFormClique(forceCandidates) {
    try {
        var it = ensureIntrigueState(); if (!it) return false;
        var tick = itTick();
        if (tick - it.lastFormTick < INTRIGUE_CFG.CLIQUE_FORM_CD) return false;
        // 候选池：未结党、在任、野心够的大臣
        var pool = (forceCandidates || itLiveMinisters()).filter(function(x){
            var m = x.m;
            return !it.memberClique[m.name] &&
                   (m.ambition || 50) >= INTRIGUE_CFG.AMBITION_HI &&
                   (m.integrity || 50) <= 75; // 太清廉刚直者不轻易结党
        });
        // 无首领（野心顶点）则不成
        var leader = pool.reduce(function(best, x){
            return (best && (best.m.ambition || 0) >= (x.m.ambition || 0)) ? best : x;
        }, null);
        if (!leader || (leader.m.ambition || 0) < INTRIGUE_CFG.LEADER_AMBITION) return false;
        if (forceCandidates && pool.length < INTRIGUE_CFG.CLIQUE_MIN_MEMBERS) return false;
        var leaderName = leader.m.name;
        var cat = leader.cat;
        var poolCat = pool.filter(function(x){ return x.cat === cat; });
        var members = [leader];
        // 优先同党同派系
        poolCat.forEach(function(x){ if (members.length < INTRIGUE_CFG.CLIQUE_MIN_MEMBERS && x.m.name !== leaderName) members.push(x); });
        // 不足则从其他派系补（跨派系结党更隐蔽、更险）
        if (members.length < INTRIGUE_CFG.CLIQUE_MIN_MEMBERS) {
            pool.forEach(function(x){
                if (members.length < INTRIGUE_CFG.CLIQUE_MIN_MEMBERS && x.m.name !== leaderName && x.cat !== cat) members.push(x);
            });
        }
        if (members.length < INTRIGUE_CFG.CLIQUE_MIN_MEMBERS) {
            it.lastFormTick = tick; // 冷却也计一次，防频繁空转
            return false;
        }
        // 定性：廉意何如——平均廉度高 → 清流，低 → 奸党
        var avgInt = members.reduce(function(a, x){ return a + (x.m.integrity || 50); }, 0) / members.length;
        var kind = avgInt >= 55 ? 'qing' : 'jian';
        // 检查史载关系（关系网加成）
        var relBonus = false;
        try {
            var names = members.map(function(x){ return x.m.name; });
            for (var r = 0; r < DAMING_RELATIONS.length; r++) {
                var pair = DAMING_RELATIONS[r].names;
                if (pair.every(function(n){ return names.indexOf(n) >= 0; })) { relBonus = true; break; }
            }
        } catch (e) {}
        var baseName = (INTRIGUE_CLIQUE_NAMES[cat] || INTRIGUE_CLIQUE_NAMES.civil)[kind] ||
                       (INTRIGUE_CLIQUE_NAMES[cat] || INTRIGUE_CLIQUE_NAMES.civil).jian;
        var cid = 'clq_' + tick + '_' + Math.floor(Math.random() * 10000);
        var cl = {
            id: cid, name: baseName, cat: cat, kind: kind,
            members: members.map(function(x){ return x.m.name; }),
            power: 20 + members.length * 5 + (relBonus ? 8 : 0),
            foundedTick: tick, lastGrowTick: tick,
            secrets: 0,  // 累积"债"（纵容则涨）
            rel: relBonus ? DAMING_RELATIONS.find(function(r){ return r.names.indexOf(leaderName) >= 0; }) : null
        };
        it.cliques[cid] = cl;
        it.leaderOf[cid] = leaderName;
        members.forEach(function(x){ it.memberClique[x.m.name] = cid; });
        // 史载关系结党 → 强回响
        var src = relBonus ? (cl.rel ? cl.rel.src : '《明史》' ) : INTRIGUE_ECHO.donglin;
        it.history.push({ time: '第' + (GameState.currentYear || 0) + '年', text: baseName + '成于' + leaderName + '，' + (kind === 'jian' ? '结党营私' : '清议相结') + '，党羽' + members.length },
                         { time: '史鉴', text: '（史据：' + src + '）' });
        it.lastFormTick = tick;
        pushNews('权谋', (kind === 'jian' ? '怪哉' : '朝野') + '：' + baseName + '以' + leaderName + '为魁党，' +
            members.slice(1).map(function(x){ return x.m.name; }).join('、') + (relBonus ? '附之，缘有旧谊' : '相与连结') + '，党势渐炽。', 'critical');
        if (kind === 'jian') { GameState.factions[cat] = Math.max(0, Math.min(100, (GameState.factions[cat] || 50) - 2)); }
        return true;
    } catch (e) { return false; }
}

// ==== 党势生息（随野心、派系势力涨落）====
function itGrowCliques() {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        var tick = itTick();
        if (tick - it.lastGrowTick < INTRIGUE_CFG.CLIQUE_GROW_CD) return;
        it.lastGrowTick = tick;
        Object.keys(it.cliques).forEach(function(cid){
            var cl = it.cliques[cid];
            var leader = itFindCatIdx(it.leaderOf[cid]);
            var ambition = leader ? (leader.m.ambition || 50) : 50;
            var facPow = (GameState.factions[cl.cat] || 50);
            var delta = Math.round((ambition - 45) * 0.25 + (facPow - 50) * 0.2 - cl.secrets * 0.5);
            cl.power = Math.max(0, Math.min(INTRIGUE_CFG.POWER_CAP, cl.power + delta));
        });
    } catch (e) {}
}

// ==== 党势过大 → 派系失衡警示（反爽游：结党损稳）====
function itCheckOverreach() {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        Object.keys(it.cliques).forEach(function(cid){
            var cl = it.cliques[cid];
            if (cl.power >= 78 && !cl.warned) {
                cl.warned = true;
                pushNews('权谋', cl.name + '势焰熏灼，党羽盘结，兵马钱粮几皆听命于' + (it.leaderOf[cid] || '党魁') + '，尾大不掉。', 'critical');
                GameState.factions[cl.cat] = Math.max(0, Math.min(100, (GameState.factions[cl.cat] || 50) - 3));
            }
        });
    } catch (e) {}
}

// ==== 阴谋酝酿（野心+廉低者，尤其党内）====
function itBrewScheme() {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        var tick = itTick();
        if (tick - it.lastSchemeTick < INTRIGUE_CFG.SCHEME_BREW_CD) return;
        it.lastSchemeTick = tick;
        var cand = itLiveMinisters().filter(function(x){
            var m = x.m;
            return (m.ambition || 0) >= 72 && (m.integrity || 100) <= 55;
        });
        if (!cand.length) return;
        var pick = cand[Math.floor(Math.random() * cand.length)];
        // 同党勿重复酝酿（冷却）
        var cid = it.memberClique[pick.m.name];
        for (var s = 0; s < it.schemes.length; s++) {
            if (it.schemes[s].name === pick.m.name && !it.schemes[s].resolved) return;
        }
        var sch = INTRIGUE_SCHEMES[Math.floor(Math.random() * INTRIGUE_SCHEMES.length)];
        it.schemes.push({
            id: 'sch_' + tick + '_' + it.schemes.length,
            name: pick.m.name, cat: pick.cat, idx: pick.idx,
            motive: sch.txt, key: sch.key, src: sch.src,
            found: false, resolved: false, cd: tick
        });
        if (cid) { var cl = it.cliques[cid]; if (cl) cl.secrets = (cl.secrets || 0) + 1; }
    } catch (e) {}
}

// ==== 阴谋暴露（党势大/厂卫在手/时序到 → 更易暴露）====
function itExposeScheme() {
    try {
        var it = ensureIntrigueState(); if (!it) return null;
        var tick = itTick();
        if (tick - it.lastExposeTick < INTRIGUE_CFG.EXPOSE_CD) return null;
        // 找未暴露未结案的阴谋
        var pendingS = null;
        for (var s = it.schemes.length - 1; s >= 0; s--) {
            var sc = it.schemes[s];
            if (!sc.found && !sc.resolved) { pendingS = sc; break; }
        }
        if (!pendingS) return null;
        // 暴露概率：党势越大越易被厂卫/风闻侦破；厂卫(东厂/锦衣)强则更易
        var base = 0.28;
        var cid = it.memberClique[pendingS.name];
        var cl = cid ? it.cliques[cid] : null;
        if (cl) base += cl.power / 300;
        // 厂卫侦破加成
        var cw = (typeof GameState !== 'undefined') ? GameState.cangwei : null;
        var spyPow = 0;
        try { if (cw && cw.insts) { var e = cw.insts['eunuch'] || (cw.insts['jin'] || {}); spyPow = (e && e.power) || 0; } } catch (e2) {}
        base += spyPow / 400;
        // 自然败露（低概率，一旦败露即上闻）
        var exposedBy = Math.random();
        if (exposedBy < 0.05) { base = 1; }
        if (base >= 1 || Math.random() < base) {
            pendingS.found = true;
            it.lastExposeTick = tick;
            it.pending = { kind: 'scheme', id: pendingS.id, name: pendingS.name, motive: pendingS.motive, src: pendingS.src, cid: cid };
            return it.pending;
        }
        return null;
    } catch (e) { return null; }
}

// ==== 朋党倾轧（两党并存且势均 → 互攻）====
function itFlareFeud() {
    try {
        var it = ensureIntrigueState(); if (!it) return null;
        var tick = itTick();
        if (tick - it.lastFeudTick < INTRIGUE_CFG.FEUD_CD) return null;
        var ids = Object.keys(it.cliques).filter(function(c){
            return it.cliques[c].power >= 34;
        });
        if (ids.length < 2) return null;
        // 找一对最"对立"（跨派系、或一清一奸）
        var a = null, b = null;
        outer:
        for (var i = 0; i < ids.length; i++) {
            for (var j = i + 1; j < ids.length; j++) {
                var ca = it.cliques[ids[i]], cb = it.cliques[ids[j]];
                if (ca.kind !== cb.kind || ca.cat !== cb.cat) { a = ca; b = cb; break outer; }
            }
        }
        if (!a) { a = it.cliques[ids[0]]; b = it.cliques[ids[1]]; }
        if (Math.random() > INTRIGUE_CFG.FEUD_PROB) return null;
        var fid = 'feud_' + tick;
        it.feuds[fid] = { id: fid, a: a.id, b: b.id, lastFlareTick: tick, flareCount: (it.feuds[fid] ? it.feuds[fid].flareCount : 0), cd: tick };
        it.lastFeudTick = tick;
        it.pending = { kind: 'feud', id: fid, aName: a.name, aLead: it.leaderOf[a.id] || '党魁', bName: b.name, bLead: it.leaderOf[b.id] || '党魁' };
        return it.pending;
    } catch (e) { return null; }
}

// ==== 权谋巡检（每季调用，挂 advanceSeason 链尾）====
function intrigueTick() {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        // 若无待裁决，才推进背景演化（避免裁决前链条又叠新事）
        if (it.pending) {
            // 冷却流逝（供长搁置）
            itGrowCliques();
            itCheckOverreach();
            return;
        }
        if (Math.random() < INTRIGUE_CFG.FORM_PROB) itTryFormClique();
        itGrowCliques();
        itCheckOverreach();
        itBrewScheme();
        // 阴谋暴露优先抢占"待裁决"，其次党争
        if (!it.pending) itExposeScheme();
        if (!it.pending) itFlareFeud();
    } catch (e) {}
}

// 是否存在待裁决权谋（advanceSeason 在随机事件前检查，优先弹出）
function intrigueDecisionPending() {
    try { var it = ensureIntrigueState(); return !!(it && it.pending); } catch (e) { return false; }
}

// ==== 打开裁决浮层（由 advanceSeason 的钩子调用）====
function openIntrigueDecision() {
    try {
        var it = ensureIntrigueState(); if (!it || !it.pending) return;
        var p = it.pending;
        var t = document.getElementById('intrigue-title');
        var d = document.getElementById('intrigue-desc');
        var s = document.getElementById('intrigue-src');
        var o = document.getElementById('intrigue-opts');
        if (!o) return;
        if (p.kind === 'scheme') {
            if (t) t.textContent = '密谋败露：' + p.name;
            if (d) d.textContent = p.name + p.motive + '。事已上闻，举朝侧目。孰轻孰重，陛下自裁——严刑则伤清议，姑息则养痈成患。';
            if (s) s.textContent = '（史据：' + p.src + '，机制为游戏演绎）';
            o.innerHTML = [
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'tingzhang\')">震怒廷杖</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'liufang\')">流放谪戍</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'bianzhe\')">贬谪削职</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(&quot;qiaoda&quot;)">敲打训诫</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(&quot;huaizrou&quot;)">怀柔羁縻</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'zongrong\')">留中纵容</button>'
            ].join('');
        } else if (p.kind === 'feud') {
            if (t) t.textContent = '朋党倾轧：' + p.aName + ' vs ' + p.bName;
            if (d) d.textContent = '党魁' + p.aLead + '与' + p.bLead + '各率其党，交章互讦，弹章盈尺，朝堂沸然。陛下裁决何向？';
            if (s) s.textContent = '（史据：党争见《明史》卷305·魏忠贤传、卷231·顾宪成传，门户水火，机制为游戏演绎）';
            o.innerHTML = [
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'backA\')">庇' + p.aName + '</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'backB\')">庇' + p.bName + '</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'mediate\')">两折其衷</button>',
                '<button class="cw-btn intrigue-opt" onclick="intrigueResolve(\'banboth\')">各杖其魁</button>'
            ].join('');
        } else { return; }
        var m = document.getElementById('intrigue-modal');
        if (m) m.classList.add('active');
        try { DamingSFX.play('urgent'); } catch (e) {}
    } catch (e) {}
}

// ==== 裁决执行 =========================================================
function intrigueResolve(choice) {
    try {
        var it = ensureIntrigueState(); if (!it || !it.pending) return;
        var p = it.pending;
        var barrier = false;
        if (p.kind === 'scheme') {
            barrier = intrigueResolveScheme(p, choice);
        } else if (p.kind === 'feud') {
            barrier = intrigueResolveFeud(p, choice);
        }
        // 关闭浮层，记录，清 pending
        var m = document.getElementById('intrigue-modal');
        if (m) { try { m.classList.remove('active'); } catch (e2) {} }
        it.pending = null;
        try { DamingSFX.play(barrier ? 'disaster' : 'decide'); } catch (e2) {}
        if (typeof updateUI === 'function') updateUI();
    } catch (e) {}
}

function intrigueResolveScheme(p, choice) {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        var f = itFindCatIdx(p.name);
        var cid = p.cid;
        var cl = cid ? it.cliques[cid] : null;
        var note = '';
        var death = false, exiled = false, demoted = false;
        switch (choice) {
            case 'tingzhang':
                // 廷杖：威慑而残暴，有杖毙之险——史鉴刑法三
                itModLoyalty(p.name, -20);
                itModLegacy(p.name, -4);
                applyDecision({ prestige: 2, stability: 1, corruption: -2, civil: (f.cat==='civil'?-3:0), eunuch: (f.cat==='eunuch'?-3:0) });
                if (Math.random() < 0.30) { death = true; }
                note = INTRIGUE_ECHO.tingzhang;
                break;
            case 'liufang':
                // 流放谪戍：逐出朝堂，党酋远窜，存命而绝党
                itModLoyalty(p.name, -15);
                exiled = true;
                if (cl) cl.power = Math.max(0, cl.power - 22);
                applyDecision({ stability: 2, prestige: 1, corruption: -1, civil: (f.cat==='civil'?-1:0) });
                note = INTRIGUE_ECHO.liufang;
                break;
            case 'bianzhe':
                // 贬谪削职：降秩留用，斩其气焰
                itModLoyalty(p.name, -12);
                demoted = true;
                if (cl) cl.power = Math.max(0, cl.power - 12);
                applyDecision({ stability: 1, corruption: -1, civil: (f.cat==='civil'?1:0) });
                note = INTRIGUE_ECHO.bianzhe;
                break;
            case 'qiaoda':
                // 敲打训诫：留中示警，暂不深究
                itModLoyalty(p.name, -6);
                itModLegacy(p.name, -2);
                if (cl) cl.power = Math.max(0, cl.power - 4);
                applyDecision({});
                note = '敲打训诫，暂存留用。机制演绎。';
                break;
            case 'huaizrou':
                // 怀柔羁縻：重赏拉拢，收为内应（隐忍，腐涨）
                itModLoyalty(p.name, 12);
                if (cl) cl.power = Math.max(0, cl.power - 6);
                applyDecision({ corruption: 1, treasury: -3000 });
                note = '厚结其心，收为天子耳目。机制演绎。';
                break;
            case 'zongrong':
                // 留中纵容：养痈待用，权柄所系——反爽游：纵则党势自大
                itModLoyalty(p.name, 8);
                if (cl) { cl.power = Math.min(INTRIGUE_CFG.POWER_CAP, cl.power + 10); cl.secrets = (cl.secrets||0) + 1; }
                applyDecision({ stability: -1, corruption: 1 });
                note = '留中不发，示以优容。此乃养虎之策，权柄可恃，隐患亦深。机制演绎。';
                break;
            default: return;
        }
        // 落地大臣状态
        if (death) { f.m.dead = true; pushNews('权谋', p.name + '毙于廷杖之下，朝野震骇。', 'critical'); }
        else if (exiled) { if (f.m) f.m.exiled = true; pushNews('权谋', p.name + '谪戍烟瘴，冠盖声销。', 'normal'); }
        else { pushNews('权谋', '陛下' + (choice === 'tingzhang' ? '廷杖' : choice === 'liufang' ? '流放' : choice === 'bianzhe' ? '贬' : '处置') + p.name + '，' + (cl ? '其党' + cl.name + '稍戢。' : '风波稍定。'), 'normal'); }
        // 记录回响 + 存档史鉴
        it.punishments.push({ name: p.name, method: choice, tick: itTick(), note: note });
        it.history.push({ time: '第' + (GameState.currentYear || 0) + '年', text: p.name + p.motive + '，陛下' + (choice==='tingzhang'?'震怒廷杖':choice==='liufang'?'流放谪戍':choice==='bianzhe'?'贬谪削职':choice==='qiaoda'?'敲打训诫':'留中纵容') + '。' + note });
        // 结案当前阴谋
        for (var s = 0; s < it.schemes.length; s++) {
            if (it.schemes[s].id === p.id) { it.schemes[s].resolved = true; break; }
        }
        // 若党魁被除，解散其党（树倒猢狲散）
        if ((death || exiled) && cl && it.leaderOf[cl.id] === p.name) {
            itDissolveClique(cl.id, '党魁' + p.name + '覆，其党星散');
        }
        return death;
    } catch (e) { return false; }
}

function intrigueResolveFeud(p, choice) {
    try {
        var it = ensureIntrigueState(); if (!it) return;
        var ca = it.cliques[p.a] || null;
        var cb = it.cliques[p.b] || null;
        var note = '';
        switch (choice) {
            case 'backA':
                if (ca) ca.power = Math.min(INTRIGUE_CFG.POWER_CAP, ca.power + 12);
                if (cb) cb.power = Math.max(0, cb.power - 8);
                applyDecision({ stability: -2, corruption: 1 });
                note = '庇护' + p.aName + '，其势益张。反爽游：偏袒有回响。';
                break;
            case 'backB':
                if (cb) cb.power = Math.min(INTRIGUE_CFG.POWER_CAP, cb.power + 12);
                if (ca) ca.power = Math.max(0, ca.power - 8);
                applyDecision({ stability: -2, corruption: 1 });
                note = '庇护' + p.bName + '，其势益张。';
                break;
            case 'mediate':
                if (ca) ca.power = Math.max(0, ca.power - 4);
                if (cb) cb.power = Math.max(0, cb.power - 4);
                applyDecision({ stability: 2, prestige: 1 });
                note = '两折其衷，各打五十，朝局稍安。';
                break;
            case 'banboth':
                if (ca) ca.power = Math.max(0, ca.power - 14);
                if (cb) cb.power = Math.max(0, cb.power - 14);
                applyDecision({ stability: -1, civil: -1, prestige: -1 });
                note = INTRIGUE_ECHO.tingzhang;
                break;
            default: return;
        }
        pushNews('权谋', p.aName + '与' + p.bName + '之倾轧，陛下' +
            (choice==='backA'?'偏' + p.aName : choice==='backB'?'偏' + p.bName : choice==='mediate'?'两折其衷':'各杖其魁') + '。', 'normal');
        it.history.push({ time: '第' + (GameState.currentYear || 0) + '年', text: p.aName + '与' + p.bName + '交攻，陛下裁决。' + note });
        // 倾轧多者，党耗交瘁
        var fid = p.id;
        if (it.feuds[fid]) { it.feuds[fid].flareCount = (it.feuds[fid].flareCount || 0) + 1; delete it.feuds[fid]; }
        return false;
    } catch (e) { return false; }
}

// 解散某党（玩家从权谋面板主动查办 / 党魁覆亡触发）
function itDissolveClique(cid, reason) {
    try {
        var it = ensureIntrigueState(); if (!it) return false;
        var cl = it.cliques[cid]; if (!cl) return false;
        var heirs = cl.members.slice();  // 防御性拷贝
        // 弹劾该党在任成员（贬其忠/派系）
        heirs.forEach(function(name){
            var f = itFindCatIdx(name);
            if (f) { itModLoyalty(name, -8); itModLegacy(name, -2); }
            var mc = it.memberClique[name]; if (mc) delete it.memberClique[name];
        });
        // 修派系（奸党覆灭 → 该派势挫/除非清流）
        if (cl.kind === 'jian') GameState.factions[cl.cat] = Math.max(0, Math.min(100, (GameState.factions[cl.cat] || 50) - 3));
        delete it.cliques[cid];
        if (it.leaderOf[cid]) delete it.leaderOf[cid];
        pushNews('权谋', cl.name + '解散：' + (reason || '朝廷查办，树倒猢狲散') + '。', 'normal');
        it.history.push({ time: '第' + (GameState.currentYear || 0) + '年', text: cl.name + '解散。' + (reason || '') });
        return true;
    } catch (e) { return false; }
}

// ==== 权谋面板（新增 tab 'intrigue'）====
function renderIntrigueTab() {
    try {
        var it = ensureIntrigueState(); if (!it) return '<div class="cw-note">权谋未起。任贤殿上，四海晏然。</div>';
        var parts = [];
        parts.push('<div class="cw-banner">「党争之祸，明室俱与其咎」——权谋·朝局暗流</div>');
        // 在党_stat
        var cliques = it.cliques;
        var cids = Object.keys(cliques);
        if (!cids.length) {
            parts.push('<div class="cw-note">朝中暂无成党。然野心暗伏，廉贪相半，陛下自省。</div>');
        } else {
            parts.push('<div class="cw-note" style="margin-bottom:6px">在党大臣 ' + Object.keys(it.memberClique).length + ' 人，' + cids.length + ' 党。</div>');
            cids.forEach(function(cid){
                var cl = cliques[cid];
                parts.push('<div class="cw-card"><div class="cw-card-title">' + cl.name +
                    '<span class="cw-tag">' + (cl.kind==='jian'?'奸党':'清流') + '</span>' +
                    '<span class="cw-tag">势 ' + Math.round(cl.power) + '</span></div>' +
                    '<div class="cw-card-sub">党魁：' + (it.leaderOf[cid] || '—') + ' · 派系：' + (INTRIGUE_CAT_LABEL[cl.cat] || cl.cat) + '</div>' +
                    '<div class="cw-card-sub">党羽：' + cl.members.join('、') + '</div>' +
                    (cl.rel ? '<div class="cw-card-sub cw-dim">史载旧谊：' + cl.rel.label + '</div>' : '') +
                    '<button class="cw-btn" onclick="intrigueDissolveFromUI(\'' + cid + '\')">查办解散</button></div>');
            });
        }
        // 未决阴谋
        var pendingS = it.schemes.filter(function(s){ return !s.found && !s.resolved; });
        if (pendingS.length) {
            parts.push('<div class="cw-note" style="margin:8px 0 4px">暗流（正在酝酿的阴谋，尚未败露）：</div>');
            pendingS.forEach(function(s){
                parts.push('<div class="cw-line">· ' + s.name + '：' + s.motive + '</div>');
            });
        }
        // 待裁决
        if (it.pending) {
            parts.push('<div class="cw-warn" style="margin:8px 0">⚠ 有事待陛下圣断：<button class="cw-btn" onclick="openIntrigueDecision()">开堂裁决</button></div>');
        }
        // 史鉴回响（廷杖/流放/贬谪记录）
        if (it.punishments.length) {
            parts.push('<div class="cw-note" style="margin:10px 0 4px">史鉴回响（处置实录）：</div>');
            it.punishments.slice(-6).reverse().forEach(function(pun){
                parts.push('<div class="cw-line cw-dim">· ' + pun.name + ' · ' +
                    (pun.method==='tingzhang'?'廷杖':pun.method==='liufang'?'流放':pun.method==='bianzhe'?'贬谪':'处置') + ' — ' + pun.note + '</div>');
            });
        }
        // 权谋大事录
        if (it.history.length) {
            parts.push('<div class="cw-note" style="margin:10px 0 4px">邸报·权谋大事：</div>');
            it.history.slice(-8).reverse().forEach(function(h){
                parts.push('<div class="cw-line">· <b>' + h.time + '</b> ' + h.text + '</div>');
            });
        }
        return parts.join('\n');
    } catch (e) { return '<div class="cw-note">权谋之局，隐约难察。</div>'; }
}

function intrigueDissolveFromUI(cid) {
    try {
        var it = ensureIntrigueState(); if (!it || !it.cliques[cid]) return;
        var cl = it.cliques[cid];
        var ok = itDissolveClique(cid, '陛下亲裁查办');
        if (ok) { pushNews('权谋', '解散' + cl.name + '，其党星散。', 'normal'); }
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab || 'intrigue');
        if (typeof updateUI === 'function') updateUI();
    } catch (e) {}
}
// 关闭权谋裁决浮层（暂缓，权谋记录在案待再裁）
function closeIntrigueModal() {
    try {
        var m = document.getElementById('intrigue-modal');
        if (m) m.classList.remove('active');
    } catch (e) {}
}
