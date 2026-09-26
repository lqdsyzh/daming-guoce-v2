// ============================================
// 《大明国策》批2 模块B：大臣召见互动
// 实探名单：MINISTERS 共 20 人（civil 6 / military 4 / royal 3 / eunuch 4 / consort 3）
// 四互动：问策 / 闲谈 / 赏赐 / 训诫（均有限频与代价，反爽游）
// 台词逐条注《明史》出处或注明"演绎"，宁换不编
// ============================================

// ====== 召见限频：每位大臣每互动类型独立冷却（章）======
const TALK_CD_TICKS = 5;
// 赏赐代价与封顶（反爽游：赏赐有派系代价，忠心加成累计封顶+8）
const TALK_REWARD_COST = 500;      // 内帑 -500两（与既有"赐宴 -500"量级对齐，防白嫖）
const TALK_REWARD_CAP = 8;         // 赏赐忠心加成累计封顶
const TALK_GOSSIP_CHANCE = 0.25;   // 闲谈提及另一大臣概率
const TALK_GOSSIP_MAX = 2;         // 被提者忠心+1 限2次

// ====== 台词库：20大臣 ×（问策1 + 闲谈2 + 训诫1），全部注《明史》出处或"演绎"======
const DAMING_TALK_DATA = {
    // —— 文官（civil，6人）——
    '李东阳': {
        counsel: { text: '刘瑾用事以来，老臣委曲其间，潜移默夺，所全善类实多。惟愿陛下用人勿疑。', effect: { stability: 2, corruption: 1 }, src: '《明史》卷181·李东阳传（"潜移默夺，保全善类"）' },
        chats: [
            { text: '老臣近日校诗，得"刨得白云种紫芝"之句，聊博陛下一哂。', src: '演绎（茶陵派诗宗，本传载其文望）' },
            { text: '瑾贼气焰熏天时，老臣退朝每独坐至夜分，忧不能寐。', src: '《明史》卷181·李东阳传（瑾横时弥缝其间）' }
        ],
        admonish: { text: '老臣暮景，尚知朝纲不可一日堕。愿陛下亲贤臣，远便嬖。', effect: {}, src: '演绎（据本传老成谋国气象）' }
    },
    '杨士奇': {
        counsel: { text: '弭盗安民，在择良有司，不在峻法。请陛下敕吏部慎选守令。', effect: { agriculture: 2, treasury: -300 }, src: '《明史》卷148·杨士奇传（屡陈安民之策，据本传大义）' },
        chats: [
            { text: '老臣辅导东宫二十年，惟愿圣嗣早知稼穑艰难。', src: '《明史》卷148·杨士奇传（辅导东宫二十年）' },
            { text: '臣家四世同居，皆赖祖宗积善之报。', src: '演绎（据本传老成持重口吻）' }
        ],
        admonish: { text: '老臣负天下之望，不敢一日忘社稷。陛下临政，宜常若临渊。', effect: {}, src: '演绎（据本传气象）' }
    },
    '杨荣': {
        counsel: { text: '虏畏劫而怯战，宜乘其衰弱，出塞捣其巢穴，乃一劳永逸计。', effect: { militaryPower: 200, treasury: -500 }, src: '《明史》卷148·杨荣传（成祖北征，荣屡赞军务）' },
        chats: [
            { text: '老臣随驾北征，见榆木川风物，至今梦寐犹忆。', src: '《明史》卷148·杨荣传（从征纪事，演绎口吻）' },
            { text: '金川门之变时臣方壮，见事机闪渗，惟断乃成。', src: '演绎（据本传"谋而能断"）' }
        ],
        admonish: { text: '兵者凶事，用之贵乎当机。陛下勿以武备为缓图。', effect: {}, src: '演绎（据本传善边事）' }
    },
    '杨溥': {
        counsel: { text: '守成之君，当谨守成宪，勿轻改作。法祖即所以安天下。', effect: { stability: 2, culture: 1 }, src: '演绎（据《明史》卷148·杨溥传清慎守成气象）' },
        chats: [
            { text: '臣每入朝，循墙而走，不敢一毫自恣。', src: '《明史》卷148·杨溥传（"每入朝，循墙而走"）' },
            { text: '狱中十年，老臣日读书不辍，方有今日。', src: '《明史》卷148·杨溥传（系锦衣卫狱数年读书自若）' }
        ],
        admonish: { text: '陛下圣德日新，惟刑狱之慎，尤社稷之福。', effect: {}, src: '演绎（据本传清慎）' }
    },
    '刘健': {
        counsel: { text: '愿陛下亲君子，远小人，黜贪残，恤贫困，则天下自安。', effect: { civil: 2, eunuch: -2 }, src: '《明史》卷181·刘健传（屡陈"变纲领，黜贪残"，据本传谏疏大意）' },
        chats: [
            { text: '先帝宵衣旰食，臣等敢不夙夜在公。', src: '演绎（据本传弘治旧臣口吻）' },
            { text: '刘瑾既逐臣等，天下事遂不可问，老臣耻之。', src: '《明史》卷181·刘健传（正德初以谏刘瑾致仕）' }
        ],
        admonish: { text: '臣老矣，犹见陛下任用近习。自古宦寺之祸，成于积累，愿陛下察之。', effect: {}, src: '演绎（据本传谏疏大意）' }
    },
    '谢迁': {
        counsel: { text: '宴会游观，非人主盛德。愿陛下省游宴、节赏赐，以养威福。', effect: { prestige: 1, consort: -1 }, src: '《明史》卷181·谢迁传（屡谏止游宴，据本传大意）' },
        chats: [
            { text: '时人语曰：李公谋，刘公断，谢公尤侃侃。臣愧不敢当。', src: '《明史》卷181·谢迁传（"时人为之语曰"）' },
            { text: '臣与刘公同日致仕，去国之日，惟仰天而已。', src: '《明史》卷181·谢迁传（与刘健同致仕）' }
        ],
        admonish: { text: '言路者国之命脉，陛下勿以逆耳而塞之。', effect: {}, src: '演绎（据本传侃侃之风）' }
    },
    // —— 武将（military，4人）——
    '王骥': {
        counsel: { text: '边夷负固，必大创之乃肯效顺。愿陛下勿惜庙谟，臣愿请行。', effect: { militaryPower: 300, treasury: -800 }, src: '《明史》卷154·王骥传（三征麓川，"请大举"）' },
        chats: [
            { text: '麓川之役，臣三涉瘴疠，将士裹粮百战，方定南疆。', src: '《明史》卷154·王骥传（麓川之役）' },
            { text: '臣以进士起家而佩将印，本朝一人而已，愧无以报圣恩。', src: '《明史》卷154·王骥传（"以文臣佩大将印，自骥始"）' }
        ],
        admonish: { text: '将骄卒惰，皆由姑息。陛下宜严核边功，勿使虚冒。', effect: {}, src: '演绎（据本传整饬戎务）' }
    },
    '蒋贵': {
        counsel: { text: '兵不在众，在将勇而饷足。请旨核边储，简骁锐。', effect: { militaryPower: 150, militaryFood: -200 }, src: '演绎（据《明史》卷154·蒋贵传"所至以敢战闻"）' },
        chats: [
            { text: '臣起行伍，百战之躯，刀瘢犹在。', src: '演绎（据本传敢战）' },
            { text: '与王尚书同征麓川，士马俱瘁，幸不辱命。', src: '《明史》卷154·蒋贵传（与王骥同征麓川）' }
        ],
        admonish: { text: '边军之弊，弊在冒饷。臣请陛下亲核名册。', effect: {}, src: '演绎（边将口吻）' }
    },
    '赵安': {
        counsel: { text: '甘肃孤悬河外，非厚饷精械无以固人心。愿发内帑以济边。', effect: { militaryFood: 300, treasury: -500 }, src: '演绎（据《明史》卷155·赵安传久镇甘肃）' },
        chats: [
            { text: '西陲风霜最烈，戍卒衣单，臣每念之不置。', src: '演绎（边将口吻）' },
            { text: '臣世守西陲，惟愿番汉相安，边烽不入。', src: '《明史》卷155·赵安传（镇守甘肃多年）' }
        ],
        admonish: { text: '臣知边饷岁耗，然减一卒则虚一墩，愿陛下慎之。', effect: {}, src: '演绎（边将口吻）' }
    },
    '王越': {
        counsel: { text: '御虏当出塞捣巢，使其自相疑惧，然后边患可息。', effect: { militaryPower: 250, horses: -100 }, src: '《明史》卷171·王越传（红盐池之捷，捣虏巢）' },
        chats: [
            { text: '红盐池一捷，虏十余年不敢深入，此臣得意笔也。', src: '《明史》卷171·王越传（红盐池之捷）' },
            { text: '臣附汪直以成边功，士林非议，臣自知之。', src: '《明史》卷171·王越传（"越遂附直"，自省口吻）' }
        ],
        admonish: { text: '文武本无二途，陛下勿以臣以文阶典兵而疑之。', effect: {}, src: '演绎（据本传进士出身领兵）' }
    },
    // —— 宗室（royal，3人）——
    '朱骕': {
        counsel: { text: '臣愿练兵牧马，为陛下藩屏北门。', effect: { militaryPower: 100, royal: 2 }, src: '演绎（宗室口吻，本游戏虚构人物）' },
        chats: [
            { text: '北虏环伺，藩篱之责在臣，不敢一日懈。', src: '演绎（宗室口吻，本游戏虚构人物）' },
            { text: '宫中岁月静好，臣恨不能效死疆场。', src: '演绎（宗室口吻，本游戏虚构人物）' }
        ],
        admonish: { text: '臣自知护卫之数，谨遵祖制，不敢逾。', effect: {}, src: '演绎（宗室口吻，本游戏虚构人物）' }
    },
    '朱权': {
        counsel: { text: '臣习道术、精音律，愿陛下清心寡欲，以绵国祚。', effect: { mandate: 2, culture: 1 }, src: '《明史》卷117·宁王权传（晚学神仙之术）' },
        chats: [
            { text: '靖难之役，臣为大哥所挟，至今言之泣下。', src: '《明史》卷117·宁王权传（被成祖挟持起兵，演绎口吻）' },
            { text: '臣晚年移居南昌，日与文士谈道，不复问世事。', src: '《明史》卷117·宁王权传（晚居南昌）' }
        ],
        admonish: { text: '藩国之礼，臣不敢废。惟愿陛下勿听谗言，疑及宗亲。', effect: {}, src: '演绎（据本传所遭，怨望口吻）' }
    },
    '朱宸濠': {
        counsel: { text: '江西饶沃，甲兵亦足，愿为陛下西藩，岁贡不绝。', effect: { food: 400, royal: 3 }, src: '演绎（据《明史》卷117·宁王宸濠传蓄志不法，口吻藏锋）' },
        chats: [
            { text: '臣府中新得善琴者，愿献于御前。', src: '演绎（据本传结交权幸，投其所好）' },
            { text: '南昌城里，士民皆颂臣贤，臣愧领之。', src: '演绎（据本传矫饰贤名）' }
        ],
        admonish: { text: '臣谨守藩封，朝野流言，愿陛下明察。', effect: {}, src: '演绎（据本传阳为悔过）' }
    },
    // —— 宦官（eunuch，4人）——
    '汪直': {
        counsel: { text: '愿陛下命臣巡抚边关，虏情虚实，臣必星驰以报。', effect: { military: 2, treasury: -400, eunuch: 1 }, src: '《明史》卷304·汪直传（"直年少喜兵"，屡请巡边）' },
        chats: [
            { text: '西厂缇骑四出，大小臣工一举一动，臣皆知之。', src: '《明史》卷304·汪直传（提督西厂，威势倾天下）' },
            { text: '直本瑶人之后，蒙陛下拔擢，虽肝脑涂地不足报。', src: '《明史》卷304·汪直传（大藤峡瑶人出身，演绎口吻）' }
        ],
        admonish: { text: '臣办差稍有风波，然厂臣不严，则奸究无所惮。愿陛下裁夺。', effect: {}, src: '演绎（据本传威福自恣）' }
    },
    '王敬': {
        counsel: { text: '厂中消息朝发夕至，朝野动静，臣愿为陛下耳目。', effect: { corruption: 2, eunuch: 2, stability: -1 }, src: '演绎（西厂爪牙口吻，见《明史》卷304汪直传附事）' },
        chats: [
            { text: '外官见厂中人影皆惮，此陛下天威使然。', src: '演绎（厂卫口吻）' },
            { text: '臣司侦缉，不敢言功，惟恐负陛下委任。', src: '演绎（厂卫口吻）' }
        ],
        admonish: { text: '侦缉之权，臣必谨守分际，不令外廷议陛下之短。', effect: {}, src: '演绎（厂卫口吻）' }
    },
    '刘瑾': {
        counsel: { text: '陛下万几之暇，章奏琐细，付老奴省决可也，必不烦圣虑。', effect: { adminEfficiency: 2, eunuch: 3, civil: -2 }, src: '《明史》卷304·刘瑾传（专伺上嬉弄时进章奏请省决）' },
        chats: [
            { text: '八虎之中，老奴忝居其首，诸内侍皆听约束。', src: '《明史》卷304·刘瑾传（"八虎"之首）' },
            { text: '凡官朝觐，皆有常例，此内府旧规，非老奴创之。', src: '演绎（据本传纳贿擅权，索贿口吻）' }
        ],
        admonish: { text: '外廷臣工，动辄谤议老奴。愿陛下勿为浮言所动。', effect: {}, src: '演绎（据本传屡兴大狱）' }
    },
    '魏忠贤': {
        counsel: { text: '厂臣督三殿大工，又催比诸路税监，岁入皆可充帑，陛下无忧。', effect: { treasury: 600, civil: -3, eunuch: 2 }, src: '《明史》卷305·魏忠贤传（催比税监、大修三殿）' },
        chats: [
            { text: '厂臣在宫中四十年，陛下一颦一笑，臣皆能体之。', src: '演绎（据本传与帝乳母客氏相比为奸）' },
            { text: '外廷东林诸公日日劾臣，臣惟有竭股肱以报。', src: '《明史》卷305·魏忠贤传（东林党狱，演绎口吻）' }
        ],
        admonish: { text: '臣牛马走耳，天下事赖陛下圣明，臣不过奉行而已。', effect: {}, src: '演绎（九千岁口吻，绵里藏针）' }
    },
    // —— 外戚（consort，3人）——
    '万安': {
        counsel: { text: '边事自有边将任之，陛下但安坐九重，臣等颂圣可也。', effect: { stability: 1, prestige: -1 }, src: '《明史》卷168·万安传（"万岁阁老"，见帝顿首呼万岁，演绎口吻）' },
        chats: [
            { text: '臣与中宫椒房之亲，敢不竭忠。', src: '演绎（据本传依附万贵妃为内援）' },
            { text: '票拟之事，臣自有权衡，陛下勿劳圣心。', src: '《明史》卷168·万安传（柄国惟日事请托）' }
        ],
        admonish: { text: '臣谨遵圣谕，惟宫闱之敬，不敢少懈。', effect: {}, src: '演绎（据本传"无学术，惟事请托"）' }
    },
    '梁芳': {
        counsel: { text: '臣岁办珍玩进御，用度不足，请发太仓以济。', effect: { privyPurse: 300, treasury: -500 }, src: '《明史》卷304·梁芳传（假名进奉，刮取内帑，耗太仓）' },
        chats: [
            { text: '内库金宝充栋，皆臣胼手胝足所办。', src: '《明史》卷304·梁芳传（"以进奉为名"）' },
            { text: '斋醮之事，内廷自有旧例，外廷不知也。', src: '演绎（据本传与李孜省辈以斋醮进）' }
        ],
        admonish: { text: '臣办进奉，账目俱在，愿陛下差人查核。', effect: {}, src: '演绎（据本传侵耗帑藏）' }
    },
    '钱宁': {
        counsel: { text: '豹房百戏日新，愿陛下时临幸，以怡圣情。', effect: { privyPurse: 200, prestige: -1, consort: 1 }, src: '演绎（据《明史》卷307·佞幸传·钱宁侍豹房得幸）' },
        chats: [
            { text: '臣蒙赐国姓，此旷世之恩，粉身难报。', src: '《明史》卷307·钱宁传（赐国姓，为义子）' },
            { text: '宁王府岁有馈遗，皆是礼数，臣未尝私受一钱。', src: '《明史》卷307·钱宁传（交通宸濠，馈遗金宝，欺饰口吻）' }
        ],
        admonish: { text: '臣侍陛下左右，惟谨惟慎，愿陛下察臣孤忠。', effect: {}, src: '演绎（佞幸口吻）' }
    }
};

