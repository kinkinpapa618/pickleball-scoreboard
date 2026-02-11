import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court, StackingMap } from "@/components/Court"; // Import Type mới
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trophy,
  CheckCircle2,
  AlertOctagon,
  Undo2,
  Home,
  ShieldAlert,
  Layers,
  UserCog,
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

interface PlayerPenalty {
  yellow: number;
  red: boolean;
}
interface PenaltiesState {
  [key: string]: PlayerPenalty;
}

export default function Match() {
  const [, setLocation] = useLocation();
  const search = new URLSearchParams(window.location.search);

  const names = {
    t1p1: search.get("t1p1") || "P1",
    t1p2: search.get("t1p2") || "P2",
    t2p1: search.get("t2p1") || "P3",
    t2p2: search.get("t2p2") || "P4",
  };
  const winningScore = parseInt(search.get("win") || "11");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

  const { state, scorePoint, fault, undo, getMatchData } = useGameLogic(
    winningScore,
    initialServer,
    names,
  );
  const createMatch = useCreateMatch();
  const [saved, setSaved] = useState(false);

  // --- NEW STATE LOGIC ---
  // StackingMap: "t1p1" -> "left" (Có nghĩa là t1p1 bị khóa ở cánh trái)
  const [stackingMap, setStackingMap] = useState<StackingMap>({});

  const [penalties, setPenalties] = useState<PenaltiesState>({
    t1p1: { yellow: 0, red: false },
    t1p2: { yellow: 0, red: false },
    t2p1: { yellow: 0, red: false },
    t2p2: { yellow: 0, red: false },
  });

  // State cho Modal (lưu thêm currentSide để biết đường lock)
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    team: 1 | 2;
    name: string;
    currentSide: "left" | "right";
  } | null>(null);

  const isFirstServeActive =
    (state as any).firstServe || (state as any).isFirstServe;

  useEffect(() => {
    if (state.winner && !saved) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
      const rawData = getMatchData();
      if (rawData) {
        createMatch.mutate({
          team1Player1: names.t1p1,
          team1Player2: names.t1p2,
          team2Player1: names.t2p1,
          team2Player2: names.t2p2,
          winningScore,
          scoreTeam1: state.score1,
          scoreTeam2: state.score2,
          winnerTeam: state.winner,
          status: "finished",
        });
        setSaved(true);
      }
    }
  }, [
    state.winner,
    saved,
    getMatchData,
    createMatch,
    state.score1,
    state.score2,
    names,
    winningScore,
  ]);

  const giveCard = (playerKey: string, type: "yellow" | "red") => {
    setPenalties((prev) => {
      const newState = { ...prev };
      newState[playerKey] = { ...prev[playerKey] };
      if (type === "yellow") {
        newState[playerKey].yellow += 1;
        if (newState[playerKey].yellow >= 2) handleForfeit(playerKey);
      } else {
        newState[playerKey].red = true;
        handleForfeit(playerKey);
      }
      return newState;
    });
    setSelectedPlayer(null);
  };

  const handleForfeit = (loserKey: string) => {
    const winningTeam = loserKey.startsWith("t1") ? 2 : 1;
    (state as any).winner = winningTeam;
  };

  // --- LOGIC TOGGLE STACKING MỚI ---
  const togglePlayerStacking = () => {
    if (!selectedPlayer) return;
    const { id, team, currentSide } = selectedPlayer;

    setStackingMap((prev) => {
      const newMap = { ...prev };

      // Nếu player này đang stacking -> Tắt
      if (newMap[id]) {
        delete newMap[id];
      } else {
        // Nếu chưa stacking -> Bật
        // 1. Tắt stacking của đồng đội (chỉ 1 người/team được stack)
        const teammateId = id === `t${team}p1` ? `t${team}p2` : `t${team}p1`;
        if (newMap[teammateId]) delete newMap[teammateId];

        // 2. Gán vị trí hiện tại làm vị trí khóa
        newMap[id] = currentSide;
      }
      return newMap;
    });
  };

  const isCurrentPlayerStacking = selectedPlayer
    ? !!stackingMap[selectedPlayer.id]
    : false;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden">
      {/* Header */}
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
            <span className="text-lg font-black italic text-white leading-none">
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
            firstServe={isFirstServeActive}
            compact
            stackingMap={stackingMap}
            penalties={penalties}
            // Truyền vị trí hiện tại lên
            onPlayerClick={(id, team, name, currentSide) =>
              setSelectedPlayer({ id, team, name, currentSide })
            }
          />
          <div className="text-center mt-2 text-[10px] text-white/30 italic">
            * Chạm vào cầu thủ để thiết lập Stacking hoặc Thẻ phạt
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={scorePoint}
            disabled={!!state.winner}
            className="h-20 rounded-3xl bg-[#ccff00] flex flex-col items-center justify-center text-black shadow-lg"
          >
            <CheckCircle2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-black italic uppercase">
              GHI ĐIỂM
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fault}
            disabled={!!state.winner}
            className="h-20 rounded-3xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center text-white"
          >
            <AlertOctagon className="w-6 h-6 mb-1 text-rose-500" />
            <span className="text-xs font-black italic uppercase text-white/60">
              LỖI / ĐỔI GIAO
            </span>
          </motion.button>
        </div>
      </main>

      {/* --- MENU CHIẾN THUẬT (MODAL) --- */}
      <Dialog
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      >
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-3xl p-6">
          {selectedPlayer && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPlayer.team === 1 ? "bg-cyan-500 text-black" : "bg-rose-500 text-white"}`}
                  >
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Cài đặt cầu thủ
                    </div>
                    <div className="text-xl font-black italic">
                      {selectedPlayer.name}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Stacking Toggle - Player Specific */}
              <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCurrentPlayerStacking ? (
                    <Lock className="w-5 h-5 text-[#ccff00]" />
                  ) : (
                    <Layers className="w-5 h-5 text-indigo-400" />
                  )}
                  <div>
                    <div
                      className={`font-bold text-sm ${isCurrentPlayerStacking ? "text-[#ccff00]" : "text-white"}`}
                    >
                      {isCurrentPlayerStacking
                        ? "ĐANG STACKING"
                        : "Bật Stacking"}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {isCurrentPlayerStacking
                        ? `Khóa vị trí: ${stackingMap[selectedPlayer.id] === "left" ? "Trái" : "Phải"}`
                        : "Giữ vị trí hiện tại"}
                    </div>
                  </div>
                </div>
                <div
                  onClick={togglePlayerStacking}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    isCurrentPlayerStacking ? "bg-[#ccff00]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isCurrentPlayerStacking
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              {/* Penalty Controls */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-white/40 uppercase ml-1">
                  Xử lý vi phạm
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => giveCard(selectedPlayer.id, "yellow")}
                    className="h-12 bg-yellow-400/10 border border-yellow-400/30 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 hover:text-black hover:border-transparent transition-all group"
                  >
                    <ShieldAlert className="w-4 h-4 text-yellow-500 group-hover:text-black" />
                    <span className="font-bold text-yellow-500 group-hover:text-black text-sm">
                      Vàng
                    </span>
                  </button>
                  <button
                    onClick={() => giveCard(selectedPlayer.id, "red")}
                    className="h-12 bg-red-600/10 border border-red-600/30 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white hover:border-transparent transition-all group"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-500 group-hover:text-white" />
                    <span className="font-bold text-red-500 group-hover:text-white text-sm">
                      Đỏ
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Winner Modal giữ nguyên */}
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
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-[#ccff00] text-black font-black italic h-12 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> ĐẤU LẠI
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="w-full text-white/40 font-bold uppercase text-[10px]"
            >
              Về trang chủ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
