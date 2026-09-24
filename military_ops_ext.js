// ============================================
// 《大明国策》批5 · 军事操练纵深
// 练兵 / 募新军 / 三大营整饬 / 火器研造
// 史据：《明史》兵志一(戎政)、兵志三(营制)、兵志四(火器)
// ============================================

function initMilOpsState() {
    return {
        // 各营伍军力等级：京营/边军/水师
        camps: { jing: 1, bian: 1, shui: 1 },
        // 练兵累积（防过度）
        drill: { jing: 0, bian: 0, shui: 0 },
        // 兵变风险(0-100)
        mutinyRisk: 0,
        // 募新军规模（过度致财政透支+治安）
        recruits: 0,
        // 三大营整饬状态：shenji/sanqian/shensu 0未整 1整饬成 2虚耗
        ying: { shenji: 0, sanqian: 0, shensu: 0 },
        // 挂帅校尉（需名将）
        marshal: null,
        // 火器研造等级：0无 1鸟铳 2佛郎机 3红衣大炮
        firearms: 0,
        // 研究院（营造线）层数
        institute: 0,
        // 军力加成（影响辽东出征胜率演算）
        powerBonus: 0,
        // 每季操练进度（反爽游冷却）
        opsUsed: 0,
        lastMarshalFailTick: 0
    };
}

function _mil() { return GameState.milOps; }

function milPowerBase() { return (GameState.stats && GameState.stats.military) || 0; }

// 综合军力评分（供 render 展示）
function milTotalScore() {
    try {
        const m = _mil(); let s = 0;
        s += (m.camps.jing + m.camps.bian + m.camps.shui) * 8;
        s += m.powerBonus;
        s += m.firearms * 10;
        s += (m.ying.shenji + m.ying.sanqian + m.ying.shensu) * 6;
        return s;
    } catch (e) { return 0; }
}

// 生效于 expedition.js 的军力评分加成（挂全局，批3联动）
function milOpsPowerMod() {
    try { return (milTotalScore() || 0); } catch (e) { return 0; }
}

// ---- 各操作 ----

function milDrill(camp, cost) {
    try {
        const m = _mil(); const t = GameState.stats.treasury;
        if (t < cost) { pushNews('兵部', '府库不足，无法操练！', 'danger'); return; }
        GameState.stats.treasury -= cost;
        m.drill[camp] += 1;
        // 每3次操练提升1级军力
        if (m.drill[camp] >= 3) { m.drill[camp] = 0; m.camps[camp] += 1; m.powerBonus += 4; }
        // 过度练兵→兵变风险
        m.mutinyRisk += 6;
        if (m.mutinyRisk > 100) m.mutinyRisk = 100;
        pushNews('兵部', `${campName(camp)}操练一番，军士渐整。兵变隐患+6`, 'normal');
        renderScreen();
    } catch (e) {}
}

function milRecruit(cost) {
    try {
        const m = _mil(); const t = GameState.stats.treasury;
        if (t < cost) { pushNews('兵部', '府库不足，无法募新军！', 'danger'); return; }
        GameState.stats.treasury -= cost;
        m.recruits += 1;
        m.powerBonus += 3;
        // 募过多→财政透支
        if (m.recruits >= 4) { GameState.stats.stability = Math.max(0, GameState.stats.stability - 2); pushNews('户部', '募军过滥，饷縻浮费，民力渐疲！', 'danger'); }
        pushNews('兵部', `募得新军${m.recruits}营，军势为之一振。`, 'normal');
        renderScreen();
    } catch (e) {}
}

function milMarshal(name) {
    try {
        const m = _mil(); if (!name) return;
        m.marshal = name; m.lastMarshalFailTick = 0;
        pushNews('兵部', `${name}挂帅，节制三大营。`, 'normal');
        renderScreen();
    } catch (e) {}
}

// 三大营整饬：shenji神机/三千/sanqian/神枢shensu
function milZhengdun(which) {
    try {
        const m = _mil();
        if (m.ying[which] === 2) { pushNews('兵部', '此营虚耗已甚，且整饬再作后图。', 'danger'); return; }
        if (!m.marshal) { pushNews('兵部', '须有名将挂帅，方可整饬营伍！', 'danger'); return; }
        if (GameState.stats.treasury < 6) { pushNews('兵部', '府库不足！', 'danger'); return; }
        GameState.stats.treasury -= 6;
        // 成败判定：有元帅则多成，否则虚耗
        const fail = Math.random() < 0.25;
        if (fail) { m.ying[which] = 2; pushNews('兵部', `${yingName(which)}整饬无功，反致营伍虚耗！`, 'danger'); }
        else { m.ying[which] = 1; m.powerBonus += 5; pushNews('兵部', `${yingName(which)}因${m.marshal}整饬一新，尽显精甲。`, 'normal'); }
        renderScreen();
    } catch (e) {}
}

