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
  side,
  positionName,
  isTeam1,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  slot: number;
  side: "team1" | "team2";
  positionName: string;
  isTeam1: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Badge cho người phát/người nhận */}
      {(isServing || isReceiver) && (
        <div className="flex flex-col items-center gap-1 mb-1 w-full">
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
          w-20 md:w-24 lg:w-28 flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all duration-300
          ${isServing ? "scale-105 shadow-lg ring-2 ring-yellow-400" : "opacity-90"}
          ${
            isServing
              ? "bg-gradient-to-r from-yellow-50 to-yellow-100"
              : isReceiver
              ? "bg-gradient-to-r from-gray-50 to-gray-100"
              : isTeam1
              ? "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300"
              : "bg-gradient-to-r from-red-50 to-red-100 border border-red-300"
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
        <div className="flex items-center justify-center gap-1 text-[10px] md:text-xs">
          <div className={`px-2 py-0.5 rounded-full font-medium ${positionName === "Ô 1" ? "bg-blue-500/20 text-blue-700" : "bg-green-500/20 text-green-700"}`}>
            {positionName}
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

  // Hàm xác định thông tin cho từng player với vị trí cố định
  const getPlayerInfo = (team: number, player: number) => {
    const playerId = `t${team}p${player}`;
    const position = positions[playerId];

    // Xác định vị trí dựa trên team và player
    let positionName = "";
    let gridClass = "";

    if (team === 1) {
      if (player === 1) {
        positionName = "Ô 1"; // Dưới bên trái
        gridClass = "row-start-2 col-start-1";
      } else { // player === 2
        positionName = "Ô 2"; // Trên bên trái
        gridClass = "row-start-1 col-start-1";
      }
    } else { // team === 2
      if (player === 1) {
        positionName = "Ô 1"; // Trên bên phải
        gridClass = "row-start-1 col-start-2";
      } else { // player === 2
        positionName = "Ô 2"; // Dưới bên phải
        gridClass = "row-start-2 col-start-2";
      }
    }

    return {
      id: playerId,
      name: names[playerId as keyof typeof names],
      positionName,
      gridClass,
      isServer: playerId === serverPlayerId,
      isReceiver: playerId === receiverPlayerId,
      slot: player,
      isTeam1: team === 1,
    };
  };

  // Tạo mảng thông tin cho tất cả players
  const players = [
    getPlayerInfo(1, 1), // t1p1
    getPlayerInfo(1, 2), // t1p2
    getPlayerInfo(2, 1), // t2p1
    getPlayerInfo(2, 2), // t2p2
  ];

  return (
    <div className="relative w-full aspect-[16/9] max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white/20 select-none bg-gradient-to-br from-blue-900/20 to-purple-900/20">
      {/* Court Surface - Layout ngang với grid */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
        {/* Grid container cho 4 vị trí cố định */}
        <div className="h-full grid grid-rows-2 grid-cols-2">
          {/* Team 1 Side (Bên trái) */}
          <div className="relative border-r-2 md:border-r-4 border-white/30">
            {/* Khu vực trước lưới */}
            <div className="absolute right-0 w-1/4 h-full bg-blue-500/20 border-l border-dashed border-white/20"></div>
          </div>

          {/* Team 2 Side (Bên phải) */}
          <div className="relative border-l-2 md:border-l-4 border-white/30">
            {/* Khu vực trước lưới */}
            <div className="absolute left-0 w-1/4 h-full bg-blue-500/20 border-r border-dashed border-white/20"></div>
          </div>

          {/* Row 2 - Phần dưới của sân */}
          <div className="relative border-r-2 md:border-r-4 border-t-2 border-white/30">
            {/* Khu vực trước lưới */}
            <div className="absolute right-0 w-1/4 h-full bg-blue-500/20 border-l border-dashed border-white/20"></div>
          </div>

          <div className="relative border-l-2 md:border-l-4 border-t-2 border-white/30">
            {/* Khu vực trước lưới */}
            <div className="absolute left-0 w-1/4 h-full bg-blue-500/20 border-r border-dashed border-white/20"></div>
          </div>
        </div>

        {/* Net (Ở giữa) */}
        <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-1 md:w-2 bg-gradient-to-b from-white via-white to-gray-300 h-full shadow-lg z-10">
          <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')] opacity-50"></div>
        </div>
      </div>

      {/* Render tất cả cầu thủ ở vị trí cố định */}
      {players.map(player => (
        <div 
          key={player.id}
          className={`
            absolute flex items-center justify-center z-20
            ${player.id === "t1p1" ? "left-[25%] top-[75%]" : ""}
            ${player.id === "t1p2" ? "left-[25%] top-[25%]" : ""}
            ${player.id === "t2p1" ? "left-[75%] top-[25%]" : ""}
            ${player.id === "t2p2" ? "left-[75%] top-[75%]" : ""}
            transform -translate-x-1/2 -translate-y-1/2
          `}
        >
          <PlayerMarker
            name={player.name}
            isServing={player.isServer}
            isReceiver={player.isReceiver}
            slot={player.slot}
            side={player.isTeam1 ? "team1" : "team2"}
            positionName={player.positionName}
            isTeam1={player.isTeam1}
          />
        </div>
      ))}

      {/* Hiển thị thông tin lượt phát đầu tiên */}
      {firstServe && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-30"
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
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className="flex flex-col items-end gap-1">
          <div className="bg-gradient-to-l from-red-800 to-red-900 text-white text-sm md:text-lg font-bold px-4 md:px-6 py-2 rounded-lg shadow-lg border-r-4 border-yellow-400">
            ĐỘI 2
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

      {/* Trung tâm sân - Logo hoặc thông tin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="text-[10px] md:text-xs text-white/40 font-bold">
          CẦU LÔNG ĐÔI
        </div>
      </div>
    </div>
  );
}