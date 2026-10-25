// ============================================================
// 《大明国策》v7.2 批S · 势力格局可视化（map_faction.js）
// 把「文官/武将/宗室/宦官/外戚/土司」六大势力真正「画」在舆图上：
//   1) 势力范围晕染——每府投射半透明势力色，相邻连片可观「天下在谁手」
//   2) 6 派系大明正典配色——黛青/朱红/明金/绛紫/妃红/赭褐，庄重如帝王舆图
//   3) 中枢四衙据点——六部内阁/司礼监/五军都督/后妃外戚，环京师角力
//   4) 藩王府散点——秦/晋/周/楚/蜀/宁诸藩，明金标府
//   5) 斗争态势——藩王坐大/宦官专权/拥兵自重/结党/干政，阈值动态警示
//   6) 势力图例——六大势力色块 + 数值 + 据点，一眼看格局
// 铁律：纯前端零依赖；只读 GameState.factions 投影，零新 state；
//       CSS 运行时注入（追加）；全员 try-catch 守卫；覆盖式接管保留 _orig 降级。
// ============================================================

// ====== 大明正典势力色（5 大派系 + 土司）======
const V7S_FACTION_COLOR = {
    civil:    '#2E5A4A',  // 文官·黛青（六部青袍，沉郁）
    military: '#8C2F26',  // 武将·朱红（军旗之赤）
    eunuch:   '#5D3A5E',  // 宦官·绛紫（司礼监绯紫）
    royal:    '#B07F3A',  // 宗室·明金（皇胄之贵）
    consort:  '#9C5A6E',  // 外戚·妃红（椒房妃色）
    tusi:     '#6E5540'   // 土司·赭褐（土官地土）
};

const V7S_FACTION_INFO = {
    civil:    { name: '文官集团', org: '六部·内阁' },
    military: { name: '武将集团', org: '五军都督·九边' },
    royal:    { name: '宗室藩王', org: '各地藩王府' },
    eunuch:   { name: '宦官集团', org: '司礼监·禁府' },
    consort:  { name: '外戚集团', org: '后妃家族' },
    tusi:     { name: '西南土司', org: '土官世袭' }
};

// ====== 府 -> 主导派系（九边军镇→武将 / 京畿→宦官 / 西南→土司 / 腹地→文官）======
const V7S_REGION_FACTION = {
    gansu: 'military', ningxia: 'military', yansui: 'military', datong: 'military',
    xuanfu: 'military', jizhou: 'military', guyuan: 'military', shanxizhen: 'military',
    liaodong: 'military',
    beizhili: 'eunuch',
    sichuan: 'tusi', guizhou: 'tusi', yunnan: 'tusi', guangxi: 'tusi',
    shaanxi: 'civil', shanxi: 'civil', henan: 'civil', shandong: 'civil', huguang: 'civil',
    nanzhili: 'civil', jiangxi: 'civil', zhejiang: 'civil', fujian: 'civil', guangdong: 'civil'
};

// ====== 中枢四衙据点（环京师角力）======
const V7S_SEATS = [
    { name: '六部内阁', x: 744, y: 212, color: 'civil', ch: '司' },
    { name: '司礼监',   x: 744, y: 248, color: 'eunuch', ch: '监' },
    { name: '五军都督府', x: 776, y: 248, color: 'military', ch: '督' },
    { name: '后妃外戚', x: 776, y: 212, color: 'consort', ch: '戚' }
];

// ====== 藩王府散点（name / x / y / 府号）======
const V7S_ROYALS = [
    ['西安·秦王府', '秦', 460, 290],
    ['太原·晋王府', '晋', 640, 230],
    ['开封·周王府', '周', 580, 310],
    ['武昌·楚王府', '楚', 560, 370],
    ['成都·蜀王府', '蜀', 440, 360],
    ['南昌·宁王府', '宁', 640, 390]
];

// ====== 势力范围晕染（府印下叠半透明势力色，连片成「势力域」）======
function v7sRegionColor(key, st) {
    try {
        if (st === 2) return '#A83232';       // 叛乱/灾荒：赤
        if (st === 1) return '#C08A2D';       // 警兆：赭黄
        const f = V7S_REGION_FACTION[key] || 'civil';
        return V7S_FACTION_COLOR[f] || V7S_FACTION_COLOR.civil;
    } catch (e) { return '#2E5A4A'; }
}

