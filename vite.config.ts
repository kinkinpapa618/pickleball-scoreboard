import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  plugins: [react(), VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Pickleball Scoreboard',
          short_name: 'Pickleball',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#1e90ff',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          runtimeCaching: [{ urlPattern: /.*/, handler: 'NetworkFirst' }],
        },
      })],
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "wouter"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-select"],
          charts: ["recharts"],
          utils: ["exceljs", "xlsx"],
          // largeLibs removed to avoid chunk conflict
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./client/src/setupTests.ts'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
