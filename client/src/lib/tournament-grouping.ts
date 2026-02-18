export type TournamentFormat = "ROUND_ROBIN" | "ELIMINATION" | "GROUP_KNOCKOUT";

export interface GroupSuggestion {
  format: TournamentFormat;
  formatName: string;
  description: string;
  numGroups: number;
  reason: string;
}

export interface SeedDistribution {
  players: {
    name: string;
    seed: number;
    level?: string;
    category?: string;
  }[];
  groups: {
    name: string;
    players: number[];
    seeds: number[];
  }[];
}

export function suggestGroupingMethod(totalPairs: number): GroupSuggestion[] {
  const suggestions: GroupSuggestion[] = [];

  if (totalPairs <= 2) {
    suggestions.push({
      format: "ROUND_ROBIN",
      formatName: "Vòng tròn (Round Robin)",
      description: "Mỗi cặp đấu với tất cả các cặp còn lại",
      numGroups: 1,
      reason: "Phù hợp với ít cặp (2 cặp)",
    });
  } else if (totalPairs <= 6) {
    suggestions.push({
      format: "ROUND_ROBIN",
      formatName: "Vòng tròn (Round Robin)",
      description: "Mỗi cặp đấu với tất cả các cặp còn lại",
      numGroups: 1,
      reason: "Phù hợp với 3-6 cặp - ai cũng được thi đấu nhiều",
    });
    suggestions.push({
      format: "GROUP_KNOCKOUT",
      formatName: "Chia bảng + Loại trực tiếp",
      description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
      numGroups: 2,
      reason: "Kết hợp công bằng và kịch tính",
    });
  } else if (totalPairs <= 16) {
    suggestions.push({
      format: "GROUP_KNOCKOUT",
      formatName: "Chia bảng + Loại trực tiếp",
      description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
      numGroups: Math.ceil(totalPairs / 4),
      reason: "Mô hình chuẩn của giải lớn - công bằng & kịch tính",
    });
    suggestions.push({
      format: "ELIMINATION",
      formatName: "Loại trực tiếp (Knockout)",
      description: "Thua 1 trận là bị loại",
      numGroups: 1,
      reason: "Nhanh - gọn - kịch tính, tiết kiệm thời gian",
    });
  } else {
    suggestions.push({
      format: "GROUP_KNOCKOUT",
      formatName: "Chia bảng + Loại trực tiếp",
      description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
      numGroups: Math.ceil(totalPairs / 4),
      reason: "Giải quyết nhiều cặp, có tính công bằng cao",
    });
  }

  return suggestions;
}

export function calculateOptimalGroups(totalPairs: number): number {
  if (totalPairs <= 6) return 1;
  if (totalPairs <= 8) return 2;
  if (totalPairs <= 16) return 4;
  if (totalPairs <= 32) return 8;
  return Math.ceil(totalPairs / 4);
}

export function distributeSeedsEvenly<T extends { seed?: number }>(
  players: T[],
  numGroups: number
): T[][] {
  const seededPlayers = players
    .map((p, idx) => ({ ...p, originalIndex: idx }))
    .filter(p => p.seed !== undefined && p.seed > 0)
    .sort((a, b) => a.seed! - b.seed!);

  const unseededPlayers = players
    .map((p, idx) => ({ ...p, originalIndex: idx }))
    .filter(p => !p.seed || p.seed <= 0);

  const groups: T[][] = Array.from({ length: numGroups }, () => []);

  seededPlayers.forEach((player, idx) => {
    const groupIdx = idx % numGroups;
    groups[groupIdx].push(players[player.originalIndex] as T);
  });

  let currentGroup = 0;
  unseededPlayers.forEach((player) => {
    while (groups[currentGroup].length >= Math.ceil(players.length / numGroups)) {
      currentGroup = (currentGroup + 1) % numGroups;
    }
    groups[currentGroup].push(players[player.originalIndex] as T);
    currentGroup = (currentGroup + 1) % numGroups;
  });

  return groups;
}

export function generateGroupNames(count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < 26) {
      names.push(String.fromCharCode(65 + i));
    } else {
      names.push(`A${i - 25}`);
    }
  }
  return names;
}

export interface CategoryGroup {
  category: string;
  players: {
    name: string;
    seed?: number;
    level?: string;
  }[];
  totalPairs: number;
  suggestedFormat: GroupSuggestion;
}

export function groupByCategory(
  players: {
    player1?: string;
    player2?: string;
    category?: string;
    seed?: number;
    level1?: string;
    level2?: string;
  }[]
): CategoryGroup[] {
  const categoryMap = new Map<string, CategoryGroup>();

  players.forEach((p) => {
    const category = p.category || "Chung";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        players: [],
        totalPairs: 0,
        suggestedFormat: suggestGroupingMethod(0)[0],
      });
    }

    const group = categoryMap.get(category)!;
    if (p.player1 || p.player2) {
      group.players.push({
        name: `${p.player1 || ""}${p.player1 && p.player2 ? " / " : ""}${p.player2 || ""}`.trim(),
        seed: p.seed,
        level: p.level1 || p.level2,
      });
      group.totalPairs++;
    }
  });

  categoryMap.forEach((group) => {
    const suggestions = suggestGroupingMethod(group.totalPairs);
    group.suggestedFormat = suggestions[0];
  });

  return Array.from(categoryMap.values());
}
