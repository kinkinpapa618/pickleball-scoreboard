import {
  users,
  matches,
  workSchedules,
  players,
  type User,
  type InsertUser,
  type Match,
  type InsertMatch,
  type WorkSchedule,
  type InsertWorkSchedule,
  type Role,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  createUser(user: InsertUser): Promise<User>;

  // Player methods
  getPlayers(): Promise<any[]>;
  createPlayer(data: any): Promise<any>;

  // Match methods
  getMatches(): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByReferee(refereeId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, data: Partial<Match>): Promise<Match>;

  // Work Schedule methods
  getWorkSchedules(refereeId?: number): Promise<WorkSchedule[]>;
  getWorkScheduleById(id: number): Promise<WorkSchedule | undefined>;
  createWorkSchedule(schedule: InsertWorkSchedule): Promise<WorkSchedule>;
  updateWorkSchedule(id: number, data: Partial<WorkSchedule>): Promise<WorkSchedule>;
  deleteWorkSchedule(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // --- USER METHODS ---
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = {
      ...insertUser,
      role: insertUser.role as Role,
    };
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // --- PLAYER METHODS ---
  async getPlayers() {
    return db.select().from(players);
  }

  async createPlayer(data: any) {
    const [player] = await db.insert(players).values(data).returning();
    return player;
  }

  // --- MATCH METHODS ---
  async getMatches() {
    return db.select().from(matches).orderBy(matches.date);
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchesByReferee(refereeId: number): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(eq(matches.refereeId, refereeId))
      .orderBy(matches.date);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    const [updatedMatch] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  // --- WORK SCHEDULE METHODS ---
  async getWorkSchedules(refereeId?: number): Promise<WorkSchedule[]> {
    if (refereeId) {
      return db
        .select()
        .from(workSchedules)
        .where(eq(workSchedules.refereeId, refereeId))
        .orderBy(workSchedules.date);
    }
    return db.select().from(workSchedules).orderBy(workSchedules.date);
  }

  async getWorkScheduleById(id: number): Promise<WorkSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(workSchedules)
      .where(eq(workSchedules.id, id));
    return schedule;
  }

  async createWorkSchedule(
    insertSchedule: InsertWorkSchedule
  ): Promise<WorkSchedule> {
    const [schedule] = await db
      .insert(workSchedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateWorkSchedule(
    id: number,
    data: Partial<WorkSchedule>
  ): Promise<WorkSchedule> {
    const [updated] = await db
      .update(workSchedules)
      .set(data)
      .where(eq(workSchedules.id, id))
      .returning();
    return updated;
  }

  async deleteWorkSchedule(id: number): Promise<void> {
    await db.delete(workSchedules).where(eq(workSchedules.id, id));
  }
}

// CHỈ MỘT DÒNG DUY NHẤT Ở CUỐI FILE
export const storage = new DatabaseStorage();
