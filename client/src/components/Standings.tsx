import { motion } from "framer-motion";
import { Trophy, Medal, ChevronUp, ChevronDown } from "lucide-react";

interface TeamStats {
  name: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
}

export function Standings({ stats }: { stats: TeamStats[] }) {
  // Sắp xếp theo: 1. Số trận thắng, 2. Hiệu số điểm (Points For - Points Against)
  const sortedStats = [...stats].sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-[#ccff00] font-black italic flex items-center gap-2 uppercase tracking-tighter">
          <Trophy className="w-5 h-5" /> Live Standings
        </h3>
        <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Season 2024</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Athlete / Team</th>
              <th className="px-4 py-4 text-center">P</th>
              <th className="px-4 py-4 text-center text-cyan-400">W</th>
              <th className="px-4 py-4 text-center text-rose-500">L</th>
              <th className="px-6 py-4 text-right">PD (Hiệu số)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedStats.map((team, index) => {
              const diff = team.pointsFor - team.pointsAgainst;
              return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={team.name} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-5">
                    {index === 0 ? (
                      <div className="w-6 h-6 bg-[#ccff00] text-black rounded-full flex items-center justify-center text-[10px] font-black">1</div>
                    ) : (
                      <span className="text-white/40 font-black italic ml-2">{index + 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 font-black italic uppercase tracking-tight text-sm">
                    {team.name}
                  </td>
                  <td className="px-4 py-5 text-center text-white/60 font-mono">{team.played}</td>
                  <td className="px-4 py-5 text-center font-black text-cyan-400 font-mono">{team.won}</td>
                  <td className="px-4 py-5 text-center font-black text-rose-500 font-mono">{team.lost}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`font-black font-mono ${diff >= 0 ? "text-[#ccff00]" : "text-white/20"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/40 text-[9px] text-center font-bold text-white/20 uppercase tracking-[0.3em]">
        Sorted by Win Count then Point Differential
      </div>
    </div>
  );
}