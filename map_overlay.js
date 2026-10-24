// ============================================================
// 《大明国策》v7.1 批R · 地图数据大具现（map_overlay.js）
// 把大量游戏状态数据「直接、肉眼可见」地铺到真舆图上：
//   1) 四角全局状态角标（天命国本/国库府藏/民生市井/军威边烽）
//   2) 城俗人口标签层（32 城民俗语义直接标注于城名之下）
//   3) 资源产地层（盐场/铁场/银矿/市舶港/漕运节点）
//   4) 灾异警示层（⚠ + 灾种直接落府坐标）
//   5) 军力具现层（京/边/水三营 Lv + 火器 + 挂帅 + 外任将领散落镇所）
//   6) 边患等级数字强化（Lv 直标敌军所在府）
//   7) 图层开关面板（偏好存 localStorage，不碰存档链）
// 铁律：纯前端零依赖；只读已有 GameState 投影，零新 state；
//       CSS 运行时注入（追加）；全员 try-catch 守卫；
//       覆盖式接管 renderMapV68Tab，保留 _orig 降级。
// ============================================================

// ====== 图层清单（id -> 中文名，开关面板按此列）======
const V7OL_LS_KEY = 'daming_map_layers_v1';
const V7OL_LAYERS = {
    corners: '四角角标',
    pop:     '城俗标签',
    res:     '资源产地',
    cal:     '灾异警示',
    mil:     '军力布防',
    lv:      '边患等级'
};

// ====== 外任将领镇所（中文 base -> 府 key）======
const V7OL_BASE_REGION = {
    '延绥': 'yansui',   '大同': 'datong',   '两广': 'guangdong',
    '宁夏': 'ningxia',  '南赣': 'jiangxi',  '固原': 'guyuan',
    '辽东': 'liaodong', '蓟辽': 'jizhou',   '宣大': 'xuanfu',
    '九边': 'datong'
};

// ====== 灾种 -> 主要落点府 ======
const V7OL_CALAMITY_REGION = {
    '旱': 'shaanxi', '涝': 'nanzhili', '蝗': 'shandong',
    '震': 'shaanxi', '疫': 'huguang'
};

// ====== 资源产地（盐/铁/银/舶）======
const V7OL_RESOURCE = [
    { kind: '盐', name: '扬州盐场', x: 700, y: 334 },
    { kind: '盐', name: '长芦盐场', x: 726, y: 306 },
    { kind: '盐', name: '宁夏盐池', x: 335, y: 252 },
    { kind: '铁', name: '遵化铁场', x: 792, y: 196 },
    { kind: '铁', name: '佛山铁场', x: 655, y: 452 },
    { kind: '银', name: '滇南银矿', x: 378, y: 452 },
    { kind: '舶', name: '广州市舶', x: 652, y: 472 },
    { kind: '舶', name: '泉州市舶', x: 778, y: 414 },
    { kind: '舶', name: '宁波市舶', x: 798, y: 352 }
];

// ====== 漕运（京杭运河）节点 ======
const V7OL_CANAL = [['漕', 735, 185], ['漕', 765, 265], ['漕', 805, 325], ['漕', 845, 365]];

// ====== 工具 ======
function v7olEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function v7olN(v) { return (v == null || isNaN(v)) ? '—' : Math.round(v); }
function v7olFmt(v) {
    if (v == null) return '—';
    v = Math.round(v);
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    return '' + v;
}
// 低值红、中值黄、高值绿（用于天命/威望/稳定/景气/军心等越高越好者）
function v7olC(v, mid) {
    if (v == null || isNaN(v)) return '';
    if (v < mid) return '#FF6B6B';
    if (v < mid + 20) return '#FFC66D';
    return '#8CE06B';
}
function v7olPoint(key) {
    try {
        const p = (typeof MAP_V67_REGIONS !== 'undefined' && MAP_V67_REGIONS[key]) ? MAP_V67_REGIONS[key] : null;
        return p || { x: 600, y: 310 };
    } catch (e) { return { x: 600, y: 310 }; }
}

