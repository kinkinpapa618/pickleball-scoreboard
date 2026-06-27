import { useEffect } from "react";
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

  // ─── Data ──────────────────────────────────────────────
  const { data: match, isLoading } = useQuery<BadmintonMatch>({
    queryKey: ["/api/badminton/matches", id],
    queryFn: () =>
      apiRequest("GET", `/api/badminton/matches/${id}`).then((r) => r.json()),
    refetchInterval: 1000, // Update every second for live feel
  });

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

  const gameState = dbToGameState(match);
  const isCompleted = match.status === "completed";
  const isDoubles = match.type !== "singles";

  // Name highlighting logic based on serve position
  const isT1P1Serving = match.servingTeam === 1 && (
    match.type === "singles" ? true : !match.team1Swapped ? match.servingPlayer === 1 : match.servingPlayer === 2
  );
  const isT1P2Serving = match.servingTeam === 1 && isDoubles && !isT1P1Serving;
  const isT2P1Serving = match.servingTeam === 2 && (
    match.type === "singles" ? true : !match.team2Swapped ? match.servingPlayer === 1 : match.servingPlayer === 2
  );
  const isT2P2Serving = match.servingTeam === 2 && isDoubles && !isT2P1Serving;

  return (
    <div className="w-[650px] p-4 font-sans select-none">
      <div className="flex flex-col">
        {/* ── SCOREBOARD BODY ── */}
        <div className="flex rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
          {/* Team 1 Side */}
          <div className="flex-1 flex items-stretch">
            {/* Serve Indicator Line */}
            <div className={`w-1.5 transition-all duration-300 ${
              match.servingTeam === 1 && !isCompleted ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-transparent"
            }`} />
            
            <div className="flex-1 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex flex-col">
                <span className={`font-black uppercase tracking-wide text-lg leading-tight transition-colors ${
                  isCompleted ? (match.winnerTeam === 1 ? "text-blue-400" : "text-white/40") :
                  isT1P1Serving ? "text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "text-white"
                }`}>
                  {match.team1Player1}
                </span>
                {isDoubles && match.team1Player2 && (
                  <span className={`font-black uppercase tracking-wide text-sm transition-colors ${
                    isCompleted ? (match.winnerTeam === 1 ? "text-blue-400/80" : "text-white/30") :
                    isT1P2Serving ? "text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "text-white/70"
                  }`}>
                    {match.team1Player2}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {match.gameScores.map(([s1], i) => (
                    <div key={i} className="w-5 text-center text-xs font-bold text-white/40">{s1}</div>
                  ))}
                  {(!isCompleted) && (
                    <div className="w-5" /> // Spacer for current game if previous games exist
                  )}
                </div>
                <span className={`tabular-nums font-black text-5xl w-16 text-right transition-colors ${
                  isCompleted ? (match.winnerTeam === 1 ? "text-blue-400" : "text-white/30") :
                  match.servingTeam === 1 ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]" : "text-white"
                }`}>
                  {isCompleted ? match.gamesWonTeam1 : match.currentScoreTeam1}
                </span>
              </div>
            </div>
          </div>

          <div className="w-px bg-white/10" />

          {/* Team 2 Side */}
          <div className="flex-1 flex items-stretch">
            <div className="flex-1 px-4 py-3 flex items-center justify-between bg-gradient-to-l from-orange-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <span className={`tabular-nums font-black text-5xl w-16 text-left transition-colors ${
                  isCompleted ? (match.winnerTeam === 2 ? "text-orange-400" : "text-white/30") :
                  match.servingTeam === 2 ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]" : "text-white"
                }`}>
                  {isCompleted ? match.gamesWonTeam2 : match.currentScoreTeam2}
                </span>
                <div className="flex gap-0.5">
                  {(!isCompleted) && (
                    <div className="w-5" />
                  )}
                  {match.gameScores.map(([, s2], i) => (
                    <div key={i} className="w-5 text-center text-xs font-bold text-white/40">{s2}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`font-black uppercase tracking-wide text-lg leading-tight text-right transition-colors ${
                  isCompleted ? (match.winnerTeam === 2 ? "text-orange-400" : "text-white/40") :
                  isT2P1Serving ? "text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "text-white"
                }`}>
                  {match.team2Player1}
                </span>
                {isDoubles && match.team2Player2 && (
                  <span className={`font-black uppercase tracking-wide text-sm text-right transition-colors ${
                    isCompleted ? (match.winnerTeam === 2 ? "text-orange-400/80" : "text-white/30") :
                    isT2P2Serving ? "text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "text-white/70"
                  }`}>
                    {match.team2Player2}
                  </span>
                )}
              </div>
            </div>
            {/* Serve Indicator Line */}
            <div className={`w-1.5 transition-all duration-300 ${
              match.servingTeam === 2 && !isCompleted ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-transparent"
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
