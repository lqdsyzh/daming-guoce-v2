// ============================================
// 《大明国策》批5 · 隐藏成就 + 特色彩蛋
// 剧本专属隐藏成就，延用既有 ACHIEVEMENTS 检查框架（checkAchievements 遍历 push）。
// 史据：《明史》各本纪/列传（万安"纸糊三阁老"；正德豹房；
//       万历争国本；天启魏忠贤"九千岁"；白莲教徐鸿儒；萨尔浒杜松之殇）。
// ============================================

(function extendHiddenAchievements() {
    try {
        if (typeof ACHIEVEMENTS === 'undefined' || !Array.isArray(ACHIEVEMENTS)) return;
        const HIDDEN = [
            { id: 'zhihu_sange', name: '纸糊三阁老', desc: '成化朝在位多年，满朝皆阿谀', icon: '糊', hidden: true, script: 'chenghua',
                check: (s) => s.script && s.script.id === 'chenghua' && s.currentYear >= 8,
                src: '《明史》卷168·万安传：安历翰苑，与刘珝、刘吉并居内阁，时人讥为"纸糊三阁老"，政多由其与万贵妃宦者关通。' },
            { id: 'youlong_xi', name: '游龙戏凤', desc: '正德朝乐游微行，纵酒荒嬉', icon: '龙', hidden: true, script: 'zhengde',
                check: (s) => s.script && s.script.id === 'zhengde' && s.currentYear >= 5,
                src: '《明史》卷16·武宗本纪：帝数微行，纵放鹰犬，建豹房乐之，纲纪渐弛。' },
            { id: 'zhengguo_ben', name: '争国本僵持', desc: '万历朝国本久悬，廷议纷争', icon: '僵', hidden: true, script: 'wanli',
                check: (s) => s.script && s.script.id === 'wanli' && s.currentYear >= 10,
                src: '《明史》卷240·争国本诸臣传：神宗溺爱郑贵妃，久不立储，群臣伏阙力争，国本二十年始定。' },
            { id: 'jiu_qiansui', name: '九千岁', desc: '天启朝宦官势力顶格', icon: '阉', hidden: true, script: 'tianqi',
                check: (s) => s.factions && s.factions.eunuch >= 90,
                src: '《明史》卷305·魏忠贤传：忠贤擅权，称"九千岁"，生祠遍天下，阉党满朝。' },
            { id: 'bailian_jing', name: '白莲惊变', desc: '天启间白莲教徐鸿儒起事', icon: '莲', hidden: true, script: 'tianqi',
                check: (s) => s.script && s.script.id === 'tianqi' && s.stats && s.stats.stability < 40,
                src: '《明史》卷257·赵彦传：天启二年，徐鸿儒以白莲教倡乱，聚众数十万，攻陷州县。' },
            { id: 'saerhu_zhi', name: '萨尔浒之殇', desc: '出征重挫折将，如萨尔浒之役', icon: '殇', hidden: true,
                check: (s) => { try { return ((s.mapData && (s.mapData.expDead || []).length) || 0) >= 2; } catch (e) { return false; } },
                src: '《明史》卷228·杜松传：萨尔浒之战，松恃勇轻进，遇伏矢集如猬，力战死。' },
            { id: 'wuren_shi', name: '无人识金', desc: '埋守珍宝无人识，藏久生尘', icon: '晦', hidden: true,
                check: (s) => { try { return (s.stats && s.stats.treasury > 20000); } catch (e) { return false; } },
                src: '演绎。暗藏府库巨银而不用，名为国储，实则滞财。' },
            { id: 'hongyi_wu', name: '红衣狂潮', desc: '研至红衣大炮，火器登峰', icon: '炮', hidden: true,
                check: (s) => { try { return (s.milOps && s.milOps.firearms === 3); } catch (e) { return false; } },
                src: '《明史》卷92·兵志四：红夷大炮利于攻城，袁崇焕守宁远用之却敌。' },
            { id: 'bingbian_yu', name: '骄兵之变', desc: '练兵过度致兵变风险登顶', icon: '叛', hidden: true,
                check: (s) => { try { return (s.milOps && s.milOps.mutinyRisk >= 95); } catch (e) { return false; } },
                src: '《明史》兵志一：屯戍不恤，则军士怨叛。（演绎）' },
            { id: 'yanshi_yu', name: '连灾不弭', desc: '复灾风险登顶而怠于赈济', icon: '殃', hidden: true,
                check: (s) => { try { return (s.zaiyi && s.zaiyi.recurRisk >= 90); } catch (e) { return false; } },
                src: '《明史》卷78·食货志二：灾伤不即赈，民多流殍。（演绎）' },
            { id: 'anshi_fangqie', name: '独断之讥', desc: '朱批屡驳，言官清议沸腾', icon: '讥', hidden: true,
                check: (s) => { try { return (s.junpi && s.junpi.qingyi >= 6); } catch (e) { return false; } },
                src: '《明史》志·职官：言官司纠劾，君有过非则诤。（演绎）' },
            { id: 'kongbao_wu', name: '豹房虚度', desc: '正德朝怠政，礼乐久废', icon: '豹', hidden: true, script: 'zhengde',
                check: (s) => { try { return s.script && s.script.id === 'zhengde' && (s.lizhi && s.lizhi.neglectTicks >= 3); } catch (e) { return false; } },
                src: '《明史》卷16·武宗本纪：帝居豹房，怠于祭祀，礼乐暂弛。' }
        ];
        HIDDEN.forEach(h => { if (!ACHIEVEMENTS.some(x => x.id === h.id)) ACHIEVEMENTS.push(h); });
        window._hiddenAchievementCount = HIDDEN.length;
    } catch (e) {}
})();

