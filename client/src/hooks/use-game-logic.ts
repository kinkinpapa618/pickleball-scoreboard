// hooks/use-game-logic.ts
import { useState, useCallback } from "react";

type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2;
  positions: Record<string, "left" | "right">;
  winner: null | 1 | 2;
  gameHistory: any[];
};

export function useGameLogic(
  winningScore: number,
  initialServer: 1 | 2,
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  const [state, setState] = useState<GameState>(() => ({
    score1: 0,
    score2: 0,
    serverTeam: initialServer,
    serverHand: 1,
    positions: {
      t1p1: "left",
      t2p1: "right",
      t1p2: "left",
      t2p2: "right",
    },
    winner: null,
    gameHistory: [],
  }));

  const scorePoint = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const history = [...prev.gameHistory, { ...prev }];
      const isTeam1Serving = prev.serverTeam === 1;
      const scoringTeam = isTeam1Serving ? 1 : 2;
      const newScore1 = scoringTeam === 1 ? prev.score1 + 1 : prev.score1;
      const newScore2 = scoringTeam === 2 ? prev.score2 + 1 : prev.score2;

      // Kiểm tra chiến thắng
      const winner =
        newScore1 >= winningScore && newScore1 - newScore2 >= 2
          ? 1
          : newScore2 >= winningScore && newScore2 - newScore1 >= 2
          ? 2
          : null;

      // Tính toán lượt giao tiếp theo
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newPositions = { ...prev.positions };

      if (winner) {
        return {
          ...prev,
          score1: newScore1,
          score2: newScore2,
          winner,
          gameHistory: history,
        };
      }

      // Nếu đội phát thắng điểm, giữ quyền giao và đổi tay giao
      if (scoringTeam === prev.serverTeam) {
        // Đội phát thắng điểm, giữ quyền giao, đổi tay giao
        newServerHand = (prev.serverHand === 1 ? 2 : 1) as 1 | 2;

        // Nếu đổi từ tay giao 1 sang 2 hoặc ngược lại, đổi vị trí của 2 người trong đội phát
        const teamPrefix = `t${prev.serverTeam}`;
        const p1 = `${teamPrefix}p1`;
        const p2 = `${teamPrefix}p2`;

        newPositions = {
          ...newPositions,
          [p1]: newPositions[p1] === "left" ? "right" : "left",
          [p2]: newPositions[p2] === "left" ? "right" : "left",
        };
      } else {
        // Đội phát thua điểm, đổi quyền giao
        newServerTeam = (prev.serverTeam === 1 ? 2 : 1) as 1 | 2;
        newServerHand = 1;

        // Khi đổi quyền giao, cũng đổi vị trí của 2 người trong đội mới phát
        const newTeamPrefix = `t${newServerTeam}`;
        const p1 = `${newTeamPrefix}p1`;
        const p2 = `${newTeamPrefix}p2`;

        newPositions = {
          ...newPositions,
          [p1]: newPositions[p1] === "left" ? "right" : "left",
          [p2]: newPositions[p2] === "left" ? "right" : "left",
        };
      }

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
        positions: newPositions,
        winner,
        gameHistory: history,
      };
    });
  }, [winningScore]);

  const fault = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const history = [...prev.gameHistory, { ...prev }];
      const newServerTeam = (prev.serverTeam === 1 ? 2 : 1) as 1 | 2;

      // Khi đổi giao bóng, đổi vị trí của 2 người trong đội mới phát
      const newTeamPrefix = `t${newServerTeam}`;
      const p1 = `${newTeamPrefix}p1`;
      const p2 = `${newTeamPrefix}p2`;

      const newPositions = {
        ...prev.positions,
        [p1]: prev.positions[p1] === "left" ? "right" : "left",
        [p2]: prev.positions[p2] === "left" ? "right" : "left",
      };

      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: 1,
        positions: newPositions,
        gameHistory: history,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.gameHistory.length === 0) return prev;
      const lastState = prev.gameHistory[prev.gameHistory.length - 1];
      return {
        ...lastState,
        gameHistory: prev.gameHistory.slice(0, -1),
      };
    });
  }, []);

  const getMatchData = useCallback(() => {
    return {
      team1Score: state.score1,
      team2Score: state.score2,
      winner: state.winner,
      date: new Date().toISOString(),
      players: names,
    };
  }, [state.score1, state.score2, state.winner, names]);

  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
  };
}