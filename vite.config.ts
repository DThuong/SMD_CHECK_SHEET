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
    // Cảnh báo sớm nếu có chunk phình to trở lại
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // TRƯỚC: manualChunks: undefined -> mọi thư viện gộp chung vào index.js
        // (2,5 MB), tải cả ở màn hình đăng nhập.
        // NAY: tách các thư viện nặng thành chunk riêng, chỉ tải khi trang cần tới.
        manualChunks(id: string) {
          const m = id.replace(/\\/g, '/').match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)\//);
          if (!m) return undefined;
          const pkg = m[1];

          // Biểu đồ — chỉ Dashboard và các trang report dùng
          if (pkg === 'recharts' || pkg === 'victory-vendor' || pkg.startsWith('d3-')) {
            return 'vendor-charts';
          }
          // Xuất PDF — chỉ dùng khi bấm nút Export
          if (pkg === 'jspdf' || pkg === 'html2canvas-pro' || pkg === 'html2canvas' || pkg === 'canvg' || pkg === 'dompurify') {
            return 'vendor-pdf';
          }
          // React + router + redux: để CHUNG một chunk, tách nhỏ hơn dễ lỗi thứ tự khởi tạo
          if (
            pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler' ||
            pkg === 'react-router' || pkg === 'react-router-dom' ||
            pkg === '@reduxjs/toolkit' || pkg === 'react-redux' ||
            pkg === 'redux' || pkg === 'redux-thunk' || pkg === 'redux-persist' ||
            pkg === 'immer' || pkg === 'reselect' || pkg === 'use-sync-external-store'
          ) {
            return 'vendor-react';
          }
          // i18n
          if (pkg === 'i18next' || pkg.startsWith('i18next-') || pkg === 'react-i18next') {
            return 'vendor-i18n';
          }
          // Bootstrap / react-bootstrap
          if (pkg === 'react-bootstrap' || pkg === 'bootstrap' || pkg === '@restart') {
            return 'vendor-bootstrap';
          }
          // Các thư viện còn lại: KHÔNG gom vào một chunk chung.
          // Trả về undefined để Rollup tự đặt chúng vào đúng chunk của trang dùng tới,
          // nhờ vậy thư viện chỉ vài trang dùng (react-select, react-datepicker...)
          // không bị tải ngay ở màn hình đăng nhập.
          return undefined;
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  // Bỏ console.log/debug/info khỏi bản production.
  // Chrome giữ lại mọi message trong bộ đệm console kể cả khi không mở DevTools,
  // và giữ luôn tham chiếu tới object được log -> chặn garbage collector.
  // Giữ lại console.error và console.warn để còn chẩn đoán được sự cố thật.
  esbuild: {
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  server: {
    host: '0.0.0.0', // Listen all IPs
    port: 5173,
    strictPort: true,
  },
})
