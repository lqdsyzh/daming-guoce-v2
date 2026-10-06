// ============================================
// 《大明国策》v2.0 — 60+ 系统面板
// 每个 tab 一个 renderXxx() 函数
// ============================================

// ====== 通用渲染函数 ======
function renderPanel(tab) {
    const panel = document.getElementById('center-panel');
    if (!panel) return;
    
    let html = '';
    switch(tab) {
        case 'overview':    html = (typeof renderOverview === 'function') ? renderOverview() : renderPolitics(); break; // v6.0 批A：朝政总览
        case 'govern':      html = (typeof renderGovernTab === 'function') ? renderGovernTab() : renderPolitics(); break; // v6.0 批B：内政新政
        case 'politics':    html = renderPolitics(); break;
        case 'economy':     html = renderEconomy(); break;
        case 'personnel':   html = renderPersonnel(); break;
        case 'impeach':     html = renderImpeach(); break;
        case 'construction':html = renderConstruction(); break;
        case 'diplomacy':   html = renderDiplomacy() + (typeof renderDiploInteractTab === 'function' ? renderDiploInteractTab() : ''); break;
        case 'finance':     html = renderHuBuDetail(); break;
        case 'military':    html = renderMilitaryOps() + (typeof renderMilitaryOpsExt === 'function' ? renderMilitaryOpsExt() : '') + (typeof renderWarDefTab === 'function' ? renderWarDefTab() : '') + (typeof renderMilTechTab === 'function' ? renderMilTechTab() : ''); break;
        case 'transport':   html = renderWaterSystem(); break;
        case 'prison':      html = renderSecretService(); break;
        case 'harem':       html = renderPalaceStaff() + (typeof renderHaremInteractTab === 'function' ? renderHaremInteractTab() : ''); break;
        case 'court':       html = renderCourtTab(); break;
        case 'keju':        html = renderKejuTab(); break;
        case 'yingzao':     html = renderYingzaoTab(); break;
        case 'tech':        html = renderSolarRituals() + (typeof renderLizhiTab === 'function' ? renderLizhiTab() : '') + (typeof renderAutoTab === 'function' ? renderAutoTab() : ''); break;
        case 'decade':      html = renderDecade(); break;
        case 'yearend':     html = (typeof renderYearendTab === 'function') ? renderYearendTab() : ''; break;
        case 'map':         html = (typeof renderMapTab === 'function') ? renderMapTab() : ''; break;
        case 'markets':     html = (typeof renderMarketV5 === 'function') ? renderMarketV5() : renderMarketPrices(); break;
        case 'censor':      html = renderCensor(); break;
        case 'secret':      html = (typeof renderCangweiTab === 'function') ? renderCangweiTab() : renderSecretService(); break; // 批3：厂卫面板
        case 'intrigue':    html = (typeof renderIntrigueTab === 'function') ? renderIntrigueTab() : renderPolitics(); break; // 批D：权谋（结党/倾轧/阴谋/廷杖流放）
        case 'prince':      html = renderPrinces(); break;
        case 'selection':   html = renderSelection(); break;
        case 'tribute':     html = renderTribute(); break;
        case 'famine':      html = renderFamineWarning() + (typeof renderZaiyiTab === 'function' ? renderZaiyiTab() : ''); break;
        case 'emperor':     html = renderEmperorTraits() + (typeof renderLizhiTab === 'function' ? renderLizhiTab() : '') + (typeof renderAutoTab === 'function' ? renderAutoTab() : ''); break;
        case 'share':       html = renderShare(); break;
        case 'compare':     html = renderCompare(); break;
        case 'mission':     html = (typeof renderMissionTab === 'function') ? renderMissionTab() : ''; break; // v6.0 批E：王朝使命看板
    }
    
    // 统一写入 DOM（修复 v3.2 share/compare 渲染 bug）
    if (html && !isDirectlyWrittenTab(tab)) {
        panel.innerHTML = html;
    }
    syncMenuTabActive(tab);
}

// v6.0 批A：渲染后同步左侧菜单 active，保证下钻/载档后选中态一致（不触碰 edict 永久DOM）
function syncMenuTabActive(tab) {
    try {
        var tabs = document.querySelectorAll('#menu-tabs .menu-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].dataset.tab === tab);
        }
    } catch (e) {}
}

// 这些 tab 函数内部已经自己写 panel.innerHTML
function isDirectlyWrittenTab(tab) {
    return ['politics', 'decade'].includes(tab);
}

// ====== 1. 政事卷：当前奏折 + 事件 ======
function renderPolitics() {
    const s = GameState.stats;
    // 国事区已在index.html永久DOM，只更新季节banner和刷新历史
    const banner = document.getElementById('season-banner');
    if (banner) {
        const jpLeft = (typeof GameState.junpi !== 'undefined' && GameState.junpi) ? Math.max(0, 3 - GameState.junpi.perTick) : 3;
        const jpN = (GameState.memorialQueue || []).length;
        banner.innerHTML = `<div class="season-name">${SEASONS[GameState.currentSeason].name}</div>
            <div class="season-status">${['孟','仲','季'][GameState.currentMonth]}月 · ${SEASONS[GameState.currentSeason].effect}</div>
            <button id="junpi-open-btn" class="junpi-open-btn" onclick="openJunpiModal()">御览批朱（${jpLeft}${jpN > 0 ? '·' + jpN + '奏' : ''}）</button>`;
    }
    const panel = document.getElementById('center-panel');
    panel.innerHTML = '';
    renderHistory();
}

