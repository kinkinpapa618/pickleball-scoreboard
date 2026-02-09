import { Express, static as expressStatic } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.get(/^((?!\/api).)*$/, async (req, res, next) => {
    try {
      const templatePath = path.resolve(process.cwd(), "client", "index.html");
      const template = fs.readFileSync(templatePath, "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Dựa trên kết quả 'ls -R dist' của bạn:
  const distPath = path.resolve(process.cwd(), "dist");

  if (fs.existsSync(path.resolve(distPath, "index.html"))) {
    // 1. Phục vụ các file tĩnh trong thư mục dist (js, css, v.v.)
    app.use(expressStatic(distPath));

    // 2. Với mọi request không phải API, trả về file index.html
    app.get(/^((?!\/api).)*$/, (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });

    log("Server: Đang chạy giao diện từ thư mục dist");
  } else {
    log("Server: LỖI! Không tìm thấy dist/index.html");
  }
}