// ====== 泛化池（未收录大臣兜底，按派系）======
const DAMING_GENERIC_TALK = {
    civil: {
        counsel: { text: '愿陛下崇俭节用，进贤退不肖，则庶政自举。', effect: { stability: 1, treasury: -100 }, src: '泛化·演绎（明代文官通义）' },
        chats: [
            { text: '臣下值焚香静坐，闻陛下圣学日进，不胜欣忭。', src: '泛化·演绎' },
            { text: '臣昨览邸报，见四方粗安，惟愿久久如此。', src: '泛化·演绎' }
        ],
        admonish: { text: '臣职在献替，知无不言，愿陛下恕臣狂直。', effect: {}, src: '泛化·演绎' }
    },
    military: {
        counsel: { text: '边备之要，在士饱马腾。请旨增饷练兵。', effect: { militaryPower: 100, treasury: -400 }, src: '泛化·演绎（明代边将通义）' },
        chats: [
            { text: '臣帐下儿郎皆愿效死，惟饷械时有不继。', src: '泛化·演绎' },
            { text: '夜巡关塞，见烽燧相望，不敢忘忧。', src: '泛化·演绎' }
        ],
        admonish: { text: '军中恩威并施，臣请陛下勿以小故夺边将。', effect: {}, src: '泛化·演绎' }
    },
    royal: {
        counsel: { text: '臣愿岁修朝谒之礼，为陛下藩屏宗支。', effect: { royal: 1, stability: 1 }, src: '泛化·演绎（藩王通义）' },
        chats: [
            { text: '臣府岁用皆赖朝廷禄米，感荷天恩。', src: '泛化·演绎' },
            { text: '臣谨守祖训，不敢预闻外事。', src: '泛化·演绎' }
        ],
        admonish: { text: '臣知护卫之制，谨遵勿逾，愿陛下勿疑宗亲。', effect: {}, src: '泛化·演绎' }
    },
    eunuch: {
        counsel: { text: '内府用度，臣自当搏节，不敢糜费。', effect: { privyPurse: 100, eunuch: 1 }, src: '泛化·演绎（内侍通义）' },
        chats: [
            { text: '宫中诸事，奴婢皆小心伺候，不敢有失。', src: '泛化·演绎' },
            { text: '外廷有言奴婢专擅者，奴婢惟泣血自明。', src: '泛化·演绎' }
        ],
        admonish: { text: '奴婢谨遵圣训，惟圣躬起居，臣必亲视。', effect: {}, src: '泛化·演绎' }
    },
    consort: {
        counsel: { text: '臣族蒙恩深厚，惟愿谨守本分，不预朝政。', effect: { consort: 1, stability: 1 }, src: '泛化·演绎（外戚通义）' },
        chats: [
            { text: '椒房之内，皆颂陛下圣德。', src: '泛化·演绎' },
            { text: '臣家子弟，臣必严加约束，不敢骄纵。', src: '泛化·演绎' }
        ],
        admonish: { text: '臣谨奉圣谕，敕族下毋得干请。', effect: {}, src: '泛化·演绎' }
    }
};

