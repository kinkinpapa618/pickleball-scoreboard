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

  const isPowerOf2 = (n: number) => Math.log2(n) % 1 === 0;
  const isDivisibleBy4 = (n: number) => n % 4 === 0;

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
      reason: "Gợi ý: 3-6 đội (Đánh vòng tròn tốn khá nhiều thời gian)",
    });
    if (isDivisibleBy4(totalPairs)) {
      suggestions.push({
        format: "GROUP_KNOCKOUT",
        formatName: "Chia bảng + Loại trực tiếp",
        description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
        numGroups: Math.ceil(totalPairs / 4),
        reason: "Gợi ý: Số chia hết cho 4 để chia đều vào các bảng",
      });
    }
  } else if (isPowerOf2(totalPairs)) {
    suggestions.push({
      format: "ELIMINATION",
      formatName: "Loại trực tiếp (Knockout)",
      description: "Thua 1 trận là bị loại",
      numGroups: 1,
      reason: "Gợi ý: 4, 8, 16, 32... (Lũy thừa của 2 để sơ đồ đẹp nhất)",
    });
    if (totalPairs >= 8) {
      suggestions.push({
        format: "GROUP_KNOCKOUT",
        formatName: "Chia bảng + Loại trực tiếp",
        description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
        numGroups: Math.min(4, Math.ceil(totalPairs / 4)),
        reason: "Kết hợp công bằng vòng bảng và kịch tính knockout",
      });
    }
  } else if (isDivisibleBy4(totalPairs) || totalPairs > 16) {
    suggestions.push({
      format: "GROUP_KNOCKOUT",
      formatName: "Chia bảng + Loại trực tiếp",
      description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
      numGroups: Math.max(2, Math.ceil(totalPairs / 4)),
      reason: "Gợi ý: 8, 12, 16... (Số chia hết cho 4 để chia đều vào các bảng)",
    });
    if (isPowerOf2(totalPairs) || totalPairs >= 16) {
      suggestions.push({
        format: "ELIMINATION",
        formatName: "Loại trực tiếp (Knockout)",
        description: "Thua 1 trận là bị loại",
        numGroups: 1,
        reason: "Nhanh - gọn - kịch tính, tiết kiệm thời gian",
      });
    }
  } else {
    suggestions.push({
      format: "GROUP_KNOCKOUT",
      formatName: "Chia bảng + Loại trực tiếp",
      description: "Chia bảng vòng tròn, Top vào vòng loại trực tiếp",
      numGroups: Math.ceil(totalPairs / 4),
      reason: "Số đội không phải lũy thừa của 2, chia bảng phù hợp nhất",
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
  if (numGroups <= 0) return [];
  if (players.length === 0) return Array.from({ length: numGroups }, () => []);

  const playersPerGroup = Math.ceil(players.length / numGroups);

  const seededPlayers = players
    .map((p, idx) => ({ player: p, originalIndex: idx, seed: p.seed ?? Infinity }))
    .sort((a, b) => a.seed - b.seed);

  const unseeded = seededPlayers.filter(p => p.seed === Infinity);
  const seeded = seededPlayers.filter(p => p.seed !== Infinity);

  const groups: T[][] = Array.from({ length: numGroups }, () => []);

  seeded.forEach((item, idx) => {
    const groupIdx = idx % numGroups;
    groups[groupIdx].push(item.player);
  });

  const groupCapacities = groups.map((_, idx) => {
    const base = Math.floor(players.length / numGroups);
    const remainder = players.length % numGroups;
    return base + (idx < remainder ? 1 : 0);
  });

  const currentCounts = groups.map(g => g.length);
  let groupIdx = 0;

  for (const item of unseeded) {
    while (currentCounts[groupIdx] >= groupCapacities[groupIdx]) {
      groupIdx = (groupIdx + 1) % numGroups;
    }
    groups[groupIdx].push(item.player);
    currentCounts[groupIdx]++;
    groupIdx = (groupIdx + 1) % numGroups;
  }

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
