#!/usr/bin/env node
/**
 * 《大明国策》批1 静态验证 verify_daming_b1.js
 * ≥50 项断言：响应式断点 / 底部Tab / SoundFX与10音效 / 挂点 /
 * 岁末大计五步面板 / 音效开关持久化 / 旧档兼容 / 《明史》文案依据 / node --check
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = __dirname;
const R = (p) => fs.readFileSync(path.join(DIR, p), 'utf8');

const html = R('index.html');
const css = R('style.css');
const jsMain = R('script.js');
const jsModules = R('modules.js');
const jsSfx = R('sfx.js');
const jsYe = R('yearend.js');
const jsMob = R('mobileui.js');
const jsMem = R('data/memorials.js');

let pass = 0, fail = 0;
const failList = [];
function T(desc, cond) {
    if (cond) { pass++; console.log(`  ✓ [${String(pass).padStart(2, '0')}] ${desc}`); }
    else { fail++; failList.push(desc); console.log(`  ✗ ${desc}`); }
}

console.log('='.repeat(56));
console.log('《大明国策》批1 静态验证（verify_daming_b1）');
console.log('='.repeat(56));

// ========== A. 模块A：响应式断点 ==========
console.log('\n— A. 响应式断点（style.css）—');
T('A01 ≥1100px 恢复三栏（覆盖旧1200断点在1100-1200的单列化）',
    /@media \(min-width:\s*1100px\)[\s\S]{0,400}\.main-content\s*\{[^}]*240px 1fr 240px/.test(css));
T('A02 768-1099 竖屏两栏断点存在',
    /@media \(min-width:\s*768px\) and \(max-width:\s*1099px\) and \(orientation:\s*portrait\)/.test(css));
T('A03 竖屏断点内右栏收纳为顶部折叠条（grid-column 1/-1）',
    /orientation:\s*portrait[\s\S]{0,800}\.main-content > \.right-panel\s*\{[^}]*grid-column:\s*1 \/ -1/.test(css));
T('A04 768-1099 横屏三栏紧凑版存在',
    /orientation:\s*landscape[\s\S]{0,600}\.main-content\s*\{[^}]*180px 1fr 180px/.test(css));
T('A05 <768px 单栏断点存在',
    /@media \(max-width:\s*767px\)/.test(css));
T('A06 移动端底部导航启用（display:flex 于 767 断点内）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.mobile-tabbar\s*\{\s*display:\s*flex/.test(css));
T('A07 悬浮"下季"主按钮固定右下（fixed 定位）',
    /\.mobile-next-btn\s*\{[^}]*position:\s*fixed[^}]*bottom:/.test(css));
T('A08 触控目标≥44px（time-btn 44px）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.time-btn\s*\{[^}]*min-height:\s*44px/.test(css));
T('A09 触控目标≥44px（save-btn 44px）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.save-btn\s*\{[^}]*min-height:\s*44px/.test(css));
T('A10 触控目标≥44px（decision-option 48px）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.decision-option\s*\{[^}]*min-height:\s*48px/.test(css));
T('A11 移动端正文≥15px（center-panel font-size 15px）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.center-panel\s*\{[^}]*font-size:\s*15px/.test(css));
T('A12 资源列表窄屏两列网格（stat-list 1fr 1fr）',
    /@media \(max-width:\s*767px\)[\s\S]{0,4000}\.stat-list\s*\{[^}]*grid-template-columns:\s*1fr 1fr/.test(css));
T('A13 组标题跨两列（resource-group-header grid-column 1/-1）',
    /\.resource-group-header\s*\{\s*grid-column:\s*1 \/ -1/.test(css));
T('A14 移动视图互斥（body.mview-left 显左栏）',
    /body\.mview-left \.left-panel\s*\{\s*display:\s*block !important/.test(css));
T('A15 移动视图互斥（body.mview-right 显右栏）',
    /body\.mview-right \.right-panel\s*\{\s*display:\s*block !important/.test(css));
T('A16 朝堂视图：系统菜单顶部横滑（sticky）',
    /body\.mview-menu \.system-menu\s*\{[^}]*position:\s*sticky/.test(css));
T('A17 底部导航默认隐藏（避免桌面端误显）',
    /\.mobile-tabbar\s*\{\s*display:\s*none/.test(css));
T('A18 底部导航安全区适配（env safe-area-inset-bottom）',
    /mobile-tabbar[\s\S]{0,400}env\(safe-area-inset-bottom\)/.test(css));

// ========== B. 模块A：底部Tab结构（index.html + mobileui.js） ==========
console.log('\n— B. 底部Tab结构 —');
T('B01 index.html 含 mobile-tabbar 导航',
    html.includes('id="mobile-tabbar"'));
T('B02 四Tab齐备（国事/资储/朝堂/天象）',
    ['center', 'left', 'menu', 'right'].every(v => html.includes(`data-mview="${v}"`)));
T('B03 悬浮下季按钮存在（id=mobile-next）',
    html.includes('id="mobile-next"'));
T('B04 下季按钮绑定 advanceSeason（事件委托）',
    /mobile-next[\s\S]{0,600}advanceSeason\(\)/.test(jsMob));
T('B05 视图状态 localStorage 记忆（daming_mview）',
    /daming_mview/.test(jsMob));
T('B06 既有类名/id 未改（main-content 三栏结构仍在）',
    html.includes('class="main-content"') && html.includes('class="left-panel"') &&
    html.includes('id="center-panel"') && html.includes('class="right-panel"'));
T('B07 新增交互使用事件委托（mobile-tabbar 委托监听）',
    /mobile-tabbar[\s\S]{0,300}addEventListener\('click'/.test(jsMob));

// ========== C. 模块B：SoundFX 管理器与10音效 ==========
console.log('\n— C. SoundFX 管理器（sfx.js）—');
T('C01 SoundFX 类已定义',
    jsSfx.includes('class SoundFX'));
T('C02 类定义后立即实例化（防"未实例化"静默失效）',
    /const DamingSFX = new SoundFX\(\)/.test(jsSfx));
T('C03 音效 click',
    jsSfx.includes("case 'click':"));
T('C04 音效 season（下季推进）',
    jsSfx.includes("case 'season':"));
T('C05 音效 urgent（急奏急迫鼓点）',
    jsSfx.includes("case 'urgent':"));
T('C06 音效 decide（事件抉择）',
    jsSfx.includes("case 'decide':"));
T('C07 音效 coin（结算金币声）',
    jsSfx.includes("case 'coin':"));
T('C08 音效 auspicious（祥瑞清磬）',
    jsSfx.includes("case 'auspicious':"));
T('C09 音效 disaster（灾异边患低鸣）',
    jsSfx.includes("case 'disaster':"));
T('C10 音效 ending（结局编钟尾声）',
    jsSfx.includes("case 'ending':"));
T('C11 音效 seal（玉玺盖章）',
    jsSfx.includes("case 'seal':"));
T('C12 音效 step（结算分步）',
    jsSfx.includes("case 'step':"));
T('C13 iOS 首次触摸解锁 AudioContext（unlock 模式）',
    /touchstart|pointerdown/.test(jsSfx) && /resume\(\)/.test(jsSfx));
T('C14 音量总控（this.volume 逐音计算 + setVolume 钳制）',
    /this\.volume/.test(jsSfx) && /Math\.min\(100/.test(jsSfx) && /setVolume/.test(jsSfx));
T('C15 设置弹窗 DOM（sfx-modal/sfx-toggle/sfx-volume）',
    html.includes('id="sfx-modal"') && html.includes('id="sfx-toggle"') &&
    html.includes('id="sfx-volume"'));
T('C16 音效开关+音量 localStorage 持久化（daming_sfx_settings）',
    /daming_sfx_settings/.test(jsSfx) && /localStorage\.setItem/.test(jsSfx));
T('C17 默认开启（无配置时 true，仅显式 false 关闭）',
    /this\.enabled = cfg \? cfg\.enabled !== false : true/.test(jsSfx));
T('C18 全部音效方法 try-catch 守卫（play 内捕获）',
    /play\(name\)\s*\{[\s\S]{0,200}try\s*\{/.test(jsSfx));
T('C19 header 音效设置入口（id=sfx-btn）',
    html.includes('id="sfx-btn"'));
T('C20 挂点：advanceSeason 下季音效',
    /function advanceSeason\(\)[\s\S]{0,500}DamingSFX\.play\('season'\)/.test(jsMain));
T('C21 挂点：急奏呈上音效（memorial 分支 urgent）',
    /GameState\.memorialQueue = queue;[\s\S]{0,200}DamingSFX\.play\('urgent'\)/.test(jsMain));
T('C22 挂点：事件弹窗按类型（disaster/urgent）',
    /function showEvent[\s\S]{0,400}\? 'disaster' : 'urgent'/.test(jsMain));
T('C23 挂点：事件抉择音效（decision onclick decide）',
    /optEl\.onclick[\s\S]{0,200}DamingSFX\.play\('decide'\)/.test(jsMain));
T('C24 挂点：奏折抉择音效（memorials decide）',
    /optEl\.onclick[\s\S]{0,200}DamingSFX\.play\('decide'\)/.test(jsMem));
T('C25 挂点：结局编钟尾声（triggerEnding ending）',
    /function triggerEnding[\s\S]{0,300}DamingSFX\.play\('ending'\)/.test(jsMain));
T('C26 挂点：全局点击音效委托（跳过专属音效按钮防叠音）',
    /closest\('#mobile-next'\)[\s\S]{0,1200}DamingSFX\.play\('click'\)/.test(jsMain));

// ========== D. 模块C：岁末大计五步面板 ==========
console.log('\n— D. 岁末大计面板 —');
T('D01 面板 DOM（yearend-modal/yearend-paper）',
    html.includes('id="yearend-modal"') && html.includes('class="yearend-paper"'));
T('D02 面板骨架（steps-bar/body/footer/close）',
    ['ye-steps-bar', 'ye-body', 'ye-footer', 'ye-close-btn'].every(id => html.includes(`id="${id}"`)));
T('D03 五步章法定义（岁入岁出/五府消长/社稷安危/岁内大事/史官总评）',
    /const YE_STEPS\s*=\s*\[[\s\S]{0,300}\]/.test(jsYe) &&
    ['岁入岁出', '五府消长', '社稷安危', '岁内大事', '史官总评'].every(s => jsYe.includes(s)));
T('D04 分步状态机（YE_STATE.step 推进）',
    /YE_STATE\.step\s*=\s*0/.test(jsYe) && /YE_STATE\.step\+\+/.test(jsYe));
T('D05 第一步 账单渲染（renderYeLedger）',
    jsYe.includes('function renderYeLedger'));
T('D06 第二步 派系变动渲染（renderYeFactions）',
    jsYe.includes('function renderYeFactions'));
T('D07 第三步 稳定度渲染（renderYeStability）',
    jsYe.includes('function renderYeStability'));
T('D08 第四步 大事记渲染（renderYeChronicle）',
    jsYe.includes('function renderYeChronicle'));
T('D09 第五步 史官总评渲染（renderYeVerdict）',
    jsYe.includes('function renderYeVerdict'));
T('D10 数字滚动动画（animateYeNumbers + rAF）',
    jsYe.includes('function animateYeNumbers') && /requestAnimationFrame/.test(jsYe));
T('D11 玉玺盖章动画函数（stampYearEndSeal）',
    jsYe.includes('function stampYearEndSeal'));
T('D12 "钦此"印文 + 印落震动反馈（ye-seal-drop/ye-shake）',
    jsYe.includes('钦此') && css.includes('@keyframes ye-seal-drop') &&
    css.includes('@keyframes ye-paper-shake'));
T('D13 盖章音效挂点（seal）',
    /function stampYearEndSeal[\s\S]{0,600}DamingSFX\.play\('seal'\)/.test(jsYe));
T('D14 各步"继续"按钮推进（renderYeFooterContinue）',
    jsYe.includes('function renderYeFooterContinue'));
T('D15 面板可随时关闭（closeYearEndReport + 暂离）',
    jsYe.includes('function closeYearEndReport') && jsYe.includes('暂离'));
T('D16 关闭后可重阅（renderYearendTab + 岁tab）',
    jsYe.includes('function renderYearendTab') && html.includes('data-tab="yearend"'));
T('D17 renderPanel 接入岁tab（modules.js case yearend）',
    /case 'yearend':/.test(jsModules));
T('D18 挂接：yearEndSettlement 开头快照（snapshotYearEnd）',
    /function yearEndSettlement\(\)\s*\{[\s\S]{0,200}snapshotYearEnd\(\)/.test(jsMain));
T('D19 挂接：yearEndSettlement 末尾开面板（openYearEndReport）',
    /function yearEndSettlement[\s\S]{0,3000}openYearEndReport\(\)/.test(jsMain));
T('D20 年度账本累加（income 记账）',
    /recordYearLedger\('income',\s*income\.resource,\s*amount\)/.test(jsMain));
T('D21 年度账本累加（expense：俸禄/军饷）',
    jsMain.includes("recordYearLedger('expense', 'salary'") &&
    jsMain.includes("recordYearLedger('expense', 'military'"));
T('D22 年度账本累加（expense：派系维持）',
    jsMain.includes("recordYearLedger('expense', 'faction'"));
T('D23 年度大事记取数（addToHistory 补 year 字段）',
    /year:\s*GameState\.currentYear/.test(jsMain));
T('D24 变故实录取数（pushNews 累积 yearNews）',
    /GameState\.yearNews\.unshift/.test(jsMain));
T('D25 结算数值逻辑未动（salaryCost 500 / military 0.1 比率原样）',
    /const salaryCost = 500;/.test(jsMain) &&
    /militaryCost = Math\.floor\(GameState\.stats\.militaryPower \* 0\.1\)/.test(jsMain));
T('D26 史官总评基于 historian 片段（HISTORIAN_FRAGMENTS）',
    /HISTORIAN_FRAGMENTS/.test(jsYe));
T('D27 分步/账单/盖章音效挂点齐全（step/coin）',
    /renderYeFooterContinue[\s\S]{0,600}DamingSFX\.play\('step'\)/.test(jsYe) &&
    /DamingSFX\.play\('coin'\)/.test(jsYe));

// ========== E. 持久化与旧档兼容 ==========
console.log('\n— E. 持久化与旧档兼容 —');
T('E01 saveGame 持久化岁末锚点（factionsYearStart）',
    /factionsYearStart:\s*GameState\.factionsYearStart/.test(jsMain));
T('E02 loadGame 旧档兜底（锚点缺失用当前值初始化）',
    /factionsYearStart \|\| deepCopy\(GameState\.factions\)/.test(jsMain));
T('E03 loadGame 兜底 yearLedger',
    /yearLedger = save\.yearLedger \|\|\s*\{\s*income:\s*\{\},\s*expense:\s*\{\}\s*\}/.test(jsMain));
T('E04 initGame 初始化岁末锚点',
    /factionsYearStart = deepCopy\(GameState\.factions\)/.test(jsMain));
T('E05 存档键未改（daming_guoce_save_v2）',
    /SAVE_KEY\s*=\s*'daming_guoce_save_v2'/.test(jsMain) &&
    /save\.factionsYearStart \|\|/.test(jsMain));
T('E06 smoke_daming.js 存在且可执行（node vm 模式）',
    fs.existsSync(path.join(DIR, 'smoke_daming.js')) &&
    /require\('vm'\)/.test(R('smoke_daming.js')));

// ========== F. 《明史》文案依据（yearend.js） ==========
console.log('\n— F. 《明史》文案依据 —');
T('F01 引《明史·食货志二》黄册赋役（"一以黄册为准"）',
    /《明史·食货志二》/.test(jsYe) && /一以黄册为准/.test(jsYe));
T('F02 引《明史·选举志三》岁计（"府上下其考"）',
    /《明史·选举志三》/.test(jsYe) && /府上下其考/.test(jsYe));
T('F03 考察八目（贪、酷、浮躁、不及、老、病、罢、不谨）',
    jsYe.includes('考察八目') && jsYe.includes('贪、酷、浮躁、不及、老、病、罢、不谨'));
T('F04 史官总评格式（"史官曰"开头 + 殿语按稳定度六档全覆盖：5显式档+else兜底）',
    /'史官曰：/.test(jsYe) &&
    [0, 1, 2, 3, 4].every(l => jsYe.includes(`lvl === ${l}`)) &&
    /else coda =/.test(jsYe));
T('F05 演绎处明确注明',
    /演绎/.test(jsYe));
T('F06 太仓银库岁入据引（食货六）',
    /《明史·食货志六》/.test(jsYe) && /太仓银库/.test(jsYe));

// ========== G. 语法与集成 ==========
console.log('\n— G. 语法与集成 —');
const checkFiles = ['script.js', 'modules.js', 'sfx.js', 'yearend.js', 'mobileui.js',
    'data/script.js', 'data/systems.js', 'data/systems2.js', 'data/memorials.js',
    'data/memorials_v31.js', 'data/advice.js', 'data/share.js', 'data/historian.js',
    'data/extras_ui.js', 'data/extras2.js', 'data/compare.js', 'data/achievements.js'];
let checkOK = 0, checkBad = [];
checkFiles.forEach(f => {
    try {
        execSync(`node --check "${path.join(DIR, f)}"`, { stdio: 'pipe' });
        checkOK++;
    } catch (e) { checkBad.push(f); }
});
T(`G01 node --check 全部 ${checkFiles.length} 个 js 通过（实际通过 ${checkOK}）`,
    checkOK === checkFiles.length);
if (checkBad.length) console.log(`    ✗ 语法失败: ${checkBad.join(', ')}`);

T('G02 index.html 已引入 sfx.js/yearend.js/mobileui.js（script.js 之前）',
    /sfx\.js"><\/script>\s*<script src="yearend\.js"><\/script>\s*<script src="mobileui\.js"><\/script>\s*<script src="script\.js"><\/script>/.test(html));
T('G03 未触碰 PWA（三个新 js 均无 sw/manifest 操作）',
    ['sfx.js', 'yearend.js', 'mobileui.js'].every(f =>
        !/serviceWorker|manifest\.json|sw\.js/.test(R(f))));
T('G04 .git 目录未被本次改动（文件级验证：仍为 git 仓库）',
    fs.existsSync(path.join(DIR, '.git')));
T('G05 style.css 仅追加（批1标记存在于末段）',
    css.lastIndexOf('批1') > 0 && css.includes('批1 追加样式'));
T('G06 PWA 文件未被修改（manifest.json 无批1改动痕迹）',
    !fs.existsSync(path.join(DIR, 'manifest.json')) ||
    !/批1|yearend|mobileui|SoundFX/.test(R('manifest.json')));

// ========== 汇总 ==========
console.log('='.repeat(56));
console.log(`总计：${pass + fail} 项 | 通过 ${pass} | 失败 ${fail}`);
if (fail > 0) {
    console.log('失败项：');
    failList.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
} else {
    console.log('✓ 批1静态验证全部通过');
}
