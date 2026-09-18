// ============================================
// 《大明国策》v2.1 大臣主动上奏系统
// 大臣根据局势自动提出建议
// ============================================

const MINISTER_ADVICE = [
    // ===== 国库相关 =====
    {
        condition: (s) => s.stats.treasury > 15000 && s.stats.stability < 60,
        minister: { cat: 'civil', idx: 0 },
        title: '国库充盈而民困',
        text: '府库虽满，闾阎困苦。臣请发赈济贫，俾民受实惠。',
        options: [
            { text: '准奏，发内帑赈济', effect: { privyPurse: -3000, stability: 8, civil: 8 } },
            { text: '从长计议', effect: { civil: -3 } }
        ]
    },
    {
        condition: (s) => s.stats.treasury < 0,
        minister: { cat: 'civil', idx: 1 },
        title: '国库告急',
        text: '国库已空，兵饷无出。臣请裁汰冗员，节流以济。',
        options: [
            { text: '准奏', effect: { treasury: 3000, civil: -8, stability: -3 } },
            { text: '暂缓', effect: { civil: 3, treasury: -500 } }
        ]
    },
    {
        condition: (s) => s.stats.treasury < 0 && s.stats.corruption > 50,
        minister: { cat: 'civil', idx: 0 },
        title: '冗员冗费',
        text: '国用不足，臣以为冗员冗费所致。恳请大加裁汰。',
        options: [
            { text: '准奏，裁汰冗员', effect: { treasury: 5000, civil: -10, stability: -5 } },
            { text: '斥之', effect: { civil: 5 } }
        ]
    },

    // ===== 边患 =====
    {
        condition: (s) => s.stats.frontier > 60,
        minister: { cat: 'military', idx: 0 },
        title: '边事告急',
        text: '虏酋入寇，九边震恐。臣请增兵屯田，以固疆圉。',
        options: [
            { text: '准奏', effect: { treasury: -2000, militaryPower: 1000, military: 8, frontier: -8 } },
            { text: '命边将便宜行事', effect: { military: 3 } }
        ]
    },
    {
        condition: (s) => s.stats.frontier > 70 && s.stats.militaryPower < 5000,
        minister: { cat: 'military', idx: 1 },
        title: '军饷告急',
        text: '九边军饷拖欠数月，将士有哗变之虞。',
        options: [
            { text: '立刻拨饷', effect: { treasury: -3000, military: 12, stability: 5 } },
            { text: '暂缓', effect: { military: -10, stability: -8 } }
        ]
    },

    // ===== 民生 =====
    {
        condition: (s) => s.stats.population < 40000000,
        minister: { cat: 'civil', idx: 2 },
        title: '生民流离',
        text: '户口减半，田野荒芜。臣请招抚流民，贷以牛种。',
        options: [
            { text: '准奏', effect: { treasury: -2000, population: 5000000, stability: 5, civil: 5 } },
            { text: '容后再议', effect: { civil: -3 } }
        ]
    },
    {
        condition: (s) => s.stats.canalEfficiency < 20,
        minister: { cat: 'civil', idx: 1 },
        title: '漕运淤塞',
        text: '运河久不疏浚，漕船难行。臣请拨帑银疏浚。',
        options: [
            { text: '准奏', effect: { treasury: -1500, canalEfficiency: 10, food: 500, civil: 5 } },
            { text: '缓议', effect: { civil: -3 } }
        ]
    },

    // ===== 吏治 =====
    {
        condition: (s) => s.stats.corruption > 50,
        minister: { cat: 'civil', idx: 0 },
        title: '吏治腐败',
        text: '臣闻道路传言，州县官多有侵吞赋税者。恳请遣使案验。',
        options: [
            { text: '准奏', effect: { stability: 5, corruption: -8, civil: -3 } },
            { text: '不必', effect: { corruption: 3 } }
        ]
    },
    {
        condition: (s) => s.stats.stability < 40,
        minister: { cat: 'civil', idx: 2 },
        title: '天变示警',
        text: '日食星变，国有大忧。臣请下诏罪己，征求直言。',
        options: [
            { text: '罪己诏，求直言', effect: { mandate: 5, stability: 8, civil: 5, prestige: 5 } },
            { text: '不必', effect: { civil: -5 } }
        ]
    },

    // ===== 党争 =====
    {
        condition: (s) => s.factions.civil > 80,
        minister: { cat: 'civil', idx: 0 },
        title: '文臣跋扈',
        text: '六部权重，阁臣跋扈。臣请分散事权，以收揽权柄。',
        options: [
            { text: '准奏', effect: { civil: -10, bureaucracy: -5, imperial: 8 } },
            { text: '不允', effect: { civil: 5 } }
        ]
    },
    {
        condition: (s) => s.factions.eunuch > 80,
        minister: { cat: 'civil', idx: 0 },
        title: '阉宦乱政',
        text: '中官窃柄，群臣屏息。臣请裁抑宦官，以正朝纲。',
        options: [
            { text: '准奏', effect: { eunuch: -15, civil: 8, stability: -5 } },
            { text: '不允', effect: { civil: -3, eunuch: 3 } }
        ]
    },

    // ===== 军事 =====
    {
        condition: (s) => s.stats.militaryPower < 4000 && s.factions.military > 50,
        minister: { cat: 'military', idx: 0 },
        title: '兵不足用',
        text: '军伍缺额，器械不修。臣请募兵并铸造军器。',
        options: [
            { text: '准奏', effect: { treasury: -2000, militaryPower: 1500, military: 8, gunpowder: 200 } },
            { text: '缓行', effect: { military: -5 } }
        ]
    },

    // ===== 文化 =====
    {
        condition: (s) => s.stats.culture < 30,
        minister: { cat: 'civil', idx: 0 },
        title: '文教废弛',
        text: '太学久废，士子无进身之阶。臣请增广生员。',
        options: [
            { text: '准奏', effect: { treasury: -500, culture: 8, civil: 5 } },
            { text: '不必', effect: { civil: -3 } }
        ]
    },

    // ===== 皇族 =====
    {
        condition: (s) => s.factions.royal > 70,
        minister: { cat: 'civil', idx: 1 },
        title: '宗藩坐大',
        text: '诸王护卫日增，恐有不轨之徒。臣请量加裁抑。',
        options: [
            { text: '准奏', effect: { royal: -10, civil: 5, stability: -3 } },
            { text: '不必', effect: { royal: 5 } }
        ]
    }
];

