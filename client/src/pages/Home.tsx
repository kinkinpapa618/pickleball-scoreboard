import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Trophy, 
  Play, 
  LayoutDashboard, 
  Activity,
  ChevronRight,
  Users,
  Settings2,
  TrendingUp
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">

      {/* --- LIGHT HEADER --- */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#ccff00] rounded-xl flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-slate-900">
              BMB <span className="text-indigo-600">PICKLEBALL</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hệ thống Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="quickmatch" className="space-y-8">

          {/* --- TABS NAVIGATION --- */}
          <div className="flex justify-center">
            <TabsList className="bg-slate-200/50 border border-slate-200 p-1 rounded-2xl h-auto">
              <TabsTrigger value="quickmatch" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black italic text-xs gap-2 transition-all">
                <Play className="w-4 h-4" /> TRẬN ĐƠN
              </TabsTrigger>
              <TabsTrigger value="tournament" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black italic text-xs gap-2 transition-all">
                <LayoutDashboard className="w-4 h-4" /> GIẢI ĐẤU
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- TAB 1: QUICK MATCH (Sáng) --- */}
          <TabsContent value="quickmatch">
            <div className="max-w-lg mx-auto">
              <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-[3rem] p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Danh sách thi đấu</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-200" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Đội 1 */}
                  <div className="space-y-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Đội Xanh (T1)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="VĐV 1" value={t1p1} onChange={e => setT1p1(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                      />
                      <input 
                        placeholder="VĐV 2" value={t1p2} onChange={e => setT1p2(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Đội 2 */}
                  <div className="space-y-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Đội Đỏ (T2)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="VĐV 3" value={t2p1} onChange={e => setT2p1(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300"
                      />
                      <input 
                        placeholder="VĐV 4" value={t2p2} onChange={e => setT2p2(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cài đặt trận đấu</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                      {["11", "21"].map(s => (
                        <button key={s} onClick={() => setWinningScore(s)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${winningScore === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{s} ĐIỂM</button>
                      ))}
                    </div>
                    <Button onClick={() => setShowCoinToss(true)} className="bg-white hover:bg-slate-50 h-full rounded-2xl text-[10px] font-black italic border border-slate-200 text-slate-600 shadow-sm">
                      TUNG XU
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleStartQuickMatch}
                  disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
                  className="w-full py-8 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black italic text-lg shadow-lg shadow-indigo-200 disabled:opacity-20 transition-all active:scale-95"
                >
                  BẮT ĐẦU TRẬN ĐẤU <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 2: TOURNAMENT (Sáng) --- */}
          <TabsContent value="tournament">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-slate-400">Thống kê giải</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Vận động viên</span>
                      <span className="text-lg font-black text-indigo-600">{stats.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
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