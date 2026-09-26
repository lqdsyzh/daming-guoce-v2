// ============================================
// 《大明国策》v3.1 奏折系统
// 完整明代流程：通政司递折 → 内阁票签 → 司礼监批红 → 圣裁 → 六部执行
// 仪式化：留中、封驳、廷议、密揭
// ============================================

// ====== 通政司（奏折入口）======
const TONGZHENG = {
    name: '通政使司',
    desc: '掌受内外章疏、敷奏、封驳之事',
    role: '天下奏折，先入通政司，再呈内阁'
};

// ====== 票签（内阁具体意见）======
// 明代内阁票签用单字批示
const VOTES = {
    shen:    { char: '准', name: '准', hint: '内阁票准', effect: 'approve' },
    zhe:     { char: '阁议', name: '阁议', hint: '内阁议复', effect: 'discuss' },
    bo:      { char: '驳', name: '驳', hint: '内阁封驳', effect: 'reject' },
    liuzhong:{ char: '留', name: '留中', hint: '内阁票留中不发', effect: 'hold' }
};

// ====== 司礼监（批红机构）======
const SILIFJIAN = {
    bingbi:  { name: '秉笔太监', desc: '代皇帝朱批', power: '掌批红' },
    zhangyin: { name: '掌印太监', desc: '用宝盖章', power: '掌用印' }
};

// ====== 廷议类型 ======
const COURT_MEETINGS = {
    tingyi: { name: '廷议', desc: '群臣合议', effect: { prestige: 3 } },
    tingtui: { name: '廷推', desc: '推举大臣', effect: { civil: 5 } },
    tingjun:{ name: '廷鞫', desc: '会审大案', effect: { corruption: -5 } }
};

// ====== 御批朱笔（皇帝亲笔）======
const IMPERIAL_EDICTS = {
    qinzhi:  { char: '钦此', name: '钦此', desc: '皇帝亲笔', class: 'zhubi', color: '#8b2c1a' },
    zhi:     { char: '知道了', name: '知道了', desc: '不置可否', class: 'mobi', color: '#5a4a3a' },
    zhunzhi: { char: '准', name: '准', desc: '准奏', class: 'zhubi', color: '#8b2c1a' },
    buzhi:   { char: '不准', name: '不准', desc: '驳回', class: 'zhubi', color: '#8b2c1a' },
    dan:     { char: '但', name: '但', desc: '转折', class: 'mobi', color: '#5a4a3a' },
    you:     { char: '有旨', name: '有旨', desc: '皇帝亲裁', class: 'zhubi', color: '#8b2c1a' },
    yu:      { char: '御', name: '御批', desc: '亲笔批示', class: 'zhubi', color: '#8b2c1a' }
};

// ====== 奏折流程 ======
// 通政司 → 内阁 → 司礼监 → 皇帝
// 每个环节都有"是否通过"判定
const MEMORIAL_FLOW = [
    { dept: '通政司', name: '通政使司', icon: '通', desc: '受奏', timeout: 1 },
    { dept: '内阁', name: '内阁', icon: '阁', desc: '票签', timeout: 2 },
    { dept: '司礼监', name: '司礼监', icon: '监', desc: '批红', timeout: 1 },
    { dept: '皇帝', name: '圣裁', icon: '帝', desc: '亲批', timeout: 1 }
];

