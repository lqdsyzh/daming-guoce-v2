// ============================================================
// 《大明国策》批Q(v7.0) · 地图触动（map_interact.js）
// 给真舆图增加点击交互与悬停提示，让地图"触之有声"：
//   1. 城市点击 → 城市信息卡（名称 / 所属府 / 民俗 / 边关标记）
//   2. 邻国点击 → 邻国信息卡（国名 / 与明关系 / 史据框架）
//   3. 长城关隘点击 → 关隘信息卡（关名 / 九边防务简述）
//   4. 悬停 tooltip：城市、邻国、关隘悬停即显名
// 实现方式：覆盖式接管（保留原矢量渲染，仅注入 onclick/悬停属性），
//          不改动 map_v67/map_v69/geo_ming 原有几何与视觉。
// 史据说明：邻国/关隘疆域坐标据 historical-basemaps（CC-BY-SA 4.0）
//           1600 年矢量；关系与防务简述为演绎性，框架参考
//           《明史·地理志》《明史·兵志》《明史·外国传》。
// ============================================================

// ====== 邻国关系简述（史据框架 + 演绎性标注）======
const V7_NATION_NOTES = {
    '朝鲜': { rel: '藩属', note: '李氏朝鲜，明朝册封之朝贡藩国。万历壬辰（1592）丰臣秀吉侵朝，明廷发兵相援，是为「万历朝鲜之役」（万历三大征之一），终复其社稷。' },
    '安南': { rel: '羁縻', note: '交趾故地。永乐时尝设交趾承宣布政使司，宣德间罢之，黎氏、莫氏相继。嘉靖间以莫氏为安南都统使司，羁縻于版图之外。' },
    '乌斯藏': { rel: '羁縻', note: '今西藏之地。明置乌斯藏都司、朵甘都司，册封阐化王、大宝法王等，以僧俗法王羁縻，不与内地同轨。' },
    '日本': { rel: '外患', note: '战国之世，倭寇屡犯东南海疆。丰臣秀吉统一后两度侵朝（1592、1597），为万历三大征之一，终未得志。' },
    '缅甸诸邦': { rel: '边患', note: '东吁王朝崛起，万历年间屡侵滇西、孟养、木邦诸土司，朝廷兴「缅甸之役」（万历三大征之一），边警不绝。' },
    '老挝': { rel: '土司', note: '澜沧之地。明初置老挝军民宣慰使司，为滇南羁縻土司。' },
    '掸邦': { rel: '土司', note: '滇西南掸人诸部，附于麓川、木邦诸宣慰司，边徼羁縻之地。' },
    '兰纳': { rel: '土司', note: '八百媳妇故地。明初置八百大甸军民宣慰使司，羁縻于滇西。' }
};

// ====== 长城关隘防务简述（九边体系框架）======
const V7_WALL_NOTES = {
    '山海关': '山海之间，锁钥辽蓟，京师东面屏障，北虏入犯首冲。',
    '古北口': '燕山古隘，密云边墙要冲，虏骑常自此窥犯。',
    '居庸关': '太行八陉之一，京师西北雄关，城高谷深，易守难攻。',
    '宣府': '「京师肩背」，宣府镇城，九边冲要，马市互易之地。',
    '大同': '代北重镇，大同镇城，北虏南犯必经，九边之脊。',
    '偏关': '偏头关，与雁门、宁武合称「外三关」，山西镇西面门户。',
    '榆林': '延绥镇城，边墙蜿蜒，精骑戍守，河套之南屏。',
    '宁夏': '贺兰山下，宁夏镇城，控扼河套西陲。',
    '固原': '三边总制驻节之地，内拱关陇，遥制四镇。',
    '嘉峪关': '河西尽头，西域孔道，甘肃镇西陲雄关，塞外极边。'
};

// ====== 常量（浮层与提示符 id）======
const V7_OVERLAY_ID = 'v7-mapinfo-overlay';
const V7_TIP_ID = 'v7-map-tip';
const V7_STYLE_ID = 'v7-mapinteract-style';

