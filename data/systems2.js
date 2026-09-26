// ============================================
// 《大明国策》v3.0 系统扩展
// 政策图谱/派系动态/个人仪表盘/军事调动/战役/科举/水利/灾荒/农时
// 每个都有数值/进度条/关系
// ============================================

// ====== 1. 政策图谱（关系网）======
// 政策之间有正负关系：例如"重商"和"抑商"对立
const POLICY_GRAPH = {
    // 财赋
    '重商':      { category: '财赋', effect: { commerce: 10, treasury: 500 }, allies: ['开海', '减税'], enemies: ['抑商', '海禁'] },
    '抑商':      { category: '财赋', effect: { stability: 5, agriculture: 5 }, allies: ['重农', '海禁'], enemies: ['重商', '开海'] },
    '重农':      { category: '财赋', effect: { agriculture: 10, food: 500 }, allies: ['抑商', '兴修水利'], enemies: ['弃农'] },
    '开海':      { category: '财赋', effect: { commerce: 15, treasury: 800, navyPower: 300 }, allies: ['重商'], enemies: ['海禁'] },
    '海禁':      { category: '财赋', effect: { stability: 5, prestige: 3 }, allies: ['抑商'], enemies: ['开海', '重商'] },
    '一条鞭':    { category: '财赋', effect: { treasury: 1000, agriculture: 5, stability: -5 }, allies: ['开海'], enemies: ['保守税制'] },

    // 军事
    '强军':      { category: '军事', effect: { militaryPower: 1500, treasury: -500 }, allies: ['募兵'], enemies: ['裁军', '和亲'] },
    '裁军':      { category: '军事', effect: { treasury: 1000, stability: 3 }, allies: ['和亲'], enemies: ['强军'] },
    '募兵':      { category: '军事', effect: { militaryPower: 1000, treasury: -800 }, allies: ['强军'], enemies: ['裁军'] },
    '和亲':      { category: '外交', effect: { stability: 5, prestige: -8, military: -3 }, allies: ['裁军'], enemies: ['强军'] },

    // 内政
    '党禁':      { category: '内政', effect: { eunuch: 5, civil: -10 }, allies: ['宦官'], enemies: ['清议'] },
    '清议':      { category: '内政', effect: { civil: 10, prestige: 5, eunuch: -5 }, allies: ['士林'], enemies: ['党禁'] },
    '反腐':      { category: '内政', effect: { corruption: -15, civil: -5 }, allies: ['清议'], enemies: ['党禁'] },

    // 文化
    '尊儒':      { category: '文化', effect: { culture: 8, civil: 3 }, allies: ['科举'], enemies: ['佛道'] },
    '佛道':      { category: '文化', effect: { stability: 3, culture: 3 }, allies: [], enemies: ['尊儒'] },

    // 制度
    '削藩':      { category: '制度', effect: { royal: -15, stability: -3, military: 5 }, allies: ['强军'], enemies: ['厚藩'] },
    '厚藩':      { category: '制度', effect: { royal: 10, civil: -3 }, allies: [], enemies: ['削藩'] }
};

// 当前生效的政策
const ACTIVE_POLICIES = ['重农', '尊儒', '党禁', '海禁', '强军'];

