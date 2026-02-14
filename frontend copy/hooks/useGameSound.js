import useSound from 'use-sound';

/**
 * Universal Sound Configuration
 * To change a sound, just update the path here.
 * Files should be in /public/sounds/
 */
export const SOUND_CONFIG = {
    CLICK: '/sounds/click.mp3',
    WIN: '/sounds/win.mp3',
    LOSE: '/sounds/lose.mp3',
    CARD_FLIP: '/sounds/card-flip.mp3',
    NOTIFICATION: '/sounds/notification.mp3', // New for OTP
    ERROR: '/sounds/error.mp3',               // New for Error Toast
    SUCCESS: '/sounds/success.mp3'            // New for Success Toast
};

/**
 * useGameSound: Universal Sound Manager
 * Exposes a standardized API for playing sounds.
 */
const useGameSound = () => {
    // Volume defaults (Can be made dynamic/settings based later)
    const [playClick] = useSound(SOUND_CONFIG.CLICK, { volume: 0.5 });
    const [playWin] = useSound(SOUND_CONFIG.WIN, { volume: 0.7 });
    const [playLose] = useSound(SOUND_CONFIG.LOSE, { volume: 0.5 });
    const [playCardFlip] = useSound(SOUND_CONFIG.CARD_FLIP, { volume: 0.4 });
    const [playNotification] = useSound(SOUND_CONFIG.NOTIFICATION, { volume: 0.6 });
    const [playError] = useSound(SOUND_CONFIG.ERROR, { volume: 0.5 });
    const [playSuccess] = useSound(SOUND_CONFIG.SUCCESS, { volume: 0.5 });

    return {
        playClick,
        playWin,
        playLose,
        playCardFlip,
        playNotification,
        playError,
        playSuccess
    };
};

export default useGameSound;
