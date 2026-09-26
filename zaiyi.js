// ============================================
// 《大明国策》批5 · 灾异应对
// 旱/涝/蝗/震/疫 六应对 + 复灾概率 + 天象联动
// 史据：《明史》五行志（灾祥）、食货志·赈济
// ============================================

const ZAIYI_TYPES = [
    { key: '旱', label: '旱灾', suggests: ['开仓赈济', '祈禳求雨'] },
    { key: '涝', label: '水涝', suggests: ['清渠治水', '开仓赈济'] },
    { key: '蝗', label: '蝗灾', suggests: ['捕蝗入仓', '开仓赈济'] },
    { key: '震', label: '地震', suggests: ['移民就食', '开仓赈济'] },
    { key: '疫', label: '大疫', suggests: ['施药埋瘗', '开仓赈济'] }
];

function initZaiyiState() {
    return { pending: [], recurRisk: 0, responded: 0, history: [], omenMod: 1 };
}

function _zy() { return GameState.zaiyi; }

// 从事件登记待办灾异（script.js showEvent 调用）
function zaiyiReportFromEvent(event, opt) {
    try {
        if (!event || !event.title) return;
        const z = _zy(); if (!z) return;
        const title = String(event.title);
        const t = ZAIYI_TYPES.find(x => title.indexOf(x.key) >= 0);
        if (!t) return;
        // 防止重复登记
        if (z.pending.some(p => p.title === event.title)) return;
        z.pending.push({ key: t.key, label: t.label, title: event.title, turns: 2, responded: false });
        pushNews('灾异', `✦ ${t.label}：${event.title}——趋灾应对可减其祸！`, 'danger');
    } catch (e) {}
}

// 灾异应对（zaiyiAction(turn key) 清掉一条 pending 或纯召唤）
function zaiyiRespond(knowKey, method) {
    try {
        const z = _zy(); const idx = z.pending.findIndex(p => p.key === knowKey);
        const s = GameState.stats; const f = GameState.factions;
        if (idx < 0) { zailog(`未见${knowKey}灾异待发。`, 'normal'); return; }
        const p = z.pending[idx];
        const cost = { kaicang: 2, yimin: 3, jianfu: 1, qingqu: 2, qiyu: 3, buyi: 2, yiyao: 2, tuqing: 2 }[method] || 1;
        let effText = '';
        if (method === 'kaicang') { s.treasury = Math.max(0, s.treasury - cost); s.stability = Math.min(100, s.stability + 2); f.civil = Math.min(100, f.civil + 2); effText = '赈济而行，民望得安(+稳定2 臣心2)'; }
        else if (method === 'yimin') { s.food = Math.max(0, (s.food || 0) - 3); s.stability = Math.min(100, s.stability + 3); effText = '移粟安民，泽被千里(+稳定3)'; }
        else if (method === 'jianfu') { s.adminEfficiency = Math.max(0, (s.adminEfficiency || 0) - 2); s.mandate = Math.min(100, (s.mandate || 0) + 1); effText = '减赋蠲免，民心悦而大户怨'; }
        else if (method === 'qingqu') { s.treasury = Math.max(0, s.treasury - cost); s.canalEfficiency = Math.min(100, (s.canalEfficiency || 0) + 5); effText = '清渠治水，旱涝稍弭'; }
        else if (method === 'qiyu') { const r = Math.random(); s.privyPurse = Math.max(0, (s.privyPurse || 0) - cost); effText = (r < 0.4 ? '祈禳不应，朝野窃议' : (r < 0.8 ? '雨泽偶应，灾情稍缓' : '精诚格天，甘霖大沛')); }
        else if (method === 'buyi') { s.stability = Math.min(100, s.stability + 2); effText = '捕蝗入仓，禾稼得保(+稳定2)'; }
        else if (method === 'yiyao') { s.treasury = Math.max(0, s.treasury - cost); f.civil = Math.min(100, f.civil + 1); effText = '施药埋瘗，疫气渐消'; }
        z.pending.splice(idx, 1);
        z.responded++;
        z.recurRisk = Math.max(0, z.recurRisk - 8);
        zailog(`应对${p.label}（${methodLabel(method)}）：${effText}`, 'normal');
        renderScreen();
    } catch (e) {}
}

