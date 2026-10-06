// ============================================
// 《大明国策》v2.0 核心引擎
// 60+ 系统 × 20+ 形态
// ============================================

// ====== 存档系统（修刷新bug）======
const SAVE_KEY = 'daming_guoce_save_v2';
const AUTOSAVE_INTERVAL = 4;  // 每4季自动存档

function saveGame() {
    try {
        const saveData = {
            script: GameState.script?.id,
            currentYear: GameState.currentYear,
            currentSeason: GameState.currentSeason,
            currentMonth: GameState.currentMonth,
            stats: GameState.stats,
            factions: GameState.factions,
            news: GameState.news.slice(0, 30),
            history: GameState.history,
            stabilityLevel: GameState.stabilityLevel,
            treasuryDebt: GameState.treasuryDebt,
            decisionsCount: GameState.decisionsCount,
            omen: GameState.omen,
            // v2 新增
            ministers: GameState.ministers,
            harem: GameState.harem,
            military: GameState.military,
            policies: GameState.policies,
            techs: GameState.techs,
            wonders: GameState.wonders,
            nations: GameState.nations,
            currentTab: GameState.currentTab,
            impeachmentQueue: GameState.impeachmentQueue,
            // 批1：岁末大计锚点（旧档缺失时 loadGame 兜底）
            factionsYearStart: GameState.factionsYearStart,
            stabilityLevelYearStart: GameState.stabilityLevelYearStart,
            stabilityYearStart: GameState.stabilityYearStart,
            yearLedger: GameState.yearLedger,
            // 批2：舆图状态 + 召见限频（旧档缺失时 loadGame 兜底初始化）
            mapData: GameState.mapData,
            talkData: GameState.talkState,
            // 批3：厂卫/内帑状态随存档链持久化
            cangwei: GameState.cangwei,
            // 批4：早朝/后宫外交/科举/营造
            courtState: GameState.courtState,
            haremInteract: GameState.haremInteract,
            diploInteract: GameState.diploInteract,
            kejuState: GameState.kejuState,
            yingzaoState: GameState.yingzaoState,
            // 批5：纵深扩展（御笔批朱/军事操练/灾异应对/礼制大典/自动理政）
            junpi: GameState.junpi,
            milOps: GameState.milOps,
            zaiyi: GameState.zaiyi,
            lizhi: GameState.lizhi,
            autoMode: GameState.autoMode,
            // 批A：经济深改（物价/常平/开中/市舶/贪腐侵蚀/景气）
            econ: GameState.econ,
            // 批B：主线叙事（山河志）
            mainline: GameState.mainline,
            // 批B(v6.0·内政深挖)：新政状态随存档链持久化
            govern: GameState.govern,
            // 批C：战棋/回合制战场状态随存档链持久化
            battlefield: GameState.battlefield,
            // v6.0 批C：军事战守扩充状态随存档链持久化
            warDef: GameState.warDef,
            intrigue: GameState.intrigue, // 批D：权谋（结党/倾轧/阴谋/廷杖流放）
            // 批E：长线目标体系（王朝使命）随存档链持久化
            missions: GameState.missions,
            // 批F：军事科技树（三线研造/战法/冷却）随存档链持久化
            milTech: GameState.milTech,
            timestamp: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (e) {
        console.error('存档失败', e);
        return false;
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const save = JSON.parse(raw);
        
        // 验证有效期
        if (Date.now() - save.timestamp > 7 * 24 * 3600 * 1000) {
            localStorage.removeItem(SAVE_KEY);
            return false;
        }
        
        // 恢复剧本
        const script = SCRIPTS.find(s => s.id === save.script);
        if (!script) return false;
        GameState.script = script;
        GameState.currentYear = save.currentYear || 0;
        GameState.currentSeason = save.currentSeason || 0;
        GameState.currentMonth = save.currentMonth || 0;
        GameState.stats = save.stats || { ...script.startStats };
        GameState.factions = save.factions || {};
        GameState.news = save.news || [];
        GameState.history = save.history || [];
        GameState.stabilityLevel = save.stabilityLevel || 2;
        GameState.treasuryDebt = save.treasuryDebt || 0;
        GameState.decisionsCount = save.decisionsCount || 0;
        GameState.omen = save.omen || { eclipse: false, comet: false, mandateLow: false };
        GameState.ministers = save.ministers || deepCopy(MINISTERS);
        GameState.harem = save.harem || deepCopy(HAREM);
        GameState.military = save.military || deepCopy(MILITARY_MAP);
        GameState.policies = save.policies || initPolicies();
        GameState.techs = save.techs || initTechs();
        GameState.wonders = save.wonders || [];
        GameState.nations = save.nations || deepCopy(FOREIGN_NATIONS);
        GameState.currentTab = save.currentTab || 'overview';
        GameState.impeachmentQueue = save.impeachmentQueue || [];
        // 批1：岁末大计锚点（旧档缺失时以当前值兜底）
        GameState.factionsYearStart = save.factionsYearStart || deepCopy(GameState.factions);
        GameState.stabilityLevelYearStart = (save.stabilityLevelYearStart !== undefined)
            ? save.stabilityLevelYearStart : GameState.stabilityLevel;
        GameState.stabilityYearStart = (save.stabilityYearStart !== undefined)
            ? save.stabilityYearStart : GameState.stats.stability;
        GameState.yearLedger = save.yearLedger || { income: {}, expense: {} };
        // 批2：舆图状态 + 召见限频（旧档缺失时按当前剧本初始化；限频key走存档链）
        GameState.mapData = save.mapData || initMapState(GameState.script ? GameState.script.id : 'chenghua');
        GameState.talkState = save.talkData || initTalkState();
        // 批3：厂卫/内帑状态随存档链恢复（旧档缺失时兜底补默认；限频key一并恢复）
        if (save.cangwei) GameState.cangwei = save.cangwei;
        if (typeof ensureCangweiState === 'function') { try { ensureCangweiState(); } catch (e) {} }
        // 批4：早朝/后宫外交/科举/营造（旧档缺失兜底补默认）
        GameState.courtState = save.courtState || ((typeof initCourtState === 'function') ? initCourtState() : {});
        GameState.haremInteract = save.haremInteract || ((typeof initHaremInteractState === 'function') ? initHaremInteractState() : {});
        GameState.diploInteract = save.diploInteract || ((typeof initDiploInteractState === 'function') ? initDiploInteractState() : {});
        GameState.kejuState = save.kejuState || ((typeof initKejuState === 'function') ? initKejuState() : {});
        GameState.yingzaoState = save.yingzaoState || ((typeof initYingzaoState === 'function') ? initYingzaoState() : {});
        // 批5：纵深扩展（旧档缺失兜底补默认；限频key一并走存档链）
        GameState.junpi = save.junpi || ((typeof initJunpiState === 'function') ? initJunpiState() : {});
        GameState.milOps = save.milOps || ((typeof initMilOpsState === 'function') ? initMilOpsState() : {});
        GameState.zaiyi = save.zaiyi || ((typeof initZaiyiState === 'function') ? initZaiyiState() : {});
        GameState.lizhi = save.lizhi || ((typeof initLizhiState === 'function') ? initLizhiState() : {});
        GameState.autoMode = save.autoMode || ((typeof initAutoModeState === 'function') ? initAutoModeState() : {});
        // 批A：经济深改（旧档缺失兜底按当前剧本物价初始化）
        GameState.econ = save.econ || ((typeof initEconomyState === 'function') ? initEconomyState() : {});
        // 批B：主线叙事（旧档缺失兜底初始化）
        GameState.mainline = save.mainline || ((typeof initMainline === 'function') ? initMainline() : {});
        // 批B(v6.0·内政深挖)：新政状态（旧档缺失兜底补默认）
        GameState.govern = save.govern || ((typeof initGovernState === 'function') ? initGovernState() : {});
        if (typeof ensureGovernState === 'function') { try { ensureGovernState(); } catch (e) {} }
        // 批C：战场状态（旧档缺失兜底补默认；仅当存档无battlefield时补默认）
        if (save.battlefield) {
            GameState.battlefield = save.battlefield;
        } else if (typeof initBattlefieldState === 'function') {
            GameState.battlefield = initBattlefieldState();
        }
        // NOTE: 不在 loadGame 里无参调用 bfAbandonIfIdle（会把刚读回的进行中战斗硬弃）
        // 过季弃战由 checkExpeditionArrival/initGame 按 mode 精准兜底
        if (typeof bfEnsure === 'function') { try { bfEnsure(); } catch (e) {} }
        // v6.0 批C：军事战守状态（旧档缺失兜底补默认）
        GameState.warDef = save.warDef || ((typeof initWarDefState === 'function') ? initWarDefState() : {});
        // 批D：权谋状态兜底（旧档缺失时 init 兜底）
        GameState.intrigue = save.intrigue || ((typeof initIntrigueState === 'function') ? initIntrigueState() : {});
        if (typeof ensureIntrigueState === 'function') ensureIntrigueState();
        if (typeof ensureWarDefState === 'function') { try { ensureWarDefState(); } catch (e) {} }
        // 批E：长线目标体系（王朝使命）兜底（旧档缺失按当前剧本初始化）
        GameState.missions = save.missions || ((typeof initMissionsState === 'function') ? initMissionsState() : {});
        if (typeof ensureMissionsState === 'function') { try { ensureMissionsState(); } catch (e) {} }
        // 批F：军事科技树兜底（旧档缺失补默认）
        GameState.milTech = save.milTech || ((typeof initMilTechState === 'function') ? initMilTechState() : {});
        if (typeof ensureMilTechState === 'function') { try { ensureMilTechState(); } catch (e) {} }
        if (typeof mtAppendTactics === 'function') { try { mtAppendTactics(); } catch (e) {} }
        GameState.yearNews = [];
        GameState.yearEndPending = false;
        GameState.gameOver = false;
        
        return true;
    } catch (e) {
        console.error('读档失败', e);
        return false;
    }
}

function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function initPolicies() {
    const p = {};
    POLICIES.forEach(policy => {
        p[policy.name] = policy.states[0];
    });
    return p;
}

function initTechs() {
    const t = {};
    Object.keys(TECH_TREE).forEach(cat => {
        t[cat] = [];
    });
    return t;
}

// ====== 游戏状态 ======
const GameState = {
    script: null,
    currentYear: 0,
    currentSeason: 0,
    currentMonth: 0,
    stats: {},
    factions: {},
    news: [],
    history: [],
    stabilityLevel: 0,
    treasuryDebt: 0,
    decisionsCount: 0,
    gameOver: false,
    omen: { eclipse: false, comet: false, mandateLow: false },
    // v2 新增状态
    ministers: {},
    harem: {},
    military: {},
    policies: {},
    techs: {},
    wonders: [],
    nations: {},
    currentTab: 'overview',
    impeachmentQueue: []
};

// ====== 初始化 ======
function initGame(scriptId) {
    const script = SCRIPTS.find(s => s.id === scriptId);
    if (!script) return;
    
    GameState.script = script;
    GameState.currentYear = 0;
    GameState.currentSeason = 0;
    GameState.currentMonth = 0;
    GameState.stats = { ...script.startStats };
    GameState.factions = {
        civil: 60, military: 60, royal: 50, eunuch: 50, consort: 55
    };
    GameState.news = [];
    GameState.history = [];
    GameState.stabilityLevel = 2;
    GameState.treasuryDebt = 0;
    GameState.decisionsCount = 0;
    GameState.gameOver = false;
    GameState.omen = { eclipse: false, comet: false, mandateLow: false };
    
    // v2 初始化
    GameState.ministers = deepCopy(MINISTERS);
    GameState.harem = deepCopy(HAREM);
    GameState.military = deepCopy(MILITARY_MAP);
    GameState.policies = initPolicies();
    GameState.techs = initTechs();
    GameState.wonders = [];
    GameState.nations = deepCopy(FOREIGN_NATIONS);
    GameState.currentTab = 'overview';
    GameState.impeachmentQueue = [];
    // 批1：岁末大计锚点初始化
    GameState.factionsYearStart = deepCopy(GameState.factions);
    GameState.stabilityLevelYearStart = GameState.stabilityLevel;
    GameState.stabilityYearStart = GameState.stats.stability;
    GameState.yearLedger = { income: {}, expense: {} };
    GameState.yearNews = [];
    GameState.yearEndPending = false;
    // 批2：舆图状态（含剧本开局差异）+ 召见限频初始化
    try {
        GameState.mapData = initMapState(script.id);
        GameState.talkState = initTalkState();
        // 批3：厂卫/内帑初始化 + 待发事件队列清空
        if (typeof initCangweiState === 'function') { GameState.cangwei = initCangweiState(); GameState.pendingEvent = null; }
        // 批4：早朝/后宫外交/科举/营造初始化
        if (typeof initCourtState === 'function') GameState.courtState = initCourtState();
        if (typeof initHaremInteractState === 'function') GameState.haremInteract = initHaremInteractState();
        if (typeof initDiploInteractState === 'function') GameState.diploInteract = initDiploInteractState();
        if (typeof initKejuState === 'function') GameState.kejuState = initKejuState();
        if (typeof initYingzaoState === 'function') GameState.yingzaoState = initYingzaoState();
        // 批5：纵深扩展初始化
        if (typeof initJunpiState === 'function') GameState.junpi = initJunpiState();
        if (typeof initMilOpsState === 'function') GameState.milOps = initMilOpsState();
        if (typeof initZaiyiState === 'function') GameState.zaiyi = initZaiyiState();
        if (typeof initLizhiState === 'function') GameState.lizhi = initLizhiState();
        if (typeof initAutoModeState === 'function') GameState.autoMode = initAutoModeState();
        // 批A：经济深改（物价/景气/常平/开中/市舶）
        if (typeof initEconomyState === 'function') GameState.econ = initEconomyState();
        // 批B：主线叙事（山河志）
        if (typeof initMainline === 'function') GameState.mainline = initMainline();
        // 批B(v6.0·内政深挖)：新政状态初始化
        if (typeof initGovernState === 'function') GameState.govern = initGovernState();
        // 批C：战场状态兜底初始化（开局无战事）
        GameState.battlefield = (typeof initBattlefieldState === 'function') ? initBattlefieldState() : {};
        // v6.0 批C：军事战守状态初始化
        if (typeof initWarDefState === 'function') GameState.warDef = initWarDefState();
        // v6.0 批D：权谋状态初始化（结党/倾轧/阴谋/廷杖流放记录）
        if (typeof initIntrigueState === 'function') GameState.intrigue = initIntrigueState();
        // v6.0 批E：长线目标（王朝使命）初始化
        if (typeof initMissionsState === 'function') GameState.missions = initMissionsState();
        // 批F：军事科技树初始化
        if (typeof initMilTechState === 'function') GameState.milTech = initMilTechState();
    } catch (e) {}

    document.getElementById('script-modal').classList.remove('active');
    document.getElementById('end-modal').classList.remove('active');
    
    pushNews(`登基之年`, `大明肇兴，陛下承大统于艰危之秋。`, 'normal');
    pushNews(`开局盘点`, `国库 ${GameState.stats.treasury}两 | 内帑 ${GameState.stats.privyPurse}两 | 军 ${GameState.stats.militaryPower} | 粮 ${GameState.stats.food}`, 'normal');
    
    saveGame();
    updateUI();
    loadNextEvent();
}

// ====== 继续游戏 ======
function continueGame() {
    if (loadGame()) {
        document.getElementById('script-modal').classList.remove('active');
        document.getElementById('end-modal').classList.remove('active');
        pushNews('承大统', `陛下继续在位，已行 ${GameState.decisionsCount} 事。`, 'normal');
        updateUI();
        loadNextEvent();
        return true;
    }
    return false;
}

// ====== 推进时间（一季 = 3个月）======
function advanceSeason() {
    if (GameState.gameOver) return;
    
    // 批1：下季更鼓音效
    try { DamingSFX.play('season'); } catch (e) {}
    
    GameState.currentMonth++;
    if (GameState.currentMonth >= 3) {
        GameState.currentMonth = 0;
        seasonSettlement();
        GameState.currentSeason++;
        if (GameState.currentSeason >= 4) {
            GameState.currentSeason = 0;
            yearEndSettlement();
            GameState.currentYear++;
        }
    }
    
    // 检查剧本是否结束
    if (GameState.currentYear >= 20) {  // 20年上限
        triggerEnding('peaceful_end');
        return;
    }
    
    // 慢变量
    applySlowVariables();
    
    // 派系事件
    checkFactionEvents();
    
    // 检查失败条件
    checkLoseConditions();
    
    // 检查成就
    if (typeof checkAchievements === 'function') {
        checkAchievements();
    }
    
    updateUI();
    
    // 每4季自动存档
    if ((GameState.currentYear * 4 + GameState.currentSeason) % AUTOSAVE_INTERVAL === 0) {
        saveGame();
        pushNews('档', '已自动存档', 'normal');
    }
    
    // 史官年鉴：每季结算后自动生成
    if (typeof generateHistorianNote === 'function') {
        const note = generateHistorianNote();
        if (note) pushNews('史官', note, 'normal');
    }
    
    // 十年复盘
    if (GameState.currentYear > 0 && GameState.currentYear % 10 === 0 && GameState.currentSeason === 0) {
        if (typeof generateDecadeReview === 'function') {
            const review = generateDecadeReview();
            pushNews('考功', `【十年考】陛下在位${review.year}年，评为「${review.rating}」。`, 'critical');
        }
    }
    
    // 批3：内帑/厂卫巡检（矿监税使4章结算、卫力反噬、内帑枯竭、派系报复）
    try { cwMinerTick(); } catch (e) {}
    // 批4：舆图延迟效果结算
    try { tickMapPendingEffects(); } catch (e) {}
    try { cwCheckBackfire(); } catch (e) {}
    try { cwCheckDepletion(); } catch (e) {}
    try { cwCheckRevenge(); } catch (e) {}

    // 批5：纵深扩展每季巡检（批朱限次刷新/灾异复灾/大典冷却流逝/自动理政预热）
    try { b5Tick(); } catch (e) {}

    // 批A：经济巡检（物价季动/市面萧条/景气/市舶积祸）
    try { economyTick(); } catch (e) {}

    // 批B(v6.0)：内政新政巡检（新政季结/冷却衰减/民变审查）
    try { governTick(); } catch (e) {}

    // v6.0 批C：军事战守巡检（粮道/兵源生息/边患滋生/驻军耗饷/京营整顿冷却）
    try { warDefTick(); } catch (e) {}

    // 批F：军事科技树巡检（研究冷却衰减/战法注入保持）
    try { milTechTick(); } catch (e) {}
    try { mtAppendTactics(); } catch (e) {}

    // 批D：权谋巡检（结党/党势生息/阴谋酝酿与暴露/朋党倾轧）
    try { intrigueTick(); } catch (e) {}

    // 批E：长线目标（王朝使命）巡检——达成判定 + 发奖
    try { missionsTick(); } catch (e) {}

    // 批B：主线巡检（山河志节点到期则优先呈现并停止当季随机事件）
    try { if (mainlineTick()) return; } catch (e) {}

    // 批D：权谋裁决优先（朋党倾轧/阴谋暴露当场示下，停当季随机事件待圣断）
    try { if (typeof intrigueDecisionPending === 'function' && intrigueDecisionPending()) { openIntrigueDecision(); return; } } catch (e) {}

    // 批3：待发事件（和解彩蛋/厂卫反噬/内帑枯竭）与出师战报（急奏样式）优先呈现
    let queuedEv = null;
    try { queuedEv = consumePendingEvent(); } catch (e) { queuedEv = null; }
    try { if (!queuedEv && typeof checkExpeditionArrival === 'function') queuedEv = checkExpeditionArrival(); } catch (e) { queuedEv = null; }
    if (queuedEv && typeof showEvent === 'function') { showEvent(queuedEv); return; }

    // 70% 概率触发事件（大臣上奏或随机事件）
    const r = Math.random();
    if (r < 0.4 && typeof triggerMinisterAdvice === 'function') {
        if (!triggerMinisterAdvice()) {
            triggerRandomEvent();
        }
    } else if (r < 0.7) {
        // 30% 概率触发奏折（v3 仪式化）
        if (typeof showMemorial !== 'undefined' && Math.random() < 0.6) {
            const queue = generateMemorialQueue();
            if (queue.length > 0) {
                GameState.memorialQueue = queue;
                try { DamingSFX.play('urgent'); } catch (e) {}
                showMemorial(queue[0]);
                return;
            }
        }
        triggerRandomEvent();
    } else {
        loadNextEvent();
    }
}

// ====== 季度结算 ======
function seasonSettlement() {
    const season = SEASONS[GameState.currentSeason];
    
    pushNews(season.name + '季', `【${season.name}季结算】${season.effect}`, 'normal');
    
    // 收入
    season.income.forEach(income => {
        let amount = 0;
        const formula = income.formula;
        
        if (income.resource === 'treasury') {
            // treasury: 800 * (1-corruption/100) * (adminEfficiency/50)
            amount = 800 * (1 - GameState.stats.corruption/100) * (GameState.stats.adminEfficiency/50);
        } else if (income.resource === 'food') {
            // 春秋: 300 / 500 * (agriculture/50)
            const base = (GameState.currentSeason === 0) ? 300 : 500;
            amount = base * (GameState.stats.agriculture/50);
        } else if (income.resource === 'population') {
            // 人口增长: population * 0.002 * (stability/60)
            amount = Math.floor(GameState.stats.population * 0.002 * (GameState.stats.stability/60));
        } else if (income.resource === 'militaryPower') {
            // 夏: 100 * (adminEfficiency/50)
            amount = 100 * (GameState.stats.adminEfficiency/50);
        } else if (income.resource === 'prestige') {
            // 冬: 3 + vassals*0.5
            amount = 3 + GameState.stats.vassals * 0.5;
        } else if (income.resource === 'mandate') {
            amount = 2;
        }
        
        amount = Math.floor(amount);
        if (amount > 0) {
            GameState.stats[income.resource] += amount;
            pushNews(season.name + '季', `${RESOURCES[income.resource].name} +${amount}`, 'normal');
            // 批1：岁末大计账本（只记录，不影响数值）
            try { recordYearLedger('income', income.resource, amount); } catch (e) {}
        }
    });
    
    // 支出：俸禄 + 军费
    const salaryCost = 500;
    const militaryCost = Math.floor(GameState.stats.militaryPower * 0.1);
    GameState.stats.treasury -= (salaryCost + militaryCost);
    
    if (salaryCost + militaryCost > 0) {
        pushNews(season.name + '季', `俸禄军费 -${salaryCost + militaryCost}两`, 'normal');
        // 批1：岁末大计账本（只记录，不影响数值）
        try {
            recordYearLedger('expense', 'salary', salaryCost);
            recordYearLedger('expense', 'military', militaryCost);
        } catch (e) {}
    }
    
    // 国库负债追踪
    if (GameState.stats.treasury < 0) {
        GameState.treasuryDebt += Math.abs(GameState.stats.treasury);
        if (GameState.treasuryDebt > 10000) {
            GameState.stats.stability = Math.max(0, GameState.stats.stability - 2);
        }
    } else {
        GameState.treasuryDebt = Math.max(0, GameState.treasuryDebt - 1000);
    }
    
    // 派系维护费
    const factionUpkeep = (GameState.factions.civil + GameState.factions.military + 
                          GameState.factions.royal + GameState.factions.eunuch + 
                          GameState.factions.consort) * 2;
    GameState.stats.treasury -= factionUpkeep;
    // 批1：岁末大计账本（只记录，不影响数值）
    try { recordYearLedger('expense', 'faction', factionUpkeep); } catch (e) {}
}

// ====== 年末结算 ======
function yearEndSettlement() {
    // 批1：结算前快照（岁末大计对比基线，只读不改）
    try { snapshotYearEnd(); } catch (e) {}
    
    // 人口基础增长
    const stabLevel = getStabilityLevel();
    GameState.stats.population = Math.floor(GameState.stats.population * stabLevel.popMod);
    
    // 国库透支累积
    if (GameState.stats.treasury < 0) {
        GameState.stats.corruption = Math.min(100, GameState.stats.corruption + 3);
    }
    
    // 计算稳定度等级
    updateStabilityLevel();
    
    pushNews('岁末', `天下大势：稳定 ${GameState.stats.stability} | 威望 ${GameState.stats.prestige} | 腐败 ${GameState.stats.corruption}`, 'normal');
    
    // 批1：岁末大计面板（五步分展，呈现层重做；结算数值逻辑未动）
    try { openYearEndReport(); } catch (e) {}
}

// ====== 慢变量 ======
function applySlowVariables() {
    // 人口自然增长（受稳定度影响）
    if (GameState.currentMonth === 0) {
        const stabLevel = getStabilityLevel();
        const popChange = Math.floor(GameState.stats.population * 0.005 * (stabLevel.popMod - 1));
        if (popChange !== 0) {
            GameState.stats.population += popChange;
        }
    }
    
    // 腐败自然增长（无有效治理时）
    if (GameState.currentMonth === 2 && GameState.stats.adminEfficiency < 50) {
        GameState.stats.corruption = Math.min(100, GameState.stats.corruption + 1);
    }
    
    // 商业/农业自然变化
    if (GameState.currentMonth === 1) {
        // 商业随商业值
        if (GameState.stats.commerce < 30) GameState.stats.treasury -= 200;
    }
    
    // 漕运失效影响粮食
    if (GameState.stats.canalEfficiency < 20) {
        GameState.stats.food = Math.max(0, GameState.stats.food - 100);
    }
}

// ====== 派系事件检查 ======
function checkFactionEvents() {
    for (const [key, faction] of Object.entries(FACTIONS)) {
        const value = GameState.factions[key];
        if (value < faction.min) {
            // 派系过弱
            if (Math.random() < 0.05) {
                pushNews(faction.name, `【警惕】${faction.name} 濒于边缘，请警惕${faction.hostility}。`, 'critical');
                if (faction.hostility.includes('国库')) {
                    GameState.stats.treasury = Math.floor(GameState.stats.treasury * 0.95);
                } else if (faction.hostility.includes('军力')) {
                    GameState.stats.militaryPower = Math.floor(GameState.stats.militaryPower * 0.9);
                } else if (faction.hostility.includes('稳定')) {
                    GameState.stats.stability = Math.max(0, GameState.stats.stability - 10);
                } else {
                    GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 5);
                }
            }
        } else if (value > 80) {
            // 派系过强
            if (Math.random() < 0.05) {
                pushNews(faction.name, `【警告】${faction.name} 气焰熏天，${faction.overreach}之象已现。`, 'critical');
                GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 3);
            }
        }
    }
}

