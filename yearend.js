// ============================================
// 《大明国策》批1 模块C：岁末大计（年度总结算重做）
// 五步分展：岁入岁出 → 五府消长 → 社稷安危 → 岁内大事 → 史官总评+玉玺钦此
// 设计哲学：烂的不是盖章，是"没过程只有结果"——分步呈现，玩家有掌控感
// 结算数值逻辑沿用 script.js 原有实现，本文件只负责记录、呈现与交互
// 《明史》引文均经核实，演绎处注明
// ============================================

// 岁末大计五步定义
const YE_STEPS = [
    { key: 'ledger',    name: '岁入岁出' },
    { key: 'factions',  name: '五府消长' },
    { key: 'stability', name: '社稷安危' },
    { key: 'chronicle', name: '岁内大事' },
    { key: 'verdict',   name: '史官总评' }
];

const YE_STATE = {
    step: 0,
    report: null,
    stamped: false
};

// ====== 年度账本记录（由 seasonSettlement 挂点调用）======
function recordYearLedger(kind, key, amount) {
    try {
        if (!GameState.yearLedger) {
            GameState.yearLedger = { income: {}, expense: {} };
        }
        if (!GameState.yearLedger[kind]) GameState.yearLedger[kind] = {};
        GameState.yearLedger[kind][key] = (GameState.yearLedger[kind][key] || 0) + amount;
    } catch (e) {}
}

// ====== 结算前快照（yearEndSettlement 开头挂点调用）======
function snapshotYearEnd() {
    try {
        if (!GameState.factionsYearStart) {
            GameState.factionsYearStart = deepCopy(GameState.factions);
        }
        if (GameState.stabilityLevelYearStart === undefined) {
            GameState.stabilityLevelYearStart = GameState.stabilityLevel;
        }
        GameState.stabilityYearStart = GameState.stabilityYearStart === undefined
            ? GameState.stats.stability : GameState.stabilityYearStart;
    } catch (e) {}
}

// ====== 构建岁末大计报告（纯读取，不改数值）======
function buildYearEndReport() {
    const report = {
        era: GameState.script ? GameState.script.era : '',
        year: GameState.currentYear + 1,
        ledger: { income: {}, expense: {} },
        factions: [],
        stability: { before: null, after: null, levelBefore: null, levelAfter: null, reasons: [] },
        chronicle: [],
        criticals: []
    };
    try {
        // 一、账本（岁入岁出）
        report.ledger = deepCopy(GameState.yearLedger || { income: {}, expense: {} });

        // 二、五府消长（年初 vs 现在）
        const startY = GameState.factionsYearStart || {};
        for (const key of Object.keys(FACTIONS)) {
            const f = FACTIONS[key];
            const before = (typeof startY[key] === 'number') ? startY[key] : (GameState.factions[key] || 0);
            const after = GameState.factions[key] || 0;
            report.factions.push({
                key, name: f.name, org: f.org,
                before: Math.round(before), after: Math.round(after),
                delta: Math.round(after - before),
                min: f.min,
                mood: getFactionMood(Math.round(after))
            });
        }

        // 三、社稷安危（稳定度）
        report.stability.before = (typeof GameState.stabilityYearStart === 'number')
            ? GameState.stabilityYearStart : GameState.stats.stability;
        report.stability.after = GameState.stats.stability;
        report.stability.levelBefore = (GameState.stabilityLevelYearStart !== undefined)
            ? STABILITY_LEVELS[GameState.stabilityLevelYearStart] : null;
        report.stability.levelAfter = STABILITY_LEVELS[GameState.stabilityLevel] || STABILITY_LEVELS[2];
        // 原因：本年要闻中的警讯（不虚构，只摘实录）
        const yn = GameState.yearNews || [];
        report.criticals = yn.filter(n => n.type === 'critical').slice(0, 6);

        // 四、岁内大事记（从事件历史按年份筛取，从旧到新）
        const hist = (GameState.history || []).filter(h => h.year === GameState.currentYear);
        report.chronicle = hist.slice().reverse();

        // 五、史官总评
        report.verdict = generateYearEndVerdict();
    } catch (e) {}
    return report;
}

