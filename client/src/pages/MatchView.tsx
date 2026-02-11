import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchView() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"));

  if (!match) return null;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent font-sans p-10">
      <div className="w-full max-w-4xl bg-black/80 backdrop-blur-md border-4 border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Team 1 Row */}
        <div
          className={`flex items-center justify-between px-12 py-8 transition-colors duration-500 ${match.isServer1 ? "bg-[#ccff00]" : "bg-transparent"}`}
        >
          <div
            className={`flex flex-col ${match.isServer1 ? "text-black" : "text-white"}`}
          >
            <span className="text-4xl font-black italic uppercase leading-tight">
              {match.team1Player1}
            </span>
            <span className="text-4xl font-black italic uppercase leading-tight opacity-80">
              {match.team1Player2}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-2">
              <div
                className={`w-5 h-5 rounded-full ${match.isServer1 && match.serverNumber >= 1 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-white/10"}`}
              />
              <div
                className={`w-5 h-5 rounded-full ${match.isServer1 && match.serverNumber === 2 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-white/10"}`}
              />
            </div>
            <span
              className={`text-9xl font-black italic tabular-nums ${match.isServer1 ? "text-black" : "text-[#ccff00]"}`}
            >
              {match.scoreTeam1}
            </span>
          </div>
        </div>

        <div className="h-[2px] bg-white/10 w-full" />

        {/* Team 2 Row */}
        <div
          className={`flex items-center justify-between px-12 py-8 transition-colors duration-500 ${match.isServer2 ? "bg-[#ccff00]" : "bg-transparent"}`}
        >
          <div
            className={`flex flex-col ${match.isServer2 ? "text-black" : "text-white"}`}
          >
            <span className="text-4xl font-black italic uppercase leading-tight">
              {match.team2Player1}
            </span>
            <span className="text-4xl font-black italic uppercase leading-tight opacity-80">
              {match.team2Player2}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-2">
              <div
                className={`w-5 h-5 rounded-full ${match.isServer2 && match.serverNumber >= 1 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-white/10"}`}
              />
              <div
                className={`w-5 h-5 rounded-full ${match.isServer2 && match.serverNumber === 2 ? "bg-red-600 animate-pulse shadow-[0_0_15px_red]" : "bg-white/10"}`}
              />
            </div>
            <span
              className={`text-9xl font-black italic tabular-nums ${match.isServer2 ? "text-black" : "text-[#ccff00]"}`}
            >
              {match.scoreTeam2}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE TAG */}
      {match.status === "live" && (
        <div className="absolute top-10 right-10 flex items-center gap-3 bg-black/60 border border-yellow-500/50 px-6 py-2 rounded-full">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
          <span className="text-yellow-500 font-black italic tracking-widest text-xl animate-pulse">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
