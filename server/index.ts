import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as vite from "./vite";
import path from "path";
import { setupAuth } from "./auth"; // Import hàm setup từ file auth.ts của bạn

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware log request
app.use((req, res, next) => {
  const start = Date.now();
  const pathStr = req.path;
  let resBody: any = null;
  const resJson = res.json;
  res.json = function (body) {
    resBody = body;
    return resJson.apply(res, arguments as any);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathStr.startsWith("/api")) {
      vite.log(`${req.method} ${pathStr} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  setupAuth(app);
  // Đăng ký các API routes và tạo server instance
  const server = await registerRoutes(app);

  // Middleware xử lý lỗi tập trung
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV !== "production") {
    // CHẾ ĐỘ PHÁT TRIỂN (DEV)
    await vite.setupVite(app, server);
    vite.log("Đang chạy ở chế độ: DEVELOPMENT");
  } else {
    const publicPath = path.resolve(__dirname, "public");
    app.use(express.static(publicPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(publicPath, "index.html"), (err) => {
        if (err) {
          res
            .status(500)
            .send(
              "Lỗi: Không tìm thấy file index.html trong dist/public. Vui lòng kiểm tra lại quá trình build.",
            );
        }
      });
    });
    vite.log("Đang chạy ở chế độ: PRODUCTION");
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    vite.log(`[BMB PICKLEBALL] Server online tại cổng ${PORT}`);
  });
})();
