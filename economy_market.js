// ============================================
// 《大明国策》v5.0 批A · 经济系统深改
// A1 物价波动 / A2 贪腐侵蚀链 / A3 市面萧条·国势冷暖
// 依据《明史·食货志》：常平/开中/市舶/盐铁/农桑谷价
// 纯前端零依赖；全部新逻辑 try-catch 守卫；永不破坏 edict 永久DOM
// ============================================

// 六类物价基准（价 = 基准 × 系数 v，v 随季节/灾荒/战争/政策/贪腐滚动）
const ECON_COMMODITIES = {
    grain:  { name: '粮', base: 1.0  },
    salt:   { name: '盐', base: 2.0  },
    iron:   { name: '铁', base: 5.0  },
    horse:  { name: '马', base: 30.0 },
    silk:   { name: '绢', base: 5.0  },
    silver: { name: '白银购买力', base: 1.0 }
};

function _econ() { return GameState.econ; }

function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// 初始物价：随剧本经济/贪腐基准摆动（《食货志》义仓、开中、银折实物之兴替）
function initPriceLevels() {
    const s = GameState.stats || {};
    const ag = s.agriculture !== undefined ? s.agriculture : 50;
    const co = s.commerce   !== undefined ? s.commerce   : 40;
    const cr = s.corruption !== undefined ? s.corruption : 30;
    const st = s.stability  !== undefined ? s.stability  : 50;
    return {
        grain:  _clamp(1.18 - ag / 180 + cr / 320, 0.5, 2.4),
        salt:   _clamp(1.02 + st / 520 - co / 320, 0.5, 2.2),
        iron:   _clamp(1.05 + (52 - ag) / 420 + cr / 420, 0.5, 2.4),
        horse:  _clamp(1.05 - co / 320 + 0.06, 0.5, 2.4),
        silk:   _clamp(1.12 - co / 300, 0.5, 2.2),
        silver: _clamp(1.02 + cr / 420, 0.5, 2.2)
    };
}

function initEconomyState() {
    const v = initPriceLevels();
    return {
        prices: {
            grain:  { v: v.grain,  mom: 0 },
            salt:   { v: v.salt,   mom: 0 },
            iron:   { v: v.iron,   mom: 0 },
            horse:  { v: v.horse,  mom: 0 },
            silk:   { v: v.silk,   mom: 0 },
            silver: { v: v.silver, mom: 0 }
        },
        granary: 3000,     // 常平仓粮储（石）
        changping: 0,      // 常平操盘次数
        saltTally: 600,    // 可支盐引数（开中法兑边粮）
        kaizhong: 0,       // 开中次数
        shibo: 0,          // 市舶司：0闭 1开
        shiboRisk: 0,      // 通番积祸（倭寇）风险累计
        depressed: 0,      // 市面萧条 0-4
        prosperity: 50     // 景气指数 0-100
    };
}