function renderPolicyGraph() {
    const allPolicies = Object.keys(POLICY_GRAPH);
    const cx = 400, cy = 280, r = 220;
    const positions = {};
    allPolicies.forEach((p, i) => {
        const angle = (i / allPolicies.length) * Math.PI * 2 - Math.PI / 2;
        positions[p] = {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r
        };
    });

    let svg = '<svg width="800" height="560" viewBox="0 0 800 560" style="background: rgba(244,232,208,0.3); border-radius: 4px;">';

    // 关系连线
    allPolicies.forEach(p => {
        const policy = POLICY_GRAPH[p];
        const myPos = positions[p];

        (policy.allies || []).forEach(ally => {
            if (positions[ally]) {
                svg += `<line x1="${myPos.x}" y1="${myPos.y}" x2="${positions[ally].x}" y2="${positions[ally].y}" stroke="#4a6a4a" stroke-width="2" opacity="0.4" stroke-dasharray="4,2" />`;
            }
        });
        (policy.enemies || []).forEach(enemy => {
            if (positions[enemy]) {
                svg += `<line x1="${myPos.x}" y1="${myPos.y}" x2="${positions[enemy].x}" y2="${positions[enemy].y}" stroke="#8b2c1a" stroke-width="1.5" opacity="0.3" />`;
            }
        });
    });

    // 节点
    allPolicies.forEach(p => {
        const policy = POLICY_GRAPH[p];
        const pos = positions[p];
        const isActive = ACTIVE_POLICIES.includes(p);
        const fill = isActive ? '#b8893a' : '#5a6a7a';
        const stroke = isActive ? '#2a1f15' : '#5a4a3a';
        svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${isActive ? 32 : 24}" fill="${fill}" stroke="${stroke}" stroke-width="${isActive ? 3 : 1}" />`;
        svg += `<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-size="11" fill="#f4e8d0" font-weight="${isActive ? 700 : 400}">${p}</text>`;
        if (isActive) {
            svg += `<text x="${pos.x}" y="${pos.y + 50}" text-anchor="middle" font-size="10" fill="#8b2c1a">●</text>`;
        }
    });

    svg += '</svg>';
    return svg;
}

// ====== 2. 派系动态关系 ======
// 每季各派系之间会动态互动（结盟/对抗）
function updateFactionDynamics() {
    const factions = GameState.factions;
    const era = GameState.script.era;
    
    // 文官 vs 宦官：当两者都强时加剧对抗
    if (factions.civil > 60 && factions.eunuch > 60) {
        pushNews('党争', '朝臣与阉竖势同水火，朝堂不安。', 'critical');
        factions.civil = Math.max(0, factions.civil - 2);
        factions.eunuch = Math.max(0, factions.eunuch - 2);
        factions.stability = factions.stability || 50;
        if (typeof GameState !== 'undefined' && GameState.stats) {
            GameState.stats.stability = Math.max(0, GameState.stats.stability - 3);
        }
    }
    
    // 武将 vs 宗室：边疆紧张时联手
    if (typeof GameState !== 'undefined' && GameState.stats && GameState.stats.frontier > 60) {
        factions.military = Math.min(100, factions.military + 3);
    }
    
    // 灾荒时外戚可能浑水摸鱼
    if (typeof GameState !== 'undefined' && GameState.stats && GameState.stats.refugees && GameState.stats.refugees > 60) {
        if (Math.random() < 0.1) {
            factions.consort = Math.min(100, factions.consort + 5);
            pushNews('外戚', '外戚趁灾荒扩充势力。', 'normal');
        }
    }
    
    // 自动恢复：过弱的派系会缓慢恢复
    Object.keys(factions).forEach(k => {
        if (factions[k] < 20) {
            factions[k] = Math.min(100, factions[k] + 1);
        }
        if (factions[k] > 95) {
            factions[k] = Math.max(0, factions[k] - 1);
        }
    });
}

