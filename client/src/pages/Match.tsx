import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court } from "@/components/Court";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, CheckCircle2, AlertOctagon, Undo2, Home, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

      export default function Match() {
        // SỬA LỖI 1: Thêm dấu phẩy để bỏ qua 'location'
        const [, setLocation] = useLocation(); 

        const search = new URLSearchParams(window.location.search);
        const names = { 
          t1p1: search.get("t1p1") || "P1", t1p2: search.get("t1p2") || "P2", 
          t2p1: search.get("t2p1") || "P3", t2p2: search.get("t2p2") || "P4" 
        };
        const winningScore = parseInt(search.get("win") || "11");
        const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

        const { state, scorePoint, fault, undo, getMatchData } = useGameLogic(winningScore, initialServer, names);
        const createMatch = useCreateMatch();
        const [saved, setSaved] = useState(false);

        // Kiểm tra biến firstServe: 
        // Nếu hook dùng tên khác, hãy sửa 'state.firstServe' thành 'state.isFirstServe'
        const isFirstServeActive = (state as any).firstServe || (state as any).isFirstServe;

        useEffect(() => {
          if (state.winner && !saved) {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
            const data = getMatchData();
            if (data) { createMatch.mutate(data); setSaved(true); }
          }
        }, [state.winner, saved, getMatchData, createMatch]);

        return (
          <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden">
      {/* High-Tech Header */}
      <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-white/40 hover:text-white">
          <Home className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-black rounded-lg border border-white/10 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${state.serverTeam === 1 ? "bg-cyan-400" : "bg-rose-500"}`} />
            <span className="text-lg font-black italic text-white leading-none">
              {state.serverTeam === 1 ? state.score1 : state.score2}-{state.serverTeam === 1 ? state.score2 : state.score1}-{state.serverHand}
            </span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={undo} disabled={state.gameHistory.length === 0} className="text-white/40 hover:text-[#ccff00]">
          <Undo2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-4 space-y-4 max-w-3xl mx-auto w-full">
        {/* ScoreBoard - Đồng bộ style mới */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 backdrop-blur-md">
           <ScoreBoard 
              score1={state.score1} score2={state.score2} 
              serverTeam={state.serverTeam} serverHand={state.serverHand} 
              compact 
           />
        </div>

        {/* Court Section */}
        <div className="flex-1">
          <Court
            positions={state.positions} 
            serverTeam={state.serverTeam} 
            serverHand={state.serverHand}
            names={names} 
            score1={state.score1} 
            score2={state.score2}
            // SỬA LỖI 2: Dùng biến đã kiểm tra ở trên
            firstServe={isFirstServeActive} 
            compact
          />
        </div>

        {/* PRO CONTROL PAD */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={scorePoint} disabled={!!state.winner}
            className="group relative h-20 rounded-3xl bg-[#ccff00] overflow-hidden transition-all shadow-[0_20px_40px_rgba(204,255,0,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
            <div className="relative flex flex-col items-center justify-center text-black">
              <CheckCircle2 className="w-6 h-6 mb-1" />
              <span className="text-xs font-black italic uppercase tracking-widest">GHI ĐIỂM</span>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fault} disabled={!!state.winner}
            className="group relative h-20 rounded-3xl bg-slate-800 border border-white/10 overflow-hidden transition-all"
          >
            <div className="relative flex flex-col items-center justify-center text-white">
              <AlertOctagon className="w-6 h-6 mb-1 text-rose-500" />
              <span className="text-xs font-black italic uppercase tracking-widest text-white/60">ĐỔI GIAO</span>
            </div>
          </motion.button>
        </div>

            {/* Live Status Bar */}
              <div className="flex items-center justify-center gap-4 bg-white/5 py-3 px-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-[#ccff00]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Lượt phát: <span className="text-white italic">TEAM {state.serverTeam} (TAY {state.serverHand})</span>
                  </span>
                </div>
                {/* SỬA LỖI 2: Dùng biến đã kiểm tra ở trên */}
                {isFirstServeActive && (
                  <div className="text-[#ccff00] text-[10px] font-black italic animate-pulse tracking-tighter">
                    [ LƯỢT PHÁT ĐẦU TIÊN 0-0-2 ]
                  </div>
                )}
              </div>
            </main>

      {/* WINNER MODAL - PREMIUM LOOK */}
      <Dialog open={!!state.winner}>
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-[2rem] p-8">
          <div className="text-center">
            <div className="relative inline-block mb-4">
               <Trophy className="w-20 h-20 text-[#ccff00] relative z-10" />
               <div className="absolute inset-0 bg-[#ccff00] blur-[40px] opacity-20" />
            </div>
            <DialogTitle className="text-2xl font-black italic text-white mb-2 tracking-tighter">
              CHIẾN THẮNG!
            </DialogTitle>
            <p className={`text-xl font-black italic mb-6 ${state.winner === 1 ? "text-cyan-400" : "text-rose-500"}`}>
              TEAM {state.winner === 1 ? "01" : "02"}
            </p>

            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full bg-[#ccff00] text-black font-black italic h-12 rounded-xl">
                <RotateCcw className="mr-2 w-4 h-4" /> ĐẤU LẠI
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/")} className="w-full text-white/40 font-bold h-12">
                MENU CHÍNH
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}