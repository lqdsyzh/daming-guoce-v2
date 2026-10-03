// ============================================
// 《大明国策》批2 模块A：两京十三布政司 + 九边舆图
// 24格 = 15行政区（《明史·地理志》）+ 9九边重镇（《明史·兵志》）
// 纯 CSS grid 绘制，6列×4行近似地理方位，零外部库
// 反爽游：巡视限频、赈灾修边有国库代价，不做白嫖爽点
// ============================================

// ====== 24格舆图数据（row/col 为 6列×4行 grid 坐标，上北下南左西右东）======
const MAP_REGIONS = [
    // 第一行（北境九边线，西→东：甘肃最西北，辽东蓟州宣府大同沿东北-北一线）
    { key: 'gansu',      name: '甘肃',   row: 1, col: 1, border: true,  desc: '嘉峪关外，西域孔道，赤斤蒙古诸卫所系。', kw: ['甘肃', '嘉峪', '赤斤'] },
    { key: 'ningxia',    name: '宁夏',   row: 1, col: 2, border: true,  desc: '贺兰山下，河套之南，铁骑出没之地。', kw: ['宁夏', '贺兰', '哱拜', '安化'] },
    { key: 'yansui',     name: '延绥',   row: 1, col: 3, border: true,  desc: '榆林边墙，戍卒骁勇敢战。', kw: ['延绥', '榆林'] },
    { key: 'datong',     name: '大同',   row: 1, col: 4, border: true,  desc: '代藩封地，马市互易，北虏南犯必经。', kw: ['大同', '鞑靼'] },
    { key: 'xuanfu',     name: '宣府',   row: 1, col: 5, border: true,  desc: '京师门户，北门锁钥，边墙绵亘。', kw: ['宣府', '北疆', '雪灾'] },
    { key: 'jizhou',     name: '蓟州',   row: 1, col: 6, border: true,  desc: '拱卫京师，边墙东段要冲。', kw: ['蓟州'] },
    // 第二行（内边+京畿一线）
    { key: 'shaanxi',    name: '陕西',   row: 2, col: 1, border: false, desc: '边镇林立，茶马盐利，民风刚劲。', kw: ['陕西', '关中', '西安'] },
    { key: 'guyuan',     name: '固原',   row: 2, col: 2, border: true,  desc: '三边总制驻节，内拱关陇。', kw: ['固原', '三边', '九边'] },
    { key: 'shanxizhen', name: '山西镇', row: 2, col: 3, border: true,  desc: '太原镇城，盐铁所聚，偏头雁门要害。', kw: ['山西镇', '太原', '偏头', '雁门'] },
    { key: 'shanxi',     name: '山西',   row: 2, col: 4, border: false, desc: '晋商盐路，行都司卫所密布。', kw: ['山西'] },
    { key: 'beizhili',   name: '北直隶', row: 2, col: 5, border: false, desc: '京师所在，漕运中枢，陵寝攸关。', kw: ['北直隶', '京师', '京畿', '顺天', '燕王', '蝗'] },
    { key: 'liaodong',   name: '辽东',   row: 2, col: 6, border: true,  desc: '屏蔽京师之左臂，建州女真渐炽。', kw: ['辽东', '女真', '建州'] },
    // 第三行（腹地一线）
    { key: 'sichuan',    name: '四川',   row: 3, col: 1, border: false, desc: '天府之国，蜀道天险，播州接壤。', kw: ['四川', '蜀道', '播州'] },
    { key: 'guizhou',    name: '贵州',   row: 3, col: 2, border: false, desc: '苗疆多事，驿道初通，土司杂处。', kw: ['贵州', '水西', '苗疆'] },
    { key: 'henan',      name: '河南',   row: 3, col: 3, border: false, desc: '中州沃土，河患所系。', kw: ['河南', '开封', '河决', '黄河'] },
    { key: 'shandong',   name: '山东',   row: 3, col: 4, border: false, desc: '孔孟之乡，漕渠所经，登莱海防。', kw: ['山东', '登莱'] },
    { key: 'huguang',    name: '湖广',   row: 3, col: 5, border: false, desc: '鱼米之乡，武昌扼要，荆襄流民。', kw: ['湖广', '武昌', '荆襄'] },
    { key: 'nanzhili',   name: '南直隶', row: 3, col: 6, border: false, desc: '留都应天，赋税半天下。', kw: ['南直隶', '江南', '应天', '南京', '瘟疫'] },
    // 第四行（西南-东南沿海）
    { key: 'yunnan',     name: '云南',   row: 4, col: 1, border: false, desc: '银矿土司，边徼万里，麓川旧地。', kw: ['云南', '麓川', '土司'] },
    { key: 'guangxi',    name: '广西',   row: 4, col: 2, border: false, desc: '大藤峡旧地，狼兵悍勇。', kw: ['广西', '大藤峡'] },
    { key: 'jiangxi',    name: '江西',   row: 4, col: 3, border: false, desc: '瓷都赋税，书院文盛，宁藩所封。', kw: ['江西', '宁王', '景德镇'] },
    { key: 'zhejiang',   name: '浙江',   row: 4, col: 4, border: false, desc: '丝盐鱼米，市舶之利，倭警时闻。', kw: ['浙江', '倭', '海啸', '东南'] },
    { key: 'fujian',     name: '福建',   row: 4, col: 5, border: false, desc: '海禁前沿，市舶通番，卫所空虚。', kw: ['福建', '闽', '海防'] },
    { key: 'guangdong',  name: '广东',   row: 4, col: 6, border: false, desc: '番舶互市，珠池银矿，琼崖遥制。', kw: ['广东', '琼州', '番舶'] }
];

