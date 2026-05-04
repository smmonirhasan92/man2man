import { useRef, useEffect, useCallback } from 'react';

export const useGameSound = (enabled = true) => {
    const audioRefs = useRef({});

    // Preload sounds
    useEffect(() => {
        const soundFiles = [
            'click',
            'win',
            'loss',
            'success',
            'notification',
            'card-flip',
            'error'
        ];

        soundFiles.forEach(sound => {
            let filename = `${sound}-v2.mp3`;
            // [FIX] Map missing assets to existing high-quality tick sound
            if (sound === 'click' || sound === 'card-flip') filename = 'tick-v2.mp3';
            
            const audio = new Audio(`/sounds/${filename}`);
            audio.preload = 'auto';
            audio.volume = 0.5;
            audioRefs.current[sound] = audio;
        });

        return () => {
            // Cleanup
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioRefs.current = {};
        };
    }, []);

    const lastPlayed = useRef({});

    const play = useCallback((name, volume = 0.5) => {
        if (!enabled) return;

        // [ANTI-DOUBLE] Debounce sounds to prevent echo/double-play
        const now = Date.now();
        if (lastPlayed.current[name] && (now - lastPlayed.current[name] < 150)) {
            return; // Skip if played too recently
        }
        lastPlayed.current[name] = now;

        const audio = audioRefs.current[name];
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    // Silently ignore
                });
            }
        } else {
            // Fallback
            try {
                const tempAudio = new Audio(`/sounds/${name}-v2.mp3`);
                tempAudio.volume = volume;
                tempAudio.play().catch(() => {});
            } catch (e) {}
        }
    }, [enabled]);

    const playSuccess = useCallback(() => play('success'), [play]);
    const playError = useCallback(() => play('error'), [play]);
    const playNotification = useCallback(() => play('notification'), [play]);

    return { 
        play,
        playSuccess,
        playError,
        playNotification
    };
};

export default useGameSound;