// ====== 3. 个人仪表盘（玩家画像）======
function renderPersonalDashboard() {
    const s = GameState.stats;
    const f = GameState.factions;
    const score = computeOverallScore();

    return `
        <h3 class="section-title">天子画像</h3>
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="dashboard-label">综合评分</div>
                <div class="dashboard-value-big">${score}</div>
                <div class="dashboard-sub">治国理政总分</div>
                <div class="dashboard-bar">
                    <div class="dashboard-fill" style="width: ${score}%; background: ${score > 70 ? '#4a6a4a' : score > 40 ? '#b8893a' : '#8b2c1a'}"></div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-label">在位年数</div>
                <div class="dashboard-value-big">${GameState.currentYear + 1}</div>
                <div class="dashboard-sub">${SEASONS[GameState.currentSeason].name}${['孟','仲','季'][GameState.currentMonth]}月</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-label">累计决策</div>
                <div class="dashboard-value-big">${GameState.decisionsCount}</div>
                <div class="dashboard-sub">${_unlockedAchievements.length}/${ACHIEVEMENTS.length} 成就</div>
            </div>
        </div>

        <h3 class="section-title">五德（天子品德）</h3>
        <div class="wude-grid">
            ${renderWuDe('仁', s.stability, 100, '爱民', '安定天下')}
            ${renderWuDe('义', (f.civil + f.royal) / 2, 100, '尊贤', '群臣归心')}
            ${renderWuDe('礼', s.culture + s.prestige / 2, 100, '崇文', '教化昌明')}
            ${renderWuDe('智', s.adminEfficiency, 100, '明察', '百官奉法')}
            ${renderWuDe('信', s.mandate, 100, '敬天', '天命归心')}
        </div>

        <h3 class="section-title">九五之尊·朝报</h3>
        <div class="personal-summary">
            <div class="summary-row">
                <span>最繁盛资源</span><span>${getMaxResource()}</span>
            </div>
            <div class="summary-row">
                <span>最危急指标</span><span>${getMinResource()}</span>
            </div>
            <div class="summary-row">
                <span>最强派系</span><span>${getMaxFaction()}</span>
            </div>
            <div class="summary-row">
                <span>最弱派系</span><span>${getMinFaction()}</span>
            </div>
        </div>
    `;
}

function computeOverallScore() {
    const s = GameState.stats;
    const f = GameState.factions;
    const score = (
        s.stability * 0.25 +
        s.mandate * 0.20 +
        (100 - s.corruption) * 0.15 +
        s.prestige * 0.10 +
        s.adminEfficiency * 0.10 +
        (s.treasury > 0 ? 50 : 0) * 0.10 +
        (f.civil + f.military + f.royal + f.eunuch + f.consort) / 5 * 0.10
    );
    return Math.round(score);
}

function renderWuDe(name, value, max, sub1, sub2) {
    const percent = Math.min(100, Math.round((value / max) * 100));
    const color = percent > 70 ? '#4a6a4a' : percent > 40 ? '#b8893a' : '#8b2c1a';
    return `
        <div class="wude-card">
            <div class="wude-name">${name}</div>
            <div class="wude-bar">
                <div class="wude-fill" style="width: ${percent}%; background: ${color};"></div>
                <div class="wude-text">${percent}</div>
            </div>
            <div class="wude-sub">${sub1} · ${sub2}</div>
        </div>
    `;
}

function getMaxResource() {
    const s = GameState.stats;
    let max = 'treasury', val = s.treasury;
    ['food', 'population', 'militaryPower', 'navyPower', 'culture', 'mandate'].forEach(k => {
        if (s[k] > val) { max = k; val = s[k]; }
    });
    return `${RESOURCES[max].name} ${formatNumber(max, val)}`;
}

function getMinResource() {
    const s = GameState.stats;
    let min = 'treasury', val = s.treasury;
    ['food', 'population', 'stability', 'mandate'].forEach(k => {
        if (s[k] < val) { min = k; val = s[k]; }
    });
    return `${RESOURCES[min].name} ${formatNumber(min, val)}`;
}

function getMaxFaction() {
    let max = 'civil', val = 0;
    Object.entries(GameState.factions).forEach(([k, v]) => {
        if (v > val) { max = k; val = v; }
    });
    return `${FACTIONS[max].name} ${Math.round(val)}`;
}

function getMinFaction() {
    let min = 'civil', val = 100;
    Object.entries(GameState.factions).forEach(([k, v]) => {
        if (v < val) { min = k; val = v; }
    });
    return `${FACTIONS[min].name} ${Math.round(val)}`;
}

