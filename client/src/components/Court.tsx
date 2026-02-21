import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Lock, ArrowLeftRight } from "lucide-react";

type Position = "left" | "right";

interface PlayerPenalty {
  yellow: number;
  red: boolean;
}

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
  penalties?: Record<string, PlayerPenalty>;
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
  penalty,
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
  penalty?: PlayerPenalty;
}) {
  const isTeam1 = side === "team1";
  const teamLabel = isTeam1 ? "T1" : "T2";
  const teamLabelBg = isTeam1 
    ? "bg-gradient-to-r from-cyan-500 to-cyan-600" 
    : "bg-gradient-to-r from-rose-500 to-rose-600";
  
  let borderClass = "border-slate-200";
  if (isServing) borderClass = "border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]";
  else if (isReceiver) borderClass = "border-slate-300";

  return (
    <motion.button
      className="absolute z-20"
      animate={{ left: x, top: y }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      style={{ x: "-50%", y: "-50%" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className={`
          relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 bg-white shadow-md w-[150px] h-[36px]
          ${borderClass}
          ${penalty?.red ? "opacity-50 grayscale" : ""}
          ${isStacking ? "ring-2 ring-emerald-500 ring-offset-2" : ""}
        `}
      >
        <span className={`${teamLabelBg} text-white text-[7px] font-black px-1.5 py-0.5 rounded flex-shrink-0 shadow-sm`}>
          {teamLabel}
        </span>
        
        <div className="flex-shrink-0">
          {isTeam1 ? (
            <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>

        <span className="text-[10px] font-bold text-slate-800 truncate flex-1 pr-6">
          {name}
        </span>

        {(isServing || isReceiver) && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isServing ? (
              <div className="relative">
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-[5px] font-bold px-1 rounded-full min-w-[12px] text-center">
                  P
                </span>
              </div>
            ) : (
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="absolute -top-1 -right-1 bg-slate-500 text-white text-[5px] font-bold px-1 rounded-full min-w-[12px] text-center">
                  Đ
                </span>
              </div>
            )}
          </div>
        )}

        {!isServing && !isReceiver && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isStacking && <Lock className="w-3.5 h-3.5 text-emerald-500" />}
            {penalty && penalty.yellow > 0 && (
              <div className="flex gap-px">
                {[...Array(penalty.yellow)].map((_, i) => (
                  <div key={i} className="w-1.5 h-2.5 bg-yellow-400 rounded-sm" />
                ))}
              </div>
            )}
            {penalty?.red && (
              <div className="w-2 h-3 bg-red-600 rounded-sm animate-pulse" />
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
  penalties,
  onPlayerClick,
  onSwitchCourt,
  courtSwapped = false,
}: CourtProps) {
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
        currentSide: visualSide,
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
    <div className="flex flex-col gap-1.5" data-testid="court-view">
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-white/20 dark:border-white/10 shadow-inner ${compact ? "aspect-[2/1]" : "aspect-[16/9]"}`}
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
            serverId={activeSrv.id}
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
            penalty={p.penalty}
          />
        ))}

        <div className="absolute bottom-1 left-2 text-[7px] font-bold uppercase tracking-wider">
          <span className={courtSwapped ? "text-rose-400" : "text-cyan-400"}>
            {courtSwapped ? "T2" : "T1"}
          </span>
        </div>
        <div className="absolute bottom-1 right-2 text-[7px] font-bold uppercase tracking-wider">
          <span className={courtSwapped ? "text-cyan-400" : "text-rose-400"}>
            {courtSwapped ? "T1" : "T2"}
          </span>
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground italic">
        Chạm VĐV để Stacking / Thẻ phạt
      </p>
    </div>
  );
}
