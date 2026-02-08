import { useState, useCallback } from "react";

type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2;
  positions: Record<string, "left" | "right">;
  winner: null | 1 | 2;
  gameHistory: any[];
  isFirstServeOfMatch: boolean;
};

export function useGameLogic(
  winningScore: number,
  initialServer: 1 | 2,
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  // KHỞI TẠO TRẠNG THÁI BAN ĐẦU
  const [state, setState] = useState<GameState>(() => {
    // Vị trí ban đầu: Ô 1 = right (bên phải), Ô 2 = left (bên trái) cho cả 2 đội
    const positions: Record<string, "left" | "right"> = {
      t1p1: "right",   // Team 1 Player 1: Ô 1 (bên phải) - người phát đầu tiên
      t1p2: "left",    // Team 1 Player 2: Ô 2 (bên trái)
      t2p1: "right",   // Team 2 Player 1: Ô 1 (bên phải)
      t2p2: "left",    // Team 2 Player 2: Ô 2 (bên trái)
    };

    // Điều chỉnh cho đội phát đầu tiên: 
    let adjustedPositions = { ...positions };

    if (initialServer === 2) {
      adjustedPositions.t2p1 = "right";
      adjustedPositions.t2p2 = "left";
    }

    return {
      score1: 0,
      score2: 0,
      serverTeam: initialServer,
      serverHand: 1,
      positions: adjustedPositions,
      winner: null,
      gameHistory: [],
      isFirstServeOfMatch: true,
    };
  });

  // ==============================================
  // HÀM ĐỔI SÂN - HOÁN ĐỔI VỊ TRÍ TEAM1 VÀ TEAM2
  // ==============================================
  const switchSides = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev; // Không đổi sân nếu trận đã kết thúc

      // Lưu lịch sử để undo
      const history = [...prev.gameHistory, { ...prev }];

      // Tạo bản sao mới của positions
      const newPositions = { ...prev.positions };

      // Hoán đổi vị trí giữa team1 và team2
      // Giữ nguyên vị trí left/right, chỉ hoán đổi team
      const tempT1P1 = newPositions.t1p1;
      const tempT1P2 = newPositions.t1p2;

      newPositions.t1p1 = newPositions.t2p1;
      newPositions.t1p2 = newPositions.t2p2;
      newPositions.t2p1 = tempT1P1;
      newPositions.t2p2 = tempT1P2;

      // Hoán đổi điểm số
      const newScore1 = prev.score2;
      const newScore2 = prev.score1;

      // Hoán đổi đội đang phát (nếu có)
      const newServerTeam = prev.serverTeam === 1 ? 2 : 1;

      // Hoán đổi tên players (names) - cần tạo object names mới
      const newNames = {
        t1p1: names.t2p1,
        t1p2: names.t2p2,
        t2p1: names.t1p1,
        t2p2: names.t1p2,
      };

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        serverTeam: newServerTeam,
        positions: newPositions,
        gameHistory: history,
        // Lưu ý: names không được lưu trong state, nên cần xử lý riêng
      };
    });
  }, [names]);

  // ==============================================
  // HÀM GHI ĐIỂM
  // ==============================================
  const scorePoint = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const history = [...prev.gameHistory, { ...prev }];

      const isTeam1Serving = prev.serverTeam === 1;
      const scoringTeam = isTeam1Serving ? 1 : 2;

      const newScore1 = scoringTeam === 1 ? prev.score1 + 1 : prev.score1;
      const newScore2 = scoringTeam === 2 ? prev.score2 + 1 : prev.score2;

      const winner =
        newScore1 >= winningScore && newScore1 - newScore2 >= 2
          ? 1
          : newScore2 >= winningScore && newScore2 - newScore1 >= 2
          ? 2
          : null;

      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newPositions = { ...prev.positions };
      let newIsFirstServeOfMatch = prev.isFirstServeOfMatch;

      if (winner) {
        return {
          ...prev,
          score1: newScore1,
          score2: newScore2,
          winner,
          gameHistory: history,
        };
      }

      // TRƯỜNG HỢP A: Đội phát bóng THẮNG (được điểm)
      if (scoringTeam === prev.serverTeam) {
        // Hoán đổi vị trí 2 người trong đội đang phát
        const teamPrefix = `t${prev.serverTeam}`;
        const player1 = `${teamPrefix}p1`;
        const player2 = `${teamPrefix}p2`;

        const temp = newPositions[player1];
        newPositions[player1] = newPositions[player2];
        newPositions[player2] = temp;
      } 
      // TRƯỜNG HỢP B: Đội phát bóng THUA (không được điểm)
      else {
        if (prev.isFirstServeOfMatch) {
          newIsFirstServeOfMatch = false;
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;

          const newTeamPrefix = `t${newServerTeam}`;
          const newServerPlayerId = `${newTeamPrefix}p${newServerHand}`;

          if (newPositions[newServerPlayerId] !== "right") {
            const otherPlayerId = `${newTeamPrefix}p2`;
            const temp = newPositions[newServerPlayerId];
            newPositions[newServerPlayerId] = newPositions[otherPlayerId];
            newPositions[otherPlayerId] = temp;
          }
        } else {
          if (prev.serverHand === 1) {
            newServerHand = 2;

            const teamPrefix = `t${prev.serverTeam}`;
            const newServerPlayerId = `${teamPrefix}p${newServerHand}`;
            if (newPositions[newServerPlayerId] !== "right") {
              const otherPlayerId = `${teamPrefix}p1`;
              const temp = newPositions[newServerPlayerId];
              newPositions[newServerPlayerId] = newPositions[otherPlayerId];
              newPositions[otherPlayerId] = temp;
            }
          } else {
            newServerTeam = prev.serverTeam === 1 ? 2 : 1;
            newServerHand = 1;

            const newTeamPrefix = `t${newServerTeam}`;
            const newServerPlayerId = `${newTeamPrefix}p${newServerHand}`;
            if (newPositions[newServerPlayerId] !== "right") {
              const otherPlayerId = `${newTeamPrefix}p2`;
              const temp = newPositions[newServerPlayerId];
              newPositions[newServerPlayerId] = newPositions[otherPlayerId];
              newPositions[otherPlayerId] = temp;
            }
          }
        }
      }

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
        positions: newPositions,
        winner,
        isFirstServeOfMatch: newIsFirstServeOfMatch,
        gameHistory: history,
      };
    });
  }, [winningScore]);

  // ==============================================
  // HÀM ĐỔI GIAO BÓNG (PHẠM LỖI)
  // ==============================================
  const fault = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const history = [...prev.gameHistory, { ...prev }];

      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newIsFirstServeOfMatch = prev.isFirstServeOfMatch;
      let newPositions = { ...prev.positions };

      if (prev.isFirstServeOfMatch) {
        newIsFirstServeOfMatch = false;
        newServerTeam = prev.serverTeam === 1 ? 2 : 1;
        newServerHand = 1;

        const newTeamPrefix = `t${newServerTeam}`;
        const newServerPlayerId = `${newTeamPrefix}p${newServerHand}`;
        if (newPositions[newServerPlayerId] !== "right") {
          const otherPlayerId = `${newTeamPrefix}p2`;
          const temp = newPositions[newServerPlayerId];
          newPositions[newServerPlayerId] = newPositions[otherPlayerId];
          newPositions[otherPlayerId] = temp;
        }
      } else {
        if (prev.serverHand === 1) {
          newServerHand = 2;

          const teamPrefix = `t${prev.serverTeam}`;
          const newServerPlayerId = `${teamPrefix}p${newServerHand}`;
          if (newPositions[newServerPlayerId] !== "right") {
            const otherPlayerId = `${teamPrefix}p1`;
            const temp = newPositions[newServerPlayerId];
            newPositions[newServerPlayerId] = newPositions[otherPlayerId];
            newPositions[otherPlayerId] = temp;
          }
        } else {
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;

          const newTeamPrefix = `t${newServerTeam}`;
          const newServerPlayerId = `${newTeamPrefix}p${newServerHand}`;
          if (newPositions[newServerPlayerId] !== "right") {
            const otherPlayerId = `${newTeamPrefix}p2`;
            const temp = newPositions[newServerPlayerId];
            newPositions[newServerPlayerId] = newPositions[otherPlayerId];
            newPositions[otherPlayerId] = temp;
          }
        }
      }

      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
        positions: newPositions,
        isFirstServeOfMatch: newIsFirstServeOfMatch,
        gameHistory: history,
      };
    });
  }, []);

  // ==============================================
  // HÀM HOÀN TÁC
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

  // ==============================================
  // HÀM TÍNH SỐ LƯỢT PHÁT CÒN LẠI
  // ==============================================
  const getRemainingServes = useCallback(() => {
    if (state.isFirstServeOfMatch) {
      return 1;
    } else if (state.serverHand === 1) {
      return 2;
    } else {
      return 1;
    }
  }, [state.isFirstServeOfMatch, state.serverHand]);

  // ==============================================
  // HÀM KIỂM TRA VỊ TRÍ CHÉO NHAU
  // ==============================================
  const checkDiagonalPositions = useCallback(() => {
    const serverPlayerId = `t${state.serverTeam}p${state.serverHand}`;
    const serverPosition = state.positions[serverPlayerId];

    const receiverTeam = state.serverTeam === 1 ? 2 : 1;
    const receiverPlayerId = Object.keys(state.positions).find(
      pid => pid.startsWith(`t${receiverTeam}`) && state.positions[pid] === serverPosition
    );

    return {
      serverPlayerId,
      serverPosition,
      receiverPlayerId,
      receiverTeam,
      isDiagonal: receiverPlayerId !== undefined,
    };
  }, [state.serverTeam, state.serverHand, state.positions]);

  // ==============================================
  // HÀM LẤY DỮ LIỆU
  // ==============================================
  const getMatchData = useCallback(() => {
    return {
      team1Score: state.score1,
      team2Score: state.score2,
      winner: state.winner,
      date: new Date().toISOString(),
      players: names,
      isFirstServeOfMatch: state.isFirstServeOfMatch,
      remainingServes: getRemainingServes(),
      diagonalCheck: checkDiagonalPositions(),
    };
  }, [state.score1, state.score2, state.winner, state.isFirstServeOfMatch, names, getRemainingServes, checkDiagonalPositions]);

  // ==============================================
  // TRẢ VỀ KẾT QUẢ
  // ==============================================
  return {
    state,
    scorePoint,
    fault,
    undo,
    switchSides, // Thêm hàm switchSides vào return
    getMatchData,
    getRemainingServes,
    checkDiagonalPositions,
  };
}