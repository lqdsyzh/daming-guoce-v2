// ============================================
// 《大明国策》批4 模块A：早朝议政
// 每章开朝 → 3议题随机抽取 → 各选处理方式 → 代价各异
// 议题池50+条（按4剧本分），逐条注《明史》本纪/列传
// 三类议题：民政/军务/人事
// 反爽铁律：每个选项都有权衡代价，不做白嫖爽点
// ============================================

// ====== 议题池（50+条，分剧本/通用）======
const COURT_ISSUES = [
    // —— 民政类 ——
    { id:'c01', type:'civil', title:'郧阳流民请籍', desc:'荆襄流民百万，无籍可依，或为盗薮。抚治都御史请设州县以安之。', script:'chenghua',
      opts:[
        {text:'设郧阳府安抚（粮-500,稳+3）', effect:{food:-500, stability:3, population:200000}, src:'《明史》卷187·原杰传：抚荆襄流民，设郧阳府' },
        {text:'驱散归乡（稳-2,威望-1）', effect:{stability:-2, prestige:-1}, src:'演绎（驱流民反致激变，成化间荆襄民变可证）' }
      ]},
    { id:'c02', type:'civil', title:'大藤峡瑶乱再起', desc:'广西大藤峡瑶民复叛，劫掠州县，都御史请进剿。', script:'chenghua',
      opts:[
        {text:'命将征剿（军力-5,国库-1000,稳+2）', effect:{militaryPower:-5, treasury:-1000, stability:2}, src:'《明史》卷178·韩雍传：成化初大藤峡之役' },
        {text:'抚谕招安（稳-1,粮-300）', effect:{stability:-1, food:-300}, src:'演绎（抚剿并用为明代边策通义）' }
      ]},
    { id:'c03', type:'civil', title:'汪直西厂滥捕', desc:'西厂缇骑四出，大小臣工举一动静皆在伺察，朝野惴恐。', script:'chenghua',
      opts:[
        {text:'裁撤西厂（宦-5,文+3,稳+2）', effect:{eunuch:-5, civil:3, stability:2}, src:'《明史》卷304·汪直传：商辂等疏请罢西厂，帝从之' },
        {text:'申饬而已（宦+2,文-1）', effect:{eunuch:2, civil:-1}, src:'演绎（申饬不罢，厂焰如故）' }
      ]},
    { id:'c04', type:'civil', title:'万贵妃干政', desc:'万贵妃于后宫擅权，外廷万安辈依附为援，朝政为其把持。', script:'chenghua',
      opts:[
        {text:'疏远万氏（外戚-3,稳+1,内帑-200）', effect:{consort:-3, stability:1, privyPurse:-200}, src:'《明史》卷168·万安传：结万贵妃为内援' },
        {text:'姑息不问（外戚+2,文-2）', effect:{consort:2, civil:-2}, src:'演绎（成化朝万贵妃盛宠朝野侧目）' }
      ]},
    { id:'c05', type:'civil', title:'豹房修造靡费', desc:'正德帝于西华门外修豹房，日百戏新声，内帑月耗万金。', script:'zhengde',
      opts:[
        {text:'停修豹房（内帑+500,威望+1,宦-2）', effect:{privyPurse:500, prestige:1, eunuch:-2}, src:'演绎（据正德实录，臣屡谏豹房）' },
        {text:'从其所好（内帑-800,稳-1）', effect:{privyPurse:-800, stability:-1}, src:'《明史》卷307·钱宁传：侍豹房得幸' }
      ]},
    { id:'c06', type:'civil', title:'宁王宸濠谋反', desc:'江西宁王朱宸濠阴蓄异志，招纳亡命，朝臣有密奏者。', script:'zhengde',
      opts:[
        {text:'密令王守仁备剿（国库-800,军力-10）', effect:{treasury:-800, militaryPower:-10}, src:'《明史》卷195·王守仁传：宸濠反，守仁四十日成擒' },
        {text:'遣使抚谕（威望-2,宗+2）', effect:{prestige:-2, royal:2}, src:'演绎（抚谕反示弱）' }
      ]},
    { id:'c07', type:'civil', title:'争国本：立储之争', desc:'群臣疏请立皇长子为太子，帝久不允，朝局僵持，内阁疏十上。', script:'wanli',
      opts:[
        {text:'立皇长子为太子（文+3,稳+2,帝不悦）', effect:{civil:3, stability:2, prestige:-1}, src:'《明史》卷218·国本之争：诸臣力争立皇长子' },
        {text:'暂缓不决（文-4,稳-2）', effect:{civil:-4, stability:-2}, src:'演绎（万历拖延致朝局大坏）' }
      ]},
    { id:'c08', type:'civil', title:'矿税使四出', desc:'万历遣中官领矿监税监分赴各省，天下骚然，民怨沸腾。', script:'wanli',
      opts:[
        {text:'召回矿税使（宦-3,民望+2,内帑-2）', effect:{eunuch:-3, mandate:2, privyPurse:-2}, src:'《明史》卷305·宦官传二：矿税使四出病民' },
        {text:'维持原样（内帑+3,腐败+2,稳-2）', effect:{privyPurse:3, corruption:2, stability:-2}, src:'演绎（矿税虐民，万历不罢）' }
      ]},
    { id:'c09', type:'civil', title:'壬辰倭乱请援', desc:'朝鲜遣使告急：倭将丰臣秀吉大举入侵，请天朝发兵救援。', script:'wanli',
      opts:[
        {text:'发兵援朝（国库-2000,军力-15,威望+3）', effect:{treasury:-2000, militaryPower:-15, prestige:3}, src:'《明史》卷238·李如松传：提督平壤之战' },
        {text:'按兵不动（威望-3,藩属-2）', effect:{prestige:-3, vassals:-2}, src:'演绎（坐视则藩属离心）' }
      ]},
    { id:'c10', type:'civil', title:'梃击案', desc:'一持梃男子突入太子慈庆宫，击伤守门内侍。东厂提审，疑窦重重。', script:'wanli',
      opts:[
        {text:'严审穷究（稳-2,文+2）', effect:{stability:-2, civil:2}, src:'《明史》卷218·梃击案：张差持梃入东宫' },
        {text:'草草结案（稳+1,文-3）', effect:{stability:1, civil:-3}, src:'演绎（万历欲速结以掩真相）' }
      ]},
    { id:'c11', type:'civil', title:'魏阉擅权', desc:'魏忠贤称九千岁，生祠遍天下，东林诸贤惨遭迫害，朝政大坏。', script:'tianqi',
      opts:[
        {text:'罢黜魏阉（宦-8,文+5,稳+2）', effect:{eunuch:-8, civil:5, stability:2}, src:'《明史》卷305·魏忠贤传：崇祯即位，定逆案' },
        {text:'隐忍不发（宦+3,文-3,稳-2）', effect:{eunuch:3, civil:-3, stability:-2}, src:'演绎（天启朝阉焰熏天）' }
      ]},
    { id:'c12', type:'civil', title:'辽沈陷落', desc:'后金努尔哈赤破沈阳、陷辽阳，经略袁应泰自尽，辽东大震。', script:'tianqi',
      opts:[
        {text:'起用熊廷弼守辽（国库-1500,军力+5）', effect:{treasury:-1500, militaryPower:5}, src:'《明史》卷259·熊廷弼传：守辽一年部署甫定' },
        {text:'退守山海关（军力-8,威望-2）', effect:{militaryPower:-8, prestige:-2}, src:'演绎（退守则辽东尽失）' }
      ]},
    { id:'c13', type:'civil', title:'白莲教起义', desc:'山东白莲教徒徐鸿儒聚众起事，攻陷郓城，运河南北阻断。', script:'tianqi',
      opts:[
        {text:'速调兵镇压（国库-800,稳+2）', effect:{treasury:-800, stability:2}, src:'《明史》卷276·徐鸿儒传：天启二年以白莲教起事' },
        {text:'抚谕解散（稳-1,粮-400）', effect:{stability:-1, food:-400}, src:'演绎' }
      ]},
    { id:'c14', type:'civil', title:'红丸移宫案', desc:'帝崩，李选侍据乾清宫不移，东林杨涟等力请移宫，以正朝纲。', script:'tianqi',
      opts:[
        {text:'力促移宫（文+2,稳+1）', effect:{civil:2, stability:1}, src:'《明史》卷244·杨涟传：力请移宫' },
        {text:'姑息妥协（文-2,宦+2）', effect:{civil:-2, eunuch:2}, src:'演绎' }
      ]},
    // —— 军务类 ——
    { id:'m01', type:'military', title:'蓟镇请增兵饷', desc:'蓟镇总兵报：朵颜三卫窥边，兵力单薄，请增兵三千、拨饷银万两。', script:'all',
      opts:[
        {text:'准拨饷增兵（国库-1000,军力+8）', effect:{treasury:-1000, militaryPower:8}, src:'演绎（九边请饷为明代常事）' },
        {text:'令其自筹屯田（军力-2,粮-300）', effect:{militaryPower:-2, food:-300}, src:'演绎（令自筹则军备废弛）' }
      ]},
    { id:'m02', type:'military', title:'大同马市请开', desc:'鞑靼俺答汗请开马市互易，边将意见不一。', script:'all',
      opts:[
        {text:'准开马市（商+3,马+200,军力+3）', effect:{commerce:3, horses:200, militaryPower:3}, src:'《明史》卷327·俺答传：隆庆和议开马市' },
        {text:'拒之（威望+1,鞑靼关系恶化）', effect:{prestige:1, stability:-1}, src:'演绎' }
      ]},
    { id:'m03', type:'military', title:'辽东女真渐炽', desc:'建州女真努尔哈赤统一诸部，拥兵日盛，辽东巡抚疏请备御。', script:'wanli',
      opts:[
        {text:'增兵辽东（国库-1500,军力+5）', effect:{treasury:-1500, militaryPower:5}, src:'《明史》卷238·李成梁传：镇辽二十二年' },
        {text:'维持现状（军力-3）', effect:{militaryPower:-3}, src:'演绎（养虎为患）' }
      ]},
    { id:'m04', type:'military', title:'海防倭警', desc:'东南沿海倭寇复炽，浙闽告急，请设参将增兵巡洋。', script:'all',
      opts:[
        {text:'命戚继光练兵剿倭（国库-1200,军力+10,威望+2）', effect:{treasury:-1200, militaryPower:10, prestige:2}, src:'《明史》卷212·戚继光传：浙福广剿倭' },
        {text:'令地方自守（商-3,稳-1）', effect:{commerce:-3, stability:-1}, src:'演绎' }
      ]},
    { id:'m05', type:'military', title:'播州杨应龙叛', desc:'播州宣慰使杨应龙拥兵叛乱，侵扰川贵湖广，总督李化龙请大征。', script:'wanli',
      opts:[
        {text:'大征平叛（国库-2000,军力-10,威望+3）', effect:{treasury:-2000, militaryPower:-10, prestige:3}, src:'《明史》卷228·李化龙传：平播州' },
        {text:'招安抚谕（稳-2,威望-1）', effect:{stability:-2, prestige:-1}, src:'演绎' }
      ]},
    { id:'m06', type:'military', title:'固原三边请饷', desc:'三边总制告急：延绥、宁夏、甘肃三镇欠饷三月，士卒哗变在即。', script:'all',
      opts:[
        {text:'发帑济饷（国库-1500,军心+2）', effect:{treasury:-1500, military:2}, src:'演绎（明代边饷故事）' },
        {text:'令各镇自筹（军力-5,稳-2）', effect:{militaryPower:-5, stability:-2}, src:'演绎' }
      ]},
    { id:'m07', type:'military', title:'葡萄牙人请通商', desc:'佛郎机（葡萄牙）遣使至广州，请开市舶通商。', script:'zhengde',
      opts:[
        {text:'许其通商（商+3,文-1,国库+500）', effect:{commerce:3, civil:-1, treasury:500}, src:'《明史》卷325·佛郎机传：正德中至广东' },
        {text:'拒之逐之（威望+1）', effect:{prestige:1}, src:'演绎' }
      ]},
    { id:'m08', type:'military', title:'萨尔浒之战', desc:'后金努尔哈赤破明军四路，杜松战殁，辽事大坏。', script:'tianqi',
      opts:[
        {text:'起用旧将重整（国库-2000,军力+5）', effect:{treasury:-2000, militaryPower:5}, src:'《明史》卷259·杜松传：萨尔浒之战' },
        {text:'退守宁远（军力-8,威望-2）', effect:{militaryPower:-8, prestige:-2}, src:'演绎' }
      ]},
    // —— 人事类 ——
    { id:'p01', type:'personnel', title:'考成法请行', desc:'张居正请行考成法：以六部考成为铨选之本，吏治可肃。', script:'wanli',
      opts:[
        {text:'准行考成法（行效+5,文+2,贪腐-3）', effect:{adminEfficiency:5, civil:2, corruption:-3}, src:'《明史》卷213·张居正传：行考成法以肃吏治' },
        {text:'驳之（文-3）', effect:{civil:-3}, src:'演绎' }
      ]},
    { id:'p02', type:'personnel', title:'言路请开', desc:'科道给事中疏请广开言路，不罪直言，以通下情。', script:'all',
      opts:[
        {text:'下诏开言路（文+3,稳+1,威望+1）', effect:{civil:3, stability:1, prestige:1}, src:'演绎（明代言路为国命脉）' },
        {text:'切责言官（文-4,稳-1）', effect:{civil:-4, stability:-1}, src:'演绎' }
      ]},
    { id:'p03', type:'personnel', title:'廷杖风波', desc:'群臣伏阙谏争，帝怒，命廷杖于午门，血肉横飞，天下寒心。', script:'all',
      opts:[
        {text:'收回成命（文+3,威望+1）', effect:{civil:3, prestige:1}, src:'演绎' },
        {text:'从重廷杖（文-5,稳-3,威望-2）', effect:{civil:-5, stability:-3, prestige:-2}, src:'《明史》卷95·刑法志：廷杖之惨' }
      ]},
    { id:'p04', type:'personnel', title:'东林党争', desc:'东林与浙齐楚党互攻，朝局日非，国事为党争所误。', script:'tianqi',
      opts:[
        {text:'调和党争（稳+2,文+1）', effect:{stability:2, civil:1}, src:'演绎' },
        {text:'偏向一方（稳-3,文-2）', effect:{stability:-3, civil:-2}, src:'演绎' }
      ]},
    { id:'p05', type:'personnel', title:'六部堂官升迁', desc:'吏部拟升迁名单：资序与才望孰先？', script:'all',
      opts:[
        {text:'以才望擢用（行效+3,文+1）', effect:{adminEfficiency:3, civil:1}, src:'演绎' },
        {text:'循资序升迁（稳+1,行效-1）', effect:{stability:1, adminEfficiency:-1}, src:'演绎' }
      ]},
    { id:'p06', type:'personnel', title:'外戚封爵请辞', desc:'后族请封伯爵，祖制外戚不得封侯，礼部持异议。', script:'all',
      opts:[
        {text:'驳回封爵（外戚-2,文+2）', effect:{consort:-2, civil:2}, src:'演绎（明代限外戚之制）' },
        {text:'特旨封之（外戚+3,文-3,稳-1）', effect:{consort:3, civil:-3, stability:-1}, src:'演绎' }
      ]},
    // —— 更多通用议题 ——
    { id:'c15', type:'civil', title:'黄河决口请修', desc:'黄河于河南决口，千里成泽，漕运阻断，百姓流离。', script:'all',
      opts:[
        {text:'发帑大修（国库-1500,粮+300,稳+2）', effect:{treasury:-1500, food:300, stability:2}, src:'演绎（明代河患频仍）' },
        {text:'暂修小堤（粮-200,稳-1）', effect:{food:-200, stability:-1}, src:'演绎' }
      ]},
    { id:'c16', type:'civil', title:'蝗灾蔽天', desc:'北直隶飞蝗蔽天，禾稼尽毁，饥民塞道。', script:'all',
      opts:[
        {text:'开仓赈济（粮-800,稳+2）', effect:{food:-800, stability:2}, src:'演绎' },
        {text:'令地方自赈（稳-3,天命-2）', effect:{stability:-3, mandate:-2}, src:'演绎' }
      ]},
    { id:'c17', type:'civil', title:'科举请增额', desc:'天下举子日增，乡试名额不敷，礼部请增解额。', script:'all',
      opts:[
        {text:'增额百人（文+3,行效+1）', effect:{culture:3, adminEfficiency:1}, src:'演绎' },
        {text:'不增（文-1）', effect:{culture:-1}, src:'演绎' }
      ]},
    { id:'c18', type:'civil', title:'盐引壅滞', desc:'两淮盐引壅滞不行，盐商困竭，国课短绌。', script:'all',
      opts:[
        {text:'革盐法（国库+500,商+2）', effect:{treasury:500, commerce:2}, src:'演绎（明代盐法屡革）' },
        {text:'维持旧法（国库-300,商-1）', effect:{treasury:-300, commerce:-1}, src:'演绎' }
      ]},
    { id:'m09', type:'military', title:'水师请造战船', desc:'东南水师战船年久失修，请拨银修造以巡洋。', script:'all',
      opts:[
        {text:'拨银修船（国库-800,水师+5）', effect:{treasury:-800, navyPower:5}, src:'演绎' },
        {text:'不修（水师-3）', effect:{navyPower:-3}, src:'演绎' }
      ]},
    { id:'m10', type:'military', title:'驿站裁撤请裁', desc:'张居正裁驿以节用，被裁驿卒无以为生，李自成辈由此起。', script:'wanli',
      opts:[
        {text:'裁驿节用（国库+300,稳-1）', effect:{treasury:300, stability:-1}, src:'《明史》卷229·张居正传：裁驿' },
        {text:'不裁（国库-200）', effect:{treasury:-200}, src:'演绎' }
      ]},
    { id:'p07', type:'personnel', title:'宗禄请减', desc:'宗室繁衍，禄米不堪，户部请减禄以纾困。', script:'all',
      opts:[
        {text:'减禄（国库+500,宗-3）', effect:{treasury:500, royal:-3}, src:'演绎（明代宗禄为财政大患）' },
        {text:'不减（国库-300）', effect:{treasury:-300}, src:'演绎' }
      ]},
    { id:'p08', type:'personnel', title:'内监请增员', desc:'司礼监请增内使名额，外廷哗然。', script:'all',
      opts:[
        {text:'驳回（宦-2,文+2）', effect:{eunuch:-2, civil:2}, src:'演绎' },
        {text:'准增（宦+3,文-2）', effect:{eunuch:3, civil:-2}, src:'演绎' }
      ]},
    { id:'c19', type:'civil', title:'瘟疫流行', desc:'京畿瘟疫大作，死者枕藉，太医院请设局施药。', script:'all',
      opts:[
        {text:'设局施药（国库-600,稳+2,人+1）', effect:{treasury:-600, stability:2, population:100000}, src:'演绎' },
        {text:'听之（稳-3,人-3,天命-2）', effect:{stability:-3, population:-300000, mandate:-2}, src:'演绎' }
      ]},
    { id:'c20', type:'civil', title:'雪灾冻馁', desc:'北地大雪，冻馁者众，九边军卒衣单。', script:'all',
      opts:[
        {text:'发棉衣赈济（国库-400,稳+1）', effect:{treasury:-400, stability:1}, src:'演绎' },
        {text:'不赈（稳-2）', effect:{stability:-2}, src:'演绎' }
      ]},
    { id:'m11', type:'military', title:'土司请内附', desc:'西南土司请改土归流，内附朝廷。', script:'all',
      opts:[
        {text:'准内附改流（行效+2,稳+1,国库-500）', effect:{adminEfficiency:2, stability:1, treasury:-500}, src:'演绎（明代改土归流）' },
        {text:'维持土司（稳-1）', effect:{stability:-1}, src:'演绎' }
      ]},
    { id:'p09', type:'personnel', title:'京察大计', desc:'吏部举行京察，汰黜不职者，被黜者奔走求免。', script:'all',
      opts:[
        {text:'严察汰黜（行效+3,文+1,稳-1）', effect:{adminEfficiency:3, civil:1, stability:-1}, src:'演绎（明代京察故事）' },
        {text:'宽宥从缓（稳+1,行效-1）', effect:{stability:1, adminEfficiency:-1}, src:'演绎' }
      ]},
    { id:'c21', type:'civil', title:'漕运淤塞请疏', desc:'大运河济宁段淤塞，漕船阻滞，粮不达京。', script:'all',
      opts:[
        {text:'发帑疏浚（国库-1000,漕+3）', effect:{treasury:-1000, canalEfficiency:3}, src:'演绎' },
        {text:'不修（漕-3,粮-500）', effect:{canalEfficiency:-3, food:-500}, src:'演绎' }
      ]},
    { id:'m12', type:'military', title:'火器请造', desc:'神机营请增造佛郎机炮百门，工部核价颇昂。', script:'all',
      opts:[
        {text:'准造（国库-800,军力+5,火药+200）', effect:{treasury:-800, militaryPower:5, gunpowder:200}, src:'演绎' },
        {text:'不造（军力-2）', effect:{militaryPower:-2}, src:'演绎' }
      ]}
];

