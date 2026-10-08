// ============================================
// 《大明国策》v6.8 批N · 山河战图（疆域区块 + 边患虚实 + 敌军压境）
// 核心升级：地图从「散点星座图」升级为「有疆域面积的活舆图」
//   1) 大明疆域轮廓 polygon（浅色版图 vs 深色域外）—— 面积感
//   2) 省州府「府印」标记（九边重镇=菱形，布政司=方块）—— 军政分明
//   3) 边患敌军可视化（红色旌旗 + 脉冲），威胁可沿路推进、逼近京畿
//   4) 王师远征标记（蓝色旌旗）—— 出师在地图可见
// 复用 map_v67.js 的坐标 / 山脉 / 河流 / 长城 / 城市 / 季节等要素与渲染函数。
// 反爽铁律：推进只增不减、平患耗饷抽兵、京畿告警削威望，绝无白嫖。
// ============================================

// ====== 边患推进路径（边境 → 腹地 / 京畿）======
const MAP_V68_THREAT_ROUTES = {
    anda:   { route: ['datong', 'xuanfu', 'jizhou', 'beizhili'], home: 'datong',   name: '俺答叩关' },
    wokou:  { route: ['zhejiang', 'fujian', 'guangdong'],     home: 'zhejiang', name: '倭寇入寇' },
    tusi:   { route: ['guizhou', 'sichuan', 'huguang'],       home: 'guizhou',  name: '土司反叛' },
    liukou: { route: ['henan', 'shanxi', 'beizhili'],         home: 'henan',    name: '流寇四起' }
};

// ====== 大明疆域轮廓（顺时针，勾勒两京十三布政司 + 九边大致版图）======
const MAP_V68_TERRITORY_POINTS = [
    [140, 250], [165, 215], [250, 195], [340, 195], [430, 200], [560, 180],
    [665, 175], [745, 170], [835, 170], [885, 185], [905, 230], [875, 262],
    [825, 280], [775, 300], [800, 318], [762, 338], [772, 362], [802, 398],
    [762, 428], [700, 448], [658, 468], [540, 470], [420, 462], [355, 448],
    [338, 408], [300, 360], [242, 320], [198, 288], [140, 250]
];

// ====== 名称解析（复用 wdRegionName / bfRegionName，带本地兜底）======
function v68RegionName(key) {
    try {
        if (typeof wdRegionName === 'function') return wdRegionName(key);
        if (typeof bfRegionName === 'function') return bfRegionName(key);
    } catch (e) {}
    try {
        if (typeof MAP_REGIONS !== 'undefined') {
            const r = MAP_REGIONS.find(x => x.key === key);
            if (r) return r.name;
        }
    } catch (e) {}
    return key;
}

// ====== 安全取省份状态 0/1/2 ======
function v68Status(key) {
    try {
        return (GameState.mapData && GameState.mapData.status) ? (GameState.mapData.status[key] || 0) : 0;
    } catch (e) { return 0; }
}

// ====== 安全取派系色 ======
function v68FactionColor(key) {
    try {
        const f = (typeof getMapV67Faction === 'function') ? getMapV67Faction(key) : 'wen官';
        return (MAP_V67_FACTION_COLOR && MAP_V67_FACTION_COLOR[f]) ? MAP_V67_FACTION_COLOR[f] : '#2E7D32';
    } catch (e) { return '#2E7D32'; }
}

// ====== 渲染大明疆域轮廓（浅色版图，金色描边，域外深色）======
function renderMapV68Territory() {
    try {
        const pts = MAP_V68_TERRITORY_POINTS.map(p => p.join(',')).join(' ');
        return `<polygon points="${pts}" fill="rgba(244,232,208,0.16)" stroke="#C9A227" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="none"/>` +
               `<polygon points="${pts}" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.4"/>`;
    } catch (e) { return ''; }
}