function v7sHalo(r) {
    try {
        const st = (typeof v68Status === 'function') ? v68Status(r.key) : 0;
        const v = (typeof MAP_V67_REGIONS !== 'undefined' && MAP_V67_REGIONS[r.key]) ? MAP_V67_REGIONS[r.key] : null;
        if (!v) return '';
        const c = v7sRegionColor(r.key, st);
        return '<circle cx="' + v.x + '" cy="' + v.y + '" r="30" fill="' + c + '" opacity="0.15" stroke="none"/>';
    } catch (e) { return ''; }
}

function v7sRenderHalo() {
    try {
        const regions = (typeof MAP_REGIONS !== 'undefined' && Array.isArray(MAP_REGIONS)) ? MAP_REGIONS : [];
        if (!regions.length) return '';
        return '<g class="map-v7s-halo" style="pointer-events:none">' + regions.map(v7sHalo).join('') + '</g>';
    } catch (e) { return ''; }
}

// ====== 中枢据点 + 藩王府散点 ======
function v7sSeat(name, x, y, ckey, ch, price) {
    const color = V7S_FACTION_COLOR[ckey] || '#B07F3A';
    return '<g class="v7s-seat" style="pointer-events:none">' +
        '<rect x="' + (x - 5) + '" y="' + (y - 5) + '" width="10" height="10" rx="2" fill="' + color + '" stroke="#FFD700" stroke-width="1.1"/>' +
        '<text x="' + x + '" y="' + (y + 3.5) + '" text-anchor="middle" fill="#FFF7E6" font-size="7" font-weight="bold" font-family="serif">' + ch + '</text>' +
        '</g>';
}

function v7sRenderSeats() {
    try {
        let html = '<g class="v7s-seats" style="pointer-events:none">';
        V7S_SEATS.forEach(function (s) {
            html += v7sSeat(s.name, s.x, s.y, s.color, s.ch);
        });
        html += '</g>';
        // 藩王府：明金菱形 + 藩号
        html += '<g class="v7s-royals" style="pointer-events:none">';
        V7S_ROYALS.forEach(function (p) {
            const x = p[2], y = p[3];
            html += '<g style="pointer-events:none">' +
                '<polygon points="' + x + ',' + (y - 6) + ' ' + (x + 6) + ',' + y + ' ' + x + ',' + (y + 6) + ' ' + (x - 6) + ',' + y + '" fill="' + V7S_FACTION_COLOR.royal + '" stroke="#FFE9A8" stroke-width="0.9"/>' +
                '<text x="' + x + '" y="' + (y + 2.5) + '" text-anchor="middle" fill="#FFF3D0" font-size="5.5" font-weight="bold" font-family="serif">' + p[1] + '</text>' +
                '<text x="' + x + '" y="' + (y + 13) + '" text-anchor="middle" fill="#E8D9B8" font-size="7.5" font-family="serif">' + p[0].split('·')[1] + '</text>' +
                '</g>';
        });
        html += '</g>';
        return html;
    } catch (e) { return ''; }
}

// ====== 斗争态势（阈值动态警示）======
function v7sRenderStruggles() {
    try {
        const f = GameState.factions || {};
        const tags = [];
        if ((f.royal || 0) >= 60) tags.push([460, 272, '藩王坐大', '#D94F3D']);
        if ((f.eunuch || 0) >= 70) tags.push([744, 264, '宦官专权', '#C86A9E']);
        if ((f.military || 0) >= 70) tags.push([620, 158, '拥兵自重', '#E05A3A']);
        if ((f.civil || 0) >= 65) tags.push([744, 196, '结党', '#3D8A6E']);
        if ((f.consort || 0) >= 70) tags.push([776, 194, '干政', '#B05A7A']);
        if (!tags.length) return '';
        return '<g class="v7s-struggle" style="pointer-events:none">' + tags.map(function (t) {
            return '<text x="' + t[0] + '" y="' + t[1] + '" text-anchor="middle" fill="' + t[2] + '" font-size="9.5" font-weight="bold" font-family="serif" style="text-shadow:1px 1px 2px rgba(0,0,0,0.85)">' + t[3] + '</text>';
        }).join('') + '</g>';
    } catch (e) { return ''; }
}

