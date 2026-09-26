// ============================================
// 《大明国策》v3.1 扩展系统
// 物价/御史/厂卫/藩王/选官/宫女/朝贡/灾荒/科技史/节气祭祀/皇帝养成
// 每个都有数值/进度条/关系
// ============================================

// ====== 1. 物价系统 ======
const MARKET_PRICES = {
    grain:    { name: '粮', base: 1.0, vol: 0.3, baseValue: 1, factors: { agriculture: -0.5, refugees: 0.5, frontier: 0.3 } },
    silk:     { name: '绢', base: 5.0, vol: 0.2, baseValue: 5, factors: { commerce: -0.4, culture: -0.2 } },
    salt:     { name: '盐', base: 0.1, vol: 0.15, baseValue: 0.1, factors: { commerce: -0.3 } },
    horse:    { name: '马', base: 30.0, vol: 0.4, baseValue: 30, factors: { horses: 0.5, frontier: 0.5 } },
    tea:      { name: '茶', base: 1.0, vol: 0.2, baseValue: 1, factors: { commerce: -0.4 } },
    iron:     { name: '铁', base: 0.5, vol: 0.3, baseValue: 0.5, factors: { iron: 0.5, militaryPower: -0.2 } },
    copper:   { name: '铜', base: 0.05, vol: 0.1, baseValue: 0.05, factors: { commerce: -0.3 } },
    cloth:    { name: '布', base: 2.0, vol: 0.15, baseValue: 2, factors: { agriculture: -0.3 } },
    wood:     { name: '木', base: 0.5, vol: 0.1, baseValue: 0.5, factors: { wood: 0.5 } },
    charcoal: { name: '炭', base: 0.3, vol: 0.15, baseValue: 0.3, factors: { agriculture: -0.2 } }
};

function computeAllPrices() {
    const s = GameState.stats;
    const prices = {};
    Object.entries(MARKET_PRICES).forEach(([k, p]) => {
        let factor = 1;
        Object.entries(p.factors).forEach(([fk, fc]) => {
            const val = s[fk] !== undefined ? s[fk] : 50;
            factor += (val - 50) / 100 * fc;
        });
        factor = Math.max(0.3, Math.min(3, factor + (Math.random() - 0.5) * p.vol));
        prices[k] = {
            name: p.name,
            current: (p.baseValue * factor).toFixed(2),
            trend: Math.random() < 0.5 ? '↑' : '↓',
            trendValue: Math.floor((factor - 1) * 100)
        };
    });
    return prices;
}

