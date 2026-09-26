// ============================================
// 《大明国策》批4 模块B：后宫互动扩展
// 6种操作：宠幸/省亲/废黜/选侍/教子/赐宴
// 各有代价（宠幸过多→朝臣不满、废黜→外戚反噬）
// 后妃好感/子嗣系统联动结局
// 史据：《明史》卷113-114·后妃传 / 卷119·诸王传
// 反爽铁律：每操作有权衡代价
// ============================================

const HAREM_CD = 3;          // 每操作3章冷却
const HAREM_FAVOR_CAP = 100; // 好感封顶
const HAREM_FAVOR_WARN = 70; // 宠幸过多阈值→朝臣不满

// ====== 后宫操作定义（含代价链）======
const HAREM_ACTIONS = {
    favor: {
        name: '宠幸', desc: '临幸后妃，增其恩宠',
        cost: { privyPurse: -200 },     // 内帑-200（赏赐随行）
        effect: { favor: 15 },           // 好感+15
        warning: '宠幸过频，朝臣议论',   // 超过阈值时触发
        src: '《明史》卷113·后妃传：帝幸某宫'
    },
    visit: {
        name: '省亲', desc: '准后妃归宁省亲',
        cost: { privyPurse: -100 },
        effect: { favor: 5, consort: 1 },
        src: '演绎（明代后妃省亲之礼）'
    },
    depose: {
        name: '废黜', desc: '废黜后妃（慎之！）',
        cost: {},
        effect: { favor: -100, consort: -5, stability: -3, civil: -2 },
        src: '《明史》卷113·后妃传：废后事例'
    },
    select: {
        name: '选侍', desc: '选良家子入侍',
        cost: { privyPurse: -300 },
        effect: { favor: 0 },
        src: '演绎（明代选侍之制）'
    },
    teach: {
        name: '教子', desc: '亲教皇子读书',
        cost: {},
        effect: { favor: 5, culture: 1 },
        src: '演绎（明代帝王教子故事）'
    },
    banquet: {
        name: '赐宴', desc: '赐后宫宴饮',
        cost: { privyPurse: -500 },
        effect: { favor: 8, consort: 1 },
        src: '演绎'
    }
};

// ====== 后宫状态初始化 ======
function initHaremInteractState() {
    return { cd: {}, actions: 0, totalFavorGiven: 0, deposedList: [] };
}

// ====== 渲染后宫互动面板（tab 'harem' 增强）======
function renderHaremInteractTab() {
    try {
        if (!GameState.haremInteract) GameState.haremInteract = initHaremInteractState();
        const consorts = (GameState.harem && GameState.harem.consorts) || [];
        const tick = getMapTick();
        const consortCards = consorts.map((c, i) => {
            const favor = c.favor || 0;
            const rankName = ['皇后','贵妃','妃','嫔','贵人','宫女'][c.rank - 1] || '选侍';
            const cdKey = 'harem_' + i;
            const lastCd = GameState.haremInteract.cd[cdKey] || -99;
            const cooling = (tick - lastCd) < HAREM_CD;
            const remain = cooling ? (HAREM_CD - (tick - lastCd)) : 0;
            const actionBtns = Object.entries(HAREM_ACTIONS).map(([k, a]) => {
                const disabled = cooling || (a.cost.privyPurse && GameState.stats.privyPurse < Math.abs(a.cost.privyPurse));
                if (k === 'depose' && (c.rank <= 1 || GameState.haremInteract.deposedList.indexOf(i) >= 0)) return '';
                return `<button class="cw-btn harem-act-btn" ${disabled ? 'disabled' : ''} onclick="haremAction(${i},'${k}')">${a.name}${cooling ? '(' + remain + '章)' : ''}</button>`;
            }).join('');
            return `<div class="harem-consort-card">
                <div class="harem-name">${c.name}（${rankName}）</div>
                <div class="harem-favor">恩宠 <div class="harem-favor-bar"><div class="harem-favor-fill" style="width:${favor}%"></div></div> ${favor}</div>
                <div class="harem-info">育子 ${c.sons || 0} · 族 ${c.family || '—'}</div>
                <div class="harem-actions">${actionBtns}</div>
            </div>`;
        }).join('');
        // 皇子/继承人简表
        const princes = (GameState.harem && GameState.harem.princeNames) || [];
        const princeHtml = princes.slice(0, 5).map((p, i) => {
            const traits = (GameState.harem.princeTraits || []);
            return `<span class="harem-prince">${p}（${traits[i] || '—'}）</span>`;
        }).join(' ');
        return `<div class="harem-wrap">
            <div class="harem-banner">「后宫干政，前朝不安」——《明史》卷113·后妃传序</div>
            <h3 class="section-title">六宫互动（每操作${HAREM_CD}章冷却，各有代价）</h3>
            <div class="harem-consorts">${consortCards}</div>
            <h3 class="section-title">皇子简表</h3>
            <div class="harem-princes">${princeHtml || '尚无皇子。'}</div>
            <div class="harem-hint">宠幸过频（累计恩宠${HAREM_FAVOR_WARN}+）将招朝臣非议。废黜后妃触发外戚反噬。无嗣则结局分支——过继宗室。</div>
        </div>`;
    } catch (e) { return '<div class="harem-wrap">后宫暂安。</div>'; }
}