// ====== 势力图例（HTML panel）======
function v7sLegendHtml() {
    try {
        const keys = ['civil', 'military', 'royal', 'eunuch', 'consort', 'tusi'];
        const items = keys.map(function (k) {
            const info = V7S_FACTION_INFO[k];
            const c = V7S_FACTION_COLOR[k];
            let val = '—';
            try {
                if (GameState.factions && typeof GameState.factions[k] === 'number') val = Math.round(GameState.factions[k]);
            } catch (e) {}
            return '<span class="v7s-leg-i">' +
                '<i style="background:' + c + '"></i>' +
                '<b style="color:' + c + '">' + info.name + '</b>' +
                '<em>' + val + '</em>' +
                '<small>' + info.org + '</small>' +
                '</span>';
        }).join('');
        return '<div class="v7s-legend"><span class="v7s-legend-t">◆ 天下势力格局 ◆</span>' + items + '</div>';
    } catch (e) { return ''; }
}

// ====== 运行时样式注入 ======
function v7sEnsureStyle() {
    try {
        if (document.getElementById('v7s-style')) return;
        const st = document.createElement('style');
        st.id = 'v7s-style';
        st.textContent = [
            '.v7s-legend{display:flex;align-items:center;gap:4px;flex-wrap:wrap;font-size:12px;color:#CBBFA8;padding:6px 10px;margin:6px 0;border:1px solid #4a3f2a;border-radius:8px;background:rgba(20,16,10,0.5)}',
            '.v7s-legend-t{font-weight:bold;color:#FFD700;letter-spacing:2px;margin-right:8px}',
            '.v7s-leg-i{display:inline-flex;align-items:center;gap:5px;margin-right:12px;white-space:nowrap}',
            '.v7s-leg-i i{display:inline-block;width:11px;height:11px;border-radius:2px;border:1px solid rgba(255,215,0,0.55)}',
            '.v7s-leg-i em{font-style:normal;color:#E8D9B8;font-weight:bold}',
            '.v7s-leg-i small{font-style:normal;color:#8E8468;font-size:10px}',
            '.v7s-seats rect{filter:drop-shadow(0 0 2px rgba(0,0,0,0.6))}',
            '.v7s-royals polygon{filter:drop-shadow(0 0 1px rgba(255,233,168,0.4))}'
        ].join('\n');
        document.head.appendChild(st);
    } catch (e) {}
}

// ====== 注入主逻辑 ======
function v7sInject(html) {
    try {
        if (!html) return html;
        const svgExtra = v7sRenderSeats() + v7sRenderStruggles();
        if (html.indexOf('</svg>') >= 0) {
            html = html.replace('</svg>', svgExtra + '</svg>');
        }
        if (html.indexOf('<div class="map-svg-wrap">') >= 0) {
            html = html.replace('<div class="map-svg-wrap">', v7sLegendHtml() + '<div class="map-svg-wrap">');
        }
        return html;
    } catch (e) { return html; }
}

// ====== 覆盖式接管（on load）======
(function () {
    try {
        // 1) 势力色接管：府印 fill 改用大明正典 6 派系色
        if (typeof v68FactionColor === 'function') {
            v68FactionColor = function (key) {
                try {
                    const f = V7S_REGION_FACTION[key] || 'civil';
                    return V7S_FACTION_COLOR[f] || V7S_FACTION_COLOR.civil;
                } catch (e) { return '#2E5A4A'; }
            };
        }
        // 2) 府印层：先铺势力范围晕染，再叠原府印（晕染在最底层不遮字）
        if (typeof renderMapV68Provinces === 'function') {
            const _origProvinces = renderMapV68Provinces;
            renderMapV68Provinces = function () {
                try {
                    return v7sRenderHalo() + _origProvinces();
                } catch (e) { return _origProvinces(); }
            };
        }
        // 3) 主图层：沙盒外再包一层，注入据点/态势/图例
        if (typeof renderMapV68Tab === 'function') {
            const _origTab = renderMapV68Tab;
            renderMapV68Tab = function () {
                try {
                    return v7sInject(_origTab());
                } catch (e) { return _origTab(); }
            };
            v7sEnsureStyle();
        }
    } catch (e) {}
})();

// ====== 首次加载：默认淡化上一轮数值标签层，让势力格局成为主视觉 ======
(function () {
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem) {
            const raw = localStorage.getItem('daming_map_layers_v1');
            if (!raw) {
                const off = {};
                ['corners', 'pop', 'res', 'cal', 'mil', 'lv'].forEach(function (k) { off[k] = 0; });
                localStorage.setItem('daming_map_layers_v1', JSON.stringify(off));
            }
        }
    } catch (e) {}
})();

console.log('✓ 批S(v7.2)·势力格局可视化（六派系势力域/中枢四衙/藩王府/斗争态势/图例）加载完成');