// 每季巡检（advanceSeason挂链，try-catch防护）
function economyTick() {
    const e = _econ(); if (!e || !e.prices) return;
    const s = GameState.stats; if (!s) return;
    const season = GameState.currentSeason || 0;  // 0春 1夏 2秋 3冬
    // 灾荒（zaiyi pending 水/旱/蝗）→ 粮价暴涨、市面萧条
    let famine = 0;
    try {
        const z = GameState.zaiyi;
        if (z && Array.isArray(z.pending)) {
            famine = z.pending.filter(function(p){
                return p && ['旱','涝','蝗'].indexOf(p.key) >= 0;
            }).length;
        }
    } catch (err) {}
    // 战争/军事高压 → 军粮/铁/马贵
    const warFactor = _clamp((s.militaryPower - 4000) / 9000, 0, 1.2);
    // 市舶开 → 盐铁绢趋贱、商贸通
    const haigangOpen = e.shibo === 1;
    // 贪腐高 → 钱贱银贵、谷贵
    const cr = s.corruption || 0;

    // 各物季节性目标价
    const grainTarget = 1.0
        + (season === 0 ? -0.04 : season === 1 ? 0.00 : season === 2 ? -0.10 : 0.08)  // 春耕价平/秋获回落/冬价昂
        + famine * 0.45
        + warFactor * 0.25
        + cr * 0.002
        - (e.granary > 8000 ? 0.06 : 0);   // 常平粮足→平抑
    const saltTarget = 1.0 + cr * 0.0015 + (haigangOpen ? -0.15 : 0.05) - (e.saltTally > 800 ? 0.05 : 0);
    const ironTarget = 1.0 + warFactor * 0.4 + (haigangOpen ? -0.10 : 0.03);
    const horseTarget = 1.0 + warFactor * 0.5 - (GameState.policies && GameState.policies['马政'] === '民牧' ? 0.05 : 0);
    const silkTarget = 1.0 + (haigangOpen ? -0.18 : 0.06) - (s.commerce - 50) / 600;
    const silverTarget = 1.0 + cr * 0.0025 + (haigangOpen ? -0.08 : 0.02);  // 银价随银币流动

    _econSmooth(e.prices.grain,  grainTarget);
    _econSmooth(e.prices.salt,   saltTarget);
    _econSmooth(e.prices.iron,   ironTarget);
    _econSmooth(e.prices.horse,  horseTarget);
    _econSmooth(e.prices.silk,   silkTarget);
    _econSmooth(e.prices.silver, silverTarget);

    // 市面萧条评定（稳定度低/灾后/战乱/贪腐）
    let dep = 0;
    if (s.stability < 40) dep += 1.2;
    if (s.stability < 25) dep += 0.8;
    if (famine > 0) dep += 1;
    if (cr >= 45) dep += 1;
    if (GameState.mapData && GameState.mapData.redAlert) dep += 1;   // 舆图红警联动
    dep -= (s.commerce > 60 ? 0.6 : 0);
    e.depressed = _clamp(Math.round(dep), 0, 4);

    // 景气指数（物价/贪腐/稳定度/农业/商业加权）
    const priceSpread = Math.abs(e.prices.grain.v - 1) + Math.abs(e.prices.salt.v - 1);
    const prosperity = Math.round(_clamp(
          (s.agriculture || 0) * 0.20
        + (s.commerce || 0) * 0.20
        + (s.stability || 0) * 0.18
        + (100 - cr) * 0.22
        + (s.prestige - 50) * 0.06
        - e.depressed * 6
        + (priceSpread < 0.3 ? 4 : priceSpread > 0.9 ? -5 : 0)
    , 0, 100));
    e.prosperity = prosperity;

    // 市舶积祸：久开市舶，通番或致倭寇/海禁之争
    if (haigangOpen) {
        e.shiboRisk = (e.shiboRisk || 0) + (GameState.factions ? Math.random() * 0.4 + 0.1 : 0.2);
        if (e.shiboRisk > 5) {
            e.shiboRisk = 0;
            try {
                s.navyPower = Math.max(0, (s.navyPower || 1200) - 150);
                s.stability = Math.max(0, (s.stability || 50) - 3);
                GameState.factions.civil = Math.max(0, (GameState.factions.civil || 50) - 3);
                pushNews('海外', '通番日久，倭寇借市舶为奸，沿海烽起，海防受损！', 'danger');
            } catch (err) {}
        }
    } else {
        e.shiboRisk = Math.max(0, (e.shiboRisk || 0) - 0.1);
    }
}

function _econSmooth(p, target) {
    if (!p) return;
    // 动量 + 均值回归 + 噪声
    p.mom = (p.mom || 0) + (target - p.v) * 0.12 - (p.mom || 0) * 0.28 + (Math.random() - 0.5) * 0.05;
    p.v = _clamp(p.v + p.mom, 0.35, 3.0);
}