// ====== 触发随机事件 ======
function triggerRandomEvent() {
    // 根据当前情况选择事件类型
    let typeWeights = {
        disaster: 0.1,
        border: 0.15,
        internal: 0.3,
        economy: 0.2,
        diplomacy: 0.15,
        royal: 0.1
    };
    
    // 流民多时增加灾害
    if (GameState.stats.stability < 30) typeWeights.disaster = 0.3;
    // 边患高时增加边患
    if (GameState.stats.stability < 40) typeWeights.border = 0.3;
    // 国库紧时增加经济
    if (GameState.stats.treasury < 3000) typeWeights.economy = 0.35;
    
    const total = Object.values(typeWeights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosenType = 'internal';
    for (const [type, weight] of Object.entries(typeWeights)) {
        r -= weight;
        if (r <= 0) { chosenType = type; break; }
    }
    
    const eventPool = EVENTS_BY_TYPE[chosenType];
    const eventId = eventPool[Math.floor(Math.random() * eventPool.length)];
    showEvent(EVENTS[eventId]);
}

// ====== 加载下一个事件 ======
function loadNextEvent() {
    if (GameState.gameOver) return;
    
    // 显示中央国事区为"待办"
    document.getElementById('edict-from').textContent = '【候旨】';
    document.getElementById('edict-title').textContent = '国事待理';
    document.getElementById('edict-content').textContent = '点右上"下季"推进国事，遇有大事将有急奏呈上。';
}

// ====== 应用决策效果 ======
function applyDecision(effect) {
    for (const [key, value] of Object.entries(effect)) {
        if (key in GameState.stats) {
            GameState.stats[key] = Math.max(0, GameState.stats[key] + value);
            flashStatChange(key, value);
        } else if (key in GameState.factions) {
            GameState.factions[key] = Math.max(0, Math.min(100, GameState.factions[key] + value));
        }
    }
    
    // 边界检查
    enforceLimits();
    
    // 派系自动影响
    syncFactionEffects();
    
    // 弹劾效果（如果有）
    if (effect.punishment) {
        applyPunishment(effect.punishment);
    }
    
    updateStabilityLevel();
}

// ====== 数值限制 ======
function enforceLimits() {
    const s = GameState.stats;
    
    // 稳定度 0-100
    s.stability = Math.max(0, Math.min(100, s.stability));
    s.prestige = Math.max(0, Math.min(100, s.prestige));
    s.mandate = Math.max(0, Math.min(100, s.mandate));
    s.adminEfficiency = Math.max(0, Math.min(100, s.adminEfficiency));
    s.corruption = Math.max(0, Math.min(100, s.corruption));
    s.culture = Math.max(0, Math.min(100, s.culture));
    s.tech = Math.max(0, Math.min(100, s.tech));
    s.commerce = Math.max(0, Math.min(100, s.commerce));
    s.agriculture = Math.max(0, Math.min(100, s.agriculture));
    s.canalEfficiency = Math.max(0, Math.min(100, s.canalEfficiency));
    
    // 资源不能为负到破产（但可以负数表示负债）
    if (s.treasury < -50000) {
        s.treasury = -50000;  // 破产底线
    }
    if (s.food < 0) s.food = 0;
    if (s.militaryFood < 0) s.militaryFood = 0;
}

// ====== 派系对指标的影响 ======
function syncFactionEffects() {
    // 宦官过强 -> 天命下降
    if (GameState.factions.eunuch > 70) {
        GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 0.1);
    }
    // 文官过强 -> 行政效率高
    if (GameState.factions.civil > 60) {
        GameState.stats.adminEfficiency = Math.min(100, GameState.stats.adminEfficiency + 0.1);
    } else if (GameState.factions.civil < 40) {
        GameState.stats.adminEfficiency = Math.max(0, GameState.stats.adminEfficiency - 0.1);
    }
    // 武将过强 -> 军力提升但腐败可能上升
    if (GameState.factions.military > 70) {
        GameState.stats.corruption = Math.min(100, GameState.stats.corruption + 0.05);
    }
    // 宗室过强 -> 稳定下降
    if (GameState.factions.royal > 60) {
        GameState.stats.stability = Math.max(0, GameState.stats.stability - 0.1);
    }
    // 外戚过强 -> 稳定下降
    if (GameState.factions.consort > 70) {
        GameState.stats.stability = Math.max(0, GameState.stats.stability - 0.1);
    }
}

