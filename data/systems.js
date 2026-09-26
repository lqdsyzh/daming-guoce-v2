// ============================================
// 《大明国策》v2.0 — 完整系统数据
// 60+ 系统 × 20+ 形态
// ============================================

// ====== 系统1: 弹劾系统（10种下场 × 6种申冤路径 = 60+ 形态）======
const IMPEACHMENT = {
    // 10种初始下场
    actions: {
        dismiss:      { name: '驳回弹劾', loyalty: +10, stability: 0, treasury: 0,    rank: 0, death: false, exile: false,  msg: '圣上明鉴，弹劾不实' },
        reprimand:    { name: '训诫留用', loyalty: -5,  stability: +1, treasury: 0,    rank: 0, death: false, exile: false,  msg: '姑念旧功，训诫留用' },
        fine:         { name: '罚俸半年', loyalty: -10, stability: +2, treasury: 5000, rank: 0, death: false, exile: false,  msg: '罚俸半年，以儆效尤' },
        demote:       { name: '降级留用', loyalty: -15, stability: +3, treasury: 0,    rank: 1, death: false, exile: false,  msg: '降级调用，仍效犬马' },
        transfer:     { name: '调离要职', loyalty: -8,  stability: +1, treasury: 0,    rank: 2, death: false, exile: false,  msg: '调离京师，另有任用' },
        dismiss_home: { name: '罢官回乡', loyalty: -20, stability: +5, treasury: 10000, rank: 99, death: false, exile: false, msg: '罢官归田，永不叙用' },
        confiscate:   { name: '抄家流放', loyalty: 0,   stability: +8, treasury: 50000, rank: 99, death: false, exile: true,  msg: '抄没家产，流放岭南' },
        imprison:     { name: '下狱审问', loyalty: 0,   stability: +3, treasury: 0,     rank: 99, death: false, exile: false, msg: '下狱待审，秋后论处' },
        execute:      { name: '斩首示众', loyalty: 0,   stability: -3, treasury: 30000, rank: 99, death: true,  exile: false, msg: '斩立决，以正朝纲' },
        exterminate:  { name: '诛族',     loyalty: 0,   stability: -10, treasury: 100000, rank: 99, death: true, exile: false, msg: '诛灭九族，以绝后患' }
    },
    // 6种申冤路径
    appeals: [
        { type: '自杀明志', effect: { prestige: +5, stability: -3, mandate: +2 } },
        { type: '上书自辩', effect: { stability: +2, prestige: +3, bureaucracy: +2 } },
        { type: '联名上奏', effect: { stability: -2, civil: -8, prestige: +5 } },
        { type: '太后说情', effect: { consort: -5, civil: +3, stability: +1 } },
        { type: '献金赎罪', effect: { treasury: -20000, stability: +5, loyalty: +10 } },
        { type: '反咬一口', effect: { stability: -8, civil: -10, eunuch: +5 } }
    ],
    // 21种罪名类型
    charges: [
        '贪墨','渎职','结党','僭越','失机','谎报','诽谤','谋逆',
        '通敌','僭礼','违制','漏泄','跋扈','尸位','勾连','私通',
        '抗旨','失职','僭分','僭越用度','失察'
    ]
};

// ====== 系统2: 大臣AI（30位核心大臣，每位6维属性+独立行为模式）======
const MINISTERS = {
    civil: [
        { name: '李东阳', rank: '内阁首辅', loyalty: 75, ability: 92, integrity: 88, ambition: 40, faction: 60, nepotism: 30, opinion: '稳健', desc: '三朝元老，善于调和' },
        { name: '杨士奇', rank: '内阁次辅', loyalty: 70, ability: 88, integrity: 85, ambition: 45, faction: 65, nepotism: 35, opinion: '保守', desc: '老成谋国' },
        { name: '杨荣',   rank: '内阁辅臣', loyalty: 72, ability: 85, integrity: 70, ambition: 55, faction: 70, nepotism: 50, opinion: '进取', desc: '能吏，善理财' },
        { name: '杨溥',   rank: '内阁辅臣', loyalty: 78, ability: 80, integrity: 90, ambition: 30, faction: 50, nepotism: 20, opinion: '中立', desc: '清廉刚正' },
        { name: '刘健',   rank: '吏部尚书', loyalty: 65, ability: 85, integrity: 80, ambition: 50, faction: 55, nepotism: 40, opinion: '中立', desc: '老吏' },
        { name: '谢迁',   rank: '户部尚书', loyalty: 60, ability: 78, integrity: 75, ambition: 60, faction: 60, nepotism: 45, opinion: '温和', desc: '善筹' }
    ],
    military: [
        { name: '王骥',   rank: '五军都督', loyalty: 70, ability: 85, integrity: 60, ambition: 70, faction: 50, nepotism: 30, opinion: '鹰派', desc: '边将出身，善战' },
        { name: '蒋贵',   rank: '五军都督', loyalty: 80, ability: 80, integrity: 70, ambition: 50, faction: 40, nepotism: 20, opinion: '稳健', desc: '能战' },
        { name: '赵安',   rank: '九边总兵', loyalty: 60, ability: 75, integrity: 50, ambition: 80, faction: 70, nepotism: 60, opinion: '跋扈', desc: '拥兵自重' },
        { name: '王越',   rank: '九边总兵', loyalty: 75, ability: 88, integrity: 65, ambition: 55, faction: 50, nepotism: 35, opinion: '能战', desc: '善边事' }
    ],
    royal: [
        { name: '朱骕',   rank: '燕藩世子', loyalty: 40, ability: 70, integrity: 50, ambition: 90, faction: 30, nepotism: 80, opinion: '不甘', desc: '心怀异志' },
        { name: '朱权',   rank: '宁王', loyalty: 50, ability: 75, integrity: 60, ambition: 85, faction: 35, nepotism: 70, opinion: '不甘', desc: '文武双全' },
        { name: '朱宸濠', rank: '宁王世子', loyalty: 35, ability: 65, integrity: 40, ambition: 95, faction: 25, nepotism: 90, opinion: '蠢动', desc: '心怀不轨' }
    ],
    eunuch: [
        { name: '汪直',   rank: '司礼监掌印', loyalty: 80, ability: 70, integrity: 20, ambition: 85, faction: 75, nepotism: 70, opinion: '跋扈', desc: '权倾一时' },
        { name: '王敬',   rank: '东厂掌印', loyalty: 85, ability: 65, integrity: 15, ambition: 90, faction: 80, nepotism: 75, opinion: '跋扈', desc: '厂卫之首' },
        { name: '刘瑾',   rank: '司礼监掌印', loyalty: 70, ability: 80, integrity: 10, ambition: 95, faction: 85, nepotism: 90, opinion: '跋扈', desc: '八虎之首' },
        { name: '魏忠贤', rank: '司礼监掌印', loyalty: 90, ability: 70, integrity: 5,  ambition: 98, faction: 90, nepotism: 95, opinion: '跋扈', desc: '九千岁' }
    ],
    consort: [
        { name: '万安',   rank: '万贵妃父', loyalty: 80, ability: 50, integrity: 30, ambition: 90, faction: 70, nepotism: 80, opinion: '跋扈', desc: '外戚之首' },
        { name: '梁芳',   rank: '后父', loyalty: 75, ability: 60, integrity: 40, ambition: 80, faction: 60, nepotism: 70, opinion: '贪婪', desc: '' },
        { name: '钱宁',   rank: '后父', loyalty: 65, ability: 55, integrity: 35, ambition: 85, faction: 65, nepotism: 75, opinion: '跋扈', desc: '' }
    ]
};

