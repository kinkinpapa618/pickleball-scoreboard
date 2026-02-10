import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Cho phép truy cập từ bên ngoài
    port: 5173, // Cổng mặc định của Vite
    allowedHosts: true, // CHÈN DÒNG NÀY: Cho phép tất cả các host của Replit
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});
