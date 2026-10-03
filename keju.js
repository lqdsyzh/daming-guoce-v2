// ============================================
// 《大明国策》批4 模块D：科举系统
// 每3章开科 → 选考官 → 选科目 → 看录取 → 新官入朝
// 科举舞弊选项（贿考官→忠臣弹劾风险）
// 史据：《明史》卷70·选举志二
// 反爽铁律：开科有国库代价，舞弊有风险
// ============================================

const KEJU_INTERVAL = 3;     // 每3章开科
const KEJU_COST = 500;       // 国库开销
const KEJU_CANDIDATES = 30;  // 应试人数
const KEJU_PASS_BASE = 0.25; // 基础通过率

const KEJU_SUBJECTS = [
    { key: 'jingyi', name: '经义', desc: '四书五经义理', cultureWeight: 1.2, src: '《明史》卷70·选举志：专取四子书及易书诗春秋礼记' },
    { key: 'celun', name: '策论', desc: '时务策论', cultureWeight: 1.0, src: '《明史》卷70·选举志：兼试策论' },
    { key: 'shifu', name: '诗赋', desc: '诗赋才学', cultureWeight: 0.8, src: '演绎（明代科举以经义为主，诗赋为辅）' }
];

function initKejuState() {
    return { lastHeld: -99, passCount: 0, cheatCount: 0, newOfficials: [] };
}

// ====== 开科入口 ======
function openKejuSession() {
    try {
        if (!GameState.kejuState) GameState.kejuState = initKejuState();
        const tick = getMapTick();
        if (tick - GameState.kejuState.lastHeld < KEJU_INTERVAL) {
            pushNews('科举', `科场方毕，须再候 ${KEJU_INTERVAL - (tick - GameState.kejuState.lastHeld)} 章。`, 'normal');
            return;
        }
        if (GameState.stats.treasury < KEJU_COST) {
            pushNews('科举', '国库不充，无从开科。', 'critical');
            return;
        }
        GameState.kejuState.lastHeld = tick;
        renderKejuModal();
        document.getElementById('keju-modal').classList.add('active');
        try { DamingSFX.play('step'); } catch (e) {}
    } catch (e) {}
}

function closeKejuModal() {
    try { document.getElementById('keju-modal').classList.remove('active'); } catch (e) {}
}

// ====== 渲染科举浮层 ======
function renderKejuModal() {
    try {
        const body = document.getElementById('keju-body');
        if (!body) return;
        // 考官选择（从文官中选清廉度高的）
        const civilMinisters = (GameState.ministers && GameState.ministers.civil) || [];
        const examiners = civilMinisters.filter(m => !m.jailed && !m.dead && (m.integrity || 50) >= 50);
        const examinerOpts = examiners.map((m, i) =>
            `<button class="cw-btn" onclick="kejuPickExaminer(${i})">${m.name}（清 ${(m.integrity || 50)}，能 ${(m.ability || 50)}）</button>`
        ).join('');
        body.innerHTML = `
            <div class="keju-banner">「科举者，天下之大公也」——《明史》卷70·选举志</div>
            <h4 class="keju-sec">一、选考官（清正者公平，贪鄙者可贿）</h4>
            <div class="keju-examiners">${examinerOpts || '<span>朝中文官不足，无考官可任。</span>'}</div>
            <div id="keju-step2"></div>`;
        window._kejuSel = { examiner: null, subject: null };
    } catch (e) {}
}

function kejuPickExaminer(idx) {
    try {
        const civilMinisters = (GameState.ministers && GameState.ministers.civil) || [];
        const examiners = civilMinisters.filter(m => !m.jailed && !m.dead && (m.integrity || 50) >= 50);
        if (idx >= examiners.length) return;
        window._kejuSel.examiner = examiners[idx];
        const step2 = document.getElementById('keju-step2');
        if (!step2) return;
        const subjectBtns = KEJU_SUBJECTS.map(s =>
            `<button class="cw-btn" onclick="kejuPickSubject('${s.key}')">${s.name}（${s.desc}）</button>`
        ).join('');
        step2.innerHTML = `
            <h4 class="keju-sec">二、选科目</h4>
            <div class="keju-subjects">${subjectBtns}</div>
            <div id="keju-step3"></div>`;
    } catch (e) {}
}