// ====== 四剧本开局差异（史实依据：《明史》纪事本末各卷）======
// 成化：荆襄流民(湖广黄)/大藤峡瑶乱(广西黄)/建州之警(辽东黄)
// 正德：安化王反宁夏(红)/蓝廷瑞乱四川(黄)/江西华林贼(黄)
// 万历二十年：哱拜乱宁夏(红)/辽东女真(黄)/播州杨应龙(贵州黄)
// 天启：辽沈陷落(辽东红)/奢安之乱(贵州红)/徐鸿儒白莲教(山东黄)/红夷闽海(福建黄)
const MAP_SCRIPT_INIT = {
    chenghua: { huguang: 1, guangxi: 1, liaodong: 1 },
    zhengde:  { ningxia: 2, sichuan: 1, jiangxi: 1 },
    wanli:    { ningxia: 2, liaodong: 1, guizhou: 1 },
    tianqi:   { liaodong: 2, guizhou: 2, shandong: 1, fujian: 1 }
};

// ====== 巡视冷却：每地区每5章1次 ======
const MAP_PATROL_CD = 5;
// 赈灾修边国库代价（千两级资源，反爽游：不白嫖转绿）
const MAP_RELIEF_COST = 1000;

// ====== "章"计数（一季推进 = 一章；用于限频）======
function getMapTick() {
    try {
        return (GameState.currentYear * 4) + GameState.currentSeason + GameState.currentMonth + 1;
    } catch (e) { return 1; }
}

// ====== 舆图状态初始化（含剧本开局差异）======
function initMapState(scriptId) {
    const md = { status: {}, lastPatrol: {}, lastTag: null };
    try {
        MAP_REGIONS.forEach(r => { md.status[r.key] = 0; });
        const init = MAP_SCRIPT_INIT[scriptId] || {};
        Object.keys(init).forEach(k => { md.status[k] = init[k]; });
    } catch (e) {}
    return md;
}

// ====== 状态点样式（安定绿/警兆黄/叛乱灾荒红）======
function mapStatusClass(key) {
    try {
        const st = (GameState.mapData && GameState.mapData.status) ? (GameState.mapData.status[key] || 0) : 0;
        return st === 2 ? 'map-red' : st === 1 ? 'map-yellow' : 'map-green';
    } catch (e) { return 'map-green'; }
}

