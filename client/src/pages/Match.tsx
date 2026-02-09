import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useUpdateMatch } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, LogOut, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function Match() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const matchId = params.get("matchId");
  const updateMatch = useUpdateMatch();

  // Khởi tạo state
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [server, setServer] = useState(parseInt(params.get("serve") || "1"));
  const [serverNum, setServerNum] = useState(1);
  const [winner, setWinner] = useState<number | null>(null);

  const t1p1 = params.get("t1p1") || "Player 1";
  const t1p2 = params.get("t1p2") || "Player 2";
  const t2p1 = params.get("t2p1") || "Player 3";
  const t2p2 = params.get("t2p2") || "Player 4";
  const winScore = parseInt(params.get("win") || "11");

  // 1. Tự động cập nhật Database mỗi khi điểm số hoặc lượt giao thay đổi
  useEffect(() => {
    if (matchId && !winner) {
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

  // 2. Phím tắt bàn phím (1: Team 1, 2: Team 2, S: Đổi lượt, T: Đổi Team giao)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (winner) return;
      if (e.key === "1") handleScore(1);
      if (e.key === "2") handleScore(2);
      if (e.key.toLowerCase() === "s")
        setServerNum((prev) => (prev === 1 ? 2 : 1));
      if (e.key.toLowerCase() === "t") {
        setServer((prev) => (prev === 1 ? 2 : 1));
        setServerNum(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [score1, score2, winner]);

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
          scoreTeam1: team === 1 ? score1 + 1 : score1,
          scoreTeam2: team === 2 ? score2 + 1 : score2,
        },
      });
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

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full gap-6">
        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`p-6 bg-slate-900/50 border-2 transition-all ${server === 1 ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/5"}`}
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                Team 1
              </span>
              <div className="text-sm font-bold opacity-80 h-10 flex flex-col justify-center leading-tight">
                <div>{t1p1}</div>
                <div>{t1p2}</div>
              </div>
              <button
                onClick={() => handleScore(1)}
                className="w-full aspect-square bg-white/5 rounded-3xl text-7xl font-black italic text-cyan-400 border border-white/10 active:scale-95 transition-all"
              >
                {score1}
              </button>
            </div>
          </Card>

          <Card
            className={`p-6 bg-slate-900/50 border-2 transition-all ${server === 2 ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "border-white/5"}`}
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                Team 2
              </span>
              <div className="text-sm font-bold opacity-80 h-10 flex flex-col justify-center leading-tight">
                <div>{t2p1}</div>
                <div>{t2p2}</div>
              </div>
              <button
                onClick={() => handleScore(2)}
                className="w-full aspect-square bg-white/5 rounded-3xl text-7xl font-black italic text-rose-500 border border-white/10 active:scale-95 transition-all"
              >
                {score2}
              </button>
            </div>
          </Card>
        </div>

        {/* Server Controls */}
        <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Current Server
              </div>
              <div className="text-[#ccff00] font-black italic flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 fill-current" /> TEAM {server} - LƯỢT{" "}
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
                className="flex-1 bg-[#ccff00] text-black text-[10px] font-black py-6 rounded-xl uppercase shadow-lg shadow-[#ccff00]/10"
              >
                Đổi Team (T)
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Help */}
        <div className="text-center opacity-20 text-[9px] font-bold uppercase tracking-[0.2em]">
          Hotkeys: [1] Team 1 • [2] Team 2 • [S] Switch L1/L2 • [T] Switch Team
        </div>

        {/* Winner Overlay */}
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
