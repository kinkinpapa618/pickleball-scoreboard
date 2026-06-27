import { motion } from "framer-motion";
import { Zap, Shield, Lock, ArrowLeftRight } from "lucide-react";

type Position = "left" | "right";

interface BadmintonCourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverPlayerId: string; // The specific player serving, e.g., "t1p1"
  receiverPlayerId: string; // The specific player receiving
  compact?: boolean;
  onPlayerClick?: (
    playerId: string,
    team: 1 | 2,
    name: string,
    currentSide: Position,
  ) => void;
  onSwitchCourt?: () => void;
  courtSwapped?: boolean;
  isSingles?: boolean;
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
      className="absolute z-50 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-slate-300"
      style={{ x: "-50%", y: "-50%" }}
    >
      <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-white absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-180" />
    </motion.div>
  );
}

function CourtMarker({
  name,
  isServing,
  isReceiver,
  side,
  x,
  y,
  onClick,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  side: "team1" | "team2";
  x: string;
  y: string;
  onClick?: () => void;
}) {
  const isTeam1 = side === "team1";
  const teamBg = isTeam1 ? "bg-blue-600" : "bg-orange-600";

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
        `}
      >
        <svg className="w-4 h-4 text-white fill-white flex-shrink-0" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        
        <span className="text-[9px] font-bold truncate flex-1 text-left" style={{ color: 'white' }}>
          {name}
        </span>

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

export function BadmintonCourt({
  positions,
  serverTeam,
  names,
  serverPlayerId,
  receiverPlayerId,
  compact = false,
  onPlayerClick,
  onSwitchCourt,
  courtSwapped = false,
  isSingles = false,
}: BadmintonCourtProps) {

  const getCoordinates = (
    team: number,
    side: Position,
    isCollision: boolean,
    collisionIndex: number,
  ) => {
    const targetTeam = courtSwapped ? (team === 1 ? 2 : 1) : team;
    let x = targetTeam === 1 ? "25%" : "75%";
    let y = (targetTeam === 1 ? side === "right" : side === "left") ? "72%" : "28%";

    if (isSingles) {
       y = "50%";
    }

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

    const p1VisualSide = positions[p1Id];
    const p2VisualSide = positions[p2Id];

    const isCollision = !isSingles && p1VisualSide === p2VisualSide;

    const createPlayerObj = (
      id: string,
      visualSide: Position,
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
        side: displaySide,
        currentSide: visualSide,
      };
    };

    if (isSingles) {
      return [createPlayerObj(p1Id, p1VisualSide, 0, team)];
    }

    return [
      createPlayerObj(p1Id, p1VisualSide, 0, team),
      createPlayerObj(p2Id, p2VisualSide, 1, team),
    ];
  };

  const players = [...processTeamPlayers(1), ...processTeamPlayers(2)].filter(
    (p) => p.name && p.name.trim() !== ""
  );

  const activeSrv = players.find((p) => p.isServing);
  const activeRcv = players.find((p) => p.isReceiver);

  return (
    <div className="flex flex-col gap-1.5" data-testid="badminton-court">
      <div
        className={`relative w-full overflow-hidden shadow-inner ${compact ? "aspect-[2/1]" : "aspect-[16/9]"}`}
      >
        {/* Badminton Court Background */}
        <div className="absolute inset-0 bg-[#2b7c4f]">
          {/* Outer boundary */}
          <div className="absolute inset-[4%] border-2 border-white/80 rounded-sm" />
          {/* Center line (net) */}
          <div className="absolute top-[4%] bottom-[4%] left-1/2 w-[3px] bg-white shadow-sm z-10 -translate-x-1/2" />
          
          {/* Doubles side tramlines */}
          {!isSingles && (
            <>
              <div className="absolute left-[4%] right-[4%] top-[10%] h-[2px] bg-white/60" />
              <div className="absolute left-[4%] right-[4%] bottom-[10%] h-[2px] bg-white/60" />
            </>
          )}

          {/* Singles side boundary / inner doubles lines */}
          <div className="absolute top-[4%] bottom-[4%] left-[10%] w-[2px] bg-white/60" />
          <div className="absolute top-[4%] bottom-[4%] right-[10%] w-[2px] bg-white/60" />

          {/* Short service lines */}
          <div className="absolute top-[4%] bottom-[4%] left-[35%] w-[2px] bg-white/80" />
          <div className="absolute top-[4%] bottom-[4%] right-[35%] w-[2px] bg-white/80" />

          {/* Center dividing lines */}
          <div className="absolute top-[50%] left-[10%] w-[25%] h-[2px] bg-white/80" />
          <div className="absolute top-[50%] right-[10%] w-[25%] h-[2px] bg-white/80" />

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
            side={p.side}
            x={p.x}
            y={p.y}
            onClick={() => onPlayerClick?.(p.id, p.side === "team1" ? 1 : 2, p.name, p.currentSide)}
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
