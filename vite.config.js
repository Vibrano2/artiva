import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ]
  const missing = required.filter((key) => !env[key]?.trim())
  if (missing.length) {
    throw new Error(`Missing required frontend environment variables: ${missing.join(', ')}`)
  }

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'Artiva',
        short_name: 'Artiva',
        description: 'Find reviewed artisan profiles and manage local service jobs.',
        theme_color: '#16858F',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-auth': ['firebase/app', 'firebase/auth'],
          'firebase-data': ['firebase/firestore'],
          'firebase-analytics': ['firebase/analytics'],
          'ui-vendor': ['lucide-react']
        }
      }
    }
  }
  }
})
