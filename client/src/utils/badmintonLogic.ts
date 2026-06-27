/**
 * Badminton Game Logic Engine — BWF Standard Rules
 *
 * Supports: Singles, Doubles, Mixed Doubles
 * Scoring: Rally Point System (21 pts, win by 2, cap at 30; or 15 pts mode)
 * Best Of: 3 or 5 games
 */

export type MatchType = "singles" | "doubles" | "mixed";

export interface BadmintonGameState {
  // Match settings
  type: MatchType;
  bestOf: 3 | 5;
  winningPoints: 21 | 15;

  // Match state
  status: "pending" | "live" | "completed";
  currentGame: number;
  gamesWonTeam1: number;
  gamesWonTeam2: number;
  winnerTeam: 1 | 2 | null;
  gameScores: Array<[number, number]>; // [t1, t2] per finished game

  // Current game live scores
  currentScoreTeam1: number;
  currentScoreTeam2: number;

  // Service state
  servingTeam: 1 | 2;
  /**
   * For doubles/mixed: which player position is serving within the team
   *   1 = right-court player (the one who should serve)
   *   2 = left-court player
   * For singles: always 1 (position determined by score)
   */
  servingPlayer: 1 | 2;

  /**
   * Doubles court position tracking.
   * Tracks if players have been swapped from initial positions this game.
   * Reset at the start of each game.
   *
   * When a team WINS a rally while serving, their players swap courts.
   * When serve transfers to a team, the player in the RIGHT court serves — no swap.
   */
  team1Swapped: boolean;
  team2Swapped: boolean;

