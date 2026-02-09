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

  // Dùng Regex để tránh lỗi PathError và catch-all route
  app.get(/^((?!\/api).)*$/, async (req, res, next) => {
    try {
      // Đường dẫn file index.html chuẩn từ gốc dự án
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
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (fs.existsSync(distPath)) {
    app.use(expressStatic(distPath));
    app.get(/^((?!\/api).)*$/, (_req, res) =>
      res.sendFile(path.resolve(distPath, "index.html")),
    );
  }
}