// 随机挑一个符合条件的事件
function pickMinisterAdvice() {
    const candidates = MINISTER_ADVICE.filter(a => a.condition(GameState));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// 主动上奏作为事件
function triggerMinisterAdvice() {
    const advice = pickMinisterAdvice();
    if (!advice) return false;

    const minister = GameState.ministers[advice.minister.cat][advice.minister.idx];
    const modal = document.getElementById('event-modal');
    document.getElementById('event-header').textContent = 
        `${SEASONS[GameState.currentSeason].name} · 急奏`;
    document.getElementById('event-title').textContent = advice.title;
    document.getElementById('event-content').textContent = 
        `${minister.name}（${minister.rank}）奏曰：${advice.text}`;

    const choicesContainer = document.getElementById('event-choices');
    choicesContainer.innerHTML = '';
    advice.options.forEach(opt => {
        const optEl = document.createElement('div');
        optEl.className = 'decision-option';
        const hint = formatEffectHint(opt.effect);
        optEl.innerHTML = `
            <span>${opt.text}</span>
            <span class="decision-option-hint">${hint}</span>
        `;
        optEl.onclick = () => {
            applyDecision(opt.effect);
            addToHistory({ title: advice.title, type: 'internal' }, opt);
            pushNews('急奏', `${minister.name}言事，陛下${opt.text}。`, 'normal');
            modal.classList.remove('active');
            GameState.decisionsCount++;
            advanceSeason();
        };
        choicesContainer.appendChild(optEl);
    });
    modal.classList.add('active');
    return true;
}

console.log('✓ 大臣主动上奏系统已加载');
