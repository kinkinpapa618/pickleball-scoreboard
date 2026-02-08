import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Coins } from "lucide-react";
import { CoinTossModal } from "@/components/CoinTossModal";

export default function Home() {
  const [, setLocation] = useLocation();

  // Form State
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  const handleStart = () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      alert("Nhập tên đủ 4 người chơi!");
      return;
    }

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
    setFirstServer(choice === "serve" ? winner : (winner === 1 ? 2 : 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2 flex flex-col">
      {/* Header - Mini */}
      <div className="text-center py-1 mb-1">
        <h3 className="text-lg font-black text-primary uppercase">
          PICKLEBALL
        </h3>
        <p className="text-gray-600 text-xs">Scoreboard</p>
      </div>

      {/* Main Content - Ultra Compact */}
      <div className="flex-1 space-y-2">
        {/* Players Section - Ultra Compact */}
        <Card className="p-2 border border-gray-300">
          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-700">Đội 1</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                value={t1p1}
                onChange={(e) => setT1p1(e.target.value)}
                placeholder="Trái"
                className="w-full h-8 text-xs px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={t1p2}
                onChange={(e) => setT1p2(e.target.value)}
                placeholder="Phải"
                className="w-full h-8 text-xs px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="text-center my-1">
            <span className="text-xs font-bold text-gray-500">VS</span>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs font-medium text-red-700">Đội 2</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                value={t2p1}
                onChange={(e) => setT2p1(e.target.value)}
                placeholder="Trái"
                className="w-full h-8 text-xs px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={t2p2}
                onChange={(e) => setT2p2(e.target.value)}
                placeholder="Phải"
                className="w-full h-8 text-xs px-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Settings - Ultra Compact */}
        <Card className="p-2 border border-gray-300">
          <div className="grid grid-cols-2 gap-2">
            {/* Winning Score */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-0.5">
                Điểm thắng
              </label>
              <div className="flex gap-0.5">
                {["11", "15", "21"].map((score) => (
                  <button
                    key={score}
                    onClick={() => setWinningScore(score)}
                    className={`flex-1 h-7 text-xs rounded ${
                      winningScore === score
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* First Server */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-0.5">
                Phát đầu
              </label>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setFirstServer(1)}
                  className={`flex-1 h-7 text-xs rounded ${
                    firstServer === 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Đội 1
                </button>
                <button
                  onClick={() => setFirstServer(2)}
                  className={`flex-1 h-7 text-xs rounded ${
                    firstServer === 2
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Đội 2
                </button>
              </div>
            </div>
          </div>

          {/* Coin Toss */}
          <button
            onClick={() => setShowCoinToss(true)}
            className="w-full mt-2 h-7 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded flex items-center justify-center gap-1"
          >
            <Coins className="w-3 h-3" />
            TUNG XU
          </button>
        </Card>

        {/* Info - Tiny */}
        <div className="bg-blue-50 border border-blue-200 rounded p-1 text-center">
          <p className="text-xs text-blue-700">
            Phát đầu: <span className="font-bold">0-0-2</span>
          </p>
        </div>
      </div>

      {/* Start Button - Compact */}
      <div className="mt-2">
        <Button
          onClick={handleStart}
          className="w-full h-10 text-sm font-bold rounded gap-1"
          disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
        >
          {!t1p1 || !t1p2 || !t2p1 || !t2p2 ? "NHẬP TÊN" : "BẮT ĐẦU"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <CoinTossModal
        open={showCoinToss}
        onOpenChange={setShowCoinToss}
        onComplete={handleCoinTossComplete}
        compact
      />
    </div>
  );
}