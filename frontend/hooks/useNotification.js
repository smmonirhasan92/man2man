'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useNotification() {
    const [permission, setPermission] = useState('default');
    const audioRef = useRef(null);

    // Initialize audio and strict permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification.mp3');
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

    // Play sound safely (requires prior user interaction in many browsers)
    const lastPlayTime = useRef(0);
    const playSound = useCallback(() => {
        const now = Date.now();
        if (now - lastPlayTime.current < 500) return; // Don't play too frequently
        lastPlayTime.current = now;

        if (audioRef.current) {
            // Reset to start if already playing
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            // Handle auto-play policies silently
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio autoplay blocked by browser policy. User must interact with DOM first.');
                });
            }
        }
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
                this.close();
            };
        } catch (error) {
            console.error("Push notification failed", error);
        }
    }, []);

    // Utility: Trigger both (the best practice hybrid approach)
    const notify = useCallback((title, body = '') => {
        playSound();
        showPush(title, { body });
    }, [playSound, showPush]);

    return {
        permission,
        requestPermission,
        playSound,
        showPush,
        notify
    };
}