// ====== 执行后宫操作 ======
function haremAction(consortIdx, actionKey) {
    try {
        if (!GameState.haremInteract) GameState.haremInteract = initHaremInteractState();
        const c = GameState.harem && GameState.harem.consorts && GameState.harem.consorts[consortIdx];
        if (!c) return;
        const a = HAREM_ACTIONS[actionKey];
        if (!a) return;
        const tick = getMapTick();
        const cdKey = 'harem_' + consortIdx;
        const lastCd = GameState.haremInteract.cd[cdKey] || -99;
        if (tick - lastCd < HAREM_CD) {
            pushNews('后宫', '频入后宫，非体统也。稍候再往。', 'normal');
            return;
        }
        // 代价检查
        if (a.cost.privyPurse && GameState.stats.privyPurse < Math.abs(a.cost.privyPurse)) {
            pushNews('后宫', '内帑不充，无从颁赏。', 'normal');
            return;
        }
        GameState.haremInteract.cd[cdKey] = tick;
        GameState.haremInteract.actions++;
        // 扣代价
        if (a.cost.privyPurse) GameState.stats.privyPurse += a.cost.privyPurse;
        // 应用效果
        if (a.effect.favor) {
            c.favor = Math.max(0, Math.min(HAREM_FAVOR_CAP, (c.favor || 0) + a.effect.favor));
            if (a.effect.favor > 0) GameState.haremInteract.totalFavorGiven += a.effect.favor;
        }
        if (a.effect.consort) GameState.factions.consort = Math.max(0, Math.min(100, GameState.factions.consort + a.effect.consort));
        if (a.effect.stability) GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + a.effect.stability));
        if (a.effect.civil) GameState.factions.civil = Math.max(0, Math.min(100, GameState.factions.civil + a.effect.civil));
        if (a.effect.culture) GameState.stats.culture = Math.max(0, Math.min(100, GameState.stats.culture + a.effect.culture));
        // 特殊：废黜
        if (actionKey === 'depose') {
            GameState.haremInteract.deposedList.push(consortIdx);
            pushNews('后宫', `废黜${c.name}——外戚震恐，朝野议论。（${a.src}）`, 'critical');
            try { DamingSFX.play('urgent'); } catch (e) {}
        }
        // 特殊：选侍（新增一妃）
        else if (actionKey === 'select') {
            const newRank = Math.min(6, (consorts.length > 0 ? consorts[consorts.length - 1].rank : 5) + 1);
            const names = ['赵氏','孙氏','周氏','吴氏','郑氏','王氏','冯氏','陈氏'];
            GameState.harem.consorts.push({
                name: names[Math.floor(Math.random() * names.length)],
                rank: Math.min(6, newRank), fertility: 40 + Math.floor(Math.random() * 40),
                age: 16 + Math.floor(Math.random() * 6), power: 10, favor: 30,
                family: '良家子', sons: 0
            });
            pushNews('后宫', `选良家子入侍，后宫增一新人。（${a.src}）`, 'normal');
        }
        // 特殊：宠幸过多警告
        else if (actionKey === 'favor' && GameState.haremInteract.totalFavorGiven > HAREM_FAVOR_WARN) {
            GameState.factions.civil = Math.max(0, GameState.factions.civil - 2);
            pushNews('后宫', `宠幸过频，朝臣非议：文官 -2。 (${a.warning})`, 'critical');
        }
        else {
            pushNews('后宫', `${a.name}${c.name}（${a.src}）`, 'normal');
        }
        try { DamingSFX.play('click'); } catch (e) {}
        enforceLimits();
        updateUI();
        if (typeof renderPanel === 'function') renderPanel(GameState.currentTab);
    } catch (e) {}
}
