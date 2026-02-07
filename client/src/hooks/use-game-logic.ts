import { useState, useCallback } from "react";
// Giả định import type từ schema của bạn, nếu không có hãy bỏ qua dòng này
import { type InsertMatch } from "@shared/schema";

// --- TYPES ---
export type PlayerPosition = {
  id: string; 
  name: string;
  side: "left" | "right";
  team: 1 | 2;
};

export type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2; // 1 = 1st server, 2 = 2nd server (Start match is 2)
  gameHistory: Array<Omit<GameState, "gameHistory">>; // History stores snapshots of state
  positions: Record<string, "left" | "right">; // Map player ID to side
  winner: 1 | 2 | null;
};

// --- CONSTANTS ---
// Mặc định ban đầu: Slot 1 của cả 2 đội đều đứng bên PHẢI (Right)
// Để đảm bảo ai giao bóng đầu tiên cũng là Slot 1.
const INITIAL_POSITIONS: Record<string, "left" | "right"> = {
  t1p1: "right", 
  t1p2: "left",  
  t2p1: "right", 
  t2p2: "left",  
};

// --- HOOK ---
export function useGameLogic(
  winningScore: number, 
  initialServerTeam: 1 | 2,
  playerNames: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  // KHỞI TẠO STATE
  const [state, setState] = useState<GameState>(() => {
    return {
      score1: 0,
      score2: 0,
      serverTeam: initialServerTeam,
      serverHand: 2, // Luật Pickleball: Bắt đầu trận luôn là Hand 2 (0-0-2)
      gameHistory: [],
      // Clone positions ban đầu để không bị tham chiếu
      positions: { ...INITIAL_POSITIONS },
      winner: null,
    };
  });

  // LOGIC KIỂM TRA THẮNG
  const checkWin = (s1: number, s2: number) => {
    const diff = Math.abs(s1 - s2);
    // Điểm trần (Cap) để kết thúc trận đấu nếu quá dài (tùy chọn)
    const cap = winningScore === 11 ? 15 : winningScore === 15 ? 19 : 25;

    // Thắng do chạm trần (không cần cách 2 điểm)
    if (s1 >= cap && s1 > s2) return 1;
    if (s2 >= cap && s2 > s1) return 2;

    // Thắng thường (đủ điểm và cách >= 2)
    if (s1 >= winningScore && diff >= 2) return 1;
    if (s2 >= winningScore && diff >= 2) return 2;

    return null;
  };

  // HELPER: LƯU LỊCH SỬ (Snapshot hiện tại trước khi thay đổi)
  const createHistorySnapshot = (currentState: GameState) => {
    const { gameHistory, ...snapshot } = currentState;
    return snapshot;
  };

  // 1. GHI ĐIỂM (SCORE POINT)
  const scorePoint = useCallback(() => {
    setState(prev => {
      if (prev.winner) return prev;

      const isTeam1Serving = prev.serverTeam === 1;
      const newScore1 = isTeam1Serving ? prev.score1 + 1 : prev.score1;
      const newScore2 = !isTeam1Serving ? prev.score2 + 1 : prev.score2;

      // Logic ĐỔI CHỖ (Swap): Chỉ đội ghi điểm mới đổi chỗ 2 người chơi
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
        gameHistory: [...prev.gameHistory, createHistorySnapshot(prev)],
      };
    });
  }, [winningScore]);

  // 2. LỖI / MẤT LƯỢT (FAULT)
  const fault = useCallback(() => {
    setState(prev => {
      if (prev.winner) return prev;

      let nextServerTeam = prev.serverTeam;
      let nextServerHand = prev.serverHand;
      let nextPositions = { ...prev.positions };

      if (prev.serverHand === 1) {
        // Nếu là người đầu tiên giao lỗi -> Chuyển sang người thứ 2 (cùng đội)
        nextServerHand = 2;
        // Vị trí giữ nguyên, không đổi
      } else {
        // SIDE OUT: Nếu người thứ 2 giao lỗi -> Đổi quyền giao bóng sang đội kia
        nextServerTeam = prev.serverTeam === 1 ? 2 : 1;
        nextServerHand = 1;

        // --- QUAN TRỌNG: RESET VỊ TRÍ KHI ĐỔI ĐỘI ---
        // Yêu cầu: Người Slot 1 (tXp1) luôn giao quả đầu tiên (Hand 1)
        // Hành động: Ép Slot 1 về bên PHẢI (Right), Slot 2 về TRÁI (Left)
        if (nextServerTeam === 1) {
          nextPositions.t1p1 = "right";
          nextPositions.t1p2 = "left";
        } else {
          nextPositions.t2p1 = "right";
          nextPositions.t2p2 = "left";
        }
      }

      return {
        ...prev,
        serverTeam: nextServerTeam,
        serverHand: nextServerHand,
        positions: nextPositions,
        gameHistory: [...prev.gameHistory, createHistorySnapshot(prev)],
      };
    });
  }, []);

  // 3. HOÀN TÁC (UNDO)
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.gameHistory.length === 0) return prev;

      const lastSnapshot = prev.gameHistory[prev.gameHistory.length - 1];
      const newHistory = prev.gameHistory.slice(0, -1);

      return {
        ...prev, // Giữ các method hoặc property khác nếu có
        ...lastSnapshot, // Ghi đè state bằng snapshot cũ
        gameHistory: newHistory, // Cập nhật danh sách history mới
        winner: null, // Reset winner nếu undo từ trạng thái thắng
      };
    });
  }, []);

  // 4. LẤY ID NGƯỜI ĐANG GIAO BÓNG (Để hiển thị UI)
  const getCurrentServerId = useCallback(() => {
    // Trong Pickleball, người giao bóng LUÔN là người đứng bên PHẢI
    // (Trừ trường hợp đánh đơn lẻ loi, nhưng đây là logic đôi chuẩn)
    if (state.serverTeam === 1) {
      return state.positions.t1p1 === "right" ? "t1p1" : "t1p2";
    } else {
      return state.positions.t2p1 === "right" ? "t2p1" : "t2p2";
    }
  }, [state.serverTeam, state.positions]);

  // 5. XUẤT DỮ LIỆU TRẬN ĐẤU
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
    getCurrentServerId,
  };
}