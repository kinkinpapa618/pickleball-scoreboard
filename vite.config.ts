import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    // THÊM ĐOẠN NÀY
    allowedHosts: [
      "c5005ad0-0dc6-4ff6-8d22-db187a37122b-00-38vfydfxnnakc.picard.replit.dev",
    ],
    // HOẶC dùng cách này để cho phép tất cả các host trên Replit:
    // allowedHosts: true,

    hmr: {
      clientPort: 443,
    },
  },
});
