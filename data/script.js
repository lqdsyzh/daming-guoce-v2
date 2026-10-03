// ============================================
// 《大明国策》游戏数据
// 完整规格：22资源 / 5派系 / 四季 / 50+事件
// ============================================

// ====== 22个核心资源 ======
const RESOURCES = {
    treasury:      { name: '国库',   icon: '银', group: 'economic',  desc: '朝廷财政' },
    privyPurse:    { name: '内帑',   icon: '帑', group: 'economic',  desc: '皇帝私房钱' },
    food:          { name: '粮食',   icon: '粮', group: 'economic',  desc: '基础粮食储备' },
    militaryFood:  { name: '军粮',   icon: '饷', group: 'economic',  desc: '军需储备' },
    gunpowder:     { name: '火药',   icon: '药', group: 'economic',  desc: '火攻与神机营' },
    iron:          { name: '铁矿',   icon: '铁', group: 'economic',  desc: '兵器原料' },
    wood:          { name: '木材',   icon: '木', group: 'economic',  desc: '造船与建筑' },
    stone:         { name: '石料',   icon: '石', group: 'economic',  desc: '城墙与奇观' },
    horses:        { name: '马匹',   icon: '马', group: 'economic',  desc: '骑兵与运输' },
    population:    { name: '人口',   icon: '丁', group: 'society',   desc: '在籍人口（万）' },
    stability:     { name: '稳定',   icon: '稳', group: 'society',   desc: '社会安定' },
    prestige:      { name: '威望',   icon: '望', group: 'society',   desc: '朝廷威信' },
    militaryPower: { name: '军力',   icon: '军', group: 'military',  desc: '陆军总数' },
    navyPower:     { name: '水师',   icon: '舟', group: 'military',  desc: '海军总数' },
    mandate:       { name: '天命',   icon: '命', group: 'special',   desc: '天命所归' },
    adminEfficiency:{ name: '行政效率', icon: '政', group: 'internal', desc: '官僚系统效率' },
    corruption:    { name: '腐败',   icon: '腐', group: 'internal',  desc: '腐败程度' },
    culture:       { name: '文化',   icon: '文', group: 'internal',  desc: '教化与科举' },
    tech:          { name: '科技',   icon: '技', group: 'internal',  desc: '工艺水平' },
    commerce:      { name: '商业',   icon: '商', group: 'economic',  desc: '商税与贸易' },
    agriculture:   { name: '农业',   icon: '农', group: 'economic',  desc: '粮产' },
    canalEfficiency:{ name: '漕运',  icon: '漕', group: 'economic',  desc: '粮食运输' },
    vassals:       { name: '藩属',   icon: '藩', group: 'diplomacy', desc: '朝贡国数量' }
};

// 资源分组
const RESOURCE_GROUPS = {
    economic:  { name: '经济', color: '#b8893a' },
    society:   { name: '民生', color: '#4a6a4a' },
    military:  { name: '军事', color: '#8b2c1a' },
    internal:  { name: '内政', color: '#6a5a4a' },
    special:   { name: '天象', color: '#5a4a3a' },
    diplomacy: { name: '外交', color: '#5a6a7a' }
};

// ====== 5个派系 ======
const FACTIONS = {
    civil:    { name: '文官集团',  initial: 60, min: 40, org: '六部+内阁',          hostility: '文官怠政：国库-5%',     overreach: '结党营私，天命-3' },
    military: { name: '武将集团',  initial: 60, min: 30, org: '五军都督+九边',      hostility: '兵变：军力-10%',         overreach: '拥兵自重，天命-3' },
    royal:    { name: '宗室藩王',  initial: 50, min: 20, org: '各地藩王府',          hostility: '靖难之兆：稳定-10',      overreach: '藩王坐大，天命-3' },
    eunuch:   { name: '宦官集团',  initial: 50, min: 25, org: '司礼监+禁府',         hostility: '宦官专权：天命-5',       overreach: '专权乱政，天命-3' },
    consort:  { name: '外戚集团',  initial: 55, min: 15, org: '后妃家族',            hostility: '外戚干政：天命-5',       overreach: '外戚篡权，天命-3' }
};

// ====== 稳定度等级（影响税收/人口/叛乱/士气） ======
const STABILITY_LEVELS = [
    { min: 85, name: '鼎盛', taxMod: 1.15, popMod: 1.30, rebelMod: 0.00, moraleMod: 10 },
    { min: 65, name: '稳定', taxMod: 1.05, popMod: 1.10, rebelMod: 0.02, moraleMod: 5 },
    { min: 45, name: '正常', taxMod: 1.00, popMod: 1.00, rebelMod: 0.05, moraleMod: 0 },
    { min: 25, name: '不稳', taxMod: 0.90, popMod: 0.90, rebelMod: 0.15, moraleMod: -5 },
    { min: 10, name: '危机', taxMod: 0.75, popMod: 0.70, rebelMod: 0.30, moraleMod: -10 },
    { min: 0,  name: '崩溃', taxMod: 0.50, popMod: 0.50, rebelMod: 0.50, moraleMod: -20 }
];

// ====== 弹劾十种下场 ======
const PUNISHMENTS = {
    dismiss:      { name: '驳回弹劾', loyalty: 10, stability: 0, treasury: 0,    demote: 0, death: false, exile: false },
    reprimand:    { name: '训诫留用', loyalty: -5, stability: 1, treasury: 0,    demote: 0, death: false, exile: false },
    fine:         { name: '罚俸半年', loyalty: -10, stability: 2, treasury: 5000, demote: 0, death: false, exile: false },
    demote:       { name: '降级留用', loyalty: -15, stability: 3, treasury: 0,    demote: 1, death: false, exile: false },
    transfer:     { name: '调离要职', loyalty: -8, stability: 1, treasury: 0,    demote: 2, death: false, exile: false },
    dismiss_home: { name: '罢官回乡', loyalty: -20, stability: 5, treasury: 10000, demote: 99, death: false, exile: false },
    confiscate:   { name: '抄家流放', loyalty: 0, stability: 8, treasury: 50000, demote: 99, death: false, exile: true },
    imprison:     { name: '下狱审问', loyalty: 0, stability: 3, treasury: 0,    demote: 99, death: false, exile: false },
    execute:      { name: '斩首示众', loyalty: 0, stability: -3, treasury: 30000, demote: 99, death: true, exile: false },
    exterminate:  { name: '诛族',     loyalty: 0, stability: -10, treasury: 100000, demote: 99, death: true, exile: false }
};

