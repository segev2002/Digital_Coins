import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy /nvidia-api/* → https://integrate.api.nvidia.com/v1/*
      // This runs server-side so CORS headers are never checked by the browser.
      '/nvidia-api': {
        target: 'https://integrate.api.nvidia.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
        secure: true,
      },
    },
  },
})
