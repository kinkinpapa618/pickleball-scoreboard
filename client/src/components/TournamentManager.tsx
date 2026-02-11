import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  GitBranch,
  RotateCw,
  Layers,
  Play,
  Trash2,
  Download,
  AlertTriangle,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/context/TournamentContext";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
type Format = "ELIMINATION" | "ROUND_ROBIN" | "GROUP_STAGE";

interface Match {
  id: string;
  p1: string;
  p2: string;
  round: string;
  group?: string;
  court?: number; // Số sân
  status: "waiting" | "playing" | "finished"; // Trạng thái trận đấu
}

const AVAILABLE_COURTS = [1, 2, 3, 4]; // Danh sách sân có sẵn

export default function TournamentManager() {
  const { stats, history, resetTournament, showToast } = useTournament();

  // Danh sách vận động viên (Demo)
  const [players] = useState<string[]>([
    "Minh",
    "Hoàng",
    "Tuấn",
    "Dũng",
    "Sơn",
    "Hải",
    "Lâm",
    "Đạt",
  ]);
  const [format, setFormat] = useState<Format>("ROUND_ROBIN");
  const [matches, setMatches] = useState<Match[]>([]);

  // --- 2. LOGIC TẠO GIẢI ĐẤU ---
  const generateTournament = () => {
    let newMatches: Match[] = [];

    // Logic tạo cặp đấu
    if (format === "ROUND_ROBIN") {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          newMatches.push({
            id: `RR-${i}-${j}`,
            p1: players[i],
            p2: players[j],
            round: "Vòng bảng",
            status: "waiting",
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
            round: "Knockout",
            status: "waiting",
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
          group: groupLabel,
          status: "waiting",
        });
      });
    }

    setMatches(newMatches);
    showToast(`Đã tạo ${newMatches.length} trận đấu!`, "success");
  };

  // --- 3. LOGIC GÁN SÂN (COURT ASSIGNMENT) ---
  const assignCourt = (matchId: string, courtValue: string) => {
    const courtNum = parseInt(courtValue);

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          // Nếu chọn "0" -> Hủy sân, về trạng thái chờ
          if (courtNum === 0) {
            return { ...m, court: undefined, status: "waiting" };
          }
          // Nếu chọn sân -> Chuyển sang đang đánh
          return { ...m, court: courtNum, status: "playing" };
        }
        return m;
      }),
    );

    if (courtNum !== 0) {
      showToast(`Trận đấu đã được đẩy sang SÂN ${courtNum}`, "success");
    }
  };

  // --- 4. LOGIC XUẤT DỮ LIỆU ---
  const handleExport = () => {
    if (matches.length === 0 && history.length === 0) {
      showToast("Chưa có dữ liệu để xuất!", "error");
      return;
    }
    const data = {
      stats,
      history,
      matches,
      exportDate: new Date().toLocaleString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pickleball-data-${Date.now()}.json`;
    link.click();
    showToast("Đã xuất file dữ liệu thành công", "success");
  };

  // --- 5. GIAO DIỆN (UI) ---
  return (
    <div className="space-y-8 pb-24">
      {/* PANEL QUẢN TRỊ */}
      <section className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="text-rose-500 w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black italic text-rose-500 uppercase text-sm tracking-tight">
              Tournament Admin
            </h4>
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
              Control Center
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex-1 md:flex-none bg-white/5 border-white/5 text-[10px] font-black italic hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" /> EXPORT JSON
          </Button>
          <Button
            onClick={resetTournament}
            className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-[10px] font-black italic shadow-lg shadow-rose-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" /> RESET SYSTEM
          </Button>
        </div>
      </section>

      {/* CHỌN THỂ THỨC */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-[#ccff00]" />
          <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
            Thiết lập giải đấu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "ELIMINATION",
              title: "Loại trực tiếp",
              icon: <GitBranch />,
              desc: "Knockout Stage",
            },
            {
              id: "ROUND_ROBIN",
              title: "Vòng tròn",
              icon: <RotateCw />,
              desc: "League Format",
            },
            {
              id: "GROUP_STAGE",
              title: "Chia bảng A-B",
              icon: <Layers />,
              desc: "Group Qualifiers",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFormat(item.id as Format)}
              className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${
                format === item.id
                  ? "border-[#ccff00] bg-[#ccff00]/5 shadow-[0_0_40px_rgba(204,255,0,0.1)]"
                  : "border-white/5 bg-slate-900/50 hover:bg-slate-900"
              }`}
            >
              <div
                className={`mb-4 transition-colors ${format === item.id ? "text-[#ccff00]" : "text-white/20 group-hover:text-white/40"}`}
              >
                {item.icon}
              </div>
              <h3 className="font-black italic text-sm uppercase mb-1 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        <Button
          onClick={generateTournament}
          className="w-full mt-6 bg-[#ccff00] hover:bg-[#b8e600] text-black font-black italic py-8 rounded-[1.5rem] shadow-[0_20px_40px_rgba(204,255,0,0.15)] transition-all active:scale-[0.98]"
        >
          <Play className="w-5 h-5 mr-3 fill-current" /> GENERATE MATCHES (
          {players.length} Players)
        </Button>
      </section>

      {/* DANH SÁCH TRẬN ĐẤU & GÁN SÂN */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
            Lịch thi đấu
          </h2>
          <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
            {matches.length} Matches
          </span>
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
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 ${
                      m.status === "playing"
                        ? "bg-slate-900 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                        : "bg-slate-900/80 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <CardContent className="p-5">
                      {/* HEADER CARD: SỐ TRẬN & CHỌN SÂN */}
                      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.2em] block mb-1">
                            {m.round}
                          </span>
                          {m.group && (
                            <span className="bg-[#ccff00]/10 text-[#ccff00] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                              {m.group}
                            </span>
                          )}
                        </div>

                        {/* SELECT MENU GÁN SÂN */}
                        <div className="relative group/select">
                          <select
                            value={m.court || 0}
                            onChange={(e) => assignCourt(m.id, e.target.value)}
                            className={`
                              appearance-none outline-none text-[10px] font-black italic uppercase py-1.5 px-3 rounded-lg cursor-pointer transition-all border
                              ${
                                m.status === "playing"
                                  ? "bg-[#ccff00] text-black border-[#ccff00]"
                                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                              }
                            `}
                          >
                            <option
                              value="0"
                              className="bg-slate-900 text-white"
                            >
                              CHỜ SÂN...
                            </option>
                            {AVAILABLE_COURTS.map((c) => (
                              <option
                                key={c}
                                value={c}
                                className="bg-slate-900 text-white"
                              >
                                SÂN {c}
                              </option>
                            ))}
                          </select>
                          {/* Mũi tên trang trí */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div
                              className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${m.status === "playing" ? "border-t-black" : "border-t-white/40"}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* THÔNG TIN CẶP ĐẤU */}
                      <div className="space-y-4 relative z-10">
                        {/* Player 1 */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-black italic uppercase text-sm tracking-tight transition-colors ${m.status === "playing" ? "text-white text-lg" : "text-white/70"}`}
                          >
                            {m.p1}
                          </span>
                          {/* Chấm xanh nhấp nháy */}
                          {m.status === "playing" && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
                            </span>
                          )}
                        </div>

                        {/* VS / LIVE BADGE */}
                        <div className="relative h-px bg-white/5 w-full flex items-center justify-center">
                          <div
                            className={`absolute px-2 text-[10px] font-black italic transition-colors uppercase ${
                              m.status === "playing"
                                ? "bg-slate-900 text-[#ccff00] border border-[#ccff00] rounded px-3 py-0.5 shadow-[0_0_10px_rgba(204,255,0,0.3)]"
                                : "bg-slate-900 text-white/10"
                            }`}
                          >
                            {m.status === "playing" ? "LIVE" : "VS"}
                          </div>
                        </div>

                        {/* Player 2 */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-black italic uppercase text-sm tracking-tight transition-colors ${m.status === "playing" ? "text-white text-lg" : "text-white/70"}`}
                          >
                            {m.p2}
                          </span>
                          {m.status === "playing" && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hiệu ứng nền nhẹ khi đang đánh */}
                      {m.status === "playing" && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ccff00]/5 via-transparent to-transparent pointer-events-none" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]"
              >
                <Users className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-white/20 font-black italic uppercase text-sm tracking-widest">
                  Danh sách trống
                </p>
                <p className="text-white/10 text-[10px] uppercase mt-2">
                  Vui lòng chọn thể thức và bấm Generate
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