function kejuPickSubject(key) {
    try {
        const subj = KEJU_SUBJECTS.find(s => s.key === key);
        if (!subj) return;
        window._kejuSel.subject = subj;
        const step3 = document.getElementById('keju-step3');
        if (!step3) return;
        const sel = window._kejuSel;
        const canCheat = sel.examiner && (sel.examiner.integrity || 50) < 70;
        step3.innerHTML = `
            <h4 class="keju-sec">三、开科取士</h4>
            <div>考官：${sel.examiner ? sel.examiner.name : '—'} · 科目：${subj.name}</div>
            <div class="keju-cost">国库 -${KEJU_COST}两 · 应试 ${KEJU_CANDIDATES}人</div>
            <div class="keju-btns">
                <button class="cw-btn cw-btn-danger" onclick="kejuExecute(false)">正道开科</button>
                ${canCheat ? '<button class="cw-btn cw-btn-warn" onclick="kejuExecute(true)">贿考官舞弊（风险！）</button>' : ''}
            </div>`;
    } catch (e) {}
}

// ====== 执行科举 ======
function kejuExecute(cheat) {
    try {
        const sel = window._kejuSel;
        if (!sel || !sel.examiner || !sel.subject) return;
        if (GameState.stats.treasury < KEJU_COST) {
            pushNews('科举', '国库不足，开科中止。', 'critical'); return;
        }
        GameState.stats.treasury -= KEJU_COST;
        // 通过率：基础 × 文化加权 × 考官能力
        let passRate = KEJU_PASS_BASE * sel.subject.cultureWeight;
        passRate *= (sel.examiner.ability || 50) / 70;
        passRate = Math.min(0.6, Math.max(0.05, passRate));
        // 舞弊：通过率+0.15但忠臣弹劾概率
        if (cheat) {
            passRate += 0.15;
            GameState.kejuState.cheatCount = (GameState.kejuState.cheatCount || 0) + 1;
            if (Math.random() < 0.4) {
                GameState.factions.civil = Math.max(0, GameState.factions.civil - 3);
                GameState.stats.stability = Math.max(0, GameState.stats.stability - 2);
                pushNews('科举', '科场舞弊事发！忠臣弹劾，文官 -3，稳定 -2。', 'critical');
                try { DamingSFX.play('urgent'); } catch (e) {}
            }
        }
        const passed = Math.round(KEJU_CANDIDATES * passRate * (1 + Math.random() * 0.3));
        GameState.kejuState.passCount = (GameState.kejuState.passCount || 0) + passed;
        // 新官入朝：补充空位
        const names = ['陈进士','李进士','王进士','张进士','刘进士','赵进士','周进士','吴进士','郑进士','孙进士'];
        let filled = 0;
        for (let i = 0; i < passed && i < 5; i++) {
            // 找空位（被清洗/殁者）
            for (const cat of Object.keys(GameState.ministers)) {
                const emptyIdx = GameState.ministers[cat].findIndex(m => m.dead || m.jailed);
                if (emptyIdx >= 0) {
                    GameState.ministers[cat][emptyIdx] = {
                        name: names[i % names.length] + (i + 1),
                        rank: '新科进士', loyalty: 60 + Math.floor(Math.random() * 20),
                        ability: 50 + Math.floor(Math.random() * 30), integrity: 60 + Math.floor(Math.random() * 30),
                        ambition: 30 + Math.floor(Math.random() * 30), faction: 40, nepotism: 20,
                        opinion: '新进', desc: '科举出身'
                    };
                    filled++;
                    break;
                }
            }
        }
        GameState.kejuState.newOfficials = GameState.kejuState.newOfficials || [];
        GameState.kejuState.newOfficials.push({ tick: getMapTick(), passed: passed, filled: filled, subject: sel.subject.name });
        pushNews('科举', `开科取士：${sel.subject.name}科，录 ${passed} 人，入朝 ${filled} 人（${sel.subject.src}）`, 'normal');
        try { DamingSFX.play('decide'); } catch (e) {}
        closeKejuModal();
        updateUI();
    } catch (e) {}
}
