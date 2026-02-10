import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useUpdateMatch } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, LogOut, Zap, UserCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

// --- Định nghĩa kiểu dữ liệu ---
interface PlayerPenalty {
  yellow: number;
  red: boolean;
}

interface PenaltiesState {
  [key: string]: PlayerPenalty;
  t1p1: PlayerPenalty;
  t1p2: PlayerPenalty;
  t2p1: PlayerPenalty;
  t2p2: PlayerPenalty;
}

export default function Match() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const matchId = params.get("matchId") || params.get("id");
  const updateMatch = useUpdateMatch();

  // --- States quản lý trận đấu ---
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [server, setServer] = useState(parseInt(params.get("serve") || "1"));
  const [serverNum, setServerNum] = useState(1);
  const [winner, setWinner] = useState<number | null>(null);

  // Trạng thái Stacking
  const [stackingTeam1, setStackingTeam1] = useState(false);
  const [stackingTeam2, setStackingTeam2] = useState(false);

  // Trạng thái Thẻ phạt
  const [penalties, setPenalties] = useState<PenaltiesState>({
    t1p1: { yellow: 0, red: false },
    t1p2: { yellow: 0, red: false },
    t2p1: { yellow: 0, red: false },
    t2p2: { yellow: 0, red: false },
  });

  const t1p1 = params.get("t1p1") || "Player 1";
  const t1p2 = params.get("t1p2") || "Player 2";
  const t2p1 = params.get("t2p1") || "Player 3";
  const t2p2 = params.get("t2p2") || "Player 4";
  const winScore = parseInt(params.get("win") || "11");

  // --- Logic đồng bộ Database ---
  useEffect(() => {
    if (matchId && !isNaN(parseInt(matchId)) && !winner) {
      updateMatch.mutate({
        id: parseInt(matchId),
        data: {
          scoreTeam1: score1,
          scoreTeam2: score2,
          isServer1: server === 1,
          isServer2: server === 2,
          serverNumber: serverNum,
          status: "live",
        },
      });
    }
  }, [score1, score2, server, serverNum, matchId, winner]);

  // Tạo trận đấu mới nếu chưa có ID
  useEffect(() => {
    if (!matchId && t1p1 !== "Player 1" && t2p1 !== "Player 3") {
      const createNewMatch = async () => {
        try {
          const res = await apiRequest("POST", "/api/matches", {
            team1Player1: t1p1,
            team1Player2: t1p2 !== "Player 2" ? t1p2 : "",
            team2Player1: t2p1,
            team2Player2: t2p2 !== "Player 4" ? t2p2 : "",
            winningScore: winScore,
            status: "live",
          });
          const data = await res.json();
          setLocation(`/match?id=${data.id}`);
        } catch (err) {
          console.error("Lỗi khởi tạo trận đấu:", err);
        }
      };
      createNewMatch();
    }
  }, [matchId, t1p1, t2p1]);

  // --- Logic xử lý Thẻ phạt & Thắng cuộc ---
  const handleWin = (team: number) => {
    setWinner(team);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: team === 1 ? ["#06b6d4", "#ffffff"] : ["#f43f5e", "#ffffff"],
    });

    if (matchId) {
      updateMatch.mutate({
        id: parseInt(matchId),
        data: {
          status: "finished",
          winnerTeam: team,
          scoreTeam1: score1,
          scoreTeam2: score2,
        },
      });
    }
  };

  const handleForfeit = (loserKey: string) => {
    const losingTeam = loserKey.startsWith("t1") ? 1 : 2;
    const winningTeam = losingTeam === 1 ? 2 : 1;
    alert(
      `TRẬN ĐẤU KẾT THÚC: Vi phạm quy định thẻ phạt. Team ${winningTeam} thắng cuộc!`,
    );
    handleWin(winningTeam);
  };

  const giveCard = (
    playerKey: keyof PenaltiesState,
    type: "yellow" | "red",
  ) => {
    setPenalties((prev) => {
      const newState = { ...prev };
      const player = { ...newState[playerKey] };

      if (type === "yellow") {
        player.yellow += 1;
        if (player.yellow >= 2)
          setTimeout(() => handleForfeit(playerKey as string), 100);
      } else {
        player.red = true;
        setTimeout(() => handleForfeit(playerKey as string), 100);
      }

      newState[playerKey] = player;
      return newState;
    });
  };

  const handleScore = (team: number) => {
    if (winner) return;
    if (team === 1) {
      const newScore = score1 + 1;
      setScore1(newScore);
      if (newScore >= winScore) handleWin(1);
    } else {
      const newScore = score2 + 1;
      setScore2(newScore);
      if (newScore >= winScore) handleWin(2);
    }
  };

  const handleExit = () => {
    if (
      winner ||
      confirm("Trận đấu đang diễn ra. Bạn có chắc chắn muốn thoát không?")
    ) {
      setLocation("/");
    }
  };

  // --- Sub-component hiển thị người chơi ---
  const PlayerDisplay = ({
    id,
    name,
  }: {
    id: keyof PenaltiesState;
    name: string;
  }) => (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold truncate max-w-[80px]">{name}</span>
        <div className="flex gap-0.5">
          {penalties[id].yellow > 0 && (
            <div
              className={`w-1.5 h-2.5 rounded-sm shadow-lg ${penalties[id].yellow >= 2 ? "bg-red-600" : "bg-yellow-400"}`}
            />
          )}
          {penalties[id].red && (
            <div className="w-1.5 h-2.5 bg-red-600 rounded-sm shadow-lg" />
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => giveCard(id, "yellow")}
          className="p-1 bg-yellow-400/20 hover:bg-yellow-400/40 rounded text-[8px] font-bold text-yellow-500 uppercase"
        >
          Vàng
        </button>
        <button
          onClick={() => giveCard(id, "red")}
          className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-[8px] font-bold text-red-500 uppercase"
        >
          Đỏ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
          <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
            Match Controller
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={handleExit}
          className="text-white/40 hover:text-rose-500 gap-2 font-bold text-xs uppercase"
        >
          <LogOut className="w-4 h-4" /> Thoát
        </Button>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full gap-4">
        {/* Main Score Area */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team 1 */}
          <Card
            className={`p-4 bg-slate-900/50 border-2 transition-all ${server === 1 ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/5"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-cyan-400 uppercase">
                Team 1
              </span>
              <button
                onClick={() => setStackingTeam1(!stackingTeam1)}
                className={`p-1.5 rounded-md transition-colors ${stackingTeam1 ? "bg-cyan-500 text-black" : "bg-white/5 text-white/20"}`}
                title="Bật/Tắt Stacking"
              >
                <UserCheck className="w-3 h-3" />
              </button>
            </div>
            <div
              className={`flex gap-2 mb-4 transition-all duration-500 ${stackingTeam1 ? "justify-center scale-110" : "justify-between"}`}
            >
              <PlayerDisplay id="t1p1" name={t1p1} />
              <PlayerDisplay id="t1p2" name={t1p2} />
            </div>
            <button
              onClick={() => handleScore(1)}
              className="w-full py-8 bg-white/5 rounded-2xl text-6xl font-black italic text-cyan-400 border border-white/10 active:scale-95 transition-all"
            >
              {score1}
            </button>
          </Card>

          {/* Team 2 */}
          <Card
            className={`p-4 bg-slate-900/50 border-2 transition-all ${server === 2 ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "border-white/5"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-rose-500 uppercase">
                Team 2
              </span>
              <button
                onClick={() => setStackingTeam2(!stackingTeam2)}
                className={`p-1.5 rounded-md transition-colors ${stackingTeam2 ? "bg-rose-500 text-black" : "bg-white/5 text-white/20"}`}
                title="Bật/Tắt Stacking"
              >
                <UserCheck className="w-3 h-3" />
              </button>
            </div>
            <div
              className={`flex gap-2 mb-4 transition-all duration-500 ${stackingTeam2 ? "justify-center scale-110" : "justify-between"}`}
            >
              <PlayerDisplay id="t2p1" name={t2p1} />
              <PlayerDisplay id="t2p2" name={t2p2} />
            </div>
            <button
              onClick={() => handleScore(2)}
              className="w-full py-8 bg-white/5 rounded-2xl text-6xl font-black italic text-rose-500 border border-white/10 active:scale-95 transition-all"
            >
              {score2}
            </button>
          </Card>
        </div>

        {/* Server Status */}
        <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Giao bóng hiện tại
              </div>
              <div className="text-[#ccff00] font-black italic flex items-center gap-2 text-lg uppercase">
                <Zap className="w-5 h-5 fill-current" /> Đội {server} - Lượt{" "}
                {serverNum}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setServerNum((prev) => (prev === 1 ? 2 : 1))}
                className="flex-1 bg-white/5 border border-white/10 text-[10px] font-black py-6 rounded-xl uppercase"
              >
                Đổi Lượt (S)
              </Button>
              <Button
                onClick={() => {
                  setServer((prev) => (prev === 1 ? 2 : 1));
                  setServerNum(1);
                }}
                className="flex-1 bg-[#ccff00] text-black text-[10px] font-black py-6 rounded-xl uppercase"
              >
                Đổi Team (T)
              </Button>
            </div>
          </div>
        </Card>

        {/* Trợ giúp nhanh */}
        <div className="text-center opacity-20 text-[9px] font-bold uppercase tracking-[0.2em]">
          Stacking: Click icon User cạnh Team • Thẻ phạt: Rê chuột vào tên
          Player
        </div>

        {/* Màn hình chiến thắng */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <Trophy className="w-24 h-24 text-[#ccff00] mb-6 mx-auto" />
                <h2 className="text-6xl font-black italic text-white mb-2 tracking-tighter">
                  VICTORY!
                </h2>
                <p className="text-xl font-bold text-[#ccff00] mb-12 uppercase tracking-[0.2em]">
                  {winner === 1 ? `${t1p1} & ${t1p2}` : `${t2p1} & ${t2p2}`}
                </p>
                <Button
                  onClick={() => setLocation("/")}
                  className="bg-white text-black font-black italic px-12 py-8 rounded-2xl text-xl hover:bg-[#ccff00] transition-colors"
                >
                  QUAY LẠI TRANG CHỦ
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
