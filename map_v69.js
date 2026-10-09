// ============================================================
// 《大明国策》v6.9 批O · 真舆图（map_v69.js）
// 核心升级：地图从「手绘 SVG」升级为「真实历史疆域矢量舆图」
//   1) 大明疆域 + 8 邻国 = historical-basemaps world_1600.geojson 真实矢量
//      （1600 年万历朝，CC-BY-SA 4.0），等距圆柱投影 + Sutherland-Hodgman 裁剪
//   2) 城市 / 布政司 / 长城 / 河流 / 山脉 / 沙漠 全部按真实经纬度重投影
//   3) 地图功能增强：域外政权标注、悬停名称、数据来源署名、真实地理读图
// 复用：v67 城市/季节/罗盘/比例尺、v68 府印/边患/远征（坐标已由 geo_ming.js 纠正）
// 反爽铁律不变：边患推进只增不减、平患耗饷抽兵、京畿告警削威望，绝无白嫖。
// ============================================================

// ====== 邻国 path 质心（用于名称标注）======
function v69Centroid(ds) {
    try {
        let sx = 0, sy = 0, n = 0;
        ds.forEach(d => {
            const m = d.match(/-?[\d.]+,-?[\d.]+/g);
            if (!m) return;
            m.forEach(pair => {
                const p = pair.split(',');
                sx += parseFloat(p[0]); sy += parseFloat(p[1]); n++;
            });
        });
        if (!n) return { x: 0, y: 0 };
        return { x: Math.round(sx / n), y: Math.round(sy / n) };
    } catch (e) { return { x: 0, y: 0 }; }
}

// ====== 海域底色（东海南海日本海，深蓝）======
function renderMapV69Sea() {
    return `<rect x="0" y="0" width="${MAP_V67_W}" height="${MAP_V67_H}" fill="#0E2233"/>`;
}

// ====== 沙漠（塞外）======
function renderMapV69Desert() {
    try {
        if (typeof MING_DESERT_REAL === 'undefined') return '';
        return MING_DESERT_REAL.map(d =>
            `<ellipse cx="${d.cx}" cy="${d.cy}" rx="${d.rx}" ry="${d.ry}" fill="#D2B48C" opacity="0.26"/>` +
            `<text x="${d.cx}" y="${d.cy + 2}" text-anchor="middle" fill="#BFA98A" font-size="11" font-family="serif" opacity="0.7" style="font-style:italic">${d.name}</text>`
        ).join('');
    } catch (e) { return ''; }
}

