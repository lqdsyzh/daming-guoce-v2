// ============================================
// 《大明国策》批5 · 御览批朱（奏章朱批）
// 每章可从急奏队列选1-3件朱批（准行/议复/驳斥/留中/圈出·御批五态）
// 反爽游：全准→朝令夕改；全驳→独断之讥；限频key存存档链
// 史据：《明史》职官志·通政/六科给事中掌章奏出纳封驳；批红归司礼监。
// ============================================

function initJunpiState() {
    return { perTick: 0, qingyi: 0, doneIds: [], allPi: 0, allBo: 0, pending: [] };
}

function _jp() { return GameState.junpi; }

// 每章重置批朱限次（b5Tick）
function junpiDailyReset() {
    try {
        const j = _jp(); if (!j) return;
        if (j.perTick >= 3) j.perTick = 0;
    } catch (e) {}
}

// 御览批朱面板（渲染到 center-panel）
function openJunpiModal() {
    try {
        const j = _jp();
        if (j.perTick >= 3) { pushNews('御笔', '今日朱批已满三次，且惜龙翰。', 'danger'); return; }
        if (!GameState.memorialQueue || !GameState.memorialQueue.length) {
            if (typeof generateMemorialQueue === 'function') {
                try { GameState.memorialQueue = generateMemorialQueue(); } catch (e) {}
            }
        }
        _renderJunpiList();
    } catch (e) {}
}

function _renderJunpiList() {
    try {
        const q = GameState.memorialQueue || [];
        const panel = document.getElementById('center-panel');
        if (!panel) return;
        if (!q.length) { pushNews('御笔', '今日已无待批章奏。', 'normal'); try { renderPanel(GameState.currentTab || 'politics'); } catch (e) {} return; }
        panel.innerHTML = `<div class="report-card"><div class="report-title">御览批朱 · 当日急奏（余批${Math.max(0, 3 - _jp().perTick)}次）</div>` +
            q.map((mt, i) => {
                const opts = (mt.options || []).slice(0, 3);
                const optBtns = opts.map(o =>
                    `<button class="btn" onclick="junpiAction(${i},'准行',${opts.indexOf(o)})">准行·${o.text}</button>`
                ).join('');
                return `<div class="jp-item">
                    <div class="jp-title">${mt.title}</div>
                    <div class="jp-content">${mt.content}</div>
                    <div class="jp-actions">
                        ${optBtns}
                        <button class="btn" onclick="junpiAction(${i},'议复',0)">议复</button>
                        <button class="btn" onclick="junpiAction(${i},'驳斥',0)">驳斥</button>
                        <button class="btn" onclick="junpiAction(${i},'留中',0)">留中</button>
                        <button class="btn" onclick="junpiAction(${i},'圈出',0)">圈出</button>
                    </div>
                </div>`;
            }).join('') + `<div style="margin:8px 0"><button class="btn" onclick="try{renderPanel(GameState.currentTab||'politics')}catch(e){}">返回</button></div></div>`;
    } catch (e) {}
}

const JUNPI_LIMIT = 3;

// mode: 御批五态（准行/议复/驳斥/留中/圈出）
function junpiAction(idx, mode, optIdx) {
    try {
        const j = _jp(); const q = GameState.memorialQueue || [];
        if (!q[idx]) return;
        if (j.perTick >= JUNPI_LIMIT) { pushNews('御笔', '今日朱批已满三次。', 'danger'); return; }
        const mt = q[idx];
        const key = mt.id !== undefined ? mt.id : idx;
        if (j.doneIds.indexOf(key) >= 0) { pushNews('御笔', '此奏已批。', 'normal'); return; }
        const opt = (mt.options || [])[optIdx];
        const civil = GameState.factions.civil;

        if (mode === '准行') {
            if (opt && opt.effect) try { applyDecision(opt.effect); } catch (e) {}
            GameState.factions.civil = Math.min(100, civil + 2);
            j.allPi++; gNews(`朱批准行：「${mt.title}」`, 'normal');
        } else if (mode === '议复') {
            if (opt && opt.effect) { const half = {}; for (const k in opt.effect) half[k] = Math.round(opt.effect[k] / 2); try { applyDecision(half); } catch (e) {} }
            GameState.factions.civil = Math.max(0, civil - 1);
            j.pending.push(mt.title);
            gNews(`下部议复：「${mt.title}」迟滞待议`, 'normal');
        } else if (mode === '驳斥') {
            GameState.factions.civil = Math.max(0, civil - 3);
            j.qingyi += 1; j.allBo++;
            if (j.qingyi >= 6) { GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 2); pushNews('言官', '谏台清议鼎沸！咸谓陛下拒谏！', 'danger'); }
            gNews(`严旨驳斥：「${mt.title}」`, 'danger');
        } else if (mode === '留中') {
            GameState.factions.civil = Math.max(0, civil - 1);
            j.pending.push(mt.title);
            gNews(`留中不发：「${mt.title}」暂缓`, 'normal');
        } else if (mode === '圈出') {
            GameState.factions.civil = Math.max(0, civil - 1);
            gNews(`御笔圈出：「${mt.title}」已知悉`, 'normal');
        }

        j.doneIds.push(key);
        q.splice(idx, 1);
        j.perTick++;

        // 反爽游：连续全准/全驳
        if (j.allPi >= 4) { j.allPi = 0; GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 3); pushNews('鉴戒', '朝令夕改，政出多门，有讥于上！', 'danger'); }
        if (j.allBo >= 2) { j.allBo = 0; GameState.factions.civil = Math.max(0, GameState.factions.civil - 4); pushNews('鉴戒', '独断之讥，台谏寒心！', 'danger'); }

        _renderJunpiList();
        try { refreshJunpiButton && refreshJunpiButton(); } catch (e) {}
    } catch (e) {}
}

function gNews(t, lv) { try { pushNews('御笔', t, lv); } catch (e) {} }

console.log('✓ 批5·御览批朱加载完成');