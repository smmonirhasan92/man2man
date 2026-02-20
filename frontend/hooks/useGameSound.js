import { useRef, useEffect, useCallback } from 'react';

export const useGameSound = (enabled = true) => {
    const audioRefs = useRef({});

    // Preload sounds
    useEffect(() => {
        const soundFiles = [
            'click',
            'win',
            'lose',
            'success',
            'notification',
            'card-flip',
            'error'
        ];

        soundFiles.forEach(sound => {
            const audio = new Audio(`/sounds/${sound}.mp3`);
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
            audio.play().catch(e => console.warn(`Sound '${name}' failed to play:`, e));
        } else {
            // Fallback for lazy loading or missing preload
            try {
                const tempAudio = new Audio(`/sounds/${name}.mp3`);
                tempAudio.volume = volume;
                tempAudio.play().catch(() => { });
            } catch (e) {
                console.warn(`Sound '${name}' not found.`);
            }
        }
    }, [enabled]);

    return { play };
};

export default useGameSound;
