import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Lock, ArrowLeftRight } from "lucide-react";

type Position = "left" | "right";

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
  stackingMap?: StackingMap;
  onPlayerClick?: (
    playerId: string,
    team: 1 | 2,
    name: string,
    currentSide: Position,
  ) => void;
  onSwitchCourt?: () => void;
  courtSwapped?: boolean;
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
  return (
    <motion.div
      key={serverId}
      initial={{ left: fromX, top: fromY, scale: 0, opacity: 0 }}
      animate={{
        left: [fromX, "50%", toX],
        top: [fromY, "30%", toY],
        scale: [1, 1.5, 1],
        opacity: [1, 1, 1],
      }}
      transition={{
        duration: 1.2,
        ease: "circOut",
        repeat: Infinity,
        repeatDelay: 1,
      }}
      className="absolute z-50 w-4 h-4 bg-[#ccff00] rounded-full shadow-[0_0_12px_rgba(204,255,0,0.6)] border border-white/60"
      style={{ x: "-50%", y: "-50%" }}
    />
  );
}

function CourtMarker({
  name,
  isServing,
  isReceiver,
  slot,
  side,
  x,
  y,
  onClick,
  isStacking,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  side: "team1" | "team2";
  x: string;
  y: string;
  onClick?: () => void;
  isStacking: boolean;
  
}) {
  const isTeam1 = side === "team1";
  
  // Giữ nguyên màu team (blue T1, red T2) - không hoán đổi khi đổi sân
  const teamBg = isTeam1 ? "bg-cyan-600" : "bg-rose-600";

  return (
    <motion.button
      className="absolute z-20"
      animate={{ left: x, top: y, scale: isServing ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      style={{ x: "-50%", y: "-50%" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className={`
          relative flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:scale-105
          w-[140px] min-h-[20px]
          ${teamBg}
          shadow-md
          ${isStacking ? "ring-2 ring-emerald-400 ring-offset-1" : ""}
        `}
      >
        {/* Icon đầu người màu trắng */}
        <svg className="w-4 h-4 text-white fill-white flex-shrink-0" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        
        {/* Player Name - màu trắng, align left */}
        <span className="text-[9px] font-bold truncate flex-1 text-left" style={{ color: 'white' }}>
          {name}
        </span>
        
        {/* Stacking */}
        {!isServing && !isReceiver && (
          <div className="flex items-center gap-0.5">
            {isStacking && <Lock className="w-2.5 h-2.5 text-white" />}
          </div>
        )}

        {/* Status Badge - Top Right Corner */}
        {(isServing || isReceiver) && (
          <div className="absolute -top-1 -right-1 z-10">
            {isServing ? (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-400 rounded-full shadow-md">
                <Zap className="w-2.5 h-2.5 text-yellow-800 fill-yellow-600" />
                <span className="text-[7px] font-bold text-yellow-800">PHÁT</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-400 rounded-full shadow-md">
                <Shield className="w-2.5 h-2.5 text-white" />
                <span className="text-[7px] font-bold text-white">ĐỠ</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function Court({
  positions,
  serverTeam,
  names,
  serverHand,
  firstServe,
  compact = false,
  stackingMap,
  onPlayerClick,
  onSwitchCourt,
  courtSwapped = false,
}: Omit<CourtProps, "penalties">) {
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPosition = positions[serverPlayerId];
  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverPlayerId = Object.keys(positions).find(
    (pid) =>
      pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPosition,
  );

  const getVisualSide = (pid: string, logicSide: Position): Position => {
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
    let x = team === 1 ? "25%" : "75%";
    let y = (team === 1 ? side === "right" : side === "left") ? "72%" : "28%";

    if (isCollision) {
      const offset = 14;
      const baseY = parseFloat(y);
      y = `${baseY + (collisionIndex === 0 ? -offset : offset)}%`;
    }

    return { x, y };
  };

  const processTeamPlayers = (team: 1 | 2) => {
    const p1Id = `t${team}p1`;
    const p2Id = `t${team}p2`;

    const p1VisualSide = getVisualSide(p1Id, positions[p1Id]);
    const p2VisualSide = getVisualSide(p2Id, positions[p2Id]);

    const isCollision = p1VisualSide === p2VisualSide;

    const createPlayerObj = (
      id: string,
      visualSide: Position,
      slot: number,
      collisionIdx: number,
      team: 1 | 2,
    ) => {
      const coords = getCoordinates(
        team,
        visualSide,
        isCollision,
        collisionIdx,
      );
      const originalSide = (team === 1 ? "team1" : "team2") as "team1" | "team2";
      const displaySide = courtSwapped
        ? (originalSide === "team1" ? "team2" : "team1")
        : originalSide;
      return {
        id,
        name: names[id as keyof typeof names],
        x: coords.x,
        y: coords.y,
        isServing: id === serverPlayerId,
        isReceiver: id === receiverPlayerId,
        slot,
        side: displaySide,
        isStacking: !!stackingMap?.[id],
        currentSide: visualSide,
        collisionMode: isCollision,
      };
    };

    return [
      createPlayerObj(p1Id, p1VisualSide, 1, 0, team),
      createPlayerObj(p2Id, p2VisualSide, 2, 1, team),
    ];
  };

  const players = [...processTeamPlayers(1), ...processTeamPlayers(2)].filter(
    (p) => p.name && p.name.trim() !== ""
  );

  const activeSrv = players.find((p) => p.isServing);
  const activeRcv = players.find((p) => p.isReceiver);

  return (
    <div className="flex flex-col gap-1.5" data-testid="court-view">
      <div
        className={`relative w-full overflow-hidden border border-white/20 dark:border-white/10 shadow-inner ${compact ? "aspect-[2/1]" : "aspect-[16/9]"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700">
          <div className="absolute inset-0 flex justify-center pointer-events-none">
            <div className="w-[30%] h-full bg-blue-700/30 border-x-2 border-white/30" />
          </div>
          <div className="absolute inset-[4%] border-2 border-white/50 rounded-sm" />
          <div className="absolute top-1/2 left-[4%] right-[4%] h-[1px] bg-white/30 -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)] z-10 -translate-x-1/2" />
        
        {onSwitchCourt && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwitchCourt();
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white/90 dark:bg-black/70 hover:bg-white dark:hover:bg-black rounded-full p-1.5 shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-110"
            title="Đổi sân"
          >
            <ArrowLeftRight className="w-3 h-3 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        </div>

        {activeSrv && activeRcv && (
          <Ball
            fromX={activeSrv.x}
            fromY={activeSrv.y}
            toX={activeRcv.x}
            toY={activeRcv.y}
            serverId={`${activeSrv.id}-${activeSrv.x}-${activeSrv.y}-${activeRcv.x}-${activeRcv.y}`}
          />
        )}

        {players.map((p) => (
          <CourtMarker
            key={p.id}
            name={p.name}
            isServing={p.isServing}
            isReceiver={!!p.isReceiver}
            slot={p.slot}
            side={p.side}
            x={p.x}
            y={p.y}
            onClick={() => onPlayerClick?.(p.id, p.side === "team1" ? 1 : 2, p.name, p.currentSide)}
            isStacking={p.isStacking}
          />
        ))}

        <div className="absolute top-1/2 left-[25%] -translate-y-1/2 -translate-x-1/2 text-4xl font-black italic text-white/50 pointer-events-none select-none">
          {courtSwapped ? "T2" : "T1"}
        </div>
        <div className="absolute top-1/2 left-[75%] -translate-y-1/2 -translate-x-1/2 text-4xl font-black italic text-white/50 pointer-events-none select-none">
          {courtSwapped ? "T1" : "T2"}
        </div>
      </div>

      
    </div>
  );
}