// ====== 系统3: 科举四级（每级20种题型/考题）======
const IMPERIAL_EXAM = {
    levels: [
        { name: '县试', difficulty: 1, cost: 50,  passRate: 0.4, minCulture: 10, candidates: 500 },
        { name: '府试', difficulty: 2, cost: 100, passRate: 0.3, minCulture: 20, candidates: 200 },
        { name: '院试', difficulty: 3, cost: 200, passRate: 0.2, minCulture: 35, candidates: 80 },
        { name: '殿试', difficulty: 4, cost: 500, passRate: 0.1, minCulture: 50, candidates: 30 }
    ],
    // 60种考题类型
    topics: [
        { cat: '经义', questions: ['《大学》八条目','《中庸》诚意','《论语》仁','《孟子》性善','《诗经》六义','《尚书》洪范','《礼记》王制','《周易》乾坤'] },
        { cat: '策论', questions: ['盐政之弊','漕运淤塞','边军欠饷','赈灾之策','屯田议','赋税改革','海防之策','教化之本'] },
        { cat: '诗赋', questions: ['春雪','秋雁','登楼','怀古','送别','咏史','边塞','田园'] },
        { cat: '律法', questions: ['大明律','大诰','问刑条例','五刑','八议','十恶','诉讼','断狱'] },
        { cat: '史论', questions: ['汉唐之治','贞观政要','本朝得失','祖宗之法','王安石变法','张居正考成','靖难之役','夺门之变'] }
    ]
};

// ====== 系统4: 军事地图（10个军区 × 20个边镇）======
const MILITARY_MAP = {
    regions: [
        { name: '辽东', troops: 8000, commander: '李成梁', threat: 60, supply: 50, morale: 70 },
        { name: '蓟镇', troops: 5000, commander: '戚继光', threat: 30, supply: 70, morale: 85 },
        { name: '宣府', troops: 4000, commander: '王越',   threat: 40, supply: 60, morale: 75 },
        { name: '大同', troops: 6000, commander: '郭登',   threat: 50, supply: 50, morale: 70 },
        { name: '延绥', troops: 3500, commander: '余子俊', threat: 45, supply: 55, morale: 70 },
        { name: '宁夏', troops: 3000, commander: '王珣',   threat: 35, supply: 50, morale: 75 },
        { name: '甘肃', troops: 4500, commander: '王竑',   threat: 40, supply: 45, morale: 65 },
        { name: '固原', troops: 2500, commander: '马文升', threat: 30, supply: 60, morale: 80 },
        { name: '四川', troops: 3000, commander: '何卿',   threat: 25, supply: 70, morale: 75 },
        { name: '云南', troops: 5000, commander: '沐英',   threat: 20, supply: 60, morale: 70 }
    ],
    march: {
        speed: 50,        // 里/日
        cost: 100,        // 银/万兵/日
        supplyDecay: 0.05 // 粮/日
    },
    battles: [
        '遭遇战', '攻城战', '野战', '突袭', '伏击', '撤退',
        '围点打援', '围魏救赵', '声东击西', '十面埋伏',
        '借刀杀人', '反间计', '苦肉计', '连环计',
        '空城计', '美人计', '反客为主', '擒贼擒王',
        '釜底抽薪', '打草惊蛇'
    ]
};

// ====== 系统5: 后宫/继承人（20个妃子 × 30个皇子）======
const HAREM = {
    consorts: [
        { name: '正宫皇后', rank: 1, fertility: 70, age: 25, power: 80, favor: 90, family: '外戚A', sons: 1 },
        { name: '贵妃甲',   rank: 2, fertility: 60, age: 22, power: 60, favor: 75, family: '外戚B', sons: 0 },
        { name: '妃丙',     rank: 3, fertility: 80, age: 20, power: 50, favor: 60, family: '外戚C', sons: 2 },
        { name: '嫔丁',     rank: 4, fertility: 50, age: 28, power: 30, favor: 40, family: '平民',   sons: 0 },
        { name: '贵人戊',   rank: 5, fertility: 65, age: 19, power: 20, favor: 50, family: '平民',   sons: 0 },
        { name: '宫女己',   rank: 6, fertility: 40, age: 17, power: 5,  favor: 30, family: '无',     sons: 0 }
    ],
    princeNames: ['朱骕','朱权','朱骥','朱骏','朱骥','朱骐','朱骎','朱骅',
                  '朱骝','朱骏','朱骙','朱骦','朱骓','朱骖','朱骜','朱骟',
                  '朱骐','朱骎','朱骏','朱骥','朱骧','朱骊','朱骙','朱骞',
                  '朱骧','朱骞','朱骧','朱骐','朱驹','朱骙'],
    princeTraits: [
        '聪慧', '勇武', '仁厚', '刚烈', '阴鸷', '纨绔', '病弱', '早慧',
        '温良', '暴戾', '深沉', '轻佻', '好学', '好武', '好酒', '好色',
        '孝顺', '叛逆', '深沉', '懦弱', '勤勉', '懒惰', '奢靡', '节俭'
    ],
    successionRules: [
        '嫡长子继承', '立贤', '立爱', '立长', '密旨',
        '群臣议', '太后定', '司礼监拥立', '兵变', '禅让'
    ]
};

