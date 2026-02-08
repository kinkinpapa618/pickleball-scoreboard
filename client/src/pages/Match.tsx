import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court } from "@/components/Court";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trophy,
  CheckCircle2,
  AlertOctagon,
  Undo2,
  Home,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import confetti from "canvas-confetti";

export default function Match() {
  const [location, setLocation] = useLocation();
  const search = new URLSearchParams(window.location.search);

  // Parse URL Params
  const t1p1 = search.get("t1p1") || "Player 1";
  const t1p2 = search.get("t1p2") || "Player 2";
  const t2p1 = search.get("t2p1") || "Player 3";
  const t2p2 = search.get("t2p2") || "Player 4";
  const winningScore = parseInt(search.get("win") || "11");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

  const names = { t1p1, t1p2, t2p1, t2p2 };

  // Game Hook
  const { state, scorePoint, fault, undo, getMatchData } = useGameLogic(
    winningScore,
    initialServer,
    names,
  );

  // Database Mutation
  const createMatch = useCreateMatch();
  const [saved, setSaved] = useState(false);

  // Win Effect
  useEffect(() => {
    if (state.winner) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

      // Auto-save logic
      if (!saved) {
        const data = getMatchData();
        if (data) {
          createMatch.mutate(data);
          setSaved(true);
        }
      }
    }
  }, [state.winner, saved, getMatchData, createMatch]);

  // Hiển thị tỷ số theo đúng logic mới: Điểm Team Phát Bóng đứng trước
  const getDisplayScore = () => {
    if (state.serverTeam === 1) {
      return `${state.score1}-${state.score2}-${state.serverHand}`;
    } else {
      return `${state.score2}-${state.score1}-${state.serverHand}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Compact Top Bar */}
      <header className="px-2 py-1 border-b border-gray-300 bg-white/90 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="h-8 px-2"
        >
          <Home className="w-4 h-4" />
        </Button>

        <div className="text-center flex-1">
          <div className="text-xs font-bold text-primary">PICKLEBALL</div>
          <div className="text-sm font-bold text-gray-800">{getDisplayScore()}</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={state.gameHistory.length === 0}
          className="h-8 px-2"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-2 space-y-2">
        {/* Score Display - Compact */}
        <div className="bg-white border border-gray-300 rounded-lg p-2">
          <ScoreBoard
            score1={state.score1}
            score2={state.score2}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            compact
          />
        </div>

        {/* Court Visual - Reduced margin */}
        <div className="flex-1 min-h-0">
          <Court
            positions={state.positions}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            names={names}
            score1={state.score1}
            score2={state.score2}
            firstServe={state.firstServe}
            compact
          />
        </div>

        {/* Control Pad - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={scorePoint}
            disabled={!!state.winner}
            className="h-12 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md"
          >
            <div className="flex flex-col items-center gap-0.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>Ghi Điểm</span>
            </div>
          </Button>

          <Button
            variant="destructive"
            onClick={fault}
            disabled={!!state.winner}
            className="h-12 rounded-lg font-bold text-sm shadow-md"
          >
            <div className="flex flex-col items-center gap-0.5">
              <AlertOctagon className="w-5 h-5" />
              <span>Đổi Giao</span>
            </div>
          </Button>
        </div>

        {/* Quick Info Bar */}
        <div className="text-center text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-1">
          <div className="flex justify-between">
            <span className="font-medium">Đội 1: {state.score1}</span>
            <span>|</span>
            <span className="font-medium">Đội 2: {state.score2}</span>
            <span>|</span>
            <span>Phát: Đội {state.serverTeam}-{state.serverHand}</span>
          </div>
          {state.firstServe && (
            <div className="text-yellow-600 font-bold mt-0.5 animate-pulse">
              ⚠️ Lượt phát đầu tiên (0-0-2)
            </div>
          )}
        </div>
      </main>

      {/* Compact Winner Modal */}
      <Dialog open={!!state.winner}>
        <DialogContent className="max-w-xs mx-auto p-0 border-none">
          <div className="bg-white p-4 rounded-lg shadow-xl">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
            <DialogTitle className="text-xl font-black text-center mb-1">
              CHIẾN THẮNG!
            </DialogTitle>
            <p className="text-lg font-bold text-center text-primary mb-3">
              ĐỘI {state.winner === 1 ? "1" : "2"}
            </p>

            <div className="text-center text-gray-600 mb-4">
              Tỉ số:{" "}
              <span className="font-bold text-gray-800">
                {state.score1} - {state.score2}
              </span>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full h-10 text-sm font-bold"
              >
                <RotateCcw className="mr-2 w-4 h-4" />
                Chơi lại
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full h-10 text-sm"
              >
                Trang chủ
              </Button>
            </div>

            {saved && (
              <p className="mt-3 text-xs text-green-600 font-medium text-center">
                <CheckCircle2 className="w-3 h-3 inline mr-1" /> Đã lưu kết quả
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}