function formatNumber(key, val) {
    if (key === 'population') return Math.round(val / 10000) + '万';
    return Math.round(val);
}

// ====== 4. 军事调动系统 ======
// 行军/攻城：进度条 + 战报
const MILITARY_CAMPAIGNS = {
    bian: { name: '边关防御', duration: 8, cost: 2000, power: 0.8, supply: 0.8 },
    jing: { name: '京师保卫', duration: 6, cost: 1000, power: 1.0, supply: 1.0 },
    yuan: { name: '远征', duration: 16, cost: 5000, power: 0.6, supply: 0.4 },
    fang: { name: '平叛', duration: 10, cost: 3000, power: 0.9, supply: 0.6 }
};

function startCampaign(type, target) {
    const campaign = MILITARY_CAMPAIGNS[type];
    if (GameState.stats.treasury < campaign.cost) {
        pushNews('兵部', '军饷不足，请先充实国库。', 'critical');
        return;
    }
    if (GameState.stats.militaryPower < 2000) {
        pushNews('兵部', '兵不足用，请先募兵。', 'critical');
        return;
    }
    
    GameState.stats.treasury -= campaign.cost;
    GameState.activeCampaign = {
        type, target,
        name: campaign.name,
        progress: 0,
        duration: campaign.duration,
        totalCost: campaign.cost,
        power: campaign.power,
        startYear: GameState.currentYear,
        startSeason: GameState.currentSeason
    };
    pushNews('兵部', `已发动 ${campaign.name}，征 ${target}。`, 'normal');
    updateUI();
}

function advanceCampaign() {
    const c = GameState.activeCampaign;
    if (!c) return;
    
    c.progress++;
    c.progress = Math.min(c.progress, c.duration);
    
    // 进度事件
    if (c.progress === Math.floor(c.duration / 3)) {
        pushNews('军报', `${c.name}：前锋告捷。`, 'normal');
    }
    if (c.progress === Math.floor(c.duration * 2 / 3)) {
        if (Math.random() < 0.3) {
            pushNews('军报', `${c.name}：粮草告急！。`, 'critical');
            GameState.stats.militaryFood = Math.max(0, GameState.stats.militaryFood - 500);
        }
    }
    
    if (c.progress >= c.duration) {
        // 完成
        const success = Math.random() < c.power;
        if (success) {
            pushNews('军报', `${c.name}：大捷！`, 'normal');
            GameState.stats.prestige = Math.min(100, GameState.stats.prestige + 5);
            GameState.stats.militaryPower = Math.max(0, GameState.stats.militaryPower - 200);
        } else {
            pushNews('军报', `${c.name}：兵败，将帅折损。`, 'critical');
            GameState.stats.militaryPower = Math.max(0, GameState.stats.militaryPower - 800);
            GameState.stats.stability = Math.max(0, GameState.stats.stability - 5);
        }
        GameState.activeCampaign = null;
    }
}

function renderMilitaryOps() {
    const c = GameState.activeCampaign;
    return `
        <h3 class="section-title">行军作战</h3>
        ${c ? `
            <div class="campaign-card">
                <div class="campaign-name">${c.name}（征 ${c.target}）</div>
                <div class="campaign-progress">
                    <div class="campaign-bar">
                        <div class="campaign-fill" style="width: ${(c.progress/c.duration)*100}%"></div>
                    </div>
                    <div class="campaign-progress-text">${c.progress} / ${c.duration}</div>
                </div>
                <div class="campaign-info">耗时 ${c.duration}季 | 费 ${c.totalCost}两 | 胜率 ${Math.round(c.power*100)}%</div>
            </div>
        ` : `
            <div class="empty-state">无在行军。可点下方按钮发动战役。</div>
        `}
        <div class="campaign-buttons">
            ${Object.entries(MILITARY_CAMPAIGNS).map(([k, v]) => `
                <button class="campaign-btn" onclick="startCampaign('${k}', '${v.name}')">${v.name}（${v.cost}两）</button>
            `).join('')}
        </div>
        <h3 class="section-title">行军进度日志</h3>
        <div class="news-list" id="campaign-news"></div>
    `;
}