// ====== 工具函数 ======
function v7MapStop(e) { try { if (e && e.stopPropagation) e.stopPropagation(); } catch (_) {} }
function v7Esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function v7Js(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function v7RegionName(key) {
    try {
        if (typeof MAP_REGIONS !== 'undefined') {
            const r = MAP_REGIONS.find(x => x && x.key === key);
            if (r && r.name) return r.name;
        }
        return key || '';
    } catch (e) { return key || ''; }
}

// ====== 悬停 tooltip ======
function v7Tip(html) {
    try {
        let el = document.getElementById(V7_TIP_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = V7_TIP_ID;
            document.body.appendChild(el);
        }
        el.innerHTML = html;
        el.style.display = 'block';
    } catch (e) {}
}
function v7TipMove(e) {
    try {
        const el = document.getElementById(V7_TIP_ID);
        if (el && e) {
            el.style.left = (e.clientX + 14) + 'px';
            el.style.top = (e.clientY + 16) + 'px';
        }
    } catch (_) {}
}
function v7TipHide() {
    try {
        const el = document.getElementById(V7_TIP_ID);
        if (el) el.style.display = 'none';
    } catch (e) {}
}

// ====== 信息卡浮层 ======
function v7OpenCard(title, tag, bodyHtml) {
    try {
        v7EnsureStyle();
        let ov = document.getElementById(V7_OVERLAY_ID);
        if (!ov) {
            ov = document.createElement('div');
            ov.id = V7_OVERLAY_ID;
            document.body.appendChild(ov);
        }
        ov.innerHTML = `<div class="v7-mc" onclick="event.stopPropagation();">` +
            `<div class="v7-mc-head"><span class="v7-mc-title">${v7Esc(title)}</span><span class="v7-mc-tag">${v7Esc(tag)}</span></div>` +
            `<div class="v7-mc-body">${bodyHtml}</div>` +
            `<div class="v7-mc-foot"><span class="v7-mc-note">疆域据 historical-basemaps 1600 年矢量；沿革简述为演绎性，参考《明史》。</span><button class="v7-mc-close" onclick="v7CloseCard()">关闭</button></div>` +
            `</div>`;
        ov.style.display = 'flex';
        try { DamingSFX.play('click'); } catch (e) {}
    } catch (e) {}
}
function v7CloseCard() {
    try { const ov = document.getElementById(V7_OVERLAY_ID); if (ov) ov.style.display = 'none'; } catch (e) {}
}

// ====== 城市信息卡 ======
function v7CityCard(name) {
    try {
        const c = (typeof MAP_V67_CITIES !== 'undefined') ? MAP_V67_CITIES.find(x => x && x.name === name) : null;
        if (!c) return;
        const regionName = v7RegionName(c.region);
        const isWall = (typeof V7_WALL_NOTES !== 'undefined') && Object.prototype.hasOwnProperty.call(V7_WALL_NOTES, name);
        const wallLine = isWall ? `<div class="v7-mc-wall">&#x2694; 边关重镇，九边防务所系。</div>` : '';
        const body =
            `<div class="v7-mc-row"><span class="v7-mc-label">所属</span><span class="v7-mc-val">${v7Esc(regionName)}</span>` +
            `<span class="v7-mc-link" onclick="v7GotoRegion('${v7Js(c.region)}')">查看此府 &raquo;</span></div>` +
            `<div class="v7-mc-row"><span class="v7-mc-label">民俗</span><span class="v7-mc-val">${v7Esc(c.pop)}</span></div>` +
            wallLine;
        v7OpenCard(c.name, '城池', body);
    } catch (e) {}
}
function v7GotoRegion(key) {
    try {
        v7CloseCard();
        if (typeof openMapCellModal === 'function') openMapCellModal(key);
    } catch (e) {}
}

// ====== 邻国信息卡 ======
function v7NationCard(cn) {
    try {
        const rec = (typeof V7_NATION_NOTES !== 'undefined') ? V7_NATION_NOTES[cn] : null;
        if (!rec) return;
        const body =
            `<div class="v7-mc-row"><span class="v7-mc-label">关系</span><span class="v7-mc-val">${v7Esc(rec.rel)}</span></div>` +
            `<div class="v7-mc-text">${v7Esc(rec.note)}</div>`;
        v7OpenCard(cn, '域外', body);
    } catch (e) {}
}

// ====== 关隘信息卡 ======
function v7WallCard(name) {
    try {
        const note = (typeof V7_WALL_NOTES !== 'undefined') ? V7_WALL_NOTES[name] : '';
        if (!note) return;
        const body = `<div class="v7-mc-text">${v7Esc(note)}</div>`;
        v7OpenCard(name, '九边关隘', body);
    } catch (e) {}
}

// ====== 悬停提示内容 ======
function v7CityTip(name) {
    try {
        const c = (typeof MAP_V67_CITIES !== 'undefined') ? MAP_V67_CITIES.find(x => x && x.name === name) : null;
        const regionName = c ? v7RegionName(c.region) : '';
        v7Tip(`<b>${v7Esc(name)}</b>${regionName ? ' · ' + v7Esc(regionName) : ''}${c && c.pop ? '<br>' + v7Esc(c.pop) : ''}`);
    } catch (e) {}
}
function v7NationTip(cn) {
    try {
        const rec = (typeof V7_NATION_NOTES !== 'undefined') ? V7_NATION_NOTES[cn] : null;
        v7Tip(`<b>${v7Esc(cn)}</b>${rec ? ' · ' + v7Esc(rec.rel) : ''}`);
    } catch (e) {}
}
function v7WallTip(name) {
    try { v7Tip(`<b>${v7Esc(name)}</b> · 九边关隘`); } catch (e) {}
}

// ====== 覆盖：城市节点注入点击 + 悬停（保留原渲染）======
(function () {
    try {
        if (typeof renderMapV67Cities === 'function') {
            const _orig = renderMapV67Cities;
            renderMapV67Cities = function () {
                try {
                    const html = _orig();
                    if (!html) return html;
                    return html.replace(/<g class="map-v67-city" data-name="([^"]*)"/g, function (m, name) {
                        return `<g class="map-v67-city" data-name="${name}" style="cursor:pointer"` +
                            ` onclick="v7MapStop(event);v7CityCard('${v7Js(name)}')"` +
                            ` onmousemove="v7TipMove(event)" onmouseenter="v7CityTip('${v7Js(name)}')" onmouseleave="v7TipHide()"`;
                    });
                } catch (e) { return _orig(); }
            };
        }
    } catch (e) {}
})();