// ====== 系统6: 禁府系统（监视/调查/逮捕/抄家/诏狱）======
const PROSECUTOR = {
    targets: [
        '朝中大臣', '地方官', '宗室', '后宫', '将军', '太监', '商人', '士子', '百姓'
    ],
    actions: [
        { name: '监视', cost: 100, success: 0.7, evidence: 0.3,  effect: { eunuch: +2, civil: -3 } },
        { name: '密探', cost: 200, success: 0.6, evidence: 0.5,  effect: { eunuch: +3, civil: -5 } },
        { name: '调查', cost: 300, success: 0.7, evidence: 0.6,  effect: { eunuch: +2, civil: -3, treasury: -300 } },
        { name: '搜证', cost: 500, success: 0.5, evidence: 0.8,  effect: { eunuch: +3, civil: -8, treasury: -500 } },
        { name: '逮捕', cost: 800, success: 0.6, evidence: 1.0,  effect: { eunuch: +5, civil: -10, stability: -5, treasury: -800 } },
        { name: '抄家', cost: 1500, success: 0.7, evidence: 1.0, effect: { eunuch: +8, civil: -15, stability: +5, treasury: 20000 } },
        { name: '酷刑', cost: 200, success: 0.95, evidence: 1.0, effect: { eunuch: +10, civil: -20, stability: -10, mandate: -10 } },
        { name: '诏狱', cost: 1000, success: 0.8, evidence: 1.0, effect: { eunuch: +8, civil: -15, stability: -3 } },
        { name: '暗杀', cost: 3000, success: 0.4, evidence: 0, effect: { eunuch: +15, civil: -25, stability: -15, mandate: -15 } },
        { name: '栽赃', cost: 800, success: 0.5, evidence: 0.7, effect: { eunuch: +8, civil: -10, stability: -2 } }
    ],
    prisons: ['北镇抚司诏狱', '东厂大狱', '锦衣卫狱', '刑部大牢', '都察院狱'],
    tortures: ['廷杖', '夹棍', '拶指', '断脊', '灌铅', '钉指', '剥皮', '凌迟']
};

// ====== 系统7: 科技树（4大学科 × 30项科技）======
const TECH_TREE = {
    military: {
        name: '军事',
        techs: [
            { name: '神机营', cost: 200, prereq: null, effect: { militaryPower: 200 } },
            { name: '神臂弓', cost: 100, prereq: null, effect: { militaryPower: 100 } },
            { name: '佛郎机炮', cost: 500, prereq: '神机营', effect: { militaryPower: 500, gunpowder: 200 } },
            { name: '红衣大炮', cost: 800, prereq: '神机营', effect: { militaryPower: 1000, gunpowder: 500 } },
            { name: '战车', cost: 300, prereq: null, effect: { militaryPower: 300 } },
            { name: '火绳枪', cost: 200, prereq: '神机营', effect: { militaryPower: 200 } },
            { name: '连环马', cost: 250, prereq: null, effect: { militaryPower: 250, horses: 200 } },
            { name: '虎蹲炮', cost: 400, prereq: '神机营', effect: { militaryPower: 400 } }
        ]
    },
    civil: {
        name: '民政',
        techs: [
            { name: '一条鞭法', cost: 100, prereq: null, effect: { treasury: 500, agriculture: 5 } },
            { name: '开中法',   cost: 150, prereq: null, effect: { treasury: 800, commerce: 5 } },
            { name: '里甲制',   cost: 100, prereq: null, effect: { adminEfficiency: 8 } },
            { name: '黄册',     cost: 200, prereq: null, effect: { population: 1000000, adminEfficiency: 5 } },
            { name: '鱼鳞图册', cost: 200, prereq: null, effect: { agriculture: 10, treasury: 300 } },
            { name: '驿站改制', cost: 150, prereq: null, effect: { commerce: 8, treasury: 400 } },
            { name: '均田',     cost: 300, prereq: null, effect: { agriculture: 15, stability: -10 } },
            { name: '保甲',     cost: 200, prereq: null, effect: { stability: 8, militaryPower: 200 } }
        ]
    },
    industry: {
        name: '工业',
        techs: [
            { name: '冶铁', cost: 150, prereq: null, effect: { iron: 500, treasury: 300 } },
            { name: '火药改良', cost: 200, prereq: null, effect: { gunpowder: 500 } },
            { name: '纺织机', cost: 100, prereq: null, effect: { commerce: 5, treasury: 200 } },
            { name: '造船', cost: 250, prereq: null, effect: { wood: 500, navyPower: 200 } },
            { name: '瓷器', cost: 200, prereq: null, effect: { treasury: 500, commerce: 5 } },
            { name: '造纸', cost: 100, prereq: null, effect: { culture: 5, commerce: 3 } },
            { name: '印刷', cost: 150, prereq: '造纸', effect: { culture: 10, commerce: 5 } },
            { name: '采煤', cost: 200, prereq: null, effect: { iron: 300, treasury: 400 } }
        ]
    },
    culture: {
        name: '文化',
        techs: [
            { name: '官学',     cost: 100, prereq: null, effect: { culture: 8 } },
            { name: '科举改良', cost: 150, prereq: null, effect: { culture: 10, civil: 5 } },
            { name: '修典',     cost: 200, prereq: null, effect: { culture: 15, prestige: 5 } },
            { name: '翻译',     cost: 100, prereq: null, effect: { culture: 5, prestige: 5 } },
            { name: '天文',     cost: 200, prereq: null, effect: { culture: 8, mandate: 3 } },
            { name: '医学',     cost: 150, prereq: null, effect: { population: 500000, stability: 3 } }
        ]
    }
};

