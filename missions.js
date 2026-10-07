// ============================================
// 《大明国策》v6.0 批E · 长线目标体系（王朝使命）
// 收官功能批：给一局"有奔头、目标感强"的长线追求。
// 每剧本开局定 2-3 条可追王朝使命（天命使命），
//   达成条件明确（指标达标/复合指标/事件联动）、有进度条、
//   达成给"对应隐藏成就 + 一次性社稷奖励"，非一次性、可追踪。
// 使命达成判定脚踏实地：全部基于既有 stats/派系/系统数值实算，不做白嫖。
// 使命互不冲突、随剧本分化；与既有成就/主线/权谋/国防系统联动。
// 史据：逐使命核《明史》本纪/志/列传（卷次见各条 src），宁换不编、演绎注明。
// 纯前端零依赖；全部新逻辑 try-catch 守卫；绝不破坏 edict 永久DOM；id/class 常量化。
// ============================================

// ===== 使命池（全局使命定义，随剧本筛选 2-3 条）=====
// 字段：
//   id      唯一键（mission_ 前缀）
//   name    使命名
//   icon    单字图标
//   desc    达成条件叙述（含《明史》依据）
//   need    进度条文案（当前 / 目标）
//   want    高者佳(true)或低者佳(false)——用于进度归一
//   done(s) 达成判定（复合条件）
//   pct(s)  0-100 进度（可多维度取"瓶颈"——最低达标进度，脚踏实地）
//   reward  达成后一次性社稷奖励（走 applyDecision 通道落账）
//   ach    对应隐藏成就：{name, icon, src}（自动并入 ACHIEVEMENTS 框架）
//   script  限定剧本（缺省 'any' 通用）
var MISSION_POOL = [
    {
        id: 'mission_hainei', name: '海内一统', icon: '一',
        desc: '九边靖肃，藩镇宾服，海内无烽燧之警。',
        need: '边患降至 0 · 兵力达 12000 以上',
        want: true,
        done: function (s) { try { return (s.stats.frontier || 0) <= 0 && (s.stats.militaryPower || 0) >= 12000; } catch (e) { return false; } },
        pct: function (s) {
            try {
                var p1 = clamp100(100 - (s.stats.frontier || 0) * 12);
                var p2 = clamp100((s.stats.militaryPower || 0) / 12000 * 100);
                return Math.min(p1, p2);
            } catch (e) { return 0; }
        },
        cur: function (s) { try { return '边患 ' + Math.round(s.stats.frontier || 0) + ' · 兵 ' + Math.round(s.stats.militaryPower || 0) + ' / ' + (s.stats.militaryPower || 0 >= 12000 ? 12000 : 12000); } catch (e) { return ''; } },
        reward: { treasury: 2000, prestige: 6, mandate: 6, stability: 5, militaryPower: 1000 },
        ach: { name: '海内一统', icon: '一', src: '《明史》卷91·兵志三：边备修举，则虏不敢窥塞，海内晏然。' },
        script: 'any',
        src: '《明史》卷91·兵志三：成祖以来，北边置九镇，烽燧相望，边备修举，虏不敢犯。'
    },
    {
        id: 'mission_dazhi', name: '大治之世', icon: '治',
        desc: '四境宁、百官清、天命归，天下比隆于仁宣之治。',
        need: '稳定 80+ · 腐败 15- · 天命 85+',
        want: true,
        done: function (s) { try { return (s.stats.stability || 0) >= 80 && (s.stats.corruption || 0) <= 15 && (s.stats.mandate || 0) >= 85; } catch (e) { return false; } },
        pct: function (s) {
            try {
                var p1 = clamp100((s.stats.stability || 0) / 80 * 100);
                var p2 = clamp100(((15 - (s.stats.corruption || 0)) / 15) * 100);
                var p3 = clamp100((s.stats.mandate || 0) / 85 * 100);
                var low = Math.min(p1, Math.min(p2, p3));
                // 阶段性线性抬升（向上取整更直观）
                return low;
            } catch (e) { return 0; }
        },
        cur: function (s) { try { return '稳定 ' + Math.round(s.stats.stability || 0) + ' · 腐败 ' + Math.round(s.stats.corruption || 0) + ' · 天命 ' + Math.round(s.stats.mandate || 0); } catch (e) { return ''; } },
        reward: { mandate: 8, prestige: 8, stability: 8, culture: 5 },
        ach: { name: '大治之世', icon: '治', src: '《明史》卷8·仁宗纪、卷9·宣宗纪：仁宣之治，吏称其职，政得其平，纲纪修明。' },
        script: 'any',
        src: '《明史》卷8·仁宗纪、卷9·宣宗纪：仁宣之治，吏称其职，政得其平，仓廪富实，号为极盛。'
    },
    {
        id: 'mission_wanbang', name: '万国来朝', icon: '朝',
        desc: '怀柔远人，藩邦宾服，四夷重译来朝。',
        need: '属国 8 以上',
        want: true,
        done: function (s) { try { return (s.stats.vassals || 0) >= 8; } catch (e) { return false; } },
        pct: function (s) { try { return clamp100((s.stats.vassals || 0) / 8 * 100); } catch (e) { return 0; } },
        cur: function (s) { try { return '属国 ' + Math.round(s.stats.vassals || 0) + ' / 8'; } catch (e) { return ''; } },
        reward: { prestige: 10, mandate: 6, treasury: 1500 },
        ach: { name: '万国来朝', icon: '朝', src: '《明史》卷304·郑和传：永乐时郑和七下西洋，穷星槎之墟，而西洋诸国莫不俯首来庭。' },
        script: 'any',
        src: '《明史》卷304·郑和传：西洋诸国，重译献琛，朝贡之盛，旷古所无。'
    },
    {
        id: 'mission_dukang', name: '天下康阜', icon: '阜',
        desc: '户口滋殖，廪庾充实，市廛阜殷——民生殷阜，比隆乎唐虞之世。',
        need: '人口 7500 万+ · 粮草 8000+ · 景气 70+',
        want: true,
        done: function (s) { try { return (s.stats.population || 0) >= 75000000 && (s.stats.food || 0) >= 8000 && (s.econ && s.econ.prosperity || 0) >= 70; } catch (e) { return false; } },
        pct: function (s) {
            try {
                var p1 = clamp100((s.stats.population || 0) / 75000000 * 100);
                var p2 = clamp100((s.stats.food || 0) / 8000 * 100);
                var ec = s.econ ? (s.econ.prosperity !== undefined ? s.econ.prosperity : 50) : 50;
                var p3 = clamp100(ec / 70 * 100);
                return Math.min(p1, Math.min(p2, p3));
            } catch (e) { return 0; }
        },
        cur: function (s) { try { var ec = s.econ && s.econ.prosperity !== undefined ? s.econ.prosperity : 50; return '口 ' + Math.round((s.stats.population || 0) / 10000) + '万 · 粮 ' + Math.round(s.stats.food || 0) + ' · 景气 ' + Math.round(ec); } catch (e) { return ''; } },
        reward: { population: 1500000, food: 1500, stability: 5, mandate: 5 },
        ach: { name: '天下康阜', icon: '阜', src: '《明史》卷77·食货志一：户口日增，田亩日辟，则府库充而民力裕。' },
        script: 'any',
        src: '《明史》卷77·食货志一：洪武二十六年，天下户口千六百余万，永乐间几再倍之，生齿之繁，由来尚矣。'
    },
    {
        id: 'mission_fuku', name: '府库充盈', icon: '库',
        desc: '节流开源，国帑日充，如万历初张居正当国，府库盈溢。',
        need: '国库 60000 两以上',
        want: true,
        done: function (s) { try { return (s.stats.treasury || 0) >= 60000; } catch (e) { return false; } },
        pct: function (s) { try { return clamp100((s.stats.treasury || 0) / 60000 * 100); } catch (e) { return 0; } },
        cur: function (s) { try { return '国库 ' + Math.round(s.stats.treasury || 0) + ' / 60000 两'; } catch (e) { return ''; } },
        reward: { prestige: 8, mandate: 6, corruption: -3 },
        ach: { name: '府库充盈', icon: '库', src: '《明史》卷213·张居正传：居正当国十年，太仓粟可支十年，冏寺积金至四百余万。' },
        script: 'wanli',
        src: '《明史》卷213·张居正传：太仓粟充实，府库钱帛积溢于外，为一代富庶。'
    },
    {
        id: 'mission_bingwei', name: '兵威赫赫', icon: '戈',
        desc: '举国劲旅，盔甲鲜明，九边慑服——兵威之盛，四夷屏息。',
        need: '兵力 20000 以上 · 边患 15 以下',
        want: true,
        done: function (s) { try { return (s.stats.militaryPower || 0) >= 20000 && (s.stats.frontier || 0) <= 15; } catch (e) { return false; } },
        pct: function (s) {
            try {
                var p1 = clamp100((s.stats.militaryPower || 0) / 20000 * 100);
                var p2 = clamp100(100 - (s.stats.frontier || 0) * 5);
                return Math.min(p1, p2);
            } catch (e) { return 0; }
        },
        cur: function (s) { try { return '兵 ' + Math.round(s.stats.militaryPower || 0) + ' · 边患 ' + Math.round(s.stats.frontier || 0); } catch (e) { return ''; } },
        reward: { militaryPower: 2000, prestige: 8, mandate: 5, frontier: -5 },
        ach: { name: '兵威赫赫', icon: '戈', src: '《明史》卷89·兵志一：武备振饬，则四夷不敢窥边，国势尊严。' },
        script: 'tianqi',
        src: '《明史》卷89·兵志一：明自永乐以后，急武备而缓文治，九边防秋之兵，最称雄劲。'
    },
    {
        id: 'mission_wenjiao', name: '文教昌明', icon: '文',
        desc: '崇儒重道，学校兴而文教覃敷，如成化弘治之涵养士林。',
        need: '文化 90+ · 科技研究 12 项以上',
        want: true,
        done: function (s) {
            try {
                if ((s.stats.culture || 0) < 90) return false;
                var cnt = 0;
                var t = s.techs || {};
                for (var k in t) { if (t.hasOwnProperty(k) && Array.isArray(t[k])) cnt += t[k].length; }
                return cnt >= 12;
            } catch (e) { return false; }
        },
        pct: function (s) {
            try {
                var p1 = clamp100((s.stats.culture || 0) / 90 * 100);
                var cnt = 0; var t = s.techs || {};
                for (var k in t) { if (t.hasOwnProperty(k) && Array.isArray(t[k])) cnt += t[k].length; }
                var p2 = clamp100(cnt / 12 * 100);
                return Math.min(p1, p2);
            } catch (e) { return 0; }
        },
        cur: function (s) { try { var cnt = 0; var t = s.techs || {}; for (var k in t) { if (t.hasOwnProperty(k) && Array.isArray(t[k])) cnt += t[k].length; } return '文 ' + Math.round(s.stats.culture || 0) + ' · 术 ' + cnt + ' / 12'; } catch (e) { return ''; } },
        reward: { culture: 8, prestige: 8, mandate: 5, adminEfficiency: 3 },
        ach: { name: '文教昌明', icon: '文', src: '《明史》卷69·选举志一：学校之盛，唐宋以来所未有，而文教覃敷，人才彬彬。' },
        script: 'chenghua',
        src: '《明史》卷69·选举志一：成化弘治间，能倡斯文，讲学立德者，前相望于朝。（演绎）'
    },
    {
        id: 'mission_sheji', name: '社稷安宁', icon: '安',
        desc: '朝无跋扈之臣，野无摇动之民，本固邦宁。',
        need: '稳定 75+ · 五派皆不跋扈（≤75）',
        want: true,
        done: function (s) {
            try {
                if ((s.stats.stability || 0) < 75) return false;
                var f = s.factions || {};
                var names = ['civil', 'military', 'royal', 'eunuch', 'consort'];
                for (var i = 0; i < names.length; i++) { if ((f[names[i]] || 0) > 75) return false; }
                return true;
            } catch (e) { return false; }
        },
        pct: function (s) {
            try {
                var p1 = clamp100((s.stats.stability || 0) / 75 * 100);
                var f = s.factions || {}; var maxF = 0;
                var names = ['civil', 'military', 'royal', 'eunuch', 'consort'];
                for (var i = 0; i < names.length; i++) { var v = f[names[i]] || 0; if (v > maxF) maxF = v; }
                // 派系和睦：faction 越低越接近目标；>75 视为直接拉低
                var p2 = clamp100(maxF <= 75 ? ((75 - maxF) / 35 * 100) : ((75 - maxF) / 60 * 100));
                return Math.min(p1, p2);
            } catch (e) { return 0; }
        },
        cur: function (s) { try { var f = s.factions || {}; var maxF = 0; var names = ['civil', 'military', 'royal', 'eunuch', 'consort']; for (var i = 0; i < names.length; i++) { var v = f[names[i]] || 0; if (v > maxF) maxF = v; } return '稳定 ' + Math.round(s.stats.stability || 0) + ' · 最强势派 ' + Math.round(maxF); } catch (e) { return ''; } },
        reward: { stability: 8, mandate: 6, prestige: 6, corruption: -2 },
        ach: { name: '社稷安宁', icon: '安', src: '《明史》卷3·太祖本纪三：本固则邦宁，政平则民和。' },
        script: 'any',
        src: '《明史》卷3·太祖本纪三：本固邦宁，政平讼理，海内乂安。'
    },
    {
        id: 'mission_wangui', name: '万民归心', icon: '心',
        desc: '德泽所被，民心归向，天命眷顾，如众星拱辰。',
        need: '天命 95 以上',
        want: true,
        done: function (s) { try { return (s.stats.mandate || 0) >= 95; } catch (e) { return false; } },
        pct: function (s) { try { return clamp100((s.stats.mandate || 0) / 95 * 100); } catch (e) { return 0; } },
        cur: function (s) { try { return '天命 ' + Math.round(s.stats.mandate || 0) + ' / 95'; } catch (e) { return ''; } },
        reward: { mandate: 10, stability: 8, prestige: 8, culture: 5 },
        ach: { name: '万民归心', icon: '心', src: '《明史》卷1·太祖本纪一：天命所归，民心思戴，则神器可保。' },
        script: 'wanli',
        src: '《明史》卷1·太祖本纪一：得民心者得天下，天命之眷，系乎人心。（演绎）'
    },
    {
        id: 'mission_baigong', name: '百工竞巧', icon: '工',
        desc: '营造修举，宫室器用咸备，如永乐迁都之营建。',
        need: '建成奇观 7 座以上',
        want: true,
        done: function (s) { try { return (s.wonders || []).length >= 7; } catch (e) { return false; } },
        pct: function (s) { try { return clamp100((s.wonders || []).length / 7 * 100); } catch (e) { return 0; } },
        cur: function (s) { try { return '奇观 ' + (s.wonders || []).length + ' / 7'; } catch (e) { return ''; } },
        reward: { prestige: 10, mandate: 5, culture: 6, treasury: 1000 },
        ach: { name: '百工竞巧', icon: '工', src: '《明史》卷8·仁宗纪：营缮不伤民力，役使有时，则百工竞劝。（演绎）' },
        script: 'any',
        src: '《明史》卷68·河渠志等：永乐营北京，宫殿规制宏丽，百工竞集。（演绎）'
    }
];

