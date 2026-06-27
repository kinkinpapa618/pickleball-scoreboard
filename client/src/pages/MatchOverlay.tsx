import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useState, useEffect } from "react";

export default function MatchOverlay() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"), 1000);
  const [visible, setVisible] = useState(true);

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

  if (!match) return null;

  const isDoubles = match.type === "doubles";

  return (
    <div className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      <div className="absolute top-[15px] left-[15px] w-[420px] bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex flex-col">
        
        {/* Header / LIVE TAG */}
        <div className="h-8 bg-black/40 flex items-center justify-between px-4 border-b border-white/5">
          <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase">
            PICKLEBALL MATCH
          </div>
          {match.status === "live" && (
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </div>
              <span className="text-red-500 font-bold tracking-widest text-[10px] uppercase">
                LIVE
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col relative">
          {/* Team 1 Row */}
          <div className="relative flex items-center justify-between pl-4 pr-3 py-3">
            {/* Active indicator bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${
                match.isServer1
                  ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  : "bg-transparent"
              }`}
            />
            
            {/* Subtle serve background highlight */}
            {match.isServer1 && !isCompleted && (
              <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            )}

            {/* Player Names */}
            <div className="flex flex-col z-10 pl-2">
              <span className={`font-extrabold uppercase tracking-wide text-[15px] leading-tight transition-colors ${
                isCompleted && match.gamesWonTeam1 > match.gamesWonTeam2 ? "text-blue-400" : "text-white"
              }`}>
                {match.team1Player1}
              </span>
              {isDoubles && match.team1Player2 && (
                <span className={`font-bold uppercase tracking-wide text-[11px] mt-0.5 transition-colors ${
                  isCompleted && match.gamesWonTeam1 > match.gamesWonTeam2 ? "text-blue-400/80" : "text-slate-400"
                }`}>
                  {match.team1Player2}
                </span>
              )}
            </div>

            {/* Scores Area */}
            <div className="flex items-center gap-3 z-10">
              {/* Server Number indicator dots/capsules */}
              {match.isServer1 && !isCompleted && (
                <div className="flex flex-col gap-1 items-end justify-center mr-1">
                  <div className={`h-1.5 w-3 rounded-full transition-all duration-300 ${
                    match.serverNumber >= 1 ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-white/10"
                  }`} />
                  {isDoubles && (
                    <div className={`h-1.5 w-3 rounded-full transition-all duration-300 ${
                      match.serverNumber === 2 ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-white/10"
                    }`} />
                  )}
                </div>
              )}

              {/* Main Score Box */}
              <div className={`w-12 h-11 flex items-center justify-center rounded-xl font-black text-2xl transition-all duration-300 ${
                isCompleted 
                  ? (match.gamesWonTeam1 > match.gamesWonTeam2 ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-500")
                  : (match.isServer1 
                      ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]" 
                      : "bg-slate-900 text-slate-300"
                    )
              }`}>
                {match.scoreTeam1}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4" />

          {/* Team 2 Row */}
          <div className="relative flex items-center justify-between pl-4 pr-3 py-3">
            {/* Active indicator bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${
                match.isServer2
                  ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                  : "bg-transparent"
              }`}
            />
            
            {/* Subtle serve background highlight */}
            {match.isServer2 && !isCompleted && (
              <div className="absolute inset-0 bg-orange-500/5 pointer-events-none" />
            )}

            {/* Player Names */}
            <div className="flex flex-col z-10 pl-2">
              <span className={`font-extrabold uppercase tracking-wide text-[15px] leading-tight transition-colors ${
                isCompleted && match.gamesWonTeam2 > match.gamesWonTeam1 ? "text-orange-400" : "text-white"
              }`}>
                {match.team2Player1}
              </span>
              {isDoubles && match.team2Player2 && (
                <span className={`font-bold uppercase tracking-wide text-[11px] mt-0.5 transition-colors ${
                  isCompleted && match.gamesWonTeam2 > match.gamesWonTeam1 ? "text-orange-400/80" : "text-slate-400"
                }`}>
                  {match.team2Player2}
                </span>
              )}
            </div>

            {/* Scores Area */}
            <div className="flex items-center gap-3 z-10">
              {/* Server Number indicator dots/capsules */}
              {match.isServer2 && !isCompleted && (
                <div className="flex flex-col gap-1 items-end justify-center mr-1">
                  <div className={`h-1.5 w-3 rounded-full transition-all duration-300 ${
                    match.serverNumber >= 1 ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "bg-white/10"
                  }`} />
                  {isDoubles && (
                    <div className={`h-1.5 w-3 rounded-full transition-all duration-300 ${
                      match.serverNumber === 2 ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "bg-white/10"
                    }`} />
                  )}
                </div>
              )}

              {/* Main Score Box */}
              <div className={`w-12 h-11 flex items-center justify-center rounded-xl font-black text-2xl transition-all duration-300 ${
                isCompleted 
                  ? (match.gamesWonTeam2 > match.gamesWonTeam1 ? "bg-orange-600 text-white" : "bg-slate-900 text-slate-500")
                  : (match.isServer2 
                      ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]" 
                      : "bg-slate-900 text-slate-300"
                    )
              }`}>
                {match.scoreTeam2}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
