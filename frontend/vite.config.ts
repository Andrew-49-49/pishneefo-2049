import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    // เรียก /api จากหน้าเว็บให้วิ่งไปที่ Express — same-origin จึงส่ง cookie ได้ปกติ
    // และไม่ต้องตั้ง CORS ให้ยุ่งยาก
    proxy: {
      '/api': {
        target: env.VITE_API_PROXY_TARGET || env.API_URL || 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
});
