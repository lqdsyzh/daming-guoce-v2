// ============================================
// 《大明国策》批4 模块C：外交互动
// 20国展示 → 5种操作：遣使/开市/封贡/和亲/征讨
// 按国力/关系解锁，各有代价
// 史据：《明史》卷323-327·外国传/西域传
// 反爽铁律：外交操作都有权衡代价
// ============================================

const DIPLO_CD = 3;   // 每国每操作3章冷却

const DIPLO_ACTIONS = {
    envoy: {
        name: '遣使', desc: '遣使通好',
        effect: { prestige: 1 }, cost: { treasury: -300 },
        require: { minRelation: 0 },  // 任何关系都可遣使
        src: '《明史》卷323·外国传：遣使通好'
    },
    market: {
        name: '开市', desc: '开设互市',
        effect: { commerce: 2, treasury: 200 }, cost: { treasury: -200 },
        require: { minRelation: 20, notAtWar: true },
        src: '《明史》卷327·俺答传：隆庆和议开马市'
    },
    tribute: {
        name: '封贡', desc: '册封朝贡',
        effect: { vassals: 1, prestige: 2 }, cost: { treasury: -500, privyPurse: -100 },
        require: { minRelation: 40, notAtWar: true },
        src: '《明史》卷323·外国传：朝贡体系'
    },
    marry: {
        name: '和亲', desc: '以宗室女和亲',
        effect: { vassals: 1, stability: 1 }, cost: { privyPurse: -2, royal: -2 },
        require: { minRelation: 30, notAtWar: true },
        src: '演绎（明代和亲极少，但与蒙古有姻好）'
    },
    crusade: {
        name: '征讨', desc: '发兵征讨',
        effect: { prestige: 2 }, cost: { treasury: -2000, militaryPower: -10 },
        require: { minRelation: -30 },  // 关系差到一定程度才征讨
        src: '《明史》卷238·李如松传：征倭援朝'
    }
};

function initDiploInteractState() {
    return { cd: {}, actions: 0 };
}

// ====== 国力/关系演算 ======
function diploRelation(nation) {
    try {
        return 100 - (nation.hostility || 0);
    } catch (e) { return 0; }
}

function diploCanAct(nation, actionKey) {
    try {
        const a = DIPLO_ACTIONS[actionKey];
        if (!a) return false;
        const rel = diploRelation(nation);
        if (a.require.minRelation !== undefined && rel < a.require.minRelation) return false;
        if (a.require.notAtWar && nation.hostility > 70) return false;
        return true;
    } catch (e) { return false; }
}

// ====== 渲染外交互动面板 ======
function renderDiploInteractTab() {
    try {
        if (!GameState.diploInteract) GameState.diploInteract = initDiploInteractState();
        const nations = GameState.nations || [];
        const tick = getMapTick();
        const typeColors = { '敌国': '#8b2c1a', '属国': '#4a6a4a', '邻国': '#b8893a', '友邦': '#5a6a7a' };
        const nationCards = nations.map((n, i) => {
            const rel = diploRelation(n);
            const relName = rel >= 60 ? '友善' : rel >= 30 ? '一般' : rel >= 0 ? '冷淡' : '敌对';
            const typeColor = typeColors[n.type] || '#5a4a3a';
            const actionBtns = Object.entries(DIPLO_ACTIONS).map(([k, a]) => {
                const cdKey = 'diplo_' + i + '_' + k;
                const lastCd = GameState.diploInteract.cd[cdKey] || -99;
                const cooling = (tick - lastCd) < DIPLO_CD;
                const canAct = diploCanAct(n, k);
                const disabled = cooling || !canAct;
                return `<button class="cw-btn diplo-act-btn" ${disabled ? 'disabled' : ''} onclick="diploAction(${i},'${k}')">${a.name}</button>`;
            }).join('');
            const traits = (n.traits || []).join('、');
            return `<div class="diplo-nation-card" style="border-left:3px solid ${typeColor}">
                <div class="diplo-name"><b>${n.name}</b><span class="diplo-type">${n.type}</span></div>
                <div class="diplo-rel">关系：${relName}（${rel}）· 国力：${n.strength}</div>
                <div class="diplo-traits">${traits}</div>
                <div class="diplo-actions">${actionBtns}</div>
            </div>`;
        }).join('');
        return `<div class="diplo-wrap">
            <div class="diplo-banner">「四夷来王，万邦入贡」——《明史》卷323-327</div>
            <h3 class="section-title">列国外交（5种操作，各有代价与门槛）</h3>
            <div class="diplo-nations">${nationCards}</div>
            <div class="diplo-hint">和亲：宗室女+嫁妆（内帑-2），藩属离心；征讨：出兵消耗军力国库，胜率随国力演算。</div>
        </div>`;
    } catch (e) { return '<div class="diplo-wrap">四夷安宁。</div>'; }
}