// ====== 史官总评（引 HISTORIAN_FRAGMENTS 组合，自撰句注明演绎）======
function generateYearEndVerdict() {
    const parts = [];
    try {
        const s = GameState.stats;
        const f = GameState.factions;
        // 国库
        if (s.treasury < -5000) parts.push(HISTORIAN_FRAGMENTS.treasury_debt);
        else if (s.treasury < 0) parts.push(HISTORIAN_FRAGMENTS.treasury_drain);
        else if (s.treasury > 15000) parts.push(HISTORIAN_FRAGMENTS.treasury_full);
        else parts.push(HISTORIAN_FRAGMENTS.treasury_mid);
        // 朝局
        if (f.eunuch > 80) parts.push(HISTORIAN_FRAGMENTS.eunuch_dominant);
        else if (f.consort > 80) parts.push(HISTORIAN_FRAGMENTS.consort_dominant);
        else if (f.royal > 70) parts.push(HISTORIAN_FRAGMENTS.prince_dominant);
        else if (f.civil > 75 && f.eunuch > 75) parts.push(HISTORIAN_FRAGMENTS.party_struggle);
        // 吏治
        if (s.corruption > 60) parts.push(HISTORIAN_FRAGMENTS.corruption);
        else if (s.corruption < 25) parts.push(HISTORIAN_FRAGMENTS.clean);
        // 边情
        if (s.militaryPower > 9000) parts.push(HISTORIAN_FRAGMENTS.army_strong);
        else if (s.militaryPower < 4000) parts.push(HISTORIAN_FRAGMENTS.army_weak);
        // 民生
        if (s.stability < 25) parts.push(HISTORIAN_FRAGMENTS.famine);
        else if (s.stability > 65) parts.push(HISTORIAN_FRAGMENTS.pop_growth);

        // 殿语（自撰文言，演绎）
        const lvl = GameState.stabilityLevel;
        let coda;
        if (lvl === 0) coda = '《书》曰：鉴于先王。愿陛下夙兴夜寐，以图中兴。';
        else if (lvl === 1) coda = '治国如朽索驭马，其可慎乎。';
        else if (lvl === 2) coda = '政贵有恒，来岁其勉之。';
        else if (lvl === 3) coda = '《明史·选举志》载考察八目：贪、酷、浮躁、不及、老、病、罢、不谨。吏治当先自察。';
        else if (lvl === 4) coda = '社稷之危，累于卵焉。陛下当罪己以收人心。';
        else coda = '国步维艰，宗庙存亡，悬于陛下一念。';

        // 开头（引《明史·选举志三》：岁计之制）
        return '史官曰：《明史·选举志》载「州县以月计，上之府，府上下其考，以岁计，上之布政司」，岁终大计，国之常典也。'
            + '是岁，' + parts.join('') + coda;
    } catch (e) {
        return '史官曰：是岁之事，具于起居注。';
    }
}

// ====== 打开岁末大计面板（yearEndSettlement 末尾挂点调用）======
function openYearEndReport() {
    try {
        YE_STATE.step = 0;
        YE_STATE.stamped = false;
        YE_STATE.report = buildYearEndReport();
        // 年初锚点滚动到下一年
        GameState.factionsYearStart = deepCopy(GameState.factions);
        GameState.stabilityLevelYearStart = GameState.stabilityLevel;
        GameState.stabilityYearStart = GameState.stats.stability;
        // 账本清零（已入报告）
        GameState.yearLedger = { income: {}, expense: {} };
        GameState.yearNews = [];
        // 悬存标记：面板关闭后可从"岁"页重阅
        GameState.yearEndPending = true;
        renderYearEndStep();
        const modal = document.getElementById('yearend-modal');
        if (modal) modal.classList.add('active');
        DamingSFX.play('step');
    } catch (e) {}
}