// ====== 事件打点：按事件文本关键词映射地区（同章同格不叠加）======
function tagMapRegionByEvent(event) {
    try {
        if (!event || GameState.gameOver) return;
        if (!GameState.mapData || !GameState.mapData.status) return;
        // 仅灾害/边患/叛乱类打点
        if (event.type !== 'disaster' && event.type !== 'border' && event.type !== 'royal') return;
        const text = (event.title || '') + (event.desc || '');
        // 级别：默认警兆黄；边患叛乱、京师重灾 → 红
        let level = 1;
        if (event.type === 'border' && /反|叛|崛起|破关/.test(text)) level = 2;
        if (event.type === 'royal' && /不轨|不臣|叛/.test(text)) level = 2;
        if (event.type === 'disaster' && /京师|宫殿/.test(text)) level = 2;
        // 关键词映射：按表序命中第一个地区
        let hit = null;
        for (const r of MAP_REGIONS) {
            if (r.kw.some(k => text.indexOf(k) >= 0)) { hit = r.key; break; }
        }
        if (!hit) return;
        // 取更高级别，同级幂等 → 单章不叠加
        const cur = GameState.mapData.status[hit] || 0;
        if (level > cur) GameState.mapData.status[hit] = level;
        // 记录本次打点（供事件处置后收敛判定）
        GameState.mapData.lastTag = { key: hit, title: event.title || '', tick: getMapTick() };
    } catch (e) {}
}

// ====== 事件处置后收敛：正面处置（赈灾/出兵/拨款）→ 该地区转安定 ======
function settleMapRegionByChoice(event, opt) {
    try {
        if (!GameState.mapData || !GameState.mapData.lastTag) return;
        const tag = GameState.mapData.lastTag;
        if (!event || tag.title !== (event.title || '')) return;
        const eff = (opt && opt.effect) || {};
        // 正面处置：抚恤/拨款/出兵/放粮
        const positive = (eff.stability || 0) >= 3 ||
                         (eff.treasury || 0) <= -500 ||
                         (eff.militaryPower || 0) < 0 ||
                         (eff.food || 0) <= -500;
        if (positive && (GameState.mapData.status[tag.key] || 0) > 0) {
            GameState.mapData.status[tag.key] = 0;
        }
        GameState.mapData.lastTag = null;
    } catch (e) {}
}

// ====== 舆图 tab 渲染（renderPanel case 'map'）======
function renderMapTab() {
    // 旧档/异常兜底：mapData 缺失时按当前剧本初始化
    try {
        if (!GameState.mapData || !GameState.mapData.status) {
            GameState.mapData = initMapState(GameState.script ? GameState.script.id : 'chenghua');
        }
    } catch (e) {}
    const cells = MAP_REGIONS.map(r => {
        const cls = mapStatusClass(r.key);
        const borderCls = r.border ? ' map-cell-border' : '';
        return `<div class="map-cell${borderCls} ${cls}" style="grid-row:${r.row};grid-column:${r.col}" onclick="openMapCellModal('${r.key}')">` +
               `<span class="map-cell-dot"></span><span class="map-cell-name">${r.name}</span></div>`;
    }).join('');
    return `
        <div class="report-title">兵部 · 舆图总览</div>
        <div class="map-legend">
            <span><i class="map-legend-dot map-green-bg"></i>安定</span>
            <span><i class="map-legend-dot map-yellow-bg"></i>警兆</span>
            <span><i class="map-legend-dot map-red-bg"></i>叛乱灾荒</span>
            <span><i class="map-legend-line"></i>九边重镇</span>
        </div>
        <div class="map-grid">${cells}</div>
        <div class="map-note">据《明史·地理志》两京十三布政司、《明史·兵志》九边重镇绘就。点击地区巡视赈灾，均有时耗与库帑之费。</div>
    `;
}

// ====== 地区况卡浮层 ======
function openMapCellModal(key) {
    try {
        DamingSFX.play('click');
    } catch (e) {}
    try {
        if (!GameState.mapData || !GameState.mapData.status) {
            GameState.mapData = initMapState(GameState.script ? GameState.script.id : 'chenghua');
        }
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        window._mapCurrentKey = key;
        const st = GameState.mapData.status[key] || 0;
        const stName = st === 2 ? '叛乱灾荒' : st === 1 ? '警兆' : '安定';
        document.getElementById('map-cell-name').textContent = r.name;
        document.getElementById('map-cell-tag').textContent = r.border ? '九边重镇' : '布政司';
        document.getElementById('map-cell-desc').textContent = r.desc;
        const statusEl = document.getElementById('map-cell-status');
        statusEl.textContent = `当前状态：${stName}`;
        statusEl.className = 'map-cell-status ' + (st === 2 ? 'map-red-text' : st === 1 ? 'map-yellow-text' : 'map-green-text');
        renderMapCellActions();
        document.getElementById('map-modal').classList.add('active');
    } catch (e) {}
}

