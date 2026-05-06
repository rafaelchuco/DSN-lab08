import { defineConfig } from 'vite'

// Proxy /api requests to backend
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://backend:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