// ====== 季节系统（春/夏/秋/冬） ======
const SEASONS = {
    0: {
        name: '春', month: '正月-三月', icon: '春',
        effect: '万物复苏',
        income: [
            { resource: 'food', formula: '300 * (agriculture/50)' },
            { resource: 'population', formula: 'population * 0.002 * (stability/60)' }
        ],
        expense: '俸禄500 + 军费(军力*0.1)'
    },
    1: {
        name: '夏', month: '四月-六月', icon: '夏',
        effect: '练兵时节',
        income: [
            { resource: 'militaryPower', formula: '100 * (adminEfficiency/50)' }
        ],
        expense: '同上'
    },
    2: {
        name: '秋', month: '七月-九月', icon: '秋',
        effect: '秋收入库',
        income: [
            { resource: 'treasury', formula: '800 * (1-corruption/100) * (adminEfficiency/50)' },
            { resource: 'food', formula: '500 * (agriculture/50)' }
        ],
        expense: '同上'
    },
    3: {
        name: '冬', month: '十月-十二月', icon: '冬',
        effect: '朝贡时节',
        income: [
            { resource: 'prestige', formula: '3 + vassals*0.5' },
            { resource: 'mandate', formula: '2' }
        ],
        expense: '同上'
    }
};

// ====== 事件库 ======
// type: disaster/border/internal/economy/diplomacy/royal
// effect中的key对应RESOURCES或FACTIONS的key