function closeMapModal() {
    try {
        document.getElementById('map-modal').classList.remove('active');
    } catch (e) {}
}

// ====== 地区动作渲染（巡视/赈灾修边，含冷却与可用性）======
function renderMapCellActions() {
    try {
        const box = document.getElementById('map-cell-actions');
        const cool = document.getElementById('map-cell-cool');
        if (!box) return;
        const key = window._mapCurrentKey;
        if (!key) return;
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        const st = GameState.mapData.status[key] || 0;
        const tick = getMapTick();
        const last = (GameState.mapData.lastPatrol && GameState.mapData.lastPatrol[key] !== undefined) ? GameState.mapData.lastPatrol[key] : -99;
        const remain = MAP_PATROL_CD - (tick - last);
        let coolText;
        if (remain > 0) {
            coolText = `巡视已毕，须再候 ${remain} 章。`;
            box.innerHTML = `<button class="map-act-btn" disabled>巡视（威望+1，冷却中）</button>` +
                (st > 0 ? `<button class="map-act-btn map-act-relief" onclick="mapRelief('${key}')">赈灾修边（国库 -${MAP_RELIEF_COST}两）</button>` : '');
        } else {
            coolText = '巡视可行。';
            box.innerHTML = `<button class="map-act-btn" onclick="mapPatrol('${key}')">巡视（威望+1）</button>` +
                (st > 0 ? `<button class="map-act-btn map-act-relief" onclick="mapRelief('${key}')">赈灾修边（国库 -${MAP_RELIEF_COST}两）</button>` : '');
        }
        // 批3：九边红警格「命将出师」入口（出师期间锁定该格，全局仅一路王师）
        if (r.border && st === 2) {
            if (typeof expeditionLocks === 'function' && expeditionLocks(key)) {
                box.innerHTML += '<div class="map-exp-lock">大军在外，静候战报。</div>';
            } else if (GameState.mapData.expedition) {
                box.innerHTML += '<button class="map-act-btn map-act-exp" disabled>他军已出，不宜两线兴师</button>';
            } else if (typeof openExpModal === 'function') {
                box.innerHTML += `<button class="map-act-btn map-act-exp" onclick="openExpModal('${key}')">命将出师（选帅调饷）</button>`;
            }
        }
        if (cool) cool.textContent = coolText;
        // 赈灾按钮在国库不足时禁用（反爽游：不许透支白嫖）
        const reliefBtn = box.querySelector('.map-act-relief');
        if (reliefBtn && GameState.stats.treasury < MAP_RELIEF_COST) {
            reliefBtn.disabled = true;
        }
    } catch (e) {}
}

// ====== 动作：巡视（威望+1，每地区每5章1次）======
function mapPatrol(key) {
    try {
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        // 批3：出师期间锁该边镇其他动作
        if (typeof expeditionLocks === 'function' && expeditionLocks(key)) {
            pushNews('舆图', `大军出征${r.name}，诸务暂罢，静候战报。`, 'normal');
            renderMapCellActions();
            return;
        }
        const tick = getMapTick();
        const last = (GameState.mapData.lastPatrol && GameState.mapData.lastPatrol[key] !== undefined) ? GameState.mapData.lastPatrol[key] : -99;
        if (tick - last < MAP_PATROL_CD) {
            pushNews('舆图', `巡查${r.name}未逾五章，不必频劳车驾。`, 'normal');
            renderMapCellActions();
            return;
        }
        GameState.mapData.lastPatrol[key] = tick;
        GameState.stats.prestige = Math.min(100, GameState.stats.prestige + 1);
        try { DamingSFX.play('auspicious'); } catch (e) {}
        pushNews('舆图', `车驾巡视${r.name}，军民相安，威望 +1。`, 'normal');
        renderMapCellActions();
        updateUI();
        renderPanel(GameState.currentTab);
    } catch (e) {}
}

