import { useState, useCallback } from "react";

type GameState = {
  score1: number;               // Điểm đội 1
  score2: number;               // Điểm đội 2
  serverTeam: 1 | 2;           // Đội đang có quyền giao bóng
  serverHand: 1 | 2;           // Tay giao (1 = tay 1, 2 = tay 2)
  positions: Record<string, "left" | "right">; // Vị trí trái/phải của từng cầu thủ
  winner: null | 1 | 2;        // Đội thắng (null nếu chưa kết thúc)
  gameHistory: any[];          // Lịch sử để undo
};

// ==============================================
// PHẦN 1: HOOK CHÍNH - TẠO LOGIC QUẢN LÝ TRẬN ĐẤU
// ==============================================
export function useGameLogic(
  winningScore: number,        // Điểm cần đạt để thắng (11, 15, 21)
  initialServer: 1 | 2,        // Đội giao bóng đầu tiên
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string } // Tên cầu thủ
) {
  // ==============================================
  // PHẦN 2: KHỞI TẠO TRẠNG THÁI BAN ĐẦU
  // ==============================================
  const [state, setState] = useState<GameState>(() => ({
    score1: 0,                // Điểm đội 1 bắt đầu từ 0
    score2: 0,                // Điểm đội 2 bắt đầu từ 0
    serverTeam: initialServer, // Đội nào bắt đầu giao bóng
    serverHand: 1,            // Tay giao đầu tiên là tay 1 (bên phải)
    positions: {              // Vị trí mặc định của các cầu thủ
      t1p1: "left",           // Team 1 Player 1: bên trái
      t1p2: "right",          // Team 1 Player 2: bên phải  
      t2p1: "left",           // Team 2 Player 1: bên trái
      t2p2: "right",          // Team 2 Player 2: bên phải
    },
    winner: null,             // Chưa có đội thắng
    gameHistory: [],          // Lịch sử rỗng khi bắt đầu
  }));

  // ==============================================
  // PHẦN 3: HÀM GHI ĐIỂM - CHỨC NĂNG CHÍNH
  // ==============================================
  const scorePoint = useCallback(() => {
    setState((prev) => {
      // 3.1: Kiểm tra nếu trận đã kết thúc thì không làm gì
      if (prev.winner) return prev;

      // 3.2: Lưu trạng thái hiện tại để có thể undo
      const history = [...prev.gameHistory, { ...prev }];

      // 3.3: Xác định đội nào ghi điểm (dựa trên đội đang giao)
      const isTeam1Serving = prev.serverTeam === 1;
      const scoringTeam = isTeam1Serving ? 1 : 2;

      // 3.4: Cập nhật điểm số cho đội tương ứng
      const newScore1 = scoringTeam === 1 ? prev.score1 + 1 : prev.score1;
      const newScore2 = scoringTeam === 2 ? prev.score2 + 1 : prev.score2;

      // 3.5: KIỂM TRA ĐIỀU KIỆN THẮNG
      const winner =
        newScore1 >= winningScore && newScore1 - newScore2 >= 2  // Đội 1 thắng nếu đủ điểm và cách biệt 2 điểm
          ? 1
          : newScore2 >= winningScore && newScore2 - newScore1 >= 2  // Đội 2 thắng nếu đủ điểm và cách biệt 2 điểm
          ? 2
          : null;  // Chưa có đội thắng

      // 3.6: Chuẩn bị các biến thay đổi
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newPositions = { ...prev.positions };

      // 3.7: Nếu có đội thắng -> kết thúc trận, không thay đổi gì khác
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
      // PHẦN 4: LOGIC XỬ LÝ THEO YÊU CẦU MỚI
      // ==============================================

      // TRƯỜNG HỢP 1: Đội phát bóng được điểm
      if (scoringTeam === prev.serverTeam) {
        // 4.1: Giữ nguyên quyền phát bóng của player đó
        // 4.2: Chỉ đổi vị trí đứng (player đó đổi từ trái sang phải hoặc ngược lại)
        const servingPlayerId = Object.keys(prev.positions).find(
          pid => pid.startsWith(`t${prev.serverTeam}`) && 
          prev.positions[pid] === (prev.serverHand === 1 ? "right" : "left")
        );

        if (servingPlayerId) {
          // Đổi vị trí của player đang phát
          newPositions = {
            ...newPositions,
            [servingPlayerId]: newPositions[servingPlayerId] === "left" ? "right" : "left",
          };
        }
      } 
      // TRƯỜNG HỢP 2: Đội phát bóng không được điểm
      else {
        // 4.3: Chuyển quyền phát bóng cho player còn lại nếu còn lượt phát
        if (prev.serverHand === 1) {
          // Còn lượt phát: đổi sang tay giao 2 (player còn lại)
          newServerHand = 2;

          // Đổi vị trí của cả đội để player mới phát đứng đúng bên
          const teamPrefix = `t${prev.serverTeam}`;
          newPositions = {
            ...newPositions,
            [`${teamPrefix}p1`]: "right",  // Player 1 chuyển sang bên phải
            [`${teamPrefix}p2`]: "left",   // Player 2 chuyển sang bên trái
          };
        } else {
          // Hết lượt phát: chuyển quyền phát cho đội bạn
          newServerTeam = prev.serverTeam === 1 ? 2 : 1;
          newServerHand = 1;  // Reset về tay giao 1

          // Đổi vị trí của đội mới phát để player đầu tiên đứng bên phải
          const newTeamPrefix = `t${newServerTeam}`;
          newPositions = {
            ...newPositions,
            [`${newTeamPrefix}p1`]: "right",  // Player 1 đội mới đứng bên phải
            [`${newTeamPrefix}p2`]: "left",   // Player 2 đội mới đứng bên trái
          };
        }
      }

      // ==============================================
      // PHẦN 5: TRẢ VỀ TRẠNG THÁI MỚI
      // ==============================================
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
  // PHẦN 6: HÀM ĐỔI GIAO BÓNG (PHẠM LỖI)
  // ==============================================
  const fault = useCallback(() => {
    setState((prev) => {
      // 6.1: Kiểm tra nếu trận đã kết thúc
      if (prev.winner) return prev;

      // 6.2: Lưu trạng thái hiện tại để undo
      const history = [...prev.gameHistory, { ...prev }];

      // 6.3: Xử lý đổi giao bóng theo yêu cầu mới
      let newServerTeam = prev.serverTeam;
      let newServerHand = prev.serverHand;
      let newPositions = { ...prev.positions };

      // Nếu đang ở tay giao 1: chuyển sang tay giao 2 (player còn lại cùng đội)
      if (prev.serverHand === 1) {
        newServerHand = 2;

        // Đổi vị trí của cả đội
        const teamPrefix = `t${prev.serverTeam}`;
        newPositions = {
          ...newPositions,
          [`${teamPrefix}p1`]: "right",
          [`${teamPrefix}p2`]: "left",
        };
      } 
      // Nếu đang ở tay giao 2: chuyển quyền phát cho đội bạn
      else {
        newServerTeam = prev.serverTeam === 1 ? 2 : 1;
        newServerHand = 1;  // Reset về tay giao 1

        // Đổi vị trí của đội mới phát
        const newTeamPrefix = `t${newServerTeam}`;
        newPositions = {
          ...newPositions,
          [`${newTeamPrefix}p1`]: "right",
          [`${newTeamPrefix}p2`]: "left",
        };
      }

      // 6.4: Trả về trạng thái mới
      return {
        ...prev,
        serverTeam: newServerTeam,
        serverHand: newServerHand,
        positions: newPositions,
        gameHistory: history,
      };
    });
  }, []);

  // ==============================================
  // PHẦN 7: HÀM HOÀN TÁC
  // ==============================================
  const undo = useCallback(() => {
    setState((prev) => {
      // 7.1: Kiểm tra nếu không có lịch sử để undo
      if (prev.gameHistory.length === 0) return prev;

      // 7.2: Lấy trạng thái trước đó
      const lastState = prev.gameHistory[prev.gameHistory.length - 1];

      // 7.3: Trả về trạng thái trước đó, xóa khỏi lịch sử
      return {
        ...lastState,
        gameHistory: prev.gameHistory.slice(0, -1),
      };
    });
  }, []);

  // ==============================================
  // PHẦN 8: HÀM LẤY DỮ LIỆU TRẬN ĐẤU ĐỂ LƯU
  // ==============================================
  const getMatchData = useCallback(() => {
    return {
      team1Score: state.score1,      // Điểm đội 1
      team2Score: state.score2,      // Điểm đội 2
      winner: state.winner,          // Đội thắng
      date: new Date().toISOString(), // Thời gian kết thúc
      players: names,                // Tên các cầu thủ
    };
  }, [state.score1, state.score2, state.winner, names]);

  // ==============================================
  // PHẦN 9: TRẢ VỀ CÁC HÀM VÀ TRẠNG THÁI
  // ==============================================
  return {
    state,        // Trạng thái hiện tại của trận đấu
    scorePoint,   // Hàm ghi điểm
    fault,        // Hàm đổi giao bóng khi phạm lỗi
    undo,         // Hàm hoàn tác
    getMatchData, // Hàm lấy dữ liệu để lưu vào database
  };
}