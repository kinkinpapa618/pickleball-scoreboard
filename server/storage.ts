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
  getMatch(id: number): Promise<Match | undefined>; // Bổ sung lấy 1 trận đấu
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match>; // Bổ sung cập nhật
}

export class DatabaseStorage implements IStorage {
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .onConflictDoUpdate({
        target: players.name,
        set: { name: insertPlayer.name }
      })
      .returning();
    return player;
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.date));
  }

  // Bổ sung: Lấy chi tiết trận đấu cho trang MatchView
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id));
    return match;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  // Bổ sung: Cập nhật điểm số và lượt giao bóng realtime
  async updateMatch(id: number, updateData: Partial<InsertMatch>): Promise<Match> {
    const [updatedMatch] = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, id))
      .returning();

    if (!updatedMatch) {
      throw new Error(`Không tìm thấy trận đấu với ID ${id}`);
    }

    return updatedMatch;
  }
}

export const storage = new DatabaseStorage();
