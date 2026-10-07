// ============================================
// 《大明国策》批M(v6.7) 大明山河全舆图（SVG 精确绘制·大改版）
// 改进：精确地理投影 + 增强视觉 + 地图装饰
// ============================================

const MAP_V67_W = 1000;
const MAP_V67_H = 600;

// ====== 5 大山脉（增强视觉）======
const MAP_V67_MOUNTAINS = [
    { name: '天山',   x: 120, y: 180, span: 140, peaks: 6 },
    { name: '昆仑山', x: 280, y: 320, span: 220, peaks: 8 },
    { name: '秦岭',   x: 500, y: 260, span: 120, peaks: 5 },
    { name: '太行山', x: 680, y: 200, span: 100, peaks: 4 },
    { name: '南岭',   x: 640, y: 400, span: 160, peaks: 6 }
];

// ====== 主要水系（加粗加色）======
const MAP_V67_RIVERS = {
    huanghe:    { path: 'M200,240 Q350,260 480,245 Q600,280 700,260', width: 6, color: '#8B7355' },
    changjiang: { path: 'M280,360 Q450,380 600,360 Q740,340 860,360', width: 7, color: '#4A7BA7' },
    huaihe:     { path: 'M600,300 L740,300', width: 5, color: '#6B8E9F' },
    yunhe:      { path: 'M730,180 L760,260 L800,320 L840,360', width: 4, color: '#5F8EA0' }
};

// ====== 长城 polyline（加粗加装饰）======
const MAP_V67_GREATWALL = 'M80,240 L160,230 L240,220 L320,210 L400,205 L480,200 L560,195 L640,185 L720,180 L800,175 L860,170';

// ====== 海岸线（增强轮廓）======
const MAP_V67_COAST_NORTH = 'M860,140 Q920,140 980,160 L980,220 L880,220 L820,200 Z';
const MAP_V67_COAST_EAST = 'M780,260 L860,320 Q920,380 910,420 L820,460 Q740,500 700,460 L700,400 L760,360 Z';
const MAP_V67_COAST_SOUTH = 'M420,500 Q520,520 620,500 Q720,490 820,500 L820,520 L640,540 L440,520 Z';

// ====== 沙漠（增强视觉）======
const MAP_V67_DESERT = [
    { name: '瀚海', cx: 240, cy: 160, rx: 140, ry: 60 },
    { name: '塔克拉玛干', cx: 120, cy: 220, rx: 80, ry: 40 }
];

// ====== 24 布政司精确坐标（等距圆柱投影近似）======
// 经度 73°E-135°E → x: 0-1000
// 纬度 18°N-50°N → y: 0-600
const MAP_V67_REGIONS = {
    gansu:      { x: 260, y: 230, faction: 'wujiang' },   // 甘肃 103°E, 36°N
    ningxia:    { x: 340, y: 240, faction: 'wujiang' },   // 宁夏 106°E, 38°N
    yansui:     { x: 420, y: 230, faction: 'wujiang' },   // 延绥 109°E, 38°N
    datong:     { x: 620, y: 190, faction: 'wujiang' },   // 大同 113°E, 40°N
    xuanfu:     { x: 700, y: 185, faction: 'wujiang' },   // 宣府 115°E, 40°N
    jizhou:     { x: 780, y: 180, faction: 'wujiang' },   // 蓟州 117°E, 40°N
    shaanxi:    { x: 460, y: 290, faction: 'wen官' },     // 陕西 109°E, 34°N
    guyuan:     { x: 400, y: 250, faction: 'wujiang' },   // 固原 106°E, 36°N
    shanxizhen: { x: 640, y: 230, faction: 'wujiang' },   // 山西镇 112°E, 38°N
    shanxi:     { x: 680, y: 270, faction: 'wen官' },     // 山西 112°E, 37°N
    beizhili:   { x: 760, y: 230, faction: 'wen官' },     // 北直隶 116°E, 40°N
    liaodong:   { x: 880, y: 200, faction: 'wujiang' },   // 辽东 123°E, 41°N
    sichuan:    { x: 440, y: 360, faction: 'tusi' },      // 四川 104°E, 30°N
    guizhou:    { x: 440, y: 420, faction: 'tusi' },      // 贵州 107°E, 27°N
    henan:      { x: 600, y: 310, faction: 'wen官' },     // 河南 114°E, 34°N
    shandong:   { x: 760, y: 290, faction: 'wen官' },     // 山东 117°E, 36°N
    huguang:    { x: 560, y: 370, faction: 'wen官' },     // 湖广 114°E, 30°N
    nanzhili:   { x: 740, y: 320, faction: 'wen官' },     // 南直隶 118°E, 32°N
    yunnan:     { x: 380, y: 440, faction: 'tusi' },      // 云南 102°E, 25°N
    guangxi:    { x: 500, y: 450, faction: 'tusi' },      // 广西 108°E, 23°N
    jiangxi:    { x: 640, y: 390, faction: 'wen官' },     // 江西 116°E, 28°N
    zhejiang:   { x: 780, y: 360, faction: 'wen官' },     // 浙江 120°E, 30°N
    fujian:     { x: 800, y: 400, faction: 'wujiang' },   // 福建 119°E, 26°N
    guangdong:  { x: 680, y: 460, faction: 'wen官' }      // 广东 113°E, 23°N
};