// ====== 大臣史实关系徽标（同党/姻亲/政敌，逐条注出处）======
const DAMING_RELATIONS = [
    { names: ['李东阳', '刘健'],   label: '同殿辅臣·弘治三相', src: '《明史》卷181（刘健谢迁李东阳同传）' },
    { names: ['李东阳', '谢迁'],   label: '同殿辅臣·弘治三相', src: '《明史》卷181（同上）' },
    { names: ['刘健', '谢迁'],     label: '同殿辅臣·同日致仕', src: '《明史》卷181（同上）' },
    { names: ['杨士奇', '杨荣'],   label: '三杨同辅',   src: '《明史》卷148（三杨合传）' },
    { names: ['杨士奇', '杨溥'],   label: '三杨同辅',   src: '《明史》卷148（同上）' },
    { names: ['杨荣', '杨溥'],     label: '三杨同辅',   src: '《明史》卷148（同上）' },
    { names: ['王骥', '蒋贵'],     label: '同征麓川',   src: '《明史》卷154（王骥传/蒋贵传）' },
    { names: ['王越', '汪直'],     label: '越附于直',   src: '《明史》卷171·王越传（"越遂附直"）' },
    { names: ['汪直', '王敬'],     label: '西厂同党',   src: '《明史》卷304·汪直传（演绎）' },
    { names: ['朱权', '朱宸濠'],   label: '宁王一脉',   src: '《明史》卷117·诸王传（祖孙相承）' },
    { names: ['万安', '梁芳'],     label: '成化聚敛同党', src: '《明史》卷304·梁芳传（演绎：同为贵妃党羽）' },
    { names: ['钱宁', '朱宸濠'],   label: '私相交通',   src: '《明史》卷307·钱宁传（"交通宸濠，馈遗金宝"）' },
    { names: ['刘瑾', '魏忠贤'],   label: '先后权阉',   src: '演绎（《明史》卷304/卷305）' }
];

