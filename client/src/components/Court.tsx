import { motion, AnimatePresence } from "framer-motion";
import { User, Zap, ShieldCheck, Trophy, AlertTriangle, Lock } from "lucide-react";

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
  penalties?: any;
  onPlayerClick?: (id: string, team: 1 | 2, name: string, currentSide: Position) => void;
}

export function Court({ positions, serverTeam, names, score1, score2, serverHand, firstServe, compact, stackingMap, onPlayerClick }: CourtProps) {
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPos = positions[serverPlayerId];
  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverId = Object.keys(positions).find(pid => pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPos);

  const getVisualSide = (pid: string, logicSide: Position): Position => {
    return (stackingMap && stackingMap[pid]) ? stackingMap[pid] as Position : logicSide;
  };

  const getCoords = (team: number, side: Position, isCollision: boolean, idx: number) => {
    let x = team === 1 ? (compact ? "22%" : "25%") : (compact ? "78%" : "75%");
    let y = (team === 1 ? side === "right" : side === "left") ? "75%" : "25%";

    if (isCollision) {
      const baseY = parseFloat(y);
      y = `${baseY + (idx === 0 ? -12 : 12)}%`;
    }
    return { x, y };
  };

  const renderTeam = (team: 1 | 2) => {
    const p1Id = `t${team}p1`, p2Id = `t${team}p2`;
    const v1 = getVisualSide(p1Id, positions[p1Id]), v2 = getVisualSide(p2Id, positions[p2Id]);
    const isCollision = v1 === v2;

    return [p1Id, p2Id].map((id, idx) => {
      const visualSide = idx === 0 ? v1 : v2;
      const { x, y } = getCoords(team, visualSide, isCollision, idx);
      const isSrv = id === serverPlayerId;
      const isRcv = id === receiverId;

      return (
        <motion.div 
          key={id} animate={{ left: x, top: y }} className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          onClick={() => onPlayerClick?.(id, team, names[id as keyof typeof names], visualSide)}
        >
          <div className="flex flex-col items-center">
            {isSrv && <div className="bg-indigo-600 text-[8px] text-white px-2 py-0.5 rounded-full mb-1 font-black animate-pulse">PHÁT</div>}
            <div className={`relative ${compact ? 'w-16 h-20' : 'w-24 h-28'} bg-white rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl ${isSrv ? 'border-indigo-500' : 'border-slate-200'} ${stackingMap?.[id] ? 'ring-2 ring-[#ccff00]' : ''}`}>
              {stackingMap?.[id] && <Lock className="absolute top-1 right-1 w-3 h-3 text-[#ccff00]" />}
              <User className={compact ? "w-6 h-6 text-slate-300" : "w-10 h-10 text-slate-300"} />
              <span className="text-[10px] font-black italic uppercase mt-1 px-1 truncate w-full text-center">{names[id as keyof typeof names]}</span>
            </div>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className={`relative w-full bg-indigo-600 overflow-hidden border-4 border-white shadow-2xl ${compact ? "aspect-[4/3] rounded-[2rem]" : "aspect-[16/9] rounded-[3rem]"}`}>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 flex justify-center"><div className="w-[30%] h-full bg-black/10 border-x-2 border-white/50" /></div>
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg" />
      {renderTeam(1)}
      {renderTeam(2)}
    </div>
  );
}