const EVENTS = {
    // ========== 灾害类（8个）==========
    disaster_locust: {
        title: '飞蝗蔽天',
        type: 'disaster',
        desc: '北直隶蝗灾，稼穑殆尽。',
        options: [
            { text: '开仓赈灾', effect: { food: -800, stability: 10, civil: 8, military: -2, prestige: 2 } },
            { text: '征发徭役灭蝗', effect: { food: -200, stability: -5, civil: -5, military: 3, prestige: -3 } },
            { text: '置之不理', effect: { stability: -15, civil: -10, prestige: -5 } }
        ]
    },
    disaster_yellow_river: {
        title: '黄河决口',
        type: 'disaster',
        desc: '开封河决，淹没良田万顷。',
        options: [
            { text: '拨款修堤', effect: { treasury: -1200, stability: 8, civil: 5, military: -2 } },
            { text: '征发民夫', effect: { food: -300, stability: -3, civil: -8, military: 2 } },
            { text: '顺其自然', effect: { stability: -18, civil: -12, food: -500 } }
        ]
    },
    disaster_drought: {
        title: '赤地千里',
        type: 'disaster',
        desc: '陕西大旱，颗粒无收。',
        options: [
            { text: '开官仓赈济', effect: { food: -1000, stability: 8, civil: 8, prestige: 5 } },
            { text: '祈雨祭天', effect: { mandate: 5, prestige: 3, stability: 1 } },
            { text: '强制征粮', effect: { food: 500, stability: -15, civil: -10, military: 3 } }
        ]
    },
    disaster_plague: {
        title: '瘟疫横行',
        type: 'disaster',
        desc: '江南瘟疫，十室九空。',
        options: [
            { text: '派医官救治', effect: { treasury: -800, stability: 5, civil: 6, eunuch: 3 } },
            { text: '隔离疫区', effect: { food: -200, stability: -5, military: 5, civil: -3 } },
            { text: '祭祀祈福', effect: { prestige: -2, stability: -3, mandate: 3, civil: -2 } }
        ]
    },
    disaster_earthquake: {
        title: '地动山摇',
        type: 'disaster',
        desc: '京师地震，宫殿倾颓。',
        options: [
            { text: '修缮宫殿', effect: { treasury: -1500, prestige: 5, stability: 3 } },
            { text: '减免赋税', effect: { food: -200, stability: 8, civil: 5, prestige: 5 } },
            { text: '不理会', effect: { stability: -10, prestige: -5, mandate: -5 } }
        ]
    },
    disaster_snow: {
        title: '大雪成灾',
        type: 'disaster',
        desc: '北疆雪灾，冻死牛羊无数。',
        options: [
            { text: '调拨粮草', effect: { food: -600, stability: 6, military: 5, civil: 3 } },
            { text: '令边军自救', effect: { military: -3, stability: -4, food: -200 } },
            { text: '不管', effect: { stability: -12, military: -8, prestige: -3 } }
        ]
    },
    disaster_locust_2: {
        title: '蝗蝻复起',
        type: 'disaster',
        desc: '蝗蝻食苗，秋粮堪忧。',
        options: [
            { text: '火焚药薰', effect: { treasury: -400, food: 300, stability: 2, civil: 3 } },
            { text: '以工代赈', effect: { food: -300, stability: 5, civil: 5, treasury: -300 } },
            { text: '坐视不理', effect: { food: -700, stability: -8, prestige: -3 } }
        ]
    },
    disaster_tsunami: {
        title: '海啸涌潮',
        type: 'disaster',
        desc: '东南海啸，毁屋溺人。',
        options: [
            { text: '抚恤灾民', effect: { treasury: -700, stability: 6, civil: 5 } },
            { text: '整饬海防', effect: { treasury: -500, military: 5, prestige: 3 } },
            { text: '听之任之', effect: { stability: -10, civil: -8 } }
        ]
    },
    
    // ========== 边患类（7个）==========
    border_tartar: {
        title: '鞑靼犯边',
        type: 'border',
        desc: '鞑靼骑兵破关，劫掠边民。',
        options: [
            { text: '出兵迎击', effect: { militaryPower: -500, prestige: 8, military: 10, civil: -3, treasury: -1000 } },
            { text: '坚壁清野', effect: { food: -300, stability: -3, military: -5, prestige: -2 } },
            { text: '纳贡求和', effect: { treasury: -1500, prestige: -8, military: -8, stability: -2 } }
        ]
    },
    border_wokou: {
        title: '倭寇劫掠',
        type: 'border',
        desc: '倭寇登陆浙闽，烧杀淫掠。',
        options: [
            { text: '派兵剿倭', effect: { militaryPower: -300, prestige: 6, military: 8, treasury: -800 } },
            { text: '加强海禁', effect: { treasury: 200, stability: -3, civil: -5, eunuch: 5 } },
            { text: '招安海盗', effect: { treasury: -400, stability: 2, military: -3 } }
        ]
    },
    border_tusi: {
        title: '土司叛乱',
        type: 'border',
        desc: '云南土司反，攻城略地。',
        options: [
            { text: '出兵平叛', effect: { militaryPower: -600, prestige: 5, military: 8, treasury: -1200 } },
            { text: '招抚土司', effect: { prestige: 3, stability: 2, treasury: -500 } },
            { text: '改土归流', effect: { civil: 5, stability: -5, royal: -5, prestige: 4 } }
        ]
    },
    border_pay: {
        title: '边军缺饷',
        type: 'border',
        desc: '九边欠饷，兵有怨言。',
        options: [
            { text: '立刻拨饷', effect: { treasury: -1500, military: 12, stability: 5 } },
            { text: '拖欠部分', effect: { treasury: -500, military: -8, stability: -5 } },
            { text: '削减编制', effect: { militaryPower: -1000, treasury: 500, military: -15, stability: -10 } }
        ]
    },
    border_strife: {
        title: '武将争功',
        type: 'border',
        desc: '总兵与监军互讦，请旨定夺。',
        options: [
            { text: '偏袒总兵', effect: { military: 8, eunuch: -8, stability: -2 } },
            { text: '偏袒监军', effect: { eunuch: 8, military: -8, stability: -2 } },
            { text: '各打五十大板', effect: { military: -3, eunuch: -3, stability: 3, prestige: 2 } }
        ]
    },
    border_jurchen: {
        title: '女真崛起',
        type: 'border',
        desc: '辽东女真强盛，渐成边患。',
        options: [
            { text: '整饬武备', effect: { treasury: -800, militaryPower: 300, military: 6, prestige: 3 } },
            { text: '开放互市安抚', effect: { treasury: 300, stability: 2, military: -3 } },
            { text: '不予理会', effect: { stability: -2, prestige: -3 } }
        ]
    },
    border_haifang: {
        title: '海防松弛',
        type: 'border',
        desc: '闽浙卫所空虛，海防废弛。',
        options: [
            { text: '拨款整修', effect: { treasury: -600, militaryPower: 200, military: 5, prestige: 2 } },
            { text: '暂缓', effect: { stability: -2, military: -3 } },
            { text: '强征民船', effect: { treasury: 200, stability: -5, civil: -5, military: 3 } }
        ]
    },
    
    // ========== 内政类（20个）==========
    internal_recommend: {
        title: '举荐贤才',
        type: 'internal',
        desc: '侍郎荐人，请旨录用。',
        options: [
            { text: '直接录用', effect: { prestige: 3, civil: 8, eunuch: -5 } },
            { text: '驳回', effect: { civil: -5, prestige: -2 } },
            { text: '调查后再定', effect: { treasury: -200, stability: 2, civil: 2, eunuch: 5 } }
        ]
    },
    internal_exam: {
        title: '科场舞弊',
        type: 'internal',
        desc: '会试弊案，朝野震惊。',
        options: [
            { text: '严查到底', effect: { prestige: 5, stability: 3, civil: -5, eunuch: -3 } },
            { text: '压下消息', effect: { stability: -5, civil: 3, eunuch: 5 } },
            { text: '重新考试', effect: { treasury: -300, prestige: 4, civil: 5 } }
        ]
    },
    internal_corrupt: {
        title: '官员贪污',
        type: 'internal',
        desc: '侍郎贪墨，请旨论处。',
        options: [
            { text: '严查抄家', effect: { treasury: 1000, stability: 5, civil: -3, eunuch: -5 } },
            { text: '警告了事', effect: { civil: 3, stability: -5, eunuch: 5 } },
            { text: '默许', effect: { treasury: -300, stability: -8, civil: 5, eunuch: 8 } }
        ]
    },
    internal_eunuch: {
        title: '宦官专权',
        type: 'internal',
        desc: '司礼监干政，权倾朝野。',
        options: [
            { text: '打压宦官', effect: { eunuch: -12, civil: 8, stability: 3, prestige: 5 } },
            { text: '利用宦官', effect: { eunuch: 10, civil: -8, stability: -3 } },
            { text: '平衡双方', effect: { eunuch: 3, civil: 3, stability: 1, prestige: 2 } }
        ]
    },
    internal_consort: {
        title: '外戚干政',
        type: 'internal',
        desc: '万贵妃父把持朝政，请旨抑制。',
        options: [
            { text: '严厉限制', effect: { consort: -10, civil: 8, stability: 2, prestige: 5 } },
            { text: '拉拢外戚', effect: { consort: 10, civil: -8, stability: -3 } },
            { text: '联姻平衡', effect: { consort: 5, civil: -2, stability: 1, prestige: 2 } }
        ]
    },
    internal_party: {
        title: '党争爆发',
        type: 'internal',
        desc: '东林与齐楚浙党相互攻讦。',
        options: [
            { text: '支持东林', effect: { civil: 8, eunuch: -5, stability: -3, prestige: 2 } },
            { text: '支持齐楚浙党', effect: { civil: 5, eunuch: 5, stability: -2 } },
            { text: '各打五十大板', effect: { civil: -5, stability: 5, prestige: 5 } }
        ]
    },
    internal_prince: {
        title: '藩王不臣',
        type: 'internal',
        desc: '燕王图谋不轨，请旨削藩。',
        options: [
            { text: '削藩', effect: { royal: -20, stability: -5, prestige: 10, civil: 5 } },
            { text: '安抚', effect: { royal: 10, stability: 2, prestige: -3, treasury: -500 } },
            { text: '联姻笼络', effect: { royal: 8, consort: 5, stability: 1, treasury: -800 } }
        ]
    },
    internal_empress: {
        title: '太后干政',
        type: 'internal',
        desc: '太后临朝，请旨定夺。',
        options: [
            { text: '请太后还政', effect: { consort: -12, civil: 10, stability: 3, prestige: 5 } },
            { text: '顺从太后', effect: { consort: 12, civil: -8, eunuch: 5, stability: -3 } },
            { text: '折中分权', effect: { consort: 2, civil: 2, stability: 1 } }
        ]
    },
    internal_remonstrance: {
        title: '言官死谏',
        type: 'internal',
        desc: '御史抬棺上殿，犯颜直谏。',
        options: [
            { text: '纳谏改过', effect: { stability: 5, prestige: 8, civil: 8, eunuch: -3 } },
            { text: '厚葬不予采纳', effect: { prestige: 3, civil: 2, stability: -2 } },
            { text: '以犯上治罪', effect: { stability: -10, prestige: -8, civil: -12, mandate: -3 } }
        ]
    },
    internal_secret: {
        title: '奏折留中',
        type: 'internal',
        desc: '御史密折，言辞激烈。',
        options: [
            { text: '留中不发', effect: { stability: 3, civil: -5, eunuch: 5 } },
            { text: '发出公议', effect: { stability: -5, prestige: 5, civil: 8, eunuch: -5 } },
            { text: '召见密询', effect: { treasury: -200, stability: 1, civil: 2, eunuch: 3 } }
        ]
    },
    internal_jingcha: {
        title: '京察大计',
        type: 'internal',
        desc: '六年京察，考核群臣。',
        options: [
            { text: '严格考核', effect: { stability: 3, prestige: 5, civil: -5, corruption: -3 } },
            { text: '走过场', effect: { stability: -2, civil: 5, corruption: 2 } },
            { text: '借机打压异己', effect: { civil: -8, eunuch: 5, stability: -3, prestige: -3 } }
        ]
    },
    internal_crown: {
        title: '请立太子',
        type: 'internal',
        desc: '群臣请立储君。',
        options: [
            { text: '立嫡长子', effect: { stability: 8, civil: 5, royal: 3, consort: -5 } },
            { text: '立贤不立长', effect: { prestige: 5, civil: -3, stability: -3, royal: -2 } },
            { text: '暂不立储', effect: { stability: -5, civil: -3, eunuch: 3 } }
        ]
    },
    internal_piaoni: {
        title: '内阁票拟之争',
        type: 'internal',
        desc: '首辅次辅争权，请旨定夺。',
        options: [
            { text: '支持首辅', effect: { civil: 5, stability: 2, eunuch: -3 } },
            { text: '支持次辅', effect: { civil: 3, stability: -2, eunuch: 3 } },
            { text: '各打五十大板', effect: { civil: -5, stability: 5, prestige: 5 } }
        ]
    },
    internal_dongchang: {
        title: '厂卫构陷',
        type: 'internal',
        desc: '东厂密报，请旨拿问。',
        options: [
            { text: '令禁府拿问', effect: { eunuch: 8, civil: -10, stability: -3, prestige: -2 } },
            { text: '先派人暗查', effect: { treasury: -300, stability: 2, eunuch: -3, civil: 3 } },
            { text: '斥退东厂', effect: { eunuch: -12, civil: 10, stability: 3, prestige: 5 } }
        ]
    },
    internal_zaochao: {
        title: '百官早朝',
        type: 'internal',
        desc: '群臣请恢复早朝。',
        options: [
            { text: '恢复早朝', effect: { stability: 5, prestige: 5, civil: 8, eunuch: -3 } },
            { text: '改三日一朝', effect: { stability: 2, civil: 2, prestige: 1 } },
            { text: '依旧免朝', effect: { stability: -5, civil: -8, eunuch: 5, prestige: -3 } }
        ]
    },
    internal_yongguan: {
        title: '裁汰冗官',
        type: 'internal',
        desc: '户部请裁撤冗员。',
        options: [
            { text: '大加裁汰', effect: { treasury: 800, stability: -5, civil: -10, prestige: 3 } },
            { text: '小规模裁减', effect: { treasury: 300, stability: -1, civil: -3 } },
            { text: '不裁', effect: { treasury: -200, civil: 5, stability: 2 } }
        ]
    },
    internal_xungui: {
        title: '勋贵争荫',
        type: 'internal',
        desc: '勋贵争求恩荫入仕。',
        options: [
            { text: '按军功授荫', effect: { military: 8, civil: -3, stability: 3, prestige: 3 } },
            { text: '按亲疏授荫', effect: { royal: 5, military: -5, stability: -2 } },
            { text: '暂停恩荫', effect: { military: -8, civil: 5, treasury: 400, stability: 2 } }
        ]
    },
    internal_qingjing: {
        title: '藩王请京',
        type: 'internal',
        desc: '边藩请求入京辅政。',
        options: [
            { text: '准其入京', effect: { royal: 10, civil: -8, stability: -3 } },
            { text: '婉言拒绝', effect: { royal: -8, civil: 5, stability: 2 } },
            { text: '入京但不留京', effect: { royal: 2, civil: 2, stability: 1, prestige: 2 } }
        ]
    },
    internal_kuikong: {
        title: '地方州县亏空',
        type: 'internal',
        desc: '江南亏空，请旨彻查。',
        options: [
            { text: '派御史彻查', effect: { treasury: -400, stability: 3, civil: 3, corruption: -3 } },
            { text: '令地方补足', effect: { treasury: 500, stability: -5, civil: -5 } },
            { text: '不了了之', effect: { stability: -3, corruption: 5, civil: 2 } }
        ]
    },
    internal_morals: {
        title: '言官风闻奏事',
        type: 'internal',
        desc: '御史弹劾大臣，请旨定夺。',
        options: [
            { text: '准其弹劾', effect: { prestige: 3, civil: -5, stability: 2 } },
            { text: '驳回弹劾', effect: { civil: 5, stability: -2, prestige: -2 } },
            { text: '调查后再定', effect: { treasury: -200, stability: 2, civil: 2, eunuch: 3 } }
        ]
    },
    
    // ========== 经济类（18个）==========
    economy_haijin: {
        title: '请开海禁',
        type: 'economy',
        desc: '闽广士绅请开海禁。',
        options: [
            { text: '准开海禁', effect: { treasury: 1000, prestige: 3, civil: 5, stability: -2, commerce: 5 } },
            { text: '仍禁如故', effect: { stability: 2, military: 3, civil: -3, commerce: -2 } },
            { text: '加征船税', effect: { treasury: 500, civil: -5, eunuch: 5, commerce: 3 } }
        ]
    },
    economy_mine: {
        title: '银矿之议',
        type: 'economy',
        desc: '云南奏报发现银矿。',
        options: [
            { text: '官营开采', effect: { treasury: 2000, civil: 3, stability: 2, corruption: 2 } },
            { text: '许民开采', effect: { treasury: 800, civil: 8, stability: -1, commerce: 3 } },
            { text: '封矿不采', effect: { stability: -3, prestige: -2, civil: -5 } }
        ]
    },
    economy_coin: {
        title: '钱法混乱',
        type: 'economy',
        desc: '私钱泛滥，币制混乱。',
        options: [
            { text: '改铸新钱', effect: { treasury: -600, stability: 5, commerce: 3, corruption: -2 } },
            { text: '放任不管', effect: { stability: -8, commerce: -5, corruption: 3 } },
            { text: '强令通行', effect: { stability: -3, treasury: 300, civil: -5 } }
        ]
    },
    economy_caoyun: {
        title: '漕运淤塞',
        type: 'economy',
        desc: '运河淤塞，漕运不畅。',
        options: [
            { text: '拨款疏浚', effect: { treasury: -800, food: 500, stability: 3, civil: 5, canalEfficiency: 5 } },
            { text: '改行海运', effect: { treasury: -500, food: 300, stability: 2, military: 3, canalEfficiency: -2 } },
            { text: '暂不处理', effect: { food: -500, stability: -5, civil: -5, canalEfficiency: -5 } }
        ]
    },
    economy_tax: {
        title: '商税之争',
        type: 'economy',
        desc: '户部请加征商税。',
        options: [
            { text: '加征商税', effect: { treasury: 800, stability: -3, civil: -5, commerce: -3 } },
            { text: '维持原税', effect: { stability: 2, commerce: 2 } },
            { text: '减免商税', effect: { treasury: -400, stability: 3, civil: 5, commerce: 5 } }
        ]
    },
    economy_salt: {
        title: '盐政之弊',
        type: 'economy',
        desc: '私盐泛滥，盐政败坏。',
        options: [
            { text: '严查盐政', effect: { treasury: 1000, stability: 2, corruption: -3, civil: -3 } },
            { text: '招安盐枭', effect: { stability: 3, corruption: 2, military: 2 } },
            { text: '放开盐禁', effect: { treasury: 500, commerce: 5, corruption: -2, stability: -2 } }
        ]
    },
    economy_weave: {
        title: '织造之请',
        type: 'economy',
        desc: '应天织造请扩充机户。',
        options: [
            { text: '扩充官营', effect: { treasury: 600, commerce: 3, civil: -5, stability: -2 } },
            { text: '许民自织', effect: { treasury: 200, commerce: 5, civil: 5 } },
            { text: '维持现状', effect: { stability: 1 } }
        ]
    },
    economy_shibosi: {
        title: '市舶司复设',
        type: 'economy',
        desc: '福建请复设市舶司。',
        options: [
            { text: '复设市舶司', effect: { treasury: 800, commerce: 5, prestige: 3, eunuch: 3 } },
            { text: '不设', effect: { stability: 1, commerce: -2, prestige: -1 } },
            { text: '设司派宦官监税', effect: { treasury: 1000, eunuch: 8, civil: -5, corruption: 3 } }
        ]
    },
    economy_yitiao: {
        title: '一条鞭法',
        type: 'economy',
        desc: '有司请推行一条鞭法。',
        options: [
            { text: '推行', effect: { treasury: 500, stability: 3, civil: 5, corruption: -2, agriculture: 3 } },
            { text: '暂缓', effect: { stability: 1 } },
            { text: '反对', effect: { civil: -3, treasury: -300, stability: -2 } }
        ]
    },
    economy_huangzhuang: {
        title: '皇庄扩地',
        type: 'economy',
        desc: '内帑请扩皇庄。',
        options: [
            { text: '准扩', effect: { treasury: 500, consort: 5, eunuch: 5, stability: -8, civil: -8 } },
            { text: '驳回', effect: { stability: 5, civil: 5, eunuch: -5 } },
            { text: '折中少扩', effect: { treasury: 200, stability: -2, civil: -2 } }
        ]
    },
    economy_chama: {
        title: '茶马互市',
        type: 'economy',
        desc: '陕西奏请茶马互市。',
        options: [
            { text: '官营互市', effect: { treasury: 300, militaryPower: 200, military: 5, commerce: 3 } },
            { text: '许民互市', effect: { treasury: 200, commerce: 5, civil: 5, stability: -1 } },
            { text: '禁止', effect: { stability: -2, military: -5, prestige: -2 } }
        ]
    },
    economy_huangshang: {
        title: '皇商垄断',
        type: 'economy',
        desc: '内府请准皇商垄断某货。',
        options: [
            { text: '准', effect: { treasury: 800, eunuch: 8, civil: -10, stability: -3, commerce: -3 } },
            { text: '不准', effect: { stability: 3, civil: 5, eunuch: -5, commerce: 2 } },
            { text: '折中限额', effect: { treasury: 300, eunuch: 2, civil: -2, stability: 1 } }
        ]
    },
    economy_liumin: {
        title: '流民垦荒',
        type: 'economy',
        desc: '河南奏报流民渐聚。',
        options: [
            { text: '招抚分田', effect: { food: 800, stability: 5, civil: 8, agriculture: 5, treasury: -300 } },
            { text: '强令返籍', effect: { stability: -8, civil: -8, food: -200 } },
            { text: '编入军屯', effect: { militaryPower: 300, food: 200, stability: -3, military: 3 } }
        ]
    },
    economy_water: {
        title: '水患频仍',
        type: 'economy',
        desc: '畿辅水患，请旨赈济。',
        options: [
            { text: '筑堤以工代赈', effect: { treasury: -600, food: 300, stability: 5, civil: 5, agriculture: 3 } },
            { text: '移民就食', effect: { food: -500, stability: 2, civil: -3 } },
            { text: '不治', effect: { stability: -10, food: -400, agriculture: -5 } }
        ]
    },
    economy_storehouse: {
        title: '官仓空虚',
        type: 'economy',
        desc: '户部奏官仓将竭。',
        options: [
            { text: '拨银籴粮', effect: { treasury: -800, food: 1000, stability: 3, civil: 3 } },
            { text: '令地方自筹', effect: { food: 300, stability: -2, civil: -3 } },
            { text: '不充', effect: { stability: -3, food: -100 } }
        ]
    },
    economy_port: {
        title: '口岸闭市',
        type: 'economy',
        desc: '闽浙口岸是否开关。',
        options: [
            { text: '开一港', effect: { treasury: 400, commerce: 5, stability: 3, civil: 5 } },
            { text: '全数封锁', effect: { stability: -5, civil: -8, commerce: -5 } },
            { text: '尽数开放', effect: { treasury: 800, commerce: 8, stability: -2, prestige: 2 } }
        ]
    },
    economy_taxjian: {
        title: '税监横行',
        type: 'economy',
        desc: '税监盘剥，民怨沸腾。',
        options: [
            { text: '撤回税监', effect: { treasury: -500, stability: 5, civil: 8, eunuch: -8, commerce: 3 } },
            { text: '留任', effect: { treasury: 600, eunuch: 8, civil: -8, stability: -3, commerce: -3 } },
            { text: '约束', effect: { treasury: 200, stability: 1, eunuch: -2, civil: 2 } }
        ]
    },
    economy_ironlicence: {
        title: '铁冶之议',
        type: 'economy',
        desc: '工部请议铁冶开禁。',
        options: [
            { text: '官营', effect: { iron: 300, treasury: 200, civil: 3, stability: 2 } },
            { text: '民营', effect: { iron: 500, treasury: 100, civil: 8, stability: -2, commerce: 3 } },
            { text: '封禁', effect: { stability: -2, prestige: -2, civil: -3 } }
        ]
    },
    
    // ========== 外交类（12个）==========
    diplomacy_korea: {
        title: '朝鲜来贡',
        type: 'diplomacy',
        desc: '朝鲜国王请册封世子。',
        options: [
            { text: '册封', effect: { prestige: 10, treasury: 500, civil: 5 } },
            { text: '拒绝', effect: { prestige: -5, civil: -3, military: 2 } },
            { text: '暂缓', effect: { stability: -2 } }
        ]
    },
    diplomacy_oirat: {
        title: '瓦剌求和',
        type: 'diplomacy',
        desc: '瓦剌遣使求互市。',
        options: [
            { text: '同意互市', effect: { treasury: 300, prestige: 5, stability: 2, military: -3, commerce: 3 } },
            { text: '拒绝', effect: { military: 5, prestige: -3, stability: -2 } },
            { text: '拖延', effect: { stability: -1, prestige: -1 } }
        ]
    },
    diplomacy_japan: {
        title: '日本遣使',
        type: 'diplomacy',
        desc: '日本遣使请通商。',
        options: [
            { text: '允许通商', effect: { treasury: 600, prestige: 3, stability: -2, civil: 5, commerce: 3 } },
            { text: '驱逐', effect: { prestige: -3, military: 5, stability: 2 } },
            { text: '朝贡贸易', effect: { prestige: 5, treasury: 200, civil: 3 } }
        ]
    },
    diplomacy_annam: {
        title: '安南叛服',
        type: 'diplomacy',
        desc: '安南黎氏篡陈氏，请旨定夺。',
        options: [
            { text: '出兵征讨', effect: { militaryPower: -800, prestige: 8, military: 8, treasury: -1500 } },
            { text: '遣使斥责', effect: { prestige: 2, stability: 1, treasury: -200 } },
            { text: '容忍', effect: { stability: -3, prestige: -2, military: -3 } }
        ]
    },
    diplomacy_northernyuan: {
        title: '北元求贡',
        type: 'diplomacy',
        desc: '北元小王子请入贡。',
        options: [
            { text: '许贡减赐', effect: { treasury: -300, prestige: 5, stability: 2, military: -2 } },
            { text: '拒绝', effect: { military: 5, prestige: 2, stability: -3 } },
            { text: '虚与委蛇', effect: { stability: 1, prestige: -1 } }
        ]
    },
    diplomacy_western: {
        title: '西域来朝',
        type: 'diplomacy',
        desc: '西域哈密卫请朝贡。',
        options: [
            { text: '厚赐', effect: { treasury: -500, prestige: 10, commerce: 3, stability: 2 } },
            { text: '只纳贡', effect: { prestige: 3, treasury: 200, civil: 2 } },
            { text: '闭门', effect: { prestige: -5, commerce: -2, stability: -2 } }
        ]
    },
    diplomacy_portugal: {
        title: '佛郎机通商',
        type: 'diplomacy',
        desc: '佛郎机船求通商互市。',
        options: [
            { text: '准通商', effect: { treasury: 800, commerce: 5, prestige: 3, stability: -2 } },
            { text: '只许朝贡', effect: { prestige: 3, treasury: 200, commerce: 1 } },
            { text: '驱逐', effect: { prestige: -3, military: 3, stability: 2 } }
        ]
    },
    diplomacy_dutch: {
        title: '红毛夷船',
        type: 'diplomacy',
        desc: '红毛夷船至闽浙海面。',
        options: [
            { text: '水师驱逐', effect: { militaryPower: -300, prestige: 5, military: 6, treasury: -400 } },
            { text: '拒绝并禁海', effect: { stability: -3, commerce: -3, military: 3 } },
            { text: '许其暂泊', effect: { treasury: 300, commerce: 2, stability: -4 } }
        ]
    },
    diplomacy_vassal_help: {
        title: '藩属求援',
        type: 'diplomacy',
        desc: '朝鲜遭倭侵，请援。',
        options: [
            { text: '发兵救援', effect: { militaryPower: -1000, prestige: 12, military: 10, treasury: -2000, stability: 5 } },
            { text: '仅助粮饷', effect: { treasury: -800, food: -500, prestige: 5, military: -3 } },
            { text: '不救', effect: { prestige: -10, stability: -5, military: -3 } }
        ]
    },
    diplomacy_mongol_market: {
        title: '蒙古互市',
        type: 'diplomacy',
        desc: '朵颜三卫请开边市。',
        options: [
            { text: '开互市', effect: { treasury: 300, commerce: 3, stability: 2, military: -3 } },
            { text: '拒绝', effect: { military: 5, stability: -3, prestige: -2 } },
            { text: '开小市', effect: { treasury: 100, commerce: 1, stability: 1 } }
        ]
    },
    diplomacy_heqin: {
        title: '和亲之议',
        type: 'diplomacy',
        desc: '有司请和亲瓦剌。',
        options: [
            { text: '许和亲', effect: { prestige: -5, stability: 5, military: -5, royal: -3 } },
            { text: '拒绝', effect: { prestige: 5, military: 5, stability: -2 } },
            { text: '假公主', effect: { prestige: -8, stability: 2, royal: -5 } }
        ]
    },
    diplomacy_zhenghe: {
        title: '郑和旧事',
        type: 'diplomacy',
        desc: '有司请复遣下西洋。',
        options: [
            { text: '复遣船队', effect: { treasury: -1500, prestige: 10, commerce: 5, stability: -2, military: -2 } },
            { text: '不遣', effect: { stability: 2, civil: 2 } },
            { text: '小规模', effect: { treasury: -500, prestige: 5, commerce: 3, stability: -1 } }
        ]
    },
    
    // ========== 皇族类（9个）==========
    royal_prince_army: {
        title: '藩王请封',
        type: 'royal',
        desc: '边藩请增护卫兵马。',
        options: [
            { text: '同意增兵', effect: { militaryPower: 300, royal: 10, military: 5, treasury: -800 } },
            { text: '驳回', effect: { royal: -10, military: -5, stability: -2 } },
            { text: '削减护卫', effect: { royal: -15, military: -8, stability: -5, prestige: 3 } }
        ]
    },
    royal_prince_dis: {
        title: '藩王不臣',
        type: 'royal',
        desc: '燕王图谋不轨。',
        options: [
            { text: '削藩', effect: { royal: -20, stability: -5, prestige: 10, civil: 5 } },
            { text: '安抚', effect: { royal: 10, stability: 2, prestige: -3, treasury: -500 } },
            { text: '联姻笼络', effect: { royal: 8, consort: 5, stability: 1, treasury: -800 } }
        ]
    },
    royal_consort_ask: {
        title: '后妃请托',
        type: 'royal',
        desc: '后妃为家族请官。',
        options: [
            { text: '授实职', effect: { consort: 10, eunuch: 8, civil: -8, stability: -3 } },
            { text: '给虚衔', effect: { consort: 3, eunuch: 2, civil: -2 } },
            { text: '拒绝', effect: { consort: -10, eunuch: -5, stability: -2, prestige: 5 } }
        ]
    },
    royal_empress_son: {
        title: '皇后无子',
        type: 'royal',
        desc: '皇后久无子嗣。',
        options: [
            { text: '选秀', effect: { consort: 5, prestige: 3, stability: 2, treasury: -300 } },
            { text: '立庶子', effect: { stability: 3, royal: 5, civil: -3 } },
            { text: '拖延', effect: { stability: -8, civil: -5, eunuch: 3 } }
        ]
    },
    royal_prince_grown: {
        title: '皇子成年',
        type: 'royal',
        desc: '皇子年已及冠。',
        options: [
            { text: '封王就藩', effect: { royal: 8, stability: 2, treasury: -500 } },
            { text: '留京听用', effect: { royal: -5, civil: 5, stability: 1, prestige: 2 } },
            { text: '暂不册封', effect: { royal: -3, stability: -1 } }
        ]
    },
    royal_wan: {
        title: '万贵妃干政',
        type: 'royal',
        desc: '万贵妃干预朝政。',
        options: [
            { text: '抑制外戚', effect: { consort: -12, civil: 8, stability: 3, prestige: 5 } },
            { text: '安抚', effect: { consort: 10, civil: -8, stability: -3 } },
            { text: '不闻不问', effect: { consort: 5, civil: -5, stability: -2 } }
        ]
    },
    royal_prince_evil: {
        title: '宗室欺民',
        type: 'royal',
        desc: '藩王纵奴欺民。',
        options: [
            { text: '严惩藩王', effect: { royal: -15, civil: 10, stability: 5, prestige: 8 } },
            { text: '从轻', effect: { royal: 5, civil: -8, stability: -3 } },
            { text: '压下', effect: { royal: 3, civil: -10, stability: -5 } }
        ]
    },
    royal_palace_secret: {
        title: '宫女告密',
        type: 'royal',
        desc: '宫女密报外戚阴谋。',
        options: [
            { text: '严查', effect: { consort: -8, eunuch: 5, stability: 2, prestige: 3 } },
            { text: '压下', effect: { consort: 3, eunuch: -5, stability: -2 } },
            { text: '处死告密者', effect: { stability: -3, eunuch: -3, consort: 2, prestige: -2 } }
        ]
    },
    royal_prince_visit: {
        title: '亲藩入京',
        type: 'royal',
        desc: '亲藩请求入京。',
        options: [
            { text: '准入京', effect: { royal: 10, civil: -8, stability: -3 } },
            { text: '婉拒', effect: { royal: -8, civil: 5, stability: 2 } },
            { text: '入京不留京', effect: { royal: 2, civil: 2, stability: 1, prestige: 2 } }
        ]
    },
    royal_xuanxiu: {
        title: '选秀之议',
        type: 'royal',
        desc: '有司请大选秀女。',
        options: [
            { text: '大选', effect: { consort: 5, stability: 2, prestige: 3, treasury: -300 } },
            { text: '不选', effect: { consort: -5, stability: -1 } },
            { text: '小选', effect: { consort: 2, treasury: -100 } }
        ]
    }
};

