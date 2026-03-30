'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useNotification() {
    const [permission, setPermission] = useState('default');
    const audioRef = useRef(null);

    // Initialize audio and strict permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification-v2.mp3');
            audioRef.current.volume = 0.8;

            if ('Notification' in window) {
                setPermission(Notification.permission);
            }
        }
    }, []);

    // Request native browser permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, []);

    const lastPlayTime = useRef(0);
    const playSound = useCallback((soundPath = null) => {
        const now = Date.now();
        if (now - lastPlayTime.current < 500) return; // Don't play too frequently
        lastPlayTime.current = now;

        try {
            const audioToPlay = soundPath ? new Audio(soundPath) : audioRef.current;
            if (audioToPlay) {
                audioToPlay.currentTime = 0;
                audioToPlay.volume = 0.8;
                const playPromise = audioToPlay.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Audio autoplay blocked by browser policy.');
                    });
                }
            }
        } catch (e) { }
    }, []);

    // Show native push notification
    const showPush = useCallback((title, options = {}) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        try {
            const notification = new Notification(title, {
                icon: '/icon.png', // Add your app icon path if you have one
                badge: '/icon.png',
                vibrate: [200, 100, 200],
                ...options
            });

            // Optional: Close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Optional: Focus window on click
            notification.onclick = function () {
                window.focus();
                if (this.data && this.data.url) {
                    window.location.href = this.data.url;
                }
                this.close();
            };
        } catch (error) {
            console.error("Push notification failed", error);
        }
    }, []);

    // Utility: Trigger both (the best practice hybrid approach)
    const notify = useCallback((title, body = '', url = null, soundPath = null) => {
        playSound(soundPath);
        showPush(title, { body, ...(url && { data: { url } }) });
    }, [playSound, showPush]);

    return {
        permission,
        requestPermission,
        playSound,
        showPush,
        notify
    };
}
