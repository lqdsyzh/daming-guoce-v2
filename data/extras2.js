// ============================================
// 《大明国策》v2.1 额外面板 2
// 快速推进 / 决策回放 / 派系关系 / 事件手册
// ============================================

// 快速推进：跳过年
function advanceYear() {
    if (GameState.gameOver) return;
    for (let i = 0; i < 4; i++) {
        if (GameState.gameOver) break;
        advanceSeason();
    }
}

// 派系关系图（5派系互相影响）
const FACTION_RELATIONS = {
    civil:    { eunuch: -40, consort: 30, military: 10, royal: -20, civil: 0 },
    military: { eunuch: 10, consort: 0,   civil: 10,   royal: 30, military: 0 },
    royal:    { eunuch: -30, consort: 20, civil: -20,  military: 30, royal: 0 },
    eunuch:   { civil: -40, consort: -10, military: 10, royal: -30, eunuch: 0 },
    consort:  { civil: 30,  eunuch: -10, military: 0,  royal: 20,  consort: 0 }
};

function renderFactionGraph() {
    // 简易5派系关系图
    const factions = ['civil', 'military', 'royal', 'eunuch', 'consort'];
    const cx = 300, cy = 220, r = 160;
    const positions = {};
    factions.forEach((f, i) => {
        const angle = (i / factions.length) * Math.PI * 2 - Math.PI / 2;
        positions[f] = {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r
        };
    });

    const relations = [];
    factions.forEach((a, i) => {
        factions.forEach((b, j) => {
            if (i < j) {
                const rel = FACTION_RELATIONS[a][b];
                if (rel !== 0) {
                    relations.push({ from: positions[a], to: positions[b], value: rel, a, b });
                }
            }
        });
    });

    let svg = '<svg width="600" height="440" viewBox="0 0 600 440" style="background: rgba(244,232,208,0.3); border-radius: 4px;">';

    // 连线
    relations.forEach(r => {
        const color = r.value > 0 ? '#4a6a4a' : '#8b2c1a';
        const opacity = Math.min(1, Math.abs(r.value) / 40);
        const midX = (r.from.x + r.to.x) / 2;
        const midY = (r.from.y + r.to.y) / 2;
        svg += `<line x1="${r.from.x}" y1="${r.from.y}" x2="${r.to.x}" y2="${r.to.y}" stroke="${color}" stroke-width="${Math.abs(r.value) / 10}" opacity="${opacity}" />`;
        svg += `<text x="${midX}" y="${midY - 4}" text-anchor="middle" font-size="10" fill="${color}">${r.value > 0 ? '+' : ''}${r.value}</text>`;
    });

    // 节点
    factions.forEach(f => {
        const p = positions[f];
        const val = Math.round(GameState.factions[f] || 0);
        const fill = val > 70 ? '#8b2c1a' : val > 40 ? '#b8893a' : '#4a6a4a';
        svg += `<circle cx="${p.x}" cy="${p.y}" r="36" fill="${fill}" stroke="#2a1f15" stroke-width="2" />`;
        svg += `<text x="${p.x}" y="${p.y - 4}" text-anchor="middle" font-size="12" fill="#f4e8d0" font-weight="700">${FACTIONS[f].name.substring(0, 2)}</text>`;
        svg += `<text x="${p.x}" y="${p.y + 12}" text-anchor="middle" font-size="11" fill="#f4e8d0">${val}</text>`;
    });

    svg += '</svg>';
    return svg;
}

// 事件手册
function renderEventHandbook() {
    const types = ['disaster', 'border', 'internal', 'economy', 'diplomacy', 'royal'];
    const typeNames = {
        disaster: '天灾', border: '边患', internal: '内政',
        economy: '财政', diplomacy: '外事', royal: '宗藩'
    };

    let html = '<div class="handbook-filters">';
    types.forEach(t => {
        html += `<button class="filter-btn" onclick="filterHandbook('${t}')">${typeNames[t]}</button>`;
    });
    html += '</div>';

    html += '<div id="handbook-list">';
    Object.keys(EVENTS).forEach(key => {
        const ev = EVENTS[key];
        html += renderHandbookItem(key, ev);
    });
    html += '</div>';

    return html;
}

function renderHandbookItem(key, ev) {
    return `
        <div class="handbook-item" data-type="${ev.type}" style="display:none;">
            <div class="handbook-title">${ev.title}</div>
            <div class="handbook-type">${getTypeName(ev.type)}</div>
            <div class="handbook-desc">${ev.desc}</div>
            <div class="handbook-options">
                ${ev.options.map((o, i) => `
                    <div class="handbook-option">
                        <span class="handbook-opt-text">${o.text}</span>
                        <span class="handbook-opt-hint">${formatEffectHintPublic(o.effect)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function formatEffectHintPublic(effect) {
    const parts = [];
    for (const [k, v] of Object.entries(effect)) {
        if (k === 'punishment') continue;
        const n = RESOURCES[k] ? RESOURCES[k].name :
                 FACTIONS[k] ? FACTIONS[k].name : k;
        parts.push(`${n} ${v > 0 ? '+' : ''}${v}`);
    }
    return parts.join(' | ');
}

function filterHandbook(type) {
    const items = document.querySelectorAll('.handbook-item');
    items.forEach(it => {
        if (type === 'all' || it.dataset.type === type) {
            it.style.display = 'block';
        } else {
            it.style.display = 'none';
        }
    });
    document.querySelectorAll('.handbook-filters .filter-btn').forEach(b => {
        b.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 决策回放（点历史条目看详细）
function renderDecisionHistory() {
    return `
        <p style="color: var(--ink-light); margin-bottom: 12px; font-size: 12px; font-style: italic;">
            点击下方任意政事可查看详情。共 ${GameState.history.length} 条记录。
        </p>
        <div class="decision-list">
            ${GameState.history.slice(0, 30).map((h, i) => `
                <div class="decision-item" onclick="showDecisionDetail(${i})">
                    <div class="decision-item-head">
                        <span class="decision-item-time">${h.era} · ${h.season} · ${h.month}月</span>
                        <span class="decision-item-type type-${h.type}">${getTypeName(h.type)}</span>
                    </div>
                    <div class="decision-item-title">${h.title}</div>
                    <span class="decision-item-action">${h.decision}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function showDecisionDetail(idx) {
    const h = GameState.history[idx];
    if (!h) return;
    alert(`${h.era} · ${h.season} · ${h.month}月\n${getTypeName(h.type)} · ${h.title}\n\n圣裁：${h.decision}\n\n提出：${h.from || '未知'}`);
}

console.log('✓ 额外面板2已加载');