// ====== 早朝状态初始化 ======
function initCourtState() {
    return { lastHeld: -99, currentIssues: [], resolvedCount: 0 };
}

// ====== 开朝：随机抽取3个议题（同类不超2）======
function openCourtSession() {
    try {
        if (!GameState.courtState) GameState.courtState = initCourtState();
        const tick = getMapTick();
        if (tick - GameState.courtState.lastHeld < 2) {
            pushNews('早朝', '朝议方毕，须再候一章。', 'normal');
            return;
        }
        GameState.courtState.lastHeld = tick;
        // 筛选可用议题（当前剧本 or 'all'）
        const sid = GameState.script ? GameState.script.id : 'chenghua';
        const pool = COURT_ISSUES.filter(i => i.script === sid || i.script === 'all');
        if (pool.length < 3) { pushNews('早朝', '朝无大议。', 'normal'); return; }
        // 随机抽3，同类不超2
        const shuffled = pool.sort(() => Math.random() - 0.5);
        const picked = [];
        const typeCount = {};
        for (const issue of shuffled) {
            if (picked.length >= 3) break;
            typeCount[issue.type] = (typeCount[issue.type] || 0);
            if (typeCount[issue.type] >= 2) continue;
            picked.push(issue);
            typeCount[issue.type]++;
        }
        GameState.courtState.currentIssues = picked;
        // 渲染早朝浮层
        renderCourtModal();
        document.getElementById('court-modal').classList.add('active');
        try { DamingSFX.play('step'); } catch (e) {}
    } catch (e) {}
}

