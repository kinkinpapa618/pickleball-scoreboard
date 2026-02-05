import { motion } from "framer-motion";
import { User, Shield } from "lucide-react";

type Position = "left" | "right";

interface CourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverHand: 1 | 2;
  score1: number;
  score2: number;
}

export function Court({ positions, serverTeam, names, serverHand, score1, score2 }: CourtProps) {
  
  // Identify the current server to highlight them
  // Logic: 
  // If Team 1 Serving: 
  //   Even Score -> Player on Right serves
  //   Odd Score -> Player on Left serves
  // BUT: Pickleball server identification relies on who *started* serving and tracking rotation.
  // Simplification for UI: We know who is in which box (positions).
  // Standard serve rules: Even score serves from Right, Odd from Left.
  // We highlight the player in the correct serving quadrant based on the score.

  const isT1Serving = serverTeam === 1;
  const currentScore = isT1Serving ? score1 : score2;
  const serveSide = currentScore % 2 === 0 ? "right" : "left"; 

  const isServer = (pid: string, team: 1 | 2) => {
    if (team !== serverTeam) return false;
    return positions[pid] === serveSide;
  };

  return (
    <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 select-none">
      {/* Court Surface */}
      <div className="absolute inset-0 bg-blue-600 flex flex-col">
        {/* Top Side (Team 2) */}
        <div className="flex-1 relative border-b-2 border-white/30 flex">
          {/* Top Left (Team 2 Right from their perspective, Left from ours) */}
          <div className="flex-1 border-r border-white/20 relative">
             <PlayerMarker 
               name={names.t2p2} 
               isServing={isServer("t2p2", 2)}
               isTop={true}
             />
          </div>
          {/* Top Right */}
          <div className="flex-1 relative">
            <PlayerMarker 
               name={names.t2p1} 
               isServing={isServer("t2p1", 2)}
               isTop={true}
             />
          </div>
          
          {/* Kitchen Zone Top */}
          <div className="absolute bottom-0 w-full h-1/4 bg-blue-500/30 border-t border-dashed border-white/20"></div>
        </div>

        {/* Net */}
        <div className="h-2 bg-white/90 w-full shadow-sm z-10 relative flex items-center justify-center">
          <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')] opacity-50"></div>
        </div>

        {/* Bottom Side (Team 1) */}
        <div className="flex-1 relative border-t-2 border-white/30 flex">
           {/* Kitchen Zone Bottom */}
           <div className="absolute top-0 w-full h-1/4 bg-blue-500/30 border-b border-dashed border-white/20 pointer-events-none"></div>

          {/* Bottom Left */}
          <div className="flex-1 border-r border-white/20 relative pt-12">
            <PlayerMarker 
               name={names.t1p2} 
               isServing={isServer("t1p2", 1)}
               isTop={false}
             />
          </div>
          {/* Bottom Right */}
          <div className="flex-1 relative pt-12">
            <PlayerMarker 
               name={names.t1p1} 
               isServing={isServer("t1p1", 1)}
               isTop={false}
             />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerMarker({ name, isServing, isTop }: { name: string, isServing: boolean, isTop: boolean }) {
  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute left-0 right-0 flex justify-center items-center ${isTop ? 'top-4' : 'bottom-8'}`}
    >
      <div className={`
        flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
        ${isServing ? 'scale-110' : 'opacity-80 scale-95'}
      `}>
        {isServing && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="text-yellow-400 drop-shadow-lg"
          >
            <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
          </motion.div>
        )}
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm md:text-base shadow-lg backdrop-blur-sm
          ${isServing 
            ? 'bg-white text-blue-900 border-2 border-yellow-400' 
            : 'bg-black/40 text-white border border-white/20'}
        `}>
          <User className="w-4 h-4" />
          {name || "Player"}
        </div>
      </div>
    </motion.div>
  );
}
