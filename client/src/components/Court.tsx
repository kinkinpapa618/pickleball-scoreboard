import { motion, AnimatePresence } from "framer-motion";
import { User, Zap, ShieldCheck, Trophy } from "lucide-react";

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
        top: [fromY, "30%", toY], 
        scale: [1, 1.8, 1],
        opacity: [1, 1, 1],
      }}
      transition={{ duration: 1.2, ease: "circOut", repeat: Infinity, repeatDelay: 1 }}
      className="absolute z-50 w-5 h-5 bg-[#ccff00] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.8)] border-2 border-white flex items-center justify-center"
      style={{ x: "-50%", y: "-50%" }}
    >
      <div className="w-full h-px bg-black/10 rotate-45" />
    </motion.div>
  );
}

function PlayerMarker({ name, isServing, isReceiver, slot, side, compact }: { 
  name: string; isServing: boolean; isReceiver: boolean; slot: number; side: "team1" | "team2"; compact: boolean; 
}) {
  const isTeam1 = side === "team1";

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        {isServing ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[9px] font-black italic tracking-tighter shadow-md"
          >
            <Zap className="w-2.5 h-2.5 inline mr-1 fill-current" /> SERVING
          </motion.div>
        ) : isReceiver ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 text-white px-3 py-0.5 rounded-full text-[9px] font-black italic tracking-tighter shadow-md"
          >
            <ShieldCheck className="w-2.5 h-2.5 inline mr-1" /> RECEIVING
          </motion.div>
        ) : <div className="h-4" />}
      </AnimatePresence>

      <div className={`
        relative transition-all duration-500 overflow-hidden
        ${compact ? "w-16 h-20" : "w-28 h-32"}
        rounded-2xl border-2 flex flex-col items-center justify-center
        ${isServing 
          ? "bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-110 z-30" 
          : "bg-white/90 backdrop-blur-md border-slate-200 shadow-md"
        }
      `}>
        <div className={`absolute top-0 left-0 px-2 py-0.5 text-[8px] font-black ${isTeam1 ? "bg-cyan-500" : "bg-rose-500"} text-white rounded-br-lg`}>
          P{slot}
        </div>

        <div className={`mb-1 p-2 rounded-full ${isServing ? "bg-indigo-50" : "bg-slate-50"}`}>
          <User className={`${compact ? "w-5 h-5" : "w-8 h-8"} ${isServing ? "text-indigo-600" : "text-slate-300"}`} />
        </div>

        <span className={`px-2 w-full text-center truncate font-black italic tracking-tight uppercase ${compact ? "text-[10px]" : "text-xs"} ${isServing ? "text-slate-900" : "text-slate-400"}`}>
          {name || "PLAYER"}
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
    const x = team === 1 ? (compact ? "18%" : "20%") : (compact ? "82%" : "80%");
    const y = (team === 1 ? pos === "right" : pos === "left") ? "75%" : "25%";

    return { 
      id: pid, name: names[pid as keyof typeof names], x, y, 
      isServing: pid === serverPlayerId, isReceiver: pid === receiverPlayerId, 
      slot: player, side: team === 1 ? "team1" : "team2" as any 
    };
  };

  const players = [getPlayerInfo(1, 1), getPlayerInfo(1, 2), getPlayerInfo(2, 1), getPlayerInfo(2, 2)];
  const activeSrv = players.find(p => p.isServing);
  const activeRcv = players.find(p => p.isReceiver);

  return (
    <div className={`relative w-full bg-slate-200 overflow-hidden border-[4px] border-white shadow-inner ${compact ? "aspect-[4/3] rounded-[2rem]" : "aspect-[16/9] rounded-[3rem]"}`}>

      {/* PROFESSIONAL LIGHT COURT SURFACE */}
      <div className="absolute inset-0 bg-indigo-500/90">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Kitchen Area - Lighter contrast */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div className="w-[30%] h-full bg-indigo-600/40 border-x-[3px] border-white/40" />
        </div>

        {/* Boundary Lines - White & Sharp */}
        <div className="absolute inset-[3%] border-[3px] border-white/60" />
        <div className="absolute top-1/2 left-[3%] right-[3%] h-[2px] bg-white/40 -translate-y-1/2" />

        {/* Net Shadow & Net */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10" />
      </div>

      {/* Score Header - Floating Light Style */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 bg-white/90 backdrop-blur-xl px-6 py-2 rounded-full shadow-xl border border-white">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-cyan-500 uppercase">T1</span>
          <span className="text-3xl font-black text-slate-900 italic">{score1}</span>
        </div>
        <div className="h-8 w-px bg-slate-100" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-rose-500 uppercase">T2</span>
          <span className="text-3xl font-black text-slate-900 italic">{score2}</span>
        </div>
      </div>

      {activeSrv && activeRcv && (
        <Ball fromX={activeSrv.x} fromY={activeSrv.y} toX={activeRcv.x} toY={activeRcv.y} serverId={activeSrv.id} />
      )}

      {players.map((p) => (
        <motion.div
          key={p.id} className="absolute z-20"
          animate={{ left: p.x, top: p.y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ x: "-50%", y: "-50%" }}
        >
          <PlayerMarker {...p} compact={compact} />
        </motion.div>
      ))}

      {/* Footer Info */}
      <div className="absolute bottom-6 left-8 flex items-center gap-3">
        {firstServe && (
          <div className="bg-[#ccff00] text-black px-4 py-1 rounded-full font-black text-[9px] italic shadow-md">
            STARTING 0-0-2
          </div>
        )}
        <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white font-black text-[9px] italic border border-white/20">
          PRO SERIES 2026
        </div>
      </div>
    </div>
  );
}