// ====== 覆盖：邻国块注入点击（保留原视觉，重写等价渲染以挂 group 语义）======
(function () {
    try {
        if (typeof renderMapV69Neighbors === 'function') {
            const _orig = renderMapV69Neighbors;
            renderMapV69Neighbors = function () {
                try {
                    if (typeof MING_NEIGHBORS_REAL === 'undefined') return _orig();
                    let html = '';
                    MING_NEIGHBORS_REAL.forEach(n => {
                        n.paths.forEach(d => {
                            html += `<path d="${d}" fill="${n.color}" opacity="0.5" stroke="#0A1118" stroke-width="1"` +
                                ` style="cursor:pointer"` +
                                ` onclick="v7MapStop(event);v7NationCard('${v7Js(n.cn)}')"` +
                                ` onmousemove="v7TipMove(event)" onmouseenter="v7NationTip('${v7Js(n.cn)}')" onmouseleave="v7TipHide()"><title>${v7Esc(n.cn)}</title></path>`;
                        });
                    });
                    return html;
                } catch (e) { return _orig(); }
            };
        }
    } catch (e) {}
})();

// ====== 覆盖：邻国名称标注注入点击 ======
(function () {
    try {
        if (typeof renderMapV69NeighborLabels === 'function') {
            const _orig = renderMapV69NeighborLabels;
            renderMapV69NeighborLabels = function () {
                try {
                    if (typeof MING_NEIGHBORS_REAL === 'undefined') return _orig();
                    return MING_NEIGHBORS_REAL.map(n => {
                        const c = (typeof v69Centroid === 'function') ? v69Centroid(n.paths) : { x: 0, y: 0 };
                        return `<text x="${c.x}" y="${c.y}" text-anchor="middle" fill="#CBBFA8" font-size="13" font-weight="bold" font-family="serif" opacity="0.85" style="text-shadow:1px 1px 3px rgba(0,0,0,0.9);cursor:pointer"` +
                            ` onclick="v7MapStop(event);v7NationCard('${v7Js(n.cn)}')"` +
                            ` onmousemove="v7TipMove(event)" onmouseenter="v7NationTip('${v7Js(n.cn)}')" onmouseleave="v7TipHide()">${v7Esc(n.cn)}</text>`;
                    }).join('');
                } catch (e) { return _orig(); }
            };
        }
    } catch (e) {}
})();