// ====== 渲染省州府「府印」标记（九边=菱形，布政司=方块）======
function renderMapV68Provinces() {
    try {
        const regions = (typeof MAP_REGIONS !== 'undefined' && Array.isArray(MAP_REGIONS)) ? MAP_REGIONS : [];
        if (!regions.length) return '';
        return regions.map(r => {
            const v = (typeof MAP_V67_REGIONS !== 'undefined' && MAP_V67_REGIONS[r.key]) ? MAP_V67_REGIONS[r.key] : null;
            if (!v) return '';
            const st = v68Status(r.key);
            let fill;
            if (st === 2) fill = '#D32F2F';
            else if (st === 1) fill = '#FFA000';
            else fill = v68FactionColor(r.key);
            const peakX = v.x, peakY = v.y;
            let shape;
            if (r.border) {
                // 九边重镇：菱形（军镇）
                shape = `<polygon points="${peakX},${peakY-9} ${peakX+9},${peakY} ${peakX},${peakY+9} ${peakX-9},${peakY}" fill="${fill}" stroke="#FFD700" stroke-width="2" filter="url(#province-shadow)"/>`;
            } else {
                // 布政司：圆角方块（行政）
                shape = `<rect x="${peakX-8}" y="${peakY-8}" width="16" height="16" rx="3" fill="${fill}" stroke="#FFD700" stroke-width="2" filter="url(#province-shadow)"/>`;
            }
            return `<g class="map-v68-province" data-key="${r.key}" onclick="openMapCellModal('${r.key}')" style="cursor:pointer">` +
                shape +
                `<text x="${peakX}" y="${peakY-13}" text-anchor="middle" fill="#FFD700" font-size="12" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${r.name}</text>` +
                `</g>`;
        }).join('');
    } catch (e) { return ''; }
}