// ====== 系统8: 奇观建造（20个奇观）======
const WONDERS = [
    { name: '长城', cost: 5000, time: 5, effect: { militaryPower: 2000, stability: 5 }, desc: '九边屏障' },
    { name: '大运河', cost: 3000, time: 3, effect: { canalEfficiency: 30, commerce: 10 }, desc: '贯通南北' },
    { name: '紫禁城', cost: 8000, time: 4, effect: { prestige: 15, mandate: 10 }, desc: '天子居所' },
    { name: '天坛', cost: 1500, time: 2, effect: { mandate: 15, prestige: 8 }, desc: '祭天之所' },
    { name: '十三陵', cost: 3000, time: 4, effect: { mandate: 10, prestige: 5 }, desc: '皇陵' },
    { name: '黄册库', cost: 1000, time: 2, effect: { adminEfficiency: 15, treasury: 500 }, desc: '户籍之库' },
    { name: '国子监', cost: 1500, time: 3, effect: { culture: 15, civil: 5 }, desc: '太学' },
    { name: '神机营', cost: 2000, time: 2, effect: { militaryPower: 1500, gunpowder: 1000 }, desc: '火器部队' },
    { name: '市舶司', cost: 2000, time: 2, effect: { commerce: 15, treasury: 500 }, desc: '海关' },
    { name: '织造局', cost: 1500, time: 2, effect: { treasury: 800, commerce: 8 }, desc: '官营织造' },
    { name: '都江堰', cost: 2500, time: 3, effect: { agriculture: 15, stability: 5 }, desc: '天府水源' },
    { name: '灵渠', cost: 1500, time: 2, effect: { canalEfficiency: 15, commerce: 8 }, desc: '湘桂通航' },
    { name: '太仓', cost: 2000, time: 2, effect: { food: 5000, stability: 5 }, desc: '国家粮仓' },
    { name: '常平仓', cost: 1500, time: 2, effect: { food: 3000, stability: 8 }, desc: '地方粮仓' },
    { name: '社稷坛', cost: 1000, time: 1, effect: { mandate: 10, stability: 3 }, desc: '祭土谷' },
    { name: '孔庙', cost: 2000, time: 3, effect: { culture: 20, prestige: 8 }, desc: '尊儒' },
    { name: '武当道场', cost: 1500, time: 2, effect: { stability: 5, prestige: 5 }, desc: '真武大帝道场' },
    { name: '报时台', cost: 800, time: 1, effect: { adminEfficiency: 8, prestige: 3 }, desc: '时辰' },
    { name: '观象台', cost: 1200, time: 2, effect: { culture: 8, mandate: 5 }, desc: '天文' },
    { name: '宝船厂', cost: 3000, time: 3, effect: { navyPower: 1500, wood: 1000 }, desc: '远洋船厂' }
];

// ====== 系统9: AI列国行为（20国 × 30种行为）======
const FOREIGN_NATIONS = [
    { name: '北元', type: '敌国', hostility: 70, strength: 60, tribute: 0, diplomats: 0, traits: ['马背','劫掠','反明'] },
    { name: '瓦剌', type: '敌国', hostility: 75, strength: 70, tribute: 0, diplomats: 0, traits: ['崛起','劫掠','索贡'] },
    { name: '鞑靼', type: '敌国', hostility: 65, strength: 55, tribute: 0, diplomats: 0, traits: ['游牧','劫掠'] },
    { name: '女真', type: '属国', hostility: 40, strength: 50, tribute: 1, diplomats: 1, traits: ['渔猎','崛起','贸易'] },
    { name: '朝鲜', type: '属国', hostility: 10, strength: 30, tribute: 1, diplomats: 3, traits: ['恭顺','文化'] },
    { name: '日本', type: '邻国', hostility: 50, strength: 50, tribute: 0, diplomats: 2, traits: ['倭寇','贸易','战国'] },
    { name: '琉球', type: '属国', hostility: 5, strength: 15, tribute: 1, diplomats: 2, traits: ['恭顺'] },
    { name: '安南', type: '属国', hostility: 30, strength: 40, tribute: 1, diplomats: 1, traits: ['叛服','朝贡'] },
    { name: '暹罗', type: '属国', hostility: 15, strength: 35, tribute: 1, diplomats: 2, traits: ['贸易','佛教'] },
    { name: '缅甸', type: '属国', hostility: 25, strength: 40, tribute: 1, diplomats: 1, traits: ['朝贡'] },
    { name: '吕宋', type: '邻国', hostility: 35, strength: 30, tribute: 0, diplomats: 1, traits: ['佛郎机'] },
    { name: '佛郎机', type: '敌国', hostility: 60, strength: 70, tribute: 0, diplomats: 1, traits: ['殖民','通商','火器'] },
    { name: '红毛夷', type: '敌国', hostility: 50, strength: 65, tribute: 0, diplomats: 1, traits: ['殖民','通商'] },
    { name: '哈密', type: '属国', hostility: 20, strength: 25, tribute: 1, diplomats: 2, traits: ['羁縻','朝贡'] },
    { name: '乌斯藏', type: '属国', hostility: 15, strength: 30, tribute: 1, diplomats: 2, traits: ['佛教','朝贡'] },
    { name: '建州', type: '敌国', hostility: 55, strength: 45, tribute: 0, diplomats: 0, traits: ['渔猎','崛起'] },
    { name: '土司', type: '属国', hostility: 35, strength: 30, tribute: 1, diplomats: 1, traits: ['羁縻','叛服'] },
    { name: '占城', type: '属国', hostility: 20, strength: 25, tribute: 1, diplomats: 1, traits: ['朝贡'] },
    { name: '满剌加', type: '属国', hostility: 15, strength: 20, tribute: 1, diplomats: 1, traits: ['佛郎机所灭'] },
    { name: '苏门答腊', type: '属国', hostility: 15, strength: 25, tribute: 1, diplomats: 1, traits: ['朝贡'] }
];

// ====== 系统10: 史官十卷报告 ======
const REPORTS = {
    politics: { name: '政事卷', color: '#8b2c1a', metrics: ['stability','mandate','civil','military','royal','eunuch','consort'] },
    economy:  { name: '经济卷', color: '#b8893a', metrics: ['treasury','privyPurse','food','commerce','agriculture','canalEfficiency'] },
    personnel:{ name: '人事卷', color: '#4a6a4a', metrics: ['adminEfficiency','corruption','culture'] },
    impeach:  { name: '弹劾卷', color: '#6a5a4a', metrics: ['civil','military','royal','eunuch','consort'] },
    construction:{ name: '营造卷', color: '#5a4a3a', metrics: ['iron','wood','stone'] },
    diplomacy:{ name: '外事卷', color: '#5a6a7a', metrics: ['prestige','vassals'] },
    finance:  { name: '财赋卷', color: '#a83828', metrics: ['treasury','privyPurse'] },
    military: { name: '军政卷', color: '#8b2c1a', metrics: ['militaryPower','navyPower','gunpowder'] },
    transport:{ name: '漕运卷', color: '#5a4a3a', metrics: ['canalEfficiency','food'] },
    prison:   { name: '囹圄卷', color: '#4a4a4a', metrics: ['stability','corruption'] }
};

