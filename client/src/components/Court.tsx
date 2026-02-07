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
  firstServe: boolean; // Thêm firstServe từ hook mới
}

function PlayerMarker({
  name,
  isServing,
  isReceiver,
  isTop,
  slot,
  position,
}: {
  name: string;
  isServing: boolean;
  isReceiver: boolean;
  isTop: boolean;
  slot: number;
  position: "left" | "right";
}) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute ${position === "left" ? "left-4" : "right-4"} flex justify-center items-center ${isTop ? "top-4" : "bottom-8"}`}
    >
      <div
        className={`
        flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
        ${isServing ? "scale-110" : "opacity-80 scale-95"}
      `}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">
            {isServing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-9 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)] flex items-center justify-center text-[10px] font-bold text-yellow-900"
              >
                 SLOT {slot} PHÁT
              </motion.div>
            )}
            {isReceiver && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-gray-400 rounded-full shadow-[0_0_10px_rgba(156,163,175,0.6)] flex items-center justify-center text-[10px] font-bold text-gray-900"
              >
                 SLOT {slot} ĐỠ
              </motion.div>
            )}
          </div>
          <div className="bg-white/80 text-[10px] font-bold px-1.5 rounded-full text-blue-900 border border-blue-200">
            SLOT {slot}
          </div>
        </div>
        <div
          className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm md:text-base shadow-lg backdrop-blur-sm
          ${
            isServing
              ? "bg-white text-blue-900 border-2 border-yellow-400"
              : isReceiver
                ? "bg-white/90 text-gray-900 border-2 border-gray-400"
                : "bg-black/40 text-white border border-white/20"
          }
        `}
        >
          <User className="w-4 h-4" />
          {name || "Player"}
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
  const serverPlayerId = `t${serverTeam}p${serverHand}`; // Ví dụ: t2p2 (Team 2, Player 2)
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
    <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 select-none">
      {/* Court Surface */}
      <div className="absolute inset-0 bg-blue-600 flex flex-col">
        {/* Top Side (Team 2) */}
        <div className="flex-1 relative border-b-2 border-white/30 flex">
          {/* Top Left - Slot 1 của Team 2 */}
          <div className="flex-1 border-r border-white/20 relative">
            {team2Players[0] && (
              <PlayerMarker
                name={team2Players[0].name}
                isServing={team2Players[0].isServer}
                isReceiver={team2Players[0].isReceiver}
                isTop={true}
                slot={team2Players[0].slot}
                position={team2Players[0].position}
              />
            )}
          </div>
          {/* Top Right - Slot 2 của Team 2 */}
          <div className="flex-1 relative">
            {team2Players[1] && (
              <PlayerMarker
                name={team2Players[1].name}
                isServing={team2Players[1].isServer}
                isReceiver={team2Players[1].isReceiver}
                isTop={true}
                slot={team2Players[1].slot}
                position={team2Players[1].position}
              />
            )}
          </div>
          <div className="absolute bottom-0 w-full h-1/4 bg-blue-500/30 border-t border-dashed border-white/20"></div>
        </div>

        {/* Net */}
        <div className="h-2 bg-white/90 w-full shadow-sm z-10 relative flex items-center justify-center">
          <div className="h-full w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjIHFBmAAxxGMCAIg0VAABm6gwVd0K0ZAAAAABJRU5ErkJggg==')] opacity-50"></div>
        </div>

        {/* Bottom Side (Team 1) */}
        <div className="flex-1 relative border-t-2 border-white/30 flex">
          <div className="absolute top-0 w-full h-1/4 bg-blue-500/30 border-b border-dashed border-white/20 pointer-events-none"></div>

          {/* Bottom Left - Slot 1 của Team 1 */}
          <div className="flex-1 border-r border-white/20 relative pt-12">
            {team1Players[0] && (
              <PlayerMarker
                name={team1Players[0].name}
                isServing={team1Players[0].isServer}
                isReceiver={team1Players[0].isReceiver}
                isTop={false}
                slot={team1Players[0].slot}
                position={team1Players[0].position}
              />
            )}
          </div>
          {/* Bottom Right - Slot 2 của Team 1 */}
          <div className="flex-1 relative pt-12">
            {team1Players[1] && (
              <PlayerMarker
                name={team1Players[1].name}
                isServing={team1Players[1].isServer}
                isReceiver={team1Players[1].isReceiver}
                isTop={false}
                slot={team1Players[1].slot}
                position={team1Players[1].position}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hiển thị thông tin lượt phát đầu tiên */}
      {firstServe && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-yellow-500/90 text-yellow-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
            ⚠️ 0-0-2 - Lượt phát đầu tiên
          </div>
        </div>
      )}
    </div>
  );
}