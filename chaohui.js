// ============================================================
// 《大明国策》v6.6 批L-丙 · 朝会辩论（每季派系议事）
// 反爽游哲学：朝会议事非可强压——五派系呈议题，玩家裁决需付出代价；
// 偏袒一方则另一方猜忌，偏执严苛则群臣寒心，乡愿则政事不决。
// 全部符号带 CH_/ch 前缀，独立追加式，不触碰既有关键逻辑。
// 史据：《明史·职官志》内阁与六部科道；《通鉴》"廷议纷纭，帝为折衷"。
// 注意：本文件使用顶层 function 声明（与 qiuzhuji.js 等批一致）。
// ============================================================

// 议题池（按剧本轮回 + 历史情境派生；每条带影响权重）
var CH_FACTIONS = [
    { key: 'civil',    label: '文官',  color: '#3a6b8a' },
    { key: 'military', label: '武官',  color: '#a0261a' },
    { key: 'royal',    label: '宗室',  color: '#a06820' },
    { key: 'eunuch',   label: '内官',  color: '#5a2f0f' },
    { key: 'consort',  label: '外戚',  color: '#8b2c1a' }
];

// 议题池——确定性、无随机；按 currentSeason 决定本届议题索引
var CH_TOPICS = [
    { key: 'grain',     label: '粟米钱钞', desc: '今岁秋粮已征入京仓，京储与州县争拨，孰先？', req: 'civil', 'opts': [
        { label: '先拨京仓', favor: 'civil', opposer: 'royal', eff: { treasury: -8, stability: 1, factionCivil: 4, factionRoyal: -4, tianming: 0.6 } },
        { label: '先拨州县', favor: 'royal', opposer: 'civil', eff: { treasury: -3, stability: 2, factionRoyal: 4, factionCivil: -4, tianming: 0.4 } }
    ]},
    { key: 'border',    label: '边镇戍守', desc: '北虏近边，辽东奏请增兵，孰主攻守？', req: 'military', 'opts': [
        { label: '增戍主动', favor: 'military', opposer: 'eunuch', eff: { militaryPower: 4, treasury: -10, stability: -1, factionMil: 5, factionEunuch: -3 } },
        { label: '固守消耗', favor: 'eunuch', opposer: 'military', eff: { treasury: -2, stability: 2, factionEunuch: 4, factionMil: -4, tianming: -0.4 } }
    ]},
    { key: 'rites',     label: '宗藩礼制', desc: '亲藩请增岁禄，礼部请减，孰从？', req: 'royal', 'opts': [
        { label: '听礼部议', favor: 'civil', opposer: 'royal', eff: { treasury: 6, stability: -2, factionRoyal: -5, factionCivil: 5 } },
        { label: '听宗室请', favor: 'royal', opposer: 'civil', eff: { treasury: -8, stability: 2, factionRoyal: 5, factionCivil: -5, tianming: -0.5 } }
    ]},
    { key: 'censor',    label: '科道风闻', desc: '御史劾奏某部侍郎贪墨，当如何？', req: 'civil', 'opts': [
        { label: '准奏逮问', favor: 'civil', opposer: 'consort', eff: { stability: 3, factionCivil: 4, factionConsort: -4 } },
        { label: '留中不下', favor: 'consort', opposer: 'civil', eff: { stability: -3, factionConsort: 4, factionCivil: -4, tianming: -1.0 } }
    ]},
    { key: 'tax',       label: '赋税折色', desc: '东南折色银渐贱，户部请改折，孰行？', req: 'civil', 'opts': [
        { label: '改折收银', favor: 'civil', opposer: 'royal', eff: { treasury: 10, stability: -1, factionCivil: 4, factionRoyal: -3, tianming: -0.4 } },
        { label: '征本色', favor: 'royal', opposer: 'civil', eff: { treasury: -3, stability: 2, factionRoyal: 3, factionCivil: -3, tianming: 0.4 } }
    ]},
    { key: 'favor',     label: '选后遴选', desc: '外戚请以亲女入选，礼部以祖制争。', req: 'consort', 'opts': [
        { label: '纳礼部议', favor: 'civil', opposer: 'consort', eff: { stability: 2, factionCivil: 4, factionConsort: -4 } },
        { label: '许外戚请', favor: 'consort', opposer: 'civil', eff: { factionConsort: 5, factionCivil: -3, tianming: -0.6 } }
    ]},
    { key: 'eunuch',    label: '内官差遣', desc: '内官请监军边镇，文武以为侵职。', req: 'eunuch', 'opts': [
        { label: '许内官差', favor: 'eunuch', opposer: 'military', eff: { factionEunuch: 5, factionMil: -5, stability: -2, tianming: -0.8 } },
        { label: '罢其差遣', favor: 'military', opposer: 'eunuch', eff: { factionMil: 4, factionEunuch: -4, stability: 1 } }
    ]},
    { key: 'disaster',  label: '灾异赈济', desc: '某府报灾，请发帑银赈济，孰裁？', req: 'civil', 'opts': [
        { label: '发帑赈济', favor: 'civil', opposer: 'eunuch', eff: { treasury: -12, stability: 5, factionCivil: 4, factionEunuch: -2, tianming: 1.2 } },
        { label: '截留勿发', favor: 'eunuch', opposer: 'civil', eff: { stability: -5, factionCivil: -5, factionEunuch: 3, tianming: -1.6 } }
    ]},
    { key: 'minister',  label: '大臣去留', desc: '某阁臣屡劾同僚久矣，孰去孰留？', req: 'civil', 'opts': [
        { label: '听劾去职', favor: 'civil', opposer: 'consort', eff: { stability: 1, factionCivil: 4, factionConsort: -3 } },
        { label: '慰留勿去', favor: 'consort', opposer: 'civil', eff: { stability: -2, factionCivil: -4, factionConsort: 3, tianming: -0.6 } }
    ]}
];

