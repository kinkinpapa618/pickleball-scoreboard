import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  totalMatches: integer("total_matches").default(0),
  wins: integer("wins").default(0),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  team1Player1: text("team1_player1").notNull(),
  team1Player2: text("team1_player2").notNull(),
  team2Player1: text("team2_player1").notNull(),
  team2Player2: text("team2_player2").notNull(),

  scoreTeam1: integer("score_team1").notNull().default(0),
  scoreTeam2: integer("score_team2").notNull().default(0),

  // Trạng thái giao bóng cho Livestream
  isServer1: boolean("is_server1").default(false).notNull(),
  isServer2: boolean("is_server2").default(false).notNull(),
  serverNumber: integer("server_number").default(1).notNull(), // 1 hoặc 2

  winningScore: integer("winning_score").notNull(),
  winnerTeam: integer("winner_team"),

  date: timestamp("date").defaultNow(),
});

// === SCHEMAS ===
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, totalMatches: true, wins: true });
// Lưu ý: Cho phép insertMatchSchema bao gồm cả trạng thái giao bóng
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, date: true });

// === TYPES ===
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Request types
export type CreatePlayerRequest = InsertPlayer;
export type CreateMatchRequest = InsertMatch;