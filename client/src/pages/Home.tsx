import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Trophy, 
  Play, 
  LayoutDashboard, 
  Activity,
  ChevronRight,
  Users, // Đã thêm vào UI bên dưới
  Settings2 // Đã thêm vào UI bên dưới
} from "lucide-react";

// Components & UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinTossModal } from "@/components/CoinTossModal";
import TournamentManager from "@/components/TournamentManager";
import { useTournament } from "@/context/TournamentContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const { stats } = useTournament();

  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  const handleStartQuickMatch = () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return;
    const params = new URLSearchParams({ 
      t1p1, t1p2, t2p1, t2p2, 
      win: winningScore, 
      serve: String(firstServer) 
    });
    setLocation(`/match?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">

      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ccff00] rounded-lg flex items-center justify-center rotate-3">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white">
              BMB <span className="text-[#ccff00]">PICKLEBALL</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="tournament" className="space-y-8">

          <div className="flex justify-center">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto">
              <TabsTrigger value="quickmatch" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#ccff00] data-[state=active]:text-black font-black italic text-xs gap-2">
                <Play className="w-4 h-4" /> TRẬN ĐƠN
              </TabsTrigger>
              <TabsTrigger value="tournament" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#ccff00] data-[state=active]:text-black font-black italic text-xs gap-2">
                <LayoutDashboard className="w-4 h-4" /> QUẢN LÝ GIẢI
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quickmatch">
            <div className="max-w-md mx-auto space-y-6">
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 space-y-6">

                {/* Sử dụng Icon Users ở đây */}
                <div className="flex items-center gap-2 text-[#ccff00]">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Roster Selection</span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Team 1 - P1" value={t1p1} onChange={e => setT1p1(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl h-12 px-4 text-sm focus:border-cyan-400 outline-none transition-all"
                    />
                    <input 
                      placeholder="Team 1 - P2" value={t1p2} onChange={e => setT1p2(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl h-12 px-4 text-sm focus:border-cyan-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Team 2 - P1" value={t2p1} onChange={e => setT2p1(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl h-12 px-4 text-sm focus:border-rose-500 outline-none transition-all"
                    />
                    <input 
                      placeholder="Team 2 - P2" value={t2p2} onChange={e => setT2p2(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-2xl h-12 px-4 text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Sử dụng Icon Settings2 ở đây */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-white/40">
                    <Settings2 className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">Match Configuration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex bg-black/60 p-1 rounded-xl">
                        {["11", "21"].map(s => (
                          <button key={s} onClick={() => setWinningScore(s)} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${winningScore === s ? "bg-white text-black" : "text-white/40"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => setShowCoinToss(true)} className="bg-white/5 hover:bg-white/10 h-9 rounded-xl text-[10px] font-black italic border border-white/10 text-[#ccff00]">
                      TOSS COIN
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleStartQuickMatch}
                  disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
                  className="w-full py-7 rounded-2xl bg-[#ccff00] text-black font-black italic text-lg hover:scale-[1.02] disabled:opacity-20 transition-all"
                >
                  BẮT ĐẦU <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tournament">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-black italic uppercase tracking-widest text-[#ccff00] flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Live Stats
                  </h3>
                </div>
                <Card className="bg-slate-900/40 border-white/5 p-5 rounded-[2rem]">
                   <span className="text-[10px] font-bold text-white/30 uppercase">Tổng VĐV: {stats.length}</span>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <TournamentManager />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CoinTossModal 
        open={showCoinToss} 
        onOpenChange={setShowCoinToss} 
        onComplete={(winner, choice) => {
          const server = choice === "serve" ? winner : (winner === 1 ? 2 : 1);
          setFirstServer(server);
          setShowCoinToss(false);
        }} 
      />
    </div>
  );
}