// ====== 邻国（域外政权，弱化暗色，悬停显示国名）======
function renderMapV69Neighbors() {
    try {
        if (typeof MING_NEIGHBORS_REAL === 'undefined') return '';
        let html = '';
        MING_NEIGHBORS_REAL.forEach(n => {
            n.paths.forEach(d => {
                html += `<path d="${d}" fill="${n.color}" opacity="0.5" stroke="#0A1118" stroke-width="1"/>`;
            });
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 邻国名称标注 ======
function renderMapV69NeighborLabels() {
    try {
        if (typeof MING_NEIGHBORS_REAL === 'undefined') return '';
        return MING_NEIGHBORS_REAL.map(n => {
            const c = v69Centroid(n.paths);
            return `<text x="${c.x}" y="${c.y}" text-anchor="middle" fill="#CBBFA8" font-size="13" font-weight="bold" font-family="serif" opacity="0.85" style="text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${n.cn}</text>`;
        }).join('');
    } catch (e) { return ''; }
}

// ====== 大明疆域（真实矢量，淡金版图 + 金色描边）======
function renderMapV69Territory() {
    try {
        if (typeof MING_TERRITORY_REAL === 'undefined') return '';
        let html = '';
        MING_TERRITORY_REAL.forEach(d => {
            html += `<path d="${d}" fill="rgba(244,232,208,0.16)" stroke="#C9A227" stroke-width="2.5" stroke-linejoin="round"/>`;
        });
        // 光晕描边
        MING_TERRITORY_REAL.forEach(d => {
            html += `<path d="${d}" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.35"/>`;
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 山脉（真实位置）======
function renderMapV69Mountains() {
    try {
        if (typeof MING_MOUNTAINS_REAL === 'undefined') return '';
        return MING_MOUNTAINS_REAL.map(m => {
            const peaks = [];
            for (let i = 0; i < m.peaks; i++) {
                const px = m.x + (i * m.span / (m.peaks - 1));
                const py = m.y + (i % 2 === 0 ? -8 : 4);
                peaks.push(`<polygon points="${px-7},${py+13} ${px},${py-7} ${px+7},${py+13}" fill="#5D4037" stroke="#8D6E63" stroke-width="1.2"/>`);
            }
            peaks.push(`<text x="${m.x + m.span/2}" y="${m.y - 13}" text-anchor="middle" fill="#6D4C41" font-size="13" font-weight="bold" font-family="serif" opacity="0.9" style="text-shadow:1px 1px 2px rgba(0,0,0,0.4)">${m.name}</text>`);
            return peaks.join('');
        }).join('');
    } catch (e) { return ''; }
}

// ====== 河流（真实走向）======
function renderMapV69Rivers() {
    try {
        if (typeof MING_RIVERS_REAL === 'undefined') return '';
        let html = '';
        MING_RIVERS_REAL.forEach(r => {
            const m = r.path.match(/-?[\d.]+,-?[\d.]+/g);
            const last = m ? m[m.length - 1].split(',') : ['0','0'];
            html += `<path d="${r.path}" fill="none" stroke="${r.color}" stroke-width="${r.width}" opacity="0.88" stroke-linecap="round" stroke-linejoin="round"/>`;
            html += `<text x="${parseFloat(last[0]) + 8}" y="${parseFloat(last[1]) - 6}" fill="${r.color}" font-size="13" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.5)">${r.name}</text>`;
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 长城（真实九边，山海关至嘉峪关）======
function renderMapV69Greatwall() {
    try {
        if (typeof MING_GREATWALL_REAL === 'undefined') return '';
        return `<path d="${MING_GREATWALL_REAL.path}" fill="none" stroke="#8B4513" stroke-width="5" stroke-dasharray="12 6" opacity="0.95" stroke-linecap="round" stroke-linejoin="round"/>` +
               `<text x="480" y="68" fill="#A0522D" font-size="15" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.5)">万里长城</text>`;
    } catch (e) { return ''; }
}

// ====== 图例 ======
function renderMapV69Legend() {
    try {
        const n = (typeof MING_NEIGHBORS_REAL !== 'undefined') ? MING_NEIGHBORS_REAL.length : 8;
        return `<div class="map-legend">
            <span><i class="map-legend-dot map-green-bg"></i>安定</span>
            <span><i class="map-legend-dot map-yellow-bg"></i>警兆</span>
            <span><i class="map-legend-dot map-red-bg"></i>叛乱灾荒</span>
            <span><i class="map-legend-flag"></i>敌军压境</span>
            <span><i class="map-legend-flag map-legend-blue"></i>王师远征</span>
            <span><i style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#5A564C"></i>域外</span>
            <span style="margin-left:auto;color:#FFD700;font-weight:bold">真舆图·${n}邻国·32城·长城</span>
        </div>`;
    } catch (e) { return ''; }
}

// ====== 主渲染（真实历史疆域舆图）======
function renderMapV69Tab() {
    try {
        if (!GameState.mapData || !GameState.mapData.status) {
            GameState.mapData = initMapState(GameState.script ? GameState.script.id : 'chenghua');
        }
        return `
            <div class="report-title">兵部 · 大明真舆图</div>
            ${renderMapV69Legend()}
            <div class="map-svg-wrap">
                <svg class="map-svg" viewBox="0 0 ${MAP_V67_W} ${MAP_V67_H}" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <filter id="province-shadow">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
                        </filter>
                    </defs>
                    <!-- 海域底色 -->
                    ${renderMapV69Sea()}
                    <!-- 沙漠（塞外） -->
                    ${renderMapV69Desert()}
                    <!-- 域外政权 -->
                    ${renderMapV69Neighbors()}
                    ${renderMapV69NeighborLabels()}
                    <!-- 大明疆域（真实矢量） -->
                    ${renderMapV69Territory()}
                    <!-- 山脉 -->
                    ${renderMapV69Mountains()}
                    <!-- 河流 -->
                    ${renderMapV69Rivers()}
                    <!-- 长城 -->
                    ${renderMapV69Greatwall()}
                    <!-- 季节背景 -->
                    ${(typeof renderMapV67SeasonOverlay === 'function') ? renderMapV67SeasonOverlay() : ''}
                    <!-- 城市节点（坐标已真实化） -->
                    ${(typeof renderMapV67Cities === 'function') ? renderMapV67Cities() : ''}
                    <!-- 省州府府印（坐标已真实化） -->
                    ${(typeof renderMapV68Provinces === 'function') ? renderMapV68Provinces() : ''}
                    <!-- 边患敌军层 -->
                    ${(typeof renderMapV68Threats === 'function') ? renderMapV68Threats() : ''}
                    <!-- 王师远征 -->
                    ${(typeof renderMapV68Expedition === 'function') ? renderMapV68Expedition() : ''}
                    <!-- 罗盘 -->
                    ${(typeof renderMapV67Compass === 'function') ? renderMapV67Compass() : ''}
                    <!-- 比例尺 -->
                    ${(typeof renderMapV67Scale === 'function') ? renderMapV67Scale() : ''}
                </svg>
            </div>
            <div class="map-note">
                疆域据 historical-basemaps（CC-BY-SA 4.0）1600 年世界历史疆域矢量绘就，
                含两京十三布政司、九边重镇及朝鲜、安南、乌斯藏、缅甸、日本等八邻国；
                城市、长城、河山皆按真实经纬度投影。敌军压境（红旗）随边患北上，
                逼近京畿则国威动摇；点击有红旗之府可「调兵迎击」，耗饷抽兵以平边患。
            </div>
        `;
    } catch (e) {
        try { return (typeof renderMapV68Tab === 'function') ? renderMapV68Tab() : ((typeof renderMapV67Tab === 'function') ? renderMapV67Tab() : ''); } catch (e2) { return ''; }
    }
}

// ====== 接管地图 tab 渲染（modules.js 已优先调 renderMapV68Tab）======
(function () {
    try {
        // 保留 v68 的山河战图函数引用（部分标记层仍复用），但主渲染切到真实疆域版
        if (typeof renderMapV68Tab === 'function') {
            renderMapV68Tab = renderMapV69Tab;
        }
    } catch (e) {}
})();

console.log('✓ 批O·真舆图（真实历史疆域矢量 + 地理坐标）加载完成');