import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  json,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === 1. USER & ROLES DEFINITIONS ===
export const roles = ["admin", "manager", "referee"] as const;
export type Role = (typeof roles)[number];

export const roleEnum = pgEnum("role", ["admin", "manager", "referee"]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("referee"),
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  totalMatches: integer("total_matches").default(0),
  wins: integer("wins").default(0),
  // Có thể thêm: rank: text("rank").default("Amateur"),
});

// === 3. MATCHES DEFINITIONS ===
export const matches = pgTable("matches", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
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

  // Loại trận đấu: Đơn (singles) hoặc Đôi (doubles)
  type: text("type").notNull().default("doubles"),

  // Quản lý trạng thái
  status: text("status").notNull().default("live"), // 'pending', 'live', 'finished'
  winningScore: integer("winning_score").notNull().default(15),
  winnerTeam: integer("winner_team"), // 1 hoặc 2

  // Timeline events (JSON)
  timeline: json("timeline"), // JSON of timeline events
  timeouts: json("timeouts"), // JSON: { team1: 2, team2: 2 }
  stacking: json("stacking"), // JSON: { "t1p1": "left", "t1p2": "right" }
  penalties: json("penalties"), // JSON: { t1p1: { yellow: 0, red: false }, ... }

  // Thời gian bắt đầu trận đấu (khi status = 'live')
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),

  // Lượt phát đầu tiên của trận (để hiển thị số 2)
  isFirstServeOfMatch: boolean("is_first_serve_of_match"),

  // Liên kết trọng tài (Referee) điều khiển trận đấu
  refereeId: integer("referee_id").references(() => users.id),
  
  // Người tạo trận đấu (Manager)
  creatorId: integer("creator_id").references(() => users.id),

  date: timestamp("date").defaultNow(),
  tournamentName: text("tournament_name"),
  matchCode: text("match_code"),
  theme: text("theme").default("default"),
  showTournament: boolean("show_tournament").default(true),
  showMatchCode: boolean("show_match_code").default(true),
  mode: text("mode").default("bo1").notNull(),
  sets: json("sets"),
  gamesWonTeam1: integer("games_won_team1").default(0).notNull(),
  gamesWonTeam2: integer("games_won_team2").default(0).notNull(),
  livestream: boolean("livestream").default(false).notNull(),
  vmixConfig: json("vmix_config"),
  timeoutActive: boolean("timeout_active").default(false).notNull(),
  timeoutTeam: integer("timeout_team"),
  timeoutEndTime: timestamp("timeout_end_time"),
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  teamsPerGroup: integer("teams_per_group").default(4),
  winningScore: integer("winning_score").default(15),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'completed', 'cancelled'
  
  // Thông tin giải đấu mới
  level: text("level"), // JSON array: ["4.0", "4.5"]
  content: json("content"), // Map level -> nội dung: {"4.0": ["don_nam", "doi_nam"]}
  date: date("date"),
  time: time("time"),
  location: text("location"),
  backdrop: text("backdrop"), // Base64 encoded backdrop image
  
  // Người tạo giải đấu
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentPlayers = pgTable("tournament_players", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  name: text("name").notNull(),
  groupName: text("group_name"), // A, B, C, D...
  seed: integer("seed"), // Thứ tự seed
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournamentMatches = pgTable("tournament_matches", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
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

// TYPES
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type InsertTournamentPlayer = z.infer<typeof insertTournamentPlayerSchema>;

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;

// === SETTINGS ===
export const settings = pgTable("settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
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

// === 9. GROUPS (Nhóm của Manager) ===
export const groups = pgTable("groups", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

// === 10. GROUP MEMBERS (Thành viên nhóm) ===
export const groupMembers = pgTable("group_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // 'member', 'admin'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

// === 11. CHAT MESSAGES (Chat trong Group) ===
export const chats = pgTable("chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("group_id").references(() => groups.id),
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

// === 12. NOTIFICATIONS ===
export const notificationTypes = ["chat", "match", "tournament", "schedule", "system"] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationTypeEnum = pgEnum("notification_type", ["chat", "match", "tournament", "schedule", "system"]);

export const notifications = pgTable("notifications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// === 13. SESSION ===
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// === 14. BADMINTON MATCHES ===
export const badmintonMatches = pgTable("badminton_matches", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Players
  team1Player1: text("team1_player1").notNull(),
  team1Player2: text("team1_player2").notNull().default(""), // empty for singles
  team2Player1: text("team2_player1").notNull(),
  team2Player2: text("team2_player2").notNull().default(""), // empty for singles

  // Match settings
  type: text("type").notNull().default("doubles"), // 'singles' | 'doubles' | 'mixed'
  bestOf: integer("best_of").notNull().default(3),            // 3 or 5
  winningPoints: integer("winning_points").notNull().default(21), // 21 or 15

  // Match state
  status: text("status").notNull().default("pending"), // 'pending' | 'live' | 'completed'
  currentGame: integer("current_game").notNull().default(1), // 1, 2, 3 (or 5)
  gamesWonTeam1: integer("games_won_team1").notNull().default(0),
  gamesWonTeam2: integer("games_won_team2").notNull().default(0),
  winnerTeam: integer("winner_team"), // 1 or 2

  // Per-game scores (stored as JSON for flexibility: [t1, t2])
  gameScores: json("game_scores").notNull().default([]), // Array of [t1Score, t2Score] per game

  // Current game live scores
  currentScoreTeam1: integer("current_score_team1").notNull().default(0),
  currentScoreTeam2: integer("current_score_team2").notNull().default(0),

  // Service state
  servingTeam: integer("serving_team").notNull().default(1),    // 1 or 2
  servingPlayer: integer("serving_player").notNull().default(1), // 1 (right/first) or 2 (left/second) within the serving team

  // Doubles court position tracking
  // true = players have been swapped from their original positions
  team1Swapped: boolean("team1_swapped").notNull().default(false),
  team2Swapped: boolean("team2_swapped").notNull().default(false),

  // Court side for game 3 end-switching
  team1Side: text("team1_side").notNull().default("left"), // 'left' | 'right'
  endsChanged: boolean("ends_changed").notNull().default(false), // switched at 15pts in game 3

  // Full match state history for undo (JSON array of snapshots)
  stateHistory: json("state_history").notNull().default([]),

  // Timeline for match events
  timeline: json("timeline").notNull().default([]),

  // Relations
  refereeId: integer("referee_id").references(() => users.id),
  creatorId: integer("creator_id").references(() => users.id),

  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  date: timestamp("date").defaultNow(),
});

export const insertBadmintonMatchSchema = createInsertSchema(badmintonMatches).omit({
  id: true,
  date: true,
});

export const updateBadmintonMatchSchema = insertBadmintonMatchSchema.partial();

export type BadmintonMatch = typeof badmintonMatches.$inferSelect;
export type InsertBadmintonMatch = z.infer<typeof insertBadmintonMatchSchema>;