// ====== 稳定度等级 ======
function getStabilityLevel() {
    const s = GameState.stats.stability;
    for (let i = 0; i < STABILITY_LEVELS.length; i++) {
        if (s >= STABILITY_LEVELS[i].min) {
            return STABILITY_LEVELS[i];
        }
    }
    return STABILITY_LEVELS[STABILITY_LEVELS.length - 1];
}

function updateStabilityLevel() {
    const oldLevel = GameState.stabilityLevel;
    const newLevel = STABILITY_LEVELS.findIndex(l => GameState.stats.stability >= l.min);
    GameState.stabilityLevel = newLevel;
    
    if (newLevel !== oldLevel && oldLevel !== undefined) {
        pushNews('稳定度', `稳定度等级变更为 ${STABILITY_LEVELS[newLevel].name}`, 'critical');
    }
}

// ====== 弹劾应用 ======
function applyPunishment(punishmentId) {
    const p = PUNISHMENTS[punishmentId];
    if (!p) return;
    
    GameState.stats.stability += p.stability;
    GameState.stats.treasury += p.treasury;
    
    pushNews('弹劾', `${p.name}：稳定 ${p.stability >= 0 ? '+' : ''}${p.stability} | 国库 ${p.treasury >= 0 ? '+' : ''}${p.treasury}`, 
             p.death ? 'critical' : 'normal');
}

