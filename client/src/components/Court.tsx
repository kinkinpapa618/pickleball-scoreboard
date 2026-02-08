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

// --- High-End Ball Effect ---
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
        rotate: 360
      }}
      transition={{ duration: 1.4, ease: "circOut", repeat: Infinity, repeatDelay: 1 }}
      className="absolute z-50 w-5 h-5 bg-[#ccff00] rounded-full shadow-[0_0_25px_#ccff00] border-2 border-white/30 flex items-center justify-center"
      style={{ x: "-50%", y: "-50%" }}
    >
      <div className="w-full h-px bg-black/20 rotate-45" />
    </motion.div>
  );
}

// --- Premium Player Card ---
function PlayerMarker({ name, isServing, isReceiver, slot, side, compact }: { 
  name: string; isServing: boolean; isReceiver: boolean; slot: number; side: "team1" | "team2"; compact: boolean; 
}) {
  const isTeam1 = side === "team1";

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        {isServing ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#ccff00] text-black px-3 py-0.5 rounded-sm text-[9px] font-black italic tracking-tighter shadow-[0_0_15px_#ccff00]"
          >
            <Zap className="w-3 h-3 inline mr-1 fill-current" /> PHÁT BÓNG
          </motion.div>
        ) : isReceiver ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white text-black px-3 py-0.5 rounded-sm text-[9px] font-black italic tracking-tighter"
          >
            <ShieldCheck className="w-3 h-3 inline mr-1" /> ĐỠ BÓNG
          </motion.div>
        ) : <div className="h-4" />}
      </AnimatePresence>

      <div className={`
        relative transition-all duration-500 overflow-hidden
        ${compact ? "w-16 h-20" : "w-28 h-32"}
        rounded-tr-2xl rounded-bl-2xl border-2 flex flex-col items-center justify-center
        ${isServing 
          ? "bg-slate-900 border-[#ccff00] shadow-[0_0_30px_rgba(204,255,0,0.2)] scale-110 z-30" 
          : "bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl"
        }
      `}>
        {/* Slot Ribbon */}
        <div className={`absolute top-0 left-0 px-2 py-0.5 text-[8px] font-black ${isTeam1 ? "bg-cyan-500" : "bg-rose-500"} text-white`}>
          P{slot}
        </div>

        <div className={`mb-1 p-2 rounded-full ${isServing ? "bg-[#ccff00]/10" : "bg-white/5"}`}>
          <User className={`${compact ? "w-5 h-5" : "w-8 h-8"} ${isServing ? "text-[#ccff00]" : "text-white/60"}`} />
        </div>

        <span className={`px-2 w-full text-center truncate font-black italic tracking-tight uppercase ${compact ? "text-[10px]" : "text-xs"} ${isServing ? "text-white" : "text-white/40"}`}>
          {name || "ATHLETE"}
        </span>

        {/* Dynamic Bottom Bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${isServing ? "bg-[#ccff00]" : isTeam1 ? "bg-cyan-500/50" : "bg-rose-500/50"}`} />
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
    <div className={`relative w-full bg-[#050505] overflow-hidden border-[6px] border-slate-800 ${compact ? "aspect-[4/3] rounded-2xl" : "aspect-[16/9] rounded-[3rem]"}`}>

      {/* PROFESSIONAL COURT SURFACE */}
      <div className="absolute inset-0 bg-[#0f172a]">
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Kitchen (Non-Volley Zone) */}

        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div className="w-[30%] h-full bg-slate-800/60 border-x-[3px] border-white/20" />
        </div>

        {/* Boundary Lines with Glow */}
        <div className="absolute inset-[3%] border-[3px] border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
        <div className="absolute top-1/2 left-[3%] right-[3%] h-[2px] bg-white/20 -translate-y-1/2" />

        {/* Center Net */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gradient-to-b from-transparent via-white/80 to-transparent z-10" />
      </div>

      {/* MATCH STATUS HEADER */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl px-5 py-2 rounded-full border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">Team-1</span>
          <span className="text-3xl font-black text-white italic">{score1}</span>
        </div>
        <div className="h-10 w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-rose-500 tracking-widest uppercase">Team-2</span>
          <span className="text-3xl font-black text-white italic">{score2}</span>
        </div>
      </div>

      {/* BALL SYSTEM */}
      {activeSrv && activeRcv && (
        <Ball fromX={activeSrv.x} fromY={activeSrv.y} toX={activeRcv.x} toY={activeRcv.y} serverId={activeSrv.id} />
      )}

      {/* ATHLETES */}
      {players.map((p) => (
        <motion.div
          key={p.id}
          className="absolute z-20"
          animate={{ left: p.x, top: p.y }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{ x: "-50%", y: "-50%" }}
        >
          <PlayerMarker {...p} compact={compact} />
        </motion.div>
      ))}

      {/* MATCH INFO FOOTER */}
      <div className="absolute bottom-6 left-10 flex items-center gap-3">
        {firstServe && (
          <div className="bg-[#ccff00] text-black px-4 py-1 rounded-sm font-black text-[10px] italic shadow-lg">
            FIRST SERVE 0-0-2
          </div>
        )}
        <div className="bg-white/5 backdrop-blur px-4 py-1 rounded-sm border border-white/10 text-white/40 font-black text-[10px] italic">
          CHAMPIONSHIP 2026
        </div>
      </div>

      <div className="absolute bottom-6 right-10 flex items-center gap-2 opacity-30">
        <Trophy className="w-4 h-4 text-white" />
        <span className="text-white font-black italic text-sm tracking-tighter">BMB SCOREPRO</span>
      </div>
    </div>
  );
}