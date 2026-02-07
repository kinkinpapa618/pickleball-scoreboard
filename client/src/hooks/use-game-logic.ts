import { useState, useCallback } from "react";
import { type InsertMatch } from "@shared/schema";

export type PlayerPosition = {
  id: string; // "t1p1" | "t1p2" | "t2p1" | "t2p2"
  name: string;
  side: "left" | "right"; // Current court side
  team: 1 | 2;
};

export type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2; // 1 = First server, 2 = Second server
  gameHistory: Array<{
    score1: number;
    score2: number;
    serverTeam: 1 | 2;
    serverHand: 1 | 2;
    positions: Record<string, "left" | "right">;
  }>;
  positions: Record<string, "left" | "right">; // Map player ID to side
  winner: 1 | 2 | null;
};

// Initial state helpers
const INITIAL_POSITIONS: Record<string, "left" | "right"> = {
  t1p1: "right", // Slot 1 (Player A)
  t1p2: "left", // Slot 2 (Player B)
  t2p1: "left", // Slot 1 (Player C)
  t2p2: "right", // Slot 2 (Player D)
};

export function useGameLogic(
  winningScore: number,
  initialServerTeam: 1 | 2,
  playerNames: { t1p1: string; t1p2: string; t2p1: string; t2p2: string },
) {
  const [state, setState] = useState<GameState>({
    score1: 0,
    score2: 0,
    serverTeam: initialServerTeam,
    serverHand: 2, // Standard start: 0-0-2
    gameHistory: [],
    positions: { ...INITIAL_POSITIONS },
    winner: null,
  });

  const checkWin = (s1: number, s2: number) => {
    const diff = Math.abs(s1 - s2);
    const cap = winningScore === 11 ? 15 : winningScore === 15 ? 18 : 25;

    if (s1 >= cap && s1 > s2) return 1;
    if (s2 >= cap && s2 > s1) return 2;

    if (s1 >= winningScore && diff >= 2) return 1;
    if (s2 >= winningScore && diff >= 2) return 2;

    return null;
  };

  const pushHistory = () => {
    setState((prev) => ({
      ...prev,
      gameHistory: [
        ...prev.gameHistory,
        {
          score1: prev.score1,
          score2: prev.score2,
          serverTeam: prev.serverTeam,
          serverHand: prev.serverHand,
          positions: { ...prev.positions },
        },
      ],
    }));
  };

  const scorePoint = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const isTeam1Serving = prev.serverTeam === 1;
      const newScore1 = isTeam1Serving ? prev.score1 + 1 : prev.score1;
      const newScore2 = !isTeam1Serving ? prev.score2 + 1 : prev.score2;

      // Swap positions for serving team ONLY
      const newPositions = { ...prev.positions };
      if (isTeam1Serving) {
        const temp = newPositions.t1p1;
        newPositions.t1p1 = newPositions.t1p2;
        newPositions.t1p2 = temp;
      } else {
        const temp = newPositions.t2p1;
        newPositions.t2p1 = newPositions.t2p2;
        newPositions.t2p2 = temp;
      }

      const winner = checkWin(newScore1, newScore2);

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        positions: newPositions,
        winner,
        gameHistory: [
          ...prev.gameHistory,
          {
            score1: prev.score1,
            score2: prev.score2,
            serverTeam: prev.serverTeam,
            serverHand: prev.serverHand,
            positions: { ...prev.positions },
          },
        ],
      };
    });
  }, [winningScore]);

  const fault = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      let nextServerTeam = prev.serverTeam;
      let nextServerHand = prev.serverHand;
      let nextPositions = { ...prev.positions };

      if (prev.serverHand === 1) {
        // Chuyển sang người thứ 2 trong đội
        nextServerHand = 2;
      } else {
        // SIDE OUT: Chuyển quyền giao bóng sang đội đối phương
        nextServerTeam = prev.serverTeam === 1 ? 2 : 1;
        nextServerHand = 1;

        /**
         * LOGIC BỔ SUNG: Đảm bảo người ở Slot 1 của đội mới nhận bóng
         * sẽ đứng ở bên PHẢI (Right) để phát quả đầu tiên.
         * Nếu họ đang ở bên trái, ta tráo đổi vị trí của họ với đồng đội.
         */
        if (nextServerTeam === 1) {
          if (nextPositions.t1p1 !== "right") {
            nextPositions.t1p1 = "right";
            nextPositions.t1p2 = "left";
          }
        } else {
          if (nextPositions.t2p1 !== "right") {
            nextPositions.t2p1 = "right";
            nextPositions.t2p2 = "left";
          }
        }
      }

      return {
        ...prev,
        serverTeam: nextServerTeam,
        serverHand: nextServerHand,
        positions: nextPositions, // Cập nhật vị trí mới nếu có tráo đổi
        gameHistory: [
          ...prev.gameHistory,
          {
            score1: prev.score1,
            score2: prev.score2,
            serverTeam: prev.serverTeam,
            serverHand: prev.serverHand,
            positions: { ...prev.positions },
          },
        ],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.gameHistory.length === 0) return prev;
      const lastState = prev.gameHistory[prev.gameHistory.length - 1];
      const newHistory = prev.gameHistory.slice(0, -1);

      return {
        ...prev,
        ...lastState,
        gameHistory: newHistory,
        winner: null,
      };
    });
  }, []);

  const getMatchData = (): Omit<InsertMatch, "id" | "date"> | null => {
    if (!state.winner) return null;
    return {
      team1Player1: playerNames.t1p1,
      team1Player2: playerNames.t1p2,
      team2Player1: playerNames.t2p1,
      team2Player2: playerNames.t2p2,
      scoreTeam1: state.score1,
      scoreTeam2: state.score2,
      winningScore,
      winnerTeam: state.winner,
    };
  };

  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
  };
}
