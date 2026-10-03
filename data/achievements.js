// ============================================
// 《大明国策》v2.1 成就系统
// 16 个里程碑
// ============================================

const ACHIEVEMENTS = [
    { id: 'ten_years',     name: '十年天子',     desc: '在位十年',     icon: '冠', check: (s) => s.currentYear >= 10 },
    { id: 'twenty_years',  name: '二十载太平',   desc: '在位二十年',   icon: '鼎', check: (s) => s.currentYear >= 20 },
    { id: 'no_eunuch',     name: '阉宦清流',     desc: '宦官势力<30',  icon: '清', check: (s) => s.factions.eunuch < 30 },
    { id: 'strong_army',   name: '军威赫赫',     desc: '军力>15000',   icon: '戈', check: (s) => s.stats.militaryPower > 15000 },
    { id: 'full_treasury', name: '国库充盈',     desc: '国库>20000',   icon: '银', check: (s) => s.stats.treasury > 20000 },
    { id: 'pop_growth',    name: '生齿日繁',     desc: '人口>7000万',  icon: '丁', check: (s) => s.stats.population > 70000000 },
    { id: 'zero_corr',     name: '弊绝风清',     desc: '腐败<10',      icon: '廉', check: (s) => s.stats.corruption < 10 },
    { id: 'tech_10',       name: '技艺精进',     desc: '研究10项科技', icon: '技', check: (s) => Object.values(s.techs).reduce((sum, t) => sum + t.length, 0) >= 10 },
    { id: 'wonder_5',      name: '营造盛世',     desc: '建5奇观',     icon: '工', check: (s) => s.wonders.length >= 5 },
    { id: 'min_30',        name: '野无遗贤',     desc: '所有大臣忠诚>80', icon: '贤', check: (s) => {
        return Object.values(s.ministers).every(cat => cat.every(m => m.loyalty > 80));
    }},
    { id: 'impeach_5',     name: '明察秋毫',     desc: '弹劾5次',     icon: '法', check: (s) => (s.impeachmentCount || 0) >= 5 },
    { id: 'mandate_max',   name: '天命归心',     desc: '天命=100',     icon: '命', check: (s) => s.stats.mandate >= 100 },
    { id: 'border_0',      name: '四夷宾服',     desc: '边患=0',       icon: '塞', check: (s) => s.stats.frontier <= 0 },
    { id: 'culture_80',    name: '文教昌明',     desc: '文化>80',      icon: '文', check: (s) => s.stats.culture >= 80 },
    { id: 'no_prince',     name: '干戈永息',     desc: '宗室<30',      icon: '安', check: (s) => s.factions.royal < 30 },
    { id: 'low_stab',      name: '天下大乱',     desc: '稳定<20',      icon: '乱', check: (s) => s.stats.stability < 20 }
];

// 已解锁成就持久化
let _unlockedAchievements = [];
const ACH_KEY = 'daming_achievements_v2';

function loadAchievements() {
    try {
        const raw = localStorage.getItem(ACH_KEY);
        if (raw) _unlockedAchievements = JSON.parse(raw);
    } catch(e) { _unlockedAchievements = []; }
}

function saveAchievements() {
    try { localStorage.setItem(ACH_KEY, JSON.stringify(_unlockedAchievements)); } catch(e) {}
}

function checkAchievements() {
    if (typeof GameState === 'undefined' || !GameState.script) return;
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(a => {
        if (!_unlockedAchievements.includes(a.id) && a.check(GameState)) {
            _unlockedAchievements.push(a.id);
            newlyUnlocked.push(a);
        }
    });
    if (newlyUnlocked.length > 0) {
        saveAchievements();
        newlyUnlocked.forEach(a => {
            pushNews('成就', `◆ ${a.icon} ${a.name} · ${a.desc}`, 'normal');
        });
    }
}

function getUnlockedCount() {
    return _unlockedAchievements.length;
}

console.log('✓ 16个成就已加载');