// 当前某物价格倍数
function _econPrice(k) { const e=_econ(); return (e&&e.prices&&e.prices[k]) ? e.prices[k].v : 1.0; }
// 当前某物实价
function _econPriceVal(k) { return (ECON_COMMODITIES[k] ? ECON_COMMODITIES[k].base : 1) * _econPrice(k); }
function _econTrend(k) { const e=_econ(); const p=e&&e.prices&&e.prices[k]; return p ? (p.mom>0.004?'涨':p.mom<-0.004?'跌':'平') : '平'; }

// ===== A2 贪腐侵蚀链 =====
// 应收 1000 两，贪腐高时实得仅 600-800（比率随贪腐动态）
function corruptionErosion() {
    const c = GameState.stats.corruption || 0;
    if (c <= 10) return 1;
    if (c <= 60) return 1 - 0.005 * (c - 10);   // 10→1.00, 30→0.90, 60→0.75
    return 0.75 - 0.003 * (c - 60);             // 60→0.75, 100→0.63
}
// 赈济/军饷层层克扣（实效更差）
function reliefErosion() {
    return Math.max(0.32, corruptionErosion() - 0.16);
}
// 地方叛乱概率 0-1（贪腐/萧条/稳定度/景气联动）
function rebellionRisk() {
    const s = GameState.stats;
    const e = _econ();
    const dep = e ? (e.depressed || 0) : 0;
    const pro = e ? (e.prosperity || 50) : 50;
    return _clamp(
        (s.corruption || 0) / 130 + dep * 0.18 + (50 - (s.stability || 50)) / 130 + (100 - pro) / 420
    , 0, 1);
}

// ===== 市操作：常平法（籴入/粜出）=====
function economyChangpingBuy() {
    try {
        const e = _econ(); if (!e) return; const s = GameState.stats;
        const g = _econPrice('grain');
        const cost = Math.round(80 * (0.8 + g) * 3.0);   // 按当季粮价购粮300石
        if (s.treasury < cost) { pushNews('市', '国库无银，常平籴入不能行。', 'danger'); renderScreen(); return; }
        s.treasury -= cost; e.granary += 300; e.changping++;
        // 谷贱籴入托市 → 略抬价；谷贵仍籴 → 追涨助灾（反爽游）
        const aside = g < 0.95 ? '谷贱籴入，市价稍稳' : (g > 1.25 ? '谷贵强籴，反助市涨，民有怨言' : '籴入新粮，仓廪渐实');
        e.prices.grain.mom += g < 0.95 ? 0.03 : (g > 1.25 ? 0.12 : 0.05);
        if (g > 1.25) { s.stability = Math.max(0, s.stability - 2); GameState.factions.civil = Math.max(0, (GameState.factions.civil||50)-2); }
        pushNews('市', `常平籴入：耗银${cost}两，收粮300石。${aside}`, g > 1.25 ? 'danger' : 'normal');
        renderScreen();
    } catch (err) {}
}
function economyChangpingSell() {
    try {
        const e = _econ(); if (!e) return; const s = GameState.stats;
        if (e.granary < 300) { pushNews('市', '常平仓粮不足，粜出不成。', 'normal'); renderScreen(); return; }
        const g = _econPrice('grain');
        const gain = Math.round(60 * (0.8 + g) * 3.0);
        e.granary -= 300; s.treasury += gain; e.changping++;
        const aside = g > 1.15 ? '谷贵粜出，市价稍抑，民食得济' : (g < 0.85 ? '谷贱反粜，抛售压市，商贾束手' : '平粜济市');
        e.prices.grain.mom += g > 1.15 ? -0.05 : (g < 0.85 ? -0.12 : -0.02);
        if (g < 0.85) { s.stability = Math.max(0, s.stability - 1); }
        pushNews('市', `常平粜出：得银${gain}两，出米300石。${aside}`, g < 0.85 ? 'normal' : 'normal');
        renderScreen();
    } catch (err) {}
}