// ====== 失败条件检查 ======
function checkLoseConditions() {
    const s = GameState.stats;
    
    // 天命<20 = 亡国
    if (s.mandate < 20) {
        if (Math.random() < 0.05) {
            triggerEnding('mandate_lost');
            return;
        }
    }
    
    // 国库极度亏空 + 稳定<20
    if (s.treasury < -30000 && s.stability < 20) {
        if (Math.random() < 0.05) {
            triggerEnding('bankrupt');
            return;
        }
    }
    
    // 军力极弱 + 流民多（流民通过稳定度低表征）
    if (s.militaryPower < 2000 && s.stability < 20) {
        if (Math.random() < 0.03) {
            triggerEnding('military_collapse');
            return;
        }
    }
    
    // 人口锐减
    if (s.population < 30000000) {
        if (Math.random() < 0.03) {
            triggerEnding('population_collapse');
            return;
        }
    }
}

// ====== 显示事件弹窗 ======
function showEvent(event) {
    // 批1：事件音效（灾异边患低鸣，其余急奏鼓点）
    try { DamingSFX.play((event.type === 'disaster' || event.type === 'border') ? 'disaster' : 'urgent'); } catch (e) {}
    // 批2：舆图状态联动打点（灾害/边患/叛乱按文本映射地区，同章同格不叠加）
    try { tagMapRegionByEvent(event); } catch (e) {}
    const modal = document.getElementById('event-modal');
    document.getElementById('event-header').textContent = 
        `${SEASONS[GameState.currentSeason].name} · ${['孟','仲','季'][GameState.currentMonth]}月`;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-content').textContent = event.desc;
    
    // 同步中央国事区
    document.getElementById('edict-from').textContent = `[${getTypeName(event.type)}] · 急奏`;
    document.getElementById('edict-title').textContent = event.title;
    document.getElementById('edict-content').textContent = event.desc;
    
    const choicesContainer = document.getElementById('event-choices');
    choicesContainer.innerHTML = '';
    
    event.options.forEach(opt => {
        const optEl = document.createElement('div');
        optEl.className = 'decision-option';
        
        const hint = formatEffectHint(opt.effect);
        optEl.innerHTML = `
            <span>${opt.text}</span>
            <span class="decision-option-hint">${hint}</span>
        `;
        optEl.onclick = () => {
            try { DamingSFX.play('decide'); } catch (e) {}
            applyDecision(opt.effect);
            // 批2：事件处置后舆图状态收敛（正面处置→地区转安定）
            try { settleMapRegionByChoice(event, opt); } catch (e) {}
            // 批3：出师战报追责/抚恤等动态处置
            try { resolveExpeditionChoice(event, opt); } catch (e) {}
            addToHistory(event, opt);
            // 批5：灾异应对登记（灾异事件处置后挂入荒tab待办）
            try { zaiyiReportFromEvent(event, opt); } catch (e) {}
            // 批C：叛乱/民变事件可选「发兵征讨」进入战棋实战（平叛战）
            if (typeof bfEventPacify === 'function' && bfEventPacify(event, opt)) {
                // 已转入平叛战场，暂停过季推进；战场收束后再回銮
                return;
            }
            pushNews('圣旨', `陛下${opt.text}：${event.title}`, 'normal');
            modal.classList.remove('active');
            
            // 中央国事区显示"已决"
            document.getElementById('edict-from').textContent = '待办';
            document.getElementById('edict-title').textContent = '国事已理';
            document.getElementById('edict-content').textContent = '下季将有新事。';
            
            GameState.decisionsCount++;
            advanceSeason();
        };
        choicesContainer.appendChild(optEl);
    });
    
    modal.classList.add('active');
}