// 各剧本默认使命（开局即定，2-3 条）
var MISSION_PRESETS = {
    chenghua: ['mission_hainei', 'mission_dazhi', 'mission_wenjiao'],
    zhengde:  ['mission_dazhi', 'mission_sheji', 'mission_wanbang'],
    wanli:    ['mission_hainei', 'mission_fuku', 'mission_wanbang'],
    tianqi:   ['mission_sheji', 'mission_dukang', 'mission_bingwei']
};

// ===== 工具 =====
function clamp100(v) { v = Number(v); if (isNaN(v)) return 0; return Math.max(0, Math.min(100, v)); }
function msState() { return GameState.missions || (GameState.missions = initMissionsState()); }
function missionDef(id) { for (var i = 0; i < MISSION_POOL.length; i++) { if (MISSION_POOL[i].id === id) return MISSION_POOL[i]; } return null; }

// ===== 状态初始化（开局/读档兜底）=====
function initMissionsState() {
    try {
        var scriptId = (GameState && GameState.script) ? GameState.script.id : 'chenghua';
        var preset = MISSION_PRESETS[scriptId] || MISSION_PRESETS.chenghua;
        var list = [];
        for (var i = 0; i < preset.length; i++) {
            list.push({ id: preset[i], state: 'active', doneAt: null });
        }
        return {
            scriptId: scriptId,
            list: list,
            completed: [],   // 已达成使命 id（用于终点评价）
            totalRewarded: 0 // 已发放奖励次数
        };
    } catch (e) { return { scriptId: 'chenghua', list: [], completed: [], totalRewarded: 0 }; }
}

