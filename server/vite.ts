import { Express, static as expressStatic } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log(`[${time}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Sử dụng app ở đây để bắt lỗi request không khớp
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const template = fs.readFileSync(
        path.resolve(__dirname, "..", "client", "index.html"),
        "utf-8",
      );
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      "Could not find build directory. Run 'npm run build' first.",
    );
  }

  // SỬA LỖI: Sử dụng 'app' để serve các file tĩnh từ thư mục dist
  app.use(expressStatic(distPath));

  // Trả về index.html cho mọi route không phải API (Single Page Application)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