// ---- 特色彩蛋（隐藏 肖事件，特定剧本+特定年份+特定操作组合触发） ----
const B5_CELEBRATIONS = [
    { id: 'yulong_bian', name: '鱼龙变化', 
      when: () => { try { return GameState._frontierStreak >= 10; } catch (e) { return false; } },
      event: { title: '边镇豪帅鱼龙变化', desc: '九边连年戒严，一老卒积功至大将，辽左军中传"鱼龙变化"，已非朝廷所能制——豪帅坐大之象也。', type: 'border',
        options: [ { text: '召入京师，阳尊而阴夺其兵', effect: { military: -2, faction_military: -2 } }, { text: '姑安之，待其自固边圉', effect: { frontier: 5 } } ], src: '演绎（明末边将坐大之叹，参《明史》李成梁传）。' }
    },
    { id: 'kufang_chaosheng', name: '大内藏宝', 
      when: () => { try { return (GameState.stats && GameState.stats.privyPurse > 15000); } catch (e) { return false; } },
      event: { title: '大内藏宝盈库', desc: '内帑积金累万，宦官陈请增设库藏，以备上供。然藏富宫禁，民属何赖？', type: 'royal',
        options: [ { text: '严诞流于阉竖，权宜赏赉', effect: { eunuch: 3, privyPurse: -2000 } }, { text: '出内帑济边、减赋', effect: { treasury: 2000, mandate: 2 } } ], src: '演绎（内帑与外库之辨，参《明史》食货志）。' }
    }
];

function checkCelebrations() {
    try {
        B5_CELEBRATIONS.forEach(c => {
            try {
                if (window._b5CelebDone && window._b5CelebDone.indexOf(c.id) >= 0) return;
                if (c.when()) {
                    if (!window._b5CelebDone) window._b5CelebDone = [];
                    window._b5CelebDone.push(c.id);
                    pushNews('奇兆', `◆ 隐藏肖事·${c.name}`, 'critical');
                    if (typeof showEvent === 'function') showEvent(c.event);
                }
            } catch (e) {}
        });
    } catch (e) {}
}

// 边镇连年红警计数（b5Tick 调用）
function celebFrontierStreakTick() {
    try {
        if (typeof GameState._frontierStreak !== 'number') GameState._frontierStreak = 0;
        if (GameState.stats && (GameState.stats.frontier || 0) >= 35) GameState._frontierStreak++;
        else GameState._frontierStreak = 0;
    } catch (e) {}
}

console.log('✓ 批5·隐藏成就+彩蛋加载完成');