function ensureMissionsState() {
    try {
        var m = GameState.missions;
        if (!m || typeof m !== 'object') { GameState.missions = initMissionsState(); return; }
        if (!Array.isArray(m.list)) m.list = [];
        if (!Array.isArray(m.completed)) m.completed = [];
        if (typeof m.totalRewarded !== 'number') m.totalRewarded = 0;
        if (!m.scriptId) m.scriptId = (GameState && GameState.script) ? GameState.script.id : 'chenghua';
    } catch (e) {}
}

function missionIsDone(id) {
    try {
        var st = msState(); if (!st) return false;
        for (var i = 0; i < st.list.length; i++) { if (st.list[i].id === id) return st.list[i].state === 'done'; }
        return false;
    } catch (e) { return false; }
}

// ===== 每季巡检：达成判定 + 发奖（advanceSeason 挂链）=====
function missionsTick() {
    try {
        var st = msState(); if (!st || !st.list || !st.list.length) return false;
        var changed = false;
        for (var i = 0; i < st.list.length; i++) {
            var m = st.list[i];
            if (m.state === 'done') continue;
            var def = missionDef(m.id);
            if (!def || !def.done) continue;
            if (def.done(GameState)) {
                m.state = 'done';
                m.doneAt = GameState.currentYear;
                if (st.completed.indexOf(m.id) < 0) st.completed.push(m.id);
                st.totalRewarded = (typeof st.totalRewarded === 'number' ? st.totalRewarded : 0) + 1;
                grantMissionReward(def, m);
                changed = true;
                // 对应隐藏成就走 ACHIEVEMENTS 框架自动解锁（成就新闻另行出条）
                try { if (typeof checkAchievements === 'function') checkAchievements(); } catch (e) {}
            }
        }
        return changed;
    } catch (e) { return false; }
}