// ====== 召见状态初始化（限频key/提及计数/赏赐加成）======
function initTalkState() {
    return { cd: {}, gossip: {}, reward: {}, current: null };
}

// ====== 打开召见浮层（名录"召见"按钮入口）======
function openTalkModal(cat, idx) {
    try {
        const m = GameState.ministers[cat] && GameState.ministers[cat][idx];
        if (!m) return;
        if (!GameState.talkState) GameState.talkState = initTalkState();
        GameState.talkState.current = { cat, idx };
        // 批3：在狱/已殁者不可召见；召见记录（和解彩蛋判定用）
        try {
            if (m.jailed || m.dead) {
                GameState.talkState.current = null;
                pushNews('宫掖', `${m.name}身在诏狱（或已殁），无由召见。`, 'normal');
                return;
            }
            GameState.talkState.called = GameState.talkState.called || {};
            GameState.talkState.called[m.name] = true;
            if (typeof tryReconcilePairs === 'function') tryReconcilePairs();
        } catch (e) {}
        try { DamingSFX.play('step'); } catch (e) {}
        const catName = { civil: '文官', military: '武将', royal: '宗室', eunuch: '宦官', consort: '外戚' }[cat] || '朝臣';
        document.getElementById('talk-name').textContent = m.name;
        document.getElementById('talk-rank').textContent = `${m.rank} · ${catName}`;
        document.getElementById('talk-loyalty').textContent = `忠 ${m.loyalty}`;
        // 关系徽标（一行）
        const rel = DAMING_RELATIONS.filter(r => r.names.indexOf(m.name) >= 0)
            .map(r => `${r.label}（${r.src}）`).join('；');
        document.getElementById('talk-relation').textContent = rel ? `关系：${rel}` : '关系：暂无史载。';
        document.getElementById('talk-body').textContent = `${m.name}伏拜：陛下召臣，臣惶恐。`;
        document.getElementById('talk-hint').textContent = '';
        renderTalkActions();
        document.getElementById('talk-modal').classList.add('active');
    } catch (e) {}
}

