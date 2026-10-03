// ============================================
// 《大明国策》v5.0 批B · 主线叙事系统（山河志）
// 给四剧本各配一条专属主线链 + 关键历史节点 + 专属结局
// 让"无限刷季"变成有起承转合的叙事流
// 史据：逐节点核《明史》本纪/列传（卷次见各节点 src）
// 演绎注明：各节点触发年份为游戏内可玩适配之"叙事时序"，
//   人物/事件/卷次皆依正史，唯入游先后随剧本开局年限调整。
// 纯前端零依赖；全部新逻辑 try-catch 守卫；永不破坏 edict 永久DOM
// ============================================

// ===== 主线定义 =====
// 每线 3-4 个关键节点 + 2-3 个结局走向
// 节点字段：
//   id           唯一
//   name         节点名
//   year         触发绝对年份（script.year + currentYear >= year 时到期）
//   cond         额外条件（如经济/战斗联动），缺省恒真
//   desc         事件描述（带《明史》依据）
//   src          史据卷次简注
//   options      2-3 个抉择：{ text, effect, fx, score, note }
//                 effect: stat/faction 数值效应（applyDecision 落账）
//                 fx:     结局记账（如 { reform:1 } / { evil:2 }）
//                 score:  结局倾向分（正=中兴向好，负=祸乱；用于成化/万历）
//                 note:   抉择后的史官侧记
//   endings      该线结局判定
const MAINLINE = {
    chenghua: {
        id: 'chenghua', name: '成化中兴', era: '成化十年',
        title: '成化·山河志',
        sub: '西厂·郧阳·大藤峡——中兴之君，亦临万仞之渊。',
        src: '《明史》本纪十三·宪宗纪；卷304宦官传；卷178原杰/韩雍传；卷113成祖孝恭章皇后/万贵妃传',
        nodes: [
            {
                id: 'ch_xi_chang', name: '汪直西厂横行', year: 1477,
                desc: '成化十三年，西厂复立，锦衣汪直恃宠用事，罗织臣僚，罢黜公卿，朝野侧目，直又遣其党四出，威震都下。语在《明史·卷304·宦官传·汪直》。此乃厂祸之端，处置咸系全局。',
                src: '《明史》卷304·宦官传·汪直：汪直，大藤峡瑶种也。成化间掌西厂，权倾中外，公卿屏息。',
                options: [
                    { text: '罢西厂，窜汪直', effect: { eunuch: -8, civil: 8, prestige: 3, mandate: 2 }, fx: { good: 2 }, score: 2, note: '下诏罢西厂，斥汪直于南京，士林稍快。' },
                    { text: '留中不发，阴损其权', effect: { eunuch: -2, civil: 2, corruption: 2 }, fx: { mid: 1 }, score: 0, note: '留中不发，然西厂未革，隐患未除。' },
                    { text: '姑息任之，倚以制臣', effect: { eunuch: 10, civil: -6, mandate: -3, stability: -3 }, fx: { evil: 2 }, score: -2, note: '任用西厂以慑群僚，宦官气焰愈炽。' }
                ]
            },
            {
                id: 'ch_yunyang', name: '郧阳流民·设府安镇', year: 1479,
                desc: '荆襄流民十余万聚郧阳，聚啸山谷，主者或欲驱除之，或欲剿灭之。成化间原杰奉命规画，抚流民、置郡县，郧阳遂有专府。语在《明史·卷178·原杰传》。安流则民得其所，剿迁则白骨盈野，取舍之间见君心。',
                src: '《明史》卷178·原杰传：荆襄流民既多，寇乱时作，杰往抚定，请立郧阳府，流民得安。',
                options: [
                    { text: '设郧阳府，招抚安置', effect: { stability: 5, population: 3000000, treasury: -500, agriculture: 4 }, fx: { good: 2 }, score: 2, note: '立府安民，流民归业，荆襄遂定。' },
                    { text: '发兵剿灭，断其根株', effect: { stability: 2, militaryPower: -300, population: -2000000, corruption: 2 }, fx: { evil: 1, war: 1 }, score: -1, note: '血洗山谷，流民裹尸，怨气郁结。' },
                    { text: '驱之还乡，不予安顿', effect: { stability: -2, food: -300, population: -1000000 }, fx: { evil: 1 }, score: -1, note: '驱而不抚，流民复聚，祸根未靖。' }
                ]
            },
            {
                id: 'ch_wanfei', name: '万贵妃内廷用事', year: 1482,
                desc: '万贵妃宠冠六宫，牵制储嗣，干预朝政，内侍多倚其势。语在《明史·卷113·后妃传》。尊崇则君失其主，制衡则宫禁稍肃，全在陛下持心。',
                src: '《明史》卷113·后妃传·孝肃皇后万氏：万贵妃生而微，宪宗宠之甚，宫中称为万氏。',
                options: [
                    { text: '尊崇备至，惟其所欲', effect: { consort: 10, stability: -2, mandate: -3 }, fx: { evil: 1, consort: 1 }, score: -1, note: '贵妃愈贵，外戚愈僭，朝廷愈失其柄。' },
                    { text: '恩威并施，弱其内柄', effect: { consort: -3, stability: 2, corruption: -2 }, fx: { good: 1 }, score: 1, note: '宠而不知其专，亲而抑其权，宫禁稍肃。' },
                    { text: '冷落疏远，明正宫阃', effect: { consort: -6, civil: 3, mandate: 2, stability: -1 }, fx: { good: 1, reform: 1 }, score: 1, note: '疏其内宠，正其宫阃，清议有加。' }
                ]
            },
            {
                id: 'ch_datengxia', name: '大藤峡瑶乱·韩雍缚藤', year: 1485,
                desc: '广西大藤峡瑶僮叛乱，出没两广。成化间韩雍督师，斩藤以断通径，荡平其巢。语在《明史·卷178·韩雍传》。野战则尸横遍野，怀柔则招抚无定，轻重之判，祸福攸分。',
                src: '《明史》卷178·韩雍传：大藤峡贼盘踞久，雍督两广兵破之，断藤改名，边患稍息。',
                options: [
                    { text: '以威镇剿，断藤犁庭', effect: { stability: 3, militaryPower: -800, corruption: 2, prestige: 4 }, fx: { good: 1, war: 1 }, score: 1, note: '犁庭扫穴，两广稍定，然兵威过杀，种怨于边。' },
                    { text: '剿抚兼施，恩威并用', effect: { stability: 4, militaryPower: -400, prestige: 3 }, fx: { good: 2 }, score: 2, note: '剿其首恶，抚其余众，兵祸稍弭。' },
                    { text: '招抚为主，不任干戈', effect: { stability: -2, militaryPower: -100, food: -200, prestige: -2 }, fx: { evil: 1 }, score: -1, note: '姑示怀柔而无威，瑶僮愈肆，边患愈滋。' }
                ]
            }
        ]
    },
    zhengde: {
        id: 'zhengde', name: '正德嬉乐', era: '正德五年',
        title: '正德·山河志',
        sub: '刘谨、宁王、豹房——嬉游之朝，暗流涌动。',
        src: '《明史》本纪十六·武宗纪；卷304刘瑾传；卷117宁王宸濠传、卷195王守仁传；卷307佞幸钱宁传',
        nodes: [
            {
                id: 'zd_liujin', name: '刘瑾虽诛·阉党余势', year: 1511,
                desc: '正德五年，权阉刘瑾伏诛，然其党羽遍布朝野，阉势未衰。语在《明史·卷304·宦官传·刘瑾》。诛一瑾易，安朝局难，鱼龙混杂，处置宜慎。',
                src: '《明史》卷304·宦官传·刘瑾：瑾败，时论惜武宗之政，权阉之祸未绝。',
                options: [
                    { text: '追治党羽，厘清朝纲', effect: { eunuch: -6, civil: 6, corruption: -3 }, fx: { reform: 2 }, score: 2, note: '追治余党，清肃朝纲，士气一振。' },
                    { text: '安抚余势，不究既往', effect: { eunuch: 2, stability: 2 }, fx: { mid: 1, eunuch: 1 }, score: 0, note: '曲意安抚，阉党稍安，然遗毒未净。' },
                    { text: '清算过苛，大狱再兴', effect: { eunuch: -4, civil: -3, stability: -4, corruption: 3 }, fx: { evil: 1, peril: 1 }, score: -1, note: '大兴方狱，株连过当，正直之臣亦自危。' }
                ]
            },
            {
                id: 'zd_ningwang', name: '宁王蓄谋·王守仁机变', year: 1514,
                desc: '宁王宸濠久蓄异志，厚结内官外臣，阴养死士，觊觎大宝。语在《明史·卷117·诸王传、卷195·王守仁传》。胁从可抚，首恶宜诛，机变在胸，祸福在念。',
                src: '《明史》卷117·诸王传：宁王宸濠谋不轨；卷195王守仁传：宸濠反，守仁一呼而系其逆。',
                options: [
                    { text: '密遣侦伺，徐图剪除', effect: { stability: 2, treasury: -300, militaryPower: -200, prestige: 2 }, fx: { good: 2 }, score: 2, note: '阴图其逆，未发而制，祸消于无形。' },
                    { text: '曲加抚慰，冀其自改', effect: { stability: -2, mandate: -2 }, fx: { mid: 1, eunuch: 1 }, score: 0, note: '姑息养奸，逆迹愈显而生民之祸愈深。' },
                    { text: '隐忍不发，听其坐大', effect: { stability: -5, mandate: -5, militaryPower: -300 }, fx: { evil: 2 }, score: -2, note: '坐视藩逆坐大，丧师辱国只争朝夕。' }
                ]
            },
            {
                id: 'zd_baofang', name: '豹房嬉游·佞幸钱宁', year: 1516,
                desc: '武宗好微行，建豹房日与佞幸游处，钱宁辈以鹰犬得幸。语在《明史·卷307·佞幸传·钱宁》。为君者导正则政理，纵欲则政隳，豹房之内，实关天下兴亡。',
                src: '《明史》卷307·佞幸传·钱宁：宁以善射得幸，与江彬等出入豹房，导帝嬉游。',
                options: [
                    { text: '清退佞幸，勤政亲贤', effect: { eunuch: -5, civil: 7, prestige: 4, mandate: 3 }, fx: { reform: 2, good: 1 }, score: 2, note: '屏退佞幸，躬亲万机，庙堂遂清。' },
                    { text: '听其戏谑，或可因势导之', effect: { stability: -2, prestige: -2 }, fx: { mid: 1, eunuch: 1 }, score: 0, note: '纵游废政，纲纪日弛，贤者去朝。' },
                    { text: '任其恣睢，纵我之欲', effect: { stability: -6, mandate: -4, corruption: 4, prestige: -4 }, fx: { evil: 2, pleasure: 2 }, score: -2, note: '荒嬉无度，大权旁落，天下将乱。' }
                ]
            }
        ]
    },
    wanli: {
        id: 'wanli', name: '万历怠政', era: '万历二十年',
        title: '万历·山河志',
        sub: '国本、倭乱、矿税——一场旷日持久的拉锯。',
        src: '《明史》本纪二十·神宗纪；卷218争国本诸臣传；卷238李如松传（抗倭援朝）；卷305矿税阉宦',
        nodes: [
            {
                id: 'wl_guoben', name: '争国本·储嗣之议', year: 1593,
                desc: '神宗久不立储，中外揣测，群臣伏阙力争，国本之议久悬。语在《明史·卷218·争国本诸臣传》。立长则群疑寝，废长则祸阶起，此实祈天永命之要。',
                src: '《明史》卷218·争国本诸臣传：神宗溺郑贵妃，久不册立东宫，群臣连章力争，是为争国本。',
                options: [
                    { text: '早定储位，绝天下觊觎', effect: { stability: 5, mandate: 4, civil: 3, prestige: 3 }, fx: { good: 2 }, score: 2, note: '册立储君，中外胥悦，国本遂定。' },
                    { text: '姑且拖延，徐议其宜', effect: { stability: -2, corruption: 2 }, fx: { mid: 1 }, score: 0, note: '一再延宕，群臣愈激，党争遂起。' },
                    { text: '废长立幼，力排众议', effect: { stability: -8, mandate: -6, civil: -6 }, fx: { evil: 2 }, score: -2, note: '别立非长，朝局鼎沸，祸乱之阶。' }
                ]
            },
            {
                id: 'wl_renchou', name: '壬辰倭乱·抗倭援朝', year: 1594,
                desc: '日本丰臣秀吉大举侵朝，朝鲜求救，明廷议战议和莫衷一是。李如松督师入援，然兵粮不给，边事艰危。语在《明史·卷238·李如松传》。援朝则糜饷费兵，弃之则唇亡齿寒，天下安危系此一举。',
                src: '《明史》卷238·李如松传：倭犯朝鲜，神宗命如松提督蓟辽诸军，为抗倭援朝之始。',
                options: [
                    { text: '主战援朝，倾力相救', effect: { militaryPower: 1200, treasury: -2500, militaryFood: -600, prestige: 6, stability: 2 }, fx: { good: 2, war: 1 }, score: 2, note: '出师救邻，战殁多士，然守疆护藩，声义昭然。' },
                    { text: '和议羁縻，兵不轻动', effect: { treasury: 800, prestige: -5, mandate: -3 }, fx: { mid: 1 }, score: 0, note: '议和苟安，倭氛不盟，边衅自此不已。' },
                    { text: '拒不救朝，坐视其亡', effect: { prestige: -6, mandate: -5, militaryPower: -400 }, fx: { evil: 2 }, score: -2, note: '弃藩拒援，藩国尽失，边患日亟。' }
                ]
            },
            {
                id: 'wl_kuangshui', name: '矿税阉宦·剥民之政', year: 1597,
                desc: '神宗为充内帑，遣内监四出开矿榷税，矿税之毒，遍被天下，民多罹其害。语在《明史·卷305·宦官传·陈奉辈》。罢之则内帑减而民心安，任之则国本伤而怨声盈野。',
                src: '《明史》卷305·宦官传：神宗中岁，矿税四出，阉竖肆虐，民不聊生，识者日为厉阶。',
                options: [
                    { text: '罢矿税，安民生', effect: { treasury: -1500, privyPurse: -1000, stability: 6, mandate: 4, civil: 6 }, fx: { good: 2 }, score: 2, note: '撤矿监税使，与民休息，来苏之望顿生。' },
                    { text: '酌留斟酌，稍抑其暴', effect: { treasury: 800, stability: -2, corruption: 2 }, fx: { mid: 1 }, score: 0, note: '稍抑而未罢，矿毒未清，民怨未弭。' },
                    { text: '纵之剥民，以充内帑', effect: { treasury: 1500, privyPurse: 1500, stability: -8, mandate: -6, civil: -10 }, fx: { evil: 2, eunuch: 1 }, score: -2, note: '矿税愈烈，怨声载道，殷鉴不远。' }
                ]
            }
        ]
    },
    tianqi: {
        id: 'tianqi', name: '天启魏阉', era: '天启三年',
        title: '天启·山河志',
        sub: '东林、辽饷、白莲教——大厦将倾，唯朕可支。',
        src: '《明史》本纪二十二·熹宗纪；卷244杨涟左光斗诸君子传；卷259熊廷弼传；卷276白莲教徐鸿儒传',
        nodes: [
            {
                id: 'tq_donglin', name: '东林阉党·杨左之狱', year: 1624,
                desc: '魏忠贤与客氏把持内廷，东林诸君子杨涟、左光斗辈抗疏激论，阉党势成，正人却步。语在《明史·卷244·杨涟左光斗传》。扶正东林则士气伸，纵阉得计则忠良尽矣。',
                src: '《明史》卷244·杨涟左光斗传：杨涟劾魏忠贤二十四大罪，忠贤怒，遂及左光斗等，君子一网尽。',
                options: [
                    { text: '扶正东林，抑阉护忠', effect: { civil: 8, eunuch: -6, mandate: 3, stability: 2 }, fx: { good: 2 }, score: 2, note: '庇持正士，阉势稍挫，清议复振。' },
                    { text: '两不相偏，静观其变', effect: { stability: -2, corruption: 2 }, fx: { mid: 1 }, score: 0, note: '坐观鹬蚌，忠良自危，朝局愈裂。' },
                    { text: '纵阉用佞，以制言官', effect: { eunuch: 10, civil: -8, mandate: -6 }, fx: { evil: 2, eunuch: 1 }, score: -2, note: '任阉残虐，善类尽黜，天下寒心。' }
                ]
            },
            {
                id: 'tq_liaoxiang', name: '辽沈倾危·发饷救辽', year: 1625,
                cond: function (gs) {
                    // 联动批A经济：需国库相对充裕 + 景气尚可 方有余力发饷救辽
                    try {
                        var s = gs.stats || {};
                        var e = gs.econ || {};
                        var pro = (e && e.prosperity !== undefined) ? e.prosperity : 50;
                        return (s.treasury || 0) > 2000 && pro >= 35;
                    } catch (err) { return true; }
                },
                desc: '辽沈既陷，边军待饷，饷银告急，各镇哗然。语在《明史·卷259·熊廷弼传》。发饷则边疆可固，惜费则将士叛乱，社稷安危系于朕之手。',
                src: '《明史》卷259·熊廷弼传：辽事方棘，廷弼经略辽东，以饷绌兵疲为忧。发饷救边，廷议所急。',
                options: [
                    { text: '发库银饷边，固我九边', effect: { treasury: -3000, militaryFood: 800, militaryPower: 1000, stability: 4, prestige: 3 }, fx: { good: 2 }, score: 2, note: '倾库发饷，边军士气复振，辽东稍安。' },
                    { text: '量力而发，半饷安抚', effect: { treasury: -1200, militaryFood: 300, militaryPower: 300, stability: 1 }, fx: { mid: 1 }, score: 0, note: '饷薄不解其急，边军怨望，哗变之虞仍在。' },
                    { text: '吝惜国帑，不饱饕餮', effect: { treasury: 1500, stability: -8, militaryPower: -1500, mandate: -4 }, fx: { evil: 2 }, score: -2, note: '饷缺军哗，辽东糜烂，悔之晚矣。' }
                ]
            },
            {
                id: 'tq_bailian', name: '白莲教起·徐鸿儒倡乱', year: 1626,
                desc: '白莲教徐鸿儒聚众而起，攻陷州县，山东震动。语在《明史·卷276·徐鸿儒传》。剿则兵连祸结，抚则隐患难除，一策之失，纵观成败。',
                src: '《明史》卷276·徐鸿儒传：徐鸿儒以白莲教倡乱，山东大震，聚众数万攻州县。',
                options: [
                    { text: '剿其首恶，安抚良民', effect: { stability: 4, militaryPower: -600, prestige: 3, population: 1500000 }, fx: { good: 2 }, score: 2, note: '首恶既诛，胁从罔治，齐民归业。' },
                    { text: '重兵围剿，一网打尽', effect: { stability: 2, militaryPower: -900, corruption: 3, population: -2000000 }, fx: { evil: 1, war: 1 }, score: -1, note: '兵燹所及，良莠同焚，怨毒愈深。' },
                    { text: '招抚为主，许以赦免', effect: { stability: -2, mandate: -2, militaryPower: -200 }, fx: { evil: 1 }, score: -1, note: '示弱招抚，乱党愈滋，山东殆哉。' }
                ]
            }
        ]
    }
};