// ====== 关闭面板（可随时暂离）======
function closeYearEndReport() {
    try {
        const modal = document.getElementById('yearend-modal');
        if (modal) modal.classList.remove('active');
        if (GameState.yearEndPending && YE_STATE.step < YE_STEPS.length) {
            pushNews('岁末', '岁末大计暂置一旁，可于「朝廷六部·岁」重阅。', 'normal');
        } else {
            GameState.yearEndPending = false;
        }
        DamingSFX.play('click');
    } catch (e) {}
}

// ====== 渲染当前步 ======
function renderYearEndStep() {
    try {
        const modal = document.getElementById('yearend-modal');
        const paper = modal ? modal.querySelector('.yearend-paper') : null;
        const eraEl = document.getElementById('ye-era');
        const stepsBar = document.getElementById('ye-steps-bar');
        const body = document.getElementById('ye-body');
        const footer = document.getElementById('ye-footer');
        if (!modal || !body || !footer) return;

        const r = YE_STATE.report || buildYearEndReport();
        if (eraEl) eraEl.textContent = `${r.era} · 第${r.year}年 · 岁末大计`;

        // 步骤条
        if (stepsBar) {
            stepsBar.innerHTML = YE_STEPS.map((s, i) => {
                const cls = i < YE_STATE.step ? 'done' : (i === YE_STATE.step ? 'now' : '');
                return `<div class="ye-step-dot ${cls}">${s.name}</div>`;
            }).join('');
        }

        const stepKey = YE_STEPS[YE_STATE.step].key;
        if (stepKey === 'ledger') renderYeLedger(body, footer, r);
        else if (stepKey === 'factions') renderYeFactions(body, footer, r);
        else if (stepKey === 'stability') renderYeStability(body, footer, r);
        else if (stepKey === 'chronicle') renderYeChronicle(body, footer, r);
        else renderYeVerdict(body, footer, r);
    } catch (e) {}
}

// 渲染通用页脚：继续按钮
function renderYeFooterContinue(footer, last) {
    footer.innerHTML = last
        ? `<button class="ye-btn ye-btn-seal" id="ye-next-btn">提笔总评 →</button>`
        : `<button class="ye-btn" id="ye-next-btn">继续 →</button>`;
    const btn = (document.getElementById('ye-next-btn')||{textContent:'',onclick:null,classList:{add:()=>{},remove:()=>{},contains:()=>false},style:{}});
    if (btn) {
        btn.onclick = () => {
            try {
                YE_STATE.step++;
                DamingSFX.play('step');
                renderYearEndStep();
            } catch (e) {}
        };
    }
}

// —— 第一步：岁入岁出分项账单（数字滚动动画）——
// 《明史·食货志二》："即位之初，定赋役法，一以黄册为准。"
// 《明史·食货志六》："岁入之数……太仓银库……百官禄米折银二万六千馀两。"（岁入之制，据实为引）
const YE_LEDGER_NAMES = {
    food:          { name: '田赋收入', unit: '石' },
    treasury:      { name: '税银折色', unit: '两' },
    population:    { name: '增丁附籍', unit: '丁' },
    militaryPower: { name: '军伍补员', unit: '员' },
    prestige:      { name: '威望所归', unit: '望' },
    mandate:       { name: '天命眷顾', unit: '命' },
    salary:        { name: '百官俸禄', unit: '两' },
    military:      { name: '边军饷银', unit: '两' },
    faction:       { name: '部院维持', unit: '两' }
};

