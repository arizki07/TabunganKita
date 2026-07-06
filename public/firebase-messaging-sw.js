importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyAOApx_a_WyZBvvtD5_P8w_RglIZfNRoGA',
    projectId: 'fiery-cabinet-444011-g0',
    messagingSenderId: '209405737131',
    appId: '1:209405737131:web:13a9b943e490c42ec81fee',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/logo.png',
        data: { url: payload.data?.action_url || '/' },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});