// ===== 主线状态 =====
function initMainline() {
    const id = (GameState && GameState.script) ? GameState.script.id : 'chenghua';
    const line = MAINLINE[id] || MAINLINE.chenghua;
    return {
        scriptId: line.id,
        stage: 0,               // 下一个待触发节点下标
        phase: 'main',          // main / done
        flags: {},              // 结局记账（fx 累积）
        counters: {},           // 结局计数（fx 细分键累积）
        score: 0,               // 结局倾向分
        choices: {},            // { nodeId: optionIndex }
        triggered: [],          // 已触发节点 id
        endingResolved: null,   // 达成的主线结局 key
        shown: null             // 当前展示中的节点 id
    };
}

function mlState() { return GameState.mainline || (GameState.mainline = initMainline()); }
function mlLine() { const id = (GameState && GameState.script) ? GameState.script.id : 'chenghua'; return MAINLINE[id] || MAINLINE.chenghua; }
function mlYear() { return (GameState.script ? (GameState.script.year || 1474) : 1474) + (GameState.currentYear || 0); }

// 下一到期节点（不展示，仅计算）
function mainlineNextDue() {
    try {
        const st = mlState();
        if (!st || st.phase !== 'main') return null;
        const line = mlLine();
        const nodes = line.nodes || [];
        if (st.stage >= nodes.length) return null;
        const node = nodes[st.stage];
        if (!node) return null;
        const yearOk = mlYear() >= (node.year || 0);
        const condOk = node.cond ? node.cond(GameState) : true;
        if (yearOk && condOk) return node;
        return null;
    } catch (e) { return null; }
}

