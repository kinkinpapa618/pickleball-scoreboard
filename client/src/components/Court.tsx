import { motion } from "framer-motion";
import { User } from "lucide-react";

type Position = "left" | "right";

interface CourtProps {
  positions: Record<string, Position>;
  serverTeam: 1 | 2;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  serverHand: 1 | 2;
  score1: number;
  score2: number;
  firstServe: boolean;
}

function PlayerMarker({
  name,
  isServing,
  isReceiver,
  slot,
  position,
  side,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  position: "left" | "right";
  side: "team1" | "team2";
}) {
  return (
    <div className={`
      absolute flex flex-col items-center justify-center
      ${position === "left" ? "top-1/4" : "bottom-1/4"} 
      ${side === "team1" ? "left-1/4" : "right-1/4"}
      transform -translate-x-1/2 -translate-y-1/2
      w-24 md:w-28 lg:w-32
    `}>
      {/* Badge cho người phát/người nhận */}
      {(isServing || isReceiver) && (
        <div className="flex flex-col items-center gap-1 mb-2 w-full">
          {isServing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full px-2 py-1 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)] flex items-center justify-center text-[10px] md:text-xs font-bold text-yellow-900"
            >
              PHÁT
            </motion.div>
          )}
          {isReceiver && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full px-2 py-1 bg-gray-400 rounded-full shadow-[0_0_8px_rgba(156,163,175,0.6)] flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-900"
            >
              ĐỠ
            </motion.div>
          )}
        </div>
      )}

      {/* Thẻ tên cầu thủ */}
      <div
        className={`
          w-full flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all duration-300
          ${isServing ? "scale-105 shadow-lg ring-2 ring-yellow-400" : "opacity-90"}
          ${
            isServing
              ? "bg-gradient-to-r from-yellow-50 to-yellow-100"
              : isReceiver
              ? "bg-gradient-to-r from-gray-50 to-gray-100"
              : "bg-black/40 text-white"
          }
        `}
      >
        {/* Tên cầu thủ */}
        <div className="flex items-center gap-1 md:gap-2">
          <User className="w-3 h-3 md:w-4 md:h-4" />
          <span className="text-xs md:text-sm font-bold truncate w-full text-center">
            {name || "Player"}
          </span>
        </div>

        {/* Vị trí và Slot */}
        <div className="flex items-center justify-center gap-2 text-[10px] md:text-xs">
          <div className={`px-2 py-0.5 rounded-full ${position === "left" ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"}`}>
            {position === "left" ? "TRÊN" : "DƯỚI"}
          </div>
          <div className="text-gray-600 font-medium">
            SLOT {slot}
          </div>
        </div>
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
}: CourtProps) {
  // Xác định người phát và người nhận
  const serverPlayerId = `t${serverTeam}p${serverHand}`;
  const serverPosition = positions[serverPlayerId];

  // Xác định người nhận: người ở đội đối diện có cùng vị trí với người phát
  const receiverTeam = serverTeam === 1 ? 2 : 1;
  const receiverPlayerId = Object.keys(positions).find(
    pid => pid.startsWith(`t${receiverTeam}`) && positions[pid] === serverPosition
  );

  // Hàm xác định vị trí cố định cho mỗi người chơi
  const getPlayerPositions = () => {
    const positionsArray = [
      // Đội 1 - Vị trí cố định
      { id: "t1p1", name: names.t1p1, team: "team1", position: positions.t1p1, fixedX: "25%", fixedY: "25%" },
      { id: "t1p2", name: names.t1p2, team: "team1", position: positions.t1p2, fixedX: "25%", fixedY: "75%" },
      // Đội 2 - Vị trí cố định
      { id: "t2p1", name: names.t2p1, team: "team2", position: positions.t2p1, fixedX: "75%", fixedY: "25%" },
      { id: "t2p2", name: names.t2p2, team: "team2", position: positions.t2p2, fixedX: "75%", fixedY: "75%" },
    ];

    return positionsArray.map(player => ({
      ...player,
      isServer: player.id === serverPlayerId,
      isReceiver: player.id === receiverPlayerId,
      slot: player.id.endsWith("p1") ? 1 : 2,
    }));
  };

  const allPlayers = getPlayerPositions();

  return (
    <div className="relative w-full aspect-[16/9] max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white/20 select-none bg-gradient-to-br from-blue-900/20 to-purple-900/20">
      {/* Court Surface - Layout ngang */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 flex">

        {/* Team 1 Side (Bên trái) - Chiếm 50% */}
        <div className="w-1/2 relative border-r-2 md:border-r-4 border-white/30">
          {/* Khu vực trước lưới */}
          <div className="absolute right-0 w-1/4 h-full bg-blue-500/20 border-l border-dashed border-white/20"></div>

          {/* Vị trí cầu thủ đội 1 được cố định bằng CSS */}
        </div>

        {/* Net (Ở giữa) */}
        <div className="w-1 md:w-2 bg-gradient-to-b from-white via-white to-gray-300 h-full shadow-lg z-10 relative">
          <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')] opacity-50"></div>
        </div>

        {/* Team 2 Side (Bên phải) - Chiếm 50% */}
        <div className="w-1/2 relative border-l-2 md:border-l-4 border-white/30">
          {/* Khu vực trước lưới */}
          <div className="absolute left-0 w-1/4 h-full bg-blue-500/20 border-r border-dashed border-white/20"></div>
        </div>
      </div>

      {/* Render tất cả cầu thủ ở vị trí cố định */}
      {allPlayers.map(player => (
        <PlayerMarker
          key={player.id}
          name={player.name}
          isServing={player.isServer}
          isReceiver={player.isReceiver}
          slot={player.slot}
          position={player.position}
          side={player.team as "team1" | "team2"}
        />
      ))}

      {/* Hiển thị thông tin lượt phát đầu tiên */}
      {firstServe && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900 text-xs md:text-sm font-bold px-3 md:px-4 py-1 md:py-2 rounded-full shadow-lg animate-pulse border border-yellow-300">
            🎯 0-0-2 - LƯỢT PHÁT ĐẦU TIÊN
          </div>
        </motion.div>
      )}

      {/* Hiển thị tên đội và điểm */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex flex-col items-start gap-1">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white text-sm md:text-lg font-bold px-4 md:px-6 py-2 rounded-lg shadow-lg border-l-4 border-yellow-400">
            ĐỘI 1
          </div>
          <div className="text-lg md:text-2xl font-bold text-white bg-black/40 px-3 py-1 rounded">
            {score1}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className="flex flex-col items-end gap-1">
          <div className="bg-gradient-to-l from-red-800 to-red-900 text-white text-sm md:text-lg font-bold px-4 md:px-6 py-2 rounded-lg shadow-lg border-r-4 border-yellow-400">
            ĐỘI 2
          </div>
          <div className="text-lg md:text-2xl font-bold text-white bg-black/40 px-3 py-1 rounded">
            {score2}
          </div>
        </div>
      </div>

      {/* Đường biên sân và hướng dẫn */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Đường biên ngoài */}
        <div className="absolute inset-1 md:inset-2 border-2 border-white/30 rounded-lg"></div>

        {/* Đường chia sân dọc */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>

        {/* Đường chia sân ngang */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
      </div>

      {/* Chú thích vị trí */}
      <div className="absolute bottom-4 left-4 text-[10px] md:text-xs text-white/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-300"></div>
            <span>VỊ TRÍ TRÊN</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-300"></div>
            <span>VỊ TRÍ DƯỚI</span>
          </div>
        </div>
      </div>

      {/* Trung tâm sân - Logo hoặc thông tin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="text-[10px] md:text-xs text-white/40 font-bold">
          CẦU LÔNG ĐÔI
        </div>
      </div>
    </div>
  );
}