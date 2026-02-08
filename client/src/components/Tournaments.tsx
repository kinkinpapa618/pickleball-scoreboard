import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card"; // Thêm CardContent để layout chuẩn
import { Button } from "@/components/ui/button";
import { Trophy, GitBranch, RotateCw, Layers, Play, Trash2, Download, AlertTriangle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/context/TournamentContext";

type Format = "ELIMINATION" | "ROUND_ROBIN" | "GROUP_STAGE";

interface Match {
  id: string;
  p1: string;
  p2: string;
  round: string;
  group?: string;
}

export default function TournamentManager() {
  // Lấy thêm showToast từ Context
  const { stats, history, resetTournament, showToast } = useTournament();
  const [players] = useState<string[]>(["Minh", "Hoàng", "Tuấn", "Dũng", "Sơn", "Hải"]);
  const [format, setFormat] = useState<Format>("ROUND_ROBIN");
  const [matches, setMatches] = useState<Match[]>([]);

  const generateTournament = () => {
    let newMatches: Match[] = [];

    if (format === "ROUND_ROBIN") {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          newMatches.push({
            id: `RR-${i}-${j}`,
            p1: players[i],
            p2: players[j],
            round: "Vòng bảng"
          });
        }
      }
    } else if (format === "ELIMINATION") {
      for (let i = 0; i < players.length; i += 2) {
        if (players[i + 1]) {
          newMatches.push({
            id: `EL-${i}`,
            p1: players[i],
            p2: players[i + 1],
            round: "Knockout"
          });
        }
      }
    } else if (format === "GROUP_STAGE") {
      players.forEach((player, index) => {
        const groupLabel = index % 2 === 0 ? "Bảng A" : "Bảng B";
        newMatches.push({
          id: `GR-${index}`,
          p1: player,
          p2: "Chờ đối thủ",
          round: "Vòng loại",
          group: groupLabel
        });
      });
    }

    setMatches(newMatches);
    // Bắn Toast thông báo
    showToast(`Đã tạo ${newMatches.length} trận đấu theo thể thức ${format.replace('_', ' ')}`, "success");
  };

  const handleExport = () => {
    if (history.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }
    const data = { stats, history, exportDate: new Date().toLocaleString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pickleball-report.json`;
    link.click();
    showToast("Đã xuất báo cáo thành công", "success");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 pb-24">
      {/* 1. ADMIN PANEL */}
      <section className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="text-rose-500 w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black italic text-rose-500 uppercase text-sm tracking-tight">Tournament Admin</h4>
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Quản lý hệ thống dữ liệu</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={handleExport} variant="outline" className="flex-1 md:flex-none bg-white/5 border-white/5 text-[10px] font-black italic hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" /> EXPORT
          </Button>
          <Button onClick={resetTournament} className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-[10px] font-black italic shadow-lg shadow-rose-900/20">
            <Trash2 className="w-4 h-4 mr-2" /> RESET ALL
          </Button>
        </div>
      </section>

      {/* 2. CHỌN FORMAT */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-[#ccff00]" />
          <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">Chia bảng đấu</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "ELIMINATION", title: "Loại trực tiếp", icon: <GitBranch />, desc: "Knockout stage" },
            { id: "ROUND_ROBIN", title: "Vòng tròn", icon: <RotateCw />, desc: "Everyone vs Everyone" },
            { id: "GROUP_STAGE", title: "Chia bảng A-B", icon: <Layers />, desc: "Qualifying rounds" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFormat(item.id as Format)}
              className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${
                format === item.id ? "border-[#ccff00] bg-[#ccff00]/5 shadow-[0_0_40px_rgba(204,255,0,0.1)]" : "border-white/5 bg-slate-900/50 hover:bg-slate-900"
              }`}
            >
              <div className={`mb-4 transition-colors ${format === item.id ? "text-[#ccff00]" : "text-white/20 group-hover:text-white/40"}`}>
                {item.icon}
              </div>
              <h3 className="font-black italic text-sm uppercase mb-1 tracking-tight">{item.title}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{item.desc}</p>
            </button>
          ))}
        </div>

        <Button 
          onClick={generateTournament} 
          className="w-full mt-6 bg-[#ccff00] hover:bg-[#b8e600] text-black font-black italic py-8 rounded-[1.5rem] shadow-[0_20px_40px_rgba(204,255,0,0.15)] transition-all active:scale-[0.98]"
        >
          <Play className="w-5 h-5 mr-3 fill-current" /> GENERATE MATCHES ({players.length} Players)
        </Button>
      </section>

      {/* 3. HIỂN THỊ TRẬN ĐẤU */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">Lịch thi đấu</h2>
          <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">{matches.length} Matches</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {matches.length > 0 ? (
              matches.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-slate-900/80 border-white/5 rounded-3xl relative overflow-hidden group hover:border-[#ccff00]/30 transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                        <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.2em]">{m.round}</span>
                        {m.group && <span className="bg-[#ccff00] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{m.group}</span>}
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-black italic uppercase text-sm tracking-tight">{m.p1}</span>
                          <span className="text-[8px] font-bold text-white/20 uppercase">Home</span>
                        </div>
                        <div className="relative h-px bg-white/5 w-full flex items-center justify-center">
                          <div className="absolute bg-[#050505] px-3 text-[10px] font-black italic text-white/10 group-hover:text-[#ccff00] transition-colors">VS</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-black italic uppercase text-sm tracking-tight">{m.p2}</span>
                          <span className="text-[8px] font-bold text-white/20 uppercase">Away</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]"
              >
                <Users className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-white/20 font-black italic uppercase text-sm tracking-widest">Hãy chọn thể thức và bấm Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}