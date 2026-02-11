import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Zap,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  Layers,
  Lock,
} from "lucide-react";

type Position = "left" | "right";

interface PlayerPenalty {
  yellow: number;
  red: boolean;
}

// Lưu trạng thái Stacking: playerId -> vị trí bị khóa ("left" hoặc "right")
export type StackingMap = Record<string, Position | null>;

interface CourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverHand: 1 | 2;
  score1: number;
  score2: number;
  firstServe: boolean;
  compact?: boolean;
  stackingMap?: StackingMap; // Nhận map stacking từ Match
  penalties?: Record<string, PlayerPenalty>;
  onPlayerClick?: (
    playerId: string,
    team: 1 | 2,
    name: string,
    currentSide: Position,
  ) => void;
}

function Ball({
  fromX,
  fromY,
  toX,
  toY,
  serverId,
}: {
  fromX: string;
  fromY: string;
  toX: string;
  toY: string;
  serverId: string;
}) {
  // ... (Giữ nguyên code Ball cũ)
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
      transition={{
        duration: 1.2,
        ease: "circOut",
        repeat: Infinity,
        repeatDelay: 1,
      }}
      className="absolute z-50 w-5 h-5 bg-[#ccff00] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.8)] border-2 border-white flex items-center justify-center"
      style={{ x: "-50%", y: "-50%" }}
    >
      <div className="w-full h-px bg-black/10 rotate-45" />
    </motion.div>
  );
}

