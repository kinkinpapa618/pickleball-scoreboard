import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === 1. USER & ROLES DEFINITIONS ===
export const roles = ["admin", "manager", "referee"] as const;
export type Role = (typeof roles)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<Role>().notNull().default("referee"),
  fullName: text("full_name"),
  phone: text("phone").notNull(),
  idCard: text("id_card").notNull(),
  managerId: integer("manager_id"), // Manager tạo user này (đặt sau để tránh circular reference)
});

// Quyền hạn
export const ROLE_PERMISSIONS = {
  admin: ["all"],
  manager: [
    "manage_matches",
    "manage_referees",
    "view_reports",
    "draw_tournament",
  ],
  referee: ["standard_access", "update_scores", "view_assigned_matches"],
};

// === 2. WORK SCHEDULES (Lịch công tác) ===
export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  refereeId: integer("referee_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  matchId: integer("match_id").references(() => matches.id),
  date: timestamp("date").notNull(),
  location: text("location"),
  status: text("status").notNull().default("assigned"), // 'assigned', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
  createdAt: true,
});

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;

// === 3. PLAYERS DEFINITIONS ===
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  totalMatches: integer("total_matches").default(0),
  wins: integer("wins").default(0),
  // Có thể thêm: rank: text("rank").default("Amateur"),
});

// === 3. MATCHES DEFINITIONS ===
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  // Team 1
  team1Player1: text("team1_player1").notNull(),
  team1Player2: text("team1_player2").notNull(),
  // Team 2
  team2Player1: text("team2_player1").notNull(),
  team2Player2: text("team2_player2").notNull(),

  scoreTeam1: integer("score_team1").notNull().default(0),
  scoreTeam2: integer("score_team2").notNull().default(0),

  // Trạng thái giao bóng (Livestream chuyên nghiệp)
  isServer1: boolean("is_server1").default(false).notNull(),
  isServer2: boolean("is_server2").default(false).notNull(),
  serverNumber: integer("server_number").default(1).notNull(), // 1 hoặc 2

  // Quản lý trạng thái
  status: text("status").notNull().default("live"), // 'pending', 'live', 'finished'
  winningScore: integer("winning_score").notNull().default(11),
  winnerTeam: integer("winner_team"), // 1 hoặc 2

  // Timeline events (JSON)
  timeline: text("timeline"), // JSON string of timeline events
  timeouts: text("timeouts"), // JSON: { team1: 2, team2: 2 }
  stacking: text("stacking"), // JSON: { "t1p1": "left", "t1p2": "right" }
  penalties: text("penalties"), // JSON: { t1p1: { yellow: 0, red: false }, ... }

  // Thời gian bắt đầu trận đấu (khi status = 'live')
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),

  // Lượt phát đầu tiên của trận (để hiển thị số 2)
  isFirstServeOfMatch: boolean("is_first_serve_of_match"),

  // Liên kết trọng tài (Referee) điều khiển trận đấu
  refereeId: integer("referee_id").references(() => users.id),
  
   // Liên kết sân (Court) - trận đấu được tổ chức trên sân nào
  courtId: integer("court_id"), // Removed reference to avoid circular dependency

  // Người tạo trận đấu (Manager)
  creatorId: integer("creator_id").references(() => users.id),

  date: timestamp("date").defaultNow(),
});

// === 4. ZOD SCHEMAS (Để Validate Dữ liệu) ===

// User Schema
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    phone: z.string().min(10, "Số điện thoại không hợp lệ"),
    idCard: z.string().min(9, "Số Căn cước/CMND không hợp lệ"),
  });

// Player Schema
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  totalMatches: true,
  wins: true,
});

// Match Schema
export const insertMatchSchema = createInsertSchema(matches).omit({
  date: true,
  id: true,
});

// Update Match Schema - cho phép cập nhật tất cả các trường (bao gồm status)
export const updateMatchSchema = insertMatchSchema.partial();