function getTypeName(type) {
    const names = {
        disaster: '天灾', border: '边报', internal: '内政',
        economy: '财政', diplomacy: '外事', royal: '宗藩'
    };
    return names[type] || '奏报';
}

// ====== 格式化效果提示 ======
function formatEffectHint(effect) {
    const parts = [];
    for (const [key, value] of Object.entries(effect)) {
        if (key === 'punishment') continue;
        const displayName = RESOURCES[key] ? RESOURCES[key].name : 
                          FACTIONS[key] ? FACTIONS[key].name : key;
        const sign = value > 0 ? '+' : '';
        parts.push(`${displayName} ${sign}${value}`);
    }
    return parts.join(' | ');
}

// ====== 添加到历史 ======
function addToHistory(event, decision) {
    GameState.history.unshift({
        era: GameState.script.era,
        year: GameState.currentYear,
        season: SEASONS[GameState.currentSeason].name,
        month: ['孟','仲','季'][GameState.currentMonth],
        type: event.type,
        title: event.title,
        decision: decision.text
    });
    if (GameState.history.length > 30) GameState.history.pop();
    renderHistory();
}

function renderHistory() {
    const list = (document.getElementById('history-list')||{innerHTML:'',appendChild:()=>{}});
    if (!list) return;
    list.innerHTML = '';
    
    GameState.history.slice(0, 12).forEach(item => {
        const typeColor = {
            disaster: '#8b2c1a', border: '#5a4a3a', internal: '#4a6a4a',
            economy: '#b8893a', diplomacy: '#5a6a7a', royal: '#6a5a4a'
        }[item.type] || '#5a4a3a';
        
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.style.borderLeftColor = typeColor;
        itemEl.innerHTML = `
            <div class="history-item-time">${item.era} · ${item.season} · ${item.month}月</div>
            <div class="history-item-title">${item.title}</div>
            <span class="history-item-decision">${item.decision}</span>
        `;
        list.appendChild(itemEl);
    });
}