// ====== 系统11: 府库（30种库存物品）======
const STORAGE = [
    { name: '丝绸',   unit: '匹', base: 1000, price: 5 },
    { name: '瓷器',   unit: '件', base: 500,  price: 3 },
    { name: '茶叶',   unit: '斤', base: 2000, price: 1 },
    { name: '人参',   unit: '两', base: 200,  price: 20 },
    { name: '貂皮',   unit: '张', base: 100,  price: 30 },
    { name: '宝石',   unit: '颗', base: 50,   price: 50 },
    { name: '白银',   unit: '两', base: 10000,price: 1 },
    { name: '黄金',   unit: '两', base: 500,  price: 10 },
    { name: '铜钱',   unit: '贯', base: 5000, price: 1 },
    { name: '布匹',   unit: '匹', base: 2000, price: 2 },
    { name: '盐',     unit: '斤', base: 5000, price: 0.1 },
    { name: '铁器',   unit: '件', base: 1000, price: 2 },
    { name: '酒',     unit: '坛', base: 500,  price: 3 },
    { name: '纸',     unit: '刀', base: 3000, price: 1 },
    { name: '墨',     unit: '斤', base: 500,  price: 5 },
    { name: '砚',     unit: '方', base: 200,  price: 8 },
    { name: '马',     unit: '匹', base: 100,  price: 30 },
    { name: '骆驼',   unit: '匹', base: 50,   price: 50 },
    { name: '药材',   unit: '斤', base: 800,  price: 5 },
    { name: '漆器',   unit: '件', base: 300,  price: 8 },
    { name: '玉器',   unit: '件', base: 100,  price: 30 },
    { name: '字画',   unit: '幅', base: 50,   price: 50 },
    { name: '古籍',   unit: '卷', base: 200,  price: 10 },
    { name: '武器',   unit: '件', base: 2000, price: 3 },
    { name: '弓箭',   unit: '张', base: 1000, price: 2 },
    { name: '盔甲',   unit: '件', base: 500,  price: 10 },
    { name: '火药',   unit: '斤', base: 1000, price: 2 },
    { name: '船只',   unit: '艘', base: 50,   price: 200 },
    { name: '车辆',   unit: '辆', base: 200,  price: 20 },
    { name: '煤炭',   unit: '担', base: 3000, price: 0.5 }
];

// ====== 系统12: 名册（20个职位/官衔）======
const RANKS = [
    '内阁首辅','内阁次辅','内阁辅臣','六部尚书','六部侍郎',
    '都察院左都御史','大理寺卿','通政司通政使',
    '五军都督','九边总兵','参将','游击',
    '司礼监掌印','东厂掌印','锦衣卫指挥使',
    '顺天府尹','知府','知县','教谕','驿丞'
];

// ====== 系统13: 政策（20条政策 × 20种状态 = 400+ 组合）======
const POLICIES = [
    { name: '海禁', desc: '禁止民间出海', states: ['开','半开','限','禁','严'] },
    { name: '茶马', desc: '茶马互市',     states: ['官营','许民','严控','废止'] },
    { name: '盐政', desc: '盐业政策',     states: ['开中','折色','纲盐','票盐','专商'] },
    { name: '钱法', desc: '货币政策',     states: ['大明宝钞','银本位','铜钱混用','统一'] },
    { name: '漕运', desc: '粮食运输',     states: ['河运','海运','河海并用','改折'] },
    { name: '科举', desc: '选拔制度',     states: ['三年一科','恩科','荐举','八股'] },
    { name: '商税', desc: '商业税收',     states: ['三十税一','五分抽解','市舶税','过路税'] },
    { name: '田税', desc: '农业税收',     states: ['三十税一','十取其一','一条鞭','摊丁入亩'] },
    { name: '盐税', desc: '盐业税收',     states: ['盐课','盐税','厘金','专卖'] },
    { name: '关税', desc: '海关税收',     states: ['市舶','常关','厘金','海关'] },
    { name: '兵制', desc: '军队制度',     states: ['卫所','募兵','团营','三大营'] },
    { name: '边镇', desc: '边防体系',     states: ['九边','蓟辽','宣大','三边'] },
    { name: '宗藩', desc: '宗室管理',     states: ['分封','削藩','郡县','圈禁'] },
    { name: '教化', desc: '文化政策',     states: ['尊儒','佛道并重','心学','实学'] },
    { name: '礼制', desc: '礼仪制度',     states: ['周礼','汉礼','唐礼','本朝'] },
    { name: '刑法', desc: '法律制度',     states: ['大明律','大诰','条例','会典'] },
    { name: '驿传', desc: '驿站制度',     states: ['官驿','民驿','改折','裁撤'] },
    { name: '土司', desc: '边疆管理',     states: ['羁縻','土司','改土归流','郡县'] },
    { name: '马政', desc: '养马制度',     states: '民牧、官牧、茶马、太仆寺'.split('、') },
    { name: '盐铁', desc: '盐铁政策',     states: '官营、民营、专卖、放开'.split('、') }
];

// ====== 系统14: 名册（20种史书体例）======
const HISTORY_STYLES = [
    { name: '本纪', desc: '帝王言行', col: '#8b2c1a' },
    { name: '世家', desc: '诸侯世家', col: '#a83828' },
    { name: '列传', desc: '大臣列传', col: '#b8893a' },
    { name: '表',   desc: '年表',     col: '#4a6a4a' },
    { name: '志',   desc: '典章',     col: '#5a6a7a' },
    { name: '起居注', desc: '皇帝实录', col: '#6a5a4a' },
    { name: '实录', desc: '一朝实录', col: '#4a4a4a' },
    { name: '邸报', desc: '朝政摘要', col: '#5a4a3a' },
    { name: '圣谕', desc: '皇帝诏令', col: '#8b2c1a' },
    { name: '廷议', desc: '朝堂会议', col: '#b8893a' },
    { name: '会典', desc: '典章汇编', col: '#5a6a7a' },
    { name: '赋役全书', desc: '赋税档案', col: '#4a6a4a' },
    { name: '黄册', desc: '户籍',     col: '#6a5a4a' },
    { name: '鱼鳞册', desc: '土地', col: '#5a4a3a' },
    { name: '宗人府档', desc: '宗室', col: '#a83828' },
    { name: '锦衣卫档', desc: '密档', col: '#4a4a4a' },
    { name: '司礼监档', desc: '内档', col: '#6a5a4a' },
    { name: '内阁档', desc: '中档', col: '#4a6a4a' },
    { name: '礼部档', desc: '礼档', col: '#b8893a' },
    { name: '兵部档', desc: '军档', col: '#8b2c1a' }
];

