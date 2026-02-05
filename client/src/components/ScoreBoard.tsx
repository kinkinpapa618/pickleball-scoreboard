import { motion } from "framer-motion";

interface ScoreBoardProps {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2;
}

export function ScoreBoard({ score1, score2, serverTeam, serverHand }: ScoreBoardProps) {
  return (
    <div className="w-full flex items-center justify-center gap-4 md:gap-8 py-6">
      <div className="flex items-center gap-4 md:gap-8">
        <div className="text-7xl md:text-9xl font-display font-bold text-primary drop-shadow-2xl">
          {score1}
        </div>
        <div className="text-4xl md:text-6xl font-display font-bold opacity-30">
          -
        </div>
        <div className="text-7xl md:text-9xl font-display font-bold text-primary drop-shadow-2xl">
          {score2}
        </div>
        <div className="text-4xl md:text-6xl font-display font-bold opacity-30">
          -
        </div>
        <div className="bg-accent text-accent-foreground text-xl md:text-3xl font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
          TAY {serverHand}
        </div>
      </div>
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
