import { useState } from "react"; // Không cần import React from "react" nữa
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
      <DialogContent className="bg-slate-950 border-white/10 text-white max-w-[320px] rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-center font-black italic uppercase tracking-tighter text-[#ccff00]">
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
              <div className="absolute inset-0 bg-cyan-500 rounded-full border-4 border-white/20 flex items-center justify-center font-black text-2xl backface-hidden">
                T1
              </div>
              {/* Mặt sau - Đội 2 */}
              <div className="absolute inset-0 bg-rose-500 rounded-full border-4 border-white/20 flex items-center justify-center font-black text-2xl backface-hidden [transform:rotateY(180deg)]">
                T2
              </div>
            </motion.div>
          </div>

          {!result && !isSpinning && (
            <Button
              onClick={handleToss}
              className="bg-[#ccff00] text-black font-black italic w-full rounded-xl"
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
              <p className="text-center text-[10px] font-bold uppercase text-white/40 tracking-widest">
                Team {result} thắng! Chọn quyền:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => onComplete(result, "serve")}
                  className="bg-white/5 border border-white/10 hover:bg-[#ccff00] hover:text-black text-[10px] font-black italic rounded-xl py-6"
                >
                  BÓNG
                </Button>

                <Button
                  onClick={() => onComplete(result, "side")}
                  className="bg-white/5 border border-white/10 hover:bg-[#ccff00] hover:text-black text-[10px] font-black italic rounded-xl py-6"
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
} // ĐÂY CHÍNH LÀ DẤU NGOẶC BẠN ĐANG THIẾU
