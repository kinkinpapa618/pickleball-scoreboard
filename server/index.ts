import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware log
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any = null;
  const resJson = res.json;
  res.json = function (body) {
    resBody = body;
    return resJson.apply(res, arguments as any);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  // SỬA TẠI ĐÂY: Thêm await để lấy server từ Promise
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  // Giờ đây server đã là đối tượng HTTP Server, có thể gọi .listen()
  server.listen(PORT, "0.0.0.0", () => {
    log(`[BMB PICKLEBALL] Server online tại cổng ${PORT}`);
  });
})();
