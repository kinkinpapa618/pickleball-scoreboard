// ============================================
// TOURNAMENT BRACKET - Advanced Bracket System
// ============================================

export type BracketType = "ELIMINATION_8" | "ELIMINATION_16" | "ELIMINATION_32" | "CUSTOM";

export interface BracketPlayer {
  id: string;
  name: string;
  seed?: number;        // Hạt giống (1 = hạt giống số 1)
  isEliminated?: boolean;
  isWinner?: boolean;
}

export interface BracketMatch {
  id: string;
  round: number;           // Vòng: 1 = Vòng 1, 2 = Tứ kết, 3 = Bán kết, 4 = Chung kết
  roundName: string;       // Tên vòng
  matchNumber: number;     // Số thứ tự trận trong vòng
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  winner: BracketPlayer | null;
  score1?: number;
  score2?: number;
  status: "pending" | "playing" | "finished" | "bye";
  nextMatchId?: string;     // ID trận đấu tiếp theo (người thắng vào đây)
  nextMatchPosition?: "player1" | "player2"; // Vị trí trong trận tiếp theo
  court?: number;
  scheduledTime?: string;
  group?: string;
}

export interface BracketRound {
  round: number;
  roundName: string;
  matches: BracketMatch[];
}

export interface BracketData {
  type: BracketType;
  rounds: BracketRound[];
  champion?: BracketPlayer;
  runnerUp?: BracketPlayer;
  createdAt: Date;
}

// Tạo ID trận đấu
function generateMatchId(round: number, matchNumber: number): string {
  return `match-${round}-${matchNumber}`;
}

// Lấy tên vòng theo số lượng
function getRoundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round + 1;
  switch (remaining) {
    case 1: return "Chung kết";
    case 2: return "Bán kết";
    case 3: return "Tứ kết";
    case 4: return "Vòng 1/16";
    case 5: return "Vòng 1/32";
    default: return `Vòng ${round}`;
  }
}

// ============================================
// TẠO BRACKET TỪ DANH SÁCH NGƯỜI CHƠI
// ============================================
export function createBracket(players: BracketPlayer[]): BracketData {
  // Sắp xếp theo hạt giống
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.seed && b.seed) return a.seed - b.seed;
    if (a.seed) return -1;
    if (b.seed) return 1;
    return 0;
  });

  // Xác định kích thước bracket (8, 16, 32)
  const playerCount = sortedPlayers.length;
  let bracketSize: number;
  
  if (playerCount <= 8) bracketSize = 8;
  else if (playerCount <= 16) bracketSize = 16;
  else bracketSize = 32;

  const totalRounds = Math.log2(bracketSize);
  const rounds: BracketRound[] = [];

  // Tạo các vòng đấu
  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    const roundMatches: BracketMatch[] = [];

    for (let m = 0; m < matchesInRound; m++) {
      const matchId = generateMatchId(r, m);
      
      // Xác định người chơi cho vòng 1
      let player1: BracketPlayer | null = null;
      let player2: BracketPlayer | null = null;
      let status: BracketMatch["status"] = "pending";

      if (r === 1) {
        // Vòng 1: Gán người chơi theo thứ tự seed
        // Seed 1 vs Seed 8, Seed 4 vs Seed 5, Seed 3 vs Seed 6, Seed 2 vs Seed 7 (cho 8 người)
        const seedOrder8 = [0, 7, 3, 4, 2, 5, 1, 6]; // Vị trí theo seed
        const seedOrder16 = [0, 15, 7, 8, 3, 12, 4, 13, 1, 14, 6, 9, 2, 11, 5, 10];
        
        const order = bracketSize === 8 ? seedOrder8 : (bracketSize === 16 ? seedOrder16 : null);
        
        const idx1 = order ? order[m * 2] : m * 2;
        const idx2 = order ? order[m * 2 + 1] : m * 2 + 1;

        player1 = sortedPlayers[idx1] || null;
        player2 = sortedPlayers[idx2] || null;

        // Kiểm tra BYE
        if (!player1 || !player2) {
          status = "bye";
        } else if (player1.seed === 1 || player2.seed === bracketSize) {
          // Seed 1 vs Last seed = BYE
          status = "bye";
        }
      }

      // Xác định trận tiếp theo
      let nextMatchId: string | undefined;
      let nextMatchPosition: "player1" | "player2" | undefined;

      if (r < totalRounds) {
        nextMatchId = generateMatchId(r + 1, Math.floor(m / 2));
        nextMatchPosition = m % 2 === 0 ? "player1" : "player2";
      }

      roundMatches.push({
        id: matchId,
        round: r,
        roundName: getRoundName(r, totalRounds),
        matchNumber: m,
        player1,
        player2,
        winner: status === "bye" ? (player1 ? player1 : player2) : null,
        status: status === "bye" ? "finished" : status,
        nextMatchId,
        nextMatchPosition,
      });
    }

    rounds.push({
      round: r,
      roundName: getRoundName(r, totalRounds),
      matches: roundMatches,
    });
  }

  return {
    type: bracketSize === 8 ? "ELIMINATION_8" : bracketSize === 16 ? "ELIMINATION_16" : "ELIMINATION_32",
    rounds,
    createdAt: new Date(),
  };
}