function closeTalkModal() {
    try {
        document.getElementById('talk-modal').classList.remove('active');
        if (GameState.talkState) GameState.talkState.current = null;
        renderPanel(GameState.currentTab);
    } catch (e) {}
}

// ====== 冷却校验（每位大臣每互动类型独立）======
function talkCooldownKey(kind) {
    try {
        const c = GameState.talkState && GameState.talkState.current;
        return c ? `${c.cat}_${c.idx}_${kind}` : '';
    } catch (e) { return ''; }
}

function talkIsCooling(kind) {
    try {
        const key = talkCooldownKey(kind);
        if (!key || !GameState.talkState) return false;
        const last = GameState.talkState.cd[key];
        if (last === undefined) return false;
        return (getMapTick() - last) < TALK_CD_TICKS;
    } catch (e) { return false; }
}

function talkMarkCd(kind) {
    try {
        const key = talkCooldownKey(kind);
        if (key && GameState.talkState) GameState.talkState.cd[key] = getMapTick();
    } catch (e) {}
}

// ====== 动作按钮渲染（含冷却提示）======
function renderTalkActions() {
    try {
        const box = document.getElementById('talk-actions');
        if (!box) return;
        const kinds = [
            { kind: 'ask',      label: '问策' },
            { kind: 'chat',     label: '闲谈' },
            { kind: 'reward',   label: '赏赐' },
            { kind: 'admonish', label: '训诫' }
        ];
        box.innerHTML = kinds.map(k => {
            const cool = talkIsCooling(k.kind);
            const remain = cool ? (TALK_CD_TICKS - (getMapTick() - GameState.talkState.cd[talkCooldownKey(k.kind)])) : 0;
            return cool
                ? `<button class="talk-act-btn" disabled>${k.label}（${remain}章后）</button>`
                : `<button class="talk-act-btn" onclick="talkAction('${k.kind}')">${k.label}</button>`;
        }).join('');
    } catch (e) {}
}

