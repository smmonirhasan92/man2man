'use strict';

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New update from USA Affiliate',
            icon: '/networking_globe.png',
            badge: '/networking_globe.png',
            vibrate: [200, 100, 200], // [FIX] Heavier background vibration
            requireInteraction: true, // [FIX] Forces notification to stay until tapped
            data: {
                url: data.url || '/'
            },
            // Note: Custom notification sounds depend on browser support, 
            // but we add the tag for browsers that respect it.
            tag: 'transaction-alert',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'USA Affiliate', options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