// ====== 5. 科举系统 ======
const EXAM_LEVELS = [
    { name: '县试', level: 1, basePass: 0.4, cost: 50, candidates: 500, season: 2 },
    { name: '府试', level: 2, basePass: 0.3, cost: 100, candidates: 200, season: 2 },
    { name: '院试', level: 3, basePass: 0.2, cost: 200, candidates: 80, season: 0 },
    { name: '殿试', level: 4, basePass: 0.5, cost: 0, candidates: 30, season: 1 }
];

function holdExam(level) {
    const exam = EXAM_LEVELS[level];
    if (GameState.stats.treasury < exam.cost) {
        pushNews('礼部', '国库不足，请先充实帑银。', 'critical');
        return null;
    }
    GameState.stats.treasury -= exam.cost;
    
    const cultureMod = (GameState.stats.culture - 50) / 100;
    const passRate = Math.max(0.05, Math.min(0.95, exam.basePass + cultureMod));
    const passed = Math.floor(exam.candidates * passRate);
    
    const rankings = [];
    for (let i = 0; i < passed; i++) {
        rankings.push({
            rank: i + 1,
            name: generateRandomName(),
            age: 18 + Math.floor(Math.random() * 15),
            origin: PROVINCES[Math.floor(Math.random() * PROVINCES.length)]
        });
    }
    
    return { exam, passed, rankings };
}

function renderExams() {
    return `
        <h3 class="section-title">科举制度</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            科举三年一科，本年 ${GameState.currentYear + 1}，距下次开科 ${(3 - GameState.currentYear % 3) % 3} 年。
        </p>
        <div class="exam-grid">
            ${EXAM_LEVELS.map((e, i) => `
                <div class="exam-card">
                    <div class="exam-level">${e.name}</div>
                    <div class="exam-info">
                        <div>考生：约 ${e.candidates} 人</div>
                        <div>通过率：${Math.round(e.basePass * 100)}%</div>
                        <div>耗费：${e.cost}两</div>
                        <div>开考：${['春','夏','秋','冬'][e.season]}季</div>
                    </div>
                    <button class="exam-btn" onclick="runExam(${i})">开科取士</button>
                </div>
            `).join('')}
        </div>
        <div id="exam-result"></div>
    `;
}

function runExam(level) {
    const result = holdExam(level);
    if (!result) return;
    const el = document.getElementById('exam-result');
    el.innerHTML = `
        <div class="exam-result-box">
            <h4>${result.exam.name}放榜</h4>
            <p>中式 ${result.passed} 人</p>
            <div class="exam-rankings">
                ${result.rankings.slice(0, 10).map(r => `
                    <div class="exam-ranking">
                        <span class="exam-rank">${r.rank}</span>
                        <span class="exam-name">${r.name}</span>
                        <span class="exam-age">${r.age}岁</span>
                        <span class="exam-origin">${r.origin}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    pushNews('礼部', `${result.exam.name}放榜，中式 ${result.passed} 人。`, 'normal');
    GameState.stats.culture = Math.min(100, GameState.stats.culture + 2);
}

function generateRandomName() {
    const sur = ['李','王','张','刘','陈','杨','赵','黄','周','吴','徐','孙','朱','高','林','何','郭','马'];
    const names = ['时中','子仁','景明','克勤','廷玉','世昌','汝楫','文忠','承业','梦得','德辉','元凯','子奇','宗周','希贤'];
    return sur[Math.floor(Math.random() * sur.length)] + names[Math.floor(Math.random() * names.length)];
}