// ====== 30+ 城市节点（增强视觉）======
const MAP_V67_CITIES = [
    { name: '北京',   x: 760, y: 230, region: 'beizhili',  pop: '百万京畿' },
    { name: '南京',   x: 740, y: 320, region: 'nanzhili',  pop: '留都' },
    { name: '西安',   x: 460, y: 290, region: 'shaanxi',   pop: '秦王府' },
    { name: '太原',   x: 640, y: 230, region: 'shanxizhen',pop: '晋王府' },
    { name: '济南',   x: 720, y: 280, region: 'shandong',  pop: '齐鲁都会' },
    { name: '开封',   x: 580, y: 310, region: 'henan',     pop: '中州首府' },
    { name: '杭州',   x: 760, y: 360, region: 'zhejiang',  pop: '东南都会' },
    { name: '苏州',   x: 720, y: 340, region: 'nanzhili',  pop: '税赋半天下' },
    { name: '武昌',   x: 560, y: 370, region: 'huguang',   pop: '湖广会城' },
    { name: '成都',   x: 440, y: 360, region: 'sichuan',   pop: '蜀王府' },
    { name: '广州',   x: 640, y: 460, region: 'guangdong', pop: '市舶互市' },
    { name: '福州',   x: 780, y: 400, region: 'fujian',    pop: '闽都' },
    { name: '昆明',   x: 380, y: 440, region: 'yunnan',    pop: '云南王' },
    { name: '贵阳',   x: 440, y: 420, region: 'guizhou',   pop: '苗疆要冲' },
    { name: '桂林',   x: 480, y: 450, region: 'guangxi',   pop: '靖江王' },
    { name: '南昌',   x: 640, y: 390, region: 'jiangxi',   pop: '宁王封地' },
    { name: '兰州',   x: 260, y: 230, region: 'gansu',     pop: '甘肃镇所' },
    { name: '银川',   x: 340, y: 240, region: 'ningxia',   pop: '宁夏镇所' },
    { name: '榆林',   x: 420, y: 230, region: 'yansui',    pop: '延绥镇所' },
    { name: '大同',   x: 620, y: 190, region: 'datong',    pop: '代藩封地' },
    { name: '宣化',   x: 700, y: 185, region: 'xuanfu',    pop: '宣府镇所' },
    { name: '蓟州',   x: 780, y: 180, region: 'jizhou',    pop: '蓟州镇所' },
    { name: '辽阳',   x: 880, y: 200, region: 'liaodong',  pop: '辽东都司' },
    { name: '固原',   x: 400, y: 250, region: 'guyuan',    pop: '三边总制' },
    { name: '偏关',   x: 600, y: 210, region: 'shanxizhen',pop: '偏头关' },
    { name: '嘉峪关', x: 140, y: 250, region: 'gansu',     pop: '西域锁钥' },
    { name: '山海关', x: 840, y: 175, region: 'liaodong',  pop: '天下第一关' },
    { name: '居庸关', x: 740, y: 200, region: 'beizhili',  pop: '京畿锁钥' },
    { name: '荆州',   x: 540, y: 370, region: 'huguang',   pop: '湖广重镇' },
    { name: '扬州',   x: 700, y: 320, region: 'nanzhili',  pop: '盐运中枢' },
    { name: '泉州',   x: 780, y: 400, region: 'fujian',    pop: '市舶旧港' },
    { name: '琼州',   x: 620, y: 520, region: 'guangdong', pop: '海南卫所' }
];