// ===== 市操作：开中法（以盐引召商纳粮济边）=====
function economyKaizhong() {
    try {
        const e = _econ(); if (!e) return; const s = GameState.stats;
        if (s.treasury < 200) { pushNews('市', '国库无银二百，开中召商不成。', 'danger'); renderScreen(); return; }
        if (e.saltTally < 60) { pushNews('市', '盐引自短，商人无盐可兑，皆不愿输粟纳边。', 'danger'); renderScreen(); return; }
        s.treasury -= 200; e.saltTally -= 60; e.kaizhong++;
        const need = (s.militaryPower > 5000 || (GameState.mapData && GameState.mapData.redAlert)) ? 1 : 0.4;
        const gain = need >= 1 ? 45 : 18;   // 有边患则济边利宏，无患则耗银微益
        s.militaryFood = (s.militaryFood || 0) + gain;
        e.prices.grain.mom += 0.03;   // 输粟于边，市粮稍紧
        s.stability = Math.max(0, s.stability + (need >= 1 ? 1 : 0));
        pushNews('市', `开中济边：耗银200两、支盐引60，${need >= 1 ? '边军粮草+45，九边稍固' : '边患不张，仅得粮'+gain+'，商贾窃喜'}`,
            need >= 1 ? 'normal' : 'warning');
        renderScreen();
    } catch (err) {}
}

// ===== 市操作：市舶开关 =====
function economyShiboToggle() {
    try {
        const e = _econ(); if (!e) return; const s = GameState.stats;
        const on = e.shibo === 1 ? 0 : 1;
        e.shibo = on;
        if (on) {
            s.commerce = _clamp((s.commerce || 0) + 6, 0, 100);
            try { s.treasury += 150; s.privyPurse += 50; } catch (err) {}
            GameState.factions.civil = Math.max(0, (GameState.factions.civil || 50) - 3);  // 海禁之争
            e.shiboRisk = (e.shiboRisk || 0) + 0.5;
            pushNews('市', '开市舶司，番舶辐辏，商税渐增；然言官谏阻，谓通番恐引倭祸。（《明史·食货志》市舶条）', 'normal');
        } else {
            s.commerce = _clamp((s.commerce || 0) - 4, 0, 100);
            try { s.treasury -= 60; } catch (err) {}
            GameState.factions.civil = _clamp((GameState.factions.civil || 50) + 2, 0, 100);
            pushNews('市', '罢市舶司，海禁复严，商旅裹足；倭患稍弭而关税减色。', 'normal');
        }
        renderScreen();
    } catch (err) {}
}

// ===== 贪腐治理（A2 手段）=====
// 限贪：派御史巡按查贪，或得抄家之银填内帑（官心落）
function economyXiantan() {
    try {
        const s = GameState.stats;
        s.corruption = Math.max(0, s.corruption - 8);
        GameState.factions.civil = Math.max(0, (GameState.factions.civil || 50) - 2);   // 御史搏击权贵，官心自落
        if (s.corruption > 45 && Math.random() < 0.6) {
            const grab = Math.round(180 + s.corruption * 6);
            s.privyPurse = (s.privyPurse || 0) + grab;
            s.stability = Math.max(0, s.stability - 2);
            pushNews('内帑', `巡按纠劾，抄没贪臣家赀${grab}两入内帑；然官场自危，清议纷然。（官逼民反端倪）`, Math.random()<0.5?'warning':'normal');
        } else {
            pushNews('都察院', '御史巡按诸路，纠贪肃吏，风气稍清（贪腐-8）。', 'normal');
        }
        renderScreen();
    } catch (err) {}
}
// 澄清吏治：大手笔，耗威望银钱，汰冗清贪
function economyChengqing() {
    try {
        const s = GameState.stats;
        if (s.treasury < 250) { pushNews('户部', '府库不足，澄清吏治难施。', 'danger'); renderScreen(); return; }
        s.treasury -= 250; s.prestige = Math.max(0, s.prestige - 8);
        s.corruption = Math.max(0, s.corruption - 14);
        s.adminEfficiency = _clamp((s.adminEfficiency || 0) + 3, 0, 100);
        s.stability = _clamp((s.stability || 50) + 2, 0, 100);
        pushNews('吏部', '大手笔澄清吏治，汰冗员、清贪蠹；然威望所损、怨谤所加，亦不可免。', 'normal');
        renderScreen();
    } catch (err) {}
}
// 抄家权贵：立得内帑，然官逼民反、清议崩坏（显式反爽游）
function economyChaojia() {
    try {
        const s = GameState.stats;
        if (s.corruption < 30) { pushNews('内帑', '朝野尚无大奸可籍，无从抄没。', 'normal'); renderScreen(); return; }
        const gain = Math.round(300 + s.corruption * 10);
        s.privyPurse = (s.privyPurse || 0) + gain;
        s.corruption = Math.max(0, s.corruption - 5);
        s.stability = Math.max(0, s.stability - 4);
        s.prestige = Math.max(0, s.prestige - 5);
        GameState.factions.civil = Math.max(0, (GameState.factions.civil || 50) - 8);
        pushNews('内帑', `诏籍贵近家赀，得银${gain}两入内帑；然士林侧目、怨声载道，清议由是崩坏！（反爽游代价）`, 'critical');
        renderScreen();
    } catch (err) {}
}

