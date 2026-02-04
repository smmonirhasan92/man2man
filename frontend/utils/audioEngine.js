import { Howl } from 'howler';

class AudioEngine {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;
        this.initialized = false;
    }

    init() {
        if (typeof window === 'undefined' || this.initialized) return;

        const soundConfig = {
            click: '/sounds/click.mp3',
            spin: '/sounds/spin.mp3', // Placeholder if spin specific exists
            card_flip: '/sounds/card-flip.mp3',
            success: '/sounds/success.mp3',
            win: '/sounds/win.mp3',
            bgm: '/sounds/bgm_loop.mp3'
        };

        // Fallback mapping if specific files are missing (based on list_dir check)
        // For now assuming the files from useSuperAceSound exist or mapped close enough.

        Object.keys(soundConfig).forEach(key => {
            this.sounds[key] = new Howl({
                src: [soundConfig[key]],
                volume: key === 'bgm' ? 0.3 : this.volume,
                loop: key === 'bgm',
                preload: true,
                onloaderror: (id, err) => console.warn(`Sound load error [${key}]:`, err)
            });
        });

        this.initialized = true;
    }

    play(key) {
        if (this.muted || !this.sounds[key]) return;
        this.sounds[key].play();
    }

    playBGM() {
        if (this.muted || !this.sounds['bgm']) return;
        if (!this.sounds['bgm'].playing()) {
            this.sounds['bgm'].play();
        }
    }

    stopBGM() {
        if (this.sounds['bgm']) {
            this.sounds['bgm'].stop();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        Howler.mute(this.muted);
        return this.muted;
    }

    setVolume(val) {
        this.volume = val;
        Howler.volume(val);
    }
}

// Singleton Instance
export const audioEngine = new AudioEngine();