// ====== 2. 财赋卷：22资源完整详情 + 库存 ======
function renderEconomy() {
    const s = GameState.stats;
    const income = calculateIncome();
    const expense = calculateExpense();
    
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">户部 · 财赋总览</div>
        <div class="report-summary">
            <div class="summary-item">
                <div class="summary-label">岁入</div>
                <div class="summary-value jade">+${income.total}两</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">岁出</div>
                <div class="summary-value ink">-${expense.total}两</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">国库存银</div>
                <div class="summary-value">${s.treasury}两</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">内帑</div>
                <div class="summary-value">${s.privyPurse}两</div>
            </div>
        </div>
        
        <h3 class="section-title">国库收支明细</h3>
        <div class="finance-table">
            ${renderFinanceRow('税赋收入', '+' + income.tax + '两', '正')}
            ${renderFinanceRow('漕粮折色', '+' + income.caoyun + '两', '正')}
            ${renderFinanceRow('盐课', '+' + income.salt + '两', '正')}
            ${renderFinanceRow('商税', '+' + income.commerce + '两', '正')}
            ${renderFinanceRow('市舶', '+' + income.haigang + '两', '正')}
            ${renderFinanceRow('宗藩禄米', '-' + expense.royal + '两', '负')}
            ${renderFinanceRow('百官俸禄', '-' + expense.salary + '两', '负')}
            ${renderFinanceRow('九边军费', '-' + expense.military + '两', '负')}
            ${renderFinanceRow('宫廷用度', '-' + expense.palace + '两', '负')}
            ${renderFinanceRow('工程营造', '-' + expense.construction + '两', '负')}
            ${renderFinanceRow('赈灾', '-' + expense.relief + '两', '负')}
        </div>
        
        <h3 class="section-title">府库三十种库存</h3>
        <div class="storage-grid">
            ${STORAGE.map(item => `
                <div class="storage-item">
                    <div class="storage-name">${item.name}</div>
                    <div class="storage-amount">${Math.floor(s.treasury * 0.001 * item.base * 10) || 0} ${item.unit}</div>
                </div>
            `).join('')}
        </div>
        
        <h3 class="section-title">节流开关</h3>
        <div class="policy-grid">
            <button class="policy-btn" onclick="togglePolicy('海禁')">海禁：${GameState.policies['海禁'] || '禁'}</button>
            <button class="policy-btn" onclick="togglePolicy('茶马')">茶马：${GameState.policies['茶马'] || '官营'}</button>
            <button class="policy-btn" onclick="togglePolicy('盐政')">盐政：${GameState.policies['盐政'] || '开中'}</button>
            <button class="policy-btn" onclick="togglePolicy('漕运')">漕运：${GameState.policies['漕运'] || '河运'}</button>
            <button class="policy-btn" onclick="togglePolicy('商税')">商税：${GameState.policies['商税'] || '三十税一'}</button>
            <button class="policy-btn" onclick="togglePolicy('马政')">马政：${GameState.policies['马政'] || '民牧'}</button>
        </div>
        
        ${(typeof renderProsperityCard === 'function') ? renderProsperityCard() : ''}
        ${(typeof renderGovernance === 'function') ? renderGovernance() : ''}
    `;
}

function renderFinanceRow(name, amount, type) {
    return `<div class="finance-row ${type}">
        <span>${name}</span>
        <span>${amount}</span>
    </div>`;
}

function _econDep() { const e = GameState.econ; return (e && e.depressed) ? e.depressed : 0; }
function _econErosion() {
    return (typeof corruptionErosion === 'function')
        ? corruptionErosion()
        : (1 - (GameState.stats.corruption || 0) / 100);
}

function calculateIncome() {
    const s = GameState.stats;
    const erosion = _econErosion();          // 批A：贪腐侵蚀（应收1000，实得随贪腐600-800）
    const dep = _econDep();
    const depMult = Math.max(0.55, 1 - dep * 0.1);   // 批A：市面萧条折损工商漕
    const tax = Math.floor(800 * erosion * (s.adminEfficiency / 50));
    const caoyun = Math.floor(200 * s.canalEfficiency / 50) * depMult;
    const salt = Math.floor(300 * s.commerce / 50);
    const commerce = Math.floor(150 * s.commerce / 50) * depMult;
    const shiboOn = (GameState.econ && GameState.econ.shibo === 1);
    const haigang = (s.commerce > 30)
        ? Math.floor((120 + (s.commerce - 30) * 3) * (shiboOn ? 1.8 : 1.0))
        : 0;
    return {
        tax, caoyun, salt, commerce, haigang,
        total: tax + caoyun + salt + commerce + haigang
    };
}

function calculateExpense() {
    const s = GameState.stats;
    const royal = Math.floor((GameState.factions.royal - 30) * 50);
    const salary = 2000;
    const military = Math.floor(s.militaryPower * 0.5);
    const palace = 800;
    const construction = 300;
    const relief = s.stability < 40 ? 500 : 100;
    return {
        royal, salary, military, palace, construction, relief,
        total: royal + salary + military + palace + construction + relief
    };
}

// ====== 3. 人事卷：30位大臣 ======
function renderPersonnel() {
    const ministers = GameState.ministers;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">吏部 · 朝臣名录</div>
        <div class="personnel-tabs">
            <button class="filter-btn active" onclick="filterMinisters('all')">全部</button>
            <button class="filter-btn" onclick="filterMinisters('civil')">文官</button>
            <button class="filter-btn" onclick="filterMinisters('military')">武将</button>
            <button class="filter-btn" onclick="filterMinisters('royal')">宗室</button>
            <button class="filter-btn" onclick="filterMinisters('eunuch')">宦官</button>
            <button class="filter-btn" onclick="filterMinisters('consort')">外戚</button>
        </div>
        <div class="ministers-list" id="ministers-list">
            ${renderMinisterCards(ministers)}
        </div>
        <h3 class="section-title">九卿科道</h3>
        <div class="rank-list">
            ${RANKS.slice(0, 12).map(rank => `
                <div class="rank-item">
                    <span class="rank-name">${rank}</span>
                    <span class="rank-holder">${getRandomHolder(rank)}</span>
                    <span class="rank-loyalty">忠${60 + Math.floor(Math.random()*30)}</span>
                </div>
            `).join('')}
        </div>
    `;
    window._currentMinisterFilter = 'all';
}