// ====== localStorage 偏好（图层开关）======
function v7olLsGet() {
    const d = {};
    Object.keys(V7OL_LAYERS).forEach(function (k) { d[k] = 1; });
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem) {
            const raw = localStorage.getItem(V7OL_LS_KEY);
            if (raw) {
                const o = JSON.parse(raw);
                Object.keys(d).forEach(function (k) { if (typeof o[k] === 'number') d[k] = o[k]; });
            }
        }
    } catch (e) {}
    return d;
}
function v7olLsSet(o) {
    try {
        if (typeof localStorage !== 'undefined' && localStorage.setItem) {
            localStorage.setItem(V7OL_LS_KEY, JSON.stringify(o));
        }
    } catch (e) {}
}
function v7olOn(name) { return v7olLsGet()[name] === 1; }
function v7olToggle(name, on) {
    try {
        const g = document.getElementById('v7ol-' + name);
        if (g) g.style.display = on ? '' : 'none';
        const ls = v7olLsGet(); ls[name] = on ? 1 : 0; v7olLsSet(ls);
    } catch (e) {}
}
function v7olWrap(name, inner) {
    const on = v7olOn(name);
    return '<g id="v7ol-' + name + '"' + (on ? '' : ' style="display:none"') + '>' + inner + '</g>';
}

// ====== 四角状态角标 ======
function v7olCorner(x, y, title, rows, align) {
    try {
        const pad = 8, lh = 15, titleH = 15, w = 176;
        const h = pad * 2 + titleH + rows.length * lh;
        const ax = align === 'right' ? x - w : x;
        const tx = align === 'right' ? x - pad : ax + pad;
        let html = '<g class="v7ol-corner">';
        html += '<rect x="' + ax + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="rgba(8,12,18,0.72)" stroke="rgba(201,162,39,0.55)" stroke-width="1"/>';
        html += '<text x="' + tx + '" y="' + (y + titleH) + '" text-anchor="' + (align === 'right' ? 'end' : 'start') + '" fill="#FFD700" font-size="12" font-weight="bold" font-family="serif">' + v7olEsc(title) + '</text>';
        rows.forEach(function (r, i) {
            const yy = y + titleH + pad + lh * i + lh;
            html += '<text x="' + tx + '" y="' + yy + '" text-anchor="' + (align === 'right' ? 'end' : 'start') + '" fill="' + (r.color || '#E8DCC0') + '" font-size="11" font-family="serif">' + v7olEsc(r.label) + ' ' + v7olEsc(r.val) + '</text>';
        });
        html += '</g>';
        return html;
    } catch (e) { return ''; }
}
function v7olRenderCorners() {
    try {
        const s = GameState.stats || {};
        const e = GameState.econ || {};
        const z = GameState.zaiyi || {};
        const w = GameState.warDef || {};
        const f = GameState.factions || {};
        const m = GameState.milOps || {};
        const pend = (z.pending && Array.isArray(z.pending)) ? z.pending.length : 0;
        let threats = 0;
        try { if (w.threats) Object.keys(w.threats).forEach(function (k) { if (w.threats[k] && w.threats[k].active) threats++; }); } catch (e) {}
        const grain = (e.prices && e.prices.grain) ? e.prices.grain.v : 1;
        const fa = (typeof firearmName === 'function') ? firearmName(m.firearms || 0) : '无';
        let html = '';
        html += v7olCorner(10, 12, '天命国本', [
            { label: '天命', val: v7olN(s.mandate), color: v7olC(s.mandate, 40) },
            { label: '威望', val: v7olN(s.prestige), color: v7olC(s.prestige, 40) },
            { label: '稳定', val: v7olN(s.stability), color: v7olC(s.stability, 40) }
        ], 'left');
        html += v7olCorner(990, 12, '国库府藏', [
            { label: '库银', val: v7olFmt(s.treasury) + '两', color: '' },
            { label: '存粮', val: v7olFmt(s.food) + '石', color: '' },
            { label: '军饷', val: v7olFmt(s.militaryFood) + '石', color: '' }
        ], 'right');
        html += v7olCorner(10, 425, '民生市井', [
            { label: '景气', val: v7olN(e.prosperity), color: v7olC(e.prosperity, 50) },
            { label: '粮价', val: (grain * 1).toFixed(2) + '×', color: grain > 1.15 ? '#FF6B6B' : '' },
            { label: '灾异', val: pend + '起', color: pend > 0 ? '#FF6B6B' : '' }
        ], 'left');
        html += v7olCorner(990, 425, '军威边烽', [
            { label: '兵力', val: v7olFmt(s.militaryPower), color: '' },
            { label: '边患', val: threats + '路', color: threats > 0 ? '#FF5252' : '' },
            { label: '火器', val: fa, color: '' },
            { label: '军心', val: v7olN(f.military), color: v7olC(f.military, 50) }
        ], 'right');
        return html;
    } catch (e) { return ''; }
}

