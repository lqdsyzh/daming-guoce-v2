// ============================================
// 《大明国策》v3.0 奏折系统
// 完整重做：票拟-批红-执行 三段流程
// 仪式感：六部递折 → 内阁票拟 → 御笔朱批 → 部门执行
// ============================================

// ====== 六部（递折部门）======
const MINISTRIES = {
    bingbu:    { name: '兵部',   short: '兵', color: '#8b2c1a',  desc: '军政、驿传、边防' },
    libu:      { name: '礼部',   short: '礼', color: '#b8893a',  desc: '礼仪、科举、外事' },
    xingbu:    { name: '刑部',   short: '刑', color: '#6a5a4a',  desc: '律法、狱政、弹劾' },
    gongbu:    { name: '工部',   short: '工', color: '#5a4a3a',  desc: '营造、水利、屯田' },
    hubu:      { name: '户部',   short: '户', color: '#4a6a4a',  desc: '财赋、漕运、赈济' },
    libu_w:    { name: '吏部',   short: '吏', color: '#5a6a7a',  desc: '铨选、考核、俸禄' }
};

// ====== 批示用语20种 ======
const EDICTS_VERBS = {
    zhun:    { verb: '准奏',    effect: 'apply_option', hint: '陛下准奏。' },
    lan:     { verb: '览奏',    hint: '陛下览奏，未即批复。', effect: 'delay' },
    zhe:     { verb: '着所司议奏', hint: '命相关衙门复议。', effect: 'delay_to_dept' },
    gai:     { verb: '该部知道',  hint: '备案，不予执行。', effect: 'archive' },
    zhi:     { verb: '知道了',   hint: '不置可否。', effect: 'noop' },
    buzhun:  { verb: '不准',    hint: '驳回原奏。', effect: 'reject_option' },
    bi:      { verb: '不必',    hint: '不允所请。', effect: 'reject_option' },
    yan:     { verb: '严旨切责', hint: '严词申斥。', effect: 'reject_harsh' },
    gao:     { verb: '告尔臣僚', hint: '颁诏晓谕。', effect: 'edict_public' },
    shen:    { verb: '申饬',    hint: '申斥告诫。', effect: 'warn' },
    tan:     { verb: '严查',    hint: '命严加查办。', effect: 'investigate' },
    zhu:     { verb: '着斩',    hint: '立斩不赦。', effect: 'execute' },
    liu:     { verb: '着流',    hint: '流放远恶州军。', effect: 'exile' },
    chai:    { verb: '着抄',    hint: '抄没家产。', effect: 'confiscate' },
    mie:     { verb: '着诛',    hint: '诛灭九族。', effect: 'exterminate' },
    mian:    { verb: '着免',    hint: '罢官为民。', effect: 'dismiss' },
    jiang:   { verb: '着降',    hint: '降级调用。', effect: 'demote' },
    zeng:    { verb: '着赏',    hint: '赐金赐帛。', effect: 'reward' },
    chi:     { verb: '着敕',    hint: '颁发敕令。', effect: 'decree' },
    zhenshi: { verb: '朕自有主张', hint: '皇帝独断。', effect: 'autonomous' }
};

// ====== 御玺5种 ======
const IMPERIAL_SEALS = {
    zongzhi:  { name: '制诰之宝', use: '颁布诏书', desc: '朱文方印' },
    zhiyao:   { name: '制驭之宝', use: '任命将帅', desc: '金文圆印' },
    guobao:   { name: '国宝',     use: '册封藩王', desc: '玉质方印' },
    yuxi:     { name: '御玺',     use: '批红用印', desc: '金镶玉' },
    xiaoyin:  { name: '小印',     use: '私章批红', desc: '玉质随身' }
};

// ====== 奏折密级 ======
const MEMORIAL_LEVELS = {
    ben:     { name: '本章',   color: '#5a6a7a', desc: '一般公文', weight: 1 },
    ji:      { name: '急奏',   color: '#b8893a', desc: '紧急事务', weight: 3 },
    mi:      { name: '密奏',   color: '#8b2c1a', desc: '机密要事', weight: 5 }
};

