import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'KineticDAO',
        short_name: 'KineticDAO',
        description: 'Watch Ads, Mine KNTC — Decentralized Ad-to-Earn Protocol on KNTC Ecochain',
        theme_color: '#001020',
        background_color: '#000e1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/favicon.svg', sizes: 'any',     type: 'image/svg+xml' },
        ],
        categories: ['finance', 'productivity'],
        shortcuts: [
          { name: 'Mine', short_name: 'Mine', description: 'Start mining', url: '/mine', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
          { name: 'Activity', short_name: 'Activity', description: 'View live activity', url: '/activity', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
        ],
      },
      workbox: {
        globPatterns:    ['**/*.{js,css,html,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern:  /^https:\/\/maculatus-rpc\.x1eco\.com\/.*/i,
            handler:     'NetworkFirst',
            options: {
              cacheName:   'rpc-cache',
              expiration:  { maxAgeSeconds: 60, maxEntries: 10 },
            },
          },
          {
            urlPattern:  /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler:     'CacheFirst',
            options: {
              cacheName:   'google-fonts',
              expiration:  { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host:         '0.0.0.0',
    port:         5000,
    allowedHosts: true,
  },
})
