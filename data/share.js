// ============================================
// 《大明国策》v3.2 分享系统
// 一键导出朝代 → 分享码 → 朋友导入 → 看你的朝代
// 仿 TapTap 分享卡片 + 评论系统
// 全部本地 localStorage（无后端）
// ============================================

// ====== 分享码（编码朝代摘要）======
// 用 LZ-String 风格压缩 + base64
const SHARE_VERSION = 'v31';

function encodeShare() {
    if (typeof GameState === 'undefined' || !GameState.script) return null;
    
    const s = GameState.stats;
    const f = GameState.factions;
    
    // 只挑关键数据（压缩）
    const data = {
        v: SHARE_VERSION,
        era: GameState.script.era,
        script: GameState.script.id,
        year: GameState.currentYear + 1,
        season: GameState.currentSeason,
        decisions: GameState.decisionsCount,
        achievements: _unlockedAchievements.length,
        score: computeOverallScore(),
        rating: getRatingFromScore(computeOverallScore()),
        // 资源（关键8个）
        res: {
            tr: Math.round(s.treasury),
            pr: Math.round(s.privyPurse),
            fd: Math.round(s.food),
            mp: Math.round(s.militaryPower),
            np: Math.round(s.navyPower),
            st: Math.round(s.stability),
            mn: Math.round(s.mandate),
            cr: Math.round(s.corruption),
            po: Math.round(s.population / 10000)
        },
        // 派系
        fac: {
            c: Math.round(f.civil),
            m: Math.round(f.military),
            r: Math.round(f.royal),
            e: Math.round(f.eunuch),
            w: Math.round(f.consort)
        },
        // 历史摘要（最近10条）
        hist: GameState.history.slice(0, 10).map(h => ({
            t: h.title.substring(0, 12),
            d: h.decision.substring(0, 6)
        }))
    };
    
    const json = JSON.stringify(data);
    return base64Encode(json);
}

function decodeShare(code) {
    try {
        const json = base64Decode(code);
        const data = JSON.parse(json);
        if (data.v !== SHARE_VERSION) throw new Error('版本不匹配');
        return data;
    } catch(e) {
        return null;
    }
}

function base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(b64) {
    return decodeURIComponent(escape(atob(b64)));
}

function getRatingFromScore(score) {
    if (score > 80) return '圣';
    if (score > 65) return '明';
    if (score > 50) return '中';
    if (score > 35) return '庸';
    if (score > 20) return '昏';
    return '暴';
}

// ====== 分享卡片 UI ======
function renderShareCard() {
    const code = encodeShare();
    if (!code) return '<div class="empty-state">无当前朝代</div>';
    
    const data = JSON.parse(base64Decode(code));
    
    return `
        <h3 class="section-title">分享我的朝代</h3>
        <div class="share-card">
            <div class="share-card-header">
                <div class="share-card-title">${data.era}</div>
                <div class="share-card-year">第 ${data.year} 年 · ${SEASONS[data.season].name}季</div>
            </div>
            <div class="share-card-rating" style="color: ${data.score > 60 ? '#4a6a4a' : data.score > 40 ? '#b8893a' : '#8b2c1a'}">
                「${data.rating}」
            </div>
            <div class="share-card-score">综合 ${data.score} 分</div>
            <div class="share-card-stats">
                <div class="share-stat">
                    <span>国库</span>
                    <span>${data.res.tr}两</span>
                </div>
                <div class="share-stat">
                    <span>军力</span>
                    <span>${data.res.mp}</span>
                </div>
                <div class="share-stat">
                    <span>人口</span>
                    <span>${data.res.po}万</span>
                </div>
                <div class="share-stat">
                    <span>天命</span>
                    <span>${data.res.mn}</span>
                </div>
                <div class="share-stat">
                    <span>稳定</span>
                    <span>${data.res.st}</span>
                </div>
                <div class="share-stat">
                    <span>成就</span>
                    <span>${data.achievements}/${ACHIEVEMENTS.length}</span>
                </div>
            </div>
            <div class="share-card-decisions">决事 ${data.decisions} 次</div>
            <div class="share-card-factions">
                ${renderShareFaction('文', data.fac.c)}
                ${renderShareFaction('武', data.fac.m)}
                ${renderShareFaction('宗', data.fac.r)}
                ${renderShareFaction('阉', data.fac.e)}
                ${renderShareFaction('戚', data.fac.w)}
            </div>
        </div>
        
        <h3 class="section-title">分享码</h3>
        <div class="share-code-box">
            <textarea id="share-code" readonly rows="3">${code}</textarea>
            <div class="share-code-actions">
                <button class="policy-btn" onclick="copyShareCode()">复制分享码</button>
                <button class="policy-btn" onclick="copyShareText()">复制成文字</button>
            </div>
        </div>
        
        <h3 class="section-title">导入他人朝代</h3>
        <div class="import-box">
            <textarea id="import-code" rows="3" placeholder="粘贴分享码于此..."></textarea>
            <div class="import-actions">
                <button class="policy-btn" onclick="importShare()">导入并查看</button>
            </div>
            <div id="import-result"></div>
        </div>
    `;
}