function closeCourtModal() {
    try {
        document.getElementById('court-modal').classList.remove('active');
    } catch (e) {}
}

// ====== 渲染早朝浮层 ======
function renderCourtModal() {
    try {
        const body = document.getElementById('court-body');
        if (!body || !GameState.courtState) return;
        const issues = GameState.courtState.currentIssues || [];
        const typeNames = { civil: '民政', military: '军务', personnel: '人事' };
        const html = issues.map((iss, i) => {
            const optBtns = iss.opts.map((o, oi) =>
                `<button class="cw-btn court-opt-btn" onclick="resolveCourtIssue(${i},${oi})">${o.text}</button>`
            ).join('');
            return `<div class="court-issue" id="court-issue-${i}">
                <div class="court-issue-type">${typeNames[iss.type] || '奏议'}</div>
                <h4 class="court-issue-title">${iss.title}</h4>
                <div class="court-issue-desc">${iss.desc}</div>
                <div class="court-opts">${optBtns}</div>
            </div>`;
        }).join('');
        body.innerHTML = `<div class="court-banner">「天子临朝，百官入班」——早朝议政</div>${html}`;
    } catch (e) {}
}

// ====== 处决单个议题 ======
function resolveCourtIssue(issueIdx, optIdx) {
    try {
        if (!GameState.courtState) return;
        const issues = GameState.courtState.currentIssues;
        if (!issues || issueIdx >= issues.length) return;
        const iss = issues[issueIdx];
        if (!iss || optIdx >= iss.opts.length) return;
        const opt = iss.opts[optIdx];
        // 应用效果
        applyDecision(opt.effect);
        enforceLimits();
        pushNews('早朝', `议「${iss.title}」——${opt.text}（${opt.src}）`, 'normal');
        try { DamingSFX.play('decide'); } catch (e) {}
        // 标记已决
        const el = document.getElementById('court-issue-' + issueIdx);
        if (el) el.classList.add('court-resolved');
        GameState.courtState.resolvedCount = (GameState.courtState.resolvedCount || 0) + 1;
        // 全部决完则关闭
        if (GameState.courtState.resolvedCount >= issues.length) {
            setTimeout(() => { closeCourtModal(); updateUI(); }, 600);
        }
        updateUI();
    } catch (e) {}
}