function renderMinisterCards(ministers) {
    let html = '';
    Object.entries(ministers).forEach(([cat, list]) => {
        if (window._currentMinisterFilter && window._currentMinisterFilter !== 'all' && window._currentMinisterFilter !== cat) return;
        list.forEach((m, i) => {
            html += `
                <div class="minister-card" data-cat="${cat}">
                    <div class="minister-head">
                        <div class="minister-rank-tag" data-cat="${cat}">${cat === 'civil' ? '文' : cat === 'military' ? '武' : cat === 'royal' ? '宗' : cat === 'eunuch' ? '阉' : '戚'}</div>
                        <div class="minister-info">
                            <div class="minister-name">${m.name}</div>
                            <div class="minister-position">${m.rank}</div>
                        </div>
                        <div class="minister-favor ${m.loyalty > 70 ? 'good' : m.loyalty < 40 ? 'bad' : ''}">忠${m.loyalty}</div>
                    </div>
                    <div class="minister-traits">
                        <div class="trait"><span>能</span><div class="trait-bar"><div class="trait-fill" style="width:${m.ability}%"></div></div><span>${m.ability}</span></div>
                        <div class="trait"><span>廉</span><div class="trait-bar"><div class="trait-fill" style="width:${m.integrity}%"></div></div><span>${m.integrity}</span></div>
                        <div class="trait"><span>志</span><div class="trait-bar"><div class="trait-fill" style="width:${m.ambition}%"></div></div><span>${m.ambition}</span></div>
                        <div class="trait"><span>派</span><div class="trait-bar"><div class="trait-fill" style="width:${m.faction}%"></div></div><span>${m.faction}</span></div>
                    </div>
                    <div class="minister-actions">
                        <button class="act-btn" onclick="ministerAction('${cat}', ${i}, '召见')">召见</button>
                        <button class="act-btn" onclick="ministerAction('${cat}', ${i}, '赐宴')">赐宴</button>
                        <button class="act-btn" onclick="ministerAction('${cat}', ${i}, '密谈')">密谈</button>
                        <button class="act-btn" onclick="ministerAction('${cat}', ${i}, '弹劾')">弹劾</button>
                    </div>
                </div>
            `;
        });
    });
    return html;
}

function filterMinisters(cat) {
    window._currentMinisterFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const list = (document.getElementById('ministers-list')||{innerHTML:''});
    if (list) list.innerHTML = renderMinisterCards(GameState.ministers);
}

function getRandomHolder(rank) {
    const surnames = ['李','王','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林'];
    const names = ['德辉','元辅','文远','景明','伯仁','世昌','廷玉','承业','孟和','克勤','文忠','廷献'];
    return surnames[Math.floor(Math.random()*surnames.length)] + names[Math.floor(Math.random()*names.length)];
}

function ministerAction(cat, idx, action) {
    const m = GameState.ministers[cat][idx];
    let msg = '';
    switch(action) {
        case '召见':
            // 批2：接入大臣召见浮层（四互动：问策/闲谈/赏赐/训诫）
            if (typeof openTalkModal === 'function') { openTalkModal(cat, idx); return; }
            m.loyalty = Math.min(100, m.loyalty + 5);
            msg = `召见${m.name}，赐茶。`;
            break;
        case '赐宴':
            GameState.stats.privyPurse -= 500;
            m.loyalty = Math.min(100, m.loyalty + 10);
            msg = `赐${m.name}宴于内帑。`;
            break;
        case '密谈':
            m.opinion = '未知';
            msg = `与${m.name}密谈良久。`;
            break;
        case '弹劾':
            m.loyalty = Math.max(0, m.loyalty - 20);
            GameState.impeachmentQueue.push({ cat, idx, name: m.name, action: 'reprimand' });
            msg = `弹劾${m.name}，命都察院查核。`;
            break;
    }
    pushNews('圣旨', msg, 'normal');
    updateUI();
    renderPanel(GameState.currentTab);
}