// ====== 触发结局 ======
function triggerEnding(type) {
    GameState.gameOver = true;
    
    // 批1：结局编钟尾声
    try { DamingSFX.play('ending'); } catch (e) {}
    
    const endings = {
        mandate_lost: {
            title: '天命倾覆',
            content: '天命已去，群臣离心。陛下虽欲振作，奈何民心尽失。一场民变起于萧墙，帝国大厦轰然倒塌——大明二百七十六年之祚，竟绝于陛下之手。'
        },
        bankrupt: {
            title: '国库空竭',
            content: '国库空虚，入不敷出。百官无俸，边军无饷。朝堂之上，户部唯有请罪；边关之处，将士唯有哗变。君臣相顾，唯有泪千行。'
        },
        military_collapse: {
            title: '军力崩解',
            content: '军备废弛，兵不能战。流寇蜂起，外虏深入。陛下束手无策，唯以身殉国——大明气数，终于此尽。'
        },
        population_collapse: {
            title: '生灵涂炭',
            content: '天灾人祸，百姓流离。在籍人口，十不存三。陛下虽欲赈济，奈何国库无粮，朝堂无人。一场浩劫，史上罕匹。'
        },
        peaceful_end: {
            title: '二十载太平',
            content: '陛下在位二十载，内修政理，外抚四夷。海内粗安，民生稍复。后世史家评曰："虽无大治，亦非庸主。"——大命之续，赖此一息。'
        }
    };
    
    const ending = endings[type] || endings.peaceful_end;
    
    document.getElementById('end-era').textContent = 
        `${GameState.script.era} · 第 ${GameState.currentYear} 年`;
    document.getElementById('end-title').textContent = ending.title;
    document.getElementById('end-content').textContent = ending.content;
    
    // 显示主要数值
    const statsContainer = document.getElementById('end-stats');
    statsContainer.innerHTML = '';
    const keyResources = ['treasury', 'stability', 'prestige', 'mandate', 'militaryPower', 'corruption'];
    keyResources.forEach(key => {
        const res = RESOURCES[key];
        const val = Math.round(GameState.stats[key] || 0);
        const item = document.createElement('div');
        item.className = 'end-stat';
        item.innerHTML = `
            <span class="end-stat-label">${res.name}</span>
            <span class="end-stat-value">${val}</span>
        `;
        statsContainer.appendChild(item);
    });
    
    // 批3：结局回响「身后名」（编年大事/厂卫卷宗/谥号/史官总评）
    try { if (typeof renderEndLegacy === 'function') renderEndLegacy(type); } catch (e) {}
    // 批B：主线结局「山河志」章节（与既有结局并存）
    try { if (typeof renderMainlineEnding === 'function') renderMainlineEnding(); } catch (e) {}
    // 批E：王朝使命收官「王朝评价」追加（与山河志并存）
    try { if (typeof renderMissionEnding === 'function') renderMissionEnding(); } catch (e) {}

    pushNews('史官', `陛下在位，决事 ${GameState.decisionsCount} 次。`, 'normal');
    
    document.getElementById('end-modal').classList.add('active');
}

// ====== 数字变化闪光 ======
function flashStatChange(key, value) {
    setTimeout(() => {
        const el = document.querySelector(`[data-stat="${key}"]`);
        if (el) {
            el.classList.remove('flash-up', 'flash-down');
            if (value > 0) {
                el.classList.add('flash-up');
            } else if (value < 0) {
                el.classList.add('flash-down');
            }
            el.textContent = formatNumber(key, GameState.stats[key]);
            setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 800);
        }
    }, 50);
}

