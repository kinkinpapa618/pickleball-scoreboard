import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Play,
  History,
  GitPullRequest,
  Search,
  Shuffle,
  Users,
  Settings2,
  Coins,
  ArrowRight,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMatch, useMatches } from "@/hooks/use-api";
import { ExcelUpload } from "@/components/ExcelUpload";
import { CoinTossModal } from "@/components/CoinTossModal";
import { generateGroups } from "@/lib/tournament";

export default function Home() {
  const [, setLocation] = useLocation();
  const createMatch = useCreateMatch();

  // States cho Phân trang & Dữ liệu
  const [page, setPage] = useState(1);
  const { data: matchesData } = useMatches(page);

  // States cho Form Tạo Trận (Từ Home cũ)
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  // States cho Bốc thăm (Từ RefereeTools mới)
  const [playerInput, setPlayerInput] = useState<string>("");
  const [tournamentGroups, setTournamentGroups] = useState<any>(null);

  // --- LOGIC XỬ LÝ ---

  const handleExcelData = (players: string[]) => {
    setPlayerInput(players.join("\n"));
  };

  const handleDraw = () => {
    const players = playerInput.split("\n").filter((p) => p.trim() !== "");
    if (players.length < 4) {
      alert("Cần tối thiểu 4 đội/người để chia bảng!");
      return;
    }
    const groups = generateGroups(players, 4);
    setTournamentGroups(groups);
  };

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
        status: "live",
        isServer1: firstServer === 1,
        isServer2: firstServer === 2,
        serverNumber: 1,
      });

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
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-24 flex flex-col font-sans overflow-x-hidden">
      {/* Brand Header */}
      <div className="text-center py-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black italic tracking-tighter text-[#ccff00]"
        >
          TRONGTAISO.COM
        </motion.h3>
        <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">
          Referee Support
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 mb-6 p-1 rounded-2xl h-12">
            <TabsTrigger
              value="create"
              className="rounded-xl data-[state=active]:bg-[#ccff00] data-[state=active]:text-black font-black uppercase text-[10px]"
            >
              <Play className="w-3 h-3 mr-1" /> Trận
            </TabsTrigger>
            <TabsTrigger
              value="draw"
              className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black uppercase text-[10px]"
            >
              <GitPullRequest className="w-3 h-3 mr-1" /> Bốc thăm
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl data-[state=active]:bg-white/20 font-black uppercase text-[10px]"
            >
              <History className="w-3 h-3 mr-1" /> Lịch sử
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ĐIỀU KHIỂN / TẠO TRẬN */}
          <TabsContent
            value="create"
            className="space-y-6 animate-in fade-in zoom-in-95 duration-300"
          >
            <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-2 shadow-2xl">
              <div className="flex items-center gap-2 text-[#ccff00] mb-2">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  THÔNG TIN VẬN ĐỘNG VIÊN
                </span>
              </div>
              <div className="space-y-2">
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

            <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-[#ccff00]">
                <Settings2 className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  CÀI ĐẶT TRẬN ĐẤU
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase mb-2 block">
                    Điểm thắng
                  </label>
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                    {["11", "15", "21"].map((score) => (
                      <button
                        key={score}
                        onClick={() => setWinningScore(score)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${winningScore === score ? "bg-[#ccff00] text-black" : "text-white/60"}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase mb-2 block">
                    Team Phát Bóng Đầu
                  </label>
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                    {[1, 2].map((team) => (
                      <button
                        key={team}
                        onClick={() => setFirstServer(team as 1 | 2)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${firstServer === team ? (team === 1 ? "bg-cyan-500" : "bg-rose-500") : "text-white/60"}`}
                      >
                        Team {team}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowCoinToss(true)}
                className="w-full bg-white/5 border border-white/10 text-[#ccff00] font-black  text-[10px] py-3 rounded-xl gap-4 hover:bg-white/10 transition-all"
              >
                <Coins className="w-2 h-2" /> TUNG XU PHÂN ĐỊNH
              </Button>
            </Card>

            <Button
              onClick={handleStart}
              disabled={
                !t1p1 || !t1p2 || !t2p1 || !t2p2 || createMatch.isPending
              }
              className={`w-full py-8 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(204,255,0,0.2)] gap-2 transition-all ${!t1p1 || !t1p2 || !t2p1 || !t2p2 ? "bg-slate-800 text-white/20" : "bg-[#ccff00] text-black hover:scale-[1.02] active:scale-95"}`}
            >
              {createMatch.isPending
                ? "ĐANG VÀO TRẬN ĐẤU..."
                : "BẮT ĐẦU TRẬN ĐẤU"}{" "}
              <ArrowRight className="w-6 h-6" />
            </Button>
          </TabsContent>

          {/* TAB 2: BỐC THĂM / CHIA BẢNG */}
          <TabsContent
            value="draw"
            className="space-y-6 animate-in slide-in-from-right-4 duration-300"
          >
            <Card className="p-4 bg-slate-900/50 border-white/5 rounded-3xl space-y-4">
              <ExcelUpload onDataLoaded={handleExcelData} />
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-600 uppercase italic">
                  Hoặc nhập tay
                </span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>
              <textarea
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="Nhập danh sách VĐV, mỗi người một dòng..."
              />
              <Button
                onClick={handleDraw}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black italic rounded-2xl h-14 shadow-lg shadow-indigo-500/20 uppercase tracking-widest"
              >
                <Shuffle className="w-4 h-4 mr-2" /> Xác nhận chia bảng
              </Button>
            </Card>

            {tournamentGroups && (
              <div className="space-y-6 pb-10">
                {Object.values(tournamentGroups).map((group: any) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={group.name}
                    className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
                  >
                    <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex justify-between items-center">
                      <span className="font-black italic text-indigo-400 uppercase tracking-tighter text-sm">
                        Bảng {group.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {group.players.length} Players
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      {group.matches.map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 text-[11px] font-bold"
                        >
                          <span className="w-[42%] text-right truncate text-white/90">
                            {m.home}
                          </span>
                          <span className="text-[#ccff00] font-black mx-2 italic opacity-50">
                            VS
                          </span>
                          <span className="w-[42%] text-left truncate text-white/90">
                            {m.away}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: LỊCH SỬ TRẬN ĐẤU */}
          <TabsContent
            value="history"
            className="space-y-4 animate-in slide-in-from-left-4 duration-300"
          >
            <div className="relative mb-4">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Tìm kiếm trận đấu..."
                className="pl-12 h-12 bg-slate-900/50 border-white/5 rounded-2xl focus:ring-[#ccff00]/20"
              />
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {matchesData?.map((match) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={match.id}
                    className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      {match.status === "live" ? (
                        /* NÚT BẤM ĐỂ TIẾP TỤC TRẬN ĐẤU */
                        <button
                          onClick={() => {
                            const url = `/match?matchId=${match.id}&t1p1=${encodeURIComponent(match.team1Player1)}&t1p2=${encodeURIComponent(match.team1Player2)}&t2p1=${encodeURIComponent(match.team2Player1)}&t2p2=${encodeURIComponent(match.team2Player2)}&win=${match.winningScore}&serve=1`;
                            setLocation(url);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full hover:bg-yellow-400/20 transition-colors cursor-pointer group/live"
                        >
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                          <span className="text-[8px] font-black text-yellow-400 uppercase flex items-center gap-1">
                            Live{" "}
                            <ChevronRight className="w-2 h-2 group-hover/live:translate-x-0.5 transition-transform" />
                          </span>
                        </button>
                      ) : (
                        <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">
                            End
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] font-bold">
                        <div className="text-white/90">
                          {match.team1Player1} + {match.team1Player2}
                        </div>
                        <div className="text-white/30 italic font-medium uppercase text-[9px]">
                          vs {match.team2Player1} + {match.team2Player2}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black italic text-[#ccff00] tabular-nums">
                        {match.scoreTeam1}-{match.scoreTeam2}
                      </span>

                      <div className="flex gap-2">
                        {/* Nút xem công khai (cho khán giả) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(`/match-view/${match.id}`, "_blank")
                          }
                          className="h-9 w-9 rounded-full bg-white/5 hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Nếu là trận Live, thêm một nút "Tiếp tục" rõ ràng hơn ở bên phải */}
                        {match.status === "live" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const url = `/match?matchId=${match.id}&t1p1=${encodeURIComponent(match.team1Player1)}&t1p2=${encodeURIComponent(match.team1Player2)}&t2p1=${encodeURIComponent(match.team2Player1)}&t2p2=${encodeURIComponent(match.team2Player2)}&win=${match.winningScore}&serve=1`;
                              setLocation(url);
                            }}
                            className="h-9 w-9 rounded-full bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Phân trang */}
            <div className="flex justify-center items-center gap-6 pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-white/40 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ccff00] bg-[#ccff00]/10 px-4 py-1.5 rounded-full border border-[#ccff00]/20">
                Page {page}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                className="text-white/40 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