// ====== 动作：赈灾修边（仅红黄格可用，国库有代价，转安定）======
function mapRelief(key) {
    try {
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        // 批3：出师期间锁该边镇其他动作
        if (typeof expeditionLocks === 'function' && expeditionLocks(key)) {
            pushNews('舆图', `大军出征${r.name}，赈恤由随军宪司代行，静候战报。`, 'normal');
            renderMapCellActions();
            return;
        }
        const st = GameState.mapData.status[key] || 0;
        if (st <= 0) {
            pushNews('舆图', `${r.name}本自安定，无庸赈恤。`, 'normal');
            return;
        }
        if (GameState.stats.treasury < MAP_RELIEF_COST) {
            pushNews('舆图', `国库不足，无从赈济${r.name}。`, 'critical');
            return;
        }
        GameState.stats.treasury -= MAP_RELIEF_COST;
        GameState.mapData.status[key] = 0;
        try { DamingSFX.play('coin'); } catch (e) {}
        pushNews('舆图', `发帑赈济${r.name}，地方渐安（国库 -${MAP_RELIEF_COST}两）。`, 'normal');
        renderMapCellActions();
        updateUI();
        renderPanel(GameState.currentTab);
    } catch (e) {}
}

// ============================================
// 批4：舆图扩展（2→7种操作）
// 新增：屯田/修城/移民/开市/建卫所
// 每格可操作，各有限频/代价
// 反爽铁律：每操作都有权衡代价
// ============================================

const MAP_EXT_CD = 4;  // 每扩展操作4章冷却

// ====== 扩展操作定义 ======
const MAP_EXT_ACTIONS = {
    tuntian: {
        name: '屯田', desc: '军屯开垦，2章后粮+300',
        cost: { treasury: -400 }, effect: { food: 300, agriculture: 1 },
        delay: 2,  // 延迟2章生效
        src: '《明史》卷77·食货志：军屯之制'
    },
    repair: {
        name: '修城', desc: '加固城防',
        cost: { treasury: -600, stone: -100 }, effect: { militaryPower: 2, stability: 1 },
        src: '《明史》卷68·河渠志：筑城修堤'
    },
    migrate: {
        name: '移民', desc: '调配人口',
        cost: { treasury: -200 }, effect: { population: 50000, stability: -1 },
        src: '演绎（明代移民实边）'
    },
    market: {
        name: '开市', desc: '开设边市',
        cost: { treasury: -300 }, effect: { commerce: 2, horses: 50 },
        requireBorder: true,
        src: '《明史》卷327·俺答传：隆庆和议开马市'
    },
    weisuo: {
        name: '建卫所', desc: '增设卫所驻军',
        cost: { treasury: -500, iron: -50 }, effect: { militaryPower: 3, stability: -1 },
        requireBorder: true,
        src: '《明史》卷90·兵志：卫所之制'
    }
};

// ====== 扩展动作渲染 ======
function renderMapCellActionsExt() {
    try {
        const box = document.getElementById('map-cell-actions');
        if (!box) return;
        const key = window._mapCurrentKey;
        if (!key) return;
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        const tick = getMapTick();
        if (!GameState.mapData.extCd) GameState.mapData.extCd = {};
        const extBtns = Object.entries(MAP_EXT_ACTIONS).map(([k, a]) => {
            const cdKey = 'ext_' + key + '_' + k;
            const lastCd = GameState.mapData.extCd[cdKey] || -99;
            const cooling = (tick - lastCd) < MAP_EXT_CD;
            const remain = cooling ? (MAP_EXT_CD - (tick - lastCd)) : 0;
            // 边镇限制
            if (a.requireBorder && !r.border) return '';
            // 资源检查
            let canAfford = true;
            for (const [rk, rv] of Object.entries(a.cost)) {
                if ((GameState.stats[rk] || 0) < Math.abs(rv)) canAfford = false;
            }
            const disabled = cooling || !canAfford;
            const costStr = Object.entries(a.cost).map(([rk, rv]) => {
                const rn = RESOURCES[rk] ? RESOURCES[rk].name : rk;
                return `${rn} ${rv}`;
            }).join(' ');
            return `<button class="map-act-btn map-ext-btn" ${disabled ? 'disabled' : ''} onclick="mapExtAction('${key}','${k}')">${a.name}（${costStr}）${cooling ? '[' + remain + '章]' : ''}</button>`;
        }).join('');
        // 追加到现有动作后面（不替换）
        const existing = box.innerHTML;
        box.innerHTML = existing + extBtns;
    } catch (e) {}
}

