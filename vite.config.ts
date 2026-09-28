import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: { entries: ['index.html'] },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: { output: { manualChunks: id => id.includes('/node_modules/three/') ? 'three-engine' : undefined } },
  },
})
