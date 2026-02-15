import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMatchSchema, 
  insertPlayerSchema, 
  insertWorkScheduleSchema,
  insertTournamentSchema,
  insertTournamentPlayerSchema,
  insertTournamentMatchSchema,
  insertMatchSchema as matchSchema,
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

  // 3. Lấy danh sách trận đấu (Lọc theo refereeId nếu không phải admin)
  app.get("/api/matches", async (req, res) => {
    const user = req.user as any;
    let matches;
    if (user && user.role === "admin") {
      matches = await storage.getMatches();
    } else if (user) {
      matches = await storage.getMatchesByReferee(user.id);
    } else {
      matches = await storage.getMatches();
    }
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

  // 5. Cập nhật trận đấu (Dành cho Livestream/Scoreboard)
  app.patch("/api/matches/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    // Kiểm tra quyền sở hữu
    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Không tìm thấy trận đấu" });
    }
    
    // Admin có thể sửa mọi trận, referee chỉ sửa được trận của mình
    if (user && user.role !== "admin" && match.refereeId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa trận đấu này" });
    }
    
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
    const user = req.user as any;
    const matchData = {
      ...result.data,
      refereeId: user?.id || null,
    };
    const match = await storage.createMatch(matchData);
    res.json(match);
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

  // 12. Lấy danh sách users (cho admin)
  app.get("/api/users", async (_, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // 13. Cập nhật thông tin user
  app.patch("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    try {
      const updated = await storage.updateUser(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // 14. Lấy thống kê trận đấu của referee
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

  // === TOURNAMENT APIs ===

  // 15. Lấy danh sách giải đấu (chỉ user tạo mới thấy được)
  app.get("/api/tournaments", async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    const tournaments = await storage.getTournaments(user.id);
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
    const result = insertTournamentSchema.safeParse(req.body);
    if (!result.success) {
      console.log("Validation error:", result.error.format());
      return res.status(400).json({ message: "Dữ liệu giải đấu không hợp lệ" });
    }

    const tournament = await storage.createTournament({
      ...result.data,
      creatorId: user.id,
    });
    res.json(tournament);
  });

  // 17. Lấy chi tiết giải đấu
  app.get("/api/tournaments/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    // Chỉ người tạo mới xem được
    if (user && tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem giải đấu này" });
    }

    const players = await storage.getTournamentPlayers(id);
    const matches = await storage.getTournamentMatches(id);
    
    res.json({ ...tournament, players, matches });
  });

  // 18. Cập nhật giải đấu
  app.patch("/api/tournaments/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    const result = insertTournamentSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ" });
    }

    const updated = await storage.updateTournament(id, result.data);
    res.json(updated);
  });

  // 19. Xóa giải đấu
  app.delete("/api/tournaments/:id", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    
    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa giải đấu này" });
    }

    await storage.deleteTournamentPlayers(id);
    await storage.deleteTournament(id);
    res.json({ message: "Xóa giải đấu thành công" });
  });

  // 20. Thêm danh sách VĐV vào giải đấu và tạo lịch đấu
  app.post("/api/tournaments/:id/generate", async (req, res) => {
    const id = parseInt(req.params.id as string);
    const user = req.user as any;
    const { players: playerNames, teamsPerGroup } = req.body;

    const tournament = await storage.getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    if (!playerNames || playerNames.length < 4) {
      return res.status(400).json({ message: "Cần tối thiểu 4 đội/người" });
    }

    // Xóa players cũ nếu có
    await storage.deleteTournamentPlayers(id);

    // Import hàm generateGroups từ shared
    const { generateGroups } = await import("@shared/tournament");
    const groups = generateGroups(playerNames, teamsPerGroup || 4);

    // Lưu players vào database
    const playersToInsert: any[] = [];
    let seed = 1;
    for (const [groupName, groupData] of Object.entries(groups) as any[]) {
      for (const player of groupData.players) {
        playersToInsert.push({
          tournamentId: id,
          name: player,
          groupName,
          seed: seed++,
        });
      }
    }
    const savedPlayers = await storage.createTournamentPlayers(playersToInsert);

    // Tạo tournament matches
    const matchesToInsert: any[] = [];
    let matchOrder = 1;
    for (const [groupName, groupData] of Object.entries(groups) as any[]) {
      const roundMatches = groupData.matches || [];
      for (const match of roundMatches) {
        const [home1, home2] = match.home.split(" vs ");
        const [away1, away2] = match.away.split(" vs ");
        
        matchesToInsert.push({
          tournamentId: id,
          team1Player1: home1,
          team1Player2: home2,
          team2Player1: away1,
          team2Player2: away2,
          groupName,
          round: 1,
          matchOrder: matchOrder++,
          status: "pending",
        });
      }
    }
    const savedMatches = await storage.createTournamentMatches(matchesToInsert);

    // Cập nhật status giải đấu
    await storage.updateTournament(id, { status: "active" });

    res.json({ 
      tournament: await storage.getTournament(id),
      players: savedPlayers, 
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

    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Không tìm thấy giải đấu" });
    }

    if (tournament.creatorId !== user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa giải đấu này" });
    }

    const updated = await storage.assignRefereeToMatch(matchId, refereeId);
    res.json(updated);
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

    if (tournament.creatorId !== user.id) {
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

  const httpServer = createServer(app);
  return httpServer;
}
