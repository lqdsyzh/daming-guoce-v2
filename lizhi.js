// ============================================
// 《大明国策》批5 · 礼制大典
// 祭天/告庙/大阅/农事礼（颁历·耕耤·亲蚕）
// 限频冷却 + 滥用/怠政反爽游
// 史据：《明史》礼志一（郊祀、告庙、耕耤、亲蚕）、礼志三（大阅）
// ============================================

function initLizhiState() {
    return { cooldowns: { jitian: 0, gaomiao: 0, dayue: 0, nong: 0 }, neglectTicks: 0, ticksIdle: 0, done: 0, spirit: 0 };
}

function _lz() { return GameState.lizhi; }

// 每季：冷却递减 + 怠政累积（正德豹房怠政史实）
function lizhiNeglectTick() {
    try {
        const l = _lz(); if (!l) return;
        for (const k in l.cooldowns) if (l.cooldowns[k] > 0) l.cooldowns[k]--;
        // 怠政累积：长期不行大典则天命渐损（行任一礼则归零）
        l.ticksIdle = (l.ticksIdle || 0) + 1;
        if (l.ticksIdle >= 4) {
            l.ticksIdle = 0;
            GameState.stats.mandate = Math.max(0, GameState.stats.mandate - 2);
            pushNews('儒臣', '祭告久旷，礼乐废弛，有讥怠政（如正德豹房之讥）！', 'danger');
        }
    } catch (e) {}
}

// 大典执行：method = jitian/gaomiao/dayue/nong
function lizhiAction(method) {
    try {
        const l = _lz(); const s = GameState.stats;
        const cd = { jitian: 15, gaomiao: 3, dayue: 10, nong: 6 }[method];
        if (l.cooldowns[method] > 0) { pushNews('礼部', `大典未届，尚有${l.cooldowns[method]}章冷却。`, 'normal'); return; }
        if (method === 'jitian') {
            if (s.treasury < 3) { pushNews('礼部', '府库不足，难以备办南郊大祀！', 'danger'); return; }
            s.treasury -= 3; s.stability = Math.min(100, s.stability + 2);
            // 天象异常灵验度变化
            let spirit = 1; try { if (GameState.omen && (GameState.omen.eclipse || GameState.omen.mandateLow)) spirit = -1; } catch (e) {}
            if (spirit > 0) { s.mandate = Math.min(100, s.mandate + 2); l.spirit++; pushNews('礼部', '南郊大祀，郊坛告成，神祇歆享，天命益固！', 'normal'); }
            else { s.stability = Math.max(0, s.stability - 1); pushNews('礼部', '郊祀之际天象示异，神灵若隐，朝野竦然！', 'danger'); }
        } else if (method === 'gaomiao') {
            l.cooldowns.gaomiao = 3; // 禁3章复用
            s.stability = Math.min(100, s.stability + 1);
            pushNews('礼部', '祗告太庙，祖考宁祐，宗庙孔固。', 'normal');
        } else if (method === 'dayue') {
            if (s.treasury < 2) { pushNews('礼部', '府库不足！', 'danger'); return; }
            s.treasury -= 2;
            GameState.factions.military = Math.min(100, GameState.factions.military + 2);
            s.prestige = Math.min(100, (s.prestige || 0) + 1);
            pushNews('礼部', '大阅于南郊，戈甲耀日，九军动色（军心+2 威望+1）。', 'normal');
        } else if (method === 'nong') {
            // 农事礼需特定季节
            const season = seasonName();
            if (['春', '夏'].indexOf(season) < 0) { pushNews('礼部', `颁历/耕耤/亲蚕宜在春夏之季亲行。`, 'normal'); return; }
            s.treasury = Math.max(0, s.treasury - 1);
            GameState.factions.civil = Math.min(100, GameState.factions.civil + 2);
            pushNews('礼部', `亲行${season}农事之礼（頒历·耕耤·亲蚕），民气为之一扬，民望+。`, 'normal');
        }
        l.cooldowns[method] = cd;
        l.done++;
        l.ticksIdle = 0;
        renderScreen();
    } catch (e) {}
}

function seasonName() {
    try { return SEASONS[GameState.currentSeason].name; } catch (e) { return ''; }
}

function lzcooldown(m) { try { const l = _lz(); return l.cooldowns[m]; } catch (e) { return 0; } }

// 礼制面板（挂 tech/emperor tab 尾部）
function renderLizhiTab() {
    try {
        const l = _lz(); if (!l) return '';
        const s = GameState.stats;
        let omenNote = '';
        try { if (GameState.omen && (GameState.omen.eclipse || GameState.omen.mandateLow)) omenNote = ' ⚠天象异常，祭禳灵验有变'; } catch (e) {}
        return `<div class="report-card"><div class="report-title">🏛 礼制大典</div>
            <div class="report-text">天命：${s.mandate}　威望：${s.prestige}　灵验感格：${l.spirit}${omenNote}</div>
            <div class="report-text">
                <button class="btn" onclick="lizhiAction('jitian')">祭天·南郊大祀(库-3)${lzcooldown('jitian') > 0 ? '[冷却' + lzcooldown('jitian') + '章]' : ''}</button>
                <button class="btn" onclick="lizhiAction('gaomiao')">告庙·太庙${lzcooldown('gaomiao') > 0 ? '[冷却' + lzcooldown('gaomiao') + '章]' : ''}</button>
                <button class="btn" onclick="lizhiAction('dayue')">大阅(库-2)${lzcooldown('dayue') > 0 ? '[冷却' + lzcooldown('dayue') + '章]' : ''}</button>
                <button class="btn" onclick="lizhiAction('nong')">农事礼·頒历耕耤亲蚕(库-1)${lzcooldown('nong') > 0 ? '[冷却' + lzcooldown('nong') + '章]' : ''}</button>
            </div>
            <div class="report-text"><i>《明史·礼志一》：冬至祀天于圜丘，孟春祈谷于南郊；《礼志三》：天子大阅。怠废礼、辄侥祭者，古人讥之。</i></div>
        </div>`;
    } catch (e) { return ''; }
}

console.log('✓ 批5·礼制大典加载完成');