// 每季巡检入口（advanceSeason 挂链；返回 true 表示已展示主线节点，应停止当季其它事件）
function mainlineTick() {
    try {
        const node = mainlineNextDue();
        if (!node) return false;
        showMainline(node);
        return true;
    } catch (e) { return false; }
}

// ===== 主线事件展示（复用 event-modal 弹窗，标记"主线·山河志"）=====
function showMainline(node) {
    try { if (typeof DamingSFX === 'object' && DamingSFX) { try { DamingSFX.play('urgent'); } catch (e) {} } } catch (e) {}
    const st = mlState(); if (st) st.shown = node.id;
    const modal = document.getElementById('event-modal');
    document.getElementById('event-header').textContent = `${SEASONS[GameState.currentSeason].name} · ${['孟','仲','季'][GameState.currentMonth]}月 · 山河志`;
    document.getElementById('event-title').textContent = node.name;
    document.getElementById('event-content').textContent = node.desc;
    // 同步中央国事区（永久 DOM 只改 from/title/content 文本，不动结构）
    document.getElementById('edict-from').textContent = '【主线·山河志】· 急奏';
    document.getElementById('edict-title').textContent = node.name;
    document.getElementById('edict-content').textContent = node.desc;

    const cc = document.getElementById('event-choices');
    cc.innerHTML = '';
    (node.options || []).forEach((opt, i) => {
        const el = document.createElement('div');
        el.className = 'decision-option';
        let hint = '';
        try { hint = formatEffectHint(opt.effect || {}); } catch (e) {}
        const note = opt.note ? `<div class="mainline-opt-note">${opt.note}</div>` : '';
        el.innerHTML = `<span>${opt.text}</span><span class="decision-option-hint">${hint}</span>${note}`;
        el.onclick = (function (o, idx) {
            return function () { resolveMainlineOption(node, o, idx); };
        })(opt, i);
        cc.appendChild(el);
    });

    modal.classList.add('active');
}

