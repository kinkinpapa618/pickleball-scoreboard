import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";

export default function MatchOverlay() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"), 1000);

  if (!match) return null;

  return (
    <div className="h-screen w-full bg-transparent font-sans overflow-hidden">
      <div className="absolute top-[15px] left-[15px] w-[550px] bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Header / LIVE TAG */}
        <div className="h-8 bg-black/40 flex items-center justify-between px-4 border-b border-white/5">
          <div className="text-white/50 text-xs font-semibold tracking-widest uppercase">
            Pickleball Match
          </div>
          {match.status === "live" && (
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
              </div>
              <span className="text-red-500 font-bold tracking-widest text-[11px] uppercase">
                LIVE
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col relative">
          {/* Team 1 Row */}
          <div className="relative flex items-center justify-between px-6 py-5 group">
            {/* Serving Indicator Line */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                match.isServer1
                  ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  : "bg-transparent"
              }`}
            />

            <div className="flex flex-col z-10">
              <span className={`text-2xl font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                  match.isServer1
                    ? match.serverNumber === 1
                      ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                      : "text-white"
                    : "text-slate-400"
                }`}
              >
                {match.team1Player1}
              </span>
              {match.type === "doubles" && (
                <span className={`text-2xl font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                    match.isServer1
                      ? match.serverNumber === 2
                        ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                        : "text-white"
                      : "text-slate-400"
                  }`}
                >
                  {match.team1Player2}
                </span>
              )}
            </div>

            <div className="flex items-center gap-12 z-10">
              <div className="flex flex-col gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    match.isServer1 && match.serverNumber >= 1
                      ? "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                      : "bg-white/10"
                  }`}
                />
                {match.type === "doubles" && (
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      match.isServer1 && match.serverNumber >= 2
                        ? "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-6xl font-black transition-all duration-300 text-blue-400 text-right w-20 ${
                  match.isServer1
                    ? "drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                    : ""
                }`}
              >
                {match.scoreTeam1}
              </span>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent w-full" />

          {/* Team 2 Row */}
          <div className="relative flex items-center justify-between px-6 py-5 group">
            {/* Serving Indicator Line */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                match.isServer2
                  ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                  : "bg-transparent"
              }`}
            />

            <div className="flex flex-col z-10">
              <span className={`text-2xl font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                  match.isServer2
                    ? match.serverNumber === 1
                      ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                      : "text-white"
                    : "text-slate-400"
                }`}
              >
                {match.team2Player1}
              </span>
              {match.type === "doubles" && (
                <span className={`text-2xl font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                    match.isServer2
                      ? match.serverNumber === 2
                        ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                        : "text-white"
                      : "text-slate-400"
                  }`}
                >
                  {match.team2Player2}
                </span>
              )}
            </div>

            <div className="flex items-center gap-12 z-10">
              <div className="flex flex-col gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    match.isServer2 && match.serverNumber >= 1
                      ? "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]"
                      : "bg-white/10"
                  }`}
                />
                {match.type === "doubles" && (
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      match.isServer2 && match.serverNumber >= 2
                        ? "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-6xl font-black transition-all duration-300 text-orange-400 text-right w-20 ${
                  match.isServer2
                    ? "drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]"
                    : ""
                }`}
              >
                {match.scoreTeam2}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
