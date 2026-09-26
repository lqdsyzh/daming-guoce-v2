// ============================================
// 《大明国策》v2.1 史官年鉴系统
// 季度自动生成文言评语 + 十年大复盘
// ============================================

// 各种指标对应的文言文
const HISTORIAN_FRAGMENTS = {
    // 国库
    treasury_drain: '国库支绌，百官有菜色之忧。',
    treasury_full: '府库充盈，仓庾丰登，盛世可期。',
    treasury_debt:  '赤字累积，朝不保夕，社稷危亡。',
    treasury_mid:  '财政平稳，量入为出。',

    // 党派
    party_struggle: '朝臣与阉竖势同水火，党争方殷。',
    eunuch_dominant:'宦官窃柄，气焰熏天。',
    consort_dominant:'外戚秉政，权移阃外。',
    prince_dominant:'宗藩坐大，虎视眈眈。',
    peace_in_court:'朝堂晏安，政清人和。',

    // 边患
    border_war:    '北虏南倭，边境多事。',
    border_quiet:  '四夷宾服，塞外无尘。',
    border_chaos:  '烽火连天，将士苦战。',

    // 民生
    plague_outbreak:'瘟疫流行，生民倒悬。',
    famine:        '赤地千里，饿殍遍野。',
    pop_growth:    '天下太平，生齿日繁。',
    pop_loss:      '生民流离，十室九空。',

    // 文化/科技
    culture_boost: '文教昌明，士林称盛。',
    tech_boost:    '技艺精进，百工兴旺。',

    // 军政
    army_strong:   '军威赫赫，九边晏然。',
    army_weak:     '军备废弛，将帅无人。',
    navy_strong:   '水师扬威，海外宾服。',

    // 朝政
    corruption:    '贪墨成风，吏治败坏。',
    clean:         '弊绝风清，百官奉法。',
    wise:          '君明臣良，千古一遇。',
    misrule:       '朝政昏聩，忠良屏退。',

    // 天命
    mandate_lost:  '天命已去，人心尽失。',
    mandate_strong:'天命归心，万民拥戴。',

    // 党禁
    party_ban:     '党禁兴而士气沮，清流尽矣。'
};

function generateHistorianNote() {
    if (typeof GameState === 'undefined' || !GameState.script) return null;

    const s = GameState.stats;
    const f = GameState.factions;
    const era = GameState.script.era;
    const year = GameState.currentYear + 1;
    const season = SEASONS[GameState.currentSeason].name;
    const fragments = [];

    // 国库
    if (s.treasury < -5000) fragments.push('treasury_debt');
    else if (s.treasury < 0) fragments.push('treasury_drain');
    else if (s.treasury > 15000) fragments.push('treasury_full');
    else if (s.treasury > 8000) fragments.push('treasury_mid');

    // 党争
    if (f.civil > 75 && f.eunuch > 75) fragments.push('party_struggle');
    if (f.eunuch > 80) fragments.push('eunuch_dominant');
    if (f.consort > 80) fragments.push('consort_dominant');
    if (f.royal > 70) fragments.push('prince_dominant');
    if (fragments.length === 0 && f.civil < 60 && f.eunuch < 60 && f.royal < 50) {
        fragments.push('peace_in_court');
    }

    // 边患
    if (s.frontier > 70) fragments.push('border_war');
    else if (s.frontier > 50) fragments.push('border_chaos');
    else if (s.frontier < 20) fragments.push('border_quiet');

    // 民生
    if (s.population < 40000000) fragments.push('pop_loss');
    else if (s.population > 60000000) fragments.push('pop_growth');

    // 腐败
    if (s.corruption > 60) fragments.push('corruption');
    else if (s.corruption < 15) fragments.push('clean');

    // 军力
    if (s.militaryPower < 3000) fragments.push('army_weak');
    else if (s.militaryPower > 15000) fragments.push('army_strong');

    // 科技文化
    const totalTech = Object.values(GameState.techs).reduce((sum, t) => sum + t.length, 0);
    if (totalTech >= 10) fragments.push('tech_boost');
    if (s.culture >= 70) fragments.push('culture_boost');

    // 天命
    if (s.mandate < 30) fragments.push('mandate_lost');
    else if (s.mandate >= 90) fragments.push('mandate_strong');

    // 随机取 2-3 个片段
    const shuffled = fragments.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(3, shuffled.length));
    const notes = picked.map(k => HISTORIAN_FRAGMENTS[k]).join(' ');

    return `【史官记】${era}第${year}年${season}：${notes || '朝野安堵，无甚可记。'}`;
}

