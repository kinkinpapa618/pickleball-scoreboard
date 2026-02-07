import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import * as Court from "@/components/Court";
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
  const firstServe = search.get("firstServe") === "true"

  const names = { t1p1, t1p2, t2p1, t2p2 };

  // Game Hook - Sử dụng logic đã cập nhật
  const { state, scorePoint, fault, undo, getMatchData } = useGameLogic(
    winningScore,
    initialServer,
    names,
  );

  // Database Mutation
  const createMatch = useCreateMatch();
  const [saved, setSaved] = useState(false);

  // Hiệu ứng thắng cuộc và tự động lưu
  useEffect(() => {
    if (state.winner) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
        <div className="font-bold text-lg text-primary tracking-tight">
          BMB <span className="text-emerald-600">PICKLEBALL</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={state.gameHistory.length === 0}
          className="gap-2 border-slate-200"
        >
          <Undo2 className="w-4 h-4" />
          Hoàn tác
        </Button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">

        {/* 1. Score Display - Hiển thị 3 số chuẩn */}
        <div className="w-full">
          <ScoreBoard
            score1={state.score1}
            score2={state.score2}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            firstServe={state.firstServe}
          />
        </div>

        {/* 2. Court Visual - Hiển thị sân và vị trí cầu thủ */}
        <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <Court.Court
            positions={state.positions}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            names={names}
            score1={state.score1}
            score2={state.score2}
            firstServe={state.firstServe}
          />
        </div>

        {/* 3. Control Pad - Nút bấm lớn dễ thao tác trên sân */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-6">
          <Button
            className="h-28 md:h-36 rounded-3xl text-xl md:text-2xl font-black uppercase shadow-lg hover:shadow-emerald-200 transition-all bg-emerald-500 hover:bg-emerald-600 text-white border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2"
            onClick={scorePoint}
            disabled={!!state.winner}
          >
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
              <span>Ghi Điểm</span>
              <span className="text-[10px] opacity-80 font-normal">Team {state.serverTeam} +1</span>
            </div>
          </Button>

          <Button
            variant="destructive"
            className="h-28 md:h-36 rounded-3xl text-xl md:text-2xl font-black uppercase shadow-lg hover:shadow-red-200 transition-all border-b-8 border-red-800 active:border-b-0 active:translate-y-2"
            onClick={fault}
            disabled={!!state.winner}
          >
            <div className="flex flex-col items-center gap-2">
              <AlertOctagon className="w-8 h-8 md:w-10 md:h-10" />
              <span>Lỗi / Đổi Giao</span>
              <span className="text-[10px] opacity-80 font-normal">
                {state.serverHand === 1 && !state.firstServe ? "Sang Server 2" : "Side Out"}
              </span>
            </div>
          </Button>
        </div>
      </main>

      {/* Winner Modal */}
      <Dialog open={!!state.winner}>
        <DialogContent className="sm:max-w-md text-center border-none shadow-none bg-transparent p-0">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-emerald-500 relative overflow-hidden">
            {/* Trang trí background */}
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-md" />
            <DialogTitle className="text-3xl font-black text-slate-900 mb-1">
              CHIẾN THẮNG!
            </DialogTitle>
            <p className="text-xl text-emerald-600 font-bold mb-6">
              ĐỘI {state.winner === 1 ? "1" : "2"}
            </p>

            <div className="bg-slate-100 rounded-2xl p-4 mb-8">
              <div className="text-sm text-slate-500 uppercase font-bold mb-1">Tỉ số chung cuộc</div>
              <div className="text-4xl font-mono font-black text-slate-800">
                {state.score1} — {state.score2}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full font-bold text-lg h-14 rounded-2xl bg-slate-900"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Đấu lại
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full font-bold h-12 text-slate-500"
                onClick={() => setLocation("/")}
              >
                Thoát menu
              </Button>
            </div>

            {saved && (
              <p className="mt-4 text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu vào lịch sử
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