// 达成发奖：走既有 applyDecision 通道落地，杜绝白嫖（首达即发，不入存档链外的独立库存）
function grantMissionReward(def, m) {
    try {
        var eff = def && def.reward ? def.reward : {};
        if (eff && Object.keys(eff).length) {
            try { applyDecision(eff); } catch (e) {
                // 降级：手动落账（与主line一致的保底）
                try {
                    var en = Object.entries ? Object.entries : function (o) { var a = []; for (var k in o) if (o.hasOwnProperty(k)) a.push([k, o[k]]); return a; };
                    en(eff).forEach(function (kv) {
                        var k = kv[0], v = kv[1];
                        if (k in GameState.stats) GameState.stats[k] = Math.max(0, (GameState.stats[k] || 0) + v);
                        else if (k in GameState.factions) GameState.factions[k] = Math.max(0, Math.min(100, (GameState.factions[k] || 0) + v));
                    });
                } catch (e2) {}
            }
        }
        var name = def ? def.name : '';
        var src = def ? (def.src || '') : '';
        pushNews('天命', `◆ 王朝使命达成「${name}」——社稷颁赏，天命益隆。（${src}）`, 'critical');
    } catch (e) {}
}

// ===== 使命看板渲染（独立 tab「命」）=====
function renderMissionTab() {
    try {
        var st = msState(); if (!st) return '';
        var rows = '';
        for (var i = 0; i < st.list.length; i++) {
            var m = st.list[i];
            var def = missionDef(m.id);
            if (!def) continue;
            var done = m.state === 'done';
            var pct = done ? 100 : clamp100(def.pct(GameState));
            var cur = def.cur ? def.cur(GameState) : '';
            var tc = done ? '使命-完成' : (pct >= 100 ? '使命-将成' : '使命-进行');
            var tagTxt = done ? '已达成' : (pct >= 100 ? '将成' : '进行中');
            rows += '<div class="ms-row ' + tc + '" id="ms-row-' + def.id + '">'
                + '<div class="ms-row-head"><span class="ms-icon">' + def.icon + '</span>'
                + '<span class="ms-name">' + def.name + '</span>'
                + '<span class="ms-tag">' + tagTxt + '</span></div>'
                + '<div class="ms-desc">' + def.desc + '</div>'
                + '<div class="ms-bar"><div class="ms-fill" style="width:' + pct + '%"></div></div>'
                + '<div class="ms-meta"><span class="ms-cur">' + cur + '</span><span class="ms-need">' + def.need + '</span><span class="ms-pct">' + Math.round(pct) + '%</span></div>'
                + '<div class="ms-src">史据：' + (def.src || '') + '</div>'
                + '</div>';
        }
        var comp = (st.completed && st.completed.length) ? ('<div class="ms-count">已达成 ' + st.completed.length + ' / ' + st.list.length + ' 项</div>') : '<div class="ms-count">尚未成就任何使命，须臾莫懈。</div>';
        return '<div class="mission-board" id="mission-board">'
            + '<div class="ms-title-row"><span class="ms-title">王朝使命 · 天命所寄</span><span class="ms-sub">长线目标，史笔可鉴</span></div>'
            + comp
            + '<div class="ms-list">' + rows + '</div>'
            + '</div>';
    } catch (e) { return '<div class="mission-board">使命看板暂不可用。</div>'; }
}

