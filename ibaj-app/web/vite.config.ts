import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // O .env fica na raiz do monorepo, compartilhado com a API.
  envDir: '..',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'logo-ibaj.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png'],
      manifest: {
        name: 'IBaj, Igreja Batista do Jaraguá',
        short_name: 'IBaj',
        description: 'Avisos, agenda, devocionais e membros da Igreja Batista do Jaraguá.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F5F0',
        theme_color: '#F6F5F0',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Conteúdo público e pessoal fica disponível offline com a última versão vista.
            // Painel e autenticação nunca passam pelo cache.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') && !/^\/api\/(admin|auth)\b/.test(url.pathname),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  preview: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