function chInit() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return;
        if (!GameState.chaohui || typeof GameState.chaohui !== 'object') {
            GameState.chaohui = {
                pending: null,          // 本季待决议题（带 opts）
                lastTick: -1,
                lastTopicKey: '',
                resolvedCount: 0,
                resolvedHistory: [],    // 已决议题记录（最多 30）
                pendingStats: null        // 判定式面板统计（每季一更）
            };
        }
        chEnsure(GameState.chaohui);
    } catch (e) {}
}

function chEnsure(c) {
    try {
        if (!c) return;
        if (c.pending && typeof c.pending !== 'object') c.pending = null;
        if (typeof c.lastTick !== 'number') c.lastTick = -1;
        if (typeof c.lastTopicKey !== 'string') c.lastTopicKey = '';
        if (typeof c.resolvedCount !== 'number') c.resolvedCount = 0;
        if (!Array.isArray(c.resolvedHistory)) c.resolvedHistory = [];
        if (c.pendingStats && typeof c.pendingStats !== 'object') c.pendingStats = null;
    } catch (e) {}
}

// 季度刷新：每季生成 1 个待决议题（按季确定性派生）
function chTick() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        chInit();
        var c = GameState.chaohui;
        var nowTick = (typeof GameState.tick === 'number') ? GameState.tick :
            ((GameState.currentYear * 4) + (GameState.currentSeason || 0));
        if (c.lastTick === nowTick) return c.pending;
        c.lastTick = nowTick;
        // 派生议题（确定性，currentSeason + currentYear 派生轮转）
        var idx = ((GameState.currentYear || 0) * 4 + (GameState.currentSeason || 0)) % CH_TOPICS.length;
        var t = CH_TOPICS[idx];
        if (!t) return null;
        c.pending = {
            year: GameState.currentYear || 0,
            season: GameState.currentSeason || 0,
            topicKey: t.key,
            topicLabel: t.label,
            topicDesc: t.desc,
            reqFaction: t.req,
            opts: t.opts.map(function(o) { return Object.assign({}, o); })
        };
        c.lastTopicKey = t.key;
        c.pendingStats = { generated: true, idx: idx };
        return c.pending;
    } catch (e) { return null; }
}