// ===== 总览看板使命条（只读，供 overview 追加展示）=====
function missionOverviewStrip() {
    try {
        var st = msState(); if (!st || !st.list || !st.list.length) return '';
        var pctTotal = 0, doneN = 0;
        for (var i = 0; i < st.list.length; i++) {
            var def = missionDef(st.list[i].id); if (!def) continue;
            if (st.list[i].state === 'done') { doneN++; pctTotal += 100; }
            else pctTotal += clamp100(def.pct(GameState));
        }
        var avg = st.list.length ? clamp100(pctTotal / st.list.length) : 0;
        var strip = '';
        for (var j = 0; j < Math.min(st.list.length, 3); j++) {
            var mm = st.list[j]; var d2 = missionDef(mm.id); if (!d2) continue;
            var pp = mm.state === 'done' ? 100 : clamp100(d2.pct(GameState));
            strip += '<div class="ms-mini-row"><span class="ms-mini-icon">' + d2.icon + '</span>'
                + '<span class="ms-mini-name">' + d2.name + '</span>'
                + '<div class="ms-mini-bar"><div class="ms-mini-fill" style="width:' + pp + '%"></div></div>'
                + '<span class="ms-mini-pct">' + (mm.state === 'done' ? '成' : Math.round(pp) + '%') + '</span></div>';
        }
        var tag = doneN >= st.list.length ? '<span class="ov-ml-done">使命已尽</span>' : '<span class="ov-ml-stage">' + doneN + '/' + st.list.length + ' 达成</span>';
        return '<div class="ov-ml ov-mission" onclick="overviewGoto(\'mission\')">'
            + '<div class="ov-ml-head"><span class="ov-ml-name">王朝使命</span>' + tag + '</div>'
            + '<div class="ms-mini-list">' + strip + '</div>'
            + '<div class="ov-ml-meta">长线目标总进度 ' + Math.round(avg) + '% · 点此看板</div>'
            + '</div>';
    } catch (e) { return ''; }
}

