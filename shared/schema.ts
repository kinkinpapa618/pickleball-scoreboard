import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
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
  phone: text("phone").notNull(), // Thêm trường này
  idCard: text("id_card").notNull(), // Thêm trường này
});

// Quyền hạn (Dùng để logic check ở Frontend/Backend)
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

// === 2. PLAYERS DEFINITIONS ===
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

  // Liên kết trọng tài (Referee) điều khiển trận đấu
  refereeId: integer("referee_id").references(() => users.id),

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
  id: true, // Thường ID tự tăng nên omit khi insert
});

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
