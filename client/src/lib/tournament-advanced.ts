// Loại thể thức giải đấu
export type TournamentFormat = "ELIMINATION" | "ROUND_ROBIN" | "GROUP_KNOCKOUT";

export interface Player {
  id: string;
  name: string;
  group?: string;
  seed?: number;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  round: number;
  roundName: string;
  group?: string;
  winner?: Player;
  status: "pending" | "playing" | "finished";
  score1?: number;
  score2?: number;
}

export interface Group {
  name: string;
  players: Player[];
  matches: Match[];
  standings: Standing[];
}

export interface Standing {
  player: Player;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  points: number;
}

// Xáo trộn mảng (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Tạo ID duy nhất
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================
// 1. LOẠI TRỰC TIẾP (ELIMINATION)
// ============================================
export function generateElimination(players: Player[]): { rounds: Match[][]; allMatches: Match[] } {
  const shuffledPlayers = shuffle(players);
  const numPlayers = shuffledPlayers.length;
  
  // Tính số lượng người chơi cần cho power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  const byes = nextPowerOf2 - numPlayers;
  
  // Điều chỉnh danh sách: người chơi thật + BYE
  const adjustedPlayers = [...shuffledPlayers];
  for (let i = 0; i < byes; i++) {
    adjustedPlayers.push({ id: "BYE", name: "BYE" });
  }

  const totalRounds = Math.log2(nextPowerOf2);
  const rounds: Match[][] = [];
  let matchId = 0;

  // Vòng 1: Tạo các cặp đấu đầu tiên
  const firstRound: Match[] = [];
  for (let i = 0; i < adjustedPlayers.length; i += 2) {
    const player1 = adjustedPlayers[i];
    const player2 = adjustedPlayers[i + 1];
    
    let match: Match;
    // Nếu gặp BYE, người chơi thắng tự động
    if (player2.name === "BYE") {
      match = {
        id: `EL-${matchId++}`,
        player1,
        player2,
        round: 1,
        roundName: "Vòng 1",
        winner: player1,
        status: "finished",
        score1: 0,
        score2: 0,
      };
    } else {
      match = {
        id: `EL-${matchId++}`,
        player1,
        player2,
        round: 1,
        roundName: "Vòng 1",
        status: "pending",
      };
    }
    firstRound.push(match);
  }
  rounds.push(firstRound);

  // Các vòng tiếp theo
  for (let r = 2; r <= totalRounds; r++) {
    const previousRound = rounds[r - 2];
    const currentRound: Match[] = [];
    
    for (let i = 0; i < previousRound.length; i += 2) {
      const match: Match = {
        id: `EL-${matchId++}`,
        player1: { id: `W${r}-${i}`, name: "Chờ đối thủ" },
        player2: { id: `W${r}-${i+1}`, name: "Chờ đối thủ" },
        round: r,
        roundName: `Vòng ${r}`,
        status: "pending",
      };
      currentRound.push(match);
    }
    rounds.push(currentRound);
  }

  // Tất cả trận đấu (flatten)
  const allMatches = rounds.flat();

  return { rounds, allMatches };
}

// Cập nhật trận đấu khi có kết quả (Elimination)
export function updateEliminationMatch(
  rounds: Match[][],
  matchId: string,
  winner: Player,
  score1: number,
  score2: number
): { rounds: Match[][]; allMatches: Match[] } {
  const newRounds = rounds.map(round => round.map(match => {
    if (match.id === matchId) {
      return { ...match, winner, status: "finished" as const, score1, score2 };
    }
    return match;
  }));

  // Tìm vòng của trận đấu vừa cập nhật
  let matchRound = 0;
  let matchIndex = 0;
  for (let r = 0; r < newRounds.length; r++) {
    const idx = newRounds[r].findIndex(m => m.id === matchId);
    if (idx !== -1) {
      matchRound = r;
      matchIndex = idx;
      break;
    }
  }

  // Cập nhật trận đấu vòng tiếp theo
  if (matchRound < newRounds.length - 1) {
    const nextRoundMatchIndex = Math.floor(matchIndex / 2);
    const nextRound = newRounds[matchRound + 1].map((match, idx) => {
      if (idx === nextRoundMatchIndex) {
        const isPlayer1Slot = matchIndex % 2 === 0;
        return {
          ...match,
          player1: isPlayer1Slot ? winner : match.player1,
          player2: isPlayer1Slot ? match.player2 : winner,
          status: "pending" as const,
        };
      }
      return match;
    });
    newRounds[matchRound + 1] = nextRound;
  }

  return { rounds: newRounds, allMatches: newRounds.flat() };
}