// ====== 奏折模板生成 ======
function generateMemorials() {
    const all = [];
    
    // 户部奏折（财经）
    const huTemplates = [
        { min: { treasury: 12000 }, title: '国库盈余，请发帑银', content: '户部奏：近年国库充盈，帑银累积已过万两。请发内帑以赈济贫民。', options: [
            { text: '发内帑三千两赈济', effect: { privyPurse: -3000, stability: 5, civil: 5 } },
            { text: '暂缓发放', effect: { civil: -3 } },
            { text: '令户部议复', effect: { bureaucracy: 2 } }
        ]},
        { min: { treasury: -3000 }, title: '国库告急，请拨内帑', content: '户部奏：国库已入不敷出，兵饷难以发放。请旨拨内帑接济。', options: [
            { text: '准拨内帑五千两', effect: { privyPurse: -5000, treasury: 5000, civil: 3 } },
            { text: '命户部自筹', effect: { civil: -5 } }
        ]},
        { min: { canalEfficiency: 20 }, title: '运河淤塞，请旨疏浚', content: '漕运使奏：运河久不疏浚，漕船难行。岁损漕粮三万石。', options: [
            { text: '拨帑银八千两疏浚', effect: { treasury: -800, canalEfficiency: 15, food: 500, civil: 8 } },
            { text: '改行海运', effect: { navyPower: 500, canalEfficiency: -5 } },
            { text: '暂缓', effect: { civil: -3, food: -200 } }
        ]}
    ];
    
    // 兵部奏折
    const bingTemplates = [
        { min: { frontier: 60 }, title: '边报紧急', content: '九边奏报：虏酋入寇，烽火连天。请旨增兵。', options: [
            { text: '发兵增援', effect: { treasury: -3000, militaryPower: 1000, military: 10 } },
            { text: '命边将相机剿抚', effect: { military: 3 } },
            { text: '遣使议和', effect: { treasury: -1000, prestige: -5, military: -5 } }
        ]},
        { min: { militaryPower: 4000 }, title: '军伍空额', content: '兵部奏：京营军士空额过半。请旨募兵补伍。', options: [
            { text: '募兵五千', effect: { treasury: -2000, militaryPower: 5000, military: 5 } },
            { text: '裁减空额', effect: { military: -8, treasury: 500 } }
        ]}
    ];
    
    // 礼部
    const liTemplates = [
        { min: { mandate: 30 }, title: '请颁诏罪己', content: '礼部奏：天变屡见，民心不靖。请颁诏罪己，以收民心。', options: [
            { text: '颁诏罪己', effect: { mandate: 8, stability: 5, prestige: 5 } },
            { text: '不必', effect: { civil: -3 } }
        ]},
        { min: { culture: 30 }, title: '请增太学', content: '礼部奏：太学久废，士子无进身之阶。请增广生员。', options: [
            { text: '准增三百名', effect: { treasury: -500, culture: 10, civil: 5 } },
            { text: '缓议', effect: { civil: -3 } }
        ]}
    ];
    
    // 刑部
    const xingTemplates = [
        { min: { stability: 30 }, title: '民间械斗频发', content: '刑部奏：近年民间械斗、盗匪蜂起。请旨严打。', options: [
            { text: '命严打', effect: { stability: 5, eunuch: 5, civil: -3 } },
            { text: '命地方自办', effect: { civil: 3 } }
        ]}
    ];
    
    // 工部
    const gongTemplates = [
        { min: { treasury: 10000 }, title: '请修黄河堤', content: '工部奏：黄河堤年久失修，请旨拨帑修筑。', options: [
            { text: '准修', effect: { treasury: -3000, stability: 5, civil: 5, agriculture: 5 } },
            { text: '暂缓', effect: { civil: -3 } }
        ]}
    ];
    
    return [
        ...huTemplates.map(t => ({ ...t, ministry: 'hubu', level: 'ben' })),
        ...bingTemplates.map(t => ({ ...t, ministry: 'bingbu', level: 'ji' })),
        ...liTemplates.map(t => ({ ...t, ministry: 'libu', level: 'ben' })),
        ...xingTemplates.map(t => ({ ...t, ministry: 'xingbu', level: 'ben' })),
        ...gongTemplates.map(t => ({ ...t, ministry: 'gongbu', level: 'ben' }))
    ];
}

// ====== 票拟（内阁草拟批示意见）======
function generatePiNi(memorial) {
    const minister = MINISTRIES[memorial.ministry];
    const opinions = [
        {
            text: '准奏照办',
            reason: '该部所奏合于大体，臣等议如所请。',
            seal: 'guobao'
        },
        {
            text: '从缓议',
            reason: '该部所奏事关重大，宜详议而行。',
            seal: 'zongzhi'
        },
        {
            text: '驳回',
            reason: '该部所奏不合时宜，恐生民扰。',
            seal: 'yuxi'
        }
    ];
    return opinions[Math.floor(Math.random() * opinions.length)];
}