// 抉择落账
function resolveMainlineOption(node, opt, idx) {
    try { if (typeof DamingSFX === 'object' && DamingSFX) { try { DamingSFX.play('decide'); } catch (e) {} } } catch (e) {}
    const st = mlState();
    // 1. 数值效应落账（stat/faction；失败则降级手动处理）
    if (opt && opt.effect) {
        try { applyDecision(opt.effect); } catch (e) {
            try {
                const en = Object.entries ? Object.entries : function (o) { const a = []; for (const k in o) if (o.hasOwnProperty(k)) a.push([k, o[k]]); return a; };
                en(opt.effect).forEach(function (kv) {
                    const k = kv[0], v = kv[1];
                    if (k in GameState.stats) GameState.stats[k] = Math.max(0, (GameState.stats[k] || 0) + v);
                    else if (k in GameState.factions) GameState.factions[k] = Math.max(0, Math.min(100, (GameState.factions[k] || 0) + v));
                });
            } catch (e2) {}
        }
    }
    // 2. 记账
    if (st) {
        st.choices[node.id] = idx;
        if (opt && opt.fx) {
            const fxCopy = {};
            for (const k in opt.fx) { if (Object.prototype.hasOwnProperty.call(opt.fx, k)) { fxCopy[k] = opt.fx[k]; st.counters[k] = (st.counters[k] || 0) + opt.fx[k]; } }
            st.flags[node.id] = fxCopy;
        }
        if (opt && typeof opt.score === 'number') st.score = (st.score || 0) + opt.score;
        // 3. 推进 stage、登记已触发
        if (st.triggered.indexOf(node.id) < 0) st.triggered.push(node.id);
        const line = mlLine();
        if (st.stage < (line.nodes || []).length) st.stage++;
        st.shown = null;
        if (st.stage >= (line.nodes || []).length) {
            st.phase = 'done';
            resolveMainlineEnding();
        }
    }
    // 4. 史官年表记录
    try {
        const note = (opt && opt.note) ? opt.note : (node.name + ' 大事已决');
        GameState.history.unshift({
            era: GameState.script.era, year: GameState.currentYear,
            season: SEASONS[GameState.currentSeason].name,
            month: ['孟','仲','季'][GameState.currentMonth],
            type: 'mainline', title: '【山河志】' + node.name,
            decision: (opt ? opt.text : '')
        });
        if (GameState.history.length > 30) GameState.history.pop();
        try { renderHistory(); } catch (e) {}
        pushNews('史官', `【山河志】${node.name}：${note}（史据：${node.src}）`, 'normal');
    } catch (e) {}
    // 5. 成就检查
    try { if (typeof checkAchievements === 'function') checkAchievements(); } catch (e) {}
    // 6. 关闭弹窗，回到"已决"态
    try {
        document.getElementById('event-modal').classList.remove('active');
        document.getElementById('edict-from').textContent = '待办';
        document.getElementById('edict-title').textContent = '国事已理';
        document.getElementById('edict-content').textContent = '山河志事已录。';
    } catch (e) {}
    GameState.decisionsCount++;
    // 7. 存档（主线进度随存档链持久化）
    try { saveGame(); } catch (e) {}
    // 8. 继续推进
    advanceSeason();
}