function renderYeLedger(body, footer, r) {
    // 批1：第一步岁入岁出账单金币声
    try { DamingSFX.play('coin'); } catch (e) {}
    const inc = r.ledger.income || {};
    const exp = r.ledger.expense || {};
    const incRows = Object.keys(inc).map(k => {
        const meta = YE_LEDGER_NAMES[k] || { name: k, unit: '' };
        return `<div class="ye-row">
            <span class="ye-row-name">${meta.name}</span>
            <span class="ye-row-val ye-inc" data-ye-anim="${inc[k]}" data-ye-unit="${meta.unit}">0${meta.unit}</span>
        </div>`;
    }).join('') || '<div class="ye-row"><span class="ye-row-name">是岁无入项</span></div>';
    const expRows = Object.keys(exp).map(k => {
        const meta = YE_LEDGER_NAMES[k] || { name: k, unit: '' };
        return `<div class="ye-row">
            <span class="ye-row-name">${meta.name}</span>
            <span class="ye-row-val ye-exp" data-ye-anim="${exp[k]}" data-ye-unit="${meta.unit}">0${meta.unit}</span>
        </div>`;
    }).join('') || '<div class="ye-row"><span class="ye-row-name">是岁无出项</span></div>';

    const incTotal = (inc.treasury || 0);
    const expTotal = (exp.salary || 0) + (exp.military || 0) + (exp.faction || 0);

    body.innerHTML = `
        <div class="ye-quote">《明史·食货志》：即位之初，定赋役法，一以黄册为准。</div>
        <div class="ye-section-title">岁入</div>
        <div class="ye-rows">${incRows}</div>
        <div class="ye-section-title">岁出</div>
        <div class="ye-rows">${expRows}</div>
        <div class="ye-sumline">度支总计：税银入 ${(incTotal).toFixed(0)} 两 / 俸饷杂出 ${expTotal} 两
            ${incTotal - expTotal >= 0 ? '——账面尚可支撑' : '——入不敷出，户部忧之'}</div>
        <div class="ye-note">（按：游戏岁计由四季结算累计而来，兵农诸政皆系于此。演绎之处，体例从简。）</div>
    `;
    animateYeNumbers(body);
    renderYeFooterContinue(footer, false);
}

// —— 第二步：五派系年度变动 ——
function renderYeFactions(body, footer, r) {
    const rows = r.factions.map(f => {
        const cls = f.delta > 0 ? 'ye-inc' : (f.delta < 0 ? 'ye-exp' : '');
        const sign = f.delta > 0 ? '+' : '';
        // 上下限距离：下限 min（过弱生变），80 以上过强（见 FACTIONS.overreach）
        const lowGap = Math.max(0, f.after - f.min);
        const highGap = Math.max(0, 80 - f.after);
        const warn = f.after <= f.min + 5 ? `<span class="ye-warn">濒${f.min}线，${FACTIONS[f.key].hostility.split('：')[0]}之虞</span>`
            : (f.after >= 75 ? `<span class="ye-warn">气焰近炽，${FACTIONS[f.key].overreach.split('，')[0]}之象</span>` : '');
        return `<div class="ye-row ye-faction-row">
            <div class="ye-faction-main">
                <span class="ye-row-name">${f.name}</span>
                <span class="ye-faction-org">${f.org}</span>
            </div>
            <div class="ye-faction-num">
                <span class="ye-faction-before">${f.before}</span>
                <span class="ye-arrow">→</span>
                <span class="ye-faction-after">${f.after}</span>
                <span class="ye-faction-delta ${cls}">${sign}${f.delta}</span>
            </div>
            <div class="ye-faction-gap">距${f.min}危线 ${lowGap} · 距80恣线 ${highGap} · 态势「${f.mood}」 ${warn}</div>
        </div>`;
    }).join('');
    body.innerHTML = `
        <div class="ye-quote">朝堂五府，如五行相生相制。一家独炽，则余者侧目。</div>
        <div class="ye-rows">${rows}</div>
        <div class="ye-note">（按：五府过弱则其乱生于所怨，过强则其患起于所恃。演绎。）</div>
    `;
    renderYeFooterContinue(footer, false);
}

