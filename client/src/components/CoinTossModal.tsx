import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as lucideReact from "lucide-react";

interface CoinTossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (winner: 1 | 2, choice: "serve" | "side") => void;
  compact?: boolean;
}

export function CoinTossModal({
  open,
  onOpenChange,
  onComplete,
}: CoinTossModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<1 | 2 | null>(null);

  const handleToss = () => {
    setIsSpinning(true);
    setResult(null);

    setTimeout(() => {
      const winner = Math.random() > 0.5 ? 1 : 2;
      setResult(winner);
      setIsSpinning(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-slate-100 text-slate-900 max-w-[320px] rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-center font-black italic uppercase tracking-tighter text-blue-500">
            Coin Toss
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center gap-6">
          {/* Animation Đồng xu */}
          <div className="relative w-24 h-24">
            <motion.div
              animate={
                isSpinning
                  ? { rotateY: 1800 }
                  : { rotateY: result === 2 ? 180 : 0 }
              }
              transition={{ duration: 2, ease: "easeOut" }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Mặt trước - Đội 1 */}
              <div className="absolute inset-0 bg-blue-500 rounded-full border-4 border-blue-600 flex items-center justify-center font-black text-2xl text-white backface-hidden">
                T1
              </div>
              {/* Mặt sau - Đội 2 */}
              <div className="absolute inset-0 bg-orange-500 rounded-full border-4 border-orange-600 flex items-center justify-center font-black text-xl text-white backface-hidden [transform:rotateY(180deg)]">
                BMB
              </div>
            </motion.div>
          </div>

          {!result && !isSpinning && (
            <Button
              onClick={handleToss}
              className="bg-blue-500 text-white font-black italic w-full rounded-xl"
            >
              <lucideReact.Coins className="w-4 h-4 mr-2" /> TUNG XU
            </Button>
          )}

          {result && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-3"
            >
              <p className="text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Team {result} thắng! Chọn quyền:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    onComplete(result, "serve");
                    onOpenChange(false);
                  }}
                  className="bg-blue-500 border border-blue-600 hover:bg-blue-600 text-white text-[10px] font-black italic rounded-xl py-6"
                >
                  BÓNG
                </Button>

                <Button
                  onClick={() => {
                    onComplete(result, "side");
                    onOpenChange(false);
                  }}
                  className="bg-orange-500 border border-orange-600 hover:bg-orange-600 text-white text-[10px] font-black italic rounded-xl py-6"
                >
                  SÂN
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
