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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Trang chủ
        </Button>
        <div className="font-display font-bold text-lg text-primary">
          BMB Pickleball Scoreboard
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={state.gameHistory.length === 0}
          className="gap-2"
        >
          <Undo2 className="w-4 h-4" />
          Hoàn tác
        </Button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 flex flex-col gap-5">
        {/* Score Display */}
        <ScoreBoard
          score1={state.score1}
          score2={state.score2}
          serverTeam={state.serverTeam}
          serverHand={state.serverHand}
        />

        {/* Court Visual */}
        {/* Court Visual */}
        <div className="w-full">
          <Court
            positions={state.positions}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            names={names}
            score1={state.score1}
            score2={state.score2}
            firstServe={state.firstServe} // Thêm dòng này
          />
        </div>

        {/* Control Pad */}
        <div className="grid grid-cols-2 gap-4 mt-auto md:mt-8 mb-8 h-32 md:h-40">
          <Button
            className="h-1/2 rounded-2xl text-xl md:text-3xl font-black uppercase tracking-tight shadow-xl hover:translate-y-[-2px] hover:shadow-2xl transition-all bg-emerald-500 hover:bg-emerald-600 text-white border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
            onClick={scorePoint}
            disabled={!!state.winner}
          >
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />
              Ghi Điểm
            </div>
          </Button>

          <Button
            variant="destructive"
            className="h-1/2 rounded-2xl text-xl md:text-3xl font-black uppercase tracking-tight shadow-xl hover:translate-y-[-2px] hover:shadow-2xl transition-all border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
            onClick={fault}
            disabled={!!state.winner}
          >
            <div className="flex flex-col items-center gap-2">
              <AlertOctagon className="w-8 h-8 md:w-12 md:h-12" />
              Đổi Giao Bóng
            </div>
          </Button>
        </div>
      </main>

      {/* Winner Modal */}
      <Dialog open={!!state.winner}>
        <DialogContent className="sm:max-w-md text-center border-none shadow-none bg-transparent">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 drop-shadow-lg" />
            <DialogTitle className="text-4xl font-black text-foreground mb-2">
              CHIẾN THẮNG!
            </DialogTitle>
            <p className="text-2xl text-primary font-bold mb-8">
              ĐỘI {state.winner === 1 ? "1" : "2"}
            </p>

            <div className="text-lg text-muted-foreground mb-8">
              Tỉ số:{" "}
              <span className="font-bold text-foreground">
                {state.score1} - {state.score2}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full font-bold text-lg h-14"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Chơi lại
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full font-bold h-14"
                onClick={() => setLocation("/")}
              >
                Về trang chủ
              </Button>
            </div>

            {saved && (
              <p className="mt-4 text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Kết quả đã được lưu
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
