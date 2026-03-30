import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — loaded on every page
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animations — loaded only where framer-motion is used
          'vendor-motion': ['framer-motion'],

          // Icons — loaded everywhere but small enough to split
          'vendor-icons': ['lucide-react'],

          // Firebase — heavy, only needed after auth/DB operations
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],

          // Charts — only used on Reports and StudentReports pages
          'vendor-charts': ['recharts'],

          // QR code — only used in GameHost join lobby
          'vendor-qr': ['qrcode.react'],

          // Confetti — only used in GameHost end screen
          'vendor-confetti': ['canvas-confetti'],

          // Excel export — only used in QuizHistoryTable download
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    // Increase chunk size warning threshold slightly since we're splitting properly
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
