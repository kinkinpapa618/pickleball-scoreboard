import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court } from "@/components/Court";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, CheckCircle2, AlertOctagon, Undo2, Home, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { useTournament } from "@/context/TournamentContext";

export default function Match() {
  const [, setLocation] = useLocation();
  const { updateTournamentStats } = useTournament();
  const [isLogged, setIsLogged] = useState(false);

  const search = new URLSearchParams(window.location.search);
  const names = { 
    t1p1: search.get("t1p1") || "P1", t1p2: search.get("t1p2") || "P2", 
    t2p1: search.get("t2p1") || "P3", t2p2: search.get("t2p2") || "P4" 
  };
  const winningScore = parseInt(search.get("win") || "11");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

  const { state, scorePoint, fault, undo } = useGameLogic(winningScore, initialServer, names);

  useEffect(() => {
    if (state.winner && !isLogged) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      updateTournamentStats({
        team1: `${names.t1p1} & ${names.t1p2}`,
        team2: `${names.t2p1} & ${names.t2p2}`,
        score1: state.score1,
        score2: state.score2,
        winner: state.winner
      });
      setIsLogged(true);
    }
  }, [state.winner, isLogged, state.score1, state.score2, names, updateTournamentStats]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden text-slate-900">
      {/* Header Sáng */}
      <header className="px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-slate-400 hover:text-indigo-600">
          <Home className="w-5 h-5" />
        </Button>
        <div className="px-4 py-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-lg font-black italic text-indigo-600">
            {state.serverTeam === 1 ? state.score1 : state.score2}-{state.serverTeam === 1 ? state.score2 : state.score1}-{state.serverHand}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={undo} disabled={state.gameHistory.length === 0} className="text-slate-400 hover:text-rose-500">
          <Undo2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-4 space-y-4 max-w-3xl mx-auto w-full">
        <ScoreBoard score1={state.score1} score2={state.score2} serverTeam={state.serverTeam} serverHand={state.serverHand} compact />

        <div className="flex-1">
          <Court 
            positions={state.positions} serverTeam={state.serverTeam} serverHand={state.serverHand}
            names={names} score1={state.score1} score2={state.score2}
            firstServe={(state as any).isFirstServe} compact 
          />
        </div>

        {/* Nút bấm Ghi điểm & Đổi giao - Style sáng */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          <Button onClick={scorePoint} disabled={!!state.winner} className="h-24 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black italic shadow-lg shadow-indigo-200 flex flex-col gap-1 transition-all active:scale-95">
            <CheckCircle2 className="w-7 h-7" /> GHI ĐIỂM
          </Button>
          <Button onClick={fault} disabled={!!state.winner} className="h-24 rounded-[2rem] bg-white border border-slate-200 font-black italic text-slate-600 shadow-sm flex flex-col gap-1 transition-all active:scale-95">
            <AlertOctagon className="w-7 h-7 text-rose-500" /> ĐỔI GIAO
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 bg-white py-3 rounded-2xl border border-slate-200 shadow-sm">
          <Zap className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            SERVER: TEAM {state.serverTeam} - HAND {state.serverHand}
          </span>
        </div>
      </main>

      {/* Dialog chiến thắng - Light mode */}
      <Dialog open={!!state.winner}>
        <DialogContent className="max-w-xs bg-white border-slate-200 rounded-[3rem] p-10 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-black italic mb-6 text-slate-900 uppercase">Victory!</DialogTitle>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full h-12 bg-indigo-600 text-white font-black italic rounded-2xl shadow-lg shadow-indigo-100">REMATCH</Button>
              <Button variant="ghost" onClick={() => setLocation("/")} className="w-full text-slate-400 font-bold hover:text-slate-600">BACK TO HOME</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}