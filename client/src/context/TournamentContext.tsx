import React, { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamStats {
  name: string; played: number; won: number; lost: number;
  pointsFor: number; pointsAgainst: number;
}

interface MatchHistory {
  id: string; team1: string; team2: string;
  score1: number; score2: number; winner: 1 | 2; time: string;
}

// 1. Cấu trúc đầy đủ cho Context
interface TournamentContextType {
  stats: TeamStats[];
  history: MatchHistory[];
  updateTournamentStats: (result: {
    team1: string; team2: string; score1: number; score2: number; winner: 1 | 2;
  }) => void;
  resetTournament: () => void;
  showToast: (message: string, type?: "success" | "error") => void; // Khai báo
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // 2. Logic hàm showToast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ msg: message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateTournamentStats = (result: any) => {
    const newMatch = {
      ...result,
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => [newMatch, ...prev]);

    setStats((prevStats) => {
      const newStats = [...prevStats];
      const updateTeamData = (teamName: string, pFor: number, pAgainst: number, isWinner: boolean) => {
        const index = newStats.findIndex((t) => t.name === teamName);
        if (index > -1) {
          newStats[index] = {
            ...newStats[index],
            played: newStats[index].played + 1,
            won: newStats[index].won + (isWinner ? 1 : 0),
            lost: newStats[index].lost + (isWinner ? 0 : 1),
            pointsFor: newStats[index].pointsFor + pFor,
            pointsAgainst: newStats[index].pointsAgainst + pAgainst,
          };
        } else {
          newStats.push({
            name: teamName, played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1,
            pointsFor: pFor, pointsAgainst: pAgainst,
          });
        }
      };
      updateTeamData(result.team1, result.score1, result.score2, result.winner === 1);
      updateTeamData(result.team2, result.score2, result.score1, result.winner === 2);
      return newStats;
    });
  };

  const resetTournament = () => {
    if (window.confirm("Xóa toàn bộ dữ liệu giải đấu?")) {
      setStats([]);
      setHistory([]);
      showToast("Đã xóa sạch dữ liệu!", "success");
    }
  };

  return (
    <TournamentContext.Provider value={{ 
      stats, 
      history, 
      updateTournamentStats, 
      resetTournament, 
      showToast // Đảm bảo hàm này có mặt ở đây
    }}>
      {children}

      {/* 3. Giao diện Toast hiển thị tại đây */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[9999] w-max px-6 py-3 rounded-2xl border backdrop-blur-xl flex items-center gap-3 bg-black/80 border-white/10 shadow-2xl"
          >
            <div className={`w-2 h-2 rounded-full animate-ping ${toast.type === "success" ? "bg-[#ccff00]" : "bg-rose-500"}`} />
            <span className={`text-[10px] font-black italic uppercase tracking-widest ${toast.type === "success" ? "text-[#ccff00]" : "text-rose-500"}`}>
              {toast.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </TournamentContext.Provider>
  );
}

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) throw new Error("TournamentProvider missing!");
  return context;
};