function formatNumber(key, val) {
    if (key === 'population') {
        return Math.round(val / 10000) + '万';
    }
    if (val > 10000) {
        return Math.round(val / 1000) + 'k';
    }
    return Math.round(val);
}

// ====== 更新UI ======
function updateUI() {
    // 顶部时间
    document.getElementById('era-name').textContent = 
        `${GameState.script.era} · 第${GameState.currentYear + 1}年`;
    document.getElementById('emperor').textContent = 
        `${SEASONS[GameState.currentSeason].name} · ${['孟','仲','季'][GameState.currentMonth]}月`;
    
    // 顶部决策计数
    document.getElementById('time-label').textContent = `决事 ${GameState.decisionsCount} 次`;
    
    // 资源面板
    renderResources();
    
    // 派系面板
    renderFactions();
    
    // 天象
    renderCelestial();
    
    // 新闻
    renderNews();
    
    // 稳定度等级
    renderStabilityLevel();
    
    // 渲染当前 tab
    if (typeof renderPanel === 'function') {
        renderPanel(GameState.currentTab || 'overview');
    }
}

// ====== 渲染资源面板（22资源）======
function renderResources() {
    const list = document.getElementById('resource-list');
    if (!list) return;
    list.innerHTML = '';
    
    // 按组显示
    for (const [groupKey, group] of Object.entries(RESOURCE_GROUPS)) {
        const groupRes = Object.entries(RESOURCES).filter(([k, r]) => r.group === groupKey);
        if (groupRes.length === 0) continue;
        
        const header = document.createElement('div');
        header.className = 'resource-group-header';
        header.style.color = group.color;
        header.textContent = group.name;
        list.appendChild(header);
        
        groupRes.forEach(([key, res]) => {
            const value = GameState.stats[key] || 0;
            const item = document.createElement('div');
            item.className = 'resource-item';
            
            // 显示用值（人口/大数特殊处理）
            let displayValue = Math.round(value);
            if (key === 'population') displayValue = Math.round(value / 10000) + '万';
            
            // 0-100的资源显示进度条，否则只显示数字
            const hasBar = ['stability', 'prestige', 'mandate', 'adminEfficiency', 
                          'corruption', 'culture', 'tech', 'commerce', 'agriculture', 'canalEfficiency'].includes(key);
            
            if (hasBar) {
                const fillClass = value < 20 ? 'critical' : value < 40 ? 'ink' : 
                                 value < 60 ? 'gold' : 'jade';
                item.innerHTML = `
                    <span class="resource-name">${res.name}</span>
                    <div class="resource-bar">
                        <div class="resource-fill ${fillClass}" style="width: ${value}%"></div>
                    </div>
                    <span class="resource-value" data-stat="${key}">${displayValue}</span>
                `;
            } else {
                item.innerHTML = `
                    <span class="resource-name">${res.name}</span>
                    <span class="resource-value" data-stat="${key}">${displayValue}</span>
                `;
            }
            
            list.appendChild(item);
        });
    }
}

// ====== 渲染派系 ======
function renderFactions() {
    const list = document.getElementById('faction-list');
    if (!list) return;
    list.innerHTML = '';
    
    for (const [key, faction] of Object.entries(FACTIONS)) {
        const value = Math.round(GameState.factions[key] || 0);
        const item = document.createElement('div');
        item.className = 'faction-item';
        
        if (value > 80) item.classList.add('hostile');
        if (value < 30) item.classList.add('ally');
        
        const mood = getFactionMood(value);
        
        item.innerHTML = `
            <div class="faction-name">${faction.name}</div>
            <div class="faction-leader">${faction.org}</div>
            <div class="faction-mood">${mood} · ${value}</div>
            <div class="faction-bar" style="width: ${value}%"></div>
        `;
        list.appendChild(item);
    }
}

function getFactionMood(value) {
    if (value > 80) return '跋扈';
    if (value > 60) return '骄横';
    if (value > 40) return '观望';
    if (value > 20) return '蛰伏';
    return '濒散';
}

// ====== 渲染稳定度等级 ======
function renderStabilityLevel() {
    const el = document.getElementById('stability-level');
    if (!el) return;
    const level = STABILITY_LEVELS[GameState.stabilityLevel] || STABILITY_LEVELS[2];
    el.textContent = level.name;
    el.className = 'stability-level ' + level.name;
}

// ====== 渲染天象 ======
function renderCelestial() {
    // 随机天象
    if (Math.random() < 0.03) GameState.omen.eclipse = true;
    if (Math.random() < 0.02) GameState.omen.comet = true;
    
    const s = GameState.stats;
    if (s.mandate < 30) GameState.omen.mandateLow = true;
    
    document.getElementById('omen-eclipse').textContent = GameState.omen.eclipse ? '已现' : '未现';
    document.getElementById('omen-eclipse').className = 'celestial-value' + (GameState.omen.eclipse ? ' bad' : '');
    
    document.getElementById('omen-comet').textContent = GameState.omen.comet ? '已现' : '未现';
    document.getElementById('omen-comet').className = 'celestial-value' + (GameState.omen.comet ? ' bad' : '');
    
    document.getElementById('omen-mandate').textContent = GameState.omen.mandateLow ? '已警' : '安宁';
    document.getElementById('omen-mandate').className = 'celestial-value' + (GameState.omen.mandateLow ? ' bad' : '');
    
    if (GameState.omen.eclipse) {
        GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 1);
    }
}

// ====== 新闻推送 ======
function pushNews(time, text, type) {
    GameState.news.unshift({ time, text, type });
    if (GameState.news.length > 30) GameState.news.pop();
    // 批1：年度要闻累积（岁末大计"变故实录"用，只记录不改原逻辑）
    try {
        if (!GameState.yearNews) GameState.yearNews = [];
        GameState.yearNews.unshift({ time, text, type });
        if (GameState.yearNews.length > 80) GameState.yearNews.pop();
    } catch (e) {}
}

function renderNews() {
    const list = document.getElementById('news-list');
    if (!list) return;
    list.innerHTML = '';
    
    GameState.news.slice(0, 12).forEach(news => {
        const item = document.createElement('div');
        item.className = 'news-item';
        const textClass = news.type === 'critical' ? 'critical' : '';
        item.innerHTML = `
            <span class="news-time">${news.time}</span>
            <span class="news-text ${textClass}">${news.text}</span>
        `;
        list.appendChild(item);
    });
}