// ====== 执行外交操作 ======
function diploAction(nationIdx, actionKey) {
    try {
        if (!GameState.diploInteract) GameState.diploInteract = initDiploInteractState();
        const n = GameState.nations[nationIdx];
        if (!n) return;
        const a = DIPLO_ACTIONS[actionKey];
        if (!a) return;
        if (!diploCanAct(n, actionKey)) {
            pushNews('外交', `与${n.name}之关系不允此操作。`, 'normal');
            return;
        }
        const tick = getMapTick();
        const cdKey = 'diplo_' + nationIdx + '_' + actionKey;
        const lastCd = GameState.diploInteract.cd[cdKey] || -99;
        if (tick - lastCd < DIPLO_CD) {
            pushNews('外交', '使节方返，须再候。', 'normal');
            return;
        }
        GameState.diploInteract.cd[cdKey] = tick;
        GameState.diploInteract.actions++;
        // 扣代价
        if (a.cost.treasury) {
            if (GameState.stats.treasury < Math.abs(a.cost.treasury)) {
                pushNews('外交', '国库不足，无以行事。', 'critical'); return;
            }
            GameState.stats.treasury += a.cost.treasury;
        }
        if (a.cost.privyPurse) GameState.stats.privyPurse += a.cost.privyPurse;
        if (a.cost.militaryPower) GameState.stats.militaryPower = Math.max(0, GameState.stats.militaryPower + a.cost.militaryPower);
        if (a.cost.royal) GameState.factions.royal = Math.max(0, Math.min(100, GameState.factions.royal + a.cost.royal));
        // 应用效果
        if (a.effect.prestige) GameState.stats.prestige = Math.max(0, Math.min(100, GameState.stats.prestige + a.effect.prestige));
        if (a.effect.commerce) GameState.stats.commerce = Math.max(0, Math.min(100, GameState.stats.commerce + a.effect.commerce));
        if (a.effect.vassals) GameState.stats.vassals = Math.max(0, GameState.stats.vassals + a.effect.vassals);
        if (a.effect.stability) GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + a.effect.stability));
        // 征讨特殊处理
        if (actionKey === 'crusade') {
            const ourStr = GameState.stats.militaryPower;
            const theirStr = n.strength * 10;
            const winChance = ourStr / (ourStr + theirStr + 1);
            if (Math.random() < winChance) {
                n.hostility = Math.max(0, n.hostility - 30);
                pushNews('外交', `征讨${n.name}大捷！敌势稍戢。（${a.src}）`, 'critical');
                try { DamingSFX.play('auspicious'); } catch (e) {}
            } else {
                n.hostility = Math.min(100, n.hostility + 10);
                GameState.stats.prestige = Math.max(0, GameState.stats.prestige - 2);
                pushNews('外交', `征讨${n.name}不克，损兵折将，威望 -2。`, 'critical');
                try { DamingSFX.play('urgent'); } catch (e) {}
            }
        } else {
            n.hostility = Math.max(0, n.hostility - 5);
            pushNews('外交', `${a.name}${n.name}（${a.src}）`, 'normal');
            try { DamingSFX.play('click'); } catch (e) {}
        }
        enforceLimits();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}
