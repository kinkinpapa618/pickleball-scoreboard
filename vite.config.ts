import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { fileURLToPath } from 'url';

// Giả lập __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'ma.svg'],
      manifest: {
        name: 'BMB Pickleball Pro',
        short_name: 'BMB Score',
        description: 'Hệ thống tính điểm chuyên nghiệp',
        theme_color: '#4f46e5',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
resolve: {
    alias: {
      // Alias cho client (đã làm bước trước)
      "@": path.resolve(__dirname, "./client/src"),
      // THÊM DÒNG NÀY: Alias cho thư mục shared
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});