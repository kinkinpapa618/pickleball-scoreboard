import { motion, AnimatePresence } from "framer-motion";

interface BadmintonScoreboardProps {
  score1: number;
  score2: number;
  team1Name?: string;
  team2Name?: string;
  servingTeam: 1 | 2;
}

function FlipDigit({ value, color }: { value: number; color: string }) {
  return (
    <div className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden ${color} shadow-lg`} style={{ perspective: "200px" }}>
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
            <span className="text-7xl sm:text-8xl font-black text-white tabular-nums drop-shadow-md" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.2)', transform: "rotateX(0deg)", color: '#ffffff' }}>
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

export function BadmintonScoreboard({
  score1,
  score2,
  team1Name = "Đội 1",
  team2Name = "Đội 2",
  servingTeam,
}: BadmintonScoreboardProps) {

  return (
    <div className="w-full py-4" data-testid="badminton-scoreboard">
      <div className="flex items-center justify-center gap-8 sm:gap-12">
        {/* Team 1 Score */}
        <div className="flex flex-col items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            {servingTeam === 1 && (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider truncate max-w-[100px] ${servingTeam === 1 ? 'text-blue-500' : 'text-muted-foreground'}`}>
              {team1Name}
            </span>
          </div>
          <FlipDigit value={score1} color="bg-blue-600" />
          {servingTeam === 1 && (
            <span className="text-[10px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-widest mt-1">PHÁT BÓNG</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <span className="text-xl sm:text-2xl font-black text-muted-foreground/30 uppercase tracking-widest">VS</span>
        </div>

        {/* Team 2 Score */}
        <div className="flex flex-col items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            {servingTeam === 2 && (
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
            <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider truncate max-w-[100px] ${servingTeam === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {team2Name}
            </span>
          </div>
          <FlipDigit value={score2} color="bg-orange-600" />
          {servingTeam === 2 && (
            <span className="text-[10px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-widest mt-1">PHÁT BÓNG</span>
          )}
        </div>
      </div>
    </div>
  );
}
