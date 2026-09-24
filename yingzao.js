// ============================================
// 《大明国策》批4 模块E：营造系统（可操作版）
// 修宫殿/筑城/开运河/建书院/修皇陵
// 各烧不同资源，长期buff不同
// 逾制营造→言官弹劾/民怨
// 史据：《明史》卷82·食货志六（营造）/卷68·河渠志
// 反爽铁律：营造烧资源，逾制有代价
// ============================================

const YINGZAO_CD = 4;   // 每营造4章冷却

const YINGZAO_PROJECTS = [
    {
        key: 'palace', name: '修宫殿', desc: '修葺宫室殿宇',
        cost: { treasury: -2000, wood: -300, stone: -200, iron: -100 },
        effect: { prestige: 3, mandate: 1 },
        overreach: '逾制营造！言官交章弹劾，民怨沸天',
        overreachEffect: { civil: -3, stability: -2, prestige: -2 },
        src: '《明史》卷82·食货志六：营建宫殿'
    },
    {
        key: 'wall', name: '筑城', desc: '修筑边城墙堡',
        cost: { treasury: -1500, stone: -400, wood: -200, iron: -50 },
        effect: { militaryPower: 5, stability: 2 },
        src: '《明史》卷68·河渠志：筑城修堤'
    },
    {
        key: 'canal', name: '开运河', desc: '疏浚运河河道',
        cost: { treasury: -1800, wood: -200, stone: -300 },
        effect: { canalEfficiency: 5, commerce: 2, food: 500 },
        src: '《明史》卷68·河渠志：运河疏浚'
    },
    {
        key: 'academy', name: '建书院', desc: '兴建州县书院',
        cost: { treasury: -800, wood: -150 },
        effect: { culture: 3, civil: 1 },
        src: '演绎（明代书院大兴）'
    },
    {
        key: 'tomb', name: '修皇陵', desc: '修葺皇陵寝殿',
        cost: { treasury: -3000, stone: -500, wood: -300, iron: -200 },
        effect: { mandate: 2, prestige: 2 },
        overreach: '修陵靡费过巨，民力不堪',
        overreachEffect: { stability: -3, mandate: -2 },
        src: '《明史》卷82·食货志六：营建山陵'
    }
];

function initYingzaoState() {
    return { cd: {}, completed: [], overreachCount: 0 };
}

// ====== 渲染营造面板 ======
function renderYingzaoTab() {
    try {
        if (!GameState.yingzaoState) GameState.yingzaoState = initYingzaoState();
        const tick = getMapTick();
        const projectCards = YINGZAO_PROJECTS.map(p => {
            const cdKey = 'yz_' + p.key;
            const lastCd = GameState.yingzaoState.cd[cdKey] || -99;
            const cooling = (tick - lastCd) < YINGZAO_CD;
            const remain = cooling ? (YINGZAO_CD - (tick - lastCd)) : 0;
            // 检查资源够不够
            let canAfford = true;
            const costParts = [];
            for (const [k, v] of Object.entries(p.cost)) {
                const actual = Math.abs(v);
                if ((GameState.stats[k] || 0) < actual) canAfford = false;
                const rn = RESOURCES[k] ? RESOURCES[k].name : k;
                costParts.push(`${rn} -${actual}`);
            }
            const effectParts = [];
            for (const [k, v] of Object.entries(p.effect)) {
                const rn = RESOURCES[k] ? RESOURCES[k].name : (FACTIONS[k] ? FACTIONS[k].name : k);
                effectParts.push(`${rn} +${v}`);
            }
            const disabled = cooling || !canAfford;
            return `<div class="yz-project-card">
                <h4 class="yz-name">${p.name}</h4>
                <div class="yz-desc">${p.desc}</div>
                <div class="yz-cost">耗费：${costParts.join(' | ')}</div>
                <div class="yz-effect">成效：${effectParts.join(' | ')}</div>
                ${p.overreach ? '<div class="yz-warn">⚠ 逾制风险：' + p.overreach + '</div>' : ''}
                <button class="cw-btn" ${disabled ? 'disabled' : ''} onclick="yingzaoBuild('${p.key}')">
                    兴工营造${cooling ? '（' + remain + '章后）' : ''}
                </button>
                <div class="yz-src">${p.src}</div>
            </div>`;
        }).join('');
        const completedList = (GameState.yingzaoState.completed || []).map(c => `<li>${c}</li>`).join('');
        return `<div class="yz-wrap">
            <div class="yz-banner">「天下之费，莫大于土木」——《明史》卷82·食货志六</div>
            <h3 class="section-title">营造工部（5种营造，各有限频与代价）</h3>
            <div class="yz-projects">${projectCards}</div>
            <h3 class="section-title">已完工</h3>
            <ul class="yz-completed">${completedList || '<li>尚无营造。</li>'}</ul>
        </div>`;
    } catch (e) { return '<div class="yz-wrap">工部暂安。</div>'; }
}

// ====== 执行营造 ======
function yingzaoBuild(key) {
    try {
        if (!GameState.yingzaoState) GameState.yingzaoState = initYingzaoState();
        const p = YINGZAO_PROJECTS.find(x => x.key === key);
        if (!p) return;
        const tick = getMapTick();
        const cdKey = 'yz_' + p.key;
        const lastCd = GameState.yingzaoState.cd[cdKey] || -99;
        if (tick - lastCd < YINGZAO_CD) {
            pushNews('工部', '前工未毕，不宜再兴营造。', 'normal'); return;
        }
        // 资源检查
        for (const [k, v] of Object.entries(p.cost)) {
            if ((GameState.stats[k] || 0) < Math.abs(v)) {
                pushNews('工部', '物料不充，无从兴工。', 'critical'); return;
            }
        }
        GameState.yingzaoState.cd[cdKey] = tick;
        // 扣资源
        for (const [k, v] of Object.entries(p.cost)) {
            GameState.stats[k] = (GameState.stats[k] || 0) + v;
        }
        // 应用效果
        for (const [k, v] of Object.entries(p.effect)) {
            if (k in GameState.stats) GameState.stats[k] = Math.max(0, Math.min(100, GameState.stats[k] + v));
            else if (k in GameState.factions) GameState.factions[k] = Math.max(0, Math.min(100, GameState.factions[k] + v));
        }
        // 逾制判定（修宫殿/皇陵：耗费超3000两则30%概率触发）
        let overreachTriggered = false;
        if (p.overreach) {
            const totalCost = Math.abs(p.cost.treasury || 0);
            if (totalCost >= 2000 && Math.random() < 0.3) {
                overreachTriggered = true;
                GameState.yingzaoState.overreachCount = (GameState.yingzaoState.overreachCount || 0) + 1;
                for (const [k, v] of Object.entries(p.overreachEffect)) {
                    if (k in GameState.factions) GameState.factions[k] = Math.max(0, Math.min(100, GameState.factions[k] + v));
                    else if (k in GameState.stats) GameState.stats[k] = Math.max(0, Math.min(100, GameState.stats[k] + v));
                }
                pushNews('工部', `⚠ ${p.overreach}！（${p.src}）`, 'critical');
                try { DamingSFX.play('urgent'); } catch (e) {}
            }
        }
        if (!overreachTriggered) {
            GameState.yingzaoState.completed = GameState.yingzaoState.completed || [];
            GameState.yingzaoState.completed.push(`${p.name}（第${GameState.currentYear + 1}年）`);
            pushNews('工部', `${p.name}工竣（${p.src}）`, 'normal');
            try { DamingSFX.play('coin'); } catch (e) {}
        }
        enforceLimits();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}
