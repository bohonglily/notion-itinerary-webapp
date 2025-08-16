import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 支援 Netlify Functions 路徑
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      // 保留 API 路徑支援（用於 Vercel 測試）
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
