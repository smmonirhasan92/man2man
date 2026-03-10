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

                // Set global flag for other components
                if (typeof window !== 'undefined') {
                    window.updateAvailable = true;
                    // Trigger a custom event to notify listeners
                    window.dispatchEvent(new Event('pwaUpdateAvailable'));
                }

                // Show a non-intrusive toast informing the user
                toast.success('App update available! Updating automatically...', {
                    icon: '🚀',
                    duration: 3000,
                    position: 'top-center'
                });

                // Immediately force the new service worker to take control
                wb.messageSkipWaiting();
            });

            // When a new service worker has taken control
            wb.addEventListener('controlling', (event) => {
                console.log('The service worker is currently controlling this page.');
                // We no longer nuclear reload here to avoid annoying the user.
                // The PWA banner will show an "UPDATE" button instead.
            });

            wb.register();
        }
    }, []);

    return null; // This is a background component
}
