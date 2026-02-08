import { motion, AnimatePresence } from "framer-motion";
import { User, Zap, CircleDot } from "lucide-react";

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

// --- Hiệu ứng Quả bóng ---
function Ball({ fromX, fromY, toX, toY }: { fromX: string, fromY: string, toX: string, toY: string }) {
  return (
    <motion.div
      key={`${fromX}-${toX}`}
      initial={{ left: fromX, top: fromY, scale: 0, opacity: 0 }}
      animate={{ 
        left: [fromX, "50%", toX], 
        top: [fromY, "40%", toY], 
        scale: [1, 1.4, 1],
        opacity: [1, 1, 1]
      }}
      transition={{ 
        duration: 1.2, 
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.5
      }}
      className="absolute z-50 w-5 h-5 bg-[#d9f99d] rounded-full shadow-[0_0_15px_#bef264] border border-black/20 flex items-center justify-center"
    >
      <div className="w-full h-full rounded-full border-t-2 border-black/5 rotate-45" />
    </motion.div>
  );
}

// --- Component Cầu thủ (Đặt bên ngoài để tránh lỗi render) ---
function PlayerMarker({
  name,
  isServing, // Đảm bảo tên prop là isServing
  isReceiver,
  slot,
  side,
  compact,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  side: "team1" | "team2";
  compact: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-6 flex items-end justify-center">
        <AnimatePresence>
          {isServing && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="flex items-center gap-1 bg-yellow-400 text-yellow-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(250,204,21,0.6)]"
            >
              <Zap className="w-3 h-3 fill-current" /> PHÁT
            </motion.div>
          )}
          {isReceiver && !isServing && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="flex items-center gap-1 bg-sky-400 text-sky-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
            >
              <CircleDot className="w-3 h-3" /> ĐỠ
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={`
          relative transition-all duration-500
          ${compact ? "w-16 h-20" : "w-24 h-28 md:w-28 md:h-32"}
          rounded-2xl border-2 flex flex-col items-center justify-center gap-1
          ${isServing 
            ? "bg-white/95 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-110 z-30" 
            : "bg-white/10 backdrop-blur-md border-white/20 shadow-xl"
          }
        `}
      >
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-slate-800 text-white`}>
          {slot}
        </div>

        <div className={`p-2 rounded-full ${isServing ? "bg-yellow-100" : "bg-white/10"}`}>
          <User className={`${compact ? "w-5 h-5" : "w-8 h-8"} ${isServing ? "text-yellow-600" : "text-white"}`} />
        </div>

        <span className={`px-1 w-full text-center truncate font-bold ${compact ? "text-[10px]" : "text-sm"} ${isServing ? "text-gray-900" : "text-white"}`}>
          {name.split(" ")[0] || "Player"}
        </span>

        <div className={`absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl ${side === "team1" ? "bg-blue-500" : "bg-red-500"}`} />
      </div>
    </div>
  );
}

export function Court({
  positions,
  serverTeam,
  names,
  score1,
  score2,
  serverHand,
  firstServe,
  compact = false,
}: CourtProps) {
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPosition = positions[serverPlayerId];
  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverPlayerId = Object.keys(positions).find(
    (pid) => pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPosition
  );

  const getPlayerInfo = (team: number, player: number) => {
    const pid = `t${team}p${player}`;
    const pos = positions[pid];
    let x = team === 1 ? (compact ? "20%" : "22%") : (compact ? "80%" : "78%");
    let y = (team === 1 ? pos === "right" : pos === "left") ? "72%" : "28%";

    return {
      id: pid,
      name: names[pid as keyof typeof names],
      x, y,
      isServing: pid === serverPlayerId, // Đồng bộ tên biến ở đây
      isReceiver: pid === receiverPlayerId,
      slot: player,
      side: team === 1 ? ("team1" as const) : ("team2" as const),
    };
  };

  const players = [getPlayerInfo(1, 1), getPlayerInfo(1, 2), getPlayerInfo(2, 1), getPlayerInfo(2, 2)];
  const server = players.find(p => p.isServing);
  const receiver = players.find(p => p.isReceiver);

  return (
    <div className={`relative w-full bg-slate-950 overflow-hidden shadow-2xl border-4 border-slate-800 ${compact ? "aspect-[4/3] rounded-2xl" : "aspect-[16/9] rounded-[2.5rem]"}`}>

      {/* MẶT SÂN */}
      <div className="absolute inset-0 bg-[#1e40af]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')]" />

        {/* KITCHEN AREA */}
        <div className="absolute inset-0 flex justify-center">
          <div className="w-[30%] h-full bg-blue-900/30 border-x-2 border-white/40" />
        </div>

        {/* CÁC ĐƯỜNG KẺ SÂN */}
        <div className="absolute inset-[4%] border-[4px] border-white/70" />
        <div className="absolute top-1/2 left-[4%] right-[4%] h-1 bg-white/70 -translate-y-1/2" />

        {/* LƯỚI GIỮA SÂN */}
        <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-gradient-to-b from-white via-slate-300 to-white shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10" />
      </div>

      {/* HIỂN THỊ ĐIỂM SỐ NHANH */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-6">
        <div className="text-center"><p className="text-[8px] text-blue-400 font-bold uppercase">Đội 1</p><p className="text-xl font-black text-white">{score1}</p></div>
        <div className="w-px h-8 bg-white/20" />
        <div className="text-center"><p className="text-[8px] text-red-400 font-bold uppercase">Đội 2</p><p className="text-xl font-black text-white">{score2}</p></div>
      </div>

      {/* BALL ANIMATION */}
      {server && receiver && (
        <Ball fromX={server.x} fromY={server.y} toX={receiver.x} toY={receiver.y} />
      )}

      {/* RENDER CẦU THỦ */}
      {players.map((p) => (
        <motion.div
          key={p.id}
          className="absolute z-20"
          layout
          initial={false}
          animate={{ left: p.x, top: p.y }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ x: "-50%", y: "-50%" }}
        >
          {/* Truyền p và compact rõ ràng */}
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

      {/* WATERMARK & FIRST SERVE */}
      <div className="absolute bottom-6 right-8 opacity-20 pointer-events-none text-right">
        <div className="text-white font-black italic text-xl">BMB</div>
        <div className="text-white text-[8px] tracking-[0.3em] font-bold">PICKLEBALL PRO</div>
      </div>

      {firstServe && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-6 left-8 bg-yellow-400 text-yellow-950 px-3 py-1 rounded-lg font-black text-[10px] shadow-lg">
          LƯỢT PHÁT ĐẦU (0-0-2)
        </motion.div>
      )}
    </div>
  );
}