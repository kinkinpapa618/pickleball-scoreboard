import {
  users,
  matches,
  workSchedules,
  players,
  tournaments,
  tournamentPlayers,
  tournamentMatches,
  settings,
  courts,
  type User,
  type InsertUser,
  type Match,
  type InsertMatch,
  type WorkSchedule,
  type InsertWorkSchedule,
  type Role,
  type Tournament,
  type InsertTournament,
  type TournamentPlayer,
  type InsertTournamentPlayer,
  type TournamentMatch,
  type InsertTournamentMatch,
  type Setting,
  type InsertSetting,
  type Court,
  type InsertCourt,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { nanoid } from "nanoid";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByManagerId(managerId: number): Promise<User[]>; // Lấy user do manager tạo
  updateUser(id: number, data: Partial<User>): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;

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

  // Tournament methods
  getTournaments(creatorId?: number): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament>;
  deleteTournament(id: number): Promise<void>;

  // Tournament Player methods
  getTournamentPlayers(tournamentId: number): Promise<TournamentPlayer[]>;
  createTournamentPlayer(player: InsertTournamentPlayer): Promise<TournamentPlayer>;
  createTournamentPlayers(players: InsertTournamentPlayer[]): Promise<TournamentPlayer[]>;
  deleteTournamentPlayers(tournamentId: number): Promise<void>;

  // Tournament Match methods
  getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]>;
  getTournamentMatch(id: number): Promise<TournamentMatch | undefined>;
  getTournamentMatchByToken(token: string): Promise<TournamentMatch | undefined>;
  getMatchAccessLink(matchId: number): Promise<{ link: string; token: string } | null>;
  createTournamentMatch(match: InsertTournamentMatch): Promise<TournamentMatch>;
  createTournamentMatches(matches: InsertTournamentMatch[]): Promise<TournamentMatch[]>;
  deleteTournamentMatches(tournamentId: number): Promise<void>;
  updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch>;
  assignRefereeToMatch(matchId: number, refereeId: number): Promise<TournamentMatch>;

  // Court methods
  getCourts(): Promise<Court[]>;
  getCourt(id: number): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: number, data: Partial<Court>): Promise<Court>;
  deleteCourt(id: number): Promise<void>;

  // Settings methods
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<Setting>;

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

  async getUsersByManagerId(managerId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.managerId, managerId));
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

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
    const result = await db.insert(matches).values(insertMatch).returning();
    const [match] = result;
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

  // --- TOURNAMENT METHODS ---
  async getTournaments(creatorId?: number): Promise<Tournament[]> {
    if (creatorId) {
      return db
        .select()
        .from(tournaments)
        .where(eq(tournaments.creatorId, creatorId))
        .orderBy(tournaments.createdAt);
    }
    return db.select().from(tournaments).orderBy(tournaments.createdAt);
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db
      .insert(tournaments)
      .values(insertTournament)
      .returning();
    return tournament;
  }

  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament> {
    const [updated] = await db
      .update(tournaments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tournaments.id, id))
      .returning();
    return updated;
  }

  async deleteTournament(id: number): Promise<void> {
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // --- TOURNAMENT PLAYER METHODS ---
  async getTournamentPlayers(tournamentId: number): Promise<TournamentPlayer[]> {
    return db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId))
      .orderBy(tournamentPlayers.seed);
  }

  async createTournamentPlayer(player: InsertTournamentPlayer): Promise<TournamentPlayer> {
    const [newPlayer] = await db
      .insert(tournamentPlayers)
      .values(player)
      .returning();
    return newPlayer;
  }

  async createTournamentPlayers(players: InsertTournamentPlayer[]): Promise<TournamentPlayer[]> {
    const newPlayers = await db
      .insert(tournamentPlayers)
      .values(players)
      .returning();
    return newPlayers;
  }

  async deleteTournamentPlayers(tournamentId: number): Promise<void> {
    await db
      .delete(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId));
  }

  async deleteTournamentMatches(tournamentId: number): Promise<void> {
    await db
      .delete(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, tournamentId));
  }

  // --- TOURNAMENT MATCH METHODS ---
  async getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]> {
    return db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, tournamentId))
      .orderBy(tournamentMatches.groupName, tournamentMatches.matchOrder);
  }

  async getTournamentMatch(id: number): Promise<TournamentMatch | undefined> {
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, id));
    return match;
  }

  async getTournamentMatchByToken(token: string): Promise<TournamentMatch | undefined> {
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.refereeToken, token));
    return match;
  }

  async getMatchAccessLink(matchId: number): Promise<{ link: string; token: string } | null> {
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, matchId));
    
    if (!match || !match.refereeToken) {
      return null;
    }
    
    return {
      link: `/trong-tai/${match.refereeToken}`,
      token: match.refereeToken
    };
  }

  async createTournamentMatch(match: InsertTournamentMatch): Promise<TournamentMatch> {
    const [newMatch] = await db
      .insert(tournamentMatches)
      .values(match)
      .returning();
    return newMatch;
  }

  async createTournamentMatches(matches: InsertTournamentMatch[]): Promise<TournamentMatch[]> {
    const newMatches = await db
      .insert(tournamentMatches)
      .values(matches)
      .returning();
    return newMatches;
  }

  async updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch> {
    const [updated] = await db
      .update(tournamentMatches)
      .set(data)
      .where(eq(tournamentMatches.id, id))
      .returning();
    return updated;
  }

  async assignRefereeToMatch(matchId: number, refereeId: number): Promise<TournamentMatch> {
    const token = `trongtai_${nanoid(16)}`;
    const [updated] = await db
      .update(tournamentMatches)
      .set({ refereeId, status: "scheduled", refereeToken: token })
      .where(eq(tournamentMatches.id, matchId))
      .returning();
    return updated;
  }

  // --- SETTINGS METHODS ---
  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string, description?: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, description, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  // --- COURT METHODS ---
  async getCourts(): Promise<Court[]> {
    return db.select().from(courts).orderBy(courts.name);
  }

  async getCourt(id: number): Promise<Court | undefined> {
    const [court] = await db.select().from(courts).where(eq(courts.id, id));
    return court;
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const [court] = await db.insert(courts).values(insertCourt).returning();
    return court;
  }

  async updateCourt(id: number, data: Partial<Court>): Promise<Court> {
    const [court] = await db
      .update(courts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courts.id, id))
      .returning();
    return court;
  }

  async deleteCourt(id: number): Promise<void> {
    await db.delete(courts).where(eq(courts.id, id));
  }
}

// CHỈ MỘT DÒNG DUY NHẤT Ở CUỐI FILE
export const storage = new DatabaseStorage();
