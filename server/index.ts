import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware log request
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode}`);
    }
  });
  next();
});

(async () => {
  try {
    // 1. Đăng ký các API Routes (Quan trọng: Phải chạy trước Vite)
    const server = await registerRoutes(app);

    // 2. Cấu hình giao diện (Vite cho dev, Static cho prod)
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 3. Middleware xử lý lỗi tập trung (Đặt sau cùng)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      // Log lỗi chi tiết ra console để dễ debug
      if (status >= 500) console.error(err);
      res.status(status).json({ message });
    });

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server đang chạy tại port ${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khởi động server:", error);
    process.exit(1);
  }
})();