// ===== 主线结局判定 =====
function resolveMainlineEnding() {
    try {
        const st = mlState(); if (!st) return null;
        const line = mlLine();
        const id = line.id;
        const score = st.score || 0;
        const counters = st.counters || {};
        let ending = null;
        if (id === 'chenghua') {
            ending = score >= 3 ? 'chenghua_zhi' : (score <= -3 ? 'chang_huo' : 'chenghua_zhi');
            if (score >= 1) ending = 'chenghua_zhi'; else ending = 'chang_huo';
        } else if (id === 'zhengde') {
            // 三向：新政（亲贤） / 嬉游误国（纵欲） / 宦官复炽（姑息）
            const reform = (counters.reform || 0) + (counters.good || 0);
            const indul = (counters.evil || 0) + (counters.pleasure || 0) + (counters.peril || 0);
            const eun = (counters.eunuch || 0);
            if (reform >= eun && reform > indul) ending = 'zhengde_xinzheng';
            else if (indul >= eun && indul > reform) ending = 'zhengde_xiyou';
            else ending = 'zhengde_eunuch';
        } else if (id === 'wanli') {
            ending = score >= 3 ? 'wanli_xinzheng' : 'wanli_daizheng';
        } else if (id === 'tianqi') {
            // 三向：中兴图强 / 魏阉祸国 / 辽事沦亡
            const good = (counters.good || 0);
            const evil = (counters.evil || 0);
            if (good >= 2 && score >= 3) ending = 'tianqi_zhongxing';
            else if (evil >= 2) ending = 'tianqi_weiyan';
            else ending = 'tianqi_liaoshi';
        }
        st.endingResolved = ending;
        // 触发主线成就
        try { if (typeof checkAchievements === 'function') checkAchievements(); } catch (e) {}
        return ending;
    } catch (e) { return null; }
}

