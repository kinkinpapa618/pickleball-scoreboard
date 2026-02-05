import { motion } from "framer-motion";

interface ScoreBoardProps {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2;
}

export function ScoreBoard({ score1, score2, serverTeam, serverHand }: ScoreBoardProps) {
  return (
    <div className="w-full grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-12 items-center justify-center py-6">
      {/* Team 1 Score */}
      <TeamScore 
        score={score1} 
        label="Đội 1 (Team 1)" 
        isActive={serverTeam === 1} 
        hand={serverHand} 
        align="right"
      />

      {/* VS / Divider */}
      <div className="text-muted-foreground font-bold text-xl opacity-50 translate-y-4">
        -
      </div>

      {/* Team 2 Score */}
      <TeamScore 
        score={score2} 
        label="Đội 2 (Team 2)" 
        isActive={serverTeam === 2} 
        hand={serverHand} 
        align="left"
      />
    </div>
  );
}

function TeamScore({ 
  score, 
  label, 
  isActive, 
  hand, 
  align 
}: { 
  score: number; 
  label: string; 
  isActive: boolean; 
  hand: 1 | 2;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
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
            ${isActive ? 'text-primary drop-shadow-2xl' : 'text-foreground/30'}
          `}
        >
          {score}
        </motion.div>

        {isActive && (
          <motion.div 
            initial={{ opacity: 0, x: align === 'left' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              absolute top-0 ${align === 'left' ? '-left-6 md:-left-8' : '-right-6 md:-right-8'}
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