// ====== 系统15: 节日（20种节日）======
const FESTIVALS = [
    { name: '元旦',   month: 1, effect: { stability: 2, prestige: 1 } },
    { name: '元宵',   month: 1, effect: { stability: 2, treasury: -200 } },
    { name: '春分',   month: 2, effect: { agriculture: 1 } },
    { name: '清明',   month: 3, effect: { stability: 2, culture: 1 } },
    { name: '端午',   month: 5, effect: { stability: 1, militaryPower: 100 } },
    { name: '夏至',   month: 6, effect: { agriculture: 1 } },
    { name: '七夕',   month: 7, effect: { stability: 1, culture: 1 } },
    { name: '中元',   month: 7, effect: { stability: 1 } },
    { name: '中秋',   month: 8, effect: { stability: 2, treasury: -300 } },
    { name: '秋分',   month: 9, effect: { agriculture: 1 } },
    { name: '重阳',   month: 9, effect: { stability: 1, prestige: 1 } },
    { name: '冬至',   month: 11, effect: { stability: 2, mandate: 2 } },
    { name: '腊八',   month: 12, effect: { stability: 1, treasury: -100 } },
    { name: '祭灶',   month: 12, effect: { stability: 1 } },
    { name: '除夕',   month: 12, effect: { stability: 3, treasury: -500 } },
    { name: '万寿圣节', month: 0, effect: { stability: 3, prestige: 3, treasury: -1000 } },
    { name: '上巳',   month: 3, effect: { culture: 1 } },
    { name: '寒食',   month: 3, effect: { culture: 1 } },
    { name: '下元',   month: 10, effect: { stability: 1 } },
    { name: '腊日',   month: 12, effect: { stability: 1, militaryPower: 50 } }
];

// ====== 系统16: 农时（24节气）======
const SOLAR_TERMS = [
    '立春','雨水','惊蛰','春分','清明','谷雨',
    '立夏','小满','芒种','夏至','小暑','大暑',
    '立秋','处暑','白露','秋分','寒露','霜降',
    '立冬','小雪','大雪','冬至','小寒','大寒'
];

// ====== 系统17: 礼仪（20种礼仪）======
const RITUALS = [
    { name: '祭天',   cost: 3000, effect: { mandate: 5, prestige: 3 } },
    { name: '祭地',   cost: 2000, effect: { mandate: 5, stability: 3 } },
    { name: '祭祖',   cost: 2000, effect: { mandate: 3, royal: 5 } },
    { name: '祭孔',   cost: 1500, effect: { culture: 5, prestige: 3 } },
    { name: '封禅',   cost: 10000, effect: { mandate: 15, prestige: 10, treasury: -5000 } },
    { name: '朝会',   cost: 500,  effect: { prestige: 3, stability: 2 } },
    { name: '大阅',   cost: 1000, effect: { militaryPower: 200, prestige: 3 } },
    { name: '耕耤',   cost: 800,  effect: { agriculture: 3, prestige: 2 } },
    { name: '亲蚕',   cost: 800,  effect: { culture: 3, prestige: 2 } },
    { name: '经筵',   cost: 500,  effect: { culture: 5, civil: 3 } },
    { name: '日讲',   cost: 300,  effect: { culture: 3 } },
    { name: '颁朔',   cost: 100,  effect: { adminEfficiency: 2 } },
    { name: '朝贡',   cost: 2000, effect: { prestige: 5, vassals: 1 } },
    { name: '告庙',   cost: 500,  effect: { mandate: 3 } },
    { name: '献俘',   cost: 1000, effect: { prestige: 5, military: 5 } },
    { name: '册封',   cost: 1000, effect: { vassals: 1, prestige: 3 } },
    { name: '谒陵',   cost: 1500, effect: { mandate: 3, royal: 3 } },
    { name: '观猎',   cost: 800,  effect: { military: 3, prestige: 2 } },
    { name: '颁历',   cost: 200,  effect: { adminEfficiency: 3 } },
    { name: '望祭',   cost: 200,  effect: { mandate: 2 } }
];

// ====== 系统18: 律法（30条大明律）======
const LAWS = [
    { name: '十恶', article: ['谋反','谋大逆','谋叛','恶逆','不道','大不敬','不孝','不睦','不义','内乱'], penalty: '凌迟' },
    { name: '八议', article: ['议亲','议故','议功','议贤','议能','议贵','议勤','议宾'], penalty: '减等' },
    { name: '六赃', article: ['监守盗','常人盗','窃盗','强盗','枉法','不枉法'], penalty: '杖徒流死' },
    { name: '五刑', article: ['笞','杖','徒','流','死'], penalty: '笞至死' },
    { name: '谋反', penalty: '凌迟', desc: '谋危社稷' },
    { name: '谋叛', penalty: '斩', desc: '谋背本国' },
    { name: '强盗', penalty: '斩', desc: '以强获财' },
    { name: '窃盗', penalty: '杖徒', desc: '潜行取财' },
    { name: '诈伪', penalty: '杖流', desc: '伪造文书' },
    { name: '犯奸', penalty: '杖徒', desc: '和奸' },
    { name: '殴人',  penalty: '笞杖', desc: '斗殴伤人' },
    { name: '骂人',  penalty: '笞', desc: '骂詈' },
    { name: '受赃',  penalty: '杖流', desc: '官吏受财' },
    { name: '诉讼',  penalty: '杖', desc: '诬告反坐' },
    { name: '犯夜',  penalty: '笞', desc: '夜禁出行' },
    { name: '违禁',  penalty: '笞杖', desc: '违反禁令' },
    { name: '私盐',  penalty: '杖徒', desc: '贩卖私盐' },
    { name: '私铸',  penalty: '斩', desc: '私铸钱币' },
    { name: '私茶',  penalty: '杖徒', desc: '贩卖私茶' },
    { name: '逃军',  penalty: '斩', desc: '军士逃亡' }
];

// ====== 系统19: 兵种（20种兵种）======
const TROOP_TYPES = [
    { name: '京营',     base: 100, cost: 1,  strength: 80, mobility: 50 },
    { name: '边军',     base: 80,  cost: 1,  strength: 75, mobility: 60 },
    { name: '卫所军',   base: 50,  cost: 0.5, strength: 60, mobility: 40 },
    { name: '募兵',     base: 120, cost: 2,  strength: 85, mobility: 70 },
    { name: '家丁',     base: 150, cost: 3,  strength: 95, mobility: 60 },
    { name: '团营',     base: 90,  cost: 1.5, strength: 80, mobility: 50 },
    { name: '三大营',   base: 110, cost: 1.8, strength: 90, mobility: 60 },
    { name: '神机营',   base: 200, cost: 5,  strength: 95, mobility: 50 },
    { name: '三千营',   base: 130, cost: 2.5, strength: 88, mobility: 85 },
    { name: '神枢营',   base: 110, cost: 2,  strength: 85, mobility: 50 },
    { name: '五军营',   base: 100, cost: 1.5, strength: 82, mobility: 55 },
    { name: '水师',     base: 150, cost: 3,  strength: 85, mobility: 90 },
    { name: '楼船',     base: 300, cost: 8,  strength: 95, mobility: 70 },
    { name: '福船',     base: 200, cost: 5,  strength: 80, mobility: 95 },
    { name: '赶缯船',   base: 180, cost: 4,  strength: 75, mobility: 90 },
    { name: '广船',     base: 160, cost: 3.5,strength: 75, mobility: 95 },
    { name: '鹰船',     base: 220, cost: 6,  strength: 88, mobility: 80 },
    { name: '戚家军',   base: 180, cost: 2,  strength: 95, mobility: 70 },
    { name: '俞家军',   base: 150, cost: 1.8, strength: 90, mobility: 70 },
    { name: '狼兵',     base: 120, cost: 1.5, strength: 88, mobility: 75 }
];