// ====== 四互动分发 ======
function talkAction(kind) {
    try {
        if (talkIsCooling(kind)) {
            document.getElementById('talk-hint').textContent = '频召近臣，非体统也。稍候再召。';
            renderTalkActions();
            return;
        }
        if (kind === 'ask') talkAsk();
        else if (kind === 'chat') talkChat();
        else if (kind === 'reward') talkReward();
        else if (kind === 'admonish') talkAdmonish();
        renderTalkActions();
        updateUI();
    } catch (e) {}
}

// ====== 问策：史实主张一条 + 五资源小效果 ======
function talkAsk() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        const data = DAMING_TALK_DATA[m.name] || DAMING_GENERIC_TALK[cur.cat];
        if (!data || !data.counsel) return;
        talkMarkCd('ask');
        // 应用效果（22资源体系内的小效果）
        const eff = data.counsel.effect || {};
        const parts = [];
        for (const [k, v] of Object.entries(eff)) {
            if (k in GameState.stats) {
                GameState.stats[k] = Math.max(0, (GameState.stats[k] || 0) + v);
                const rn = RESOURCES[k] ? RESOURCES[k].name : k;
                parts.push(`${rn} ${v > 0 ? '+' : ''}${v}`);
            } else if (k in GameState.factions) {
                GameState.factions[k] = Math.max(0, Math.min(100, GameState.factions[k] + v));
                const fn = FACTIONS[k] ? FACTIONS[k].name : k;
                parts.push(`${fn} ${v > 0 ? '+' : ''}${v}`);
            }
        }
        try { DamingSFX.play('decide'); } catch (e) {}
        document.getElementById('talk-body').textContent = `${m.name}对曰：${data.counsel.text}`;
        document.getElementById('talk-hint').textContent = `【问策】${parts.join(' | ') || '无'}（${data.counsel.src}）`;
        enforceLimits();
    } catch (e) {}
}

// ====== 闲谈：池随机，25%概率提及另一大臣（被提者+1忠心，限2次）======
function talkChat() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        const data = DAMING_TALK_DATA[m.name] || DAMING_GENERIC_TALK[cur.cat];
        if (!data || !data.chats || data.chats.length === 0) return;
        talkMarkCd('chat');
        const chat = data.chats[Math.floor(Math.random() * data.chats.length)];
        let extra = '';
        // 25% 概率提及另一大臣（优先史实关系对象，否则同派系随机）
        if (Math.random() < TALK_GOSSIP_CHANCE) {
            const partners = DAMING_RELATIONS.filter(r => r.names.indexOf(m.name) >= 0)
                .map(r => r.names.filter(n => n !== m.name)[0])
                .filter(Boolean);
            let otherName = null;
            if (partners.length > 0) {
                otherName = partners[Math.floor(Math.random() * partners.length)];
            } else {
                const sameCat = GameState.ministers[cur.cat].filter(x => x.name !== m.name);
                if (sameCat.length > 0) otherName = sameCat[Math.floor(Math.random() * sameCat.length)].name;
            }
            if (otherName) {
                const cnt = (GameState.talkState.gossip && GameState.talkState.gossip[otherName]) || 0;
                if (cnt < TALK_GOSSIP_MAX) {
                    if (!GameState.talkState.gossip) GameState.talkState.gossip = {};
                    GameState.talkState.gossip[otherName] = cnt + 1;
                    // 被提者忠心+1
                    for (const list of Object.values(GameState.ministers)) {
                        const other = list.find(x => x.name === otherName);
                        if (other) { other.loyalty = Math.min(100, other.loyalty + 1); break; }
                    }
                    extra = ` 谈及${otherName}，其心感陛下眷注（忠心+1，第${cnt + 1}次）。`;
                } else {
                    extra = ` 又谈及${otherName}，圣眷已极，再无加意。`;
                }
            }
        }
        try { DamingSFX.play('click'); } catch (e) {}
        document.getElementById('talk-body').textContent = `${m.name}闲奏：${chat.text}`;
        document.getElementById('talk-hint').textContent = `【闲谈】${extra || '叙话而已。'}（${chat.src}）`;
    } catch (e) {}
}

