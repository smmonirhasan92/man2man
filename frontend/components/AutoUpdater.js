'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AutoUpdater() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox;

            // When a new service worker is installed but waiting to activate
            wb.addEventListener('waiting', (event) => {
                console.log(`A new service worker has installed, but it can't activate ` +
                    `until all tabs running the current version have safely been closed.`);

                // Show a non-intrusive toast informing the user
                toast.success('App update available! Updating automatically...', {
                    icon: '🚀',
                    duration: 3000,
                    position: 'top-center'
                });

                // Immediately force the new service worker to take control
                wb.messageSkipWaiting();
            });

            // When the new service worker has taken control
            wb.addEventListener('controlling', async (event) => {
                console.log('The service worker is currently controlling this page.');

                // Nuclear Cache Busting: Delete all caches to prevent white screen loops
                try {
                    if ('caches' in window) {
                        const cacheNames = await window.caches.keys();
                        await Promise.all(
                            cacheNames.map((cacheName) => window.caches.delete(cacheName))
                        );
                        console.log('Successfully cleared old PWA caches.');
                    }
                } catch (err) {
                    console.error('Failed to clear caches:', err);
                }

                // Reload the page to load the new cached assets instantly
                window.location.reload();
            });

            wb.register();
        }
    }, []);

    return null; // This is a background component
}