const PROVINCES = ['北直隶','南直隶','山东','山西','河南','陕西','四川','湖广','江西','浙江','福建','广东','广西','云南','贵州'];

// ====== 6. 水利系统（黄河/运河）======
const WATER_SYSTEMS = [
    { id: 'yellow', name: '黄河', region: '京畿', length: 5464, capacity: 100, danger: 80, desc: '黄河善淤、善决、善徙。' },
    { id: 'grand', name: '大运河', region: '南北', length: 1794, capacity: 100, danger: 30, desc: '贯通南北之血脉。' },
    { id: 'wei', name: '渭河', region: '陕西', length: 818, capacity: 100, danger: 50, desc: '关中母亲河。' },
    { id: 'han', name: '汉水', region: '湖广', length: 1577, capacity: 100, danger: 40, desc: '长江最大支流。' }
];

function maintainWater(action, sysId) {
    const sys = WATER_SYSTEMS.find(s => s.id === sysId);
    if (action === 'build') {
        GameState.stats.treasury -= 2000;
        sys.danger = Math.max(0, sys.danger - 15);
        sys.capacity = Math.min(100, sys.capacity + 10);
        pushNews('工部', `修缮 ${sys.name}堤防，费 2000两。`, 'normal');
    } else if (action === 'monitor') {
        GameState.stats.treasury -= 500;
        sys.danger = Math.max(0, sys.danger - 5);
        pushNews('工部', `派员巡察 ${sys.name}，费 500两。`, 'normal');
    }
}