// ====== 赏赐：内帑有代价 → 忠心+8封顶；派系代价（反爽游）======
function talkReward() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        if (!GameState.talkState.reward) GameState.talkState.reward = {};
        const boosted = GameState.talkState.reward[m.name] || 0;
        if (boosted >= TALK_REWARD_CAP) {
            document.getElementById('talk-hint').textContent = '【赏赐】赏赐已隆，再加则恩滥，臣不敢领。';
            return;
        }
        if (GameState.stats.privyPurse < TALK_REWARD_COST) {
            document.getElementById('talk-hint').textContent = '内帑不充，无从颁赏。';
            return;
        }
        talkMarkCd('reward');
        GameState.stats.privyPurse -= TALK_REWARD_COST;
        const gain = Math.min(TALK_REWARD_CAP - boosted, 8);
        m.loyalty = Math.min(100, m.loyalty + gain);
        GameState.talkState.reward[m.name] = boosted + gain;
        // 派系代价：赏宦官→宦官派系+2（养阉为患）；文官+1；其余派系各+1
        const factionGain = cur.cat === 'eunuch' ? 2 : 1;
        GameState.factions[cur.cat] = Math.min(100, GameState.factions[cur.cat] + factionGain);
        const fn = FACTIONS[cur.cat] ? FACTIONS[cur.cat].name : cur.cat;
        try { DamingSFX.play('coin'); } catch (e) {}
        document.getElementById('talk-loyalty').textContent = `忠 ${m.loyalty}`;
        document.getElementById('talk-body').textContent = `${m.name}顿首：陛下厚赐，臣粉身难报。`;
        document.getElementById('talk-hint').textContent =
            `【赏赐】内帑 -${TALK_REWARD_COST}两 | 忠心 +${gain}（累计${boosted + gain}/${TALK_REWARD_CAP}封顶）| ${fn} +${factionGain}（受赏而骄，反爽代价）`;
        enforceLimits();
    } catch (e) {}
}

// ====== 训诫：忠心-3，但该员所辖派系+1敬畏（有权衡）======
function talkAdmonish() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        const data = DAMING_TALK_DATA[m.name] || DAMING_GENERIC_TALK[cur.cat];
        talkMarkCd('admonish');
        m.loyalty = Math.max(0, m.loyalty - 3);
        GameState.factions[cur.cat] = Math.min(100, GameState.factions[cur.cat] + 1);
        const fn = FACTIONS[cur.cat] ? FACTIONS[cur.cat].name : cur.cat;
        try { DamingSFX.play('urgent'); } catch (e) {}
        document.getElementById('talk-loyalty').textContent = `忠 ${m.loyalty}`;
        const text = (data && data.admonish) ? data.admonish.text : '臣谨领圣训。';
        const src = (data && data.admonish) ? data.admonish.src : '泛化·演绎';
        document.getElementById('talk-body').textContent = `${m.name}免冠顿首：${text}`;
        document.getElementById('talk-hint').textContent =
            `【训诫】${m.name}忠心 -3 | ${fn} +1（同侪见之生畏）| （${src}）`;
        enforceLimits();
    } catch (e) {}
}

// ============================================
// 批4：大臣互动扩展（4→8种）
// 新增：密谋/调任/赐宅/联姻
// 反爽铁律：每种都有代价
// ============================================

// ====== 扩展动作按钮渲染 ======
function renderTalkActionsExt() {
    try {
        const box = document.getElementById('talk-actions');
        if (!box) return;
        const kinds = [
            { kind: 'ask',      label: '问策' },
            { kind: 'chat',     label: '闲谈' },
            { kind: 'reward',   label: '赏赐' },
            { kind: 'admonish', label: '训诫' },
            { kind: 'conspire', label: '密谋' },
            { kind: 'transfer', label: '调任' },
            { kind: 'grant',    label: '赐宅' },
            { kind: 'marry',    label: '联姻' }
        ];
        box.innerHTML = kinds.map(k => {
            const cool = talkIsCooling(k.kind);
            const remain = cool ? (TALK_CD_TICKS - (getMapTick() - GameState.talkState.cd[talkCooldownKey(k.kind)])) : 0;
            return cool
                ? `<button class="talk-act-btn" disabled>${k.label}（${remain}章后）</button>`
                : `<button class="talk-act-btn" onclick="talkActionExt('${k.kind}')">${k.label}</button>`;
        }).join('');
    } catch (e) {}
}

// ====== 8互动分发 ======
function talkActionExt(kind) {
    try {
        if (talkIsCooling(kind)) {
            document.getElementById('talk-hint').textContent = '频召近臣，非体统也。稍候再召。';
            renderTalkActionsExt();
            return;
        }
        // 原有4种走旧逻辑
        if (kind === 'ask') { talkAsk(); renderTalkActionsExt(); return; }
        if (kind === 'chat') { talkChat(); renderTalkActionsExt(); return; }
        if (kind === 'reward') { talkReward(); renderTalkActionsExt(); return; }
        if (kind === 'admonish') { talkAdmonish(); renderTalkActionsExt(); return; }
        // 新增4种
        if (kind === 'conspire') talkConspire();
        else if (kind === 'transfer') talkTransfer();
        else if (kind === 'grant') talkGrant();
        else if (kind === 'marry') talkMarry();
        renderTalkActionsExt();
        updateUI();
    } catch (e) {}
}

