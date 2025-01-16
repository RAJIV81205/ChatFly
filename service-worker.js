self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'You have a new message!',
        icon: data.icon || '/img/boy.png',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/chat') // Adjust the path to your chat page
    );
});
