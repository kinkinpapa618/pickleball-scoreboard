import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useUpdateMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court, StackingMap } from "@/components/Court";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CheckCircle2,
  AlertOctagon,
  Undo2,
  Home,
  Layers,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

export default function Match() {
  const [, setLocation] = useLocation();
  const search = new URLSearchParams(window.location.search);

  const matchId = parseInt(search.get("id") || "0");
  const names = {
    t1p1: search.get("t1p1") || "P1",
    t1p2: search.get("t1p2") || "P2",
    t2p1: search.get("t2p1") || "P3",
    t2p2: search.get("t2p2") || "P4",
  };
  const winningScore = parseInt(search.get("win") || "11");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

  const { state, scorePoint, fault, undo } = useGameLogic(
    winningScore,
    initialServer,
    names,
  );
  const updateMatch = useUpdateMatch();
  const [saved, setSaved] = useState(false);
  const [stackingMap, setStackingMap] = useState<StackingMap>({});
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // HÀM ĐỒNG BỘ: Map chuẩn xác sang Schema Database
  const syncWithServer = useCallback(
    (newState: any) => {
      if (matchId > 0) {
        updateMatch.mutate({
          id: matchId,
          data: {
            scoreTeam1: newState.score1,
            scoreTeam2: newState.score2,
            isServer1: newState.serverTeam === 1,
            isServer2: newState.serverTeam === 2,
            // SỬA TẠI ĐÂY: Thay serverHand thành serverNumber để đúng với schema.ts
            serverNumber: newState.serverHand,
            status: newState.winner ? "finished" : "live",
            winnerTeam: newState.winner || null,
          },
        });
      }
    },
    [matchId, updateMatch],
  );

  useEffect(() => {
    syncWithServer(state);
    if (state.winner && !saved) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      setSaved(true);
    }
  }, [
    state.score1,
    state.score2,
    state.serverTeam,
    state.serverHand,
    state.winner,
    syncWithServer,
    saved,
    state,
  ]);

  const togglePlayerStacking = () => {
    if (!selectedPlayer) return;
    setStackingMap((prev) => {
      const newMap = { ...prev };
      if (newMap[selectedPlayer.id]) {
        delete newMap[selectedPlayer.id];
      } else {
        const teammateId = selectedPlayer.id.endsWith("p1")
          ? selectedPlayer.id.replace("p1", "p2")
          : selectedPlayer.id.replace("p2", "p1");
        delete newMap[teammateId];
        newMap[selectedPlayer.id] = selectedPlayer.currentSide;
      }
      return newMap;
    });
    setSelectedPlayer(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden">
      <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-white/40 hover:text-white"
        >
          <Home className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-black rounded-lg border border-white/10 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${state.serverTeam === 1 ? "bg-cyan-400" : "bg-rose-500"}`}
            />
            <span className="text-lg font-black italic text-white uppercase tracking-tighter">
              {state.score1}-{state.score2}-{state.serverHand}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={state.gameHistory.length === 0}
          className="text-white/40 hover:text-[#ccff00]"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-4 space-y-4 max-w-3xl mx-auto w-full overflow-y-auto">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 backdrop-blur-md">
          <ScoreBoard
            score1={state.score1}
            score2={state.score2}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            compact
          />
        </div>

        <div className="flex-1 min-h-[300px] relative">
          <Court
            positions={state.positions}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            names={names}
            score1={state.score1}
            score2={state.score2}
            firstServe={(state as any).isFirstServe || false}
            compact
            stackingMap={stackingMap}
            onPlayerClick={(id, _team, _name, currentSide) =>
              setSelectedPlayer({ id, currentSide })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={scorePoint}
            disabled={!!state.winner}
            className="h-24 rounded-3xl bg-[#ccff00] flex flex-col items-center justify-center text-black shadow-lg"
          >
            <CheckCircle2 className="w-8 h-8 mb-1" />
            <span className="text-xs font-black italic uppercase">
              GHI ĐIỂM
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fault}
            disabled={!!state.winner}
            className="h-24 rounded-3xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center text-white"
          >
            <AlertOctagon className="w-8 h-8 mb-1 text-rose-500" />
            <span className="text-xs font-black italic uppercase text-white/60">
              LỖI / ĐỔI GIAO
            </span>
          </motion.button>
        </div>
      </main>

      <Dialog
        open={!!selectedPlayer}
        onOpenChange={() => setSelectedPlayer(null)}
      >
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-white font-black italic text-xl uppercase tracking-tight">
              Chiến thuật Stacking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="text-indigo-400 w-5 h-5" />
                <span className="text-white font-bold text-sm">
                  Cố định vị trí
                </span>
              </div>
              <Button
                onClick={togglePlayerStacking}
                className="bg-[#ccff00] text-black font-bold h-8"
              >
                {selectedPlayer && stackingMap[selectedPlayer.id]
                  ? "HỦY"
                  : "KHÓA"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!state.winner}>
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-[2rem] p-8 text-center">
          <Trophy className="w-16 h-16 text-[#ccff00] mb-4 mx-auto" />
          <DialogTitle className="text-2xl font-black italic text-white uppercase mb-2">
            Victory!
          </DialogTitle>
          <p
            className={`text-xl font-black italic mb-6 ${state.winner === 1 ? "text-cyan-400" : "text-rose-500"}`}
          >
            TEAM {state.winner === 1 ? "01" : "02"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-[#ccff00] text-black font-black italic h-12 rounded-xl"
          >
            ĐẤU LẠI
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