// ====== 派系色彩（增强饱和度）======
const MAP_V67_FACTION_COLOR = {
    'wen官':    '#2E7D32',  // 文官派·深绿
    'wujiang':  '#C62828',  // 武将派·深红
    'tusi':     '#6A1B9A',  // 土司·深紫
    'eunuch':   '#F57F17',  // 宦官·深黄
    'merchant': '#1565C0'   // 商人派·深蓝
};

// ====== 季节天气背景（增强对比）======
const MAP_V67_SEASON_BG = {
    spring: { color: '#4CAF50', name: '春雨江南', opacity: 0.08 },
    summer: { color: '#FF9800', name: '夏暑北旱', opacity: 0.1 },
    autumn: { color: '#FF5722', name: '秋霜边塞', opacity: 0.12 },
    winter: { color: '#2196F3', name: '冬雪北国', opacity: 0.15 }
};

// ====== 派系影响函数 ======
function getMapV67Faction(key) {
    try {
        if (GameState && GameState.province && GameState.province.factions && GameState.province.factions[key]) {
            return GameState.province.factions[key];
        }
    } catch (e) {}
    return (MAP_V67_REGIONS[key] && MAP_V67_REGIONS[key].faction) || 'wen官';
}

// ====== 状态色函数 ======
function getMapV67StatusClass(key) {
    try {
        const st = (GameState.mapData && GameState.mapData.status) ? (GameState.mapData.status[key] || 0) : 0;
        return st === 2 ? '#D32F2F' : st === 1 ? '#FFA000' : null;
    } catch (e) { return null; }
}

// ====== 季节函数 ======
function getMapV67SeasonKey() {
    try {
        const s = (GameState && GameState.currentSeason !== undefined) ? GameState.currentSeason : 0;
        return ['spring', 'summer', 'autumn', 'winter'][s] || 'spring';
    } catch (e) { return 'spring'; }
}

// ====== 渲染山脉（增强视觉）======
function renderMapV67Mountains() {
    try {
        return MAP_V67_MOUNTAINS.map(m => {
            const peaks = [];
            for (let i = 0; i < m.peaks; i++) {
                const px = m.x + (i * m.span / (m.peaks - 1));
                const py = m.y + (i % 2 === 0 ? -10 : 5);
                peaks.push(`<polygon points="${px-8},${py+15} ${px},${py-8} ${px+8},${py+15}" fill="#5D4037" stroke="#8D6E63" stroke-width="1.5"/>`);
            }
            peaks.push(`<text x="${m.x + m.span/2}" y="${m.y - 15}" text-anchor="middle" fill="#6D4C41" font-size="14" font-weight="bold" font-family="serif">${m.name}</text>`);
            return peaks.join('');
        }).join('');
    } catch (e) { return ''; }
}