// ====== 生成完整奏折 ======
function generateFullMemorial() {
    const templates = [
        {
            from: { dept: '兵部', person: '兵部尚书', title: '议' },
            title: '九边军情紧急',
            content: '本月虏酋入寇辽东、宣府三处，合计劫掠人畜数万。臣请旨增发军饷，增兵五千。',
            tag: '急奏',
            budget: 5000,
            suggestions: [
                { text: '准拨', hint: '国库-5000 | 军力+1500 | 武将+8', effect: { treasury: -5000, militaryPower: 1500, military: 8, frontier: -8 } },
                { text: '廷议', hint: '稳定+3 | 威望+3 | 派系均', effect: { stability: 3, prestige: 3, civil: 3, military: 3 } },
                { text: '留中', hint: '暂不批复', effect: { _hold: true } },
                { text: '封驳', hint: '驳回原奏，命其另议', effect: { military: -5 } }
            ]
        },
        {
            from: { dept: '户部', person: '户部尚书', title: '奏' },
            title: '国库入不敷出',
            content: '今年夏税少征，秋粮亦减。加以九边军饷，库帑已空。臣请开源节流。',
            tag: '本章',
            budget: 0,
            suggestions: [
                { text: '发内帑', hint: '内帑-3000 | 国库+3000 | 外戚-3', effect: { privyPurse: -3000, treasury: 3000, consort: -3 } },
                { text: '加派', hint: '国库+2000 | 稳定-8 | 流民+5', effect: { treasury: 2000, stability: -8, refugees: 5 } },
                { text: '捐纳', hint: '国库+1000 | 腐败+5 | 声望-3', effect: { treasury: 1000, corruption: 5, prestige: -3 } },
                { text: '裁冗', hint: '国库+800 | 文官-8 | 行政-3', effect: { treasury: 800, civil: -8, adminEfficiency: -3 } }
            ]
        },
        {
            from: { dept: '礼部', person: '礼部尚书', title: '题' },
            title: '请颁诏罪己',
            content: '天象屡变，星变示警。臣请颁诏罪己，以收民心。',
            tag: '本章',
            budget: 0,
            suggestions: [
                { text: '准罪己', hint: '天命+8 | 稳定+5 | 威望+5', effect: { mandate: 8, stability: 5, prestige: 5 } },
                { text: '廷议', hint: '稳定+3 | 威望+3', effect: { stability: 3, prestige: 3 } },
                { text: '不罪己', hint: '威严+5 | 稳定-3 | 文官-3', effect: { prestige: 5, stability: -3, civil: -3 } }
            ]
        },
        {
            from: { dept: '刑部', person: '刑部侍郎', title: '题' },
            title: '弹劾奏疏',
            content: '臣弹劾某侍郎贪墨，请旨严查。',
            tag: '本章',
            budget: 0,
            suggestions: [
                { text: '准严查', hint: '稳定+3 | 文官-3 | 腐败-5', effect: { stability: 3, civil: -3, corruption: -5 } },
                { text: '留中', hint: '暂不批复', effect: { _hold: true } },
                { text: '反坐', hint: '稳定-3 | 文官-5 | 威望+3', effect: { stability: -3, civil: -5, prestige: 3 } }
            ]
        },
        {
            from: { dept: '吏部', person: '吏部尚书', title: '题' },
            title: '请行京察',
            content: '六年京察之期已至。臣请旨考核群臣。',
            tag: '本章',
            budget: 500,
            suggestions: [
                { text: '准行', hint: '稳定+3 | 威望+5 | 文官-5 | 腐败-3', effect: { stability: 3, prestige: 5, civil: -5, corruption: -3, treasury: -500 } },
                { text: '走过场', hint: '稳定-2 | 文官+5 | 腐败+2', effect: { stability: -2, civil: 5, corruption: 2 } },
                { text: '打压异己', hint: '文官-8 | 宦官+5 | 稳定-3', effect: { civil: -8, eunuch: 5, stability: -3 } }
            ]
        },
        {
            from: { dept: '工部', person: '工部尚书', title: '题' },
            title: '请修黄河堤',
            content: '黄河堤决口三处。请旨拨帑银修筑。',
            tag: '急奏',
            budget: 3000,
            suggestions: [
                { text: '准修', hint: '国库-3000 | 稳定+5 | 农业+5', effect: { treasury: -3000, stability: 5, agriculture: 5 } },
                { text: '暂缓', hint: '稳定-3 | 文官-3', effect: { stability: -3, civil: -3 } }
            ]
        },
        {
            from: { dept: '都察院', person: '御史', title: '题' },
            title: '密揭宦官',
            content: '臣密奏：中官某人勾结外臣，恐有不轨。',
            tag: '密奏',
            budget: 0,
            suggestions: [
                { text: '命东厂查', hint: '宦官-5 | 稳定-3 | 东厂权+5', effect: { eunuch: -5, stability: -3, _dongchang: 5 } },
                { text: '命锦衣卫查', hint: '宦官-5 | 稳定+3', effect: { eunuch: -5, stability: 3 } },
                { text: '留中', hint: '暂不批复', effect: { _hold: true } },
                { text: '反坐', hint: '文官-8 | 宦官+5', effect: { civil: -8, eunuch: 5 } }
            ]
        },
        {
            from: { dept: '通政司', person: '通政使', title: '转' },
            title: '地方官奏报',
            content: '陕西布政使司奏：今岁旱灾，赤地千里，请赈济。',
            tag: '本章',
            budget: 1500,
            suggestions: [
                { text: '赈济', hint: '国库-1500 | 稳定+5 | 流民-3', effect: { treasury: -1500, stability: 5, refugees: -3 } },
                { text: '改折', hint: '稳定-3 | 流民+5', effect: { stability: -3, refugees: 5 } }
            ]
        }
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

// ====== 显示奏折（v3.1 仪式化）======
function showMemorialV31() {
    const memorial = generateFullMemorial();
    const modal = document.getElementById('memorial-modal');
    if (!modal) return;
    
    // 内阁票签
    const piQian = Object.values(VOTES)[Math.floor(Math.random() * 4)];
    
    // 司礼监意见
    const sili = piQian.effect === 'approve' ? SILIFJIAN.bingbi : 
                  piQian.effect === 'reject' ? '驳' : '阁票';
    
    // 填充内容
    document.getElementById('memorial-ministry').textContent = memorial.from.dept + ' · ' + memorial.tag;
    document.getElementById('memorial-title').textContent = memorial.title;
    document.getElementById('memorial-content').textContent = 
        `${memorial.from.person} ${memorial.from.title}曰：${memorial.content}`;
    
    document.getElementById('pini-text').textContent = 
        `${piQian.char} · ${piQian.name}`;
    document.getElementById('pini-reason').textContent = 
        `【通政司】受 | 【内阁】票：${piQian.name}（${piQian.hint}） | 【司礼监】代批：${sili}`;
    document.getElementById('seal-name').textContent = `用制诰之宝 · 钦此`;
    document.getElementById('seal-desc').textContent = '朱文方印 · 皇帝亲批';
    
    // 选项
    const choicesContainer = document.getElementById('memorial-choices');
    choicesContainer.innerHTML = '';
    
    memorial.suggestions.forEach(opt => {
        if (opt.effect._hold) {
            // 留中
            const optEl = document.createElement('div');
            optEl.className = 'memorial-option memorial-option-hold';
            optEl.innerHTML = `
                <div class="memorial-option-seal memorial-seal-hold">留</div>
                <div class="memorial-option-body">
                    <div class="memorial-option-verb">${opt.text}</div>
                    <div class="memorial-option-text">${opt.hint}</div>
                </div>
            `;
            optEl.onclick = () => {
                pushNews('内廷', `奏折留中不发。${memorial.title}`, 'normal');
                modal.classList.remove('active');
                GameState.decisionsCount++;
                advanceSeason();
            };
            choicesContainer.appendChild(optEl);
            return;
        }
        
        const optEl = document.createElement('div');
        optEl.className = 'memorial-option';
        optEl.innerHTML = `
            <div class="memorial-option-seal">御</div>
            <div class="memorial-option-body">
                <div class="memorial-option-verb">${opt.text}</div>
                <div class="memorial-option-text">${opt.hint}</div>
            </div>
        `;
        optEl.onclick = () => {
            // 移除特殊标记
            const eff = { ...opt.effect };
            delete eff._hold;
            delete eff._dongchang;
            applyDecision(eff);
            
            addToHistory({
                title: memorial.title,
                type: 'internal'
            }, { text: opt.text });
            
            pushNews('内廷', `${memorial.from.dept} ${opt.text}：${memorial.title}`, 'normal');
            modal.classList.remove('active');
            GameState.decisionsCount++;
            advanceSeason();
        };
        choicesContainer.appendChild(optEl);
    });
    
    modal.classList.add('active');
}

console.log('✓ 奏折v3.1重做完成（票签/留中/封驳/廷议/密揭）');