// ====== 城俗人口标签层（32 城民俗直标）======
function v7olRenderPop() {
    try {
        if (typeof MAP_V67_CITIES === 'undefined') return '';
        return MAP_V67_CITIES.map(function (c) {
            return '<text x="' + c.x + '" y="' + (c.y + 18) + '" text-anchor="middle" fill="#d8cbb0" font-size="8.5" font-family="serif" opacity="0.88">' + v7olEsc(c.pop) + '</text>';
        }).join('');
    } catch (e) { return ''; }
}

// ====== 资源产地层 ======
function v7olRenderResource() {
    try {
        const e = GameState.econ || {};
        const shiboOpen = (e.shibo === 1);
        let html = '';
        V7OL_RESOURCE.forEach(function (r, idx) {
            const isPort = r.kind === '舶';
            const fill = isPort ? (shiboOpen ? '#1E8449' : '#5A564C') : '#6B4F22';
            const stroke = isPort ? (shiboOpen ? '#7DCEA0' : '#8a8577') : '#C9A227';
            html += '<g><rect x="' + (r.x - 6) + '" y="' + (r.y - 6) + '" width="12" height="12" rx="2" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1"/>';
            html += '<text x="' + r.x + '" y="' + (r.y + 4) + '" text-anchor="middle" fill="#FFF6DD" font-size="9" font-family="serif">' + r.kind + '</text>';
            if (isPort) html += '<text x="' + r.x + '" y="' + (r.y - 8) + '" text-anchor="middle" fill="#CBBFA8" font-size="8" font-family="serif">' + (shiboOpen ? '通' : '禁') + '</text>';
            html += '</g>';
        });
        V7OL_CANAL.forEach(function (p) {
            html += '<text x="' + p[1] + '" y="' + p[2] + '" text-anchor="middle" fill="#5F8EA0" font-size="8.5" font-family="serif">漕</text>';
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 灾异警示层 ======
function v7olRenderCalamity() {
    try {
        const z = GameState.zaiyi || {};
        if (!z.pending || !z.pending.length) return '';
        const used = {};
        return z.pending.map(function (p, i) {
            const key = V7OL_CALAMITY_REGION[p.key] || 'henan';
            const pt = v7olPoint(key);
            const off = (used[key] = (used[key] || 0) + 1);
            const x = pt.x + (off - 1) * 24, y = pt.y - 32 - (off - 1) * 15;
            return '<g><text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="14" fill="#FF5252" font-weight="bold" font-family="serif">⚠</text>' +
                '<text x="' + x + '" y="' + (y + 12) + '" text-anchor="middle" fill="#FF8A80" font-size="8.5" font-family="serif">' + v7olEsc(p.label) + '</text></g>';
        }).join('');
    } catch (e) { return ''; }
}

// ====== 军力具现层 ======
function v7olMilTag(x, y, ch, lv, color) {
    return '<g><circle cx="' + x + '" cy="' + y + '" r="8" fill="rgba(8,12,18,0.6)" stroke="' + color + '" stroke-width="1.5"/>' +
        '<text x="' + x + '" y="' + (y + 3) + '" text-anchor="middle" fill="' + color + '" font-size="9" font-family="serif">' + ch + '</text>' +
        '<text x="' + x + '" y="' + (y + 16) + '" text-anchor="middle" fill="#E8DCC0" font-size="8" font-family="serif">Lv' + (lv || 1) + '</text></g>';
}
function v7olRenderMilitary() {
    try {
        const m = GameState.milOps || {};
        const camps = m.camps || {};
        let html = '';
        html += v7olMilTag(726, 200, '京', camps.jing, '#42A5F5');
        html += v7olMilTag(645, 196, '边', camps.bian, '#EF5350');
        html += v7olMilTag(700, 348, '水', camps.shui, '#26A69A');
        const fa = (typeof firearmName === 'function') ? firearmName(m.firearms || 0) : '';
        if (fa && fa !== '无') {
            html += '<text x="760" y="264" text-anchor="middle" fill="#FFD54F" font-size="9" font-family="serif">火·' + v7olEsc(fa) + '</text>';
        }
        if (m.marshal) {
            html += '<text x="760" y="250" text-anchor="middle" fill="#FFD700" font-size="10" font-weight="bold" font-family="serif">帅·' + v7olEsc(m.marshal) + '</text>';
        }
        try {
            const list = (GameState.generals && GameState.generals.list) ? GameState.generals.list : [];
            list.forEach(function (g) {
                if (g.status !== '外任') return;
                const key = V7OL_BASE_REGION[g.base] || 'datong';
                const pt = v7olPoint(key);
                html += '<text x="' + pt.x + '" y="' + (pt.y + 18) + '" text-anchor="middle" fill="#90CAF9" font-size="9" font-family="serif">将' + v7olEsc(g.name) + '</text>';
            });
        } catch (e) {}
        return html;
    } catch (e) { return ''; }
}

// ====== 边患等级数字强化 ======
function v7olRenderThreatLevel() {
    try {
        const w = GameState.warDef || {};
        if (!w.threats) return '';
        let html = '';
        Object.keys(w.threats).forEach(function (k) {
            const t = w.threats[k];
            if (!t || !t.active) return;
            const pt = v7olPoint(t.regionKey);
            html += '<text x="' + (pt.x + 20) + '" y="' + (pt.y + 8) + '" text-anchor="middle" fill="#FF5252" font-size="10" font-weight="bold" font-family="serif">Lv' + (t.level || 1) + '</text>';
        });
        return html;
    } catch (e) { return ''; }
}

// ====== 图层开关面板 ======
function v7olPanelHtml() {
    let html = '<div class="v7ol-panel" id="v7ol-panel"><span class="v7ol-panel-t">地图数据</span>';
    Object.keys(V7OL_LAYERS).forEach(function (k) {
        const on = v7olOn(k);
        html += '<label class="v7ol-lb"><input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="v7olToggle(\'' + k + '\',this.checked)">' + v7olEsc(V7OL_LAYERS[k]) + '</label>';
    });
    html += '</div>';
    return html;
}

// ====== 样式运行时注入（追加）======
function v7olEnsureStyle() {
    try {
        if (typeof document === 'undefined') return;
        if (document.getElementById('v7ol-style')) return;
        const st = document.createElement('style');
        st.id = 'v7ol-style';
        st.textContent = `
.v7ol-panel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:#CBBFA8;padding:6px 10px;margin:6px 0;border:1px solid #4a3f2a;border-radius:8px;background:rgba(20,16,10,0.5)}
.v7ol-panel-t{font-weight:bold;color:#FFD700;letter-spacing:1px}
.v7ol-panel label{display:inline-flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap}
.v7ol-panel input{margin:0;accent-color:#C9A227}
.v7ol-corner text{pointer-events:none}
`;
        document.head.appendChild(st);
    } catch (e) {}
}

// ====== 注入主逻辑 ======
function v7olInject(html) {
    try {
        if (!html) return html;
        const layers =
            v7olWrap('corners', v7olRenderCorners()) +
            v7olWrap('pop', v7olRenderPop()) +
            v7olWrap('res', v7olRenderResource()) +
            v7olWrap('cal', v7olRenderCalamity()) +
            v7olWrap('mil', v7olRenderMilitary()) +
            v7olWrap('lv', v7olRenderThreatLevel());
        if (html.indexOf('</svg>') >= 0) {
            html = html.replace('</svg>', layers + '</svg>');
        }
        if (html.indexOf('<div class="map-svg-wrap">') >= 0) {
            html = html.replace('<div class="map-svg-wrap">', v7olPanelHtml() + '<div class="map-svg-wrap">');
        }
        return html;
    } catch (e) { return html; }
}

// ====== 覆盖式接管地图 tab 渲染 ======
(function () {
    try {
        if (typeof renderMapV68Tab === 'function') {
            const _origMapTab = renderMapV68Tab;
            renderMapV68Tab = function () {
                try {
                    return v7olInject(_origMapTab());
                } catch (e) { return _origMapTab(); }
            };
            v7olEnsureStyle();
        }
    } catch (e) {}
})();

console.log('✓ 批R(v7.1)·地图数据大具现（四角角标/城俗/资源/灾异/军力/边患等级）加载完成');