import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// Đọc version từ file đã generate
let appVersion = 'dev';
try {
  appVersion = JSON.parse(fs.readFileSync('./public/version.json', 'utf-8')).version;
} catch (e) {
  console.log('No version.json found, using dev');
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  server: {
    host: '0.0.0.0', // Listen all IPs
    port: 5173,
    strictPort: true,
  },
})
