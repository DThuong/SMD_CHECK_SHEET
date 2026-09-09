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
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // KHÔNG tự chia manualChunks nữa.
        //
        // Lần trước tôi gom tay react/bootstrap/i18n thành các chunk riêng, kết quả
        // là vendor-react và vendor-bootstrap import vòng lẫn nhau -> khi trình duyệt
        // nạp, react-bootstrap gọi React.createContext trong khi React chưa khởi tạo
        // xong -> "Cannot read properties of undefined (reading 'createContext')"
        // -> TRẮNG TRANG toàn bộ ứng dụng.
        //
        // Để Rollup tự quyết định thứ tự và ranh giới chunk. Việc giảm dung lượng
        // vẫn đạt được nhờ lazy-load route trong Routes.tsx và dynamic import
        // jspdf/html2canvas — hai thứ đó an toàn vì không đụng tới thứ tự khởi tạo.
        manualChunks: undefined,
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