function renderMarketPrices() {
    const prices = computeAllPrices();
    return `
        <h3 class="section-title">京师物价行情</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            物价比对基准：${GameState.currentYear + 1}年 | 农业${GameState.stats.agriculture} | 商业${GameState.stats.commerce}
        </p>
        <div class="price-grid">
            ${Object.entries(prices).map(([k, p]) => `
                <div class="price-card">
                    <div class="price-name">${p.name}</div>
                    <div class="price-value">${p.current}</div>
                    <div class="price-trend ${p.trendValue > 0 ? 'bad' : p.trendValue < 0 ? 'good' : ''}">${p.trend} ${p.trendValue}%</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ====== 2. 御史制度 ======
const CENSORS = {
    duyushi: { name: '都御史', power: 100, range: '全国', loyalty: 70 },
    xunan:  { name: '巡按御史', power: 60, range: '一省', loyalty: 60 },
    qieyuan: { name: '给事中', power: 30, range: '六部', loyalty: 50 }
};

const CENSOR_EVENTS = [
    { title: '御史风闻言事', content: '御史某弹劾某人，请旨核议。', options: [
        { text: '准奏', effect: { civil: -5, corruption: -5 } },
        { text: '驳回', effect: { civil: 5, prestige: -3 } }
    ]},
    { title: '巡按还朝', content: '巡按御史回报地方政绩，请旨奖廉惩贪。', options: [
        { text: '奖廉惩贪', effect: { corruption: -8, civil: -3 } },
        { text: '姑且嘉奖', effect: { corruption: -3, civil: 3 } }
    ]},
    { title: '廷鞫', content: '三法司会审大案，请旨定夺。', options: [
        { text: '正法', effect: { corruption: -10, stability: 3 } },
        { text: '从轻', effect: { corruption: 3, prestige: -3 } }
    ]}
];

function renderCensor() {
    return `
        <h3 class="section-title">都察院·御史</h3>
        <div class="censor-grid">
            ${Object.entries(CENSORS).map(([k, c]) => `
                <div class="censor-card">
                    <div class="censor-name">${c.name}</div>
                    <div class="censor-power">权力 ${c.power}</div>
                    <div class="censor-range">巡查： ${c.range}</div>
                    <div class="censor-loyalty">
                        <div class="censor-bar"><div class="censor-fill" style="width: ${c.loyalty}%"></div></div>
                        <span>忠 ${c.loyalty}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">御史事件</h3>
        <div class="censor-event-list">
            ${CENSOR_EVENTS.map((e, i) => `
                <div class="censor-event">
                    <div class="censor-event-title">${e.title}</div>
                    <div class="censor-event-content">${e.content}</div>
                    <div class="censor-event-options">
                        ${e.options.map((o, j) => `
                            <button class="policy-btn" onclick="applyDecision(${JSON.stringify(o.effect).replace(/"/g, '&quot;')}); pushNews('都察院', '${o.text}', 'normal');">${o.text}</button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ====== 3. 厂卫系统 ======
const FACTORIES = {
    dongchang: { name: '东厂', chief: '东厂掌印', power: 80, loyalty: 60, cost: 1000, range: '京畿+辽东' },
    xichang:  { name: '西厂', chief: '西厂提督', power: 70, loyalty: 50, cost: 1500, range: '全国' },
    jinyiwei: { name: '锦衣卫', chief: '指挥使', power: 90, loyalty: 70, cost: 800, range: '全国' },
    neiyuan:  { name: '内院', chief: '内阁大学士', power: 60, loyalty: 80, cost: 500, range: '宫禁' }
};

function renderSecretService() {
    return `
        <h3 class="section-title">特务机关</h3>
        <div class="secret-grid">
            ${Object.entries(FACTORIES).map(([k, s]) => `
                <div class="secret-card">
                    <div class="secret-name">${s.name}</div>
                    <div class="secret-chief">${s.chief}</div>
                    <div class="secret-power-bar">
                        <span>权</span>
                        <div class="secret-fill" style="width: ${s.power}%"></div>
                        <span>${s.power}</span>
                    </div>
                    <div class="secret-loyalty">
                        <span>忠</span>
                        <div class="secret-fill jade" style="width: ${s.loyalty}%"></div>
                        <span>${s.loyalty}</span>
                    </div>
                    <div class="secret-info">年费 ${s.cost}两 | 巡查 ${s.range}</div>
                    <div class="secret-actions">
                        <button class="secret-btn" onclick="boostFactory('${k}', 10)">增权 +10</button>
                        <button class="secret-btn" onclick="boostFactory('${k}', -10)">削权 -10</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function boostFactory(key, delta) {
    FACTORIES[key].power = Math.max(0, Math.min(100, FACTORIES[key].power + delta));
    pushNews('内廷', `${FACTORIES[key].name}权势${delta > 0 ? '增' : '削'} ${Math.abs(delta)}`, 'normal');
    saveGame();
    updateUI();
    renderPanel(GameState.currentTab);
}

// ====== 4. 藩王系统 ======
const PRINCES = [
    { name: '燕王', rank: '亲王', guard: 3000, fief: '北平', loyalty: 60, danger: 30, traits: '雄才' },
    { name: '宁王', rank: '亲王', guard: 2000, fief: '南昌', loyalty: 50, danger: 50, traits: '野心' },
    { name: '晋王', rank: '亲王', guard: 2500, fief: '太原', loyalty: 70, danger: 20, traits: '守成' },
    { name: '秦王', rank: '亲王', guard: 2000, fief: '西安', loyalty: 75, danger: 15, traits: '恭顺' },
    { name: '蜀王', rank: '亲王', guard: 1500, fief: '成都', loyalty: 80, danger: 10, traits: '乐善' },
    { name: '楚王', rank: '亲王', guard: 1800, fief: '武昌', loyalty: 70, danger: 15, traits: '中庸' },
    { name: '齐王', rank: '亲王', guard: 1500, fief: '青州', loyalty: 75, danger: 10, traits: '谨慎' },
    { name: '鲁王', rank: '亲王', guard: 1000, fief: '兖州', loyalty: 85, danger: 5, traits: '仁厚' }
];

function renderPrinces() {
    return `
        <h3 class="section-title">藩王图谱</h3>
        <div class="prince-grid">
            ${PRINCES.map((p, i) => `
                <div class="prince-card ${p.danger > 40 ? 'dangerous' : ''}">
                    <div class="prince-name">${p.name}</div>
                    <div class="prince-rank">${p.rank} · ${p.fief}</div>
                    <div class="prince-bars">
                        <div class="prince-stat">
                            <span>护卫</span>
                            <div class="prince-bar"><div class="prince-fill bad" style="width: ${p.guard/30}%"></div></div>
                            <span>${p.guard}</span>
                        </div>
                        <div class="prince-stat">
                            <span>忠心</span>
                            <div class="prince-bar"><div class="prince-fill jade" style="width: ${p.loyalty}%"></div></div>
                            <span>${p.loyalty}</span>
                        </div>
                        <div class="prince-stat">
                            <span>野心</span>
                            <div class="prince-bar"><div class="prince-fill ${p.danger > 40 ? 'bad' : 'gold'}" style="width: ${p.danger}%"></div></div>
                            <span>${p.danger}</span>
                        </div>
                    </div>
                    <div class="prince-traits">${p.traits}</div>
                    <div class="prince-actions">
                        <button class="policy-btn" onclick="princeAction(${i}, '削')">削藩</button>
                        <button class="policy-btn" onclick="princeAction(${i}, '厚')">厚藩</button>
                        <button class="policy-btn" onclick="princeAction(${i}, '召')">召京</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function princeAction(idx, action) {
    const p = PRINCES[idx];
    let msg = '';
    if (action === '削') {
        p.guard = Math.max(500, p.guard - 500);
        p.loyalty = Math.max(0, p.loyalty - 10);
        p.danger = Math.min(100, p.danger + 15);
        msg = `削 ${p.name}护卫，${p.name}有所不满。`;
    } else if (action === '厚') {
        p.guard = Math.min(5000, p.guard + 500);
        p.loyalty = Math.min(100, p.loyalty + 5);
        p.danger = Math.max(0, p.danger - 5);
        msg = `厚 ${p.name}，赐金。`;
    } else {
        p.loyalty = Math.min(100, p.loyalty + 10);
        msg = `召 ${p.name}入京。`;
    }
    pushNews('宗藩', msg, 'normal');
    saveGame();
    updateUI();
    renderPanel(GameState.currentTab);
}

// ====== 5. 选官制度 ======
const OFFICIAL_SELECTION = [
    { method: '荐举', desc: '大臣荐举为官', merit: '世家垄断', effect: { civil: 5, prestige: 3 } },
    { method: '科举', desc: '考试取士', merit: '寒门进身', effect: { culture: 5, civil: 3 } },
    { method: '恩荫', desc: '父功子继', merit: '勋贵世袭', effect: { royal: 5, civil: -3 } },
    { method: '吏员', desc: '小吏升迁', merit: '干才出身', effect: { adminEfficiency: 5 } },
    { method: '举贡', desc: '府学贡生', merit: '学优入仕', effect: { culture: 3 } },
    { method: '武举', desc: '考校武艺', merit: '将帅之选', effect: { military: 5 } },
    { method: '荐贡', desc: '儒学教官', merit: '教化之功', effect: { culture: 3, civil: 2 } },
    { method: '吏部注选', desc: '按籍选授', merit: '常规铨选', effect: { bureaucracy: 3 } }
];

function renderSelection() {
    return `
        <h3 class="section-title">选官八途</h3>
        <div class="selection-grid">
            ${OFFICIAL_SELECTION.map(s => `
                <div class="selection-card">
                    <div class="selection-method">${s.method}</div>
                    <div class="selection-desc">${s.desc}</div>
                    <div class="selection-merit">${s.merit}</div>
                    <div class="selection-effect">${Object.entries(s.effect).map(([k, v]) => {
                        const n = RESOURCES[k] ? RESOURCES[k].name : FACTIONS[k] ? FACTIONS[k].name : k;
                        return `${n} ${v > 0 ? '+' : ''}${v}`;
                    }).join(' · ')}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ====== 7. 朝贡贸易详细 ======
function renderTribute() {
    return `
        <h3 class="section-title">朝贡品目（15货）</h3>
        <div class="tribute-grid">
            ${['马','骆驼','貂皮','人参','鹿茸','东珠','珊瑚','玛瑙','宝石','象牙','犀角','龙涎香','苏合香','胡椒','苏木'].map((item, i) => {
                const flow = (i % 3 === 0) ? '贡' : (i % 3 === 1) ? '赐' : '市';
                const vol = Math.floor(Math.random() * 100) + 50;
                return `
                    <div class="tribute-card">
                        <div class="tribute-name">${item}</div>
                        <div class="tribute-flow">${flow}</div>
                        <div class="tribute-vol">${vol}斤</div>
                    </div>
                `;
            }).join('')}
        </div>
        <h3 class="section-title">贡道</h3>
        <div class="tribute-routes">
            <div class="tribute-route">
                <span class="route-name">朝鲜贡道</span>
                <div class="route-bar"><div class="route-fill" style="width: 80%"></div></div>
                <span>80%</span>
            </div>
            <div class="tribute-route">
                <span class="route-name">安南贡道</span>
                <div class="route-bar"><div class="route-fill" style="width: 50%"></div></div>
                <span>50%</span>
            </div>
            <div class="tribute-route">
                <span class="route-name">哈密贡道</span>
                <div class="route-bar"><div class="route-fill" style="width: 30%"></div></div>
                <span>30%</span>
            </div>
            <div class="tribute-route">
                <span class="route-name">乌斯藏贡道</span>
                <div class="route-bar"><div class="route-fill" style="width: 60%"></div></div>
                <span>60%</span>
            </div>
        </div>
    `;
}

// ====== 8. 灾荒预警 ======
function renderFamineWarning() {
    const s = GameState.stats;
    const riskLevel = 
        s.population < 40000000 ? '极高' :
        s.population < 50000000 ? '高' :
        s.agriculture < 30 ? '中' :
        '低';
    
    return `
        <h3 class="section-title">灾荒预警</h3>
        <div class="warning-banner ${riskLevel === '极高' || riskLevel === '高' ? 'danger' : ''}">
            <div class="warning-level">${riskLevel}</div>
            <div class="warning-text">当前人口 ${Math.round(s.population/10000)}万 | 农业 ${s.agriculture} | 粮 ${s.food}</div>
        </div>
        <div class="famine-factors">
            <div class="factor">
                <span>人口压力</span>
                <div class="factor-bar"><div class="factor-fill" style="width: ${Math.min(100, (60000000 - s.population) / 300000)}%"></div></div>
                <span>${Math.round(s.population / 10000)}万</span>
            </div>
            <div class="factor">
                <span>农业水平</span>
                <div class="factor-bar"><div class="factor-fill jade" style="width: ${s.agriculture}%"></div></div>
                <span>${s.agriculture}</span>
            </div>
            <div class="factor">
                <span>粮食储备</span>
                <div class="factor-bar"><div class="factor-fill" style="width: ${Math.min(100, s.food / 50)}%"></div></div>
                <span>${s.food}</span>
            </div>
        </div>
        <div class="relief-actions">
            <h4>流民安置</h4>
            <button class="policy-btn" onclick="settleRefugees('招抚')">招抚分田</button>
            <button class="policy-btn" onclick="settleRefugees('军屯')">编入军屯</button>
            <button class="policy-btn" onclick="settleRefugees('归籍')">强令归籍</button>
        </div>
    `;
}

function settleRefugees(action) {
    const s = GameState.stats;
    if (action === '招抚') {
        s.treasury -= 1500;
        s.population += 2000000;
        s.stability += 3;
        pushNews('户部', '招抚流民分田，费 1500两。', 'normal');
    } else if (action === '军屯') {
        s.militaryPower += 1000;
        s.population -= 500000;
        s.stability += 5;
        pushNews('兵部', '流民编入军屯，军力+1000。', 'normal');
    } else {
        s.stability -= 8;
        s.population -= 300000;
        pushNews('户部', '强令流民归籍，民怨沸腾。', 'critical');
    }
    saveGame();
    updateUI();
    renderPanel(GameState.currentTab);
}

// ====== 9. 科技历史时间轴 ======
const TECH_HISTORY = [
    { year: 1370, name: '大明宝钞', desc: '朱元璋颁行纸币' },
    { year: 1380, name: '卫所制', desc: '军户制度建立' },
    { year: 1405, name: '郑和下西洋', desc: '宝船厂设' },
    { year: 1421, name: '紫禁城', desc: '永乐迁都' },
    { year: 1470, name: '一条鞭法萌芽', desc: '赋役改革' },
    { year: 1500, name: '佛郎机炮', desc: '葡萄牙传入' },
    { year: 1560, name: '戚继光练兵', desc: '鸳鸯阵法' },
    { year: 1572, name: '张居正改革', desc: '考成法' },
    { year: 1600, name: '利玛窦来华', desc: '西学东渐' },
    { year: 1620, name: '红衣大炮', desc: '徐光启铸炮' }
];

function renderTechHistory() {
    return `
        <h3 class="section-title">科技历史年表</h3>
        <div class="tech-history">
            ${TECH_HISTORY.map(t => `
                <div class="tech-history-item">
                    <div class="year">${t.year}</div>
                    <div class="dot"></div>
                    <div class="info">
                        <div class="name">${t.name}</div>
                        <div class="desc">${t.desc}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ====== 10. 24节气祭祀 ======
function renderSolarRituals() {
    return `
        <h3 class="section-title">二十四节气祭祀</h3>
        <div class="ritual-grid">
            ${['立春·祈谷','雨水·社稷','惊蛰·享先农','春分·朝日','清明·扫墓','谷雨·祭仓',
               '立夏·祭地','小满·祈麦','芒种·祭田祖','夏至·祭方泽',
               '小暑·伏日','大暑·醮星','立秋·迎秋','处暑·社祭',
               '白露·报秋','秋分·夕月','寒露·祭孔','霜降·授衣',
               '立冬·迎冬','小雪·腊祭','大雪·荐新','冬至·郊天',
               '小寒·腊祭','大寒·除旧'].map(r => `
                <div class="ritual-card">${r}</div>
            `).join('')}
        </div>
    `;
}

// ====== 11. 皇帝养成 ======
const EMPEROR_TRAITS = {
    wushu: { name: '武恕', desc: '武功与仁恕', effects: { military: 5, stability: 3 } },
    mingdu: { name: '明断', desc: '明察秋毫', effects: { adminEfficiency: 5 } },
    cangsheng: { name: '苍生', desc: '关怀百姓', effects: { stability: 5, refugees: -3 } },
    fujing: { name: '富经', desc: '理财有道', effects: { treasury: 500 } },
    weiwu: { name: '威武', desc: '威震四方', effects: { prestige: 5, frontier: -3 } },
    wenya: { name: '文雅', desc: '文采风流', effects: { culture: 5, civil: 3 } }
};

function renderEmperorTraits() {
    return `
        <h3 class="section-title">天子六品</h3>
        <div class="emperor-grid">
            ${Object.entries(EMPEROR_TRAITS).map(([k, t]) => `
                <div class="emperor-card" onclick="gainEmperorTrait('${k}')">
                    <div class="emperor-name">${t.name}</div>
                    <div class="emperor-desc">${t.desc}</div>
                    <div class="emperor-effect">
                        ${Object.entries(t.effects).map(([ek, ev]) => {
                            const n = RESOURCES[ek] ? RESOURCES[ek].name : FACTIONS[ek] ? FACTIONS[ek].name : ek;
                            return `${n} ${ev > 0 ? '+' : ''}${ev}`;
                        }).join(' · ')}
                    </div>
                </div>
            `).join('')}
        </div>
        <p style="color: var(--ink-light); font-size: 12px; margin-top: 12px; font-style: italic;">
            点击品性以研习（每季限一次）。数十年后，您的天子画像将成大明之魂。
        </p>
    `;
}

function gainEmperorTrait(key) {
    const t = EMPEROR_TRAITS[key];
    if (!t) return;
    pushNews('天子', `研习 ${t.name}：${t.desc}。`, 'normal');
    saveGame();
}

// ====== 6. 宫女太监 ======
const PALACE_STAFF = [
    { name: '掌印太监', rank: '正四品', salary: 50, loyalty: 80, power: 70 },
    { name: '秉笔太监', rank: '正四品', salary: 50, loyalty: 75, power: 65 },
    { name: '司礼监随堂', rank: '正五品', salary: 30, loyalty: 85, power: 40 },
    { name: '御马监', rank: '正五品', salary: 30, loyalty: 80, power: 50 },
    { name: '尚膳监', rank: '正五品', salary: 30, loyalty: 90, power: 30 },
    { name: '宫女首领', rank: '女官', salary: 20, loyalty: 75, power: 20 }
];

function renderPalaceStaff() {
    const totalSalary = PALACE_STAFF.reduce((s, p) => s + p.salary, 0);
    return `
        <h3 class="section-title">宫禁内侍</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            共 ${PALACE_STAFF.length} 人，月俸 ${totalSalary}两
        </p>
        <div class="staff-grid">
            ${PALACE_STAFF.map(s => `
                <div class="staff-card">
                    <div class="staff-name">${s.name}</div>
                    <div class="staff-rank">${s.rank} · 月俸 ${s.salary}两</div>
                    <div class="staff-stats">
                        <div class="staff-stat">
                            <span>忠</span>
                            <div class="staff-bar"><div class="staff-fill jade" style="width: ${s.loyalty}%"></div></div>
                            <span>${s.loyalty}</span>
                        </div>
                        <div class="staff-stat">
                            <span>权</span>
                            <div class="staff-bar"><div class="staff-fill" style="width: ${s.power}%"></div></div>
                            <span>${s.power}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

console.log('✓ v3.1 扩展系统全部加载完成');