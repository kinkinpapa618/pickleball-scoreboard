// Thuật toán xoay vòng (Round Robin)
export function generateRoundRobin(players: string[]) {
  if (players.length % 2 !== 0) {
    players.push("Bye");
  }

  const matches: { home: string; away: string; status: "pending" | "completed" }[] = [];
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
    playerPool.splice(1, 0, playerPool.pop()!);
  }
  return matches;
}

export function generateGroups(players: string[], teamsPerGroup: number = 4) {
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const groups: Record<string, { name: string; players: string[]; matches: any[] }> = {};
  const groupNames = ["A", "B", "C", "D", "E", "F"];

  for (let i = 0; i < shuffled.length; i++) {
    const groupIndex = Math.floor(i / teamsPerGroup);
    const groupName = groupNames[groupIndex];

    if (!groups[groupName]) {
      groups[groupName] = { name: groupName, players: [], matches: [] };
    }
    groups[groupName].players.push(shuffled[i]);
  }

  Object.keys(groups).forEach((key) => {
    const groupPlayers = groups[key].players;
    const pairs: string[] = [];
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        pairs.push(`${groupPlayers[i]} vs ${groupPlayers[j]}`);
      }
    }
    groups[key].matches = pairs.map((pair) => {
      const [home, away] = pair.split(" vs ");
      return { home, away, status: "pending" as const };
    });
  });

  return groups;
}