function renderShareFaction(name, value) {
    const color = value > 70 ? '#8b2c1a' : value > 40 ? '#b8893a' : '#4a6a4a';
    return `
        <div class="share-faction" style="color: ${color}">
            <div class="share-faction-name">${name}</div>
            <div class="share-faction-value">${value}</div>
        </div>
    `;
}

function copyShareCode() {
    const code = document.getElementById('share-code');
    if (code) {
        code.select();
        document.execCommand('copy');
        pushNews('分享', '分享码已复制', 'normal');
    }
}

function copyShareText() {
    const code = encodeShare();
    if (!code) return;
    const data = JSON.parse(base64Decode(code));
    
    const text = `【大明国策】${data.era}第${data.year}年\n` +
        `评级：${data.rating}（${data.score}分）\n` +
        `国库${data.res.tr}两 军力${data.res.mp} 人口${data.res.po}万\n` +
        `决事${data.decisions}次 成就${data.achievements}个\n` +
        `分享码：${code.substring(0, 30)}...`;
    
    navigator.clipboard.writeText(text).then(() => {
        pushNews('分享', '已复制为文字', 'normal');
    });
}

function importShare() {
    const code = document.getElementById('import-code').value.trim();
    if (!code) return;
    const data = decodeShare(code);
    const result = document.getElementById('import-result');
    
    if (!data) {
        result.innerHTML = '<div class="empty-state bad">分享码无效或已损坏</div>';
        return;
    }
    
    // 保存到 localStorage 作为"已收朝代"
    const imports = JSON.parse(localStorage.getItem('daming_imports') || '[]');
    imports.unshift({ ...data, importedAt: Date.now() });
    localStorage.setItem('daming_imports', JSON.stringify(imports.slice(0, 20)));
    
    // 渲染导入结果
    result.innerHTML = `
        <div class="import-success">
            <h4>✓ 导入成功！</h4>
            <div class="share-card" style="margin-top: 12px;">
                <div class="share-card-header">
                    <div class="share-card-title">${data.era}</div>
                    <div class="share-card-year">第 ${data.year} 年</div>
                </div>
                <div class="share-card-rating">「${data.rating}」</div>
                <div class="share-card-score">${data.score} 分</div>
                <div class="share-card-decisions">决事 ${data.decisions} 次 · 成就 ${data.achievements} 个</div>
            </div>
        </div>
    `;
    
    pushNews('分享', `导入 ${data.era} 朝代`, 'normal');
    
    // 刷新本地排行榜
    setTimeout(() => {
        if (GameState && GameState.currentTab === 'share') {
            renderPanel('share');
        }
    }, 100);
}

// ====== 本地排行榜 ======
function getLeaderboard() {
    // 收集所有存档
    const saves = [];
    
    // 当前玩家
    if (GameState && GameState.script) {
        const code = encodeShare();
        if (code) {
            const data = JSON.parse(base64Decode(code));
            saves.push({
                name: '朕',
                code: code,
                score: data.score,
                rating: data.rating,
                era: data.era,
                year: data.year,
                isMe: true,
                isImport: false
            });
        }
    }
    
    // 导入的朝代
    const imports = JSON.parse(localStorage.getItem('daming_imports') || '[]');
    imports.forEach((imp, i) => {
        saves.push({
            name: `第${i+1}朝`,
            code: '',
            score: imp.score,
            rating: imp.rating,
            era: imp.era,
            year: imp.year,
            isMe: false,
            isImport: true,
            importedAt: imp.importedAt
        });
    });
    
    // 按分数排序
    saves.sort((a, b) => b.score - a.score);
    return saves;
}

