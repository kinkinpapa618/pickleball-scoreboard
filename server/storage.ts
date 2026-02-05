import { db } from "./db";
import {
  players,
  matches,
  type InsertPlayer,
  type InsertMatch,
  type Player,
  type Match
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  
  // Matches
  getMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
}

export class DatabaseStorage implements IStorage {
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    // Check if player exists to avoid unique constraint error if possible, 
    // though the DB will handle unique constraint.
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .onConflictDoUpdate({
        target: players.name,
        set: { name: insertPlayer.name } // No-op update to return existing
      })
      .returning();
    return player;
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.date));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
      
    // Update stats? (Optional, kept simple for now)
    
    return match;
  }
}

export const storage = new DatabaseStorage();