// ====== 渲染剧本选择 ======
function renderScriptList() {
    const list = document.getElementById('script-list');
    if (!list) return;
    list.innerHTML = '';
    
    // 顶部"继续游戏"按钮
    if (hasSave()) {
        const continueOpt = document.createElement('div');
        continueOpt.className = 'script-option continue-option';
        continueOpt.innerHTML = `
            <div>
                <div class="script-option-title">▶ 继续在位之君</div>
                <div class="script-option-desc">载入上次自动存档</div>
            </div>
            <div class="script-option-difficulty">续</div>
        `;
        continueOpt.onclick = () => {
            if (!continueGame()) {
                alert('存档损坏或已过期');
            }
        };
        list.appendChild(continueOpt);
    }
    
    SCRIPTS.forEach(script => {
        const opt = document.createElement('div');
        opt.className = 'script-option';
        const stars = '★'.repeat(script.difficulty) + '☆'.repeat(8 - script.difficulty);
        opt.innerHTML = `
            <div>
                <div class="script-option-title">${script.name} · ${script.era}</div>
                <div class="script-option-desc">${script.desc}</div>
            </div>
            <div class="script-option-difficulty">${stars}</div>
        `;
        opt.onclick = () => {
            if (hasSave()) {
                if (confirm('当前有存档，是否覆盖？')) {
                    deleteSave();
                    initGame(script.id);
                }
            } else {
                initGame(script.id);
            }
        };
        list.appendChild(opt);
    });
}

// ====== 重启 ======
function restartGame() {
    document.getElementById('end-modal').classList.remove('active');
    document.getElementById('script-modal').classList.add('active');
    renderScriptList();
}

// ====== 启动 ======
document.addEventListener('DOMContentLoaded', () => {
    renderScriptList();
    
    // 批1：音效解锁 + 设置 + 移动端导航 + 岁末大计委托
    try { initSFXUnlock(); } catch (e) {}
    try { initMobileUI(); } catch (e) {}
    try { initYearendDelegates(); } catch (e) {}

    // 批5：纵深扩展UI初始化（自动理政角标/礼制大典/御览批朱按钮）
    try { initBatch5UI(); } catch (e) {}
    
    // 批1：全局点击音效（事件委托；跳过已带专属音效的按钮，避免叠音）
    try {
        document.addEventListener('click', (e) => {
            try {
                if (!e.target || !e.target.closest) return;
                if (e.target.closest('#mobile-next') || e.target.closest('#sfx-btn') ||
                    e.target.closest('#sfx-close') || e.target.closest('#sfx-toggle') ||
                    e.target.closest('.mobile-tab')) return;
                if (e.target.closest('button') || e.target.closest('.menu-tab') ||
                    e.target.closest('.decision-option') || e.target.closest('.memorial-option') ||
                    e.target.closest('.script-option')) {
                    DamingSFX.play('click');
                }
            } catch (err) {}
        });
    } catch (e) {}
    
    // 初始化本机联机（BroadcastChannel）
    if (typeof initBroadcast === 'function') {
        initBroadcast();
    }
    
    document.getElementById('next-month').addEventListener('click', advanceSeason);
    document.getElementById('next-year').addEventListener('click', () => {
        if (GameState.gameOver) return;
        if (confirm('快进1年（共4季）？')) {
            for (let i = 0; i < 4; i++) {
                if (GameState.gameOver) break;
                advanceSeason();
            }
        }
    });
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // 存档按钮
    document.getElementById('save-btn').addEventListener('click', () => {
        if (saveGame()) {
            pushNews('档', '已手动存档', 'normal');
            alert('存档成功');
        }
    });
    
    // 结局界面"载入存档"按钮
    const endContBtn = document.getElementById('end-continue-btn');
    if (endContBtn) {
        endContBtn.addEventListener('click', () => {
            if (continueGame()) {
                document.getElementById('end-modal').classList.remove('active');
            }
        });
    }
    
    // 左侧系统菜单 tab 切换
    document.getElementById('menu-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.menu-tab');
        if (!tab) return;
        const tabName = tab.dataset.tab;
        if (!tabName) return;
        
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        GameState.currentTab = tabName;
        
        if (typeof renderPanel === 'function') {
            renderPanel(tabName);
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!GameState.gameOver) advanceSeason();
        } else if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        }
    });
});

// ============================================
// 批4：扩展数据合并（事件/急奏/建言）
// ============================================
(function mergeBatch4Data() {
    try {
        // 合并扩展事件到EVENTS
        if (typeof EVENTS_EXTENSION !== 'undefined' && Array.isArray(EVENTS_EXTENSION)) {
            const extStart = Object.keys(EVENTS).length;
            EVENTS_EXTENSION.forEach((ev, i) => {
                const key = 'ext_' + (i + 1);
                EVENTS[key] = ev;
            });
            // 重建EVENTS_BY_TYPE
            Object.keys(EVENTS_BY_TYPE).forEach(type => {
                EVENTS_BY_TYPE[type] = Object.keys(EVENTS).filter(k => EVENTS[k].type === type);
            });
            // 确保扩展type也加入
            EVENTS_EXTENSION.forEach(ev => {
                if (!EVENTS_BY_TYPE[ev.type]) {
                    EVENTS_BY_TYPE[ev.type] = Object.keys(EVENTS).filter(k => EVENTS[k].type === ev.type);
                }
            });
        }
        // 合并扩展急奏到memorialQueue生成
        if (typeof MEMORIALS_EXTENSION !== 'undefined' && Array.isArray(MEMORIALS_EXTENSION)) {
            window._memorialsExtension = MEMORIALS_EXTENSION;
        }
        // 合并扩展建言
        if (typeof ADVICE_EXTENSION !== 'undefined' && Array.isArray(ADVICE_EXTENSION)) {
            window._adviceExtension = ADVICE_EXTENSION;
        }
    } catch (e) {}
})();

// 扩展急奏生成：混合扩展急奏
var _origGenerateMemorialQueue = generateMemorialQueue;
generateMemorialQueue = function() {
    try {
        const queue = _origGenerateMemorialQueue();
        if (window._memorialsExtension && Math.random() < 0.35) {
            const ext = window._memorialsExtension;
            const pick = ext[Math.floor(Math.random() * ext.length)];
            // 筛选当前剧本匹配的
            const sid = GameState.script ? GameState.script.id : 'all';
            const matching = ext.filter(m => !m.script || m.script === sid || m.script === 'all');
            if (matching.length > 0) {
                const chosen = matching[Math.floor(Math.random() * matching.length)];
                queue.push(chosen);
            }
        }
        return queue;
    } catch (e) { return _origGenerateMemorialQueue(); }
};

// 扩展建言触发：混合扩展建言
var _origTriggerMinisterAdvice = triggerMinisterAdvice;
triggerMinisterAdvice = function() {
    try {
        // 30%概率触发扩展建言
        if (window._adviceExtension && Math.random() < 0.3) {
            const ext = window._adviceExtension;
            const matching = ext.filter(a => {
                try { return a.condition && a.condition(GameState); } catch (e) { return false; }
            });
            if (matching.length > 0) {
                const chosen = matching[Math.floor(Math.random() * matching.length)];
                showEvent({
                    title: chosen.title || '臣有建言',
                    desc: chosen.text,
                    options: chosen.options || [{ text: '知道了', effect: {} }]
                });
                return true;
            }
        }
        return _origTriggerMinisterAdvice();
    } catch (e) { return _origTriggerMinisterAdvice(); }
};