// 玩家裁决某选项
function chResolve(optIdx) {
    try {
        if (typeof GameState === 'undefined' || !GameState) return null;
        chInit();
        var c = GameState.chaohui;
        if (!c.pending) return null;
        if (typeof optIdx !== 'number' || optIdx < 0 || optIdx >= c.pending.opts.length) return null;
        var opt = c.pending.opts[optIdx];
        var eff = opt.eff || {};
        // 派系关系影响
        if (GameState.factions && typeof eff.factionCivil === 'number') GameState.factions.civil = clampFaction(GameState.factions.civil + eff.factionCivil);
        if (GameState.factions && typeof eff.factionMil === 'number') GameState.factions.military = clampFaction(GameState.factions.military + eff.factionMil);
        if (GameState.factions && typeof eff.factionRoyal === 'number') GameState.factions.royal = clampFaction(GameState.factions.royal + eff.factionRoyal);
        if (GameState.factions && typeof eff.factionEunuch === 'number') GameState.factions.eunuch = clampFaction(GameState.factions.eunuch + eff.factionEunuch);
        if (GameState.factions && typeof eff.factionConsort === 'number') GameState.factions.consort = clampFaction(GameState.factions.consort + eff.factionConsort);
        // 资源/稳定/兵力
        if (GameState.stats && typeof eff.treasury === 'number') GameState.stats.treasury = (GameState.stats.treasury || 0) + eff.treasury;
        if (GameState.stats && typeof eff.stability === 'number') GameState.stats.stability = (GameState.stats.stability || 0) + eff.stability;
        if (GameState.stats && typeof eff.militaryPower === 'number') GameState.stats.militaryPower = (GameState.stats.militaryPower || 0) + eff.militaryPower;
        // 天命联动（如有 tmmAdjust）
        if (typeof eff.tianming === 'number' && typeof tmmAdjust === 'function') {
            tmmAdjust(eff.tianming, '朝会议事：' + c.pending.topicLabel);
        }
        // 记录决议
        c.resolvedHistory.push({
            year: c.pending.year,
            season: c.pending.season,
            topicKey: c.pending.topicKey,
            choiceIdx: optIdx,
            choiceLabel: opt.label,
            favored: opt.favor,
            opposed: opt.opposer
        });
        if (c.resolvedHistory.length > 30) c.resolvedHistory.shift();
        c.resolvedCount++;
        // 清空待决
        c.pending = null;
        // 记录史官起居注
        if (typeof qzjNote === 'function') {
            var tag = (eff.tianming || 0) >= 0 ? 'good' : 'bad';
            qzjNote(c.pending && c.pending.year || GameState.currentYear, c.pending && c.pending.season || GameState.currentSeason,
                '朝议' + opt.label, '本期朝会议「' + (c.pending ? c.pending.topicLabel : '') + '」，帝从' + opt.label + '。', tag);
        }
        // 推新闻
        if (typeof pushNews === 'function') {
            pushNews('朝议', '本期朝会议「' + (c.pending ? c.pending.topicLabel : '') + '」，帝裁「' + opt.label + '」。',
                (eff.tianming || 0) >= 0 ? 'normal' : 'warn');
        }
        return opt;
    } catch (e) { return null; }
}

function clampFaction(v) {
    try { return Math.max(0, Math.min(100, v)); } catch (e) { return v; }
}

