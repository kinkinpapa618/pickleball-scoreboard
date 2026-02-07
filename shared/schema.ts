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
  
  scoreTeam1: integer("score_team1").notNull(),
  scoreTeam2: integer("score_team2").notNull(),
  
  winningScore: integer("winning_score").notNull(),
  winnerTeam: integer("winner_team"),
  
  date: timestamp("date").defaultNow(),
});

// === SCHEMAS ===
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, totalMatches: true, wins: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, date: true });

// === TYPES ===
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Request types
export type CreatePlayerRequest = InsertPlayer;
export type CreateMatchRequest = InsertMatch;
