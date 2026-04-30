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

    const play = useCallback((name, volume = 0.5) => {
        if (!enabled) return;

        const audio = audioRefs.current[name];
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    // Silently ignore 'play() interrupted' or 'user didn't interact' errors
                });
            }
        } else {
            // Fallback for lazy loading or missing preload
            try {
                const tempAudio = new Audio(`/sounds/${name}-v2.mp3`);
                tempAudio.volume = volume;
                const tempPromise = tempAudio.play();
                if (tempPromise !== undefined) {
                    tempPromise.catch(() => {});
                }
            } catch (e) {
                // Ignore silent missing audio
            }
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