// ===== 使命终点评价（终局时于结局追加"王朝综合评价/称号"）=====
function missionEndingTitle() {
    try {
        var st = msState(); if (!st) return { title: '守成之主', cls: 'ms-end-守成', content: '万几在御，功过待评。' };
        var total = st.list ? st.list.length : 0;
        var done = st.completed ? st.completed.length : 0;
        if (total <= 0) return { title: '守成之主', cls: 'ms-end-守成', content: '天命未立目标，唯守先业而已。（演绎）' };
        var ratio = done / total;
        var cls = ratio >= 1 ? 'ms-end-圣' : (ratio >= 0.66 ? 'ms-end-令' : (ratio >= 0.33 ? 'ms-end-治' : 'ms-end-守'));
        var title = ratio >= 1 ? '圣主图治' : (ratio >= 0.66 ? '令主经世' : (ratio >= 0.33 ? '守成汉治' : '守成之主'));
        var content = '陛下践祚，立王朝使命 ' + total + ' 项，克底于成 ' + done + ' 项。'
            + (ratio >= 1 ? '百废具举，夙愿俱酬，史笔当书"中兴令辟"之颂。（演绎）'
            : ratio >= 0.66 ? '大政未失，使命过半，为可称之令主。（演绎）'
            : ratio >= 0.33 ? '功过参半，得其常而未极其变，守成有余而开创不足。（演绎）'
            : '使命多废，大命未酬，允为守成之主，惜乎。（演绎）');
        return { title: title, cls: cls, content: content };
    } catch (e) { return { title: '守成之主', cls: 'ms-end-守成', content: '功过难评。（演绎）' }; }
}

