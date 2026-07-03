import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useState, useEffect } from "react";

export default function MatchOverlay() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"), 1000);
  const [visible, setVisible] = useState(true);

  const isCompleted = match?.status === "completed";

  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isCompleted]);

  if (!match) return null;

  const isDoubles = match.type === "doubles";
  const team1Name = isDoubles && match.team1Player2
    ? `${match.team1Player1} / ${match.team1Player2}`
    : match.team1Player1;
  const team2Name = isDoubles && match.team2Player2
    ? `${match.team2Player1} / ${match.team2Player2}`
    : match.team2Player1;

  return (
    <div className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      <div className="absolute top-[15px] left-[15px] w-[420px] h-[100px] bg-white border border-black/8 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden flex">

        {/* Names Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Team 1 Row */}
          <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${
            match.isServer1 && !isCompleted ? "bg-blue-50/50" : ""
          }`}>
            <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${
              match.isServer1 && !isCompleted
                ? "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.5)]"
                : "bg-transparent"
            }`} />

            <span className="text-[#334155] text-[14px] font-extrabold uppercase tracking-wide truncate pl-4">
              {team1Name}
            </span>

            {match.isServer1 && !isCompleted && isDoubles && (
              <div className="flex flex-col gap-[3px] justify-center ml-auto mr-1">
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                  match.serverNumber >= 1 ? "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.4)]" : "bg-[#cbd5e1]"
                }`} />
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                  match.serverNumber === 2 ? "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.4)]" : "bg-[#cbd5e1]"
                }`} />
              </div>
            )}
          </div>

          {/* Team 2 Row */}
          <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${
            match.isServer2 && !isCompleted ? "bg-orange-50/50" : ""
          }`}>
            <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${
              match.isServer2 && !isCompleted
                ? "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.5)]"
                : "bg-transparent"
            }`} />

            <span className="text-[#334155] text-[14px] font-extrabold uppercase tracking-wide truncate pl-4">
              {team2Name}
            </span>

            {match.isServer2 && !isCompleted && isDoubles && (
              <div className="flex flex-col gap-[3px] justify-center ml-auto mr-1">
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                  match.serverNumber >= 1 ? "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.4)]" : "bg-[#cbd5e1]"
                }`} />
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                  match.serverNumber === 2 ? "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.4)]" : "bg-[#cbd5e1]"
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Score Area */}
        <div className="w-[60px] flex flex-col justify-center border-l border-black/5">
          <div className={`flex items-center justify-center h-[46px] transition-all duration-300 ${
            isCompleted
              ? (match.winnerTeam === 1 ? "text-[#0086ff] text-[26px] font-black" : "text-[#64748b] text-[20px] font-bold")
              : (match.isServer1
                  ? "text-[#0086ff] text-[26px] font-black [text-shadow:0_0_6px_rgba(0,134,255,0.2)]"
                  : "text-[#64748b] text-[20px] font-bold"
                )
          }`}>
            {match.scoreTeam1}
          </div>
          <div className={`flex items-center justify-center h-[46px] transition-all duration-300 ${
            isCompleted
              ? (match.winnerTeam === 2 ? "text-[#ff6a00] text-[26px] font-black" : "text-[#64748b] text-[20px] font-bold")
              : (match.isServer2
                  ? "text-[#ff6a00] text-[26px] font-black [text-shadow:0_0_6px_rgba(255,106,0,0.2)]"
                  : "text-[#64748b] text-[20px] font-bold"
                )
          }`}>
            {match.scoreTeam2}
          </div>
        </div>
      </div>
    </div>
  );
}