// ====== 执行扩展动作 ======
function mapExtAction(key, actionKey) {
    try {
        const r = MAP_REGIONS.find(x => x.key === key);
        if (!r) return;
        const a = MAP_EXT_ACTIONS[actionKey];
        if (!a) return;
        if (!GameState.mapData.extCd) GameState.mapData.extCd = {};
        const tick = getMapTick();
        const cdKey = 'ext_' + key + '_' + actionKey;
        const lastCd = GameState.mapData.extCd[cdKey] || -99;
        if (tick - lastCd < MAP_EXT_CD) {
            pushNews('舆图', '前事未毕，稍候再行。', 'normal'); return;
        }
        // 资源检查
        for (const [rk, rv] of Object.entries(a.cost)) {
            if ((GameState.stats[rk] || 0) < Math.abs(rv)) {
                pushNews('舆图', '资储不充，无从兴工。', 'critical'); return;
            }
        }
        GameState.mapData.extCd[cdKey] = tick;
        // 扣资源
        for (const [rk, rv] of Object.entries(a.cost)) {
            GameState.stats[rk] = (GameState.stats[rk] || 0) + rv;
        }
        // 应用效果（有延迟的入队）
        if (a.delay && a.delay > 0) {
            if (!GameState.mapData.pendingEffects) GameState.mapData.pendingEffects = [];
            GameState.mapData.pendingEffects.push({ tick: tick + a.delay, key: key, action: actionKey, effect: a.effect });
            pushNews('舆图', `${a.name}于${r.name}兴工——${a.delay}章后见效。（${a.src}）`, 'normal');
        } else {
            for (const [ek, ev] of Object.entries(a.effect)) {
                if (ek in GameState.stats) GameState.stats[ek] = Math.max(0, Math.min(100, (GameState.stats[ek] || 0) + ev));
                else if (ek in GameState.factions) GameState.factions[ek] = Math.max(0, Math.min(100, GameState.factions[ek] + ev));
            }
            pushNews('舆图', `${a.name}于${r.name}工竣（${a.src}）`, 'normal');
        }
        try { DamingSFX.play('click'); } catch (e) {}
        enforceLimits();
        renderMapCellActions();
        updateUI();
    } catch (e) {}
}

// ====== 延迟效果结算（由advanceSeason调用）======
function tickMapPendingEffects() {
    try {
        if (!GameState.mapData || !GameState.mapData.pendingEffects) return;
        const tick = getMapTick();
        const remaining = [];
        GameState.mapData.pendingEffects.forEach(pe => {
            if (tick >= pe.tick) {
                for (const [ek, ev] of Object.entries(pe.effect)) {
                    if (ek in GameState.stats) GameState.stats[ek] = Math.max(0, Math.min(100, (GameState.stats[ek] || 0) + ev));
                    else if (ek in GameState.factions) GameState.factions[ek] = Math.max(0, Math.min(100, GameState.factions[ek] + ev));
                }
                const rname = MAP_REGIONS.find(r => r.key === pe.key);
                pushNews('舆图', `${rname ? rname.name : pe.key}之${MAP_EXT_ACTIONS[pe.action] ? MAP_EXT_ACTIONS[pe.action].name : pe.action}见效。`, 'normal');
            } else {
                remaining.push(pe);
            }
        });
        GameState.mapData.pendingEffects = remaining;
    } catch (e) {}
}

// 覆盖renderMapCellActions使扩展按钮生效
var _origRenderMapCellActions = renderMapCellActions;
renderMapCellActions = function() {
    _origRenderMapCellActions();
    renderMapCellActionsExt();
};
