import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowRight, Coins, Settings2 } from "lucide-react";
import { PlayerSetup } from "@/components/PlayerSetup";
import { CoinTossModal } from "@/components/CoinTossModal";

export default function Home() {
  const [, setLocation] = useLocation();

  // Form State
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");

  // Coin Toss State
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [firstServer, setFirstServer] = useState<1 | 2>(1); // Default to team 1, updated by coin toss

  const handleStart = () => {
    // Simple validation
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      alert("Vui lòng nhập tên cho tất cả người chơi!");
      return;
    }

    // Pass data via URL params (simple and stateless)
    const params = new URLSearchParams({
      t1p1,
      t1p2,
      t2p1,
      t2p2,
      win: winningScore,
      serve: String(firstServer),
    });

    setLocation(`/match?${params.toString()}`);
  };

  const handleCoinTossComplete = (winner: 1 | 2, choice: "serve" | "side") => {
    if (choice === "serve") {
      setFirstServer(winner);
    } else {
      // If they chose side, the OTHER team serves first (usually)
      setFirstServer(winner === 1 ? 2 : 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 py-8">
          <h1 className="text-4xl md:text-4xl font-display font-black text-primary tracking-tighter uppercase drop-shadow-sm">
            BMB Pickleball Scoreboard
          </h1>
          <p className="text-muted-foreground text-lg">BẢNG ĐIỂM PICKLEBALL</p>
        </div>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <PlayerSetup
            team={1}
            p1={t1p1}
            onP1Change={setT1p1}
            p2={t1p2}
            onP2Change={setT1p2}
          />
          <PlayerSetup
            team={2}
            p1={t2p1}
            onP1Change={setT2p1}
            p2={t2p2}
            onP2Change={setT2p2}
          />
        </div>

        {/* Settings Bar */}
        <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur border-primary/10 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Settings2 className="w-5 h-5" />
              <span>Thiết lập trận đấu</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-sm font-medium whitespace-nowrap">
              Điểm chiến thắng:
            </span>
            <Select value={winningScore} onValueChange={setWinningScore}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chọn điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="11">11 Điểm</SelectItem>
                <SelectItem value="15">15 Điểm</SelectItem>
                <SelectItem value="21">21 Điểm</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              onClick={() => setShowCoinToss(true)}
              className="gap-2 font-semibold"
            >
              <Coins className="w-4 h-4 text-yellow-600" />
              Tung Đồng Xu
            </Button>
          </div>
        </Card>

        {/* Start Action */}
        <div className="pt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleStart}
            className="
              text-lg px-12 py-8 rounded-2xl shadow-xl shadow-primary/30 
              hover:scale-105 transition-all duration-300 gap-3 font-display uppercase tracking-widest
            "
          >
            Bắt đầu trận đấu
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <CoinTossModal
        open={showCoinToss}
        onOpenChange={setShowCoinToss}
        onComplete={handleCoinTossComplete}
      />
    </div>
  );
}