// === 5. TYPES DEFINITIONS ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Helpers cho Tournament
export interface TournamentGroup {
  name: string;
  players: string[];
  matches: {
    home: string;
    away: string;
    status: "pending" | "completed";
  }[];
}

export type CreateMatchRequest = InsertMatch;

// === 6. TOURNAMENT DEFINITIONS ===
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamsPerGroup: integer("teams_per_group").default(4),
  winningScore: integer("winning_score").default(11),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'completed', 'cancelled'
  
  // Thông tin giải đấu mới
  level: text("level"), // JSON array: ["4.0", "4.5"]
  content: jsonb("content"), // Map level -> nội dung: {"4.0": ["don_nam", "doi_nam"]}
  date: date("date"),
  time: time("time"),
  location: text("location"),
  court: text("court"), // Tên sân mặc định
  
  // Người tạo giải đấu
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === 7. COURTS DEFINITIONS ===
export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // 'indoor', 'outdoor'
  status: text("status").notNull().default("free"), // 'free', 'busy', 'waiting'
  currentMatchId: integer("current_match_id"), // Removed reference to avoid circular dependency
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentPlayers = pgTable("tournament_players", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  name: text("name").notNull(),
  groupName: text("group_name"), // A, B, C, D...
  seed: integer("seed"), // Thứ tự seed
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournamentMatches = pgTable("tournament_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  
  // Liên kết với match thực tế (nếu đã tạo trận)
  matchId: integer("match_id").references(() => matches.id),
  
  // Thông tin trận đấu
  team1Player1: text("team1_player1").notNull(),
  team1Player2: text("team1_player2").notNull(),
  team2Player1: text("team2_player1").notNull(),
  team2Player2: text("team2_player2").notNull(),
  
  groupName: text("group_name"), // Bảng đấu
  round: integer("round"), // Vòng đấu
  matchOrder: integer("match_order"), // Thứ tự trong vòng
  
  status: text("status").notNull().default("pending"), // 'pending', 'scheduled', 'live', 'completed'
  
  // Referee được assign điều khiển trận
  refereeId: integer("referee_id").references(() => users.id),
  
  // Token để trọng tài truy cập trận đấu (link chia sẻ)
  refereeToken: text("referee_token"),
  
  // Court được assign cho trận đấu
  courtId: integer("court_id"),
  
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ZOD SCHEMAS
export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
  level: z.any(),
  content: z.any(),
});

export const insertTournamentPlayerSchema = createInsertSchema(tournamentPlayers).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentMatchSchema = createInsertSchema(tournamentMatches).omit({
  id: true,
  createdAt: true,
});

// === 8. COURTS ZOD SCHEMAS ===
export const insertCourtSchema = createInsertSchema(courts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["free", "busy", "waiting"]).default("free"),
});

export const updateCourtSchema = insertCourtSchema.partial();

// TYPES
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type InsertTournamentPlayer = z.infer<typeof insertTournamentPlayerSchema>;

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;

export type Court = typeof courts.$inferSelect;
export type InsertCourt = z.infer<typeof insertCourtSchema>;

// === SETTINGS ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// === 9. MANAGER CONNECTIONS (Referee theo dõi Manager) ===
export const managerConnections = pgTable("manager_connections", {
  id: serial("id").primaryKey(),
  refereeId: integer("referee_id").references(() => users.id).notNull(),
  managerId: integer("manager_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertManagerConnectionSchema = createInsertSchema(managerConnections).omit({
  id: true,
  createdAt: true,
});

export type ManagerConnection = typeof managerConnections.$inferSelect;
export type InsertManagerConnection = z.infer<typeof insertManagerConnectionSchema>;

// === 10. CHAT MESSAGES (Group chat giữa Manager và Referees) ===
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

// === 11. NOTIFICATIONS ===
export const notificationTypes = ["chat", "match", "tournament", "schedule", "system"] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").$type<NotificationType>().notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
