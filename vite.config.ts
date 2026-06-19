import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
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
          { src: '/favicon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['finance', 'productivity'],
        shortcuts: [
          { name: 'Mine', short_name: 'Mine', description: 'Start mining', url: '/mine', icons: [{ src: '/favicon.png', sizes: '1024x1024' }] },
          { name: 'Activity', short_name: 'Activity', description: 'View live activity', url: '/activity', icons: [{ src: '/favicon.png', sizes: '1024x1024' }] },
        ],
      },
      workbox: {
        globPatterns:    ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
