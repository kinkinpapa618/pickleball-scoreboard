// Thuật toán xoay vòng (Round Robin)
export function generateRoundRobin(players: string[]) {
  if (players.length % 2 !== 0) {
    players.push("Bye"); // Thêm người chơi ảo nếu số lượng lẻ
  }

  const matches = [];
  const numPlayers = players.length;
  const rounds = numPlayers - 1;
  const half = numPlayers / 2;

  const playerPool = [...players];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = playerPool[i];
      const away = playerPool[numPlayers - 1 - i];
      if (home !== "Bye" && away !== "Bye") {
        matches.push({ home, away, status: "pending" as const });
      }
    }
    // Xoay vòng mảng (giữ phần tử đầu cố định)
    playerPool.splice(1, 0, playerPool.pop()!);
  }
  return matches;
}
export function generateGroups(players: string[], teamsPerGroup: number = 4) {
  // 1. Xáo trộn danh sách (Fisher-Yates Shuffle)
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const groups: Record<string, any> = {};
  const groupNames = ["A", "B", "C", "D", "E", "F"];

  // 2. Chia đội vào các bảng
  for (let i = 0; i < shuffled.length; i++) {
    const groupIndex = Math.floor(i / teamsPerGroup);
    const groupName = groupNames[groupIndex];

    if (!groups[groupName]) {
      groups[groupName] = { name: groupName, players: [], matches: [] };
    }
    groups[groupName].players.push(shuffled[i]);
  }

  // 3. Tạo lịch thi đấu cho từng bảng bằng thuật toán Round Robin
  Object.keys(groups).forEach((key) => {
    groups[key].matches = generateRoundRobin(groups[key].players);
  });

  return groups;
}
