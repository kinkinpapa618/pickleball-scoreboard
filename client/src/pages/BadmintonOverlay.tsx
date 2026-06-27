import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Feather, AlertCircle } from "lucide-react";
import {
  getServerName,
  dbToGameState,
} from "@/utils/badmintonLogic";

// ─── Types ───────────────────────────────────────────────
interface BadmintonMatch {
  id: number;
  type: "singles" | "doubles" | "mixed";
  bestOf: number;
  winningPoints: number;
  status: "pending" | "live" | "completed";
  currentGame: number;
  gamesWonTeam1: number;
  gamesWonTeam2: number;
  winnerTeam: 1 | 2 | null;
  gameScores: Array<[number, number]>;
  currentScoreTeam1: number;
  currentScoreTeam2: number;
  servingTeam: 1 | 2;
  servingPlayer: 1 | 2;
  team1Swapped: boolean;
  team2Swapped: boolean;
  team1Side: "left" | "right";
  endsChanged: boolean;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
}

export default function BadmintonOverlay() {
  const { id } = useParams<{ id: string }>();
  const [visible, setVisible] = useState(true);

  // ─── Data ──────────────────────────────────────────────
  const { data: match, isLoading } = useQuery<BadmintonMatch>({
    queryKey: ["/api/badminton/matches", id],
    queryFn: () =>
      apiRequest("GET", `/api/badminton/matches/${id}`).then((r) => r.json()),
    refetchInterval: 1000, // Update every second for live feel
  });

  const isCompleted = match?.status === "completed";

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

  // Apply transparent background to body for OBS
  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  if (isLoading) {
    return <div className="p-4 text-white font-mono text-sm">Loading match data...</div>;
  }

  if (!match) {
    return (
      <div className="p-4 text-red-500 font-mono text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> Match not found
      </div>
    );
  }

  const isDoubles = match.type !== "singles";

  return (
    <div className={`w-[500px] p-2 font-sans select-none bg-transparent transition-opacity duration-1000 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      {/* ── SCOREBOARD BODY ── */}
      <div className="bg-transparent border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Team 1 Row */}
        <div className="relative flex items-center justify-between px-5 py-3.5">
          {/* Serving or Winning indicator */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${
              !isCompleted && match.servingTeam === 1
                ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                : isCompleted && match.winnerTeam === 1
                ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                : "bg-transparent"
            }`}
          />
          
          {/* Highlight bg */}
          {((!isCompleted && match.servingTeam === 1) || (isCompleted && match.winnerTeam === 1)) && (
            <div className={`absolute inset-0 pointer-events-none ${
              isCompleted && match.winnerTeam === 1
                ? "bg-blue-500/10"
                : "bg-gradient-to-r from-blue-500/8 to-transparent"
            }`} />
          )}

          {/* Player names */}
          <div className="flex flex-col z-10 pl-2">
            <span className={`font-black uppercase tracking-wide text-base transition-colors ${
              isCompleted && match.winnerTeam === 1 ? "text-blue-400" : "text-white"
            }`}>
              {match.team1Player1}
            </span>
            {isDoubles && match.team1Player2 && (
              <span className={`font-black uppercase tracking-wide text-xs transition-colors ${
                isCompleted && match.winnerTeam === 1 ? "text-blue-400/80" : "text-white/60"
              }`}>
                {match.team1Player2}
              </span>
            )}
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4 z-10">
            {/* Set breakdowns */}
            {match.bestOf > 1 && (
              <div className="flex items-center gap-2">
                {match.gameScores.map(([s1], i) => (
                  <span key={i} className="text-[13px] font-bold text-white/40 w-6 text-center">{s1}</span>
                ))}
              </div>
            )}
            
            {/* Serve Icon */}
            {!isCompleted && (
              <div className="w-6 flex items-center justify-center">
                <Feather className={`w-5 h-5 transition-all duration-300 ${
                  match.servingTeam === 1 ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "text-transparent"
                }`} />
              </div>
            )}

            {/* Main Score */}
            <span className={`font-black tabular-nums text-right transition-all duration-300 min-w-[2.5rem] ${
              isCompleted && match.winnerTeam === 1
                ? "text-blue-400 text-4xl"
                : !isCompleted && match.servingTeam === 1
                ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)] text-4xl"
                : "text-white/70 text-3xl"
            }`}>
              {match.bestOf === 1
                ? (isCompleted ? (match.gameScores[0]?.[0] ?? match.currentScoreTeam1) : match.currentScoreTeam1)
                : (isCompleted ? match.gamesWonTeam1 : match.currentScoreTeam1)
              }
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-5" />

        {/* Team 2 Row */}
        <div className="relative flex items-center justify-between px-5 py-3.5">
          {/* Serving or Winning indicator */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${
              !isCompleted && match.servingTeam === 2
                ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                : isCompleted && match.winnerTeam === 2
                ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                : "bg-transparent"
            }`}
          />
          
          {/* Highlight bg */}
          {((!isCompleted && match.servingTeam === 2) || (isCompleted && match.winnerTeam === 2)) && (
            <div className={`absolute inset-0 pointer-events-none ${
              isCompleted && match.winnerTeam === 2
                ? "bg-orange-500/10"
                : "bg-gradient-to-r from-orange-500/8 to-transparent"
            }`} />
          )}

          {/* Player names */}
          <div className="flex flex-col z-10 pl-2">
            <span className={`font-black uppercase tracking-wide text-base transition-colors ${
              isCompleted && match.winnerTeam === 2 ? "text-orange-400" : "text-white"
            }`}>
              {match.team2Player1}
            </span>
            {isDoubles && match.team2Player2 && (
              <span className={`font-black uppercase tracking-wide text-xs transition-colors ${
                isCompleted && match.winnerTeam === 2 ? "text-orange-400/80" : "text-white/60"
              }`}>
                {match.team2Player2}
              </span>
            )}
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4 z-10">
            {/* Set breakdowns */}
            {match.bestOf > 1 && (
              <div className="flex items-center gap-2">
                {match.gameScores.map(([, s2], i) => (
                  <span key={i} className="text-[13px] font-bold text-white/40 w-6 text-center">{s2}</span>
                ))}
              </div>
            )}
            
            {/* Serve Icon */}
            {!isCompleted && (
              <div className="w-6 flex items-center justify-center">
                <Feather className={`w-5 h-5 transition-all duration-300 ${
                  match.servingTeam === 2 ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "text-transparent"
                }`} />
              </div>
            )}

            {/* Main Score */}
            <span className={`font-black tabular-nums text-right transition-all duration-300 min-w-[2.5rem] ${
              isCompleted && match.winnerTeam === 2
                ? "text-orange-400 text-4xl"
                : !isCompleted && match.servingTeam === 2
                ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.6)] text-4xl"
                : "text-white/70 text-3xl"
            }`}>
              {match.bestOf === 1
                ? (isCompleted ? (match.gameScores[0]?.[1] ?? match.currentScoreTeam2) : match.currentScoreTeam2)
                : (isCompleted ? match.gamesWonTeam2 : match.currentScoreTeam2)
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