// ====== 显示奏折（仪式化）======
function showMemorial(memorial) {
    const modal = document.getElementById('memorial-modal');
    if (!modal) return;
    
    const minister = MINISTRIES[memorial.ministry];
    const level = MEMORIAL_LEVELS[memorial.level];
    
    // 票拟
    const piNi = generatePiNi(memorial);
    
    // 填充内容
    document.getElementById('memorial-ministry').textContent = minister.name + ' · ' + level.name;
    document.getElementById('memorial-ministry').style.color = level.color;
    document.getElementById('memorial-title').textContent = memorial.title;
    document.getElementById('memorial-content').textContent = memorial.content;
    document.getElementById('pini-text').textContent = piNi.text;
    document.getElementById('pini-reason').textContent = `内阁票拟：${piNi.reason}`;
    document.getElementById('seal-name').textContent = `用${IMPERIAL_SEALS[piNi.seal].name}`;
    document.getElementById('seal-desc').textContent = IMPERIAL_SEALS[piNi.seal].desc;
    
    // 选项：批示用语 + 实际效果
    const choicesContainer = document.getElementById('memorial-choices');
    choicesContainer.innerHTML = '';
    
    memorial.options.forEach((opt, i) => {
        // 从20种批示用语中选一个对应的
        const verbKeys = ['zhun', 'zhe', 'gai', 'buzhun', 'bi'];
        const verbKey = i === 0 ? 'zhun' : (i === memorial.options.length-1 ? 'buzhun' : 'zhe');
        
        const optEl = document.createElement('div');
        optEl.className = 'memorial-option';
        
        // 计算效果预览
        const hint = formatEffectHint(opt.effect);
        const effectPreview = formatEffectPreview(opt.effect);
        
        optEl.innerHTML = `
            <div class="memorial-option-seal">${verbKeys.includes(verbKey) ? getSealGlyph(verbKey) : '御'}</div>
            <div class="memorial-option-body">
                <div class="memorial-option-verb">${EDICTS_VERBS[verbKey].verb}</div>
                <div class="memorial-option-text">${opt.text}</div>
                <div class="memorial-option-effect">${effectPreview}</div>
                <div class="memorial-option-hint">${EDICTS_VERBS[verbKey].hint}</div>
            </div>
        `;
        optEl.onclick = () => {
            // 批1：朱笔落定音效
            try { DamingSFX.play('decide'); } catch (e) {}
            // 推进执行
            applyDecision(opt.effect);
            
            // 记录
            addToHistory({
                title: memorial.title,
                type: memorial.ministry.includes('bingbu') ? 'border' : 
                      memorial.ministry.includes('libu') ? 'royal' :
                      memorial.ministry.includes('hubu') ? 'economy' : 'internal'
            }, { text: EDICTS_VERBS[verbKey].verb + '·' + opt.text });
            
            pushNews(`${minister.name}奏`, `陛下${EDICTS_VERBS[verbKey].verb}：${memorial.title}`, 'normal');
            
            modal.classList.remove('active');
            GameState.decisionsCount++;
            
            // 处理积压
            if (GameState.memorialQueue) {
                GameState.memorialQueue.shift();
            }
            
            advanceSeason();
        };
        choicesContainer.appendChild(optEl);
    });
    
    modal.classList.add('active');
}

// ====== 御玺字形 ======
function getSealGlyph(verb) {
    return {
        zhun: '准', zhe: '议', gai: '知', buzhun: '驳', bi: '免',
        yan: '戒', shen: '审', tan: '查', zhu: '斩', liu: '流',
        chai: '抄', mie: '诛', mian: '免', jiang: '降', zeng: '赏',
        chi: '敕', zhenshi: '断', lan: '览', zhi: '知', gao: '告'
    }[verb] || '御';
}

// ====== 效果预览 ======
function formatEffectPreview(effect) {
    const items = [];
    for (const [key, value] of Object.entries(effect)) {
        if (key === 'punishment') continue;
        const name = (typeof RESOURCES !== 'undefined' && RESOURCES[key]) ? RESOURCES[key].name :
                     (typeof FACTIONS !== 'undefined' && FACTIONS[key]) ? FACTIONS[key].name : key;
        const sign = value > 0 ? '+' : '';
        items.push(`${name} ${sign}${value}`);
    }
    return items.join(' · ');
}

// ====== 奏折堆叠系统 ======
function generateMemorialQueue() {
    const queue = [];
    const allTemplates = generateMemorials();
    
    // 根据条件筛选
    const valid = allTemplates.filter(t => {
        if (!t.min) return true;
        return Object.entries(t.min).every(([k, v]) => {
            const val = k === 'treasury' || k === 'frontier' || k === 'population' || k === 'canalEfficiency' || k === 'militaryPower' || k === 'mandate' || k === 'culture' || k === 'stability' ? GameState.stats[k] : 0;
            return val >= v;
        });
    });
    
    // 随机挑2-4个
    const num = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < Math.min(num, valid.length); i++) {
        queue.push(valid[Math.floor(Math.random() * valid.length)]);
    }
    
    return queue;
}

// ====== 积压警告 ======
function checkMemorialBacklog() {
    if (!GameState.memorialQueue) GameState.memorialQueue = [];
    if (GameState.memorialQueue.length > 3) {
        pushNews('内阁', `奏折积压${GameState.memorialQueue.length}件，陛下当速览以免贻误。`, 'critical');
        GameState.stats.stability = Math.max(0, GameState.stats.stability - 2);
    }
}

console.log('✓ 奏折系统v3重做完毕');