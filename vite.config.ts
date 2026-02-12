import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    // THÊM ĐOẠN NÀY
    allowedHosts: [
      "c5005ad0-0dc6-4ff6-8d22-db187a37122b-00-38vfydfxnnakc.picard.replit.dev",
    ],
    // HOẶC dùng cách này để cho phép tất cả các host trên Replit:
    // allowedHosts: true,
  },
  plugins: [react()],
  // 1. Chỉ định root là thư mục client
  root: path.resolve(__dirname, "client"),
  build: {
    // 2. Build xong sẽ đẩy ra ngoài thư mục dist của root
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // 3. Chỉ định file index.html nằm bên trong thư mục client
        main: path.resolve(__dirname, "client/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
});