// ====== 覆盖：长城追加可点关隘节点（保留原城墙折线与题字）======
(function () {
    try {
        if (typeof renderMapV69Greatwall === 'function') {
            const _orig = renderMapV69Greatwall;
            renderMapV69Greatwall = function () {
                let html = _orig();
                try {
                    if (typeof MING_GREATWALL_REAL !== 'undefined' && MING_GREATWALL_REAL.nodes) {
                        MING_GREATWALL_REAL.nodes.forEach(n => {
                            html += `<circle cx="${n.x}" cy="${n.y}" r="9" fill="rgba(255,215,0,0)" stroke="rgba(255,215,0,0.45)" stroke-width="1.5"` +
                                ` style="cursor:pointer"` +
                                ` onclick="v7MapStop(event);v7WallCard('${v7Js(n.name)}')"` +
                                ` onmousemove="v7TipMove(event)" onmouseenter="v7WallTip('${v7Js(n.name)}')" onmouseleave="v7TipHide()"><title>${v7Esc(n.name)}</title></circle>`;
                        });
                    }
                } catch (e) {}
                return html;
            };
        }
    } catch (e) {}
})();

// ====== 样式注入 ======
function v7EnsureStyle() {
    try {
        if (document.getElementById(V7_STYLE_ID)) return;
        const st = document.createElement('style');
        st.id = V7_STYLE_ID;
        st.textContent = `
#${V7_OVERLAY_ID}{position:fixed;inset:0;background:rgba(8,12,18,0.62);display:none;align-items:center;justify-content:center;z-index:99990;}
.v7-mc{width:min(440px,90vw);max-height:76vh;overflow:auto;background:linear-gradient(180deg,#1c1610,#12100c);border:1px solid #C9A227;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,0.7);padding:18px 20px;color:#E8DCC0;font-family:serif;}
.v7-mc-head{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid #4a3f2a;padding-bottom:10px;margin-bottom:12px;}
.v7-mc-title{font-size:24px;font-weight:bold;color:#FFD700;letter-spacing:2px;}
.v7-mc-tag{font-size:13px;color:#CBBFA8;border:1px solid #6a5a38;border-radius:12px;padding:1px 10px;}
.v7-mc-body{font-size:15px;line-height:1.7;}
.v7-mc-row{display:flex;align-items:center;gap:8px;margin:6px 0;}
.v7-mc-label{color:#a8946b;font-size:13px;min-width:3em;}
.v7-mc-val{color:#efe4c4;}
.v7-mc-link{margin-left:auto;color:#8fc7ff;font-size:13px;cursor:pointer;text-decoration:underline;}
.v7-mc-wall{color:#e0a855;font-size:14px;margin-top:8px;}
.v7-mc-text{color:#d8cbb0;margin:8px 0 4px;text-align:justify;}
.v7-mc-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;border-top:1px solid #4a3f2a;padding-top:10px;}
.v7-mc-note{font-size:11px;color:#7d7466;flex:1;}
.v7-mc-close{cursor:pointer;background:#3a2f18;color:#FFD700;border:1px solid #C9A227;border-radius:6px;padding:4px 14px;font-family:serif;}
.v7-mc-close:hover{background:#54421f;}
#${V7_TIP_ID}{position:fixed;z-index:99999;pointer-events:none;background:rgba(10,14,20,0.94);border:1px solid #C9A227;border-radius:6px;padding:7px 11px;color:#FFE9B0;font-size:13px;font-family:serif;box-shadow:0 4px 16px rgba(0,0,0,0.6);display:none;max-width:260px;line-height:1.5;}
`;
        document.head.appendChild(st);
    } catch (e) {}
}
(function () { try { v7EnsureStyle(); } catch (e) {} })();

console.log('✓ 批Q·地图触动（城市/邻国/关隘点击 + 悬停提示）加载完成');