// ====== 4. 刑部卷：弹劾系统完整UI ======
function renderImpeach() {
    const queue = GameState.impeachmentQueue;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">刑部 · 弹劾案牍</div>
        <div class="impeach-tabs">
            <button class="filter-btn active" onclick="switchImpeachTab('queue')">待审</button>
            <button class="filter-btn" onclick="switchImpeachTab('actions')">律条</button>
            <button class="filter-btn" onclick="switchImpeachTab('appeals')">申冤</button>
            <button class="filter-btn" onclick="switchImpeachTab('history')">已决</button>
        </div>
        <div id="impeach-content">
            ${renderImpeachQueue()}
        </div>
    `;
    window._impeachTab = 'queue';
}

function renderImpeachQueue() {
    if (GameState.impeachmentQueue.length === 0) {
        return '<div class="empty-state">无待审案卷。请从人事卷中弹劾大臣以立案。</div>';
    }
    return GameState.impeachmentQueue.map((caseItem, i) => `
        <div class="case-card">
            <div class="case-head">
                <div class="case-name">${caseItem.name}</div>
                <div class="case-charge">罪名：${IMPEACHMENT.charges[Math.floor(Math.random()*IMPEACHMENT.charges.length)]}</div>
            </div>
            <div class="case-actions">
                <h4>圣裁</h4>
                <div class="case-options">
                    ${Object.entries(IMPEACHMENT.actions).map(([key, act]) => `
                        <button class="case-btn" onclick="applyImpeach(${i}, '${key}')">${act.msg}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderImpeachActions() {
    return `
        <h3 class="section-title">十种下场（律条）</h3>
        <div class="law-table">
            ${Object.entries(IMPEACHMENT.actions).map(([key, act]) => `
                <div class="law-row">
                    <span class="law-name">${act.name}</span>
                    <span class="law-effect">${act.msg}</span>
                    <span class="law-impact">稳${formatNum(act.stability)} | 国库${formatNum(act.treasury/1000)}k | 品${act.rank} | 死${act.death?'是':'否'}</span>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">大明律二十一款</h3>
        <div class="law-table">
            ${LAWS.map(law => `
                <div class="law-row">
                    <span class="law-name">${law.name}</span>
                    <span class="law-effect">${law.desc || law.penalty || ''}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderImpeachAppeals() {
    return `
        <h3 class="section-title">六种申冤路径</h3>
        <p class="hint-text">当大臣被判重刑时，可能选择申冤。每种申冤有不同的风险与收益。</p>
        <div class="appeal-grid">
            ${IMPEACHMENT.appeals.map((appeal, i) => `
                <div class="appeal-card">
                    <div class="appeal-name">${appeal.type}</div>
                    <div class="appeal-effect">
                        ${Object.entries(appeal.effect).map(([k, v]) => `${RESOURCES[k] ? RESOURCES[k].name : FACTIONS[k] ? FACTIONS[k].name : k} ${v > 0 ? '+' : ''}${v}`).join(' | ')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderImpeachHistory() {
    return '<div class="empty-state">本朝尚无已决弹劾记录。</div>';
}

function switchImpeachTab(tab) {
    window._impeachTab = tab;
    document.querySelectorAll('.impeach-tabs .filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const content = (document.getElementById('impeach-content')||{innerHTML:'',textContent:''});
    if (!content) return;
    switch(tab) {
        case 'queue':   content.innerHTML = renderImpeachQueue(); break;
        case 'actions': content.innerHTML = renderImpeachActions(); break;
        case 'appeals': content.innerHTML = renderImpeachAppeals(); break;
        case 'history': content.innerHTML = renderImpeachHistory(); break;
    }
}

function applyImpeach(caseIdx, actionKey) {
    const caseItem = GameState.impeachmentQueue[caseIdx];
    if (!caseItem) return;
    const act = IMPEACHMENT.actions[actionKey];
    if (!act) return;
    
    // 应用效果
    if (act.stability) GameState.stats.stability = Math.max(0, Math.min(100, GameState.stats.stability + act.stability));
    if (act.treasury)  GameState.stats.treasury += act.treasury;
    if (act.treasury < 0) GameState.stats.privyPurse += act.treasury;  // 抄家用内帑
    
    if (act.death) {
        // 杀死该大臣
        if (GameState.ministers[caseItem.cat] && GameState.ministers[caseItem.cat][caseItem.idx]) {
            GameState.ministers[caseItem.cat].splice(caseItem.idx, 1);
        }
        GameState.factions[caseItem.cat] = Math.max(0, GameState.factions[caseItem.cat] - 10);
    }
    
    pushNews('刑部', `${caseItem.name}：${act.msg}。${act.death ? '已伏法。' : ''}`, 'critical');
    GameState.impeachmentQueue.splice(caseIdx, 1);
    saveGame();
    updateUI();
    renderImpeach();
}

function formatNum(n) {
    if (n > 0) return '+' + n;
    return '' + n;
}

function togglePolicy(policyName) {
    const p = POLICIES.find(x => x.name === policyName);
    if (!p) return;
    const current = GameState.policies[policyName];
    const idx = p.states.indexOf(current);
    const next = p.states[(idx + 1) % p.states.length];
    GameState.policies[policyName] = next;
    pushNews('户部', `${policyName}：${current} → ${next}`, 'normal');
    renderPanel('economy');
}

// ====== 5. 营造卷：20种奇观 ======
function renderConstruction() {
    const wonders = WONDERS;
    const built = GameState.wonders;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">工部 · 营造监</div>
        <div class="wonder-stats">
            已建：${built.length} | 在建：${built.filter(w => w.progress < w.time).length}
        </div>
        <h3 class="section-title">二十大奇观</h3>
        <div class="wonder-grid">
            ${wonders.map((w, i) => {
                const builtItem = built.find(b => b.name === w.name);
                return `
                    <div class="wonder-card ${builtItem ? (builtItem.progress >= w.time ? 'built' : 'building') : ''}">
                        <div class="wonder-name">${w.name}</div>
                        <div class="wonder-desc">${w.desc}</div>
                        <div class="wonder-cost">造 ${w.cost}两 | ${w.time}季</div>
                        <div class="wonder-effect">${Object.entries(w.effect).map(([k,v]) => `${RESOURCES[k]?.name || k} ${v > 0 ? '+' : ''}${v}`).join(' | ')}</div>
                        ${builtItem 
                            ? builtItem.progress >= w.time 
                                ? '<div class="wonder-status">已建成</div>'
                                : `<div class="wonder-status">建造中 ${builtItem.progress}/${w.time}</div>`
                            : `<button class="wonder-btn" onclick="buildWonder(${i})">兴工</button>`
                        }
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function buildWonder(i) {
    const w = WONDERS[i];
    if (GameState.stats.treasury < w.cost) {
        alert('国库不足');
        return;
    }
    GameState.stats.treasury -= w.cost;
    GameState.wonders.push({ name: w.name, progress: 0, time: w.time, cost: w.cost });
    pushNews('工部', `兴工建造 ${w.name}，费 ${w.cost}两。`, 'normal');
    saveGame();
    updateUI();
    renderConstruction();
}

// ====== 6. 礼部卷：外交 + 列国 ======
function renderDiplomacy() {
    const nations = GameState.nations;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">礼部 · 主客司</div>
        <h3 class="section-title">二十国外交通商</h3>
        <div class="nation-grid">
            ${nations.map((n, i) => `
                <div class="nation-card" data-type="${n.type}">
                    <div class="nation-name">${n.name}</div>
                    <div class="nation-type">${n.type}</div>
                    <div class="nation-traits">${n.traits.join(' · ')}</div>
                    <div class="nation-bars">
                        <div class="nation-bar">
                            <span>敌意</span>
                            <div class="nation-fill-hostile" style="width:${n.hostility}%"></div>
                        </div>
                        <div class="nation-bar">
                            <span>实力</span>
                            <div class="nation-fill-strength" style="width:${n.strength}%"></div>
                        </div>
                    </div>
                    <div class="nation-tribute">${n.tribute ? '朝贡' : '不贡'} | 使${n.diplomats}</div>
                    <div class="nation-actions">
                        <button class="act-btn" onclick="nationAction(${i}, '遣使')">遣使</button>
                        <button class="act-btn" onclick="nationAction(${i}, '赐贡')">赐贡</button>
                        <button class="act-btn" onclick="nationAction(${i}, '征伐')">征伐</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">外交行动记录</h3>
        <div class="news-list" style="max-height: 200px;"></div>
    `;
}

function nationAction(idx, action) {
    const n = GameState.nations[idx];
    let msg = '';
    switch(action) {
        case '遣使':
            GameState.stats.treasury -= 500;
            n.hostility = Math.max(0, n.hostility - 5);
            n.diplomats = Math.min(5, n.diplomats + 1);
            msg = `遣使赴${n.name}。`;
            break;
        case '赐贡':
            GameState.stats.treasury -= 2000;
            GameState.stats.privyPurse -= 1000;
            n.hostility = Math.max(0, n.hostility - 15);
            n.tribute = 1;
            msg = `厚赐${n.name}，结以恩信。`;
            break;
        case '征伐':
            GameState.stats.treasury -= 5000;
            GameState.stats.militaryPower -= 500;
            n.hostility = Math.min(100, n.hostility + 30);
            msg = `下诏征伐${n.name}。`;
            break;
    }
    pushNews('礼部', msg, 'normal');
    saveGame();
    updateUI();
    renderDiplomacy();
}

// ====== 7. 财赋卷细：详细账目 ======
function renderFinance() {
    renderEconomy();
}

// ====== 8. 兵部卷：军事地图 + 20兵种 ======
function renderMilitary() {
    const military = GameState.military;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">兵部 · 五军都督府</div>
        <div class="military-summary">
            <div class="summary-item">
                <div class="summary-label">全军</div>
                <div class="summary-value">${military.regions.reduce((s, r) => s + r.troops, 0)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">水师</div>
                <div class="summary-value">${GameState.stats.navyPower}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">火药</div>
                <div class="summary-value">${GameState.stats.gunpowder}</div>
            </div>
        </div>
        
        <h3 class="section-title">十镇驻军</h3>
        <div class="region-grid">
            ${military.regions.map((r, i) => `
                <div class="region-card">
                    <div class="region-name">${r.name}</div>
                    <div class="region-troops">兵 ${r.troops} | 将 ${r.commander}</div>
                    <div class="region-bars">
                        <div class="region-bar">威胁 <div class="bar"><div class="bar-fill bad" style="width:${r.threat}%"></div></div> ${r.threat}</div>
                        <div class="region-bar">补给 <div class="bar"><div class="bar-fill jade" style="width:${r.supply}%"></div></div> ${r.supply}</div>
                        <div class="region-bar">士气 <div class="bar"><div class="bar-fill gold" style="width:${r.morale}%"></div></div> ${r.morale}</div>
                    </div>
                    <div class="region-actions">
                        <button class="act-btn" onclick="regionAction(${i}, '增兵')">增兵</button>
                        <button class="act-btn" onclick="regionAction(${i}, '换将')">换将</button>
                        <button class="act-btn" onclick="regionAction(${i}, '巡边')">巡边</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <h3 class="section-title">二十种兵种</h3>
        <div class="troop-grid">
            ${TROOP_TYPES.map(t => `
                <div class="troop-card">
                    <div class="troop-name">${t.name}</div>
                    <div class="troop-stats">战${t.strength} | 速${t.mobility} | 费${t.cost}</div>
                </div>
            `).join('')}
        </div>
        
        <h3 class="section-title">二十种阵法</h3>
        <div class="troop-grid">
            ${MORE_SYSTEMS.formations.map(f => `<div class="troop-card"><div class="troop-name">${f}</div></div>`).join('')}
        </div>
    `;
}

function regionAction(idx, action) {
    const r = GameState.military.regions[idx];
    let msg = '';
    switch(action) {
        case '增兵':
            if (GameState.stats.militaryPower >= 500) {
                GameState.stats.militaryPower -= 500;
                r.troops += 500;
                msg = `增兵 ${r.name} 500。`;
            } else msg = `兵不足。`;
            break;
        case '换将':
            r.commander = MORE_SYSTEMS.medicine[Math.floor(Math.random()*MORE_SYSTEMS.medicine.length)] + '（代）';
            msg = `更换${r.name}主将。`;
            break;
        case '巡边':
            GameState.stats.treasury -= 1000;
            r.morale = Math.min(100, r.morale + 5);
            r.supply = Math.min(100, r.supply + 5);
            msg = `遣使巡${r.name}。`;
            break;
    }
    pushNews('兵部', msg, 'normal');
    saveGame();
    updateUI();
    renderMilitary();
}

// ====== 9. 漕运卷：漕运、驿站、粮运 ======
function renderTransport() {
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">工部 · 漕运总督</div>
        <h3 class="section-title">二十大漕粮仓</h3>
        <div class="storage-grid">
            ${GRANARIES.map(g => `
                <div class="storage-item">
                    <div class="storage-name">${g}</div>
                    <div class="storage-amount">${Math.floor(GameState.stats.food * 0.05)}万石</div>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">漕运二十项</h3>
        <div class="policy-grid">
            <button class="policy-btn" onclick="togglePolicy('漕运')">漕运：${GameState.policies['漕运']}</button>
            <button class="policy-btn" onclick="alert('开通海运')">海运</button>
            <button class="policy-btn" onclick="alert('改折')">改折</button>
            <button class="policy-btn" onclick="alert('疏浚')">疏浚</button>
        </div>
        <h3 class="section-title">三十条河</h3>
        <div class="river-list">
            ${MORE_SYSTEMS.rivers.map(r => `<span class="river-tag">${r}</span>`).join('')}
        </div>
        <h3 class="section-title">二十个湖</h3>
        <div class="river-list">
            ${MORE_SYSTEMS.lakes.map(r => `<span class="river-tag">${r}</span>`).join('')}
        </div>
    `;
}

// ====== 10. 囹圄卷：诏狱/东厂/锦衣卫 ======
function renderPrison() {
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">都察院 · 镇抚司</div>
        <h3 class="section-title">禁府十种行动</h3>
        <div class="action-grid">
            ${PROSECUTOR.actions.map((act, i) => `
                <div class="action-card" onclick="prosecutorAction(${i})">
                    <div class="action-name">${act.name}</div>
                    <div class="action-cost">费 ${act.cost}两 | 成 ${Math.floor(act.success*100)}%</div>
                    <div class="action-effect">${Object.entries(act.effect).map(([k,v]) => `${RESOURCES[k] ? RESOURCES[k].name : FACTIONS[k] ? FACTIONS[k].name : k} ${v > 0 ? '+' : ''}${v}`).join(' | ')}</div>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">五诏狱 / 八刑具</h3>
        <div class="grid-2">
            <div>
                <h4>诏狱</h4>
                ${PROSECUTOR.prisons.map(p => `<div class="law-row"><span>${p}</span></div>`).join('')}
            </div>
            <div>
                <h4>刑具</h4>
                ${PROSECUTOR.tortures.map(t => `<div class="law-row"><span>${t}</span></div>`).join('')}
            </div>
        </div>
        <h3 class="section-title">九大可监目标</h3>
        <div class="target-grid">
            ${PROSECUTOR.targets.map(t => `<div class="target-tag">${t}</div>`).join('')}
        </div>
    `;
}

function prosecutorAction(i) {
    const act = PROSECUTOR.actions[i];
    if (GameState.stats.treasury < act.cost) {
        alert('国库不足');
        return;
    }
    GameState.stats.treasury -= act.cost;
    
    const success = Math.random() < act.success;
    if (success) {
        pushNews('镇抚', `${act.name}行动成功。`, 'normal');
        applyDecision(act.effect);
    } else {
        pushNews('镇抚', `${act.name}行动失败，损失 ${act.cost}两。`, 'critical');
    }
    saveGame();
    updateUI();
    renderPrison();
}

// ====== 11. 宫闱卷：后宫/继承人 ======
function renderHarem() {
    const harem = GameState.harem;
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">内廷 · 司礼监</div>
        <h3 class="section-title">六位妃嫔</h3>
        <div class="harem-grid">
            ${harem.consorts.map((c, i) => `
                <div class="consort-card" data-rank="${c.rank}">
                    <div class="consort-name">${c.name}</div>
                    <div class="consort-rank">${c.rank}品</div>
                    <div class="consort-bars">
                        <div class="consort-stat">育 ${c.fertility} | 权 ${c.power} | 宠 ${c.favor}</div>
                    </div>
                    <div class="consort-actions">
                        <button class="act-btn" onclick="consortAction(${i}, '召幸')">召幸</button>
                        <button class="act-btn" onclick="consortAction(${i}, '晋封')">晋封</button>
                        <button class="act-btn" onclick="consortAction(${i}, '废黜')">废</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">二十种继承人规则</h3>
        <div class="rule-list">
            ${HAREM.successionRules.map(r => `<div class="rule-tag">${r}</div>`).join('')}
        </div>
        <h3 class="section-title">三十皇子名</h3>
        <div class="prince-name-list">
            ${HAREM.princeNames.map(n => `<span class="prince-tag">${n}</span>`).join('')}
        </div>
        <h3 class="section-title">二十四皇子品性</h3>
        <div class="prince-name-list">
            ${HAREM.princeTraits.map(n => `<span class="prince-tag">${n}</span>`).join('')}
        </div>
    `;
}

function consortAction(idx, action) {
    const c = GameState.harem.consorts[idx];
    let msg = '';
    switch(action) {
        case '召幸':
            c.favor = Math.min(100, c.favor + 5);
            msg = `召${c.name}侍寝。`;
            break;
        case '晋封':
            c.rank = Math.max(1, c.rank - 1);
            c.power += 5;
            c.favor += 5;
            GameState.factions.consort = Math.min(100, GameState.factions.consort + 3);
            msg = `晋${c.name}为 ${c.rank}品。`;
            break;
        case '废黜':
            c.favor = 0;
            c.power = 0;
            GameState.factions.consort = Math.max(0, GameState.factions.consort - 5);
            msg = `废黜${c.name}。`;
            break;
    }
    pushNews('内廷', msg, 'normal');
    saveGame();
    updateUI();
    renderHarem();
}

// ====== 12. 技艺卷：科技树 ======
function renderTech() {
    const panel = document.getElementById('center-panel');
    panel.innerHTML = `
        <div class="report-title">工部 · 技艺监</div>
        <div class="tech-tabs">
            ${Object.entries(TECH_TREE).map(([key, group]) => `
                <div class="tech-category">
                    <h3 class="section-title">${group.name}</h3>
                    <div class="tech-grid">
                        ${group.techs.map(t => {
                            const researched = (GameState.techs[key] || []).includes(t.name);
                            const canResearch = !t.prereq || (GameState.techs[key] || []).includes(t.prereq);
                            return `
                                <div class="tech-card ${researched ? 'researched' : ''} ${canResearch ? '' : 'locked'}">
                                    <div class="tech-name">${t.name}</div>
                                    <div class="tech-cost">费 ${t.cost}两</div>
                                    <div class="tech-effect">${Object.entries(t.effect).map(([k,v]) => `${RESOURCES[k] ? RESOURCES[k].name : k} ${v > 0 ? '+' : ''}${v}`).join(' | ')}</div>
                                    ${t.prereq ? `<div class="tech-prereq">前置：${t.prereq}</div>` : ''}
                                    ${researched 
                                        ? '<div class="tech-status">已研</div>' 
                                        : canResearch 
                                            ? `<button class="tech-btn" onclick="researchTech('${key}', '${t.name}', ${t.cost})">研习</button>`
                                            : '<div class="tech-status">未解锁</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <h3 class="section-title">三十种货币</h3>
        <div class="currency-list">
            ${CURRENCIES.map(c => `<div class="currency-item"><span>${c.name}</span><span>${c.value}两</span></div>`).join('')}
        </div>
        
        <h3 class="section-title">三十种兵书</h3>
        <div class="book-list">
            ${MILITARY_BOOKS.map(b => `<span class="book-tag">${b}</span>`).join('')}
        </div>
        
        <h3 class="section-title">三十处山川</h3>
        <div class="river-list">
            ${MOUNTAINS.map(m => `<span class="river-tag">${m}</span>`).join('')}
        </div>
    `;
}

function researchTech(cat, name, cost) {
    if (GameState.stats.treasury < cost) {
        alert('国库不足');
        return;
    }
    GameState.stats.treasury -= cost;
    if (!GameState.techs[cat]) GameState.techs[cat] = [];
    GameState.techs[cat].push(name);
    
    const tech = TECH_TREE[cat].techs.find(t => t.name === name);
    if (tech) {
        applyDecision(tech.effect);
    }
    pushNews('工部', `研习 ${name}，费 ${cost}两。`, 'normal');
    saveGame();
    updateUI();
    renderTech();
}

console.log('✓ 60+系统模块加载完成');

// ============================================
// 批4：新增tab渲染函数
// ============================================

function renderCourtTab() {
    try {
        if (!GameState.courtState) GameState.courtState = initCourtState();
        const tick = getMapTick();
        const lastHeld = GameState.courtState.lastHeld || -99;
        const nextIn = Math.max(0, 2 - (tick - lastHeld));
        const typeNames = { civil: '民政', military: '军务', personnel: '人事' };
        const issues = GameState.courtState.currentIssues || [];
        const issuesHtml = issues.map((iss, i) => {
            const optList = iss.opts.map(o => `<li>${o.text}</li>`).join('');
            return `<div class="court-item">
                <b>[${typeNames[iss.type]}] ${iss.title}</b>
                <div class="court-item-desc">${iss.desc}</div>
                <ul class="court-item-opts">${optList}</ul>
            </div>`;
        }).join('');
        return `<div class="tab-panel">
            <h3>早朝议政（每2章可开朝，抽取3议题各选处理方式）</h3>
            <div class="action-bar">
                <button class="cw-btn" ${nextIn > 0 ? 'disabled' : ''} onclick="openCourtSession()">
                    临朝听政${nextIn > 0 ? '（' + nextIn + '章后）' : ''}
                </button>
            </div>
            <div class="court-summary">已决 ${GameState.courtState.resolvedCount || 0} 议</div>
            ${issuesHtml ? '<h4>当前议题</h4>' + issuesHtml : ''}
            <div class="hint">反爽铁律：每选项都有权衡代价，不做白嫖爽点。议题池50+条，按剧本特色抽取。史据：《明史》本纪/列传逐条注出。</div>
        </div>`;
    } catch (e) { return '<div class="tab-panel">朝堂暂安。</div>'; }
}

function renderKejuTab() {
    try {
        if (!GameState.kejuState) GameState.kejuState = initKejuState();
        const tick = getMapTick();
        const lastHeld = GameState.kejuState.lastHeld || -99;
        const nextIn = Math.max(0, KEJU_INTERVAL - (tick - lastHeld));
        const history = (GameState.kejuState.newOfficials || []).map(h =>
            `<li>第${h.tick + 1}章 · ${h.subject}科 · 录${h.passed}人 · 入朝${h.filled}人</li>`
        ).join('');
        return `<div class="tab-panel">
            <h3>科举取士（每${KEJU_INTERVAL}章开科，选考官→选科目→录取→新官入朝）</h3>
            <div class="action-bar">
                <button class="cw-btn" ${nextIn > 0 ? 'disabled' : ''} onclick="openKejuSession()">
                    开科取士${nextIn > 0 ? '（' + nextIn + '章后）' : ''}
                </button>
            </div>
            <div class="keju-summary">历科录 ${GameState.kejuState.passCount || 0} 人 · 舞弊 ${GameState.kejuState.cheatCount || 0} 次</div>
            <h4>历科记录</h4>
            <ul class="keju-history">${history || '<li>尚无科举。</li>'}</ul>
            <div class="hint">科举有国库代价（${KEJU_COST}两），舞弊有弹劾风险。新官入朝可补充被清洗空位。史据：《明史》卷70·选举志二</div>
        </div>`;
    } catch (e) { return '<div class="tab-panel">科场暂安。</div>'; }
}

function _renderYingzaoTabFallback() {
    try {
        if (typeof renderYingzaoTab === 'function' && renderYingzaoTab !== _renderYingzaoTabFallback) {
            return renderYingzaoTab();
        }
        return '<div class="tab-panel">营造：加载中</div>';
    } catch (e) { return '<div class="tab-panel">工部暂安。</div>'; }
}
// yingzao.js加载后将覆盖renderYingzaoTab（全局），modules.js case 'yingzao' 直接调用即可
// 我们在yingzao.js加载后自动覆盖

