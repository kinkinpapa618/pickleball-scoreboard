import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMatchSchema, insertPlayerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // 1. Lấy danh sách người chơi
  // Sửa lỗi: Thay 'req' bằng '_' để báo hiệu biến này không dùng đến
  app.get("/api/players", async (_, res) => {
    const players = await storage.getPlayers();
    res.json(players);
  });

  // 2. Tạo người chơi mới
  app.post("/api/players", async (req, res) => {
    const result = insertPlayerSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Dữ liệu người chơi không hợp lệ" });
    }
    const player = await storage.createPlayer(result.data);
    res.json(player);
  });

  // 3. Lấy danh sách trận đấu
  app.get("/api/matches", async (_, res) => {
    const matches = await storage.getMatches();
    res.json(matches);
  });

  // 4. Lấy chi tiết 1 trận đấu (Dành cho MatchView)
  app.get("/api/matches/:id", async (req, res) => {
    // Sửa lỗi ép kiểu: Đảm bảo id là string trước khi parseInt
    const id = parseInt(req.params.id as string);
    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }
    res.json(match);
  });

  // 5. Cập nhật trận đấu (Dành cho Livestream/Scoreboard)
  app.patch("/api/matches/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    // Dùng .partial() để cho phép gửi lên chỉ 1 vài trường cần update
    const result = insertMatchSchema.partial().safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ" });
    }

    try {
      const updated = await storage.updateMatch(id, result.data);
      res.json(updated);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 6. Tạo trận đấu mới
  app.post("/api/matches", async (req, res) => {
    const result = insertMatchSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Dữ liệu trận đấu không hợp lệ" });
    }
    const match = await storage.createMatch(result.data);
    res.json(match);
  });

  const httpServer = createServer(app);
  return httpServer;
}
