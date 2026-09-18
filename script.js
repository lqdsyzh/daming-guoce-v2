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
        GameState.currentTab = save.currentTab || 'politics';
        GameState.impeachmentQueue = save.impeachmentQueue || [];
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
    currentTab: 'politics',
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
    GameState.currentTab = 'politics';
    GameState.impeachmentQueue = [];
    
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
        }
    });
    
    // 支出：俸禄 + 军费
    const salaryCost = 500;
    const militaryCost = Math.floor(GameState.stats.militaryPower * 0.1);
    GameState.stats.treasury -= (salaryCost + militaryCost);
    
    if (salaryCost + militaryCost > 0) {
        pushNews(season.name + '季', `俸禄军费 -${salaryCost + militaryCost}两`, 'normal');
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
}

// ====== 年末结算 ======
function yearEndSettlement() {
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
            applyDecision(opt.effect);
            addToHistory(event, opt);
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
    const list = document.getElementById('history-list');
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
        renderPanel(GameState.currentTab || 'politics');
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