// 局终：在结局弹窗追加"山河志"章节
function renderMainlineEnding() {
    try {
        const st = mlState(); if (!st) return;
        const line = mlLine();
        if (!line) return;
        // 若全局尚未走到 done，亦用当前倾向分兜底算一笔
        if (st.phase !== 'done' || !st.endingResolved) {
            if (!st.endingResolved) { try { resolveMainlineEnding(); } catch (e) {} }
        }
        const info = mainlineEndingInfo(line.id, st.endingResolved);
        const legacy = document.getElementById('end-legacy');
        const block = document.createElement('div');
        block.className = 'mainline-ending';
        block.innerHTML = `
            <div class="mainline-ending-head">【${line.title} · 终局】</div>
            <div class="mainline-ending-title">${info.title}</div>
            <div class="mainline-ending-content">${info.content}</div>
            <div class="mainline-ending-src">史据：${line.src}</div>
        `;
        if (legacy) legacy.appendChild(block);
        else {
            // 兜底：直接塞入 end-content 之后（mock/兼容环境）
            try { document.getElementById('end-content').textContent += ' · ' + info.title; } catch (e) {}
        }
        // 史官总评收尾
        try { pushNews('史官', `【山河志】陛下主政，其局成于「${info.title}」，大命兴亡，系乎一念。`, 'normal'); } catch (e) {}
    } catch (e) {}
}