// —— 第三步：稳定度结算（六级变化+原因）——
function renderYeStability(body, footer, r) {
    const st = r.stability;
    const delta = Math.round(st.after - st.before);
    const sign = delta > 0 ? '+' : '';
    const lvlName = st.levelAfter ? st.levelAfter.name : '';
    const reasons = r.criticals.length
        ? r.criticals.map(c => `<div class="ye-reason-row"><span class="ye-reason-time">${c.time}</span>${c.text}</div>`).join('')
        : '<div class="ye-reason-row">是岁无重大变故闻于朝。</div>';
    body.innerHTML = `
        <div class="ye-quote">《明史·选举志》：州县以月计，上之府，府上下其考，以岁计，上之布政司。</div>
        <div class="ye-stability-box">
            <div class="ye-stability-main">
                <span class="ye-stability-before">${st.before}</span>
                <span class="ye-arrow">→</span>
                <span class="ye-stability-after">${st.after}</span>
                <span class="ye-faction-delta ${delta >= 0 ? 'ye-inc' : 'ye-exp'}">${sign}${delta}</span>
            </div>
            <div class="ye-stability-level">今岁社稷：${lvlName}（六等之第）</div>
        </div>
        <div class="ye-section-title">变故实录（要闻摘录）</div>
        <div class="ye-reasons">${reasons}</div>
    `;
    renderYeFooterContinue(footer, false);
}

// —— 第四步：年度大事记 ——
function renderYeChronicle(body, footer, r) {
    const items = r.chronicle.length
        ? r.chronicle.map(h => `<div class="ye-chronicle-item">
            <div class="ye-chronicle-time">${h.season}·${h.month}月</div>
            <div class="ye-chronicle-body">
                <div class="ye-chronicle-title">${h.title}</div>
                <div class="ye-chronicle-decision">上曰：${h.decision}</div>
            </div>
        </div>`).join('')
        : '<div class="ye-chronicle-item">是岁四海无事，起居注寥寥。</div>';
    body.innerHTML = `
        <div class="ye-quote">《明史·艺文》不载起居注，然君之举无细而不录。（演绎）</div>
        <div class="ye-chronicle-list">${items}</div>
    `;
    renderYeFooterContinue(footer, false);
}

// —— 第五步：史官总评 + 玉玺钦此盖章 ——
function renderYeVerdict(body, footer, r) {
    body.innerHTML = `
        <div class="ye-verdict-box">
            <div class="ye-verdict-title">史官总评</div>
            <div class="ye-verdict-text">${r.verdict}</div>
        </div>
        <div class="ye-seal-stage" id="ye-seal-stage">
            <div class="ye-seal-hint" id="ye-seal-hint">岁末大计已览毕。请陛下用宝。</div>
        </div>
    `;
    footer.innerHTML = `<button class="ye-btn ye-btn-seal" id="ye-seal-btn">用宝 · 钦此</button>`;
    const btn = (document.getElementById('ye-seal-btn')||{textContent:'',onclick:null,classList:{add:()=>{},remove:()=>{},contains:()=>false},style:{}});
    if (btn) {
        btn.onclick = () => { try { stampYearEndSeal(btn); } catch (e) {} };
    }
}