function milResearchFirearms() {
    try {
        const m = _mil();
        const cur = m.firearms;
        const req = cur + 1 <= 3;
        if (!req) { pushNews('工部', '火器已臻极致。', 'normal'); return; }
        const cost = [0, 4, 9, 16][cur + 1];
        if (GameState.stats.treasury < cost) { pushNews('工部', '府库不足！', 'danger'); return; }
        if (m.institute < cur) { pushNews('工部', '神机营需研究院支撑方可研此！', 'danger'); return; }
        GameState.stats.treasury -= cost;
        m.firearms += 1;
        m.powerBonus += 6;
        pushNews('工部', `火器研造成功：${firearmName(m.firearms)}！`, 'normal');
        renderScreen();
    } catch (e) {}
}

// 研究院升阶（营造线协同）
function milUpInstitute() {
    try {
        const m = _mil(); const t = GameState.stats.treasury;
        if (t < 6) { pushNews('工部', '府库不足！', 'danger'); return; }
        if (m.institute < m.firearms) { pushNews('工部', '研究院不可超前火器。', 'normal'); return; }
        GameState.stats.treasury -= 6;
        m.institute += 1;
        pushNews('工部', `研究院升至${m.institute}层，火器之利可恃。`, 'normal');
        renderScreen();
    } catch (e) {}
}

// 兵变巡检（每季）
function milMutinyTick() {
    try {
        const m = GameState.milOps; if (!m) return;
        if (m.mutinyRisk > 0) m.mutinyRisk -= 3;
        // 兵变触发
        if (m.mutinyRisk >= 100 && Math.random() < 0.5) {
            m.mutinyRisk = 40;
            GameState.stats.treasury = Math.max(0, GameState.stats.treasury - 12);
            GameState.stats.stability = Math.max(0, GameState.stats.stability - 3);
            m.powerBonus = Math.max(0, m.powerBonus - 8);
            pushNews('肘腋之变', '骄兵作乱，焚掠府库！军心涣散！', 'critical');
        }
        if (m.mutinyRisk > 0) m.mutinyRisk -= 2;
        if (m.mutinyRisk < 0) m.mutinyRisk = 0;
    } catch (e) {}
}

function campName(k) { return { jing: '京营', bian: '边军', shui: '水师' }[k] || k; }
function yingName(k) { return { shenji: '神机营', sanqian: '三千营', shensu: '神枢营' }[k] || k; }
function firearmName(f) { return ['无', '鸟铳', '佛郎机', '红衣大炮'][f] || '无'; }

// render（挂到 military tab 尾部）
function renderMilitaryOpsExt() {
    try {
        const m = _mil();
        if (!m) return '';
        const camps = ['jing', 'bian', 'shui'].map(k =>
            `<span class="mil-camp">${campName(k)} 军力Lv${m.camps[k]} <button class="btn" onclick="milDrill('${k}',3)">操练(库-3)</button></span>`
        ).join(' ');
        const marshalOpts = ['李成梁', '戚继光', '俞大猷', '谭纶', '李如松']
            .map(n => `<button class="btn" onclick="milMarshal('${n}')">${n}</button>`).join(' ');
        const ying = ['shenji', 'sanqian', 'shensu'].map(k =>
            `${yingName(k)}:${['未整', '整饬成', '虚耗'][m.ying[k]]} <button class="btn" onclick="milZhengdun('${k}')">整饬(库-6)</button>`
        ).join(' ');
        return `<div class="report-card"><div class="report-title">🏇 军事操练</div>
            <div class="report-text">综合军力评分：<b>${milTotalScore()}</b>（影响辽东出征胜率演算）+ 兵变隐患：${m.mutinyRisk}</div>
            <div class="report-text">☛ 练兵·营伍：${camps}</div>
            <div class="report-text">☛ 募新军：已募<b>${m.recruits}</b>营　<button class="btn" onclick="milRecruit(8)">募新军(库-8)</button>（募过4营则透支）</div>
            <div class="report-text">☛ 挂帅名将：${marshalOpts}</div>
            <div class="report-text">☛ 三大营整饬：${ying}</div>
            <div class="report-text">☛ 火器研造：当前<b>${firearmName(m.firearms)}</b> 研究院${m.institute}层
                <button class="btn" onclick="milUpInstitute()">建研究院(库-6)</button>
                <button class="btn" onclick="milResearchFirearms()">研火器(库+逐级)</button></div>
            <div class="report-text"><i>《明史·兵志四》：红夷大炮、"其制自洪武..."；镇戍营制，《兵志一》。设定与演绎各半。</i></div>
        </div>`;
    } catch (e) { return ''; }
}

console.log('✓ 批5·军事操练加载完成');