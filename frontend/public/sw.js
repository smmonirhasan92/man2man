self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            // Options for the native OS notification
            const options = {
                body: data.body,
                icon: '/icon.png', // Fallback to standard app icon, you should provide a 192x192 icon here
                badge: '/icon.png', // Small icon for top bar on Android
                vibrate: [200, 100, 200, 100, 200, 100, 200], // Aggressive vibration pattern for money alerts
                data: {
                    url: data.url || '/'
                },
                requireInteraction: data.type === 'transaction' // Keep on screen until dismissed for money
            };

            // This triggers the Native OS popup & system default notification sound
            event.waitUntil(
                self.registration.showNotification(data.title || 'Man2Man Notification', options)
            );
        } catch (e) {
            console.error('Error handling push event', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Open the app when the user taps the notification
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