// 朝会看板
function renderChaohuiTab() {
    try {
        if (typeof GameState === 'undefined' || !GameState) return '';
        chInit();
        var c = GameState.chaohui;
        // 主动生成（看板打开时如未生成补一个）
        if (!c.pending) {
            try { chTick(); } catch (e) {}
        }
        var html = '<div class="ch-board" id="ch-board">';
        html += '<div class="ch-head"><span class="ch-title">朝会 · 廷议纷纭</span>';
        html += '<span class="ch-sub">· 五派系呈议题，帝为折衷</span></div>';
        if (c.pending) {
            var p = c.pending;
            var fac = CH_FACTIONS.filter(function(f) { return f.key === p.reqFaction; })[0];
            html += '<div class="ch-pending">';
            html += '<div class="ch-pending-head"><span class="ch-pending-tag">待议</span>';
            html += '<span class="ch-pending-label">' + p.topicLabel + '</span>';
            if (fac) html += '<span class="ch-pending-fac" style="color:' + fac.color + '">· ' + fac.label + '呈</span>';
            html += '</div>';
            html += '<div class="ch-pending-desc">' + p.topicDesc + '</div>';
            html += '<div class="ch-opts">';
            for (var i = 0; i < p.opts.length; i++) {
                var o = p.opts[i];
                var favor = CH_FACTIONS.filter(function(f) { return f.key === o.favor; })[0];
                var oppo = CH_FACTIONS.filter(function(f) { return f.key === o.opposer; })[0];
                html += '<button class="ch-opt-btn" data-ch-idx="' + i + '">';
                html += '<div class="ch-opt-label">' + o.label + '</div>';
                html += '<div class="ch-opt-tag">';
                if (favor) html += '<span style="color:' + favor.color + '">主' + favor.label + '</span>';
                if (oppo) html += '<span style="color:' + oppo.color + '"> · 逆' + oppo.label + '</span>';
                html += '</div>';
                html += '<div class="ch-opt-eff">';
                if (o.eff.treasury) html += '<span>国库' + (o.eff.treasury > 0 ? '+' : '') + o.eff.treasury + '</span>';
                if (o.eff.stability) html += '<span>稳定' + (o.eff.stability > 0 ? '+' : '') + o.eff.stability + '</span>';
                if (o.eff.militaryPower) html += '<span>军' + (o.eff.militaryPower > 0 ? '+' : '') + o.eff.militaryPower + '</span>';
                if (typeof o.eff.tianming === 'number' && o.eff.tianming !== 0) html += '<span>天命' + (o.eff.tianming > 0 ? '+' : '') + o.eff.tianming.toFixed(1) + '</span>';
                html += '</div>';
                html += '</button>';
            }
            html += '</div></div>';
        } else {
            html += '<div class="ch-empty">本期无议题，待下季。</div>';
        }
        // 决议历史
        var hist = (c.resolvedHistory || []).slice(-6).reverse();
        html += '<div class="ch-hist-head">近世朝议</div>';
        if (hist.length) {
            html += '<ul class="ch-hist-list">';
            for (var j = 0; j < hist.length; j++) {
                var h = hist[j];
                html += '<li class="ch-hist-item">'
                    + '<span class="ch-hist-yr">' + (h.year || '—') + '年</span>'
                    + '<span class="ch-hist-topic">' + (h.topicKey || '') + '</span>'
                    + '<span class="ch-hist-choice">→ ' + (h.choiceLabel || '') + '</span></li>';
            }
            html += '</ul>';
        } else {
            html += '<div class="ch-hist-empty">朝议初开，未有帝者折衷。</div>';
        }
        // 总览
        html += '<div class="ch-summary">已决议题 ' + c.resolvedCount + ' 件</div>';
        html += '</div>';
        return html;
    } catch (e) { return ''; }
}

