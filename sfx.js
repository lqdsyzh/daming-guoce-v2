// ============================================
// 《大明国策》批1 模块B：全套音效（WebAudio 程序化合成，零外部文件）
// 10 种音效：click/season/urgent/decide/coin/auspicious/disaster/ending/seal/step
// AudioContext 不可用时静默降级，绝不阻断游戏主流程（全部 try-catch）
// 设计参照宫廷雅乐：编钟、磬、鼓、算珠，配暗色国风
// ============================================

class SoundFX {
    constructor() {
        this.ctx = null;
        // 读取持久化设置（localStorage：daming_sfx_settings）
        try {
            const raw = localStorage.getItem('daming_sfx_settings');
            const cfg = raw ? JSON.parse(raw) : null;
            this.enabled = cfg ? cfg.enabled !== false : true;   // 默认开
            this.volume = cfg ? Math.max(0, Math.min(100, cfg.volume || 60)) : 60;
        } catch (e) {
            this.enabled = true;
            this.volume = 60;
        }
        this._unlocked = false;
    }

    // 持久化设置
    persist() {
        try {
            localStorage.setItem('daming_sfx_settings', JSON.stringify({
                enabled: this.enabled, volume: this.volume
            }));
        } catch (e) {}
    }

    // iOS 首次用户手势解锁 AudioContext（标准 unlock 模式）
    unlock() {
        try {
            if (this._unlocked) return;
            const ctx = this.ensureCtx();
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            // 解锁时播一帧静音，激活 iOS 音频管线
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                gain.gain.value = 0.0001;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(0);
                osc.stop(0.01);
            } catch (e) {}
            this._unlocked = true;
        } catch (e) {}
    }

    // 惰性创建 AudioContext（首次在用户手势中触发）
    ensureCtx() {
        try {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return this.ctx;
        } catch (e) {
            return null;
        }
    }

    // 开关
    setEnabled(v) {
        try {
            this.enabled = !!v;
            this.persist();
        } catch (e) {}
    }

    // 音量 0-100
    setVolume(v) {
        try {
            this.volume = Math.max(0, Math.min(100, Math.round(v)));
            this.persist();
        } catch (e) {}
    }

    // 单音合成：freq(Hz) / dur(秒) / options { type, vol, delay, glideTo, vibrato }
    tone(freq, dur, options = {}) {
        try {
            const ctx = this.ensureCtx();
            if (!ctx) return;
            const type = options.type || 'sine';
            const vol = options.vol !== undefined ? options.vol : 1;
            const delay = options.delay || 0;
            const t0 = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            // 颤音（钟磬余韵）
            if (options.vibrato) {
                try {
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.value = options.vibrato.rate || 6;
                    lfoGain.gain.value = options.vibrato.depth || 4;
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start(t0);
                    lfo.stop(t0 + dur);
                } catch (e) {}
            }
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            if (options.glideTo) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.glideTo), t0 + dur);
            }
            const peak = Math.max(0.0001, (this.volume / 100) * vol * 0.25);
            gain.gain.setValueAtTime(0.0001, t0);
            gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + dur + 0.05);
        } catch (e) {}
    }

    // 鼓点：低频速降正弦 + 白噪声脉冲
    drum(delay = 0, vol = 1) {
        try {
            const ctx = this.ensureCtx();
            if (!ctx) return;
            this.tone(110, 0.2, { type: 'sine', vol: vol, delay: delay, glideTo: 38 });
            const len = Math.floor(ctx.sampleRate * 0.08);
            const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / len);
            }
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.value = 0.08 * vol * (this.volume / 100);
            src.buffer = buffer;
            src.connect(gain);
            gain.connect(ctx.destination);
            src.start(ctx.currentTime + delay);
        } catch (e) {}
    }

    // 纸声（翻页/分步）：短促衰减白噪声
    paper(delay = 0, vol = 0.15) {
        try {
            const ctx = this.ensureCtx();
            if (!ctx) return;
            const len = Math.floor(ctx.sampleRate * 0.18);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2) * 0.5;
            }
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.value = vol * (this.volume / 100);
            src.buffer = buf;
            src.connect(gain);
            gain.connect(ctx.destination);
            src.start(ctx.currentTime + delay);
        } catch (e) {}
    }

    // 播放指定音效
    play(name) {
        if (!this.enabled) return;
        try {
            switch (name) {
                case 'click':
                    // 按钮点击：短促哒声
                    this.tone(880, 0.05, { type: 'square', vol: 0.3 });
                    break;
                case 'season':
                    // 下季推进：更鼓两声，沉缓
                    this.drum(0, 0.8);
                    this.drum(0.22, 0.5);
                    break;
                case 'urgent':
                    // 急奏呈上：急迫鼓点三连渐急
                    this.drum(0, 0.9);
                    this.drum(0.16, 0.9);
                    this.drum(0.28, 1);
                    this.tone(659.25, 0.35, { type: 'triangle', vol: 0.35, delay: 0.3, vibrato: { rate: 7, depth: 6 } });
                    break;
                case 'decide':
                    // 事件抉择：朱笔落定，两音上行
                    this.tone(523.25, 0.09, { type: 'triangle', vol: 0.7 });
                    this.tone(783.99, 0.14, { type: 'triangle', vol: 0.7, delay: 0.09 });
                    break;
                case 'coin':
                    // 结算金币：算珠叮叮三连
                    this.tone(1318.5, 0.07, { type: 'square', vol: 0.28 });
                    this.tone(1760, 0.09, { type: 'square', vol: 0.28, delay: 0.08 });
                    this.tone(2093, 0.12, { type: 'square', vol: 0.22, delay: 0.17 });
                    break;
                case 'auspicious':
                    // 祥瑞：清磬一击，余韵悠长
                    this.tone(1046.5, 1.2, { type: 'sine', vol: 0.45, vibrato: { rate: 5, depth: 4 } });
                    this.tone(1568, 0.9, { type: 'sine', vol: 0.22, delay: 0.05 });
                    break;
                case 'disaster':
                    // 灾异边患：低鸣双颤
                    this.tone(98, 0.9, { type: 'sawtooth', vol: 0.55, vibrato: { rate: 4, depth: 7 } });
                    this.tone(103, 0.9, { type: 'sine', vol: 0.4, vibrato: { rate: 6, depth: 9 } });
                    break;
                case 'ending':
                    // 结局：编钟尾声（下行庄重四音）
                    [659.25, 523.25, 440, 329.63].forEach((f, i) => {
                        this.tone(f, i === 3 ? 1.6 : 0.5, { type: 'triangle', vol: 0.7, delay: i * 0.3 });
                        this.tone(f * 2, 0.4, { type: 'sine', vol: 0.18, delay: i * 0.3 });
                    });
                    break;
                case 'seal':
                    // 玉玺盖章：重锤落印（鼓一声 + 闷响 + 磬尾）
                    this.drum(0, 1);
                    this.tone(160, 0.25, { type: 'sine', vol: 0.9, glideTo: 50 });
                    this.tone(523.25, 0.7, { type: 'sine', vol: 0.4, delay: 0.1, vibrato: { rate: 6, depth: 5 } });
                    break;
                case 'step':
                    // 分步翻页：纸声 + 轻磬
                    this.paper(0, 0.15);
                    this.tone(987.77, 0.18, { type: 'sine', vol: 0.25, delay: 0.05 });
                    break;
                default:
                    break;
            }
        } catch (e) {}
    }
}

