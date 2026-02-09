import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Coins,
  Users,
  Settings2,
  Play,
  Eye,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { CoinTossModal } from "@/components/CoinTossModal";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMatch, useMatches } from "@/hooks/use-api";

export default function Home() {
  const [, setLocation] = useLocation();
  const createMatch = useCreateMatch();
  const [page, setPage] = useState(1);
  const { data: matchesData } = useMatches(page);

  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  // HÀM QUAN TRỌNG: Tạo trận đấu trong DB trước khi chuyển trang
  const handleStart = async () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return;

    try {
      const newMatch = await createMatch.mutateAsync({
        team1Player1: t1p1,
        team1Player2: t1p2,
        team2Player1: t2p1,
        team2Player2: t2p2,
        winningScore: parseInt(winningScore),
        scoreTeam1: 0,
        scoreTeam2: 0,
        status: "live", // Trạng thái LIVE nhấp nháy
        isServer1: firstServer === 1,
        isServer2: firstServer === 2,
        serverNumber: 1,
      });

      // Chuyển hướng kèm theo matchId vừa được sinh ra từ database
      const params = new URLSearchParams({
        matchId: String(newMatch.id),
        t1p1,
        t1p2,
        t2p1,
        t2p2,
        win: winningScore,
        serve: String(firstServer),
      });
      setLocation(`/match?${params.toString()}`);
    } catch (error) {
      console.error("Không thể tạo trận đấu:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-20 flex flex-col font-sans overflow-x-hidden">
      {/* Brand Header */}
      <div className="text-center py-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black italic tracking-tighter text-[#ccff00]"
        >
          BMB PICKLEBALL
        </motion.h3>
        <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">
          Championship Series
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6">
        {/* Teams Input Section */}
        <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 text-[#ccff00] mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-black italic uppercase tracking-widest">
              Roster Selection
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-cyan-400 uppercase italic">
                Team 1
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={t1p1}
                  onChange={(e) => setT1p1(e.target.value)}
                  placeholder="Player 1"
                  className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-cyan-400 outline-none transition-all"
                />
                <input
                  type="text"
                  value={t1p2}
                  onChange={(e) => setT1p2(e.target.value)}
                  placeholder="Player 2"
                  className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-cyan-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-rose-500 uppercase italic">
                Team 2
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={t2p1}
                  onChange={(e) => setT2p1(e.target.value)}
                  placeholder="Player 3"
                  className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-rose-500 outline-none transition-all"
                />
                <input
                  type="text"
                  value={t2p2}
                  onChange={(e) => setT2p2(e.target.value)}
                  placeholder="Player 4"
                  className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-rose-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-[#ccff00]">
            <Settings2 className="w-4 h-4" />
            <span className="text-xs font-black italic uppercase tracking-widest">
              CÀI ĐẶT TRẬN ĐẤU
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">
                ĐIỂM WIN
              </label>
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                {["11", "15", "21"].map((score) => (
                  <button
                    key={score}
                    onClick={() => setWinningScore(score)}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${winningScore === score ? "bg-[#ccff00] text-black" : "text-white/60"}`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">
                TEAM PHÁT
              </label>
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                {[1, 2].map((team) => (
                  <button
                    key={team}
                    onClick={() => setFirstServer(team as 1 | 2)}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${firstServer === team ? (team === 1 ? "bg-cyan-500" : "bg-rose-500") : "text-white/60"}`}
                  >
                    T{team}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCoinToss(true)}
            className="w-full bg-white/5 border border-white/10 text-[#ccff00] font-black italic text-xs py-5 rounded-xl gap-2 hover:bg-white/10"
          >
            <Coins className="w-4 h-4" /> TUNG XU PHÂN ĐỊNH
          </Button>
        </Card>

        <Button
          onClick={handleStart}
          disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2 || createMatch.isPending}
          className={`w-full py-8 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(204,255,0,0.2)] gap-2 transition-all ${!t1p1 || !t1p2 || !t2p1 || !t2p2 ? "bg-slate-800 text-white/20" : "bg-[#ccff00] text-black hover:scale-[1.02]"}`}
        >
          {createMatch.isPending ? "INITIALIZING..." : "START MATCH NOW"}{" "}
          <ArrowRight className="w-6 h-6" />
        </Button>

        {/* --- DANH SÁCH 10 TRẬN GẦN NHẤT --- */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#ccff00]" /> Recent Matches
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {matchesData?.map((match) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={match.id}
                  className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {match.status === "live" ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-yellow-400 animate-pulse uppercase">
                          Live
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">
                          Finished
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] font-bold">
                      <div className="text-white/90">
                        {match.team1Player1} + {match.team1Player2}
                      </div>
                      <div className="text-white/40 italic font-medium">
                        vs {match.team2Player1} + {match.team2Player2}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black italic text-[#ccff00] tabular-nums">
                      {match.scoreTeam1}-{match.scoreTeam2}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        window.open(`/match-view/${match.id}`, "_blank")
                      }
                      className="h-9 w-9 rounded-full bg-white/5 hover:bg-[#ccff00] hover:text-black transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Phân trang */}
          <div className="flex justify-center items-center gap-6 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-white/40 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#ccff00] bg-[#ccff00]/10 px-3 py-1 rounded-lg">
              Page {page}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <CoinTossModal
        open={showCoinToss}
        onOpenChange={setShowCoinToss}
        onComplete={(winner: 1 | 2, choice: "serve" | "side") => {
          const server = choice === "serve" ? winner : winner === 1 ? 2 : 1;
          setFirstServer(server);
        }}
        compact={true}
      />
    </div>
  );
}