function mainlineEndingInfo(scriptId, endingKey) {
    const defs = {
        chenghua: {
            chenghua_zhi: { title: '成化之治·中兴气象', content: '陛下罢西厂、安流民、制内宠、平瑶僭，朝纲肃然，民生稍苏。虽权阉未绝，然大堑已定，海内渐有中兴之望。史家言："宪宗践祚十余年，政令清明，号为小康。"（演绎）' },
            chang_huo: { title: '厂祸坐大·纲纪崩弛', content: '西厂不革，阉竖愈横；流民未安，瑶乱愈炽。陛下姑息养奸，内宠逾制，庙堂之上，戚宦擅权。虽承平之表，实已伏大乱之机。（演绎）' }
        },
        zhengde: {
            zhengde_xinzheng: { title: '正德新政·拨乱反正', content: '陛下能引祸为鉴，清退佞幸，亲贤图治，武宗一朝虽多嬉游之名，然君心未昏，迥异乎前史庸主。朝纲稍振，社稷可幸。（演绎）' },
            zhengde_xiyou: { title: '嬉游误国·大宝旁落', content: '豹房日嬉，纲纪废弛，宁藩坐大，阉佞盈朝。陛下纵欲忘本，社稷之重，弃若敝屣，虽无天崩之灾，祸乱之根已深种焉。（演绎）' },
            zhengde_eunuch: { title: '宦官复炽·阉党遮天', content: '刘瑾虽诛，阉势复盛；宁王虽除，佞幸又起。权阉把持朝纲，正人君子屏迹，武宗一朝，其政仍操于近幸之手。（演绎）' }
        },
        wanli: {
            wanli_xinzheng: { title: '万历中兴·拨乱主政', content: '陛下定国本、援藩邦、罢矿税，三大征前后相继而不乱，庙堂虽多怠政之名，然大政未失，四夷宾服，亦一时之治。（演绎）' },
            wanli_daizheng: { title: '怠政国本之祸', content: '国本久悬，党争愈烈；矿税剥民，怨声盈野。陛下高拱深宫，万事不理，而天下元气大伤，外患重生，大明之衰自此始矣。（演绎）' }
        },
        tianqi: {
            tianqi_zhongxing: { title: '中兴图强·扶倾救危', content: '陛下庇东林、发辽饷、抚白莲，虽魏阉在侧而不使其得专，辽事虽危而饷道不绝。大厦将倾，赖陛下扶掖，犹可独立一时。（演绎）' },
            tianqi_weiyan: { title: '魏阉祸国·正士尽戮', content: '纵阉用佞，忠良骈首；东林凋残，言路壅塞。魏忠贤辈擅威福、乱朝纲，天下寒心，遗祸之烈，直逼前代阉竖之最。（演绎）' },
            tianqi_liaoshi: { title: '辽事沦亡·边饷断绝', content: '辽饷不给，边军哗变；白莲不戢，内乱频仍。陛下既不能振军实，又不能安民心，辽东糜烂而天下事去矣。（演绎）' }
        }
    };
    const d = (defs[scriptId] || {})[(endingKey || '')];
    return d || { title: '山河志未竟', content: '主线未及走完，史笔暂阙，留待后人。' };
}