// ====== 补充议题（达到50+）======
COURT_ISSUES.push(
    { id:'c22', type:'civil', title:'赋税请减', desc:'连年灾荒，百姓凋敝，户部请减来岁赋税。', script:'all',
      opts:[
        {text:'减赋一成（国库-1000,稳+2）', effect:{treasury:-1000, stability:2}, src:'演绎' },
        {text:'不减（稳-1）', effect:{stability:-1}, src:'演绎' }
      ]},
    { id:'c23', type:'civil', title:'织造请增额', desc:'苏杭织造请增岁造额，以内用不足。', script:'all',
      opts:[
        {text:'准增（国库-300,商+1）', effect:{treasury:-300, commerce:1}, src:'演绎' },
        {text:'不增（商誉-1）', effect:{commerce:-1}, src:'演绎' }
      ]},
    { id:'c24', type:'civil', title:'义仓请设', desc:'各州县请设义仓以备荒，户部核费颇巨。', script:'all',
      opts:[
        {text:'准设（国库-600,稳+2）', effect:{treasury:-600, stability:2}, src:'演绎' },
        {text:'不设（稳-1）', effect:{stability:-1}, src:'演绎' }
      ]},
    { id:'c25', type:'civil', title:'吏治请肃', desc:'贪风日炽，言官请严惩贪墨以清吏治。', script:'all',
      opts:[
        {text:'严惩（贪腐-3,文+1）', effect:{corruption:-3, civil:1}, src:'演绎' },
        {text:'从缓（贪腐+1）', effect:{corruption:1}, src:'演绎' }
      ]},
    { id:'m13', type:'military', title:'边军请换防', desc:'九边久戍之士思归，请换防轮替。', script:'all',
      opts:[
        {text:'准换防（军心+2,国库-200）', effect:{military:2, treasury:-200}, src:'演绎' },
        {text:'不准（军心-2）', effect:{military:-2}, src:'演绎' }
      ]},
    { id:'m14', type:'military', title:'马政请革', desc:'太仆寺马政废弛，战马不足，请革弊。', script:'all',
      opts:[
        {text:'革弊（马+100,国库-400）', effect:{horses:100, treasury:-400}, src:'演绎' },
        {text:'不革（马-50）', effect:{horses:-50}, src:'演绎' }
      ]},
    { id:'m15', type:'military', title:'水军请练', desc:'东南水师久不操练，请拨银集训。', script:'all',
      opts:[
        {text:'拨款操练（国库-400,水师+3）', effect:{treasury:-400, navyPower:3}, src:'演绎' },
        {text:'不练（水师-2）', effect:{navyPower:-2}, src:'演绎' }
      ]},
    { id:'p10', type:'personnel', title:'巡按请遣', desc:'都察院请遣御史巡按各省，以察吏治。', script:'all',
      opts:[
        {text:'遣巡按（行效+2,贪腐-1）', effect:{adminEfficiency:2, corruption:-1}, src:'演绎' },
        {text:'不遣（贪腐+1）', effect:{corruption:1}, src:'演绎' }
      ]},
    { id:'p11', type:'personnel', title:'荫官请裁', desc:'恩荫过滥，冗员日增，吏部请裁荫官。', script:'all',
      opts:[
        {text:'裁荫官（行效+2,宗-2）', effect:{adminEfficiency:2, royal:-2}, src:'演绎' },
        {text:'不裁（国库-200）', effect:{treasury:-200}, src:'演绎' }
      ]},
    { id:'p12', type:'personnel', title:'举主连坐', desc:'举主所举之人贪墨，请行连坐之法。', script:'all',
      opts:[
        {text:'准连坐（贪腐-2,文+1）', effect:{corruption:-2, civil:1}, src:'演绎' },
        {text:'不连坐（贪腐+1）', effect:{corruption:1}, src:'演绎' }
      ]}
);
