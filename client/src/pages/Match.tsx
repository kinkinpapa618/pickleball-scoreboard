  import { useEffect, useState } from "react";
  import { useLocation } from "wouter";
  import { useGameLogic } from "@/hooks/use-game-logic";
  import { ScoreBoard } from "@/components/ScoreBoard";
  import { Court } from "@/components/Court";
  import { Button } from "@/components/ui/button";
  import { RotateCcw, Trophy, CheckCircle2, AlertOctagon, Undo2, Home, Zap } from "lucide-react";
  import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
  import confetti from "canvas-confetti";
  import { motion } from "framer-motion";
  import { useTournament } from "@/context/TournamentContext"; // Đảm bảo file này tồn tại

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
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });

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

    const isFirstServeActive = (state as any).firstServe || (state as any).isFirstServe;

    return (
      <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden text-white">
        <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-white/40 hover:text-white">
            <Home className="w-5 h-5" />
          </Button>
          <div className="px-3 py-1 bg-black rounded-lg border border-white/10">
            <span className="text-lg font-black italic">
              {state.serverTeam === 1 ? state.score1 : state.score2}-{state.serverTeam === 1 ? state.score2 : state.score1}-{state.serverHand}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={undo} disabled={state.gameHistory.length === 0} className="text-white/40">
            <Undo2 className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col p-4 space-y-4 max-w-3xl mx-auto w-full">
          <ScoreBoard score1={state.score1} score2={state.score2} serverTeam={state.serverTeam} serverHand={state.serverHand} compact />

          <div className="flex-1">
            <Court 
              positions={state.positions} serverTeam={state.serverTeam} serverHand={state.serverHand}
              names={names} score1={state.score1} score2={state.score2}
              firstServe={isFirstServeActive} compact 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <Button onClick={scorePoint} disabled={!!state.winner} className="h-20 rounded-3xl bg-[#ccff00] text-black font-black italic">
              <CheckCircle2 className="w-6 h-6 mb-1" /> GHI ĐIỂM
            </Button>
            <Button onClick={fault} disabled={!!state.winner} className="h-20 rounded-3xl bg-slate-800 border border-white/10 font-black italic text-white">
              <AlertOctagon className="w-6 h-6 mb-1 text-rose-500" /> ĐỔI GIAO
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white/5 py-3 rounded-2xl border border-white/5">
            <Zap className="w-3 h-3 text-[#ccff00]" />
            <span className="text-[10px] font-black text-white/40 uppercase">
              SERVER: TEAM {state.serverTeam} - HAND {state.serverHand}
            </span>
          </div>
        </main>

        <Dialog open={!!state.winner}>
          <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-[2rem] p-8 text-white">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-[#ccff00] mx-auto mb-4" />
              <DialogTitle className="text-2xl font-black italic mb-6">VICTORY!</DialogTitle>
              <Button onClick={() => window.location.reload()} className="w-full bg-[#ccff00] text-black font-black italic mb-2">REMATCH</Button>
              <Button variant="ghost" onClick={() => setLocation("/")} className="w-full text-white/40 font-bold">EXIT</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }