// ============================================
// 《大明国策》v2.1 额外面板
// 成就墙 + 史官年鉴 + 大事记
// ============================================

// 切换到"年"面板（成就/史官）
function switchToDecade() {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector('[data-tab="decade"]');
    if (tab) tab.classList.add('active');
    GameState.currentTab = 'decade';
    renderPanel('decade');
}

function renderDecade() {
    const panel = document.getElementById('center-panel');
    const review = generateDecadeReview();
    const totalAch = ACHIEVEMENTS.length;
    const unlocked = _unlockedAchievements.length;

    panel.innerHTML = `
        <div class="report-title">史官 · 考功司</div>

        <div class="decade-tabs">
            <button class="filter-btn active" onclick="switchDecadeTab('summary')">述职</button>
            <button class="filter-btn" onclick="switchDecadeTab('factions')">派系</button>
            <button class="filter-btn" onclick="switchDecadeTab('achievements')">成就</button>
            <button class="filter-btn" onclick="switchDecadeTab('handbook')">手册</button>
            <button class="filter-btn" onclick="switchDecadeTab('history')">政事</button>
        </div>

        <div id="decade-content">
            ${renderDecadeSummary(review)}
        </div>
    `;
    window._decadeTab = 'summary';
}

function switchDecadeTab(tab) {
    window._decadeTab = tab;
    document.querySelectorAll('.decade-tabs .filter-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const content = document.getElementById('decade-content');
    if (!content) return;
    switch(tab) {
        case 'summary':     content.innerHTML = renderDecadeSummary(generateDecadeReview()); break;
        case 'factions':    content.innerHTML = renderFactionGraphHTML(); break;
        case 'achievements':content.innerHTML = renderAchievementsHTML(); break;
        case 'handbook':    content.innerHTML = renderEventHandbook(); break;
        case 'history':     content.innerHTML = renderDecisionHistory(); break;
    }
}

function renderDecadeSummary(review) {
    return `
        <h3 class="section-title">十年述职</h3>
        ${renderDecadeReview(review)}

        <h3 class="section-title">本朝大事记</h3>
        <div class="timeline-events">
            ${renderTimelineEvents()}
        </div>
    `;
}

function renderFactionGraphHTML() {
    return `
        <h3 class="section-title">五派系关系图</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            绿线=合作 红线=对抗 粗细=关系强度。点击单派系查看详情。
        </p>
        <div style="text-align: center;">
            ${typeof renderFactionGraph === 'function' ? renderFactionGraph() : ''}
        </div>
        <div class="faction-detail-grid">
            ${['civil', 'military', 'royal', 'eunuch', 'consort'].map(key => {
                const f = FACTIONS[key];
                const val = Math.round(GameState.factions[key] || 0);
                return `
                    <div class="faction-detail-card">
                        <div class="faction-detail-name">${f.name}</div>
                        <div class="faction-detail-value">${val}</div>
                        <div class="faction-detail-status">${val < 30 ? '蛰伏' : val > 80 ? '跋扈' : '观望'}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderAchievementsHTML() {
    const total = ACHIEVEMENTS.length;
    const unlocked = _unlockedAchievements.length;
    return `
        <h3 class="section-title">成就墙 <span style="float:right; font-size:12px; color: var(--ink-light);">${unlocked}/${total}</span></h3>
        <div class="achievement-grid">
            ${ACHIEVEMENTS.map(a => {
                const isUnlocked = _unlockedAchievements.includes(a.id);
                return `
                    <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${a.icon}</div>
                        <div class="achievement-info">
                            <div class="achievement-name">${isUnlocked ? a.name : '???'}</div>
                            <div class="achievement-desc">${isUnlocked ? a.desc : '未解锁'}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderTimelineEvents() {
    if (typeof GameState === 'undefined' || !GameState.history) return '<div class="empty-state">尚无记录</div>';
    if (GameState.history.length === 0) {
        return '<div class="empty-state">本朝尚未有大事。请治国平天下。</div>';
    }
    return GameState.history.slice(0, 20).map(h => `
        <div class="timeline-item">
            <div class="timeline-time">${h.era} · ${h.season} · ${h.month}月 · ${h.from || ''}</div>
            <div class="timeline-title">${h.title}</div>
            <span class="timeline-decision">${h.decision}</span>
        </div>
    `).join('');
}

console.log('✓ 额外UI面板已加载');
