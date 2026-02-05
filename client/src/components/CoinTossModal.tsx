import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, ArrowLeftRight } from "lucide-react";
import confetti from "canvas-confetti";

interface CoinTossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (winner: 1 | 2, choice: "serve" | "side") => void;
}

export function CoinTossModal({ open, onOpenChange, onComplete }: CoinTossModalProps) {
  const [step, setStep] = useState<"tossing" | "result" | "choice">("tossing");
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  const startToss = () => {
    setStep("tossing");
    
    // Simulate coin spin duration
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 1 : 2;
      setWinner(result);
      setStep("result");
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FACC15', '#A855F7']
      });
    }, 1500);
  };

  const handleChoice = (choice: "serve" | "side") => {
    if (winner) {
      onComplete(winner, choice);
      onOpenChange(false);
      // Reset state after a delay for next time
      setTimeout(() => {
        setStep("tossing");
        setWinner(null);
      }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display uppercase tracking-wider">
            {step === "tossing" ? "Đang tung đồng xu..." : step === "result" ? "Kết quả" : "Lựa chọn"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center justify-center min-h-[200px]">
          {step === "tossing" && (
            <motion.div
              animate={{ rotateY: 3600 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              onAnimationComplete={() => { /* Handled by setTimeout above */ }}
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-xl border-4 border-yellow-200 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">$</span>
              </div>
            </motion.div>
          )}

          {step === "result" && winner && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-lg text-muted-foreground">Đội chiến thắng là</div>
              <div className="text-5xl font-black text-primary font-display">
                ĐỘI {winner}
              </div>
              <Button size="lg" className="w-full mt-4" onClick={() => setStep("choice")}>
                Tiếp tục
              </Button>
            </motion.div>
          )}

          {step === "choice" && winner && (
            <div className="space-y-4 w-full">
              <p className="text-muted-foreground mb-4">
                Đội {winner} muốn chọn quyền gì?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleChoice("serve")}
                >
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <span className="font-bold">Phát Bóng</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleChoice("side")}
                >
                  <ArrowLeftRight className="w-8 h-8 text-blue-500" />
                  <span className="font-bold">Chọn Sân</span>
                </Button>
              </div>
            </div>
          )}
          
          {step === "tossing" && (
            <div className="mt-8 text-sm text-muted-foreground animate-pulse">
              Đang quyết định ngẫu nhiên...
            </div>
          )}
          
          {step === "tossing" && !winner && (
             // Trigger effect on mount effectively
             <div ref={() => startToss()} /> 
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