function PlayerMarker({
  name,
  isServing,
  isReceiver,
  slot,
  side,
  compact,
  penalty,
  onClick,
  isStacking,
  collisionMode,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  side: "team1" | "team2";
  compact: boolean;
  penalty?: PlayerPenalty;
  onClick: () => void;
  isStacking: boolean;
  collisionMode: boolean;
}) {
  const isTeam1 = side === "team1";

  // Khi va chạm (2 người cùng 1 ô), thu nhỏ viewbox lại một chút để vừa chỗ
  const sizeClass = collisionMode
    ? compact
      ? "w-14 h-16 scale-90"
      : "w-24 h-24 scale-90" // Nhỏ hơn khi stack
    : compact
      ? "w-16 h-20"
      : "w-28 h-32"; // Size chuẩn

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex flex-col items-center gap-1 cursor-pointer group transition-all duration-300 ${collisionMode ? "z-10" : "z-20"}`}
    >
      {/* Chỉ hiện trạng thái Phát/Đỡ nếu không bị chồng lấn quá nhiều, hoặc ưu tiên người phát */}
      <div className="h-4 relative w-full flex justify-center">
        <AnimatePresence mode="wait">
          {isServing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black italic tracking-tighter shadow-md whitespace-nowrap z-30"
            >
              <Zap className="w-2 h-2 inline mr-1 fill-current" />
              PHÁT
            </motion.div>
          ) : isReceiver && !collisionMode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bg-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-black italic tracking-tighter shadow-md whitespace-nowrap"
            >
              <ShieldCheck className="w-2 h-2 inline mr-1" />
              ĐỠ
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={`
        relative overflow-hidden transition-all duration-300
        ${sizeClass}
        rounded-2xl border-2 flex flex-col items-center justify-center
        ${isServing ? "bg-white border-indigo-500 shadow-xl z-30" : "bg-white/90 backdrop-blur-md border-slate-200 shadow-md group-hover:border-[#ccff00]"}
        ${penalty?.red ? "border-red-600 grayscale opacity-60" : ""}
        ${isStacking ? "ring-2 ring-offset-2 ring-[#ccff00] border-[#ccff00]" : ""}
      `}
      >
        {/* Team Tag */}
        <div
          className={`absolute top-0 left-0 px-2 py-0.5 text-[8px] font-black ${isTeam1 ? "bg-cyan-500" : "bg-rose-500"} text-white rounded-br-lg`}
        >
          P{slot}
        </div>

        {/* Stacking Lock Icon */}
        {isStacking && (
          <div className="absolute top-0 right-0 p-1 bg-[#ccff00] rounded-bl-lg z-10">
            <Lock className="w-2.5 h-2.5 text-black" />
          </div>
        )}

        {/* Penalty Indicators */}
        <div className="absolute bottom-1 right-1 flex gap-0.5 z-20">
          {penalty?.yellow && penalty.yellow > 0 && (
            <div className="flex gap-0.5">
              {[...Array(penalty.yellow)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-2.5 bg-yellow-400 rounded-sm border border-black/10"
                />
              ))}
            </div>
          )}
          {penalty?.red && (
            <div className="w-2 h-3 bg-red-600 rounded-sm border border-black/10 animate-pulse" />
          )}
        </div>

        <div
          className={`mb-1 p-1.5 rounded-full ${isServing ? "bg-indigo-50" : "bg-slate-50"}`}
        >
          <User
            className={`${compact ? "w-4 h-4" : "w-6 h-6"} ${isServing ? "text-indigo-600" : "text-slate-300"}`}
          />
        </div>

        <span
          className={`px-1 w-full text-center truncate font-black italic tracking-tight uppercase ${compact ? "text-[9px]" : "text-[10px]"} ${isServing ? "text-slate-900" : "text-slate-400"}`}
        >
          {name || "PLAYER"}
        </span>

        {penalty?.red && (
          <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center">
            <AlertTriangle className="text-red-600 w-6 h-6 opacity-40" />
          </div>
        )}
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
  stackingMap,
  penalties,
  onPlayerClick,
}: CourtProps) {
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPosition = positions[serverPlayerId];
  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverPlayerId = Object.keys(positions).find(
    (pid) =>
      pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPosition,
  );

  // 1. Tính toán vị trí THỰC TẾ (Visual Side)
  const getVisualSide = (pid: string, logicSide: Position): Position => {
    // Nếu player đang stacking, vị trí thực tế = vị trí bị khóa (trong stackingMap)
    // Nếu không, vị trí thực tế = vị trí logic (theo luật xoay vòng)
    if (stackingMap && stackingMap[pid]) {
      return stackingMap[pid] as Position;
    }
    return logicSide;
  };

  const getCoordinates = (
    team: number,
    side: Position,
    isCollision: boolean,
    collisionIndex: number,
  ) => {
    // Tọa độ X cơ bản
    let x = team === 1 ? (compact ? "20%" : "22%") : compact ? "80%" : "78%";

    // Tọa độ Y cơ bản
    let y = (team === 1 ? side === "right" : side === "left") ? "75%" : "25%";

    // LOGIC ĐẶT CẠNH NHAU KHI VA CHẠM (COLLISION)
    if (isCollision) {
      // Nếu va chạm, chúng ta sẽ dịch chuyển Y của 2 người ra xa nhau một chút
      // collisionIndex = 0 (người đầu tiên) -> Dịch lên
      // collisionIndex = 1 (người thứ hai) -> Dịch xuống
      const offset = 12; // % dịch chuyển
      // Parse Y gốc ra số để cộng trừ
      const baseY = parseFloat(y);
      y = `${baseY + (collisionIndex === 0 ? -offset : offset)}%`;
    }

    return { x, y };
  };

  const processTeamPlayers = (team: 1 | 2) => {
    const p1Id = `t${team}p1`;
    const p2Id = `t${team}p2`;

    const p1LogicSide = positions[p1Id];
    const p2LogicSide = positions[p2Id];

    const p1VisualSide = getVisualSide(p1Id, p1LogicSide);
    const p2VisualSide = getVisualSide(p2Id, p2LogicSide);

    // Kiểm tra va chạm: Cả 2 cùng phía thực tế
    const isCollision = p1VisualSide === p2VisualSide;

    const createPlayerObj = (
      id: string,
      visualSide: Position,
      slot: number,
      collisionIdx: number,
    ) => {
      const coords = getCoordinates(
        team,
        visualSide,
        isCollision,
        collisionIdx,
      );
      return {
        id,
        name: names[id as keyof typeof names],
        x: coords.x,
        y: coords.y,
        isServing: id === serverPlayerId,
        isReceiver: id === receiverPlayerId,
        slot,
        side: (team === 1 ? "team1" : "team2") as "team1" | "team2",
        penalty: penalties?.[id],
        isStacking: !!stackingMap?.[id],
        currentSide: visualSide, // Gửi vị trí hiện tại lên để Match biết đường khóa
        collisionMode: isCollision,
      };
    };

    return [
      createPlayerObj(p1Id, p1VisualSide, 1, 0),
      createPlayerObj(p2Id, p2VisualSide, 2, 1),
    ];
  };

  const players = [...processTeamPlayers(1), ...processTeamPlayers(2)];

  const activeSrv = players.find((p) => p.isServing);
  const activeRcv = players.find((p) => p.isReceiver);

  return (
    <div
      className={`relative w-full bg-slate-200 overflow-hidden border-[4px] border-white shadow-inner ${compact ? "aspect-[4/3] rounded-[2rem]" : "aspect-[16/9] rounded-[3rem]"}`}
    >
      {/* PROFESSIONAL LIGHT COURT SURFACE */}
      <div className="absolute inset-0 bg-indigo-500/90">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        {/* Kitchen */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div className="w-[30%] h-full bg-indigo-600/40 border-x-[3px] border-white/40" />
        </div>
        {/* Lines */}
        <div className="absolute inset-[3%] border-[3px] border-white/60" />
        <div className="absolute top-1/2 left-[3%] right-[3%] h-[2px] bg-white/40 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10" />
      </div>

      {/* Score Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 bg-white/90 backdrop-blur-xl px-6 py-2 rounded-full shadow-xl border border-white">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-cyan-500 uppercase">
            T1
          </span>
          <span className="text-3xl font-black text-slate-900 italic">
            {score1}
          </span>
        </div>
        <div className="h-8 w-px bg-slate-100" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-rose-500 uppercase">
            T2
          </span>
          <span className="text-3xl font-black text-slate-900 italic">
            {score2}
          </span>
        </div>
      </div>

      {activeSrv && activeRcv && (
        <Ball
          fromX={activeSrv.x}
          fromY={activeSrv.y}
          toX={activeRcv.x}
          toY={activeRcv.y}
          serverId={activeSrv.id}
        />
      )}

      {/* Render Players */}
      {players.map((p) => (
        <motion.div
          key={p.id}
          className="absolute z-20"
          animate={{ left: p.x, top: p.y }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }} // Animation mượt hơn
          style={{ x: "-50%", y: "-50%" }}
        >
          <PlayerMarker
            {...p}
            compact={compact}
            onClick={() =>
              onPlayerClick?.(
                p.id,
                p.side === "team1" ? 1 : 2,
                p.name,
                p.currentSide,
              )
            }
          />
        </motion.div>
      ))}

      {/* Footer Info */}
      <div className="absolute bottom-6 left-8 flex items-center gap-3">
        {firstServe && (
          <div className="bg-[#ccff00] text-black px-4 py-1 rounded-full font-black text-[9px] italic shadow-md animate-bounce">
            BẮT ĐẦU: 0-0-2
          </div>
        )}
        <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white font-black text-[9px] italic border border-white/20 flex items-center gap-2">
          <Trophy className="w-3 h-3 text-yellow-500" /> PRO SERIES 2026
        </div>
      </div>
    </div>
  );
}