// 盖章动画：印落 + 红印 + 震动 + 音效
function stampYearEndSeal(btn) {
    try {
        if (YE_STATE.stamped) return;
        YE_STATE.stamped = true;
        if (btn) btn.style.display = 'none';
        DamingSFX.play('seal');
        const stage = (document.getElementById('ye-seal-stage')||{textContent:'',onclick:null,classList:{add:()=>{},remove:()=>{},contains:()=>false},style:{}});
        const paper = document.querySelector('#yearend-modal .yearend-paper');
        if (stage) {
            stage.innerHTML = `
                <div class="ye-seal-stamp" id="ye-seal-stamp">钦此</div>
                <div class="ye-seal-info">「钦此之宝」· 朱文方印（演绎）</div>
            `;
        }
        if (paper) {
            paper.classList.add('ye-shake');
            setTimeout(() => { try { paper.classList.remove('ye-shake'); } catch (e) {} }, 500);
        }
        // 落定后给关闭按钮
        setTimeout(() => {
            try {
                GameState.yearEndPending = false;
                const footer = document.getElementById('ye-footer');
                if (footer) {
                    footer.innerHTML = `<button class="ye-btn" id="ye-done-btn">岁计已毕 · 返回朝政</button>`;
                    const done = (document.getElementById('ye-done-btn')||{textContent:'',onclick:null,classList:{add:()=>{},remove:()=>{},contains:()=>false},style:{}});
                    if (done) done.onclick = () => { try { closeYearEndReport(); } catch (e) {} };
                }
            } catch (e) {}
        }, 700);
    } catch (e) {}
}

// ====== 数字滚动动画（无 rAF 环境直接显示终值，不阻断）======
function animateYeNumbers(scope) {
    try {
        const els = scope.querySelectorAll('[data-ye-anim]');
        els.forEach(el => {
            const target = parseFloat(el.dataset.yeAnim) || 0;
            const unit = el.dataset.yeUnit || '';
            if (typeof requestAnimationFrame !== 'function') {
                el.textContent = target + unit;
                return;
            }
            const dur = 900;
            const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const tick = (t) => {
                try {
                    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    const p = Math.min(1, (now - t0) / dur);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(target * eased) + unit;
                    if (p < 1) requestAnimationFrame(tick);
                } catch (e) {}
            };
            requestAnimationFrame(tick);
        });
    } catch (e) {}
}

// ====== 「朝廷六部·岁」摘要页（重阅入口）======
function renderYearendTab() {
    try {
        const pending = GameState.yearEndPending && YE_STATE.report;
        if (pending) {
            const r = YE_STATE.report;
            return `
                <div class="ye-tab-card">
                    <div class="ye-tab-title">岁末大计 · 待阅</div>
                    <div class="ye-tab-sub">${r.era} 第${r.year}年，岁计五事未览毕。</div>
                    <div class="ye-tab-quote">《明史·选举志》：考满、考察，二者相辅而行。</div>
                    <button class="ye-btn" id="ye-reopen-btn">重阅岁末大计</button>
                </div>
            `;
        }
        return `
            <div class="ye-tab-card">
                <div class="ye-tab-title">岁终大计</div>
                <div class="ye-tab-quote">《明史·选举志》载：「州县以月计，上之府，府上下其考，以岁计，上之布政司。」</div>
                <div class="ye-tab-sub">每岁末，户部会计岁入岁出，吏部稽考五府消长，史官具载岁内大事，而陛下用宝为凭。</div>
                <div class="ye-tab-sub">此刻非岁末，尚无计可阅。</div>
            </div>
        `;
    } catch (e) {
        return '<div class="ye-tab-card">岁计之制，暂不可考。</div>';
    }
}

// 岁末相关点击事件委托（重阅按钮）
function initYearendDelegates() {
    try {
        document.addEventListener('click', (e) => {
            try {
                if (!e.target || !e.target.closest) return;
                if (e.target.closest('#ye-reopen-btn')) {
                    YE_STATE.step = 0;
                    YE_STATE.stamped = false;
                    GameState.yearEndPending = true;
                    renderYearEndStep();
                    const modal = document.getElementById('yearend-modal');
                    if (modal) modal.classList.add('active');
                    DamingSFX.play('step');
                }
                if (e.target.closest('#ye-close-btn')) {
                    closeYearEndReport();
                }
            } catch (err) {}
        });
    } catch (e) {}
}

console.log('✓ 岁末大计（批1模块C）装载完毕');