// 样式运行时注入
function chInjectStyles() {
    try {
        if (window._chInjected) return;
        window._chInjected = true;
        var st = document.createElement('style');
        st.id = 'ch-inline';
        st.textContent =
            '.ch-board{padding:12px;background:linear-gradient(160deg,rgba(160,104,32,0.10),rgba(184,137,58,0.06));border:1px solid rgba(160,104,32,0.5);border-radius:6px;margin-top:4px;}' +
            '.ch-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;}' +
            '.ch-title{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:20px;color:#a06820;letter-spacing:3px;}' +
            '.ch-sub{font-size:12px;color:#5a4a3a;}' +
            '.ch-pending{background:rgba(244,232,208,0.7);border:1px solid rgba(160,104,32,0.5);border-radius:5px;padding:10px 12px;margin-bottom:10px;}' +
            '.ch-pending-head{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap;}' +
            '.ch-pending-tag{background:#a06820;color:#fff;padding:1px 8px;border-radius:3px;font-size:11px;font-weight:600;}' +
            '.ch-pending-label{font-family:"Ma Shan Zheng","KaiTi",serif;font-size:18px;color:#2a1f15;}' +
            '.ch-pending-fac{font-size:13px;}.ch-pending-desc{font-size:13px;color:#5a4a3a;line-height:1.6;margin-bottom:8px;}' +
            '.ch-opts{display:flex;gap:8px;flex-wrap:wrap;}.ch-opt-btn{flex:1 1 220px;background:rgba(244,232,208,0.85);border:1px solid rgba(160,104,32,0.5);border-radius:5px;padding:8px 10px;text-align:left;cursor:pointer;transition:all 0.2s;}' +
            '.ch-opt-btn:hover{background:rgba(160,104,32,0.18);border-color:#a06820;transform:translateY(-1px);}' +
            '.ch-opt-label{font-size:14px;color:#2a1f15;font-weight:600;margin-bottom:4px;}.ch-opt-tag{font-size:12px;margin-bottom:4px;}' +
            '.ch-opt-eff{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:#5a4a3a;}.ch-opt-eff span{padding:1px 5px;background:rgba(160,104,32,0.15);border-radius:2px;}' +
            '.ch-empty{font-size:13px;color:#5a4a3a;padding:10px;text-align:center;font-style:italic;background:rgba(244,232,208,0.5);border-radius:4px;}' +
            '.ch-hist-head{font-size:12px;color:#a06820;font-weight:600;margin-bottom:6px;border-top:1px dashed rgba(160,104,32,0.3);padding-top:6px;}' +
            '.ch-hist-list{list-style:none;margin:0;padding:0;}.ch-hist-item{display:flex;gap:8px;padding:5px 8px;border-bottom:1px dashed rgba(160,104,32,0.25);font-size:12px;line-height:1.5;flex-wrap:wrap;}' +
            '.ch-hist-item:last-child{border-bottom:none;}.ch-hist-yr{flex:0 0 38px;font-family:monospace;font-size:11px;color:#a06820;}.ch-hist-topic{flex:0 0 auto;color:#2a1f15;}.ch-hist-choice{flex:1 1 auto;color:#5a4a3a;}' +
            '.ch-hist-empty{font-size:12px;color:#5a4a3a;padding:5px 8px;font-style:italic;}' +
            '.ch-summary{font-size:11px;color:#a06820;text-align:right;margin-top:6px;font-style:italic;}';
        if (document.head) document.head.appendChild(st);
    } catch (e) {}
}

// 顶层对齐：DOMContentLoaded 注入样式 + 全局事件委托
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { chInjectStyles(); chBindEvents(); });
    } else {
        try { chInjectStyles(); chBindEvents(); } catch (e) {}
    }
}

// 全局事件委托：玩家点击朝会议题按钮（仅一次绑定）
function chBindEvents() {
    try {
        if (window._chEventsBound) return;
        window._chEventsBound = true;
        document.addEventListener('click', function(ev) {
            try {
                var t = ev.target;
                if (!t || !t.classList || !t.classList.contains('ch-opt-btn')) return;
                if (typeof GameState === 'undefined' || !GameState) return;
                var idx = parseInt(t.getAttribute('data-ch-idx'), 10);
                if (isNaN(idx)) return;
                var r = chResolve(idx);
                if (r && typeof renderPanel === 'function') renderPanel('chaohui');
            } catch (e) {}
        });
    } catch (e) {}
}