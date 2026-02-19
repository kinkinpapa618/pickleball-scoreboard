import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertMatchSchema,
  updateMatchSchema,
  insertPlayerSchema,
  insertWorkScheduleSchema,
  insertTournamentSchema,
  insertTournamentPlayerSchema,
  insertTournamentMatchSchema,
  insertMatchSchema as matchSchema,
  insertNotificationSchema,
} from "@shared/schema";

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

  // 3. Lấy danh sách trận đấu (Hiển thị tất cả cho tab Lịch sử)
  app.get("/api/matches", async (req, res) => {
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
    
    // Trận đấu công khai được xem (MatchView), nhưng không trả về refereeId cho client
    const { refereeId, ...publicMatch } = match;
    res.json(publicMatch);
  });

  // 4b. Lấy trận đấu bằng token (dành cho trọng tài truy cập qua link)
  app.get("/api/matches/token/:token", async (req, res) => {
    const token = req.params.token as string;
    const tournamentMatch = await storage.getTournamentMatchByToken(token);
    
    if (!tournamentMatch) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }
    
    // Lấy thông tin tournament
    const tournament = await storage.getTournament(tournamentMatch.tournamentId);
    
    res.json({
      ...tournamentMatch,
      tournamentName: tournament?.name,
    });
  });

  // 5. Cập nhật trận đấu (Dành cho Livestream/Scoreboard)
  app.patch("/api/matches/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    // Kiểm tra quyền sở hữu - cho phép cập nhật nếu:
    // 1. Là admin
    // 2. Là referee của trận đấu
    // 3. Trận đấu không có referee (để cho phép cập nhật điểm tự do)
    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }
    
    const hasPermission = !user || user.role === "admin" || match.refereeId === user.id || !match.refereeId;
    if (user && !hasPermission) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa trận đấu này" });
    }
    
    // DEBUG
    console.log(`[PATCH /api/matches/${id}] Body:`, JSON.stringify(req.body));

    // Build update data chỉ với các trường được gửi lên
    const { 
      status, 
      winnerTeam, 
      endTime, 
      scoreTeam1, 
      scoreTeam2,
      isServer1,
      isServer2,
      serverNumber,
      isFirstServeOfMatch,
      timeline,
      timeouts,
      stacking,
      penalties,
    } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (winnerTeam !== undefined) updateData.winnerTeam = winnerTeam;
    if (endTime !== undefined) {
      // Convert ISO string to Date object for drizzle
      const dateVal = typeof endTime === 'string' ? new Date(endTime) : endTime;
      updateData.endTime = dateVal;
    }
    if (scoreTeam1 !== undefined) updateData.scoreTeam1 = scoreTeam1;
    if (scoreTeam2 !== undefined) updateData.scoreTeam2 = scoreTeam2;
    if (isServer1 !== undefined) updateData.isServer1 = isServer1;
    if (isServer2 !== undefined) updateData.isServer2 = isServer2;
    if (serverNumber !== undefined) updateData.serverNumber = serverNumber;
    if (isFirstServeOfMatch !== undefined) updateData.isFirstServeOfMatch = isFirstServeOfMatch;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (timeouts !== undefined) updateData.timeouts = timeouts;
    if (stacking !== undefined) updateData.stacking = stacking;
    if (penalties !== undefined) updateData.penalties = penalties;

    console.log(`[PATCH /api/matches/${id}] Update data:`, JSON.stringify(updateData));

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
    }

    try {
      const updated = await storage.updateMatch(id, updateData);

      // Cập nhật tournament_match status nếu trận đấu kết thúc
      if (status === "completed" || status === "finished") {
        const tournamentMatch = await storage.getTournamentMatchByMatchId(id);
        if (tournamentMatch) {
          await storage.updateTournamentMatch(tournamentMatch.id, { status: "completed" });
        }
      }

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
    const user = req.user as any;
    const matchData = {
      ...result.data,
      refereeId: user?.id || null,
    };
    const match = await storage.createMatch(matchData);

    // Tạo thông báo nếu có referee được assign
    if (match.refereeId) {
      await storage.createNotification({
        userId: match.refereeId,
        type: "match",
        title: "Bạn được assign làm trọng tài",
        message: `Trận đấu ${match.team1Player1}/${match.team1Player2} vs ${match.team2Player1}/${match.team2Player2}`,
        link: `/match/${match.id}`,
        data: { matchId: match.id },
      });
    }

    res.json(match);
  });

  // 6. Xóa trận đấu (Admin only)
  app.delete("/api/matches/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xóa trận đấu" });
    }

    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }

    await storage.deleteMatch(id);
    res.json({ message: "Xóa trận đấu thành công" });
  });

  // 6b. Lấy danh sách trận đấu của user (phân trang)
  app.get("/api/my-matches", async (req, res) => {
    const user = req.user as any;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 8;
    const offset = (page - 1) * limit;

    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const matches = await storage.getUserMatches(user.id, limit, offset);
    const total = await storage.getUserMatchCount(user.id);
    const totalPages = Math.ceil(total / limit);

    res.json({
      matches,
      pagination: {
        currentPage: page,
        totalPages: Math.min(totalPages, 5),
        total,
        hasMore: page < Math.min(totalPages, 5),
      },
    });

    // Auto-delete matches beyond 5 pages
    if (page === Math.min(totalPages, 5) && totalPages > 5) {
      const oldMatches = await storage.getOldMatchesBeyondPages(user.id, 5, limit);
      for (const match of oldMatches) {
        await storage.deleteMatch(match.id);
      }
    }
  });

  // 7. Lấy lịch công tác (có thể lọc theo refereeId)
  app.get("/api/work-schedules", async (req, res) => {
    const refereeId = req.query.refereeId
      ? parseInt(req.query.refereeId as string)
      : undefined;
    const schedules = await storage.getWorkSchedules(refereeId);
    res.json(schedules);
  });

  // 8. Lấy chi tiết 1 lịch công tác
  app.get("/api/work-schedules/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const schedule = await storage.getWorkScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch công tác" });
    }
    res.json(schedule);
  });

  // 9. Tạo lịch công tác mới
  app.post("/api/work-schedules", async (req, res) => {
    const result = insertWorkScheduleSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Dữ liệu lịch công tác không hợp lệ" });
    }
    const schedule = await storage.createWorkSchedule(result.data);

    // Tạo thông báo cho referee nếu có refereeId
    if (schedule.refereeId) {
      const referee = await storage.getUser(schedule.refereeId);
      if (referee) {
        await storage.createNotification({
          userId: referee.id,
          type: "schedule",
          title: "Lịch công tác mới",
          message: schedule.title + (schedule.description ? `: ${schedule.description}` : ""),
          link: schedule.matchId ? `/match/${schedule.matchId}` : "/tools",
          data: { scheduleId: schedule.id },
        });
      }
    }

    res.json(schedule);
  });

  // 10. Cập nhật lịch công tác
  app.patch("/api/work-schedules/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const result = insertWorkScheduleSchema.partial().safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ" });
    }

    try {
      const updated = await storage.updateWorkSchedule(id, result.data);
      res.json(updated);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 11. Xóa lịch công tác
  app.delete("/api/work-schedules/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    try {
      await storage.deleteWorkSchedule(id);
      res.json({ message: "Xóa lịch công tác thành công" });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 12. Lấy danh sách users (chỉ admin và manager)
  app.get("/api/users", async (req, res) => {
    const user = req.user as any;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    // Nếu là manager, chỉ hiển thị user do manager đó tạo (referee)
    if (user.role === "manager") {
      const managerUsers = await storage.getUsersByManagerId(user.id);
      res.json(managerUsers);
    } else {
      const users = await storage.getUsers();
      res.json(users);
    }
  });

  // 13. Cập nhật thông tin user (admin và manager)
  app.patch("/api/users/:id", async (req, res) => {
    const user = req.user as any;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const id = parseInt(req.params.id as string);
    const targetUser = await storage.getUser(id);
    
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    // Nếu là manager, chỉ được sửa user do mình tạo
    if (user.role === "manager" && targetUser.managerId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền sửa người dùng này" });
    }
    
    // Manager không được sửa role của user thành manager hoặc admin
    if (user.role === "manager" && req.body.role && (req.body.role === "admin" || req.body.role === "manager")) {
      return res.status(403).json({ message: "Bạn không có quyền cấp quyền này" });
    }
    
    try {
      const updated = await storage.updateUser(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 14. Xóa user (chỉ admin và manager)
  app.delete("/api/users/:id", async (req, res) => {
    const user = req.user as any;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const id = parseInt(req.params.id as string);
    const targetUser = await storage.getUser(id);
    
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    // Nếu là manager, chỉ được xóa user do mình tạo
    if (user.role === "manager" && targetUser.managerId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa người dùng này" });
    }
    
    // Không cho phép xóa admin hoặc manager khác
    if (user.role === "manager" && (targetUser.role === "admin" || targetUser.role === "manager")) {
      return res.status(403).json({ message: "Bạn không có quyền xóa người dùng này" });
    }
    
    try {
      await storage.deleteUser(id);
      res.json({ message: "Xóa người dùng thành công" });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 15. Lấy thống kê trận đấu của referee
  app.get("/api/stats/referee/:id", async (req, res) => {
    const refereeId = parseInt(req.params.id as string);
    const matches = await storage.getMatchesByReferee(refereeId);
    const schedules = await storage.getWorkSchedules(refereeId);
    
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === "finished").length,
      pendingMatches: matches.filter(m => m.status === "pending").length,
      totalSchedules: schedules.length,
      completedSchedules: schedules.filter(s => s.status === "completed").length,
    };
    res.json(stats);
  });

  // 15. Thống kê tổng quan cho Admin
  app.get("/api/stats/admin", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    
    const allMatches = await storage.getMatches();
    const allUsers = await storage.getUsers();
    const allSchedules = await storage.getWorkSchedules();
    const allTournaments = await storage.getTournaments();
    
    const stats = {
      totalMatches: allMatches.length,
      liveMatches: allMatches.filter(m => m.status === "live").length,
      finishedMatches: allMatches.filter(m => m.status === "finished").length,
      pendingMatches: allMatches.filter(m => m.status === "pending").length,
      totalUsers: allUsers.length,
      adminUsers: allUsers.filter(u => u.role === "admin").length,
      managerUsers: allUsers.filter(u => u.role === "manager").length,
      refereeUsers: allUsers.filter(u => u.role === "referee").length,
      totalSchedules: allSchedules.length,
      completedSchedules: allSchedules.filter(s => s.status === "completed").length,
      totalTournaments: allTournaments.length,
      activeTournaments: allTournaments.filter(t => t.status === "active").length,
      completedTournaments: allTournaments.filter(t => t.status === "completed").length,
    };
    res.json(stats);
  });

  // === TOURNAMENT APIs ===

  // 15. Lấy danh sách giải đấu (chỉ user tạo mới thấy được)
  app.get("/api/tournaments", async (req, res) => {
    const user = req.user as any;
    console.log("User from session:", user);
    console.log("Is authenticated:", req.isAuthenticated());
    if (!user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    // Admin thấy tất cả, manager chỉ thấy của mình
    const tournaments = user.role === "admin" 
      ? await storage.getTournaments() 
      : await storage.getTournaments(user.id);
    console.log("Tournaments found:", tournaments.length);
    res.json(tournaments);
  });

  // 16. Tạo giải đấu mới (chỉ MANAGER mới được tạo)
  app.post("/api/tournaments", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    if (user.role !== "manager" && user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ MANAGER mới được tạo giải đấu" });
    }

    console.log("Creating tournament with data:", req.body);
    
    try {
      const tournament = await storage.createTournament({
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        level: req.body.level,
        content: req.body.content,
        teamsPerGroup: req.body.teamsPerGroup || 4,
        winningScore: req.body.winningScore || 11,
        status: "draft",
        creatorId: user.id,
        backdrop: req.body.backdrop,
      });
      res.json(tournament);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      return res.status(500).json({ message: error.message || "Không thể tạo giải đấu" });
    }
  });

  // 17. Lấy chi tiết giải đấu
  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      console.log("Fetching tournament:", id);
      const user = req.user as any;
      console.log("User:", user?.id, user?.role);

      const tournament = await storage.getTournament(id);
      console.log("Tournament found:", !!tournament);
      if (!tournament) {
        return res.status(404).json({ message: "Không tìm thấy giải đấu" });
      }

      // Chỉ người tạo mới xem được (hoặc admin)
      if (user && user.role !== "admin" && tournament.creatorId !== user.id) {
        console.log("Access denied - creatorId:", tournament.creatorId, "user.id:", user.id);
        return res.status(403).json({ message: "Bạn không có quyền xem giải đấu này" });
      }

      let players: any[] = [];
      let matches: any[] = [];

      try {
        players = await storage.getTournamentPlayers(id);
        console.log("Players fetched:", players.length);
      } catch (e: any) {
        console.error("Error fetching players:", e.message);
      }

      try {
        matches = await storage.getTournamentMatchesSimple(id);
        console.log("Matches fetched:", matches.length);
      } catch (e: any) {
        console.error("Error fetching matches:", e.message);
      }

      res.json({ ...tournament, players, matches });
    } catch (error: any) {
      console.error("Error fetching tournament:", error.message, error.stack);
      res.status(500).json({ message: "Lỗi server khi lấy thông tin giải đấu: " + error.message });
    }
  });

  // 17b. Cập nhật trạng thái giải đấu và gửi thông báo
  app.patch("/api/tournaments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const user = req.user as any;
      const { status } = req.body;

      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: "Không tìm thấy giải đấu" });
      }

      if (user.role !== "admin" && tournament.creatorId !== user.id) {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
      }

      const updated = await storage.updateTournament(id, { status });

      // Tạo thông báo khi giải đấu bắt đầu
      if (status === "active") {
        // Lấy danh sách referee đã được assign
        const matches = await storage.getTournamentMatches(id);
        const refereeIds = [...new Set(matches.map(m => m.refereeId).filter(Boolean))];

        for (const refereeId of refereeIds) {
          if (refereeId) {
            await storage.createNotification({
              userId: refereeId,
              type: "tournament",
              title: "Giải đấu đã bắt đầu",
              message: `${tournament.name} đã chính thức bắt đầu. Vui lòng kiểm tra lịch điều khiển của bạn.`,
              link: `/tournament/${id}`,
              data: { tournamentId: id },
            });
          }
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating tournament status:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái giải đấu" });
    }
  });

  // 18. Cập nhật giải đấu
  app.patch("/api/tournaments/:id", async (req, res) => {
    try {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (user.role !== "admin" && tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    const result = insertTournamentSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ" });
    }

    const updated = await storage.updateTournament(id, result.data);
    res.json(updated);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật giải đấu" });
    }
  });

  // 19. Xóa giải đấu
  app.delete("/api/tournaments/:id", async (req, res) => {
    try {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (user.role !== "admin" && tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa giải đấu này" });
    }

    await storage.deleteTournamentPlayers(id);
    await storage.deleteTournament(id);
    res.json({ message: "Xóa giải đấu thành công" });
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ message: "Lỗi server khi xóa giải đấu" });
    }
  });

  // 20. Thêm danh sách VĐV vào giải đấu và tạo lịch đấu
  app.post("/api/tournaments/:id/generate", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    const { players: playerData, teamsPerGroup } = req.body;

    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (user.role !== "admin" && tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    if (!playerData || playerData.length < 1) {
      return res.status(400).json({ message: "Cần tối thiểu 1 cặp đấu" });
    }

    // Xóa matches cũ nếu có
    await storage.deleteTournamentMatches(id);
    await storage.deleteTournamentPlayers(id);

    // Xử lý dữ liệu 4 VĐV/cặp
    // playerData có thể là array of strings (cũ) hoặc array of objects (mới với 4 players)
    const matchesToInsert: any[] = [];
    let matchOrder = 1;
    let currentRound = 1;

    // Kiểm tra format dữ liệu
    const isNewFormat = Array.isArray(playerData) && typeof playerData[0] === 'object' && playerData[0] !== null && 'player1' in playerData[0];

    if (isNewFormat) {
      // Format mới: mỗi phần tử là object chứa 4 VĐV
      // Gom nhóm theo level để tạo bảng
      const byLevel: Record<string, any[]> = {};
      
      playerData.forEach((p: any) => {
        // Sử dụng trực tiếp level từ file Excel
        const level = p.level || "Default";
        if (!byLevel[level]) byLevel[level] = [];
        byLevel[level].push(p);
      });

      // Tạo bảng cho từng level
      let groupCounter = 0;
      const groupNames = "ABCDEFGHIJKLMNOP".split("");
      
      for (const [level, levelMatches] of Object.entries(byLevel)) {
        const levelGroups: Record<string, any[]> = {};
        const matchesInLevel = levelMatches as any[];
        
        // Chia thành các bảng
        matchesInLevel.forEach((match, idx) => {
          const groupIdx = Math.floor(idx / (teamsPerGroup || 4));
          const groupName = `${level}-${groupNames[groupCounter + groupIdx]}`;
          if (!levelGroups[groupName]) levelGroups[groupName] = [];
          levelGroups[groupName].push(match);
        });
        
        // Tạo round robin cho mỗi bảng
        for (const [groupName, groupMatches] of Object.entries(levelGroups)) {
          // Tạo tất cả cặp đấu round robin trong bảng
          for (let i = 0; i < groupMatches.length; i++) {
            for (let j = i + 1; j < groupMatches.length; j++) {
              const m1 = groupMatches[i];
              const m2 = groupMatches[j];
              
              if (m1 && m2) {
                const player1Team1 = m1.player1 ?? "";
                const player2Team1 = m1.player2 ?? "";
                const player1Team2 = m2.player1 ?? "";
                const player2Team2 = m2.player2 ?? "";
                
                if (!player1Team1 || !player2Team1 || !player1Team2 || !player2Team2) {
                  continue;
                }
                
                matchesToInsert.push({
                  tournamentId: id,
                  team1Player1: player1Team1,
                  team1Player2: player2Team1,
                  team2Player1: player1Team2,
                  team2Player2: player2Team2,
                  groupName,
                  round: currentRound,
                  matchOrder: matchOrder++,
                  status: "pending",
                });
              }
            }
          }
          groupCounter++;
        }
      }
    } else {
      // Format cũ: array of strings
      const playerNames = playerData as string[];
      const pairs: string[] = [];
      for (let i = 0; i < playerNames.length; i += 2) {
        if (playerNames[i + 1]) {
          pairs.push(`${playerNames[i]} vs ${playerNames[i + 1]}`);
        }
      }

      const { generateGroups } = await import("@shared/tournament");
      const groups = generateGroups(pairs, teamsPerGroup || 4);

      for (const [groupName, groupData] of Object.entries(groups) as any[]) {
        const roundMatches = groupData.matches || [];
        for (const match of roundMatches) {
          const homeParts = (match.home || "").split(" vs ");
          const awayParts = (match.away || "").split(" vs ");
          
          const team1Player1 = homeParts[0] ?? "";
          const team1Player2 = homeParts[1] ?? "";
          const team2Player1 = awayParts[0] ?? "";
          const team2Player2 = awayParts[1] ?? "";
          
          if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
            continue;
          }
          
          matchesToInsert.push({
            tournamentId: id,
            team1Player1,
            team1Player2,
            team2Player1,
            team2Player2,
            groupName,
            round: 1,
            matchOrder: matchOrder++,
            status: "pending",
          });
        }
      }
    }

    if (matchesToInsert.length === 0) {
      return res.status(400).json({ message: "Không thể tạo trận đấu nào!" });
    }

    const savedMatches = await storage.createTournamentMatches(matchesToInsert);
    await storage.updateTournament(id, { status: "active" });

    res.json({ 
      tournament: await storage.getTournament(id),
      matches: savedMatches 
    });
  });

  // 21. Lấy danh sách referees (cho manager assign)
  app.get("/api/referees", async (req, res) => {
    const user = req.user as any;
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    const allUsers = await storage.getUsers();
    const referees = allUsers.filter(u => u.role === "referee");
    res.json(referees);
  });

  // 22. Assign referee vào trận đấu trong giải
  app.post("/api/tournaments/:tournamentId/matches/:matchId/assign-referee", async (req, res) => {
    const tournamentId = parseInt(req.params.tournamentId as string);
    const matchId = parseInt(req.params.matchId as string);
    const { refereeId } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Lấy user từ database để đảm bảo có role đúng
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    // Admin có thể edit mọi giải, hoặc creator của giải đó
    const canEdit = dbUser.role === "admin" || tournament.creatorId === dbUser.id;
    console.log("Can edit:", canEdit, "Role:", dbUser.role, "Creator:", tournament.creatorId, "User:", dbUser.id);

    if (!canEdit) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    const updated = await storage.assignRefereeToMatch(matchId, refereeId);

    // Lấy thông tin referee để tạo thông báo
    const referee = await storage.getUser(refereeId);
    const tournamentMatch = await storage.getTournamentMatch(matchId);

    if (referee && tournamentMatch) {
      await storage.createNotification({
        userId: referee.id,
        type: "match",
        title: "Bạn được assign điều khiển trận đấu",
        message: `${tournamentMatch.team1Player1}/${tournamentMatch.team1Player2} vs ${tournamentMatch.team2Player1}/${tournamentMatch.team2Player2} tại ${tournament.name}`,
        link: `/trong-tai/${tournamentMatch.refereeToken}`,
        data: { tournamentMatchId: matchId, tournamentId },
      });
    }

    res.json(updated);
  });

  // 22a. Lấy link truy cập trận đấu cho trọng tài
  app.get("/api/tournaments/:tournamentId/matches/:matchId/access-link", async (req, res) => {
    const matchId = parseInt(req.params.matchId as string);
    
    const accessLink = await storage.getMatchAccessLink(matchId);
    if (!accessLink) {
      return res.status(404).json({ message: "Không tìm thấy link truy cập" });
    }
    
    res.json(accessLink);
  });

  // 23. Tạo trận đấu thực tế từ tournament match (để bắt đầu thi đấu)
  app.post("/api/tournaments/:tournamentId/matches/:matchId/start", async (req, res) => {
    const tournamentId = parseInt(req.params.tournamentId as string);
    const matchId = parseInt(req.params.matchId as string);
    const user = req.user as any;

    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (user.role !== "admin" && tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền" });
    }

    const tournamentMatch = await storage.getTournamentMatch(matchId);
    if (!tournamentMatch) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }

    // Tạo match thực tế
    const matchResult = matchSchema.safeParse({
      team1Player1: tournamentMatch.team1Player1,
      team1Player2: tournamentMatch.team1Player2,
      team2Player1: tournamentMatch.team2Player1,
      team2Player2: tournamentMatch.team2Player2,
      scoreTeam1: 0,
      scoreTeam2: 0,
      winningScore: tournament.winningScore,
      status: "live",
      isServer1: false,
      isServer2: false,
      serverNumber: 1,
    });

    if (!matchResult.success) {
      return res.status(400).json({ message: "Dữ liệu trận đấu không hợp lệ" });
    }

    const createdMatch = await storage.createMatch({
      ...matchResult.data,
      refereeId: tournamentMatch.refereeId,
    });

    // Cập nhật tournament match
    await storage.updateTournamentMatch(matchId, { 
      matchId: createdMatch.id, 
      status: "live" 
    });

    res.json(createdMatch);
  });

  // === SETTINGS APIs ===
  app.get("/api/settings", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    const allSettings = await storage.getSettings();
    res.json(allSettings);
  });

  app.get("/api/settings/:key", async (req, res) => {
    const key = req.params.key as string;
    const setting = await storage.getSetting(key);
    if (!setting) {
      return res.status(404).json({ message: "Không tìm thấy cài đặt" });
    }
    res.json(setting);
  });

  app.post("/api/settings", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ message: "Thiếu key hoặc value" });
    }
    const setting = await storage.setSetting(key, String(value), description);
    res.json(setting);
  });

  // === MANAGER CONNECTIONS API ===

  // Lấy danh sách Managers (cho referee chọn kết nối)
  app.get("/api/managers", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }
    const managers = await storage.getAllManagers();
    res.json(managers);
  });

  // Lấy danh sách Managers đã kết nối (của referee hiện tại)
  app.get("/api/connected-managers", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "referee") {
      return res.status(403).json({ message: "Chỉ referee mới có thể xem danh sách này" });
    }
    const connectedManagers = await storage.getConnectedManagers(user.id);
    res.json(connectedManagers);
  });

  // Kết nối với Manager
  app.post("/api/connect-manager/:managerId", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "referee") {
      return res.status(403).json({ message: "Chỉ referee mới có thể kết nối" });
    }
    const managerId = parseInt(req.params.managerId);
    const manager = await storage.getUser(managerId);
    if (!manager || manager.role !== "manager") {
      return res.status(404).json({ message: "Không tìm thấy Manager" });
    }
    const alreadyConnected = await storage.isConnected(user.id, managerId);
    if (alreadyConnected) {
      return res.status(400).json({ message: "Đã kết nối với Manager này" });
    }
    await storage.connectRefereeToManager(user.id, managerId);
    res.json({ message: "Kết nối thành công", manager });
  });

  // Hủy kết nối với Manager
  app.delete("/api/disconnect-manager/:managerId", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "referee") {
      return res.status(403).json({ message: "Chỉ referee mới có thể hủy kết nối" });
    }
    const managerId = parseInt(req.params.managerId);
    await storage.disconnectRefereeFromManager(user.id, managerId);
    res.json({ message: "Hủy kết nối thành công" });
  });

  // Lấy trận đấu từ Managers đã kết nối
  app.get("/api/matches/connected-managers", async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "referee") {
      return res.status(403).json({ message: "Chỉ referee mới có thể xem" });
    }
    const matches = await storage.getMatchesFromConnectedManagers(user.id);
    res.json(matches);
  });

  // === CHAT API ===

  // Gửi tin nhắn (Manager và Referee đã kết nối mới gửi được)
  app.post("/api/chat", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { message } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Tin nhắn không được để trống" });
    }

    // Kiểm tra quyền: Admin, Manager hoặc Referee đã kết nối mới gửi được
    if (user.role === "admin" || user.role === "manager") {
      // Admin và Manager luôn có thể gửi tin nhắn
    } else if (user.role === "referee") {
      const connectedManagers = await storage.getConnectedManagers(user.id);
      if (connectedManagers.length === 0) {
        return res.status(403).json({ message: "Bạn chưa kết nối với Manager nào" });
      }
    } else {
      return res.status(403).json({ message: "Không có quyền gửi tin nhắn" });
    }

    const chat = await storage.sendChat(user.id, message.trim());

    // Tạo thôngbáo cho người nhận
    const senderName = user.fullName || user.username;
    const notificationMessage = message.trim().slice(0, 100) + (message.trim().length > 100 ? "..." : "");

    if (user.role === "admin" || user.role === "manager") {
      // Gửi thông báo cho tất cả referee đã kết nối
      const connectedReferees = await storage.getConnectedReferees(user.id);
      for (const referee of connectedReferees) {
        await storage.createNotification({
          userId: referee.id,
          type: "chat",
          title: `Tin nhắn mới từ ${senderName}`,
          message: notificationMessage,
          link: "/chat",
          data: { chatId: chat.id, senderId: user.id },
        });
      }
    } else {
      // Gửi thông báo cho tất cả manager đã kết nối
      const connectedManagers = await storage.getConnectedManagers(user.id);
      for (const manager of connectedManagers) {
        await storage.createNotification({
          userId: manager.id,
          type: "chat",
          title: `Tin nhắn mới từ ${senderName}`,
          message: notificationMessage,
          link: "/chat",
          data: { chatId: chat.id, senderId: user.id },
        });
      }
    }

    res.json(chat);
  });

  // Lấy danh sách tin nhắn (Manager và Referee đã kết nối mới xem được)
  app.get("/api/chat", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Kiểm tra quyền
    if (user.role === "referee") {
      const connectedManagers = await storage.getConnectedManagers(user.id);
      if (connectedManagers.length === 0) {
        return res.status(403).json({ message: "Bạn chưa kết nối với Manager nào" });
      }
    }

    const chats = await storage.getChatsWithSender();
    const chatsWithSenderInfo = chats.map((chat) => ({
      id: chat.id,
      senderId: chat.senderId,
      senderName: chat.sender.fullName || chat.sender.username,
      senderRole: chat.sender.role,
      message: chat.message,
      createdAt: chat.createdAt,
    }));
    res.json(chatsWithSenderInfo);
  });

  // Kiểm tra user có kết nối với manager nào không (dùng cho BottomNav)
  app.get("/api/chat/has-connection", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ hasConnection: false });
    }

    if (user.role === "manager") {
      return res.json({ hasConnection: true });
    }

    const connectedManagers = await storage.getConnectedManagers(user.id);
    res.json({ hasConnection: connectedManagers.length > 0 });
  });

  // === NOTIFICATION APIs ===

  // Lấy danh sách thông báo của user
  app.get("/api/notifications", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const notifications = await storage.getNotifications(user.id, limit);
    res.json(notifications);
  });

  // Lấy số lượng thông báo chưa đọc
  app.get("/api/notifications/unread-count", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const count = await storage.getUnreadNotificationCount(user.id);
    res.json({ count });
  });

  // Đánh dấu một thông báo đã đọc
  app.patch("/api/notifications/:id/read", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const id = parseInt(req.params.id as string);
    await storage.markNotificationAsRead(id);
    res.json({ message: "Đã đánh dấu đã đọc" });
  });

  // Đánh dấu tất cả thông báo đã đọc
  app.post("/api/notifications/mark-all-read", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    await storage.markAllNotificationsAsRead(user.id);
    res.json({ message: "Đã đánh dấu tất cả đã đọc" });
  });

  // Xóa một thông báo
  app.delete("/api/notifications/:id", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const id = parseInt(req.params.id as string);
    await storage.deleteNotification(id);
    res.json({ message: "Đã xóa thông báo" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