// 全局实例（定义后立即实例化，避免"类已定义未实例化"问题）
const DamingSFX = new SoundFX();

// 首次用户手势解锁 AudioContext（iOS 标准模式）
function initSFXUnlock() {
    try {
        const handler = () => {
            try { DamingSFX.unlock(); } catch (e) {}
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
        };
        document.addEventListener('touchstart', handler, { passive: true });
        document.addEventListener('click', handler);
    } catch (e) {}
}

// 音效设置弹窗（复用暗色国风样式）
function openSFXSettings() {
    try {
        const modal = document.getElementById('sfx-modal');
        if (!modal) return;
        const toggle = document.getElementById('sfx-toggle');
        const volume = document.getElementById('sfx-volume');
        if (toggle) {
            toggle.textContent = DamingSFX.enabled ? '开' : '关';
            toggle.classList.toggle('off', !DamingSFX.enabled);
        }
        if (volume) volume.value = DamingSFX.volume;
        modal.classList.add('active');
        DamingSFX.play('click');
    } catch (e) {}
}

function closeSFXSettings() {
    try {
        const modal = document.getElementById('sfx-modal');
        if (modal) modal.classList.remove('active');
        DamingSFX.play('click');
    } catch (e) {}
}

console.log('✓ 音效系统（批1模块B）装载完毕');
