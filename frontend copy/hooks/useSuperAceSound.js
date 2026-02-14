'use client';
import useSound from 'use-sound';

// Note: Ensure these files exist in public/sounds/ or map to closest available
const SOUND_PATHS = {
    SPIN: '/sounds/click.mp3', // Reusing click for spin start
    DROP: '/sounds/card-flip.mp3', // Card hitting the stack
    MATCH: '/sounds/success.mp3', // Winning combo
    WIN: '/sounds/win.mp3', // Big Win
    BGM: '/sounds/bgm_loop.mp3' // Placeholder, might be missing, handled gracefully
};

export function useSuperAceSound() {
    const [playSpin] = useSound(SOUND_PATHS.SPIN, { volume: 0.2 });
    const [playDrop] = useSound(SOUND_PATHS.DROP, { volume: 0.15, interrupt: true });
    const [playMatch] = useSound(SOUND_PATHS.MATCH, { volume: 0.25 });
    const [playWin] = useSound(SOUND_PATHS.WIN, { volume: 0.35 });

    // BGM logic can be complex (loops, persistent), for MVP use standard triggers

    return {
        playSpin,
        playDrop,
        playMatch,
        playWin
    };
}
