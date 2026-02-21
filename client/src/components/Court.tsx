import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Lock, User } from "lucide-react";

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
}

function HorizontalPlayerCard({
  name,
  isServing,
  isReceiver,
  slot,
  side,
  penalty,
  onClick,
  isStacking,
  teamLabel,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  side: "team1" | "team2";
  penalty?: PlayerPenalty;
  onClick: () => void;
  isStacking: boolean;
  teamLabel: string;
}) {
  const isTeam1 = side === "team1";
  const teamColor = isTeam1 ? "bg-cyan-500" : "bg-rose-500";
  const teamBorder = isTeam1 ? "border-cyan-400/40" : "border-rose-400/40";

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-testid={`player-card-${side}-p${slot}`}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer min-w-0
        ${isServing
          ? `bg-yellow-400/20 border-yellow-400/60 dark:bg-yellow-400/10 dark:border-yellow-400/40`
          : `bg-white/80 dark:bg-white/5 ${teamBorder}`
        }
        ${penalty?.red ? "opacity-50 grayscale" : ""}
        ${isStacking ? "ring-1 ring-emerald-400 ring-offset-1 dark:ring-offset-black" : ""}
      `}
    >
      <div className={`${teamColor} text-white text-[7px] font-black px-1 py-0.5 rounded leading-none flex-shrink-0`}>
        {teamLabel}
      </div>

      <div className="flex items-center gap-1 min-w-0 flex-1">
        <User className={`w-3 h-3 flex-shrink-0 ${isServing ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`} />
        <span className={`text-[10px] font-bold truncate ${isServing ? "text-yellow-700 dark:text-yellow-300" : "text-foreground"}`}>
          {name}
        </span>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isServing && (
          <span className="bg-yellow-400 text-black text-[7px] font-black px-1 py-0.5 rounded leading-none flex items-center gap-0.5">
            <Zap className="w-2 h-2 fill-current" />
            PHÁT
          </span>
        )}
        {isReceiver && !isServing && (
          <span className="bg-slate-700 dark:bg-slate-600 text-white text-[7px] font-black px-1 py-0.5 rounded leading-none flex items-center gap-0.5">
            <Shield className="w-2 h-2" />
            ĐỠ
          </span>
        )}
        {isStacking && (
          <Lock className="w-3 h-3 text-emerald-500" />
        )}
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
    </motion.button>
  );
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
  slot,
  side,
  x,
  y,
}: {
  name: string;
  isServing: boolean;
  slot: number;
  side: "team1" | "team2";
  x: string;
  y: string;
}) {
  const isTeam1 = side === "team1";
  return (
    <motion.div
      className="absolute z-20"
      animate={{ left: x, top: y }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      style={{ x: "-50%", y: "-50%" }}
    >
      <div className={`
        flex flex-col items-center gap-0.5
      `}>
        <div className={`
          w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-black
          ${isServing
            ? "bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-400/40"
            : isTeam1
              ? "bg-cyan-500/80 border-cyan-300/60 text-white"
              : "bg-rose-500/80 border-rose-300/60 text-white"
          }
        `}>
          P{slot}
        </div>
        <span className="text-[7px] font-bold text-white drop-shadow-md leading-none max-w-[50px] truncate text-center">
          {name}
        </span>
      </div>
    </motion.div>
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
      const coords = getCoordinates(team, visualSide, isCollision, collisionIdx);
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
  const team1Players = players.filter((p) => p.side === "team1");
  const team2Players = players.filter((p) => p.side === "team2");

  const activeSrv = players.find((p) => p.isServing);
  const activeRcv = players.find((p) => p.isReceiver);

  return (
    <div className="flex flex-col gap-1.5" data-testid="court-view">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          {team1Players.map((p) => (
            <HorizontalPlayerCard
              key={p.id}
              name={p.name}
              isServing={p.isServing}
              isReceiver={!!p.isReceiver}
              slot={p.slot}
              side={p.side}
              penalty={p.penalty}
              onClick={() => onPlayerClick?.(p.id, 1, p.name, p.currentSide)}
              isStacking={p.isStacking}
              teamLabel={`T1`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          {team2Players.map((p) => (
            <HorizontalPlayerCard
              key={p.id}
              name={p.name}
              isServing={p.isServing}
              isReceiver={!!p.isReceiver}
              slot={p.slot}
              side={p.side}
              penalty={p.penalty}
              onClick={() => onPlayerClick?.(p.id, 2, p.name, p.currentSide)}
              isStacking={p.isStacking}
              teamLabel={`T2`}
            />
          ))}
        </div>
      </div>

      <div className={`relative w-full overflow-hidden rounded-xl border border-white/20 dark:border-white/10 shadow-inner ${compact ? "aspect-[2/1]" : "aspect-[16/9]"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700">
          <div className="absolute inset-0 flex justify-center pointer-events-none">
            <div className="w-[30%] h-full bg-blue-700/30 border-x-2 border-white/30" />
          </div>
          <div className="absolute inset-[4%] border-2 border-white/50 rounded-sm" />
          <div className="absolute top-1/2 left-[4%] right-[4%] h-[1px] bg-white/30 -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)] z-10 -translate-x-1/2" />
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
            slot={p.slot}
            side={p.side}
            x={p.x}
            y={p.y}
          />
        ))}

        <div className="absolute bottom-1 left-2 text-[7px] font-bold text-white/40 uppercase tracking-wider">
          T1
        </div>
        <div className="absolute bottom-1 right-2 text-[7px] font-bold text-white/40 uppercase tracking-wider">
          T2
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground italic">
        Chạm VĐV để Stacking / Thẻ phạt
      </p>
    </div>
  );
}