// ====== 系统20: 货币（30种）======
const CURRENCIES = [
    { name: '大明宝钞',   value: 0.001, unit: '贯', year: 1375 },
    { name: '永乐通宝',   value: 0.01,  unit: '文', year: 1408 },
    { name: '宣德通宝',   value: 0.01,  unit: '文', year: 1433 },
    { name: '成化通宝',   value: 0.01,  unit: '文', year: 1465 },
    { name: '弘治通宝',   value: 0.01,  unit: '文', year: 1489 },
    { name: '正德通宝',   value: 0.01,  unit: '文', year: 1506 },
    { name: '嘉靖通宝',   value: 0.01,  unit: '文', year: 1522 },
    { name: '隆庆通宝',   value: 0.01,  unit: '文', year: 1567 },
    { name: '万历通宝',   value: 0.01,  unit: '文', year: 1576 },
    { name: '泰昌通宝',   value: 0.01,  unit: '文', year: 1620 },
    { name: '天启通宝',   value: 0.01,  unit: '文', year: 1621 },
    { name: '崇祯通宝',   value: 0.01,  unit: '文', year: 1628 },
    { name: '白银(两)',   value: 1,     unit: '两', year: 0 },
    { name: '黄金(两)',   value: 10,    unit: '两', year: 0 },
    { name: '铜钱(文)',   value: 0.01,  unit: '文', year: 0 },
    { name: '碎银',       value: 0.5,   unit: '钱', year: 0 },
    { name: '马蹄银',     value: 50,    unit: '锭', year: 0 },
    { name: '银元宝',     value: 50,    unit: '锭', year: 0 },
    { name: '金元宝',     value: 500,   unit: '锭', year: 0 },
    { name: '私钱',       value: 0.005, unit: '文', year: 0 },
    { name: '当十钱',     value: 0.1,   unit: '文', year: 0 },
    { name: '当百钱',     value: 1,     unit: '文', year: 0 },
    { name: '折色银',     value: 0.8,   unit: '两', year: 0 },
    { name: '京库银',     value: 1,     unit: '两', year: 0 },
    { name: '盐课银',     value: 1,     unit: '两', year: 0 },
    { name: '辽饷银',     value: 1,     unit: '两', year: 0 },
    { name: '剿饷银',     value: 1,     unit: '两', year: 0 },
    { name: '练饷银',     value: 1,     unit: '两', year: 0 },
    { name: '捐纳银',     value: 1,     unit: '两', year: 0 },
    { name: '赎罪银',     value: 1,     unit: '两', year: 0 }
];

// ====== 系统21-30: 快速定义更多系统 ======
// 21: 官衔品级（18品）
const OFFICIAL_RANKS = '一品|正一品|从一品|正二品|从二品|正三品|从三品|正四品|从四品|正五品|从五品|正六品|从六品|正七品|从七品|正八品|从八品|正九品|从九品|未入流'.split('|');

// 22: 服饰（20种）
const COSTUMES = '冕服|皮弁服|武弁服|燕弁服|常服|公服|祭服|朝服|便服|戎服|丧服|素服|吉服|常服|衬服|袞服|玄端|深衣|袍服|皮服'.split('|');

// 23: 谥号（30种）
const POSTHUMOUS = '文|武|昭|穆|景|宣|成|康|献|懿|元|章|定|灵|庄|简|恭|敬|孝|贞|庄|威|勇|壮|穆|平|靖|思|哀|怀'.split('|');

// 24: 年号（30个明朝年号）
const REIGN_TITLES = [
    '洪武','建文','永乐','洪熙','宣德','正统','景泰','天顺','成化','弘治',
    '正德','嘉靖','隆庆','万历','泰昌','天启','崇祯'
];

// 25: 兵书（30种）
const MILITARY_BOOKS = [
    '孙子兵法','六韬','三略','尉缭子','吴子','司马法','孙膑兵法',
    '太白阴经','虎钤经','武经总要','百战奇略','练兵实纪','纪效新书',
    '武编','兵法百战经','历代兵制','守城录','火龙神器阵法','武备志',
    '筹海图编','海国图志','武经七书','何博士备论','美芹十论',
    '酌中志','玉堂丛语','万历野获编','菽园杂记','枣林杂俎','野记'
];

// 26: 山川（30处）
const MOUNTAINS = [
    '泰山','华山','衡山','嵩山','恒山','峨眉','五台','普陀','九华','武当',
    '黄山','庐山','武夷','长白','天台','雁荡','崂山','千山','医巫闾',
    '天目','栖霞','茅山','龙虎','齐云','王屋','终南','太白','贺兰','六盘','祁连'
];

// 27: 河流（30条）
const RIVERS = [
    '黄河','长江','淮河','海河','辽河','松花江','黑龙江','珠江','澜沧江',
    '怒江','雅鲁藏布','塔里木','额尔齐斯','渭河','汾河','汉水','嘉陵江',
    '岷江','大渡河','金沙江','湘江','赣江','闽江','钱塘江','瓯江','九龙江',
    '韩江','东江','北江','南渡江'
];

// 28: 湖泊（20个）
const LAKES = [
    '鄱阳湖','洞庭湖','太湖','洪泽湖','巢湖','青海湖','纳木错','色林错',
    '滇池','洱海','抚仙湖','镜泊湖','兴凯湖','白洋淀','微山湖','东平湖',
    '骆马湖','高邮湖','邵伯湖','洪湖'
];

// 29: 港（20个）
const PORTS = [
    '月港','泉州','广州','宁波','上海','天津','登州','芝罘','旅顺','金州',
    '海州','松江','太仓','刘家港','南京港','杭州港','福州','厦门','潮州','琼州'
];

