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
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        absolute ${position === "left" ? "top-4 md:top-6" : "bottom-4 md:bottom-6"} 
        flex flex-col items-center
        ${side === "team1" ? "left-2 md:left-6 lg:left-10" : "right-2 md:right-6 lg:right-10"}
        w-24 md:w-32 lg:w-40
      `}
    >
      {/* Badge cho người phát/người nhận */}
      {(isServing || isReceiver) && (
        <div className="flex flex-col items-center gap-1 mb-1 w-full">
          {isServing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full px-2 py-1 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)] flex items-center justify-center text-[10px] md:text-xs font-bold text-yellow-900 truncate"
            >
              <span className="hidden xs:inline">SLOT {slot} - </span>PHÁT
            </motion.div>
          )}
          {isReceiver && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full px-2 py-1 bg-gray-400 rounded-full shadow-[0_0_8px_rgba(156,163,175,0.6)] flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-900 truncate"
            >
              <span className="hidden xs:inline">SLOT {slot} - </span>ĐỠ
            </motion.div>
          )}
        </div>
      )}

      {/* Thẻ tên cầu thủ */}
      <div
        className={`
          flex flex-col items-center gap-1 w-full px-2 py-2 md:py-3 rounded-xl transition-all duration-300
          ${isServing ? "scale-105 shadow-lg" : "opacity-90 scale-95"}
          ${
            isServing
              ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400"
              : isReceiver
              ? "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-400"
              : "bg-black/30 text-white border border-white/30"
          }
        `}
      >
        {/* Vị trí trên sân */}
        <div className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${position === "left" ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"}`}>
          {position === "left" ? "TRÊN" : "DƯỚI"}
        </div>

        {/* Tên cầu thủ */}
        <div className="flex items-center gap-1 md:gap-2">
          <User className="w-3 h-3 md:w-4 md:h-4" />
          <span className="text-xs md:text-sm lg:text-base font-bold truncate max-w-[80px] md:max-w-[120px]">
            {name || "Player"}
          </span>
        </div>

        {/* Slot số */}
        <div className="text-[10px] md:text-xs font-medium text-gray-600">
          SLOT {slot}
        </div>
      </div>
    </motion.div>
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

  // Hàm sắp xếp cầu thủ theo vai trò
  const getTeamPlayers = (team: 1 | 2) => {
    const teamPrefix = `t${team}`;

    // Tạo mảng cầu thủ ban đầu
    const players = [
      { id: `${teamPrefix}p1`, name: names[`${teamPrefix}p1` as keyof typeof names] },
      { id: `${teamPrefix}p2`, name: names[`${teamPrefix}p2` as keyof typeof names] },
    ];

    let displayPlayers = [...players];

    if (team === serverTeam) {
      // Đội đang phát: slot 1 = người phát, slot 2 = người còn lại
      if (serverPlayerId === `${teamPrefix}p2`) {
        // Nếu người phát là p2, đổi chỗ để p2 lên slot 1
        displayPlayers = [players[1], players[0]];
      }
    } else {
      // Đội đang nhận: slot 1 = người nhận, slot 2 = người còn lại
      if (receiverPlayerId === `${teamPrefix}p2`) {
        // Nếu người nhận là p2, đổi chỗ để p2 lên slot 1
        displayPlayers = [players[1], players[0]];
      }
    }

    // Thêm thông tin vai trò và vị trí
    return displayPlayers.map((player, index) => ({
      ...player,
      isServer: player.id === serverPlayerId,
      isReceiver: player.id === receiverPlayerId,
      slot: index + 1,
      position: positions[player.id] as "left" | "right",
    }));
  };

  const team1Players = getTeamPlayers(1);
  const team2Players = getTeamPlayers(2);

  return (
    <div className="relative w-full min-h-[300px] md:min-h-[400px] max-w-7xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white/20 select-none bg-gradient-to-br from-blue-900/20 to-purple-900/20">
      {/* Court Surface - Layout ngang */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 flex flex-row">

        {/* Team 1 Side (Bên trái) */}
        <div className="flex-1 relative border-r-2 md:border-r-4 border-white/30 flex flex-col">
          {/* Khu vực trước lưới bên trái */}
          <div className="absolute right-0 w-1/4 h-full bg-blue-500/20 border-l border-dashed border-white/20"></div>

          {/* Team 1 - Slot 1 (Trên) */}
          <div className="flex-1 border-b border-white/20 relative flex items-center justify-end pr-4 md:pr-8">
            {team1Players[0] && (
              <div className="transform -translate-y-4 md:-translate-y-6">
                <PlayerMarker
                  name={team1Players[0].name}
                  isServing={team1Players[0].isServer}
                  isReceiver={team1Players[0].isReceiver}
                  slot={team1Players[0].slot}
                  position={team1Players[0].position}
                  side="team1"
                />
              </div>
            )}
          </div>

          {/* Team 1 - Slot 2 (Dưới) */}
          <div className="flex-1 relative flex items-center justify-end pr-4 md:pr-8">
            {team1Players[1] && (
              <div className="transform translate-y-4 md:translate-y-6">
                <PlayerMarker
                  name={team1Players[1].name}
                  isServing={team1Players[1].isServer}
                  isReceiver={team1Players[1].isReceiver}
                  slot={team1Players[1].slot}
                  position={team1Players[1].position}
                  side="team1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Net (Ở giữa, chạy dọc) */}
        <div className="w-1 md:w-2 bg-gradient-to-b from-white via-white to-gray-300 h-full shadow-lg z-10 relative flex flex-col items-center justify-between py-4">
          {/* Đầu trên lưới */}
          <div className="w-full h-6 bg-gradient-to-b from-gray-800 to-gray-600"></div>

          {/* Thân lưới */}
          <div className="flex-1 w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50">
            <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')]"></div>
          </div>

          {/* Đầu dưới lưới */}
          <div className="w-full h-6 bg-gradient-to-t from-gray-800 to-gray-600"></div>
        </div>

        {/* Team 2 Side (Bên phải) */}
        <div className="flex-1 relative border-l-2 md:border-l-4 border-white/30 flex flex-col">
          {/* Khu vực trước lưới bên phải */}
          <div className="absolute left-0 w-1/4 h-full bg-blue-500/20 border-r border-dashed border-white/20"></div>

          {/* Team 2 - Slot 1 (Trên) */}
          <div className="flex-1 border-b border-white/20 relative flex items-center justify-start pl-4 md:pl-8">
            {team2Players[0] && (
              <div className="transform -translate-y-4 md:-translate-y-6">
                <PlayerMarker
                  name={team2Players[0].name}
                  isServing={team2Players[0].isServer}
                  isReceiver={team2Players[0].isReceiver}
                  slot={team2Players[0].slot}
                  position={team2Players[0].position}
                  side="team2"
                />
              </div>
            )}
          </div>

          {/* Team 2 - Slot 2 (Dưới) */}
          <div className="flex-1 relative flex items-center justify-start pl-4 md:pl-8">
            {team2Players[1] && (
              <div className="transform translate-y-4 md:translate-y-6">
                <PlayerMarker
                  name={team2Players[1].name}
                  isServing={team2Players[1].isServer}
                  isReceiver={team2Players[1].isReceiver}
                  slot={team2Players[1].slot}
                  position={team2Players[1].position}
                  side="team2"
                />
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Hiển thị tên đội */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white text-sm md:text-lg font-bold px-3 md:px-6 py-2 rounded-r-lg shadow-lg border-r-4 border-yellow-400">
            ĐỘI 1
          </div>
          <div className="text-xs md:text-sm text-white/80 font-medium bg-black/30 px-2 py-1 rounded">
            Điểm: {score1}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gradient-to-l from-red-800 to-red-900 text-white text-sm md:text-lg font-bold px-3 md:px-6 py-2 rounded-l-lg shadow-lg border-l-4 border-yellow-400">
            ĐỘI 2
          </div>
          <div className="text-xs md:text-sm text-white/80 font-medium bg-black/30 px-2 py-1 rounded">
            Điểm: {score2}
          </div>
        </div>
      </div>

      {/* Đường biên sân */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Đường biên ngoài */}
        <div className="absolute inset-1 md:ins-2 border-2 border-white/30 rounded-lg"></div>

        {/* Đường giữa sân bên trái */}
        <div className="absolute top-1/2 left-1/4 w-px h-12 -translate-y-1/2 bg-white/40"></div>

        {/* Đường giữa sân bên phải */}
        <div className="absolute top-1/2 right-1/4 w-px h-12 -translate-y-1/2 bg-white/40"></div>
      </div>

      {/* Hướng dẫn vị trí */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="text-[10px] text-white/60 font-medium flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-300"></div>
            <span>TRÊN</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-300"></div>
            <span>DƯỚI</span>
          </div>
        </div>
      </div>
    </div>
  );
}