// 事件按类型分组（用于随机抽取）
const EVENTS_BY_TYPE = {
    disaster: Object.keys(EVENTS).filter(k => EVENTS[k].type === 'disaster'),
    border:   Object.keys(EVENTS).filter(k => EVENTS[k].type === 'border'),
    internal: Object.keys(EVENTS).filter(k => EVENTS[k].type === 'internal'),
    economy:  Object.keys(EVENTS).filter(k => EVENTS[k].type === 'economy'),
    diplomacy:Object.keys(EVENTS).filter(k => EVENTS[k].type === 'diplomacy'),
    royal:    Object.keys(EVENTS).filter(k => EVENTS[k].type === 'royal')
};

// ====== 初始剧本（4个朝代场景） ======
const SCRIPTS = [
    {
        id: 'chenghua',
        name: '成化中兴',
        era: '成化十年',
        year: 1474,
        desc: '成化朝中期，万贵妃与汪直用事，厂卫横行。西厂之设，朝野侧目。',
        difficulty: 4,
        startStats: {
            treasury: 8000, privyPurse: 5000, food: 4000, militaryFood: 1500,
            gunpowder: 300, iron: 500, wood: 800, stone: 400, horses: 200,
            population: 60000000, stability: 55, prestige: 60,
            militaryPower: 8000, navyPower: 1200, mandate: 70,
            adminEfficiency: 55, corruption: 30, culture: 40, tech: 25,
            commerce: 40, agriculture: 50, canalEfficiency: 30, vassals: 5
        }
    },
    {
        id: 'zhengde',
        name: '正德嬉乐',
        era: '正德五年',
        year: 1510,
        desc: '武宗荒嬉，刘瑾虽除，宁王未靖。边患频仍，朝政渐弛。',
        difficulty: 5,
        startStats: {
            treasury: 6500, privyPurse: 4000, food: 3500, militaryFood: 1200,
            gunpowder: 250, iron: 400, wood: 600, stone: 300, horses: 150,
            population: 58000000, stability: 45, prestige: 50,
            militaryPower: 7500, navyPower: 1000, mandate: 60,
            adminEfficiency: 45, corruption: 40, culture: 35, tech: 28,
            commerce: 35, agriculture: 45, canalEfficiency: 25, vassals: 4
        }
    },
    {
        id: 'wanli',
        name: '万历怠政',
        era: '万历二十年',
        year: 1592,
        desc: '万历二十余年不上朝，国本之争未决。倭乱方平，女真又起。',
        difficulty: 7,
        startStats: {
            treasury: 5000, privyPurse: 3000, food: 3000, militaryFood: 1000,
            gunpowder: 400, iron: 600, wood: 1000, stone: 500, horses: 250,
            population: 55000000, stability: 38, prestige: 45,
            militaryPower: 7000, navyPower: 1500, mandate: 50,
            adminEfficiency: 38, corruption: 50, culture: 30, tech: 32,
            commerce: 30, agriculture: 40, canalEfficiency: 20, vassals: 3
        }
    },
    {
        id: 'tianqi',
        name: '天启魏阉',
        era: '天启三年',
        year: 1623,
        desc: '魏忠贤与客氏把持内廷，东林与阉党势不两立。辽东战事，饷银告急。',
        difficulty: 8,
        startStats: {
            treasury: 4000, privyPurse: 2500, food: 2500, militaryFood: 800,
            gunpowder: 350, iron: 500, wood: 800, stone: 400, horses: 200,
            population: 52000000, stability: 30, prestige: 35,
            militaryPower: 6500, navyPower: 1200, mandate: 40,
            adminEfficiency: 30, corruption: 60, culture: 25, tech: 30,
            commerce: 25, agriculture: 35, canalEfficiency: 18, vassals: 2
        }
    }
];

// 派系初始值
const FACTION_INITIAL = {
    huanling: 60,  // 兼容旧名字
    civil: 60,
    military: 60,
    royal: 50,
    eunuch: 50,
    consort: 55
};