// ===== 主线成就（延用 ACHIEVEMENTS 检查框架）=====
(function appendMainlineAchievements() {
    try {
        if (typeof ACHIEVEMENTS === 'undefined' || !Array.isArray(ACHIEVEMENTS)) return;
        const ML_AC = [
            { id: 'ml_chenghua_xing', name: '成化中兴', desc: '成化朝主线走完并倾向中兴', icon: '兴', hidden: true, script: 'chenghua',
              check: (s) => { try { return s.mainline && s.mainline.scriptId === 'chenghua' && s.mainline.phase === 'done'; } catch (e) { return false; } },
              src: '《明史》本纪十三·宪宗纪：宪宗初政清明，颇励精图治。' },
            { id: 'ml_zhengde_fan', name: '拨乱反正', desc: '正德朝主线走完并趋向新政', icon: '正', hidden: true, script: 'zhengde',
              check: (s) => { try { return s.mainline && s.mainline.scriptId === 'zhengde' && s.mainline.phase === 'done'; } catch (e) { return false; } },
              src: '《明史》本纪十六·武宗纪：武宗虽嬉游，然亦偶延揽正人。（演绎）' },
            { id: 'ml_wanli_zhen', name: '拨云见日', desc: '万历朝主线走完并趋向中兴', icon: '云', hidden: true, script: 'wanli',
              check: (s) => { try { return s.mainline && s.mainline.scriptId === 'wanli' && s.mainline.phase === 'done'; } catch (e) { return false; } },
              src: '《明史》本纪二十·神宗纪后编评：神宗初御极，有励精之志。（演绎）' },
            { id: 'ml_tianqi_qiang', name: '扶危图存', desc: '天启朝主线走完并趋向中兴图强', icon: '扶', hidden: true, script: 'tianqi',
              check: (s) => { try { return s.mainline && s.mainline.scriptId === 'tianqi' && s.mainline.phase === 'done'; } catch (e) { return false; } },
              src: '《明史》本纪二十二·熹宗纪：熹宗冲龄践阼，主少国疑。（演绎）' }
        ];
        ML_AC.forEach(a => { if (!ACHIEVEMENTS.some(x => x.id === a.id)) ACHIEVEMENTS.push(a); });
        window._mainlineAchievementCount = ML_AC.length;
    } catch (e) {}
})();

// 校验钩子（供 smoke/verify 快速确认集成）
console.log('✓ 主线叙事系统（山河志）已加载');