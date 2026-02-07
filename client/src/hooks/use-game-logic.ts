import { useState, useCallback } from "react";

type GameState = {
  score1: number;               // Điểm đội 1
  score2: number;               // Điểm đội 2
  serverTeam: 1 | 2;           // Đội đang có quyền phát bóng
  serverHand: 1 | 2;           // Tay giao (1 = slot 1, 2 = slot 2)
  positions: Record<string, "left" | "right">; // Vị trí trái/phải
  winner: null | 1 | 2;        // Đội thắng
  gameHistory: any[];          // Lịch sử để undo
};

// ==============================================
// LOGIC CHÍNH DỰA TRÊN TÌNH HUỐNG BẠN MÔ TẢ:
// ==============================================
// 1. Đội phát được điểm: giữ quyền phát, đổi vị trí TRONG ĐỘI
// 2. Đội phát không được điểm: 
//    - Nếu đang slot 1 → chuyển cho slot 2 cùng đội
//    - Nếu đang slot 2 → chuyển cho slot 1 đội đối phương
// 3. Đội nhận: slot 1 luôn nhận đầu tiên, hết lượt thì đổi slot
// ==============================================

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
    serverHand: 1,  // Luôn bắt đầu từ slot 1
    positions: {
      t1p1: "left",   // Team 1 Player 1: bên trái
      t1p2: "right",  // Team 1 Player 2: bên phải  
      t2p1: "left",   // Team 2 Player 1: bên trái
      t2p2: "right",  // Team 2 Player 2: bên phải
    },
    winner: null,
    gameHistory: [],
  }));

  // ==============================================
  // HÀM GHI ĐIỂM - ĐÃ SỬA THEO TÌNH HUỐNG
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
      // LOGIC CHÍNH DỰA TRÊN TÌNH HUỐNG:
      // ==============================================

      // TRƯỜNG HỢP A: Đội phát bóng ĐƯỢC điểm
      if (scoringTeam === prev.serverTeam) {
        // 7A.1: Giữ nguyên quyền phát bóng của player đó
        // Không thay đổi newServerTeam và newServerHand

        // 7A.2: Đổi vị trí GIỮA HAI NGƯỜI TRONG ĐỘI ĐANG PHÁT
        const teamPrefix = `t${prev.serverTeam}`;
        const player1 = `${teamPrefix}p1`;
        const player2 = `${teamPrefix}p2`;

        // Đổi chỗ vị trí của 2 người trong đội
        newPositions = {
          ...newPositions,
          [player1]: newPositions[player2],  // P1 lấy vị trí của P2
          [player2]: newPositions[player1],  // P2 lấy vị trí của P1
        };
      } 
      // TRƯỜNG HỢP B: Đội phát bóng KHÔNG được điểm
      else {
        // 7B.1: Kiểm tra đang là slot nào đang phát
        if (prev.serverHand === 1) {
          // Đang là slot 1 phát → chuyển quyền phát cho slot 2 CÙNG ĐỘI
          newServerHand = 2;
          // Vị trí của 4 player GIỮ NGUYÊN (không đổi)
        } else {
          // Đang là slot 2 phát → chuyển quyền phát cho slot 1 ĐỘI ĐỐI PHƯƠNG
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;  // Reset về slot 1
          // Vị trí của 4 player GIỮ NGUYÊN (không đổi)
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

      // 3. Xử lý đổi giao bóng (giống như không được điểm)
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;

      if (prev.serverHand === 1) {
        // Đang là slot 1 phát → chuyển cho slot 2 CÙNG ĐỘI
        newServerHand = 2;
        // Vị trí GIỮ NGUYÊN
      } else {
        // Đang là slot 2 phát → chuyển cho slot 1 ĐỘI ĐỐI PHƯƠNG
        newServerTeam = prev.serverTeam === 1 ? 2 : 1;
        newServerHand = 1;
        // Vị trí GIỮ NGUYÊN
      }

      // 4. Trả về trạng thái mới
      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
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
  // HÀM LẤY DỮ LIỆU
  // ==============================================
  const getMatchData = useCallback(() => {
    return {
      team1Score: state.score1,
      team2Score: state.score2,
      winner: state.winner,
      date: new Date().toISOString(),
      players: names,
    };
  }, [state.score1, state.score2, state.winner, names]);

  // ==============================================
  // TRẢ VỀ KẾT QUẢ
  // ==============================================
  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
  };
}