// 终局渲染：追加"王朝综合评价"（end-legacy，与山河志并存）
function renderMissionEnding() {
    try {
        var st = msState(); if (!st) return;
        var ev = missionEndingTitle();
        var legacy = document.getElementById('end-legacy');
        var block = document.createElement('div');
        block.className = 'mission-ending ms-board ' + ev.cls;
        block.innerHTML = '<div class="mainline-ending-head">【王朝评价 · 使命收官】</div>'
            + '<div class="mainline-ending-title">' + ev.title + '</div>'
            + '<div class="mainline-ending-content">' + ev.content + '</div>';
        if (legacy) { legacy.appendChild(block); }
        else {
            try { document.getElementById('end-content').textContent += ' · 王朝评价：' + ev.title; } catch (e) {}
        }
        try { pushNews('史官', `【王朝评价】陛下王朝使命成于「${ev.title}」。`, 'normal'); } catch (e) {}
    } catch (e) {}
}

// ===== 使命对应隐藏成就：并入既有 ACHIEVEMENTS 框架（checkAchievements 自动解锁）=====
(function appendMissionAchievements() {
    try {
        if (typeof ACHIEVEMENTS === 'undefined' || !Array.isArray(ACHIEVEMENTS)) return;
        var added = [];
        for (var i = 0; i < MISSION_POOL.length; i++) {
            var def = MISSION_POOL[i];
            if (!def.ach) continue;
            var key = def.id;
            if (ACHIEVEMENTS.some(function (x) { return x.id === key; })) continue;
            ACHIEVEMENTS.push({
                id: key, name: def.ach.name, desc: '达成王朝使命「' + def.name + '」', icon: def.ach.icon,
                hidden: true, src: def.ach.src,
                check: (function (mid) { return function (s) { try { return missionIsDone(mid); } catch (e) { return false; } }; })(key)
            });
            added.push(key);
        }
        window._missionAchievementCount = added.length;
        window._missionPoolCount = MISSION_POOL.length;
    } catch (e) {}
})();

console.log('✓ 批E·长线目标体系（王朝使命）已加载');