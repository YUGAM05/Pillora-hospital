self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('[Service Worker] Push event but no data payload received');
        return;
    }

    let payload = {};
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            title: 'Pillora Hospital Panel',
            body: event.data.text()
        };
    }

    const title = payload.title || 'New Notification';
    const options = {
        body: payload.body || 'You have received a new update.',
        icon: payload.icon || '/android-chrome-192x192.png',
        badge: '/favicon-16x16.png',
        data: payload.data || {}, // Contains redirect URL
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click received');
    event.notification.close();

    const redirectUrl = event.notification.data && event.notification.data.url
        ? event.notification.data.url
        : '/hospital/dashboard';

    // Build the absolute redirect URL relative to origin
    const targetUrl = new URL(redirectUrl, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (clientList) {
            // 1. If an exact matching window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }

            // 2. If any other dashboard page is open, navigate it to targetUrl and focus
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.startsWith(self.location.origin) && 'navigate' in client && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }

            // 3. Otherwise, open a new window/tab
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