// ============================================
// 2. VÒNG TRÒN (ROUND ROBIN)
// ============================================
export function generateRoundRobin(players: Player[]): { matches: Match[]; standings: Standing[] } {
  let adjustedPlayers = [...players];
  
  // Thêm BYE nếu số lượng lẻ
  if (adjustedPlayers.length % 2 !== 0) {
    adjustedPlayers.push({ id: "BYE", name: "BYE" });
  }

  const numPlayers = adjustedPlayers.length;
  const rounds = numPlayers - 1;
  const half = numPlayers / 2;
  const matches: Match[] = [];
  let matchId = 0;

  const playerPool = [...adjustedPlayers];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const player1 = playerPool[i];
      const player2 = playerPool[numPlayers - 1 - i];

      if (player1.name !== "BYE" && player2.name !== "BYE") {
        matches.push({
          id: `RR-${matchId++}`,
          player1,
          player2,
          round: round + 1,
          roundName: `Vòng ${round + 1}`,
          status: "pending",
        });
      }
    }
    // Xoay vòng
    playerPool.splice(1, 0, playerPool.pop()!);
  }

  // Tính bảng xếp hạng
  const standings = calculateStandings(matches, adjustedPlayers);

  return { matches, standings };
}

function calculateStandings(matches: Match[], players: Player[]): Standing[] {
  const standingsMap = new Map<string, Standing>();

  // Khởi tạo standings cho tất cả người chơi
  players.forEach(player => {
    if (player.name !== "BYE") {
      standingsMap.set(player.id, {
        player,
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDiff: 0,
        points: 0,
      });
    }
  });

  // Cập nhật từ các trận đấu đã hoàn thành
  matches.forEach(match => {
    if (match.status === "finished" && match.winner) {
      const p1Standing = standingsMap.get(match.player1.id);
      const p2Standing = standingsMap.get(match.player2.id);

      if (p1Standing && p2Standing) {
        const score1 = match.score1 || 0;
        const score2 = match.score2 || 0;

        // Cập nhật cho người thắng
        if (match.winner.id === match.player1.id) {
          p1Standing.won++;
          p2Standing.lost++;
          p1Standing.points += 3;
        } else {
          p2Standing.won++;
          p1Standing.lost++;
          p2Standing.points += 3;
        }

        p1Standing.played++;
        p2Standing.played++;
        p1Standing.pointsFor += score1;
        p1Standing.pointsAgainst += score2;
        p2Standing.pointsFor += score2;
        p2Standing.pointsAgainst += score1;
        p1Standing.pointDiff = p1Standing.pointsFor - p1Standing.pointsAgainst;
        p2Standing.pointDiff = p2Standing.pointsFor - p2Standing.pointsAgainst;
      }
    }
  });

  return Array.from(standingsMap.values()).sort((a, b) => {
    // Sắp xếp theo điểm, rồi đến hiệu số
    if (b.points !== a.points) return b.points - a.points;
    return b.pointDiff - a.pointDiff;
  });
}

// Cập nhật kết quả trận đấu round robin
export function updateRoundRobinMatch(
  matches: Match[],
  matchId: string,
  winner: Player,
  score1: number,
  score2: number
): { matches: Match[]; standings: Standing[] } {
  const newMatches = matches.map(match => {
    if (match.id === matchId) {
      return { ...match, winner, status: "finished" as const, score1, score2 };
    }
    return match;
  });

  const allPlayers = newMatches.flatMap(m => [m.player1, m.player2]);
  const uniquePlayers = Array.from(new Set(allPlayers.map(p => p.id))).map(id => allPlayers.find(p => p.id === id)!);
  const standings = calculateStandings(newMatches, uniquePlayers);

  return { matches: newMatches, standings };
}

