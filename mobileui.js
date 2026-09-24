// ============================================
// 《大明国策》批1 模块A：移动端底部导航 + 视图记忆
// 仅在窄屏（<768px）由 CSS 启用；JS 端只负责 body 视图类切换与事件委托
// 既有类名/id 一律不改，新交互全部走事件委托
// ============================================

const MOBILE_VIEW_KEY = 'daming_mview';
const MOBILE_VIEWS = ['center', 'left', 'menu', 'right'];

// 切换移动端视图：body 上挂 mview-* 类，CSS 据此显隐面板
function setMobileView(view) {
    try {
        if (MOBILE_VIEWS.indexOf(view) < 0) view = 'center';
        const body = document.body;
        if (!body) return;
        MOBILE_VIEWS.forEach(v => body.classList.remove('mview-' + v));
        body.classList.add('mview-' + view);
        // tab 高亮
        document.querySelectorAll('.mobile-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mview === view);
        });
        // 记忆视图
        try { localStorage.setItem(MOBILE_VIEW_KEY, view); } catch (e) {}
        DamingSFX.play('click');
        // 朝堂视图 = 展示系统菜单横条；其余视图滚动到顶
        try { window.scrollTo(0, 0); } catch (e) {}
    } catch (e) {}
}

// 恢复上次视图（仅窄屏生效，CSS 控制可见性，JS 只管类名）
function restoreMobileView() {
    try {
        let view = null;
        try { view = localStorage.getItem(MOBILE_VIEW_KEY); } catch (e) {}
        setMobileView(view || 'center');
    } catch (e) {}
}

// 初始化：事件委托绑定（DOM 就绪后调用）
function initMobileUI() {
    try {
        // 底部 tab 切换（事件委托）
        const tabbar = document.getElementById('mobile-tabbar');
        if (tabbar) {
            tabbar.addEventListener('click', (e) => {
                try {
                    const tab = e.target.closest('.mobile-tab');
                    if (tab && tab.dataset.mview) {
                        setMobileView(tab.dataset.mview);
                    }
                } catch (err) {}
            });
        }

        // 悬浮"下季"主按钮
        const mobileNext = document.getElementById('mobile-next');
        if (mobileNext) {
            mobileNext.addEventListener('click', (e) => {
                try {
                    e.preventDefault();
                    if (typeof advanceSeason === 'function' && !GameState.gameOver) {
                        advanceSeason();
                    }
                } catch (err) {}
            });
        }

        // 音效设置按钮 / 弹窗按钮（事件委托）
        document.addEventListener('click', (e) => {
            try {
                if (!e.target || !e.target.closest) return;
                if (e.target.closest('#sfx-btn')) { openSFXSettings(); return; }
                if (e.target.closest('#sfx-close')) { closeSFXSettings(); return; }
                if (e.target.closest('#sfx-toggle')) {
                    DamingSFX.setEnabled(!DamingSFX.enabled);
                    const el = document.getElementById('sfx-toggle');
                    if (el) {
                        el.textContent = DamingSFX.enabled ? '开' : '关';
                        el.classList.toggle('off', !DamingSFX.enabled);
                    }
                    DamingSFX.play('decide');
                    return;
                }
            } catch (err) {}
        });

        // 音量滑条（input 事件直接绑，mock 环境元素可能为空则跳过）
        const vol = document.getElementById('sfx-volume');
        if (vol) {
            vol.addEventListener('input', () => {
                try {
                    DamingSFX.setVolume(parseFloat(vol.value) || 60);
                } catch (err) {}
            });
        }

        // 初始视图
        restoreMobileView();
    } catch (e) {}
}

console.log('✓ 移动端导航（批1模块A）装载完毕');