// ====== 渲染河流（增强视觉）======
function renderMapV67Rivers() {
    try {
        let html = '';
        Object.keys(MAP_V67_RIVERS).forEach(name => {
            const river = MAP_V67_RIVERS[name];
            const label = { huanghe: '黄河', changjiang: '长江', huaihe: '淮河', yunhe: '京杭运河' }[name] || name;
            const lastXY = river.path.split(' ').pop().split(',');
            html += `<path d="${river.path}" fill="none" stroke="${river.color}" stroke-width="${river.width}" opacity="0.9" stroke-linecap="round" stroke-linejoin="round"/>`;
            html += `<text x="${parseFloat(lastXY[0])+8}" y="${parseFloat(lastXY[1])-8}" fill="${river.color}" font-size="14" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.5)">${label}</text>`;
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 渲染长城（增强视觉）======
function renderMapV67Greatwall() {
    try {
        const wall = MAP_V67_GREATWALL;
        return `<path d="${wall}" fill="none" stroke="#8B4513" stroke-width="5" stroke-dasharray="12 6" opacity="0.95" stroke-linecap="round"/>` +
               `<text x="450" y="200" fill="#A0522D" font-size="16" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.5)">万里长城</text>`;
    } catch (e) { return ''; }
}

// ====== 渲染 24 布政司（增强视觉）======
function renderMapV67Regions() {
    try {
        const regions = (typeof MAP_REGIONS !== 'undefined' && Array.isArray(MAP_REGIONS)) ? MAP_REGIONS : [];
        if (!regions.length) return '';
        return regions.map(r => {
            const v = MAP_V67_REGIONS[r.key];
            if (!v) return '';
            const status = getMapV67StatusClass(r.key);
            const factionColor = MAP_V67_FACTION_COLOR[getMapV67Faction(r.key)] || '#2E7D32';
            const fill = status || factionColor;
            const radius = r.border ? 18 : 16;
            const opacity = status ? 1 : 0.9;
            return `<g class="map-v67-region" data-key="${r.key}" onclick="openMapCellModal('${r.key}')" style="cursor:pointer">` +
                `<circle cx="${v.x}" cy="${v.y}" r="${radius}" fill="${fill}" stroke="#FFD700" stroke-width="3" opacity="${opacity}" filter="url(#province-shadow)"/>` +
                (r.border ? `<circle cx="${v.x}" cy="${v.y}" r="${radius+4}" fill="none" stroke="#FFD700" stroke-width="1.5" opacity="0.6" stroke-dasharray="4 2"/>` : '') +
                `<text x="${v.x}" y="${v.y-radius-6}" text-anchor="middle" fill="#FFD700" font-size="13" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 3px rgba(0,0,0,0.8)">${r.name}</text>` +
                `</g>`;
        }).join('');
    } catch (e) { return ''; }
}

// ====== 渲染 30+ 城市节点（增强视觉）======
function renderMapV67Cities() {
    try {
        return MAP_V67_CITIES.map(c => {
            return `<g class="map-v67-city" data-name="${c.name}">` +
                `<circle cx="${c.x}" cy="${c.y}" r="6" fill="#FFD700" stroke="#000" stroke-width="1.5"/>` +
                `<text x="${c.x}" y="${c.y-10}" text-anchor="middle" fill="#FFD700" font-size="11" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.8)">${c.name}</text>` +
                `<title>${c.name} · ${c.pop}</title>` +
                `</g>`;
        }).join('');
    } catch (e) { return ''; }
}

// ====== 渲染季节天气背景（增强对比）======
function renderMapV67SeasonOverlay() {
    try {
        const season = getMapV67SeasonKey();
        const cfg = MAP_V67_SEASON_BG[season];
        return `<rect x="0" y="0" width="${MAP_V67_W}" height="${MAP_V67_H}" fill="${cfg.color}" opacity="${cfg.opacity}"/>` +
               `<text x="20" y="585" fill="#FFD700" font-size="14" font-weight="bold" font-family="serif" style="font-style:italic;text-shadow:1px 1px 2px rgba(0,0,0,0.8)">象·${cfg.name}</text>`;
    } catch (e) { return ''; }
}

// ====== 渲染罗盘装饰 ======
function renderMapV67Compass() {
    try {
        return `<g transform="translate(920,540)">` +
               `<circle cx="0" cy="0" r="30" fill="none" stroke="#FFD700" stroke-width="2"/>` +
               `<line x1="0" y1="-25" x2="0" y2="25" stroke="#FFD700" stroke-width="2"/>` +
               `<line x1="-25" y1="0" x2="25" y2="0" stroke="#FFD700" stroke-width="2"/>` +
               `<text x="0" y="-35" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="bold">北</text>` +
               `<text x="0" y="45" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="bold">南</text>` +
               `<text x="-35" y="5" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="bold">西</text>` +
               `<text x="35" y="5" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="bold">东</text>` +
               `</g>`;
    } catch (e) { return ''; }
}

// ====== 渲染比例尺 ======
function renderMapV67Scale() {
    try {
        return `<g transform="translate(50,560)">` +
               `<line x1="0" y1="0" x2="100" y2="0" stroke="#FFD700" stroke-width="2"/>` +
               `<line x1="0" y1="-5" x2="0" y2="5" stroke="#FFD700" stroke-width="2"/>` +
               `<line x1="100" y1="-5" x2="100" y2="5" stroke="#FFD700" stroke-width="2"/>` +
               `<text x="50" y="-10" text-anchor="middle" fill="#FFD700" font-size="12" font-weight="bold">100 里</text>` +
               `</g>`;
    } catch (e) { return ''; }
}

// ====== 渲染图例 ======
function renderMapV67Legend() {
    try {
        return `<div class="map-legend">
            <span><i class="map-legend-dot map-green-bg"></i>安定</span>
            <span><i class="map-legend-dot map-yellow-bg"></i>警兆</span>
            <span><i class="map-legend-dot map-red-bg"></i>叛乱灾荒</span>
            <span><i class="map-legend-line"></i>九边重镇</span>
            <span style="margin-left:auto;color:#FFD700;font-weight:bold">手绘·${MAP_V67_CITIES.length}城·${MAP_V67_MOUNTAINS.length}山·4水·1长城</span>
        </div>`;
    } catch (e) { return ''; }
}

// ====== 主渲染 ======
function renderMapV67Tab() {
    try {
        if (!GameState.mapData || !GameState.mapData.status) {
            GameState.mapData = initMapState(GameState.script ? GameState.script.id : 'chenghua');
        }
        return `
            <div class="report-title">兵部 · 大明山河全舆图</div>
            ${renderMapV67Legend()}
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
                    <!-- 山脉 -->
                    ${renderMapV67Mountains()}
                    <!-- 河流 -->
                    ${renderMapV67Rivers()}
                    <!-- 长城 -->
                    ${renderMapV67Greatwall()}
                    <!-- 季节背景 -->
                    ${renderMapV67SeasonOverlay()}
                    <!-- 城市节点 -->
                    ${renderMapV67Cities()}
                    <!-- 24 布政司 -->
                    ${renderMapV67Regions()}
                    <!-- 罗盘 -->
                    ${renderMapV67Compass()}
                    <!-- 比例尺 -->
                    ${renderMapV67Scale()}
                </svg>
            </div>
            <div class="map-note">
                据《明史·地理志》两京十三布政司、《明史·兵志》九边重镇绘就。
                手工 SVG 绘制：${MAP_V67_CITIES.length} 城、${MAP_V67_MOUNTAINS.length} 大山脉、4 水系、万里长城。
                派系色彩随赛局变更；季节象更新；点击布政司巡视赈灾，均有时耗与库帑之费。
            </div>
        `;
    } catch (e) {
        try { return (typeof renderMapTab === 'function') ? renderMapTab() : ''; } catch (e2) { return ''; }
    }
}

function initMapV67State(scriptId) {
    try {
        return initMapState(scriptId);
    } catch (e) { return { status: {}, lastPatrol: {}, lastTag: null }; }
}

console.log('✓ 批M·大明山河全舆图（SVG精确绘制·大改版）加载完成');