// ============================================
// 3. CHIA BẢNG + KNOCKOUT (GROUP STAGE + KO)
// ============================================
export function generateGroupKnockout(
  players: Player[],
  numGroups: number
): {
  groups: Group[];
  knockoutMatches: Match[];
  roundNames: string[];
} {
  const shuffledPlayers = shuffle(players);
  const playersPerGroup = Math.ceil(shuffledPlayers.length / numGroups);

  // Tạo các bảng
  const groups: Group[] = [];
  const groupNames = "ABCDEFGHIJKLMNOP".split("");

  for (let i = 0; i < numGroups; i++) {
    const groupName = `Bảng ${groupNames[i]}`;
    const startIdx = i * playersPerGroup;
    const endIdx = Math.min(startIdx + playersPerGroup, shuffledPlayers.length);
    const groupPlayers = shuffledPlayers.slice(startIdx, endIdx);

    // Tạo lịch round robin cho bảng
    const { matches, standings } = generateRoundRobin(groupPlayers);

    groups.push({
      name: groupName,
      players: groupPlayers,
      matches,
      standings,
    });
  }

  // Xác định số đội vào knockout (top 2 mỗi bảng hoặc tùy chỉnh)
  const teamsPerGroup = 2;
  const knockoutPlayers: Player[] = [];
  
  groups.forEach(group => {
    const topPlayers = group.standings.slice(0, teamsPerGroup).map(s => s.player);
    knockoutPlayers.push(...topPlayers);
  });

  // Tạo trận knockout
  const knockoutMatches: Match[] = [];
  let matchId = 0;
  
  // Sắp xếp: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2...
  const shuffledKoPlayers = shuffle(knockoutPlayers);
  
  // Tạo cặp knockout (giả định 4, 8, 16 đội)
  const koSize = Math.pow(2, Math.floor(Math.log2(shuffledKoPlayers.length)));
  const actualPlayers = shuffledKoPlayers.slice(0, koSize);

  for (let i = 0; i < actualPlayers.length; i += 2) {
    knockoutMatches.push({
      id: `KO-${matchId++}`,
      player1: actualPlayers[i],
      player2: actualPlayers[i + 1] || { id: "BYE", name: "BYE" },
      round: 1,
      roundName: "Tứ kết",
      status: actualPlayers[i + 1] ? "pending" : "finished",
      winner: actualPlayers[i + 1] ? undefined : actualPlayers[i],
    });
  }

  return { groups, knockoutMatches, roundNames: ["Tứ kết", "Bán kết", "Chung kết"] };
}

// ============================================
// TẠO GIẢI ĐẤU THEO THỂ THỨC
// ============================================
export interface TournamentData {
  format: TournamentFormat;
  players: Player[];
  // Round Robin
  rrMatches?: Match[];
  rrStandings?: Standing[];
  // Elimination
  eliminationRounds?: Match[][];
  eliminationMatches?: Match[];
  // Group + Knockout
  groups?: Group[];
  knockoutMatches?: Match[];
  knockoutRoundNames?: string[];
  // Cấu hình
  numGroups?: number;
}

export function generateTournament(
  players: Player[],
  format: TournamentFormat,
  numGroups?: number
): TournamentData {
  if (players.length === 0) {
    throw new Error("Danh sách người chơi không được rỗng");
  }

  if (format === "GROUP_KNOCKOUT") {
    if (!numGroups || numGroups < 2) {
      numGroups = Math.min(4, Math.ceil(players.length / 4));
    }
    if (numGroups > players.length) {
      throw new Error("Số bảng không được lớn hơn số người chơi");
    }
  }

  const baseData: TournamentData = {
    format,
    players,
  };

  switch (format) {
    case "ROUND_ROBIN": {
      if (players.length < 2) {
        throw new Error("Round Robin cần ít nhất 2 người chơi");
      }
      const { matches, standings } = generateRoundRobin(players);
      return { ...baseData, rrMatches: matches, rrStandings: standings };
    }

    case "ELIMINATION": {
      if (players.length < 2) {
        throw new Error("Elimination cần ít nhất 2 người chơi");
      }
      const { rounds, allMatches } = generateElimination(players);
      return { ...baseData, eliminationRounds: rounds, eliminationMatches: allMatches };
    }

    case "GROUP_KNOCKOUT": {
      if (players.length < 4) {
        throw new Error("Group + Knockout cần ít nhất 4 người chơi");
      }
      const { groups, knockoutMatches, roundNames } = generateGroupKnockout(players, numGroups!);
      return { ...baseData, groups, knockoutMatches, knockoutRoundNames: roundNames, numGroups };
    }

    default:
      return baseData;
  }
}
