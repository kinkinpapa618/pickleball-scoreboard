      import { useState } from "react";
      import { useLocation } from "wouter";
      import { Button } from "@/components/ui/button";
      import { Card } from "@/components/ui/card";
      import { ArrowRight, Coins, Users, Settings2 } from "lucide-react";
      import { CoinTossModal } from "@/components/CoinTossModal";
      import { motion } from "framer-motion";

      export default function Home() {
        const [, setLocation] = useLocation();
        const [t1p1, setT1p1] = useState("");
        const [t1p2, setT1p2] = useState("");
        const [t2p1, setT2p1] = useState("");
        const [t2p2, setT2p2] = useState("");
        const [winningScore, setWinningScore] = useState("11");
        const [firstServer, setFirstServer] = useState<1 | 2>(1);
        const [showCoinToss, setShowCoinToss] = useState(false);

        const handleStart = () => {
          if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return;
          const params = new URLSearchParams({ 
            t1p1, t1p2, t2p1, t2p2, 
            win: winningScore, 
            serve: String(firstServer) 
          });
          setLocation(`/match?${params.toString()}`);
        };

        return (
          <div className="min-h-screen bg-[#050505] text-white p-4 flex flex-col font-sans">
            {/* Brand Header */}
            <div className="text-center py-6">
              <motion.h3 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black italic tracking-tighter text-[#ccff00]"
              >
                BMB PICKLEBALL
              </motion.h3>
              <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">Championship Series</p>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full space-y-4">
              {/* Teams Input Section */}
              <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-[#ccff00] mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-black italic uppercase tracking-widest">Roster Selection</span>
                </div>

                <div className="space-y-4">
                  {/* Team 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-cyan-400 uppercase italic">Team 1</span>
                      <div className="h-[1px] flex-1 mx-3 bg-cyan-400/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" value={t1p1} onChange={(e) => setT1p1(e.target.value)}
                        placeholder="Player 1"
                        className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-cyan-400 outline-none transition-all placeholder:text-white/20"
                      />
                      <input
                        type="text" value={t1p2} onChange={(e) => setT1p2(e.target.value)}
                        placeholder="Player 2"
                        className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-cyan-400 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-rose-500 uppercase italic">Team 2</span>
                      <div className="h-[1px] flex-1 mx-3 bg-rose-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" value={t2p1} onChange={(e) => setT2p1(e.target.value)}
                        placeholder="Player 3"
                        className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-rose-500 outline-none transition-all placeholder:text-white/20"
                      />
                      <input
                        type="text" value={t2p2} onChange={(e) => setT2p2(e.target.value)}
                        placeholder="Player 4"
                        className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm focus:border-rose-500 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Match Settings */}
              <Card className="p-4 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-[#ccff00]">
                  <Settings2 className="w-4 h-4" />
                  <span className="text-xs font-black italic uppercase tracking-widest">CÀI ĐẶT TRẬN ĐẤU</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">ĐIỂM WIN</label>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                      {["11", "15", "21"].map((score) => (
                        <button
                          key={score} onClick={() => setWinningScore(score)}
                          className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${winningScore === score ? "bg-[#ccff00] text-black" : "text-white/60 hover:text-white"}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">PHÁT BÓNG TRƯỚC</label>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                      {[1, 2].map((team) => (
                        <button
                          key={team} onClick={() => setFirstServer(team as 1 | 2)}
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
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#ccff00] font-black italic text-xs py-5 rounded-xl gap-2 transition-transform active:scale-95"
                >
                  <Coins className="w-4 h-4" /> TUNG XU PHÂN ĐỊNH
                </Button>
              </Card>
            </div>

            {/* Action Footer */}
            <div className="mt-auto py-6 max-w-md mx-auto w-full">
              <Button
                onClick={handleStart}
                disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
                className={`w-full py-7 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(204,255,0,0.2)] gap-2 transition-all ${
                  !t1p1 || !t1p2 || !t2p1 || !t2p2 
                    ? "bg-slate-800 text-white/20 cursor-not-allowed" 
                    : "bg-[#ccff00] text-black hover:scale-[1.02] active:scale-95"
                }`}
              >
                BẮT ĐẦU TRẬN ĐẤU <ArrowRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Modal nằm ngoài cùng nhưng vẫn trong div bao */}
            <CoinTossModal
              open={showCoinToss}
              onOpenChange={setShowCoinToss}
              onComplete={(winner: 1 | 2, choice: "serve" | "side") => {
                // Logic: Nếu đội thắng xu chọn 'SERVE', họ phát đầu. 
                // Nếu họ chọn 'SIDE', đội kia sẽ phát đầu.
                const server = choice === "serve" ? winner : (winner === 1 ? 2 : 1);
                setFirstServer(server);
                setShowCoinToss(false); // Tự động đóng sau khi chọn
              }}
              compact={true}
            />
          </div> 
        );
      }