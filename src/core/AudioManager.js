export class AudioManager {
    constructor(settingsState) {
        this._settings = settingsState;
        this._bgmElement = null;
        this._currentBGMId = null;
        this._bgmTracks = new Map();
        this._sfxTracks = new Map();
        this._pendingBGMAction = null;
        this._unlocked = typeof window === 'undefined';
        this._unlockHandler = null;
        this._audioContext = null;

        this._bindUnlockEvents();
    }

    _bindUnlockEvents() {
        if (this._unlocked || typeof window === 'undefined') {
            return;
        }

        this._unlockHandler = () => {
            this.unlock();
        };

        const events = ['pointerdown', 'keydown', 'touchstart'];
        for (const eventName of events) {
            window.addEventListener(eventName, this._unlockHandler, { passive: true });
        }
    }

    _ensureAudioContext() {
        if (this._audioContext || typeof window === 'undefined') {
            return this._audioContext;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return null;
        }

        this._audioContext = new AudioCtx();
        return this._audioContext;
    }

    unlock() {
        if (this._unlocked) {
            return Promise.resolve();
        }

        this._unlocked = true;

        if (this._unlockHandler && typeof window !== 'undefined') {
            const events = ['pointerdown', 'keydown', 'touchstart'];
            for (const eventName of events) {
                window.removeEventListener(eventName, this._unlockHandler);
            }
            this._unlockHandler = null;
        }

        const ctx = this._ensureAudioContext();
        const resumePromise = ctx && ctx.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve();
        return Promise.resolve(resumePromise).then(() => this._flushPendingBGMAction());
    }

    registerBGM(id, src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = this._settings.bgmVolume;
        audio.playsInline = true;
        this._bgmTracks.set(id, audio);

        return audio;
    }

    registerSFX(id, src) {
        this._sfxTracks.set(id, src);
    }

    _flushPendingBGMAction() {
        if (!this._pendingBGMAction) {
            return Promise.resolve();
        }

        const pendingAction = this._pendingBGMAction;
        this._pendingBGMAction = null;

        if (pendingAction.type === 'play') {
            return this.playBGM(pendingAction.id, { restart: pendingAction.restart });
        }

        if (pendingAction.type === 'resume') {
            return this.resumeBGM();
        }

        return Promise.resolve();
    }

    _playAudio(audio, { restart = false } = {}) {
        if (!audio) {
            return Promise.resolve();
        }

        audio.volume = this._settings.bgmVolume;
        if (restart) {
            audio.currentTime = 0;
        }

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            return playPromise.catch(() => {});
        }

        return Promise.resolve();
    }

    playBGM(id, { restart = false } = {}) {
        const audio = this._bgmTracks.get(id);
        if (!audio) {
            return Promise.resolve();
        }

        if (this._currentBGMId === id && this._bgmElement === audio) {
            if (restart) {
                audio.currentTime = 0;
            }

            if (!this._unlocked) {
                this._pendingBGMAction = { type: 'resume' };
                return Promise.resolve();
            }

            return audio.paused ? this._playAudio(audio) : Promise.resolve();
        }

        if (this._bgmElement && this._bgmElement !== audio) {
            this._bgmElement.pause();
        }

        this._bgmElement = audio;
        this._currentBGMId = id;

        if (!this._unlocked) {
            this._pendingBGMAction = { type: 'play', id, restart };
            return Promise.resolve();
        }

        return this._playAudio(audio, { restart });
    }

    pauseBGM() {
        if (!this._bgmElement) {
            return;
        }

        this._bgmElement.pause();
    }

    resumeBGM() {
        if (!this._bgmElement) {
            return Promise.resolve();
        }

        if (!this._unlocked) {
            this._pendingBGMAction = { type: 'resume' };
            return Promise.resolve();
        }

        return this._playAudio(this._bgmElement);
    }

    stopBGM() {
        if (this._bgmElement) {
            this._bgmElement.pause();
            this._bgmElement.currentTime = 0;
        }

        this._bgmElement = null;
        this._currentBGMId = null;
        this._pendingBGMAction = null;
    }

    _playTone({ frequency, duration, type = 'square', volume = 0.05, endFrequency = null }) {
        const ctx = this._ensureAudioContext();
        if (!ctx) {
            return Promise.resolve();
        }

        const startTime = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        if (endFrequency) {
            oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
        }

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume * this._settings.sfxVolume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.02);

        return Promise.resolve();
    }

    _playSynthSFX(id) {
        switch (id) {
            case 'menu_confirm':
                return this._playTone({ frequency: 520, duration: 0.08, type: 'square', volume: 0.035, endFrequency: 660 });
            case 'sword_hit':
                return this._playTone({ frequency: 320, duration: 0.12, type: 'sawtooth', volume: 0.05, endFrequency: 120 });
            case 'dodge_ok':
                return this._playTone({ frequency: 440, duration: 0.1, type: 'triangle', volume: 0.04, endFrequency: 720 });
            case 'player_hit':
                return this._playTone({ frequency: 180, duration: 0.18, type: 'square', volume: 0.06, endFrequency: 90 });
            case 'block':
                return this._playTone({ frequency: 210, duration: 0.12, type: 'triangle', volume: 0.045, endFrequency: 150 });
            case 'heal':
                return this._playTone({ frequency: 360, duration: 0.16, type: 'sine', volume: 0.05, endFrequency: 760 });
            case 'enemy_die':
                return this._playTone({ frequency: 240, duration: 0.28, type: 'sawtooth', volume: 0.055, endFrequency: 60 });
            case 'loot':
                return this._playTone({ frequency: 620, duration: 0.14, type: 'triangle', volume: 0.05, endFrequency: 920 });
            default:
                return Promise.resolve();
        }
    }

    playSFX(idOrSrc) {
        if (!this._unlocked) {
            return Promise.resolve();
        }

        if (!idOrSrc) {
            return Promise.resolve();
        }

        const registeredSrc = this._sfxTracks.get(idOrSrc);
        const src = registeredSrc || idOrSrc;
        if (typeof src === 'string' && (src.includes('/') || src.endsWith('.mp3') || src.endsWith('.wav') || src.endsWith('.ogg'))) {
            const sfx = new Audio(src);
            sfx.preload = 'auto';
            sfx.volume = this._settings.sfxVolume;
            sfx.playsInline = true;

            const playPromise = sfx.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                return playPromise.catch(() => {});
            }
            return Promise.resolve();
        }

        return this._playSynthSFX(idOrSrc);
    }

    setVolume(type, value) {
        const clampedValue = Math.max(0, Math.min(1, value));

        if (type === 'bgm') {
            this._settings.bgmVolume = clampedValue;
            if (this._bgmElement) {
                this._bgmElement.volume = clampedValue;
            }
        }

        if (type === 'sfx') {
            this._settings.sfxVolume = clampedValue;
        }
    }

    getCurrentBGMId() {
        return this._currentBGMId;
    }
}
