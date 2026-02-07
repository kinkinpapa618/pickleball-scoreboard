import { useState, useCallback } from "react";

type GameState = {
  firstServe: any;
  score1: number;               // Điểm đội 1
  score2: number;               // Điểm đội 2
  serverTeam: 1 | 2;           // Đội đang có quyền phát bóng
  serverHand: 1 | 2;           // Tay giao (1 = Server 1, 2 = Server 2)
  positions: Record<string, "left" | "right">; // Vị trí trái/phải
  winner: null | 1 | 2;        // Đội thắng
  gameHistory: any[];          // Lịch sử để undo
  isFirstServeOfMatch: boolean; // Cờ đánh dấu lượt phát đầu tiên của TRẬN ĐẤU
};

export function useGameLogic(
  winningScore: number,
  initialServer: 1 | 2,
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  // KHỞI TẠO TRẠNG THÁI BAN ĐẦU
  const [state, setState] = useState<GameState>(() => ({
    score1: 0,
    score2: 0,
    serverTeam: initialServer,
    serverHand: 2,  // Luôn bắt đầu từ Server 2 (bên phải) ở lượt đầu tiên
    positions: {
      t1p1: "left",   // Team 1 Player 1: bên trái
      t1p2: "right",  // Team 1 Player 2: bên phải  
      t2p1: "left",   // Team 2 Player 1: bên trái
      t2p2: "right",  // Team 2 Player 2: bên phải
    },
    winner: null,
    gameHistory: [],
    isFirstServeOfMatch: true,  // Đây là lượt phát đầu tiên của trận
  }));

  // ==============================================
  // HÀM GHI ĐIỂM - ĐÃ SỬA THEO QUY TẮC MỚI
  // ==============================================
  const scorePoint = useCallback(() => {
    setState((prev) => {
      // 1. Nếu trận đã kết thúc, không làm gì
      if (prev.winner) return prev;

      // 2. Lưu lịch sử để undo
      const history = [...prev.gameHistory, { ...prev }];

      // 3. Xác định đội ghi điểm
      const isTeam1Serving = prev.serverTeam === 1;
      const scoringTeam = isTeam1Serving ? 1 : 2;

      // 4. Cập nhật điểm số
      const newScore1 = scoringTeam === 1 ? prev.score1 + 1 : prev.score1;
      const newScore2 = scoringTeam === 2 ? prev.score2 + 1 : prev.score2;

      // 5. Kiểm tra điều kiện thắng
      const winner =
        newScore1 >= winningScore && newScore1 - newScore2 >= 2
          ? 1
          : newScore2 >= winningScore && newScore2 - newScore1 >= 2
          ? 2
          : null;

      // 6. Chuẩn bị biến thay đổi
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newPositions = { ...prev.positions };
      let newIsFirstServeOfMatch = prev.isFirstServeOfMatch;

      // 7. Nếu có đội thắng -> kết thúc
      if (winner) {
        return {
          ...prev,
          score1: newScore1,
          score2: newScore2,
          winner,
          gameHistory: history,
        };
      }

      // ==============================================
      // LOGIC CHÍNH DỰA TRÊN QUY TẮC MỚI
      // ==============================================

      // TRƯỜNG HỢP A: Đội phát bóng THẮNG pha cầu (được điểm)
      if (scoringTeam === prev.serverTeam) {
        // A1: Đội phát ghi điểm -> người vừa phát đổi bên
        const teamPrefix = `t${prev.serverTeam}`;
        const servingPlayer = `${teamPrefix}p${prev.serverHand}`;
        const otherPlayer = `${teamPrefix}p${prev.serverHand === 1 ? 2 : 1}`;

        // Chỉ đổi vị trí của người vừa phát
        newPositions = {
          ...newPositions,
          [servingPlayer]: newPositions[servingPlayer] === "left" ? "right" : "left",
        };

        // A2: Giữ nguyên quyền phát cho người đó (serverTeam và serverHand không đổi)
        // A3: Nếu đây là lượt phát đầu tiên của trận, vẫn giữ cờ isFirstServeOfMatch
        // (vì đội vẫn còn đang trong lượt phát đầu tiên của trận)
      } 
      // TRƯỜNG HỢP B: Đội phát bóng THUA pha cầu (không được điểm)
      else {
        // B1: Đội phát thua -> không đổi vị trí của ai cả

        // B2: Xử lý chuyển lượt phát
        if (prev.isFirstServeOfMatch) {
          // TRƯỜNG HỢP ĐẶC BIỆT: Lượt phát đầu tiên của trận
          // Chỉ có Server 2 phát một lần duy nhất
          // Khi thua -> Side Out ngay lập tức
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;  // Đội mới, Server 1 bắt đầu phát
          newIsFirstServeOfMatch = false; // Đã qua lượt phát đầu tiên của trận
        } else {
          // TRƯỜNG HỢP THÔNG THƯỜNG (từ lượt thứ 2 trở đi)
          if (prev.serverHand === 1) {
            // Server 1 thua -> chuyển quyền phát cho Server 2 CÙNG ĐỘI
            newServerHand = 2;
            // Vị trí của tất cả players giữ nguyên
          } else {
            // Server 2 thua -> Side Out, chuyển quyền phát cho đội đối phương
            newServerTeam = prev.serverTeam === 1 ? 2 : 1;
            newServerHand = 1;  // Server 1 của đội đối phương bắt đầu phát
            // Vị trí của tất cả players giữ nguyên
          }
        }
      }

      // 8. Trả về trạng thái mới
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
  // HÀM ĐỔI GIAO BÓNG (PHẠM LỖI) - ĐÃ SỬA
  // ==============================================
  const fault = useCallback(() => {
    setState((prev) => {
      // 1. Kiểm tra nếu trận đã kết thúc
      if (prev.winner) return prev;

      // 2. Lưu lịch sử
      const history = [...prev.gameHistory, { ...prev }];

      // 3. Xử lý đổi giao bóng (xử lý giống như thua pha cầu)
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newIsFirstServeOfMatch = prev.isFirstServeOfMatch;

      if (prev.isFirstServeOfMatch) {
        // TRƯỜNG HỢP ĐẶC BIỆT: Lượt phát đầu tiên của trận
        newIsFirstServeOfMatch = false;
        newServerTeam = prev.serverTeam === 1 ? 2 : 1;
        newServerHand = 1;  // Server 1 đội đối phương
      } else {
        // TRƯỜNG HỢP THÔNG THƯỜNG
        if (prev.serverHand === 1) {
          // Đang là Server 1 phát -> chuyển cho Server 2 CÙNG ĐỘI
          newServerHand = 2;
        } else {
          // Đang là Server 2 phát -> Side Out
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;
        }
      }

      // 4. Trả về trạng thái mới
      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
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
      return 1; // Chỉ có 1 lượt phát đầu tiên
    } else if (state.serverHand === 1) {
      return 2; // Server 1 đang phát -> còn 2 lượt (Server 1 và Server 2)
    } else {
      return 1; // Server 2 đang phát -> còn 1 lượt (chỉ Server 2)
    }
  }, [state.isFirstServeOfMatch, state.serverHand]);

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
    };
  }, [state.score1, state.score2, state.winner, state.isFirstServeOfMatch, names, getRemainingServes]);

  // ==============================================
  // TRẢ VỀ KẾT QUẢ
  // ==============================================
  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
    getRemainingServes,
  };
}