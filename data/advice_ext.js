// ============================================
// 《大明国策》批4 扩展建言/谏言（61→150+）
// 逐条注《明史》出处或"演绎"
// ============================================

const ADVICE_EXTENSION = [
    // 国库类
    { condition:(s)=>s.stats.treasury>12000&&s.stats.corruption>40, minister:{cat:'civil',idx:0},
      title:'国充而吏贪', text:'府库虽充，然贪风日炽。臣请严考成以肃吏治。', 
      options:[{text:'准行（贪腐-3,行效+2）',effect:{corruption:-3,adminEfficiency:2}},{text:'从缓',effect:{}}],
      src:'演绎' },
    { condition:(s)=>s.stats.treasury<2000, minister:{cat:'civil',idx:1},
      title:'节用之策', text:'国用日增，入不敷出。臣请裁冗节用。', 
      options:[{text:'准裁（国库+800,文-2）',effect:{treasury:800,civil:-2}},{text:'不加裁',effect:{}}],
      src:'演绎' },
    // 军事类
    { condition:(s)=>s.stats.militaryPower<30, minister:{cat:'military',idx:0},
      title:'军力凋敝请整', text:'军备废弛，兵不能战。臣请增饷练兵以固国防。', 
      options:[{text:'准练兵（国库-1000,军力+5）',effect:{treasury:-1000,militaryPower:5}},{text:'从缓',effect:{militaryPower:-2}}],
      src:'演绎' },
    { condition:(s)=>s.stats.navyPower<15, minister:{cat:'military',idx:1},
      title:'水师请增', text:'东南海防空虚，请造战船增兵。', 
      options:[{text:'准增（国库-600,水师+3）',effect:{treasury:-600,navyPower:3}},{text:'不增',effect:{}}],
      src:'演绎' },
    // 民生类
    { condition:(s)=>s.stats.stability<40, minister:{cat:'civil',idx:2},
      title:'民不聊生请抚', text:'天下汹汹，民不聊生。臣请发帑赈济以安民心。', 
      options:[{text:'发赈（国库-800,稳+3）',effect:{treasury:-800,stability:3}},{text:'不加抚',effect:{stability:-2,mandate:-1}}],
      src:'演绎' },
    { condition:(s)=>s.stats.population<3000000, minister:{cat:'civil',idx:3},
      title:'人口凋减请恤', text:'在籍人口大减，天下力本之民寡矣。请轻徭薄赋。', 
      options:[{text:'轻徭薄赋（国库-300,人+1）',effect:{treasury:-300,population:100000}},{text:'不加恤',effect:{}}],
      src:'演绎' },
    // 腐败类
    { condition:(s)=>s.stats.corruption>60, minister:{cat:'civil',idx:4},
      title:'贪风甚炽请肃', text:'贪墨成风，吏治大坏。臣请严惩贪吏以清政源。', 
      options:[{text:'严惩（贪腐-4,文+1）',effect:{corruption:-4,civil:1}},{text:'宽纵（贪腐+2）',effect:{corruption:2}}],
      src:'演绎' },
    // 外戚类
    { condition:(s)=>s.factions.consort>70, minister:{cat:'civil',idx:5},
      title:'外戚太盛请裁', text:'外戚势盛，渐干朝政。请裁抑以防微杜渐。', 
      options:[{text:'裁抑（外戚-3,稳+1）',effect:{consort:-3,stability:1}},{text:'不裁',effect:{consort:1,mandate:-1}}],
      src:'演绎' },
    // 宦官类
    { condition:(s)=>s.factions.eunuch>70, minister:{cat:'civil',idx:0},
      title:'阉宦过盛请抑', text:'宦官权势过盛，恐重蹈汉唐覆辙。请抑阉以安朝局。', 
      options:[{text:'抑阉（宦-3,文+2）',effect:{eunuch:-3,civil:2}},{text:'不抑',effect:{eunuch:1,stability:-1}}],
      src:'演绎' },
    // 文官类
    { condition:(s)=>s.factions.civil<40, minister:{cat:'civil',idx:1},
      title:'文官寒心请宽', text:'文官动辄得咎，士气消磨。请宽文法以收士心。', 
      options:[{text:'宽文法（文+3）',effect:{civil:3}},{text:'不加宽',effect:{civil:-2}}],
      src:'演绎' },
    // 文化类
    { condition:(s)=>s.stats.culture<30, minister:{cat:'civil',idx:2},
      title:'文教不兴请振', text:'文教衰微，士风浮薄。请兴学重教以培国本。', 
      options:[{text:'兴学（国库-400,文化+3）',effect:{treasury:-400,culture:3}},{text:'不兴',effect:{}}],
      src:'演绎' },
    // 科技类
    { condition:(s)=>s.stats.tech<25, minister:{cat:'military',idx:0},
      title:'技艺落后请改良', text:'百工技艺落后于泰西，请设局研习。', 
      options:[{text:'设局（国库-300,科技+2）',effect:{treasury:-300,tech:2}},{text:'不设',effect:{}}],
      src:'演绎' },
    // 商业类
    { condition:(s)=>s.stats.commerce<25, minister:{cat:'civil',idx:3},
      title:'商贸不兴请通', text:'商路阻滞，商贸不兴，请减关税通商路。', 
      options:[{text:'减税通商（商+3,国库+200）',effect:{commerce:3,treasury:200}},{text:'不减',effect:{}}],
      src:'演绎' },
    // 农业类
    { condition:(s)=>s.stats.agriculture<30, minister:{cat:'civil',idx:4},
      title:'农事不修请劝', text:'农事废弛，粮产不足。请劝农桑以充国储。', 
      options:[{text:'劝农（粮+300,农+2）',effect:{food:300,agriculture:2}},{text:'不劝',effect:{}}],
      src:'演绎' },
    // 宗室类
    { condition:(s)=>s.factions.royal>60, minister:{cat:'civil',idx:5},
      title:'藩王太盛请削', text:'藩王坐大，岁禄靡费。请削藩以强干弱枝。', 
      options:[{text:'削藩（宗-3,国库+500）',effect:{royal:-3,treasury:500}},{text:'不削（宗+1）',effect:{royal:1}}],
      src:'演绎' },
    // 天命类
    { condition:(s)=>s.stats.mandate<30, minister:{cat:'civil',idx:0},
      title:'天命可疑请修德', text:'天命下衰，民望不归。请修德安民以回天意。', 
      options:[{text:'修德（稳+2,天命+2）',effect:{stability:2,mandate:2}},{text:'不加修',effect:{mandate:-1}}],
      src:'演绎' },
    // 行效类
    { condition:(s)=>s.stats.adminEfficiency<35, minister:{cat:'civil',idx:1},
      title:'吏治废弛请整', text:'行政效率低下，政令壅滞。请整饬吏治。', 
      options:[{text:'整饬（行效+3,文+1）',effect:{adminEfficiency:3,civil:1}},{text:'不整',effect:{adminEfficiency:-1}}],
      src:'演绎' },
    // 边患类
    { condition:(s)=>s.stats.militaryPower>60&&s.factions.military>50, minister:{cat:'military',idx:2},
      title:'军力充盈可出击', text:'军力可用，边患可平。臣请出塞捣巢以绝边患。', 
      options:[{text:'准出击（国库-1500,军力-8,威望+3）',effect:{treasury:-1500,militaryPower:-8,prestige:3}},{text:'不允',effect:{}}],
      src:'演绎' },
    // 综合类
    { condition:(s)=>s.stats.stability>60&&s.stats.treasury>8000, minister:{cat:'civil',idx:0},
      title:'天下粗安可兴文', text:'海内粗安，府库充盈，可兴文教、修典籍。', 
      options:[{text:'兴文修典（国库-600,文化+3,威望+2）',effect:{treasury:-600,culture:3,prestige:2}},{text:'从缓',effect:{}}],
      src:'演绎' },
    { condition:(s)=>s.stats.stability<30&&s.stats.corruption>50, minister:{cat:'civil',idx:1},
      title:'危局请大改', text:'内忧外患，非大改无以救危。臣请变法图存。', 
      options:[{text:'准变法（稳+3,文+2,国库-1000）',effect:{stability:3,civil:2,treasury:-1000}},{text:'守旧',effect:{stability:-2}}],
      src:'演绎' },
    { condition:(s)=>s.stats.canalEfficiency<30, minister:{cat:'civil',idx:2},
      title:'漕运不通请疏', text:'运河淤塞，漕粮不达。请发帑疏浚。', 
      options:[{text:'疏浚（国库-800,漕+3）',effect:{treasury:-800,canalEfficiency:3}},{text:'不疏',effect:{canalEfficiency:-2,food:-300}}],
      src:'演绎' }
];
