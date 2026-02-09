import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Match } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function MatchView() {
  const { id } = useParams();

  const { data: match } = useQuery<Match>({
    queryKey: [`/api/matches/${id}`],
    refetchInterval: 1000, 
  });

  if (!match) return null;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent p-10">
      <div className="w-[550px] bg-slate-950/95 border-4 border-white/10 p-2 rounded-[2rem] shadow-2xl overflow-hidden">

        {/* TEAM 1 */}
        <div className={cn(
          "flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all duration-500",
          match.isServer1 ? "bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)]" : "text-white opacity-60"
        )}>
          <div className="flex flex-col font-black italic uppercase leading-none tracking-tighter text-lg">
            <span>{match.team1Player1}</span>
            <span>{match.team1Player2}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-6xl font-black italic tabular-nums">{match.scoreTeam1}</span>
            <div className="flex flex-col gap-2">
              <div className={cn("w-4 h-4 rounded-full border-2", match.isServer1 && match.serverNumber >= 1 ? "bg-red-600 border-red-600" : "bg-transparent border-current opacity-20")} />
              <div className={cn("w-4 h-4 rounded-full border-2", match.isServer1 && match.serverNumber === 2 ? "bg-red-600 border-red-600" : "bg-transparent border-current opacity-20")} />
            </div>
          </div>
        </div>

        <div className="flex justify-center my-1">
          <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Live Scoreboard</div>
        </div>

        {/* TEAM 2 */}
        <div className={cn(
          "flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all duration-500",
          match.isServer2 ? "bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)]" : "text-white opacity-60"
        )}>
          <div className="flex flex-col font-black italic uppercase leading-none tracking-tighter text-lg">
            <span>{match.team2Player1}</span>
            <span>{match.team2Player2}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-6xl font-black italic tabular-nums">{match.scoreTeam2}</span>
            <div className="flex flex-col gap-2">
              <div className={cn("w-4 h-4 rounded-full border-2", match.isServer2 && match.serverNumber >= 1 ? "bg-red-600 border-red-600" : "bg-transparent border-current opacity-20")} />
              <div className={cn("w-4 h-4 rounded-full border-2", match.isServer2 && match.serverNumber === 2 ? "bg-red-600 border-red-600" : "bg-transparent border-current opacity-20")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
