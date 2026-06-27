import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";

export default function MatchView() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"));

  if (!match) return null;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background font-sans p-10 transition-colors">
      <div className="w-full max-w-4xl bg-card backdrop-blur-md border-4 border-border rounded-[40px] overflow-hidden shadow-xl transition-colors">
        {/* LIVE TAG */}
        {match.status === "live" && (
          <div className="flex items-center justify-end gap-2 py-3 pr-4 bg-muted border-b border-border">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
            <span className="text-red-600 font-black italic tracking-widest text-xl animate-pulse">
              LIVE
            </span>
          </div>
        )}
        {/* Team 1 Row */}
        <div
          className={`flex items-center justify-between px-12 py-8 transition-colors duration-500 ${match.isServer1 ? "bg-[#ccff00]" : "bg-card"}`}
        >
          <div
            className={`flex flex-col ${match.isServer1 ? "text-black" : "text-foreground"}`}
          >
            <span className="text-5xl font-black italic uppercase leading-tight">
              {match.team1Player1}
            </span>
            {match.type === "doubles" && (
              <span className="text-5xl font-black italic uppercase leading-tight opacity-80">
                {match.team1Player2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-8">
            <span className="text-8xl font-black text-blue-600">{match.scoreTeam1}</span>
            <div className="flex flex-col gap-2">
              <div
                className={`w-5 h-5 rounded-full ${match.isServer1 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-slate-200"}`}
              />
              {match.type === "doubles" && (
                <div
                  className={`w-5 h-5 rounded-full ${match.isServer1 && match.isFirstServeOfMatch === false ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-slate-200"}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="h-[2px] bg-slate-100 w-full" />

        {/* Team 2 Row */}
        <div
          className={`flex items-center justify-between px-12 py-8 transition-colors duration-500 ${match.isServer2 ? "bg-[#ccff00]" : "bg-card"}`}
        >
          <div
            className={`flex flex-col ${match.isServer2 ? "text-black" : "text-foreground"}`}
          >
            <span className="text-5xl font-black italic uppercase leading-tight">
              {match.team2Player1}
            </span>
            {match.type === "doubles" && (
              <span className="text-5xl font-black italic uppercase leading-tight opacity-80">
                {match.team2Player2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-8">
            <span className="text-8xl font-black text-orange-600">{match.scoreTeam2}</span>
            <div className="flex flex-col gap-2">
              <div
                className={`w-5 h-5 rounded-full ${match.isServer2 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-slate-200"}`}
              />
              {match.type === "doubles" && (
                <div
                  className={`w-5 h-5 rounded-full ${match.isServer2 && match.isFirstServeOfMatch === false ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-slate-200"}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
