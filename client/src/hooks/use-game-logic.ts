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
    // Người phát đầu tiên (Server 1) đứng Ô 1 (bên phải)
    let adjustedPositions = { ...positions };
    
    // Nếu đội 2 phát đầu tiên, đảm bảo t2p1 đứng bên phải, t2p2 đứng bên trái
    // Đội 1 giữ nguyên: t1p1 bên phải, t1p2 bên trái
    if (initialServer === 2) {
      adjustedPositions.t2p1 = "right";
      adjustedPositions.t2p2 = "left";
      // Đội 1 không phát nên giữ nguyên vị trí mặc định
    }

    return {
      score1: 0,
      score2: 0,
      serverTeam: initialServer,
      serverHand: 1,  // Server 1 (Ô 1) phát ở lượt đầu tiên
      positions: adjustedPositions,
      winner: null,
      gameHistory: [],
      isFirstServeOfMatch: true,
    };
  });

  // ==============================================
  // HÀM GHI ĐIỂM - SỬA LẠI THEO YÊU CẦU
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
        
        // Giữ nguyên người phát (cùng serverTeam và serverHand)
        // Không cần đảm bảo người phát đứng bên phải
      } 
      // TRƯỜNG HỢP B: Đội phát bóng THUA (không được điểm)
      else {
        if (prev.isFirstServeOfMatch) {
          // Lượt phát đầu tiên của trận: chỉ có 1 người phát
          newIsFirstServeOfMatch = false;
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;
          
          // Đội mới bắt đầu phát: Server 1 phải đứng bên phải
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
            // Server 1 thua -> chuyển cho Server 2 cùng đội
            newServerHand = 2;
            
            // Đảm bảo Server 2 đứng bên phải khi bắt đầu phát
            const teamPrefix = `t${prev.serverTeam}`;
            const newServerPlayerId = `${teamPrefix}p${newServerHand}`;
            if (newPositions[newServerPlayerId] !== "right") {
              const otherPlayerId = `${teamPrefix}p1`;
              const temp = newPositions[newServerPlayerId];
              newPositions[newServerPlayerId] = newPositions[otherPlayerId];
              newPositions[otherPlayerId] = temp;
            }
          } else {
            // Server 2 thua -> Side Out, chuyển đội
            newServerTeam = prev.serverTeam === 1 ? 2 : 1;
            newServerHand = 1;
            
            // Đội mới bắt đầu phát: Server 1 phải đứng bên phải
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

  // Hàm fault và các hàm khác giữ nguyên...
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

  const getRemainingServes = useCallback(() => {
    if (state.isFirstServeOfMatch) {
      return 1;
    } else if (state.serverHand === 1) {
      return 2;
    } else {
      return 1;
    }
  }, [state.isFirstServeOfMatch, state.serverHand]);

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

  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
    getRemainingServes,
    checkDiagonalPositions,
  };
}