// ====== 密谋：联合某派系图谋，代价：若败露忠心-5,稳-3 ======
function talkConspire() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        talkMarkCd('conspire');
        // 败露概率：对方清廉度/200
        const leakChance = (m.integrity || 50) / 200;
        if (Math.random() < leakChance) {
            // 败露
            m.loyalty = Math.max(0, m.loyalty - 5);
            GameState.stats.stability = Math.max(0, GameState.stats.stability - 3);
            pushNews('朝堂', `密谋败露！${m.name}为人所觉，忠心-5，稳定-3。`, 'critical');
            try { DamingSFX.play('urgent'); } catch (e) {}
            document.getElementById('talk-body').textContent = `${m.name}惶恐：臣万死！此事为人所觉……`;
            document.getElementById('talk-hint').textContent = '【密谋败露】忠心 -5 | 稳定 -3';
        } else {
            // 成功：该派系+2，文官-1（暗中结党）
            GameState.factions[cur.cat] = Math.min(100, GameState.factions[cur.cat] + 2);
            GameState.factions.civil = Math.max(0, GameState.factions.civil - 1);
            pushNews('朝堂', `与${m.name}密谋结党，${FACTIONS[cur.cat] ? FACTIONS[cur.cat].name : cur.cat} +2，文官 -1。`, 'normal');
            try { DamingSFX.play('click'); } catch (e) {}
            document.getElementById('talk-body').textContent = `${m.name}低语：臣当效死力，共图大事……`;
            document.getElementById('talk-hint').textContent = `【密谋】${FACTIONS[cur.cat] ? FACTIONS[cur.cat].name : cur.cat} +2 | 文官 -1`;
        }
        enforceLimits();
    } catch (e) {}
}

// ====== 调任：换岗位，派系平衡打乱 ======
function talkTransfer() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        talkMarkCd('transfer');
        // 调任：原派系-2，目标派系+2（随机选另一派系）
        const cats = ['civil','military','royal','eunuch','consort'].filter(c => c !== cur.cat);
        const target = cats[Math.floor(Math.random() * cats.length)];
        GameState.factions[cur.cat] = Math.max(0, GameState.factions[cur.cat] - 2);
        GameState.factions[target] = Math.min(100, GameState.factions[target] + 2);
        m.loyalty = Math.max(0, m.loyalty - 5); // 调任不悦
        const fn1 = FACTIONS[cur.cat] ? FACTIONS[cur.cat].name : cur.cat;
        const fn2 = FACTIONS[target] ? FACTIONS[target].name : target;
        pushNews('人事', `调${m.name}至${fn2}：${fn1} -2，${fn2} +2，忠心 -5（调任不悦）。`, 'normal');
        try { DamingSFX.play('decide'); } catch (e) {}
        document.getElementById('talk-body').textContent = `${m.name}叩首：臣虽不才，唯命是从……`;
        document.getElementById('talk-hint').textContent = `【调任】${fn1} -2 | ${fn2} +2 | 忠心 -5`;
        enforceLimits();
    } catch (e) {}
}

// ====== 赐宅：内帑-1(千两)，忠心+3，但百官侧目 ======
function talkGrant() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        if (GameState.stats.privyPurse < 1000) {
            document.getElementById('talk-hint').textContent = '内帑不足千两，无从赐宅。';
            return;
        }
        talkMarkCd('grant');
        GameState.stats.privyPurse -= 1000;
        m.loyalty = Math.min(100, m.loyalty + 3);
        GameState.factions.civil = Math.max(0, GameState.factions.civil - 1); // 百官侧目
        pushNews('内帑', `赐${m.name}宅第：内帑 -1000，忠心 +3，百官侧目（文官 -1）。`, 'normal');
        try { DamingSFX.play('coin'); } catch (e) {}
        document.getElementById('talk-body').textContent = `${m.name}顿首谢恩：臣粉身碎骨难报！`;
        document.getElementById('talk-hint').textContent = '【赐宅】内帑 -1000 | 忠心 +3 | 文官 -1（侧目）';
        enforceLimits();
    } catch (e) {}
}

// ====== 联姻：宗室+后妃联动，外戚+2 ======
function talkMarry() {
    try {
        const cur = GameState.talkState && GameState.talkState.current;
        if (!cur) return;
        const m = GameState.ministers[cur.cat][cur.idx];
        talkMarkCd('marry');
        GameState.factions.royal = Math.min(100, GameState.factions.royal + 2);
        GameState.factions.consort = Math.min(100, GameState.factions.consort + 2);
        m.loyalty = Math.min(100, m.loyalty + 5); // 联姻大恩
        pushNews('宗藩', `与${m.name}联姻：宗室 +2，外戚 +2，忠心 +5。`, 'normal');
        try { DamingSFX.play('auspicious'); } catch (e) {}
        document.getElementById('talk-body').textContent = `${m.name}大喜：承蒙天恩，臣门有幸！`;
        document.getElementById('talk-hint').textContent = '【联姻】宗室 +2 | 外戚 +2 | 忠心 +5';
        enforceLimits();
    } catch (e) {}
}

// 覆盖旧版renderTalkActions（使8按钮生效）
var _origRenderTalkActions = renderTalkActions;
renderTalkActions = function() { renderTalkActionsExt(); };
