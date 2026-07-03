// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyAOApx_a_WyZBvvtD5_P8w_RglIZfNRoGA',
    authDomain: 'fiery-cabinet-444011-g0.firebaseapp.com',
    projectId: 'fiery-cabinet-444011-g0',
    storageBucket: 'fiery-cabinet-444011-g0.firebasestorage.app',
    messagingSenderId: '209405737131',
    appId: '1:209405737131:web:13a9b943e490c42ec81fee',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Menangani notifikasi saat tab ditutup / background
messaging.onBackgroundMessage((payload) => {
    console.log('Notifikasi Background:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/logo.png', // ganti sesuai icon web Anda
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
