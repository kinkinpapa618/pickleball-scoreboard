import { useState, useCallback } from "react";

type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2; // Tay giao: 1 hoặc 2
  positions: Record<string, "left" | "right">;
  winner: null | 1 | 2;
  gameHistory: any[];
  firstServe: boolean; // Cờ lượt phát đầu tiên của trận (0-0-2)
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
    serverHand: 2, // Quy tắc: Trận đấu bắt đầu từ Server 2 (0-0-2)
    positions: {
      t1p1: "left",
      t1p2: "right",
      t2p1: "left",
      t2p2: "right",
    },
    winner: null,
    gameHistory: [],
    firstServe: true,
  }));

  // ==============================================
  // HÀM GHI ĐIỂM (Chỉ dành cho đội đang giao bóng)
  // ==============================================
  const scorePoint = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const history = [...prev.gameHistory, { ...prev }];

      // 1. Cộng điểm cho đội đang giao bóng
      const isTeam1 = prev.serverTeam === 1;
      const newScore1 = isTeam1 ? prev.score1 + 1 : prev.score1;
      const newScore2 = !isTeam1 ? prev.score2 + 1 : prev.score2;

      // 2. Kiểm tra điều kiện thắng
      const winner =
        newScore1 >= winningScore && newScore1 - newScore2 >= 2 ? 1 :
        newScore2 >= winningScore && newScore2 - newScore1 >= 2 ? 2 : null;

      if (winner) {
        return { ...prev, score1: newScore1, score2: newScore2, winner, gameHistory: history };
      }

      // 3. ĐỔI VỊ TRÍ: Trong Pickleball, khi ghi điểm, 2 người đội phát bóng đổi chỗ cho nhau
      const teamPrefix = `t${prev.serverTeam}`;
      const p1 = `${teamPrefix}p1`;
      const p2 = `${teamPrefix}p2`;

      const newPositions = {
        ...prev.positions,
        [p1]: prev.positions[p2],
        [p2]: prev.positions[p1],
      };

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        positions: newPositions,
        gameHistory: history,
      };
    });
  }, [winningScore]);

  // ==============================================
  // HÀM LỖI / MẤT LƯỢT (FAULT)
  // ==============================================
  const fault = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;
      const history = [...prev.gameHistory, { ...prev }];

      // Trường hợp 1: Đang là lượt phát đầu tiên của trận (0-0-2)
      if (prev.firstServe) {
        return {
          ...prev,
          serverTeam: prev.serverTeam === 1 ? 2 : 1,
          serverHand: 1, // Chuyển sang đội kia, người thứ nhất phát
          firstServe: false,
          gameHistory: history,
        };
      }

      // Trường hợp 2: Đang là Server 1 của lượt bình thường
      if (prev.serverHand === 1) {
        return {
          ...prev,
          serverHand: 2, // Chuyển sang người thứ hai trong đội
          gameHistory: history,
        };
      }

      // Trường hợp 3: Đang là Server 2 và phạm lỗi (SIDE OUT)
      return {
        ...prev,
        serverTeam: prev.serverTeam === 1 ? 2 : 1,
        serverHand: 1, // Đổi đội, bắt đầu từ Server 1
        gameHistory: history,
      };
    });
  }, []);

  // ==============================================
  // HÀM HOÀN TÁC (UNDO)
  // ==============================================
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
      server: `${state.serverTeam}-${state.serverHand}`,
      positions: state.positions
    };
  }, [state]);

  return { state, scorePoint, fault, undo, getMatchData };
}