// ====== 渲染边患敌军层（红色旌旗 + 脉冲；威胁越靠京畿越大）======
function renderMapV68Threats() {
    try {
        const w = GameState.warDef;
        if (!w || !w.threats) return '';
        let html = '';
        Object.keys(w.threats).forEach(k => {
            const t = w.threats[k];
            if (!t || !t.active) return;
            const v = (typeof MAP_V67_REGIONS !== 'undefined' && MAP_V67_REGIONS[t.regionKey]) ? MAP_V67_REGIONS[t.regionKey] : null;
            if (!v) return;
            const lv = t.level || 1;
            const flagW = 12 + lv * 2;   // 等级越高旗帜越大
            const flagH = 9 + lv;
            const fx = v.x, fy = v.y - 2;
            // 红色旌旗：旗杆 + 三角旗，脉冲动画（敌军压境警示）
            html += `<g class="map-v68-threat" data-key="${k}" style="cursor:pointer" onclick="openMapCellModal('${t.regionKey}')">` +
                `<line x1="${fx}" y1="${fy-flagH-4}" x2="${fx}" y2="${fy+6}" stroke="#8B0000" stroke-width="2"/>` +
                `<polygon class="map-v68-threat-flag" points="${fx},${fy-flagH-4} ${fx+flagW},${fy-flagH+2} ${fx},${fy-flagH+4}" fill="#E53935" stroke="#8B0000" stroke-width="1.5"/>` +
                `<text x="${fx}" y="${fy-flagH-10}" text-anchor="middle" fill="#FF5252" font-size="11" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${t.name}</text>` +
                `</g>`;
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 渲染王师远征标记（蓝色旌旗，在地图可见出征军队）======
function renderMapV68Expedition() {
    try {
        const exp = (GameState.mapData && GameState.mapData.expedition) ? GameState.mapData.expedition : null;
        if (!exp || !exp.key) return '';
        const v = (typeof MAP_V67_REGIONS !== 'undefined' && MAP_V67_REGIONS[exp.key]) ? MAP_V67_REGIONS[exp.key] : null;
        if (!v) return '';
        const fx = v.x + 18, fy = v.y - 2;
        return `<g class="map-v68-expedition" style="pointer-events:none">` +
            `<line x1="${fx}" y1="${fy-16}" x2="${fx}" y2="${fy+6}" stroke="#0D47A1" stroke-width="2"/>` +
            `<polygon class="map-v68-exp-flag" points="${fx},${fy-16} ${fx+16},${fy-10} ${fx},${fy-6}" fill="#42A5F5" stroke="#0D47A1" stroke-width="1.5"/>` +
            `<text x="${fx}" y="${fy-22}" text-anchor="middle" fill="#64B5F6" font-size="10" font-weight="bold" font-family="serif">王师</text>` +
            `</g>`;
    } catch (e) { return ''; }
}

// ====== 主渲染（替代 renderMapV67Tab）======
function renderMapV68Tab() {
    try {
        if (!GameState.mapData || !GameState.mapData.status) {
            GameState.mapData = initMapState(GameState.script ? GameState.script.id : 'chenghua');
        }
        const cities = (typeof MAP_V67_CITIES !== 'undefined') ? MAP_V67_CITIES.length : 0;
        const mountains = (typeof MAP_V67_MOUNTAINS !== 'undefined') ? MAP_V67_MOUNTAINS.length : 0;
        return `
            <div class="report-title">兵部 · 大明山河战图</div>
            <div class="map-legend">
                <span><i class="map-legend-dot map-green-bg"></i>安定</span>
                <span><i class="map-legend-dot map-yellow-bg"></i>警兆</span>
                <span><i class="map-legend-dot map-red-bg"></i>叛乱灾荒</span>
                <span><i class="map-legend-flag"></i>敌军压境</span>
                <span><i class="map-legend-flag map-legend-blue"></i>王师远征</span>
                <span style="margin-left:auto;color:#FFD700;font-weight:bold">${cities}城·${mountains}山·4水·长城·24府</span>
            </div>
            <div class="map-svg-wrap">
                <svg class="map-svg" viewBox="0 0 ${MAP_V67_W} ${MAP_V67_H}" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <filter id="province-shadow">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
                        </filter>
                    </defs>
                    <!-- 沙漠底色 -->
                    ${MAP_V67_DESERT.map(d => `<ellipse cx="${d.cx}" cy="${d.cy}" rx="${d.rx}" ry="${d.ry}" fill="#D2B48C" opacity="0.4"/>`).join('')}
                    <!-- 海岸线 -->
                    <path d="${MAP_V67_COAST_NORTH}" fill="#1E3A5F" opacity="0.7"/>
                    <path d="${MAP_V67_COAST_EAST}" fill="#1E3A5F" opacity="0.7"/>
                    <path d="${MAP_V67_COAST_SOUTH}" fill="#1E3A5F" opacity="0.7"/>
                    <!-- 大明疆域轮廓（浅色版图） -->
                    ${renderMapV68Territory()}
                    <!-- 山脉 -->
                    ${(typeof renderMapV67Mountains === 'function') ? renderMapV67Mountains() : ''}
                    <!-- 河流 -->
                    ${(typeof renderMapV67Rivers === 'function') ? renderMapV67Rivers() : ''}
                    <!-- 长城 -->
                    ${(typeof renderMapV67Greatwall === 'function') ? renderMapV67Greatwall() : ''}
                    <!-- 季节背景 -->
                    ${(typeof renderMapV67SeasonOverlay === 'function') ? renderMapV67SeasonOverlay() : ''}
                    <!-- 城市节点 -->
                    ${(typeof renderMapV67Cities === 'function') ? renderMapV67Cities() : ''}
                    <!-- 省州府府印 -->
                    ${renderMapV68Provinces()}
                    <!-- 边患敌军层 -->
                    ${renderMapV68Threats()}
                    <!-- 王师远征 -->
                    ${renderMapV68Expedition()}
                    <!-- 罗盘 -->
                    ${(typeof renderMapV67Compass === 'function') ? renderMapV67Compass() : ''}
                    <!-- 比例尺 -->
                    ${(typeof renderMapV67Scale === 'function') ? renderMapV67Scale() : ''}
                </svg>
            </div>
            <div class="map-note">
                据《明史·地理志》两京十三布政司、《明史·兵志》九边重镇绘就。
                敌军压境（红旗）随边患滋长北上、推进，逼近京畿则国威动摇；
                点击有红旗之府可「调兵迎击」，耗饷抽兵以平边患。
            </div>
        `;
    } catch (e) {
        try { return (typeof renderMapV67Tab === 'function') ? renderMapV67Tab() : ''; } catch (e2) { return ''; }
    }
}

// ====== 边患推进巡检（挂 advanceSeason 链，每季）======
// 反爽：威胁只增不减（除非玩家出兵平之）；推进逼近京畿则削威望。
function v68ThreatPush() {
    try { ensureWarDefState(); } catch (e) {}
    try {
        const w = GameState.warDef;
        if (!w || !w.threats) return;
        const stab = (GameState.stats && typeof GameState.stats.stability === 'number') ? GameState.stats.stability : 50;
        Object.keys(MAP_V68_THREAT_ROUTES).forEach(k => {
            const t = w.threats[k];
            if (!t || !t.active) return;
            const cfg = MAP_V68_THREAT_ROUTES[k];
            const route = cfg.route;
            let idx = route.indexOf(t.regionKey);
            if (idx < 0) idx = 0;
            const isTerminal = (idx >= route.length - 1);
            if (!isTerminal) {
                // 越乱越易推进（稳定度低 → 概率高）
                const prob = Math.max(0.15, (72 - stab) / 120);
                if (Math.random() < prob) {
                    const next = route[idx + 1];
                    t.regionKey = next;
                    t.level = Math.min(5, (t.level || 1) + 1);
                    if (GameState.mapData && GameState.mapData.status) {
                        GameState.mapData.status[next] = Math.max(GameState.mapData.status[next] || 0, 2);
                    }
                    if (typeof pushNews === 'function') {
                        pushNews('边警', '【' + (t.name || cfg.name) + '】势大，已浸至' + v68RegionName(next) + '！圣心震怒。', 'critical');
                    }
                    try { DamingSFX.play('urgent'); } catch (e) {}
                }
                // 推进后更新 idx
                idx = route.indexOf(t.regionKey);
                if (idx < 0) idx = 0;
            }
            // 已逼近京畿（终格）：每季削威望/天命，以示国威动摇
            if (idx >= route.length - 1 && t.regionKey === route[route.length - 1]) {
                if (GameState.stats) {
                    if (typeof GameState.stats.prestige === 'number') {
                        GameState.stats.prestige = Math.max(0, GameState.stats.prestige - 3);
                    }
                    if (typeof GameState.stats.mandate === 'number') {
                        GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 1);
                    }
                }
            }
        });
    } catch (e) {}
}

// ====== 在省份弹窗注入「敌军压境」处置面板（调兵迎击）======
function v68FindThreatByRegion(regionKey) {
    try {
        const w = GameState.warDef;
        if (!w || !w.threats) return null;
        let found = null;
        Object.keys(w.threats).forEach(k => {
            const t = w.threats[k];
            if (t && t.active && t.regionKey === regionKey) found = { key: k, threat: t };
        });
        return found;
    } catch (e) { return null; }
}

function v68RenderThreatActions() {
    try {
        const box = document.getElementById('map-cell-actions');
        if (!box) return;
        const key = window._mapCurrentKey;
        if (!key) return;
        const found = v68FindThreatByRegion(key);
        if (!found) return;
        const t = found.threat;
        const cfg = MAP_V68_THREAT_ROUTES[found.key];
        const route = cfg ? cfg.route : [];
        const idx = route.indexOf(t.regionKey);
        const progress = (idx >= 0 && route.length > 1) ? `${idx + 1}/${route.length}` : '';
        // 敌军压境警示块 + 调兵迎击按钮
        const warn = `<div class="v68-threat-warn">
            <div class="v68-threat-warn-title">⚔ 敌军压境 · ${t.name}（${t.level || 1}级）${progress ? ' · 已侵 ' + progress : ''}</div>
            <div class="v68-threat-warn-desc">${t.desc || ''}不速平之，势将北犯京畿，动摇国本。</div>
        </div>`;
        const btn = `<button class="map-act-btn map-act-exp v68-strike-btn" onclick="v68StrikeThreat('${found.key}')">调兵迎击（出师布阵）</button>`;
        // 插到动作区最前（避免重复注入）
        if (box.querySelector('.v68-threat-warn')) return;
        box.insertAdjacentHTML('afterbegin', warn + btn);
    } catch (e) {}
}

function v68StrikeThreat(threatKey) {
    try {
        if (typeof wrStrikeThreat === 'function') {
            const r = wrStrikeThreat(threatKey);
            if (r && r.ok) {
                try { closeMapModal(); } catch (e) {}
                return;
            }
            if (r && r.msg && typeof pushNews === 'function') {
                pushNews('兵部', r.msg, 'critical');
            }
        }
    } catch (e) {}
}

// ====== 包装省份弹窗动作渲染，追加边患处置 ======
(function () {
    try {
        const _orig = (typeof renderMapCellActions === 'function') ? renderMapCellActions : function () {};
        renderMapCellActions = function () {
            try { _orig(); } catch (e) {}
            v68RenderThreatActions();
        };
    } catch (e) {}
})();

console.log('✓ 批N·山河战图（疆域区块 + 边患虚实 + 敌军压境）加载完成');