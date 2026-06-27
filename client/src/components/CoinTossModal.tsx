import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as lucideReact from "lucide-react";
import { gsap } from "gsap";

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

  const coinRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const handleToss = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    const winner = Math.random() > 0.5 ? 1 : 2;
    // Calculate final rotation based on winner
    // Winner 1 -> Face up (0 deg), Winner 2 -> Face down (180 deg)
    const finalRotY = 1800 + (winner === 2 ? 180 : 0);
    const finalRotX = 360 * 3; // 3 full flips on X-axis too

    const tl = gsap.timeline({
      onComplete: () => {
        setResult(winner);
        setIsSpinning(false);
      }
    });

    // Reset rotation and position
    gsap.set(coinRef.current, { rotateY: 0, rotateX: 0, y: 0, scale: 1 });
    gsap.set(shadowRef.current, { scale: 1, opacity: 0.4, filter: "blur(4px)" });

    // Flip upward and land with bounce
    tl.to(coinRef.current, {
      y: -180, // Launch high
      scale: 1.35, // Closer to viewer
      duration: 0.9,
      ease: "power2.out"
    })
    .to(coinRef.current, {
      y: 0, // Fall back to floor
      scale: 1, // Back to normal size
      duration: 0.9,
      ease: "bounce.out" // Real physical bounce rebound!
    }, "-=0.15");

    // Spin rotations concurrently
    tl.to(coinRef.current, {
      rotateY: finalRotY,
      rotateX: finalRotX,
      duration: 1.65,
      ease: "power1.out"
    }, 0);

    // Shadow tracking coin height
    tl.to(shadowRef.current, {
      scale: 0.35,
      opacity: 0.1,
      filter: "blur(8px)",
      duration: 0.9,
      ease: "power2.out"
    }, 0)
    .to(shadowRef.current, {
      scale: 1,
      opacity: 0.4,
      filter: "blur(4px)",
      duration: 0.75,
      ease: "power2.in"
    }, 0.9);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-[320px] rounded-[2.5rem] transition-colors shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-black italic uppercase tracking-tighter text-blue-500 text-2xl">
            COIN TOSS
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-6 relative select-none">
          {/* Main 3D Container */}
          <div className="relative flex flex-col items-center justify-center h-48 w-full" style={{ perspective: "1000px" }}>
            
            {/* The Coin */}
            <div 
              ref={coinRef}
              className="w-28 h-28 relative cursor-pointer active:scale-95 transition-transform"
              style={{ transformStyle: "preserve-3d" }}
              onClick={!isSpinning && !result ? handleToss : undefined}
            >
              {/* Face 1: Team 1 (T1) - Blue Metallic Gold Coin */}
              <div 
                className="absolute inset-0 rounded-full flex flex-col items-center justify-center border-[5px] border-yellow-500 bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 shadow-inner"
                style={{ 
                  backfaceVisibility: "hidden", 
                  boxShadow: "inset 0 0 15px rgba(234, 179, 8, 0.6), 0 4px 10px rgba(0, 0, 0, 0.4)" 
                }}
              >
                {/* Dotted Inner Gold Ring */}
                <div className="absolute inset-1 rounded-full border border-dashed border-yellow-500/50" />
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  T1
                </span>
                <span className="text-[7px] font-black tracking-widest text-yellow-400/70 uppercase">
                  TEAM 1
                </span>
              </div>

              {/* Face 2: Team 2 (T2) - Orange/Red Metallic Gold Coin */}
              <div 
                className="absolute inset-0 rounded-full flex flex-col items-center justify-center border-[5px] border-yellow-500 bg-gradient-to-br from-orange-600 via-orange-800 to-slate-900 overflow-hidden"
                style={{ 
                  backfaceVisibility: "hidden", 
                  transform: "rotateY(180deg)",
                  boxShadow: "inset 0 0 15px rgba(234, 179, 8, 0.6), 0 4px 10px rgba(0, 0, 0, 0.4)" 
                }}
              >
                {/* Dotted Inner Gold Ring */}
                <div className="absolute inset-1 rounded-full border border-dashed border-yellow-500/50" />
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  T2
                </span>
                <span className="text-[7px] font-black tracking-widest text-yellow-400/70 uppercase">
                  TEAM 2
                </span>
              </div>
            </div>

            {/* Premium Soft Shadow Below Coin */}
            <div 
              ref={shadowRef}
              className="w-20 h-3 bg-black/40 rounded-full absolute bottom-4 filter blur-[4px]"
              style={{ transform: "rotateX(75deg)" }}
            />
          </div>

          {!result && !isSpinning && (
            <Button
              onClick={handleToss}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black italic w-full rounded-2xl py-6 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
            >
              <lucideReact.Coins className="w-4 h-4 mr-2" /> TUNG XU PHÂN ĐỊNH
            </Button>
          )}

          {result && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4"
            >
              <p className="text-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                Team {result} thắng! Chọn quyền:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    onComplete(result, "serve");
                    onOpenChange(false);
                  }}
                  className="bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-black italic rounded-2xl py-6 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
                >
                  BÓNG
                </Button>

                <Button
                  onClick={() => {
                    onComplete(result, "side");
                    onOpenChange(false);
                  }}
                  className="bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-black italic rounded-2xl py-6 shadow-md shadow-orange-500/10 active:scale-[0.98] transition-all"
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
