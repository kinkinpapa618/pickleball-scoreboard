import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware log request (Tùy chọn)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any;

  const oldJson = res.json;
  res.json = (body) => {
    resBody = body;
    return oldJson.call(res, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (resBody) {
        logLine += ` :: ${JSON.stringify(resBody)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // 1. Đăng ký routes và nhận về HTTP Server
  const server = await registerRoutes(app);

  // 2. Middleware xử lý lỗi
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // 3. Cấu hình Vite hoặc Serve Static
  if (app.get("env") === "development") {
    // Truyền cả app và server vào setupVite
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 4. Lắng nghe trên cổng 5000
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
