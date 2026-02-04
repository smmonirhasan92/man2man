import confetti from 'canvas-confetti';

/**
 * Animation Manager for Man2Man PWA
 * Handles game-like effects, sounds, and haptics.
 */

class AnimationManager {
    constructor() {
        this.sounds = {
            success: null, // Will load audio objects
            click: null,
            coin: null
        };
        this.initialized = false;
    }

    init() {
        if (typeof window !== 'undefined' && !this.initialized) {
            // Preload sounds (replace with actual URLs if available, using placeholders or data URIs for now)
            // Using simple beep/synth for now if no assets, or just logs if strictly no assets provided.
            // Ideally should be real files in /public/sounds/
            this.sounds.success = new Audio('/sounds/success.mp3');
            this.sounds.coin = new Audio('/sounds/coin.mp3');
            this.initialized = true;
        }
    }

    /**
     * Triggers the "Game Victory" animation (Confetti + Sound + Haptic)
     */
    triggerRewardAnimation() {
        this.init();

        // 1. Sound
        this.playSound('success');

        // 2. Haptic Feedback (if PWA/Mobile)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        // 3. Confetti Explosion (Game Victory Style)
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 40, // Increased
                angle: 60,
                spread: 70,
                origin: { x: 0.1, y: 0.8 }, // Start from bottom left/right
                colors: ['#FFD700', '#DAA520', '#B8860B'], // Gold Palette
                shapes: ['circle'],
                scalar: 1.5,
                drift: 1,
                gravity: 0.8
            });
            confetti({
                particleCount: 40,
                angle: 120,
                spread: 70,
                origin: { x: 0.9, y: 0.8 },
                colors: ['#FFD700', '#DAA520', '#B8860B'],
                shapes: ['circle'],
                scalar: 1.5,
                drift: -1,
                gravity: 0.8
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    /**
     * Plays a flying coin animation from element A to element B
     * @param {HTMLElement} startElem 
     * @param {HTMLElement} endElem 
     */
    animateCoinTransfer(startElem, endElem) {
        // Implementation for advanced coin flying animation
        // For now, relies on CSS classes or simpler effects
        this.playSound('coin');
    }

    playSound(type) {
        if (this.sounds[type]) {
            this.sounds[type].currentTime = 0;
            this.sounds[type].play().catch(e => console.log("Audio play blocked (user gesture needed):", e));
        }
    }
}

export const animationManager = new AnimationManager();