function renderWaterSystem() {
    return `
        <h3 class="section-title">四大水利</h3>
        <div class="water-grid">
            ${WATER_SYSTEMS.map(sys => `
                <div class="water-card">
                    <div class="water-name">${sys.name}</div>
                    <div class="water-region">${sys.region} · ${sys.length}里</div>
                    <div class="water-bars">
                        <div class="water-stat">
                            <span>容量</span>
                            <div class="water-bar"><div class="water-fill jade" style="width: ${sys.capacity}%"></div></div>
                            <span>${sys.capacity}</span>
                        </div>
                        <div class="water-stat">
                            <span>险情</span>
                            <div class="water-bar"><div class="water-fill ${sys.danger > 60 ? 'bad' : 'gold'}" style="width: ${sys.danger}%"></div></div>
                            <span>${sys.danger}</span>
                        </div>
                    </div>
                    <div class="water-desc">${sys.desc}</div>
                    <div class="water-actions">
                        <button class="water-btn" onclick="maintainWater('monitor', '${sys.id}')">巡察（500两）</button>
                        <button class="water-btn" onclick="maintainWater('build', '${sys.id}')">修筑（2000两）</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ====== 7. 灾荒赈济 ======
function startRelief(disasterType, region) {
    const reliefLevel = GameState.stats.corruption > 50 ? 0.3 : 0.7;  // 腐败影响赈济效率
    const cost = 1000;
    
    if (GameState.stats.treasury < cost) {
        pushNews('户部', '帑银不足，无法赈济。', 'critical');
        return;
    }
    
    GameState.stats.treasury -= cost;
    const eff = Math.random() < reliefLevel;
    if (eff) {
        pushNews('赈济', `${region}${disasterType}已赈济，万民复业。`, 'normal');
        GameState.stats.stability = Math.min(100, GameState.stats.stability + 5);
        GameState.stats.population = Math.floor(GameState.stats.population * 1.02);
    } else {
        pushNews('赈济', `${region}${disasterType}赈济款被侵吞，民怨沸腾！`, 'critical');
        GameState.stats.stability = Math.max(0, GameState.stats.stability - 8);
        GameState.stats.corruption = Math.min(100, GameState.stats.corruption + 3);
    }
}

function renderRelief() {
    return `
        <h3 class="section-title">灾荒赈济</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            当前腐败：${GameState.stats.corruption}（影响赈济效率${GameState.stats.corruption > 50 ? '·差' : '·良'}）
        </p>
        <div class="relief-grid">
            <button class="relief-btn" onclick="startRelief('旱灾', '陕西')">赈济陕西旱灾</button>
            <button class="relief-btn" onclick="startRelief('蝗灾', '北直隶')">赈济北直隶蝗灾</button>
            <button class="relief-btn" onclick="startRelief('水灾', '河南')">赈济河南水灾</button>
            <button class="relief-btn" onclick="startRelief('瘟疫', '江南')">赈济江南瘟疫</button>
        </div>
    `;
}

// ====== 8. 农时 24 节气 ======
const SOLAR_TERMS_DETAIL = {
    0: { name: '立春', month: 0, effect: { agriculture: 1 } },
    1: { name: '雨水', month: 0, effect: { agriculture: 1 } },
    2: { name: '惊蛰', month: 0, effect: { agriculture: 1 } },
    3: { name: '春分', month: 0, effect: { agriculture: 2 } },
    4: { name: '清明', month: 1, effect: { agriculture: 2 } },
    5: { name: '谷雨', month: 1, effect: { agriculture: 2 } },
    6: { name: '立夏', month: 1, effect: { agriculture: 2 } },
    7: { name: '小满', month: 1, effect: { agriculture: 2 } },
    8: { name: '芒种', month: 2, effect: { agriculture: 2 } },
    9: { name: '夏至', month: 2, effect: { agriculture: 1 } },
    10: { name: '小暑', month: 2, effect: { agriculture: 1 } },
    11: { name: '大暑', month: 2, effect: { agriculture: -1 } },
    12: { name: '立秋', month: 3, effect: { agriculture: 2 } },
    13: { name: '处暑', month: 3, effect: { agriculture: 1 } },
    14: { name: '白露', month: 3, effect: { agriculture: 1 } },
    15: { name: '秋分', month: 3, effect: { agriculture: 2 } },
    16: { name: '寒露', month: 3, effect: { agriculture: -1 } },
    17: { name: '霜降', month: 3, effect: { agriculture: -2 } },
    18: { name: '立冬', month: 3, effect: { stability: -1 } },
    19: { name: '小雪', month: 3, effect: { stability: -1 } },
    20: { name: '大雪', month: 3, effect: { stability: -2 } },
    21: { name: '冬至', month: 3, effect: { mandate: 2 } },
    22: { name: '小寒', month: 3, effect: { stability: -1 } },
    23: { name: '大寒', month: 3, effect: { stability: -2 } }
};

function renderSolarTerms() {
    return `
        <h3 class="section-title">二十四节气</h3>
        <div class="terms-grid">
            ${Object.entries(SOLAR_TERMS_DETAIL).map(([i, t]) => {
                const effectStr = Object.entries(t.effect).map(([k, v]) => {
                    const n = RESOURCES[k] ? RESOURCES[k].name : k;
                    return `${n}${v > 0 ? '+' : ''}${v}`;
                }).join(' ');
                return `
                    <div class="term-card season-${t.month}">
                        <div class="term-name">${t.name}</div>
                        <div class="term-effect">${effectStr}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ====== 9. 户部详细账目（经济第二面板）======
function renderHuBuDetail() {
    return `
        <h3 class="section-title">户部·赋役全书</h3>
        <div class="hufu-grid">
            <div class="hufu-card">
                <div class="hufu-title">夏税</div>
                <div class="hufu-progress">
                    <div class="hufu-fill" style="width: ${Math.min(100, GameState.stats.agriculture * 2)}%"></div>
                </div>
                <div class="hufu-value">${Math.round(GameState.stats.agriculture * 100)}两</div>
            </div>
            <div class="hufu-card">
                <div class="hufu-title">秋粮</div>
                <div class="hufu-progress">
                    <div class="hufu-fill" style="width: ${Math.min(100, GameState.stats.agriculture * 2.5)}%"></div>
                </div>
                <div class="hufu-value">${Math.round(GameState.stats.agriculture * 130)}两</div>
            </div>
            <div class="hufu-card">
                <div class="hufu-title">盐课</div>
                <div class="hufu-progress">
                    <div class="hufu-fill" style="width: ${Math.min(100, GameState.stats.commerce)}%"></div>
                </div>
                <div class="hufu-value">${Math.round(GameState.stats.commerce * 30)}两</div>
            </div>
            <div class="hufu-card">
                <div class="hufu-title">商税</div>
                <div class="hufu-progress">
                    <div class="hufu-fill" style="width: ${Math.min(100, GameState.stats.commerce)}%"></div>
                </div>
                <div class="hufu-value">${Math.round(GameState.stats.commerce * 20)}两</div>
            </div>
            <div class="hufu-card">
                <div class="hufu-title">市舶</div>
                <div class="hufu-progress">
                    <div class="hufu-fill" style="width: ${Math.min(100, GameState.stats.commerce / 2)}%"></div>
                </div>
                <div class="hufu-value">${GameState.stats.commerce > 50 ? Math.round(GameState.stats.commerce * 25) : 0}两</div>
            </div>
            <div class="hufu-card">
                <div class="hufu-title">辽饷</div>
                <div class="hufu-progress">
                    <div class="hufu-fill bad" style="width: ${Math.min(100, GameState.stats.frontier * 1.5)}%"></div>
                </div>
                <div class="hufu-value">${Math.round(GameState.stats.frontier * 80)}两</div>
            </div>
        </div>

        <h3 class="section-title">漕运粮道</h3>
        <div class="canal-grid">
            <div class="canal-stage">
                <div class="canal-name">① 征收</div>
                <div class="canal-progress">
                    <div class="canal-fill" style="width: ${Math.min(100, GameState.stats.agriculture)}%"></div>
                </div>
                <div class="canal-val">${Math.round(GameState.stats.agriculture * 50)}万石</div>
            </div>
            <div class="canal-arrow">→</div>
            <div class="canal-stage">
                <div class="canal-name">② 运输</div>
                <div class="canal-progress">
                    <div class="canal-fill" style="width: ${GameState.stats.canalEfficiency}%"></div>
                </div>
                <div class="canal-val">效率${GameState.stats.canalEfficiency}%</div>
            </div>
            <div class="canal-arrow">→</div>
            <div class="canal-stage">
                <div class="canal-name">③ 京仓</div>
                <div class="canal-progress">
                    <div class="canal-fill jade" style="width: ${Math.min(100, GameState.stats.food / 50)}%"></div>
                </div>
                <div class="canal-val">${GameState.stats.food}石</div>
            </div>
        </div>
    `;
}

// ====== 10. 战报系统 ======
const BATTLE_TYPES = [
    { name: '遭遇战', from: '不期', power: 0.5, supply: 1.0 },
    { name: '攻城战', from: '攻城', power: 0.3, supply: 0.5 },
    { name: '野战', from: '对阵', power: 0.6, supply: 1.0 },
    { name: '突袭', from: '偷袭', power: 0.8, supply: 1.0 },
    { name: '伏击', from: '设伏', power: 0.7, supply: 1.0 },
    { name: '撤退', from: '撤退', power: 0.4, supply: 1.5 }
];

function renderBattles() {
    return `
        <h3 class="section-title">战役类型（20 种阵法）</h3>
        <div class="battle-grid">
            ${BATTLE_TYPES.map(b => `
                <div class="battle-card">
                    <div class="battle-name">${b.name}</div>
                    <div class="battle-from">${b.from}</div>
                    <div class="battle-power">战力 × ${b.power} | 补给 × ${b.supply}</div>
                </div>
            `).join('')}
        </div>
    `;
}

console.log('✓ v3.0 系统扩展加载完成');

console.log('✓ 个人仪表盘系统已加载');