function methodLabel(m) {
    return { kaicang: '开仓赈济', yimin: '移粟安民', jianfu: '减赋蠲免', qingqu: '清渠治水', qiyu: '祈禳求雨', buyi: '捕蝗入仓', yiyao: '施药埋瘗', tuqing: '移民就食' }[m] || m;
}

// 每季巡检（复灾）
function zaiyiTick() {
    try {
        const z = _zy(); if (!z) return;
        // 天象联动：异常时提频/复灾叠加
        let mod = 1;
        try { if (GameState.omen && ((GameState.omen.eclipse && GameState.omen.eclipse > 0) || GameState.omen.mandateLow)) mod = 2; } catch (e) {}
        if (mod !== z.omenMod) z.omenMod = mod;
        // 未应对的待办灾异：灾情加重
        (z.pending || []).forEach(p => { p.turns = (p.turns || 2) - 1; });
        z.pending = (z.pending || []).filter(p => p.turns > 0);
        // 复灾风险累积
        if (z.pending.length) z.recurRisk = Math.min(100, z.recurRisk + (3 * z.omenMod));
        else z.recurRisk = Math.max(0, z.recurRisk - 2);
        // 复灾触发
        if (z.recurRisk >= 90 && Math.random() < 0.4) {
            const ctx = ZAIYI_TYPES[Math.floor(Math.random() * ZAIYI_TYPES.length)];
            z.pending.push({ key: ctx.key, label: ctx.label, title: `连年${ctx.label}（复）`, turns: 2, responded: false });
            z.recurRisk = 40;
            pushNews('灾异', `✦ ${ctx.label}复作，民不堪命！`, 'critical');
        }
    } catch (e) {}
}

function zailog(t, lv) { try { pushNews('荒政', t, lv); } catch (e) {} }

// renderZaiyiTab：荒政应对面板（挂 famine tab 尾部）
function renderZaiyiTab() {
    try {
        const z = _zy(); if (!z) return '';
        let pendingHtml = '<div class="report-text">尚无待办灾异。</div>';
        if ((z.pending || []).length) {
            pendingHtml = (z.pending || []).map(p => {
                const t = ZAIYI_TYPES.find(x => x.key === p.key);
                const attrs = t ? t.suggests.slice(0, 2) : [];
                const btn = (m) => `<button class="btn" onclick="zaiyiRespond('${p.key}','${m}')">${methodLabel(m)}</button>`;
                let optBtns;
                if (p.key === '旱') optBtns = btn('kaicang') + btn('qiyu');
                else if (p.key === '涝') optBtns = btn('qingqu') + btn('kaicang');
                else if (p.key === '蝗') optBtns = btn('buyi') + btn('kaicang');
                else if (p.key === '震') optBtns = btn('yimin') + btn('kaicang');
                else optBtns = btn('yiyao') + btn('kaicang');
                return `<div class="zj-item"><b>${p.label}</b>：${p.title}　${optBtns}</div>`;
            }).join('');
        }
        return `<div class="report-card"><div class="report-title">⚖ 荒政·灾异应对</div>
            <div class="report-text">复灾风险：${z.recurRisk}　天象烈度×${z.omenMod}　已应对${z.responded}次</div>
            <div class="report-text">灾异待办：</div>
            ${pendingHtml}
            <div class="report-text"><i>《明史·五行志》载旱蝗水潦、地震、大疫之应；《食货志》载赈贷蠲免之政。</i></div>
        </div>`;
    } catch (e) { return ''; }
}

console.log('✓ 批5·灾异应对加载完成');