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
import { ArrowRight, Coins, Settings2, Users } from "lucide-react";
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
  const [firstServer, setFirstServer] = useState<1 | 2>(1);

  const handleStart = () => {
    // Simple validation
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      alert("Vui lòng nhập tên cho tất cả người chơi!");
      return;
    }

    // Pass data via URL params
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
      setFirstServer(winner === 1 ? 2 : 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8 flex flex-col">
      {/* Header Section - Mobile Optimized */}
      <div className="text-center py-4 md:py-8 mb-4">
        <h3 className="text-2xl md:text-4xl font-display font-black text-primary tracking-tighter uppercase drop-shadow-sm">
          BMB PICKLEBALL
        </h3>
        <p className="text-gray-600 text-sm md:text-base mt-2">
          Hệ thống quản lý và tính điểm trận đấu
        </p>
      </div>

      {/* Main Content - Scrollable for mobile */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Players Section */}
          <Card className="p-4 md:p-6 border-2 border-primary/10 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h4 className="text-lg md:text-xl font-bold text-gray-800">
                THÔNG TIN NGƯỜI CHƠI
              </h4>
            </div>

            {/* Team Setup Grid */}
            <div className="space-y-8">
              <div>
                <h5 className="text-base font-bold text-blue-700 mb-3 px-2 py-1 bg-blue-50 rounded-lg inline-block">
                  ĐỘI 1 🏆
                </h5>
                <div className="space-y-3">
                  <PlayerSetup
                    team={1}
                    p1={t1p1}
                    onP1Change={setT1p1}
                    p2={t1p2}
                    onP2Change={setT1p2}
                    mobile
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent transform -translate-y-1/2"></div>
                <div className="relative flex justify-center">
                  <span className="px-4 py-1 bg-white text-gray-500 text-sm font-medium rounded-full border">
                    VS
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-base font-bold text-red-700 mb-3 px-2 py-1 bg-red-50 rounded-lg inline-block">
                  ĐỘI 2 ⚔️
                </h5>
                <div className="space-y-3">
                  <PlayerSetup
                    team={2}
                    p1={t2p1}
                    onP1Change={setT2p1}
                    p2={t2p2}
                    onP2Change={setT2p2}
                    mobile
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Settings Section */}
          <Card className="p-4 md:p-6 border-2 border-primary/10 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-6 h-6 text-primary" />
              <h4 className="text-lg md:text-xl font-bold text-gray-800">
                THIẾT LẬP TRẬN ĐẤU
              </h4>
            </div>

            <div className="space-y-6">
              {/* Winning Score Selection */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700 block">
                  Điểm chiến thắng
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={winningScore === "11" ? "default" : "outline"}
                    className="h-12 text-base font-medium"
                    onClick={() => setWinningScore("11")}
                  >
                    11
                  </Button>
                  <Button
                    variant={winningScore === "15" ? "default" : "outline"}
                    className="h-12 text-base font-medium"
                    onClick={() => setWinningScore("15")}
                  >
                    15
                  </Button>
                  <Button
                    variant={winningScore === "21" ? "default" : "outline"}
                    className="h-12 text-base font-medium"
                    onClick={() => setWinningScore("21")}
                  >
                    21
                  </Button>
                </div>
              </div>

              {/* First Server Selection */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700 block">
                  Đội phát bóng đầu tiên
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={firstServer === 1 ? "default" : "outline"}
                    className="h-12 text-base font-medium"
                    onClick={() => setFirstServer(1)}
                  >
                    Đội 1
                  </Button>
                  <Button
                    variant={firstServer === 2 ? "default" : "outline"}
                    className="h-12 text-base font-medium"
                    onClick={() => setFirstServer(2)}
                  >
                    Đội 2
                  </Button>
                </div>
              </div>

              {/* Coin Toss Button */}
              <Button
                variant="secondary"
                onClick={() => setShowCoinToss(true)}
                className="w-full h-12 gap-3 text-base font-semibold shadow-md"
              >
                <Coins className="w-5 h-5 text-yellow-600" />
                TUNG XU QUYẾT ĐỊNH
              </Button>
            </div>
          </Card>

          {/* Info Card - Only show on mobile */}
          <div className="md:hidden">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold text-blue-800 text-sm">Lưu ý</h5>
                  <p className="text-blue-600 text-xs mt-1">
                    Đội phát bóng đầu tiên sẽ bắt đầu từ <strong>0-0-2</strong> (chỉ có 1 lượt phát)
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium text-gray-600">Thiết lập hiện tại</div>
              <div className="text-xs text-gray-500">
                {t1p1 || "Chưa có tên"} & {t1p2 || "Chưa có tên"} vs {t2p1 || "Chưa có tên"} & {t2p2 || "Chưa có tên"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">Thắng: {winningScore} điểm</div>
              <div className="text-xs text-gray-500">Phát đầu: Đội {firstServer}</div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 gap-2"
            disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
          >
            {!t1p1 || !t1p2 || !t2p1 || !t2p2 ? (
              "NHẬP ĐỦ TÊN NGƯỜI CHƠI"
            ) : (
              <>
                BẮT ĐẦU TRẬN ĐẤU
                <ArrowRight className="w-6 h-6" />
              </>
            )}
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