import { useState, useCallback } from "react";

type GameState = {
  score1: number;               // Điểm đội 1
  score2: number;               // Điểm đội 2
  serverTeam: 1 | 2;           // Đội đang có quyền phát bóng
  serverHand: 1 | 2;           // Tay giao (1 = slot 1, 2 = slot 2)
  positions: Record<string, "left" | "right">; // Vị trí trái/phải
  winner: null | 1 | 2;        // Đội thắng
  gameHistory: any[];          // Lịch sử để undo
  firstServe: boolean;         // Cờ đánh dấu lượt phát đầu tiên của trận
};

// ==============================================
// LOGIC CẬP NHẬT VỚI TRƯỜNG HỢP ĐẶC BIỆT:
// ==============================================
// 1. Lượt phát đầu tiên của trận: chỉ có 1 người phát (tay 2)
// 2. Từ lượt thứ 2 trở đi: có 2 người phát (tay 1 và tay 2)
// ==============================================

export function useGameLogic(
  winningScore: number,
  initialServer: 1 | 2,
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  // KHỞI TẠO TRẠNG THÁI BAN ĐẦU VỚI TRƯỜNG HỢP ĐẶC BIỆT
  const [state, setState] = useState<GameState>(() => ({
    score1: 0,
    score2: 0,
    serverTeam: initialServer,
    serverHand: 2,  // Luôn bắt đầu từ slot 1
    positions: {
      t1p1: "left",   // Team 1 Player 1: bên trái
      t1p2: "right",  // Team 1 Player 2: bên phải  
      t2p1: "left",   // Team 2 Player 1: bên trái
      t2p2: "right",  // Team 2 Player 2: bên phải
    },
    winner: null,
    gameHistory: [],
    firstServe: true,  // Đánh dấu đây là lượt phát đầu tiên của trận
  }));

  // ==============================================
  // HÀM GHI ĐIỂM - ĐÃ CẬP NHẬT VỚI FIRST_SERVE
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
      let newFirstServe = prev.firstServe;

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
          [player1]: newPositions[player2],
          [player2]: newPositions[player1],
        };

        // 7A.3: Nếu đây là lượt phát đầu tiên và được điểm, vẫn giữ firstServe = true
        // (vì đội vẫn còn lượt phát đầu tiên)
      } 
      // TRƯỜNG HỢP B: Đội phát bóng KHÔNG được điểm
      else {
        // 7B.1: Đánh dấu đã qua lượt phát đầu tiên
        newFirstServe = false;

        // 7B.2: Xử lý theo tình huống bạn mô tả
        if (prev.firstServe) {
          // TRƯỜNG HỢP ĐẶC BIỆT: Lượt phát đầu tiên của trận
          // Chỉ có 1 người phát (tay 2), không có tay 1
          // Khi không được điểm, chuyển quyền phát cho slot 1 đội đối phương
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;  // Slot 1 đội đối phương
          // Vị trí của 4 player GIỮ NGUYÊN
        } else {
          // TRƯỜNG HỢP THÔNG THƯỜNG (từ lượt thứ 2 trở đi)
          // Kiểm tra đang là slot nào đang phát
          if (prev.serverHand === 1) {
            // Đang là slot 1 phát → chuyển quyền phát cho slot 2 CÙNG ĐỘI
            newServerHand = 2;
            // Vị trí của 4 player GIỮ NGUYÊN
          } else {
            // Đang là slot 2 phát → chuyển quyền phát cho slot 1 ĐỘI ĐỐI PHƯƠNG
            newServerTeam = prev.serverTeam === 1 ? 2 : 1;
            newServerHand = 1;  // Slot 1 đội đối phương
            // Vị trí của 4 player GIỮ NGUYÊN
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
        firstServe: newFirstServe,
        gameHistory: history,
      };
    });
  }, [winningScore]);

  // ==============================================
  // HÀM ĐỔI GIAO BÓNG (PHẠM LỖI) - ĐÃ CẬP NHẬT
  // ==============================================
  const fault = useCallback(() => {
    setState((prev) => {
      // 1. Kiểm tra nếu trận đã kết thúc
      if (prev.winner) return prev;

      // 2. Lưu lịch sử
      const history = [...prev.gameHistory, { ...prev }];

      // 3. Xử lý đổi giao bóng
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newFirstServe = prev.firstServe;

      if (prev.firstServe) {
        // TRƯỜNG HỢP ĐẶC BIỆT: Lượt phát đầu tiên của trận
        newFirstServe = false;
        newServerTeam = prev.serverTeam === 1 ? 2 : 1;
        newServerHand = 1;  // Slot 1 đội đối phương
      } else {
        // TRƯỜNG HỢP THÔNG THƯỜNG
        if (prev.serverHand === 1) {
          // Đang là slot 1 phát → chuyển cho slot 2 CÙNG ĐỘI
          newServerHand = 2;
        } else {
          // Đang là slot 2 phát → chuyển cho slot 1 ĐỘI ĐỐI PHƯƠNG
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;
        }
      }

      // 4. Trả về trạng thái mới
      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
        firstServe: newFirstServe,
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
      firstServe: state.firstServe,  // Thêm thông tin về lượt phát đầu tiên
    };
  }, [state.score1, state.score2, state.winner, state.firstServe, names]);

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