// ============================================
// CẬP NHẬT KẾT QUẢ TRẬN ĐẤU
// ============================================
export function updateBracketMatch(
  bracket: BracketData,
  matchId: string,
  winner: BracketPlayer,
  score1: number,
  score2: number
): BracketData {
  const newRounds = bracket.rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => {
      if (match.id === matchId) {
        // Cập nhật trận đấu hiện tại
        return {
          ...match,
          winner,
          score1,
          score2,
          status: "finished" as const,
        };
      }
      return match;
    }),
  }));

  // Tìm trận vừa cập nhật và cập nhật trận tiếp theo
  let updatedBracket = { ...bracket, rounds: newRounds };
  
  for (const round of newRounds) {
    for (const match of round.matches) {
      if (match.id === matchId && match.nextMatchId) {
        updatedBracket = advanceWinnerToNextMatch(updatedBracket, match);
      }
    }
  }

  // Kiểm tra nếu là chung kết, cập nhật champion
  const finalRound = updatedBracket.rounds[updatedBracket.rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  
  if (finalMatch?.winner) {
    updatedBracket.champion = finalMatch.winner;
    updatedBracket.runnerUp = finalMatch.winner.id === finalMatch.player1?.id 
      ? finalMatch.player2 ?? undefined
      : finalMatch.player1 ?? undefined;
  }

  return updatedBracket;
}

// Di chuyển người thắng vào trận tiếp theo
function advanceWinnerToNextMatch(bracket: BracketData, match: BracketMatch): BracketData {
  if (!match.nextMatchId || !match.winner) return bracket;

  const newRounds = bracket.rounds.map(round => ({
    ...round,
    matches: round.matches.map(m => {
      if (m.id === match.nextMatchId) {
        if (match.nextMatchPosition === "player1") {
          return { ...m, player1: match.winner };
        } else {
          return { ...m, player2: match.winner };
        }
      }
      return m;
    }),
  }));

  return { ...bracket, rounds: newRounds };
}

// ============================================
// TÍNH TOÁN TIẾN ĐỘ GIẢI ĐẤU
// ============================================
export interface BracketProgress {
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  playingMatches: number;
  progressPercentage: number;
  currentRound: number;
  currentRoundName: string;
  rounds: {
    round: number;
    roundName: string;
    totalMatches: number;
    completedMatches: number;
    progressPercentage: number;
  }[];
}

export function calculateBracketProgress(bracket: BracketData): BracketProgress {
  let totalMatches = 0;
  let completedMatches = 0;
  let pendingMatches = 0;
  let playingMatches = 0;
  let currentRound = 1;

  const roundProgress = bracket.rounds.map(round => {
    const roundTotal = round.matches.length;
    const roundCompleted = round.matches.filter(m => m.status === "finished").length;
    const roundPlaying = round.matches.filter(m => m.status === "playing").length;
    const roundPending = round.matches.filter(m => m.status === "pending").length;

    totalMatches += roundTotal;
    completedMatches += roundCompleted;
    pendingMatches += roundPending;
    playingMatches += roundPlaying;

    if (roundCompleted > 0 && roundCompleted < roundTotal) {
      currentRound = round.round;
    }

    return {
      round: round.round,
      roundName: round.roundName,
      totalMatches: roundTotal,
      completedMatches: roundCompleted,
      progressPercentage: roundTotal > 0 ? Math.round((roundCompleted / roundTotal) * 100) : 0,
    };
  });

  // Tìm vòng hiện tại (vòng có trận đang đánh hoặc chưa hoàn thành)
  for (let i = 0; i < roundProgress.length; i++) {
    if (roundProgress[i].completedMatches < roundProgress[i].totalMatches) {
      currentRound = roundProgress[i].round;
      break;
    }
  }

  return {
    totalMatches,
    completedMatches,
    pendingMatches,
    playingMatches,
    progressPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
    currentRound,
    currentRoundName: bracket.rounds[currentRound - 1]?.roundName || "",
    rounds: roundProgress,
  };
}

// ============================================
// LẤY TRẬN ĐẤU TIẾP THEO
// ============================================
export function getNextPendingMatch(bracket: BracketData): BracketMatch | null {
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.status === "pending" && match.player1 && match.player2) {
        return match;
      }
    }
  }
  return null;
}

// ============================================
// KIỂM TRA GIẢI ĐẤU HOÀN THÀNH
// ============================================
export function isBracketComplete(bracket: BracketData): boolean {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  return finalRound?.matches[0]?.status === "finished" || false;
}

// ============================================
// EXPORT BRACKET DATA
// ============================================
export function exportBracketToJSON(bracket: BracketData): string {
  return JSON.stringify({
    ...bracket,
    progress: calculateBracketProgress(bracket),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