// 十年大复盘
function generateDecadeReview() {
    if (typeof GameState === 'undefined' || !GameState.script) return null;

    const s = GameState.stats;
    const f = GameState.factions;
    const era = GameState.script.era;
    const year = GameState.currentYear + 1;
    const decade = Math.floor((GameState.currentYear) / 10) * 10;

    // 综合评价
    let rating = '庸';
    const score = (s.stability + s.mandate + (100 - s.corruption) + (s.treasury > 0 ? 50 : 0) + s.culture) / 5;
    if (score > 80) rating = '圣';
    else if (score > 65) rating = '明';
    else if (score > 50) rating = '中';
    else if (score > 35) rating = '庸';
    else if (score > 20) rating = '昏';
    else rating = '暴';

    const totalTech = Object.values(GameState.techs).reduce((sum, t) => sum + t.length, 0);
    const totalWonder = GameState.wonders.length;

    return {
        era, year, decade, rating, score: Math.round(score),
        treasury: s.treasury,
        stability: s.stability,
        mandate: s.mandate,
        corruption: s.corruption,
        culture: s.culture,
        militaryPower: s.militaryPower,
        population: s.population,
        techCount: totalTech,
        wonderCount: totalWonder,
        decisions: GameState.decisionsCount,
        achievements: _unlockedAchievements.length,
        factionAvg: Math.round((f.civil + f.military + f.royal + f.eunuch + f.consort) / 5)
    };
}

function renderDecadeReview(review) {
    if (!review) return '';
    const era = review.era;
    const rating = review.rating;
    const ratingColor = {
        '圣': '#b8893a', '明': '#4a6a4a', '中': '#5a6a7a',
        '庸': '#5a4a3a', '昏': '#a83828', '暴': '#8b2c1a'
    }[rating] || '#5a4a3a';

    return `<div class="decade-review">
        <h3 class="review-title">【十年述】${era}前${review.decade + 10}年述职</h3>
        <div class="review-rating" style="color: ${ratingColor};">陛下之治，评为「${rating}」</div>
        <div class="review-stats">
            <div class="review-row"><span>在位</span><span>${review.decade + 10}年</span></div>
            <div class="review-row"><span>决事</span><span>${review.decisions} 次</span></div>
            <div class="review-row"><span>国库</span><span>${review.treasury} 两</span></div>
            <div class="review-row"><span>稳定</span><span>${review.stability}</span></div>
            <div class="review-row"><span>天命</span><span>${review.mandate}</span></div>
            <div class="review-row"><span>军力</span><span>${review.militaryPower}</span></div>
            <div class="review-row"><span>人口</span><span>${Math.round(review.population/10000)}万</span></div>
            <div class="review-row"><span>科技</span><span>${review.techCount} 项</span></div>
            <div class="review-row"><span>奇观</span><span>${review.wonderCount} 处</span></div>
            <div class="review-row"><span>成就</span><span>${review.achievements} 个</span></div>
            <div class="review-row"><span>派系均</span><span>${review.factionAvg}</span></div>
        </div>
        <p class="review-comment">${getRatingComment(rating)}</p>
    </div>`;
}

function getRatingComment(r) {
    const comments = {
        '圣': '三代以下，一人而已。',
        '明': '守成之君，堪称贤主。',
        '中': '中平之治，无大过亦无大功。',
        '庸': '庸碌之主，守成而已。',
        '昏': '朝政不纲，祸乱已伏。',
        '暴': '暴虐无道，天人共愤。'
    };
    return comments[r] || '';
}

console.log('✓ 史官年鉴系统已加载');
