import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        VitePWA({
            // 2. Tambahkan konfigurasi PWA
            registerType: 'autoUpdate',
            injectRegister: 'inline',
            manifest: {
                name: 'TabunganKita',
                short_name: 'TabunganKita',
                description: 'Deskripsi aplikasi Laravel Inertia PWA',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    { src: '/assets/logo.png', sizes: '192x192', type: 'image/png' },
                    { src: '/assets/logo.png', sizes: '512x512', type: 'image/png' },
                    { src: '/assets/logo.png', sizes: '180x180', type: 'image/png', purpose: 'apple touch icon' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            },
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
