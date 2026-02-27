import { motion, AnimatePresence } from "framer-motion";

interface ScoreboardProps {
  score1: number;
  score2: number;
  serverHand: 1 | 2;
  team1Name?: string;
  team2Name?: string;
  servingTeam: 1 | 2;
  isFirstServe?: boolean;
}

function FlipDigit({ value, color }: { value: number; color: string }) {
  return (
    <div className={`relative h-24 w-24 sm:h-24 sm:w-24 rounded-lg overflow-hidden ${color} shadow-lg`} style={{ perspective: "200px" }}>
      <div className="absolute inset-0 preserve-3d" style={{ transformStyle: "preserve-3d" }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            <span className="text-6xl sm:text-7xl font-black text-white tabular-nums drop-shadow-md" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.2)', transform: "rotateX(0deg)", color: '#ffffff' }}>
              {value}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
    </div>
  );
}

export default function Scoreboard({
  score1,
  score2,
  serverHand,
  team1Name = "Đội 1",
  team2Name = "Đội 2",
  servingTeam,
  isFirstServe = false,
}: ScoreboardProps) {
  const servingScore = servingTeam === 1 ? score1 : score2;
  const receivingScore = servingTeam === 1 ? score2 : score1;
  const displayServerHand = isFirstServe ? 2 : serverHand;

  const servingTeamName = servingTeam === 1 ? team1Name : team2Name;
  const receivingTeamName = servingTeam === 1 ? team2Name : team1Name;
  const servingColor = servingTeam === 1 ? "bg-cyan-600" : "bg-rose-600";
  const receivingColor = servingTeam === 1 ? "bg-rose-600" : "bg-cyan-600";

  return (
    <div className="w-full" data-testid="scoreboard">
      <div className="flex items-center justify-center gap-6 sm:gap-3">
        <div className="flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${servingTeam === 1 ? "bg-cyan-500" : "bg-rose-500"} animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground truncate max-w-[60px]">
              {servingTeamName}
            </span>
          </div>
          <FlipDigit value={servingScore} color={servingColor} />
          <span className="text-[8px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-widest">PHÁT</span>
        </div>

        <div className="flex flex-col items-center gap-1 px-1">
          <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">---</span>
          <span className="text-2xl sm:text-3xl font-black text-muted-foreground/70 leading-none">TAY</span>
          <div className="bg-foreground/10 dark:bg-white/10 w-20 h-15 sm:w-15 sm:h-15 rounded-md flex items-center justify-center">
            <span className="text-3xl sm:text-3xl font-black text-foreground tabular-nums">{displayServerHand}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${servingTeam === 1 ? "bg-rose-500" : "bg-cyan-500"}`} />
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground truncate max-w-[60px]">
              {receivingTeamName}
            </span>
          </div>
          <FlipDigit value={receivingScore} color={receivingColor} />
          <span className="text-[8px] font-bold uppercase text-muted-foreground/60 tracking-widest">ĐỠ</span>
        </div>
      </div>
    </div>
  );
}
