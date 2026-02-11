import { motion } from "framer-motion";

interface ScoreBoardProps {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2;
  compact?: boolean;
}

export function ScoreBoard({
  score1,
  score2,
  serverTeam,
  serverHand,
  compact,
}: ScoreBoardProps) {
  if (compact) {
    return (
      <div className="flex justify-center items-center">
        <div className="flex items-center gap-8 bg-white/10  px-6 py-3 rounded-2xl shadow-xl ">
          <div className="flex flex-col items-center">
            <span className="text-[13px] font-black text-black-500 uppercase">
              {serverTeam === 1 ? "TEAM 1" : "TEAM 2"}
            </span>
            <span className="text-5xl font-black text-cyan-400">{score1}</span>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-[13px] font-black text-black-500 uppercase">
              {serverTeam === 2 ? "TEAM 1" : "TEAM 2"}
            </span>
            <span className="text-5xl font-black text-rose-500">{score2}</span>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-[13px] font-black text-black-500 uppercase">
              --TAY--
            </span>
            <span className="text-5xl font-black text-green-500">
              {serverHand}
            </span>
          </div>
        </div>
      </div>
    );
  }
  6;

  // ... (giữ nguyên phần trên cho đến hết hàm TeamScore)

  return (
    <div className="flex justify-between items-center w-full max-w-4xl mx-auto bg-background/50 backdrop-blur-sm p-8 rounded-3xl border shadow-2xl">
      <TeamScore
        score={score1}
        label="Đội 1"
        isActive={serverTeam === 1}
        hand={serverHand}
        align="left"
      />

      <div className="flex flex-col items-center px-4">
        <div className="h-20 w-[2px] bg-border/50 hidden md:block" />
        <span className="text-4xl md:text-6xl font-light text-muted-foreground/20 my-4">
          VS
        </span>
        <div className="h-20 w-[2px] bg-border/50 hidden md:block" />
      </div>

      <TeamScore
        score={score2}
        label="Đội 2"
        isActive={serverTeam === 2}
        hand={serverHand}
        align="right"
      />
    </div>
  );
} // <--- Đóng hàm ScoreBoard

// Hàm TeamScore này nên được đặt RA NGOÀI hàm ScoreBoard hoặc giữ nguyên nếu bạn muốn nó là hàm con
function TeamScore({
  score,
  label,
  isActive,
  hand,
  align,
}: {
  score: number;
  label: string;
  isActive: boolean;
  hand: 1 | 2;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}
    >
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </span>

      <div className="relative">
        <motion.div
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`
              text-7xl md:text-9xl font-display font-bold leading-none tracking-tighter
              ${isActive ? "text-primary drop-shadow-2xl" : "text-foreground/30"}
            `}
        >
          {score}
        </motion.div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: align === "left" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
                absolute top-0 ${align === "left" ? "-left-6 md:-left-8" : "-right-6 md:-right-8"}
              `}
          >
            <div className="bg-accent text-accent-foreground text-xs md:text-sm font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
              TAY {hand}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