// 渲染安全重绘
function renderScreen() {
    try {
        if (typeof updateUI === 'function') updateUI();
    } catch (err) {}
}

// ===== 国势冷暖（景气指数）指标卡 =====
function renderProsperityCard() {
    const e = _econ(); if (!e) return '';
    const p = e.prosperity || 50;
    const dep = e.depressed || 0;
    const state = p >= 70 ? '国势昂扬' : p >= 50 ? '市面安稳' : p >= 32 ? '市面萧索' : '乱象四起';
    const stateCls = p >= 60 ? '' : (p >= 35 ? 'mid' : 'low');
    const rebel = Math.round((rebellionRisk() || 0) * 100);
    const bars = 10;
    const filled = Math.max(0, Math.min(bars, Math.round(p / (100 / bars))));
    let barStr = '';
    for (let i = 0; i < bars; i++) {
        barStr += `<span class="pros-bar ${i < filled ? 'on' : ''}"></span>`;
    }
    return `
        <h3 class="section-title">国势冷暖 · 景气指数（<span class="${stateCls}">${state}</span>）</h3>
        <div class="pros-card">
            <div class="pros-line"><span class="pros-label">景气指数</span>
                <div class="pros-gauge">${barStr}</div>
                <span class="pros-num">${p}<small>/100</small></span>
            </div>
            <div class="pros-sub">
                <span>贪腐侵蚀 <b>${Math.round((1 - corruptionErosion()) * 100)}%</b></span>
                <span>市面萧条 <b>${dep == 0 ? '无' : dep + '级'}</b></span>
                <span>叛乱风险 <b class="${rebel > 45 ? 'danger' : ''}">${rebel}%</b></span>
                <span>粮价 <b>${_econPriceVal('grain').toFixed(2)}</b></span>
                <span>盐价 <b>${_econPriceVal('salt').toFixed(2)}</b></span>
                <span>铁价 <b>${_econPriceVal('iron').toFixed(2)}</b></span>
                <span>马价 <b>${_econPriceVal('horse').toFixed(2)}</b></span>
                <span>绢价 <b>${_econPriceVal('silk').toFixed(2)}</b></span>
            </div>
            ${dep >= 1 ? `<div class="pros-warn">⚠ 市面萧条：商税减、粮价高、或有人逃亡。朝廷宜抚农桑、清贪蠹、开常平以纾之。</div>` : ''}
        </div>
    `;
}

// 贪腐治理区
function renderGovernance() {
    return `
        <h3 class="section-title">澄清吏治 · 贪腐治理</h3>
        <div class="policy-grid">
            <button class="policy-btn" onclick="economyXiantan()">巡按限贪（贪-8 · 官心-）</button>
            <button class="policy-btn" onclick="economyChengqing()">澄清吏治（威望- · 赈贪14）</button>
            <button class="policy-btn danger" onclick="economyChaojia()">抄家权贵（得内帑 · 清议崩）</button>
        </div>
        <p style="color:var(--ink-light);font-size:12px;margin-top:6px;">贪腐侵蚀岁入${Math.round((1 - corruptionErosion()) * 100)}%、赈济实效${Math.round(reliefErosion() * 100)}%，杀人者析，必当早图。（《明史·食货志》惩贪法）</p>
    `;
}

