import { motion } from "framer-motion";
import { User } from "lucide-react";

type Position = "left" | "right";

interface CourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverHand: 1 | 2;
  score1: number;
  score2: number;
}

function PlayerMarker({
  name,
  isServing,
  isReceiver,
  isTop,
  slot,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  isTop: boolean;
  slot: number;
}) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute left-0 right-0 flex justify-center items-center ${isTop ? "top-4" : "bottom-8"}`}
    >
      <div
        className={`
        flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
        ${isServing ? "scale-110" : "opacity-80 scale-95"}
      `}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">
            {isServing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-9 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)] flex items-center justify-center text-[10px] font-bold text-yellow-900"
              >
                PHÁT
              </motion.div>
            )}
            {isReceiver && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-gray-400 rounded-full shadow-[0_0_10px_rgba(156,163,175,0.6)] flex items-center justify-center text-[10px] font-bold text-gray-900"
              >
                ĐỠ
              </motion.div>
            )}
          </div>
          <div className="bg-white/80 text-[10px] font-bold px-1.5 rounded-full text-blue-900 border border-blue-200">
            SLOT {slot}
          </div>
        </div>
        <div
          className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm md:text-base shadow-lg backdrop-blur-sm
          ${
            isServing
              ? "bg-white text-blue-900 border-2 border-yellow-400"
              : isReceiver
                ? "bg-white/90 text-gray-900 border-2 border-gray-400"
                : "bg-black/40 text-white border border-white/20"
          }
        `}
        >
          <User className="w-4 h-4" />
          {name || "Player"}
        </div>
      </div>
    </motion.div>
  );
}

export function Court({
  positions,
  serverTeam,
  names,
  score1,
  score2,
}: CourtProps) {
  const isT1Serving = serverTeam === 1;
  const currentScore = isT1Serving ? score1 : score2;
  const serveSide = currentScore % 2 === 0 ? "right" : "left";

  const isServer = (pid: string, team: 1 | 2) => {
    if (team !== serverTeam) return false;
    return positions[pid] === serveSide;
  };

  const isReceiver = (pid: string, team: 1 | 2) => {
    if (team === serverTeam) return false;
    return positions[pid] === serveSide;
  };

  return (
    <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 select-none">
      {/* Court Surface */}
      <div className="absolute inset-0 bg-blue-600 flex flex-col">
        {/* Top Side (Team 2) */}
        <div className="flex-1 relative border-b-2 border-white/30 flex">
          {/* Top Left (Slot 1 Player C from their view is Right, but following image: Slot 1 is Top-Left) */}
          <div className="flex-1 border-r border-white/20 relative">
            <PlayerMarker
              name={names.t2p1}
              isServing={isServer("t2p1", 1)}
              isReceiver={isReceiver("t2p1", 1)}
              isTop={true}
              slot={1}
            />
          </div>
          {/* Top Right (Slot 2 Player D) */}
          <div className="flex-1 relative">
            <PlayerMarker
              name={names.t2p2}
              isServing={isServer("t2p2", 2)}
              isReceiver={isReceiver("t2p2", 2)}
              isTop={true}
              slot={2}
            />
          </div>
          <div className="absolute bottom-0 w-full h-1/4 bg-blue-500/30 border-t border-dashed border-white/20"></div>
        </div>

        {/* Net */}
        <div className="h-2 bg-white/90 w-full shadow-sm z-10 relative flex items-center justify-center">
          <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')] opacity-50"></div>
        </div>

        {/* Bottom Side (Team 1) */}
        <div className="flex-1 relative border-t-2 border-white/30 flex">
          <div className="absolute top-0 w-full h-1/4 bg-blue-500/30 border-b border-dashed border-white/20 pointer-events-none"></div>

          {/* Bottom Left (Slot 1 Player A) */}
          <div className="flex-1 border-r border-white/20 relative pt-12">
            <PlayerMarker
              name={names.t1p1}
              isServing={isServer("t1p1", 1)}
              isReceiver={isReceiver("t1p1", 1)}
              isTop={false}
              slot={1}
            />
          </div>
          {/* Bottom Right (Slot 2 Player B) */}
          <div className="flex-1 relative pt-12">
            <PlayerMarker
              name={names.t1p2}
              isServing={isServer("t1p2", 2)}
              isReceiver={isReceiver("t1p2", 2)}
              isTop={false}
              slot={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
