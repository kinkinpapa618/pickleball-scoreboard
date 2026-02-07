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
                PHÁT
              </motion.div>
            )}
            {isReceiver && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-gray-400 rounded-full shadow-[0_0_10px_rgba(156,163,175,0.6)] flex items-center justify-center text-[10px] font-bold text-gray-900"
              >
                ĐỠ
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
}: CourtProps) {
  const isT1Serving = serverTeam === 1;
  const currentScore = isT1Serving ? score1 : score2;
  const serveSide = currentScore % 2 === 0 ? "right" : "left";

  const isServer = (pid: string, team: 1 | 2) => {
    if (team !== serverTeam) return false;
    return positions[pid] === serveSide;
  };

  const isReceiver = (pid: string, team: 1 | 2) => {
    if (team === serverTeam) return false;
    return positions[pid] === serveSide;
  };

  // Hàm sắp xếp cầu thủ theo vai trò
  const getTeamDisplay = (team: 1 | 2) => {
    const teamPrefix = `t${team}`;
    const playerIds = [`${teamPrefix}p1`, `${teamPrefix}p2`];

    // Tìm người phát và người nhận trong đội
    const serverPlayer = playerIds.find(pid => isServer(pid, team));
    const receiverPlayer = playerIds.find(pid => isReceiver(pid, team));

    let displayOrder = [...playerIds];

    if (team === serverTeam) {
      // Đội đang phát: slot 1 = người phát, slot 2 = người còn lại
      if (serverPlayer === `${teamPrefix}p2`) {
        // Nếu người phát là p2, đổi chỗ để p2 lên slot 1
        displayOrder = [`${teamPrefix}p2`, `${teamPrefix}p1`];
      }
    } else {
      // Đội đang nhận: slot 1 = người nhận, slot 2 = người còn lại
      if (receiverPlayer === `${teamPrefix}p2`) {
        // Nếu người nhận là p2, đổi chỗ để p2 lên slot 1
        displayOrder = [`${teamPrefix}p2`, `${teamPrefix}p1`];
      }
    }

    // Trả về thông tin hiển thị
    return displayOrder.map((pid, index) => ({
      id: pid,
      name: names[pid as keyof typeof names],
      isServer: isServer(pid, team),
      isReceiver: isReceiver(pid, team),
      slot: index + 1,
      // Vị trí hiển thị: slot 1 = left, slot 2 = right
      position: index === 0 ? "left" as const : "right" as const,
    }));
  };

  const team1Display = getTeamDisplay(1);
  const team2Display = getTeamDisplay(2);

  return (
    <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 select-none">
      {/* Court Surface */}
      <div className="absolute inset-0 bg-blue-600 flex flex-col">
        {/* Top Side (Team 2) */}
        <div className="flex-1 relative border-b-2 border-white/30 flex">
          {/* Top Left - Slot 1 của Team 2 */}
          <div className="flex-1 border-r border-white/20 relative">
            {team2Display[0] && (
              <PlayerMarker
                name={team2Display[0].name}
                isServing={team2Display[0].isServer}
                isReceiver={team2Display[0].isReceiver}
                isTop={true}
                slot={team2Display[0].slot}
                position={team2Display[0].position}
              />
            )}
          </div>
          {/* Top Right - Slot 2 của Team 2 */}
          <div className="flex-1 relative">
            {team2Display[1] && (
              <PlayerMarker
                name={team2Display[1].name}
                isServing={team2Display[1].isServer}
                isReceiver={team2Display[1].isReceiver}
                isTop={true}
                slot={team2Display[1].slot}
                position={team2Display[1].position}
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
            {team1Display[0] && (
              <PlayerMarker
                name={team1Display[0].name}
                isServing={team1Display[0].isServer}
                isReceiver={team1Display[0].isReceiver}
                isTop={false}
                slot={team1Display[0].slot}
                position={team1Display[0].position}
              />
            )}
          </div>
          {/* Bottom Right - Slot 2 của Team 1 */}
          <div className="flex-1 relative pt-12">
            {team1Display[1] && (
              <PlayerMarker
                name={team1Display[1].name}
                isServing={team1Display[1].isServer}
                isReceiver={team1Display[1].isReceiver}
                isTop={false}
                slot={team1Display[1].slot}
                position={team1Display[1].position}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}