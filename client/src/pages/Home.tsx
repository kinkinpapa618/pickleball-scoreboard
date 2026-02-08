import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  const handleStart = () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      alert("Vui lòng nhập tên cho tất cả người chơi!");
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-3 flex flex-col">
      {/* Compact Header */}
      <div className="text-center py-2 mb-2">
        <h3 className="text-xl font-black text-primary tracking-tighter uppercase">
          PICKLEBALL SCORE
        </h3>
        <p className="text-gray-600 text-xs mt-1">BMB Tournament</p>
      </div>

      {/* Main Content - No Scroll */}
      <div className="flex-1 space-y-4">
        {/* Players Section - Compact */}
        <Card className="p-3 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-gray-800">NGƯỜI CHƠI</h4>
          </div>

          {/* Team 1 */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-700">Đội 1</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={t1p1}
                onChange={(e) => setT1p1(e.target.value)}
                placeholder="Slot 1"
                className="w-full h-9 text-sm px-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={t1p2}
                onChange={(e) => setT1p2(e.target.value)}
                placeholder="Slot 2"
                className="w-full h-9 text-sm px-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex justify-center my-1">
            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">VS</div>
          </div>

          {/* Team 2 */}
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs font-medium text-red-700">Đội 2</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={t2p1}
                onChange={(e) => setT2p1(e.target.value)}
                placeholder="Slot 1"
                className="w-full h-9 text-sm px-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={t2p2}
                onChange={(e) => setT2p2(e.target.value)}
                placeholder="Slot 2"
                className="w-full h-9 text-sm px-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Settings Section - Compact */}
        <Card className="p-3 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-gray-800">THIẾT LẬP</h4>
          </div>

          <div className="space-y-3">
            {/* Winning Score */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Điểm thắng
              </label>
              <div className="flex gap-1">
                {["11", "15", "21"].map((score) => (
                  <button
                    key={score}
                    onClick={() => setWinningScore(score)}
                    className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
                      winningScore === score
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* First Server */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Phát đầu
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setFirstServer(1)}
                  className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
                    firstServer === 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Đội 1
                </button>
                <button
                  onClick={() => setFirstServer(2)}
                  className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
                    firstServer === 2
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Đội 2
                </button>
              </div>
            </div>

            {/* Coin Toss */}
            <button
              onClick={() => setShowCoinToss(true)}
              className="w-full h-8 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium rounded-md flex items-center justify-center gap-1 hover:bg-yellow-100 transition-colors"
            >
              <Coins className="w-3 h-3" />
              TUNG XU
            </button>
          </div>
        </Card>

        {/* Quick Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
          <p className="text-xs text-blue-700">
            <span className="font-bold">Lưu ý:</span> Đội phát đầu bắt đầu từ{" "}
            <span className="font-bold text-red-600">0-0-2</span>
          </p>
        </div>
      </div>

      {/* Start Button - Fixed at bottom but not overlapping */}
      <div className="mt-auto pt-3">
        <Button
          onClick={handleStart}
          className="w-full h-12 text-base font-bold rounded-lg shadow-md gap-2"
          disabled={!t1p1 || !t1p2 || !t2p1 || !t2p2}
        >
          {!t1p1 || !t1p2 || !t2p1 || !t2p2 ? (
            "NHẬP ĐỦ TÊN"
          ) : (
            <>
              BẮT ĐẦU
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        {/* Status Bar */}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>
            {t1p1 ? t1p1.substring(0, 6) + (t1p1.length > 6 ? ".." : "") : "___"} & 
            {t1p2 ? t1p2.substring(0, 6) + (t1p2.length > 6 ? ".." : "") : "___"}
          </span>
          <span>vs</span>
          <span>
            {t2p1 ? t2p1.substring(0, 6) + (t2p1.length > 6 ? ".." : "") : "___"} & 
            {t2p2 ? t2p2.substring(0, 6) + (t2p2.length > 6 ? ".." : "") : "___"}
          </span>
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