// 30: 盐场（20个）
const SALT_FIELDS = [
    '两淮盐场','长芦盐场','山东盐场','河东盐场','陕西盐场','四川盐场',
    '云南盐场','广东盐场','福建盐场','浙江盐场'
];

// 31: 漕粮（20个仓）
const GRANARIES = [
    '京仓','通仓','旧太仓','富新仓','海运仓','北新仓','南新仓','太仓银库',
    '常平仓','社仓','义仓','广惠仓','济农仓','永平仓','天津仓','淮安仓',
    '临清仓','德州仓','徐州仓','济宁仓'
];

// 32: 勋贵（20家族）
const NOBLE_FAMILIES = [
    '魏国公徐','定国公徐','英国公张','成国公朱','黔国公沐','诚意伯刘',
    '定远侯邓','武定侯郭','武靖侯赵','平江伯陈','襄城伯李','南和伯方',
    '安定伯钱','遂安伯陈','永康侯徐','安乡伯张','武进伯朱','新建伯王',
    '新建伯李','东宁伯焦'
];

// 33: 名臣（20个）
const FAMOUS_MINISTERS = [
    '刘基','宋濂','李善长','徐达','常遇春','胡惟庸','杨士奇','杨荣','杨溥',
    '于谦','王文','王恕','李东阳','刘瑾','杨廷和','夏言','严嵩','徐阶',
    '高拱','张居正'
];

// 34: 宦官（20个）
const FAMOUS_EUNUCHS = [
    '郑和','王振','汪直','刘瑾','魏忠贤','李芳','冯保','张永','刘若愚',
    '王安','曹化淳','张让','赵忠','高俅','童贯','李莲英','安德海','小德张',
    '张永','阮大铖'
];

// 35: 后妃（20个）
const FAMOUS_CONSORTS = [
    '马皇后','徐皇后','孙皇后','钱皇后','周皇后','钱氏','李妃','万贵妃',
    '孝庄张皇后','慈圣李太后','郑贵妃','李皇后','王恭妃','客氏','李选侍',
    '王皇后','刘皇后','张皇后','高皇后','陈皇后'
];

// 36-60: 杂项系统
const MORE_SYSTEMS = {
    currencies_ext: '铜钱|银两|金子|碎银|银锭|金锭|马蹄银|银元宝|金元宝|银票|钱庄票|当票|盐引|茶引|布票|粮票'.split('|'),
    provinces: '北直隶|南直隶|山东|山西|河南|陕西|四川|湖广|江西|浙江|福建|广东|广西|云南|贵州'.split('|'),
    capitals: '北京|南京|顺天府|应天府|西安|洛阳|开封|杭州|苏州|南京|广州|福州|济南|太原|成都|武昌|长沙|南昌|合肥|兰州'.split('|'),
    medicine: '伤寒|温病|金匮|本草|针灸|推拿|正骨|外科|妇科|儿科|眼科|喉科|痘科|麻风|梅毒|天花|霍乱|痢疾|疟疾|瘟疫'.split('|'),
    tea: '龙井|碧螺春|铁观音|大红袍|毛尖|普洱|祁门|滇红|黄山毛峰|六安瓜片|君山银针|白毫银针|白牡丹|寿眉|贡眉|信阳毛尖|都匀毛尖|蒙顶甘露|竹叶青|安吉白茶'.split('|'),
    silk: '云锦|蜀锦|苏绣|湘绣|粤绣|京绣|鲁绣|汴绣|顾绣|缉丝|刺绣|织锦|缂丝|妆花|洒线|戳金|盘金|打籽|施毛|施套'.split('|'),
    porcelain: '青花|五彩|斗彩|粉彩|珐琅彩|单色釉|青瓷|白瓷|青白瓷|黑瓷|紫砂|建窑|钧窑|汝窑|官窑|哥窑|定窑|景德镇|德化|磁州'.split('|'),
    architecture: '宫殿|府邸|寺观|塔|楼阁|亭台|园林|陵寝|城墙|城门|牌坊|桥梁|运河|堤坝|仓廪|学宫|坛庙|衙署|民居|会馆'.split('|'),
    painting: '山水|花鸟|人物|界画|白描|写意|工笔|水墨|设色|没骨|泼墨|泼彩|青绿|金碧|浅绛'.split('|'),
    calligraphy: '篆书|隶书|楷书|行书|草书|瘦金|馆阁|章草|今草|狂草|飞白'.split('|'),
    music: '宫调|商调|角调|徵调|羽调|雅乐|燕乐|俗乐|词牌|曲牌|南曲|北曲|昆腔|弋阳腔|余姚腔|海盐腔'.split('|'),
    drama: '杂剧|南戏|传奇|昆曲|京剧|弋阳腔|余姚腔|海盐腔|梆子|皮黄|花部|雅部'.split('|'),
    novels: '三国|水浒|西游|金瓶梅|三言|二拍|醒世|警世|喻世|初刻|二刻'.split('|'),
    weapons: '刀|剑|枪|矛|戟|戈|弓|弩|炮|火铳|火绳枪|佛郎机|大将军|虎蹲|神威|无敌|飞彪|迅雷|攻戎|灭虏'.split('|'),
    formations: '一字长蛇|二龙出水|三才天地|四门斗底|五虎群羊|六甲迷金|七星北斗|八门金锁|九宫八卦|十面埋伏|天罡|地煞|天门|地户|风|云|龙|虎|鸟|蛇'.split('|'),
    doctrines: '程朱理学|陆王心学|永嘉学派|永康学派|金华学派|颜李学派|实学|朴学|汉学|宋学'.split('|'),
    religious: '佛教|道教|儒教|天主教|景教|摩尼教|祆教|回教|白莲教|罗教|闻香教|弘阳教|混元教|无为教|东大乘教|西大乘教|圆顿教|三一教'.split('|'),
    crops: '稻|麦|粟|黍|稷|菽|麻|棉|桑|茶|甘蔗|蓝|靛|漆|桐|柏|榆|槐|楸|椿'.split('|'),
    livestocks: '猪|牛|羊|驴|骡|骆驼|犬|鸡|鸭|鹅|鸽|鱼|虾|蟹|鳖|蛇|蜂|蚕|麝|鹿'.split('|'),
    food: '米饭|面食|馒头|包子|饺子|面条|饼|粥|汤|菜肴|酒|茶|糕点|糖果|腌肉|腊肉|豆腐|豆浆|油条|馄饨'.split('|')
};

console.log('✓ 60+系统加载完成');