// ===== 市 tab（纯展示 → 可操作）=====
function renderMarketV5() {
    const e = _econ();
    const s = GameState.stats;
    if (!e) {
        return renderMarketPrices ? renderMarketPrices() : '';
    }
    const grain = _econPrice('grain');
    const gClass = grain > 1.2 ? 'bad' : grain < 0.85 ? 'good' : '';
    const haigangIncome = s.commerce > 40 ? Math.floor(120 + (s.commerce - 40) * 4 + (e.shibo === 1 ? 180 : 0)) : 60;
    return `
        <h3 class="section-title">京师市廛 · 六物时价（每季随天时\兵戈\政令浮动）</h3>
        <p style="color:var(--ink-light);font-size:12px;margin-bottom:10px;">
            常平/开中/市舶，皆《明史·食货志》平准市易之制。时值：${GameState.currentYear + 1}年 议·银两
        </p>
        ${renderProsperityCard()}
        <div class="price-grid">
            ${Object.keys(ECON_COMMODITIES).map(function(k){
                const c = ECON_COMMODITIES[k];
                const v = e.prices[k].v;
                const cls = v > 1.15 ? 'bad' : v < 0.85 ? 'good' : '';
                return `<div class="price-card">
                    <div class="price-name">${c.name}</div>
                    <div class="price-value">${_econPriceVal(k).toFixed(2)}</div>
                    <div class="price-trend ${cls}">${v > 1.15 ? '↑贵' : v < 0.85 ? '↓贱' : '平'} ${Math.round((v - 1) * 100)}%</div>
                </div>`;
            }).join('')}
        </div>

        <h3 class="section-title">常平法 · 平准谷价（此令行则谷价高不暴、低不损农）</h3>
        <div class="policy-grid">
            <button class="policy-btn" onclick="economyChangpingBuy()">籴入·谷贱收储（粮-300 仓+300）</button>
            <button class="policy-btn" onclick="economyChangpingSell()">粜出·谷贵平抑（仓-300 银+）</button>
        </div>
        <p style="color:var(--ink-light);font-size:12px;">常平仓存粮 <b>${e.granary}</b> 石（粮价<span style="color:${gClass}">${round1(grain)}</span>）。贵时强籴、贱时强粜者——反为费帑助势。〈食货志〉谷贱伤农、谷贵伤末。</p>

        <h3 class="section-title">开中法 · 盐引召商纳粮济边</h3>
        <button class="policy-btn" onclick="economyKaizhong()">开中济边（银-200 · 盐引-60 · 军粮+）</button>
        <p style="color:var(--ink-light);font-size:12px;">现存盐引 <b>${e.saltTally}</b> 道。边患兴则利边，边患息则徒耗。〈食货志〉盐引召商输粟于边。</p>

        <h3 class="section-title">市舶司（海商之税）</h3>
        <button class="policy-btn ${e.shibo === 1 ? 'danger' : ''}" onclick="economyShiboToggle()">
            ${e.shibo === 1 ? '罢市舶（海禁复严）' : '开市舶（商贸兴）'}
        </button>
        <p style="color:var(--ink-light);font-size:12px;">
            市舶 <b>${e.shibo === 1 ? '已开' : '未开'}</b> · 现估市舶税 <b>+${haigangIncome}</b>两/季
            · 通番积祸 <b>${(e.shiboRisk || 0).toFixed(1)}</b>（高则倭寇海防损）。〈食货志〉市舶之设，始自宋元，明初罢之，成化/正德间开而复闭。
        </p>

        ${renderGovernance()}
    `;
}
function round1(x){ return Math.round(x * 100) / 100; }