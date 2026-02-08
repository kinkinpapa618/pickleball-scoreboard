import { motion, AnimatePresence } from "framer-motion";
import { User, Zap, CircleDot } from "lucide-react"; // Đã đảm bảo sử dụng Zap và CircleDot

type Position = "left" | "right";

interface CourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverHand: 1 | 2;
  score1: number;
  score2: number;
  firstServe: boolean;
  compact?: boolean;
}

function Ball({ fromX, fromY, toX, toY, serverId }: { fromX: string, fromY: string, toX: string, toY: string, serverId: string }) {
  return (
    <motion.div
      key={serverId}
      initial={{ left: fromX, top: fromY, scale: 0, opacity: 0 }}
      animate={{ 
        left: [fromX, "50%", toX], 
        top: [fromY, "35%", toY], 
        scale: [1, 1.5, 1],
        opacity: [1, 1, 1]
      }}
      transition={{ 
        duration: 1.5, 
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1
      }}
      className="absolute z-50 w-4 h-4 md:w-5 md:h-5 bg-[#d9f99d] rounded-full shadow-[0_0_20px_#bef264] border border-black/20"
      style={{ x: "-50%", y: "-50%" }}
    />
  );
}

function PlayerMarker({ name, isServing, isReceiver, slot, side, compact }: { 
  name: string; isServing: boolean; isReceiver: boolean; slot: number; side: "team1" | "team2"; compact: boolean; 
}) {
  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      <div className="h-6 flex items-end justify-center">
        <AnimatePresence mode="wait">
          {isServing && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0 }}
              className="flex items-center gap-1 bg-yellow-400 text-yellow-950 px-2 py-0.5 rounded-full text-[9px] font-black shadow-[0_0_10px_#facc15]"
            >
              <Zap className="w-3 h-3 fill-current" /> {/* SỬ DỤNG ZAP Ở ĐÂY */}
              PHÁT
            </motion.div>
          )}
          {isReceiver && !isServing && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0 }}
              className="flex items-center gap-1 bg-sky-400 text-sky-950 px-2 py-0.5 rounded-full text-[9px] font-black"
            >
              <CircleDot className="w-3 h-3" /> {/* SỬ DỤNG CIRCLEDOT Ở ĐÂY */}
              ĐỠ
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`relative transition-all duration-500 ${compact ? "w-14 h-16" : "w-24 h-28"} rounded-2xl border-2 flex flex-col items-center justify-center ${isServing ? "bg-white border-yellow-400 shadow-xl scale-110 z-30" : "bg-white/10 backdrop-blur-md border-white/20"}`}>
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${side === "team1" ? "bg-blue-600" : "bg-red-600"} text-white`}>
          {slot}
        </div>
        <User className={`${compact ? "w-4 h-4" : "w-8 h-8"} ${isServing ? "text-yellow-600" : "text-white"}`} />
        <span className={`px-1 w-full text-center truncate font-bold ${compact ? "text-[10px]" : "text-xs"} ${isServing ? "text-slate-900" : "text-white"}`}>
          {name.split(" ")[0]}
        </span>
      </div>
    </div>
  );
}

export function Court({ positions, serverTeam, names, score1, score2, serverHand, firstServe, compact = false }: CourtProps) {
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPosition = positions[serverPlayerId];

  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverPlayerId = Object.keys(positions).find(
    (pid) => pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPosition
  );

  const getPlayerInfo = (team: number, player: number) => {
    const pid = `t${team}p${player}`;
    const pos = positions[pid];
    let x = team === 1 ? (compact ? "18%" : "20%") : (compact ? "82%" : "80%");
    let y = (team === 1 ? pos === "right" : pos === "left") ? "75%" : "25%";

    return { id: pid, name: names[pid as keyof typeof names], x, y, isServing: pid === serverPlayerId, isReceiver: pid === receiverPlayerId, slot: player, side: team === 1 ? "team1" : "team2" as any };
  };

  const players = [getPlayerInfo(1, 1), getPlayerInfo(1, 2), getPlayerInfo(2, 1), getPlayerInfo(2, 2)];
  const server = players.find(p => p.isServing);
  const receiver = players.find(p => p.isReceiver);

  return (
    <div className={`relative w-full bg-slate-900 overflow-hidden shadow-2xl border-4 border-slate-800 ${compact ? "aspect-[4/3] rounded-xl" : "aspect-[16/9] rounded-[2rem]"}`}>

      {/* MẶT SÂN */}
      <div className="absolute inset-0 bg-[#1e40af]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,transparent_20%,#1e3a8a_100%)]" />
        <div className="absolute inset-0 flex justify-center">
          <div className="w-[28%] h-full bg-blue-900/40 border-x-4 border-white/50" />
        </div>
        <div className="absolute inset-[3%] border-[4px] border-white/80" />
        <div className="absolute top-1/2 left-[3%] right-[3%] h-1 bg-white/60 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-white shadow-2xl z-10" />
      </div>

      {/* HIỂN THỊ TRẠNG THÁI FIRST SERVE */}
      {firstServe && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className="bg-yellow-400 text-yellow-950 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg animate-pulse">
            LƯỢT PHÁT ĐẦU (0-0-2)
          </div>
        </div>
      )}

      {/* BALL */}
      {server && receiver && (
        <Ball 
          fromX={server.x} fromY={server.y} 
          toX={receiver.x} toY={receiver.y} 
          serverId={server.id} 
        />
      )}

      {/* PLAYERS */}
      {players.map((p) => (
        <motion.div
          key={p.id}
          className="absolute z-20"
          animate={{ left: p.x, top: p.y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ x: "-50%", y: "-50%" }}
        >
          <PlayerMarker 
            name={p.name}
            isServing={p.isServing}
            isReceiver={p.isReceiver}
            slot={p.slot}
            side={p.side}
            compact={compact}
          />
        </motion.div>
      ))}

      {/* SCORE OVERLAY */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex bg-black/60 backdrop-blur px-5 py-2 rounded-2xl border border-white/10 gap-4">
        <div className="text-center"><p className="text-[10px] text-blue-400 font-bold">T1</p><p className="text-xl font-black text-white">{score1}</p></div>
        <div className="w-[1px] bg-white/20 self-stretch" />
        <div className="text-center"><p className="text-[10px] text-red-400 font-bold">T2</p><p className="text-xl font-black text-white">{score2}</p></div>
      </div>
    </div>
  );
}