import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  build: {
    // Raise warning threshold — our main app chunk can't be trivially split
    // because it's intentionally a single-page monolith.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split React + ReactDOM into their own cached vendor chunk.
        // Browser caches this separately so app updates don't bust React.
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
})