  /**
   * Court ends (for game 3+ end-switching at half of winning points)
   * team1Side: which side of the court team 1 is on
   */
  team1Side: "left" | "right";
  endsChanged: boolean;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Returns the service court (left/right) for the CURRENT server in singles.
 * Even score → right court. Odd score → left court.
 */
export function getSinglesServiceCourt(serverScore: number): "right" | "left" {
  return serverScore % 2 === 0 ? "right" : "left";
}

/**
 * Checks if the current game is over given the scores.
 */
export function isGameOver(
  score1: number,
  score2: number,
  winningPoints: number
): boolean {
  const maxScore = Math.max(score1, score2);
  const diff = Math.abs(score1 - score2);

  // Reached winning points and ahead by 2 → game over
  if (maxScore >= winningPoints && diff >= 2) return true;

  // Sudden death cap (30 in 21-pt mode, 20 in 15-pt mode)
  const cap = winningPoints + 9; // 21→30, 15→24 (BWF uses +9 for 21 mode, but for 15 mode we keep ratio)
  const actualCap = winningPoints === 21 ? 30 : 24; // 15-pt mode: sudden death at 24
  if (maxScore >= actualCap) return true;

  return false;
}

/**
 * Checks if the match is over.
 */
export function isMatchOver(
  gamesWon1: number,
  gamesWon2: number,
  bestOf: number
): boolean {
  const needed = Math.ceil(bestOf / 2);
  return gamesWon1 >= needed || gamesWon2 >= needed;
}

/**
 * At 11 points (half of 21) or 8 points (half of 15) in the deciding game,
 * players switch ends.
 */
export function shouldSwitchEnds(
  currentGame: number,
  gamesNeeded: number,
  scoreTeam1: number,
  scoreTeam2: number,
  winningPoints: number,
  endsChanged: boolean
): boolean {
  if (endsChanged) return false;
  const isDecidingGame = currentGame === gamesNeeded * 2 - 1; // game 3 in BO3, game 5 in BO5
  if (!isDecidingGame) return false;
  const switchPoint = Math.floor(winningPoints / 2) + (winningPoints === 21 ? 0 : 0); // 10 for 21-pt, 8 for 15-pt? BWF says 11 in 21, we use floor(21/2)=10? Actually BWF: at 11 in 3rd game switch.
  // BWF exact rule: "When the leading score reaches 11 points" in a third game
  const actualSwitchPoint = winningPoints === 21 ? 11 : 8;
  const leadingScore = Math.max(scoreTeam1, scoreTeam2);
  return leadingScore >= actualSwitchPoint;
}

// ─────────────────────────────────────────────
// CORE RALLY PROCESSOR
// ─────────────────────────────────────────────

/**
 * Processes a single rally result and returns the updated game state.
 * This is the heart of the game logic engine.
 */
export function processRally(
  state: BadmintonGameState,
  rallyWinner: 1 | 2
): BadmintonGameState {
  const next = deepClone(state);
  const isServingTeamWon = rallyWinner === next.servingTeam;

  // 1. Award point to rally winner
  if (rallyWinner === 1) {
    next.currentScoreTeam1 += 1;
  } else {
    next.currentScoreTeam2 += 1;
  }

  // 2. Update service
  if (isServingTeamWon) {
    // Serving team won: same team serves again
    // In doubles/mixed: serving players swap courts within their team
    if (next.type !== "singles") {
      if (next.servingTeam === 1) {
        next.team1Swapped = !next.team1Swapped;
        // servingPlayer stays the same conceptually — it's the same person
        // but their position flips. We track who is in right court via team1Swapped.
        next.servingPlayer = next.team1Swapped ? 2 : 1;
      } else {
        next.team2Swapped = !next.team2Swapped;
        next.servingPlayer = next.team2Swapped ? 2 : 1;
      }
    }
  } else {
    // Receiving team won: service transfers
    const newServingTeam: 1 | 2 = next.servingTeam === 1 ? 2 : 1;
    next.servingTeam = newServingTeam;
    // Receiving team does NOT swap positions
    // The player in the RIGHT court of the new serving team serves
    // Right court = not swapped = servingPlayer 1
    // Left court = swapped = servingPlayer 2
    // After service transfer, no swap occurs, so the one in right court serves
    if (next.type !== "singles") {
      const isSwapped = newServingTeam === 1 ? next.team1Swapped : next.team2Swapped;
      next.servingPlayer = isSwapped ? 2 : 1;
    }
  }

  // 3. Check game over
  if (
    isGameOver(next.currentScoreTeam1, next.currentScoreTeam2, next.winningPoints)
  ) {
    // Record game result
    next.gameScores.push([next.currentScoreTeam1, next.currentScoreTeam2]);

    if (next.currentScoreTeam1 > next.currentScoreTeam2) {
      next.gamesWonTeam1 += 1;
    } else {
      next.gamesWonTeam2 += 1;
    }

    // Check match over
    if (isMatchOver(next.gamesWonTeam1, next.gamesWonTeam2, next.bestOf)) {
      next.status = "completed";
      next.winnerTeam =
        next.gamesWonTeam1 > next.gamesWonTeam2 ? 1 : 2;
    } else {
      // Start new game
      next.currentGame += 1;
      next.currentScoreTeam1 = 0;
      next.currentScoreTeam2 = 0;
      next.team1Swapped = false;
      next.team2Swapped = false;
      next.endsChanged = false;
      // The team that won the previous game serves first in the next game
      next.servingTeam = rallyWinner;
      next.servingPlayer = 1;
    }
  } else {
    // 4. Check end-switching in deciding game
    const gamesNeeded = Math.ceil(next.bestOf / 2);
    if (
      shouldSwitchEnds(
        next.currentGame,
        gamesNeeded,
        next.currentScoreTeam1,
        next.currentScoreTeam2,
        next.winningPoints,
        next.endsChanged
      )
    ) {
      // Swap sides
      next.team1Side = next.team1Side === "left" ? "right" : "left";
      next.endsChanged = true;
    }
  }

  return next;
}

// ─────────────────────────────────────────────
// INITIAL STATE FACTORY
// ─────────────────────────────────────────────

export interface CreateMatchOptions {
  type: MatchType;
  bestOf: 3 | 5;
  winningPoints: 21 | 15;
  firstServingTeam: 1 | 2;
}

export function createInitialState(opts: CreateMatchOptions): BadmintonGameState {
  return {
    type: opts.type,
    bestOf: opts.bestOf,
    winningPoints: opts.winningPoints,
    status: "live",
    currentGame: 1,
    gamesWonTeam1: 0,
    gamesWonTeam2: 0,
    winnerTeam: null,
    gameScores: [],
    currentScoreTeam1: 0,
    currentScoreTeam2: 0,
    servingTeam: opts.firstServingTeam,
    servingPlayer: 1,
    team1Swapped: false,
    team2Swapped: false,
    team1Side: "left",
    endsChanged: false,
  };
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────

/**
 * Returns which player name is currently serving, for UI display.
 */
export function getServerName(
  state: BadmintonGameState,
  team1p1: string,
  team1p2: string,
  team2p1: string,
  team2p2: string
): string {
  if (state.type === "singles") {
    return state.servingTeam === 1 ? team1p1 : team2p1;
  }

  // Doubles/mixed: determine which player is serving based on swap state
  const isTeam1Serving = state.servingTeam === 1;
  if (isTeam1Serving) {
    // If not swapped: p1 is on right (serves). If swapped: p2 is on right (serves).
    const isSwapped = state.team1Swapped;
    // servingPlayer 1 = right court (original p1 if not swapped, p2 if swapped)
    if (state.servingPlayer === 1) return isSwapped ? team1p2 : team1p1;
    return isSwapped ? team1p1 : team1p2;
  } else {
    const isSwapped = state.team2Swapped;
    if (state.servingPlayer === 1) return isSwapped ? team2p2 : team2p1;
    return isSwapped ? team2p1 : team2p2;
  }
}

/**
 * Returns a label for the current service court position (for singles).
 */
export function getSinglesCourtLabel(state: BadmintonGameState): "right" | "left" {
  const serverScore =
    state.servingTeam === 1 ? state.currentScoreTeam1 : state.currentScoreTeam2;
  return getSinglesServiceCourt(serverScore);
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Converts a DB BadmintonMatch record to BadmintonGameState.
 */
export function dbToGameState(match: any): BadmintonGameState {
  return {
    type: match.type as MatchType,
    bestOf: match.bestOf as 3 | 5,
    winningPoints: match.winningPoints as 21 | 15,
    status: match.status,
    currentGame: match.currentGame,
    gamesWonTeam1: match.gamesWonTeam1,
    gamesWonTeam2: match.gamesWonTeam2,
    winnerTeam: match.winnerTeam ?? null,
    gameScores: (match.gameScores as Array<[number, number]>) ?? [],
    currentScoreTeam1: match.currentScoreTeam1,
    currentScoreTeam2: match.currentScoreTeam2,
    servingTeam: match.servingTeam as 1 | 2,
    servingPlayer: match.servingPlayer as 1 | 2,
    team1Swapped: match.team1Swapped,
    team2Swapped: match.team2Swapped,
    team1Side: match.team1Side as "left" | "right",
    endsChanged: match.endsChanged,
  };
}