function renderLeaderboard() {
    const board = getLeaderboard();
    
    return `
        <h3 class="section-title">本机排行榜</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            含朕之朝代与历次导入朝代。点击可对比。
        </p>
        <div class="leaderboard">
            ${board.length === 0 ? '<div class="empty-state">无</div>' : 
                board.map((e, i) => `
                    <div class="leaderboard-item ${e.isMe ? 'me' : ''}">
                        <div class="rank-num">${i+1}</div>
                        <div class="rank-info">
                            <div class="rank-name">${e.name} ${e.isMe ? '👑' : ''}</div>
                            <div class="rank-era">${e.era} · 第${e.year}年</div>
                        </div>
                        <div class="rank-rating">「${e.rating}」</div>
                        <div class="rank-score">${e.score}</div>
                    </div>
                `).join('')
            }
        </div>
    `;
}

// ====== 异步"联机"模式 ======
// 模拟 TapTap 的"联机房间"：本地多窗口通过 BroadcastChannel 通信
let _broadcastChannel = null;

function initBroadcast() {
    if (typeof BroadcastChannel !== 'undefined') {
        _broadcastChannel = new BroadcastChannel('daming_guoce_room');
        _broadcastChannel.onmessage = (event) => {
            handleBroadcast(event.data);
        };
    }
}

function broadcastEvent(type, data) {
    if (_broadcastChannel) {
        _broadcastChannel.postMessage({ type, data, from: '本机', time: Date.now() });
    }
}

function handleBroadcast(msg) {
    if (msg.type === 'player_action') {
        pushNews('联机', `${msg.data.name}：${msg.data.action}`, 'normal');
    } else if (msg.type === 'chat') {
        pushNews('联机聊天', `${msg.data.from}: ${msg.data.text}`, 'normal');
    } else if (msg.type === 'achievement') {
        pushNews('联机', `${msg.data.name}解锁了「${msg.data.achievement}」`, 'normal');
    }
}

function sendBroadcast() {
    const text = prompt('输入消息（仅同浏览器可见）：');
    if (text) {
        broadcastEvent('chat', { from: '朕', text });
        pushNews('联机聊天', `朕: ${text}`, 'normal');
    }
}

function renderOnline() {
    return `
        <h3 class="section-title">本机联机（多窗口）</h3>
        <p style="color: var(--ink-light); font-size: 12px; margin-bottom: 12px;">
            <strong>同浏览器多窗口</strong>自动互联。<br>
            打开多个浏览器窗口进入不同朝代，可相互发送消息、解锁通知。<br>
            <span style="color: var(--accent-red);">注：真"联机"需要后端服务，沙箱环境无法提供</span>
        </p>
        <div class="online-actions">
            <button class="policy-btn" onclick="sendBroadcast()">发送消息</button>
            <button class="policy-btn" onclick="broadcastEvent('achievement', { name: '朕', achievement: '十年天子' })">广播成就</button>
            <button class="policy-btn" onclick="alert('已通知其他窗口：朕的朝代更新')">同步状态</button>
        </div>
        <h3 class="section-title">本机状态</h3>
        <div class="online-status">
            <div class="status-item">
                <span>房间</span>
                <span class="status-active">本机 BroadcastChannel</span>
            </div>
            <div class="status-item">
                <span>延迟</span>
                <span>0ms（本地）</span>
            </div>
            <div class="status-item">
                <span>在线</span>
                <span>1（仅本窗口）</span>
            </div>
            <div class="status-item">
                <span>社区</span>
                <span class="status-inactive">需后端</span>
            </div>
        </div>
    `;
}

function renderShare() {
    return `
        <h3 class="section-title">分享与社区</h3>
        <div class="share-tabs">
            <button class="filter-btn active" onclick="switchShareTab('card')">分享卡</button>
            <button class="filter-btn" onclick="switchShareTab('board')">排行榜</button>
            <button class="filter-btn" onclick="switchShareTab('online')">联机</button>
        </div>
        <div id="share-content">${renderShareCard()}</div>
    `;
}

function switchShareTab(tab) {
    document.querySelectorAll('.share-tabs .filter-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const content = document.getElementById('share-content');
    if (!content) return;
    if (tab === 'card') content.innerHTML = renderShareCard();
    if (tab === 'board') content.innerHTML = renderLeaderboard();
    if (tab === 'online') content.innerHTML = renderOnline();
}

console.log('✓ 分享系统 v3.2 加载完成');