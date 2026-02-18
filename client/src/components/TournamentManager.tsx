import { useState, useEffect } from "react";
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
  FileSpreadsheet,
  ChevronRight,
  Settings2,
  Upload,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/context/TournamentContext";
import CreateTournament from "./CreateTournament";
import { ExcelUpload, PlayerData } from "./ExcelUpload";
import {
  TournamentFormat,
  Player,
  TournamentData,
  generateTournament,
  Match,
  Standing,
  Group,
} from "@/lib/tournament-advanced";
import { TournamentBracket } from "./TournamentBracket";
import { createBracket, BracketData, BracketPlayer, updateBracketMatch as updateBracketFn } from "@/lib/tournament-bracket";
import {
  suggestGroupingMethod,
  calculateOptimalGroups,
  distributeSeedsEvenly,
  generateGroupNames,
  groupByCategory,
  type GroupSuggestion,
} from "@/lib/tournament-grouping";

interface LevelContent {
  level: string;
  contents: string[];
}

type TournamentFormData = {
  name: string;
  date: string;
  time: string;
  location: string;
  courts: number;
  level: string;
  levels: LevelContent[];
  backdrop?: string;
};

// --- 1. ĐGHĨAỊNH N KIỂU DỮ LIỆU ---
type FormatOption = {
  id: TournamentFormat;
  title: string;
  icon: React.ReactNode;
  desc: string;
  requiresGroups?: boolean;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "ELIMINATION",
    title: "Loại trực tiếp",
    icon: <GitBranch className="w-8 h-8" />,
    desc: "Thắng là đi tiếp, thua bị loại",
  },
  {
    id: "ROUND_ROBIN",
    title: "Vòng tròn",
    icon: <RotateCw className="w-8 h-8" />,
    desc: "Đấu vòng tròn tính điểm",
  },
  {
    id: "GROUP_KNOCKOUT",
    title: "Chia bảng + Knockout",
    icon: <Layers className="w-8 h-8" />,
    desc: "Chia bảng -> Top vào knockout",
    requiresGroups: true,
  },
];

const AVAILABLE_COURTS = [1, 2, 3, 4];

export default function TournamentManager() {
  const { showToast } = useTournament();

  // --- STATE ---
  const [tournamentInfo, setTournamentInfo] = useState<TournamentFormData | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [format, setFormat] = useState<TournamentFormat>("ROUND_ROBIN");
  const [numGroups, setNumGroups] = useState<number>(4);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [currentView, setCurrentView] = useState<"upload" | "format" | "tournament">("upload");
  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [parsedPlayerData, setParsedPlayerData] = useState<PlayerData[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<ReturnType<typeof groupByCategory>>([]);
  const [selectedCategoryFormat, setSelectedCategoryFormat] = useState<Record<string, TournamentFormat>>({});

  // --- XỬ LÝ UPLOAD FILE ---
  const handleDataLoaded = (data: string[] | import("./ExcelUpload").PlayerData[]) => {
    setParsedPlayerData(data as PlayerData[]);
    
    const groups = groupByCategory(data as PlayerData[]);
    setCategoryGroups(groups);
    
    const formats: Record<string, TournamentFormat> = {};
    groups.forEach(g => {
      formats[g.category] = g.suggestedFormat.format;
    });
    setSelectedCategoryFormat(formats);

    const playerNames = Array.isArray(data) && typeof data[0] === "string" 
      ? data as string[] 
      : (data as import("./ExcelUpload").PlayerData[]).reduce<string[]>((acc, p) => {
          if (p.player1) acc.push(p.player1);
          if (p.player2) acc.push(p.player2);
          if (p.player3) acc.push(p.player3);
          if (p.player4) acc.push(p.player4);
          return acc;
        }, []);
    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name: name.trim(),
    }));
    setPlayers(newPlayers);
    showToast(`Đã tải ${newPlayers.length} VĐV!`, "success");
    setCurrentView("format");
  };

  // --- XỬ LÝ TẠO GIẢI ĐẤU ---
  const handleGenerateTournament = () => {
    if (players.length < 2) {
      showToast("Cần ít nhất 2 VĐV để tạo giải!", "error");
      return;
    }

    try {
      // Nếu là elimination, tạo bracket
      if (format === "ELIMINATION") {
        const bracketPlayers: BracketPlayer[] = players.map((p, idx) => ({
          id: p.id,
          name: p.name,
          seed: idx + 1,
        }));
        const bracket = createBracket(bracketPlayers);
        setBracketData(bracket);
      } else {
        setBracketData(null);
      }

      const data = generateTournament(players, format, numGroups);
      setTournamentData(data);
      setCurrentView("tournament");
      
      const formatName = FORMAT_OPTIONS.find(f => f.id === format)?.title || format;
      showToast(`Đã tạo giải: ${formatName} với ${players.length} VĐV`, "success");
    } catch (error) {
      showToast("Lỗi khi tạo giải đấu!", "error");
    }
  };

  // --- XỬ LÝ KẾT QUẢ TRẬN ĐẤU (BRACKET) ---
  const handleBracketMatchResult = (matchId: string, winner: BracketPlayer, score1: number, score2: number) => {
    if (!bracketData) return;
    const updatedBracket = updateBracketFn(bracketData, matchId, winner, score1, score2);
    setBracketData(updatedBracket);
    showToast(`Đã cập nhật! ${winner.name} thắng`, "success");
  };

  // --- XỬ LÝ KẾT QUẢ TRẬN ĐẤU (ROUND ROBIN / GROUP) ---
  const handleMatchResult = (matchId: string, winner: Player, score1: number, score2: number) => {
    if (!tournamentData) return;

    // Update logic based on format
    // This would call the update functions from tournament-advanced.ts
    showToast(`Đã cập nhật kết quả! ${winner.name} thắng`, "success");
  };

  // --- RESET ---
  const handleReset = () => {
    if (window.confirm("Xóa toàn bộ giải đấu và bắt đầu lại?")) {
      setPlayers([]);
      setTournamentData(null);
      setBracketData(null);
      setCurrentView("upload");
      showToast("Đã reset!", "success");
    }
  };

  // --- XUẤT DỮ LIỆU ---
  const handleExport = () => {
    if (!tournamentData && !bracketData) {
      showToast("Chưa có dữ liệu để xuất!", "error");
      return;
    }
    const data = {
      tournamentInfo,
      players,
      tournamentData,
      bracketData,
      exportDate: new Date().toLocaleString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tournament-${Date.now()}.json`;
    link.click();
    showToast("Đã xuất file dữ liệu", "success");
  };

  // --- RENDER UI ---
  return (
    <div className="space-y-8 pb-24">
      {/* PANEL QUẢN TRỊ */}
      <section className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="text-rose-500 w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black italic text-rose-500 uppercase text-sm tracking-tight">
              Tournament Admin
            </h4>
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
              Quản lý giải đấu
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="bg-white/5 border-white/5 text-[10px] font-black italic hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" /> EXPORT
          </Button>
          <Button
            onClick={handleReset}
            className="bg-rose-600 hover:bg-rose-700 text-[10px] font-black italic"
          >
            <Trash2 className="w-4 h-4 mr-2" /> RESET
          </Button>
        </div>
      </section>

      {/* BƯỚC 1: NHẬP THÔNG TIN GIẢI */}
      {!tournamentInfo ? (
        <CreateTournament onSubmit={(data) => { setTournamentInfo(data); showToast("Đã lưu thông tin giải!", "success"); }} />
      ) : (
        <Card className="bg-slate-900/80 border-white/5 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-black italic text-lg">{tournamentInfo.name}</h3>
                <p className="text-white/50 text-sm">{tournamentInfo.date} • {tournamentInfo.location}</p>
              </div>
              <Button variant="outline" onClick={() => setTournamentInfo(null)} className="bg-white/5 border-white/10 text-white/60">
                Sửa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BƯỚC 2: UPLOAD DANH SÁCH VĐV */}
      <AnimatePresence>
        {currentView === "upload" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-[#ccff00]" />
              <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
                Bước 1: Tải danh sách VĐV
              </h2>
            </div>

            <ExcelUpload onDataLoaded={handleDataLoaded} mode="tournament-v2" />

            {players.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Hiển thị thông tin các nội dung đăng ký */}
                {categoryGroups.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white font-bold text-sm uppercase">Gợi ý phương thức chia bảng:</h3>
                    {categoryGroups.map((group) => (
                      <div key={group.category} className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[#ccff00] font-bold">{group.category}</span>
                            <span className="text-white/50 text-xs ml-2">({group.totalPairs} cặp)</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-500/10 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                            <Info className="w-3 h-3" />
                            GỢI Ý: {group.suggestedFormat.formatName}
                          </div>
                          <p className="text-white/60 text-xs">{group.suggestedFormat.reason}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {suggestGroupingMethod(group.totalPairs).map((suggestion) => (
                            <button
                              key={suggestion.format}
                              onClick={() => setSelectedCategoryFormat(prev => ({ ...prev, [group.category]: suggestion.format }))}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                selectedCategoryFormat[group.category] === suggestion.format
                                  ? "bg-[#ccff00] text-black"
                                  : "bg-white/5 text-white/60 hover:bg-white/10"
                              }`}
                            >
                              {suggestion.formatName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-[#ccff00]/10 rounded-2xl border border-[#ccff00]/20">
                  <p className="text-[#ccff00] text-sm font-bold">
                    ✓ Đã tải {players.length} VĐV ({parsedPlayerData.length} cặp)
                  </p>
                  <Button
                    onClick={() => setCurrentView("format")}
                    className="mt-4 bg-[#ccff00] text-black font-black italic"
                  >
                    Tiếp tục <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* BƯỚC 3: CHỌN THỂ THỨC */}
      <AnimatePresence>
        {currentView === "format" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-[#ccff00]" />
              <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
                Bước 2: Chọn thể thức thi đấu
              </h2>
            </div>

            {/* Hiển thị số lượng VĐV */}
            <div className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
              <p className="text-white/60 text-sm">
                <span className="text-[#ccff00] font-bold">{players.length}</span> VĐV đã sẵn sàng
              </p>
            </div>

            {/* Chọn thể thức */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {FORMAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setFormat(option.id);
                    if (option.requiresGroups) {
                      setShowFormatSettings(true);
                    }
                  }}
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden ${
                    format === option.id
                      ? "border-[#ccff00] bg-[#ccff00]/5 shadow-[0_0_40px_rgba(204,255,0,0.1)]"
                      : "border-white/5 bg-slate-900/50 hover:bg-slate-900 hover:border-white/20"
                  }`}
                >
                  <div className={`mb-4 ${format === option.id ? "text-[#ccff00]" : "text-white/20"}`}>
                    {option.icon}
                  </div>
                  <h3 className="font-black italic text-sm uppercase mb-1">{option.title}</h3>
                  <p className="text-[10px] text-white/40 font-bold">{option.desc}</p>
                  
                  {format === option.id && (
                    <div className="absolute top-4 right-4 w-3 h-3 bg-[#ccff00] rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Cấu hình bổ sung cho GROUP_KNOCKOUT */}
            <AnimatePresence>
              {showFormatSettings && format === "GROUP_KNOCKOUT" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-slate-900/50 rounded-2xl border border-[#ccff00]/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Settings2 className="w-5 h-5 text-[#ccff00]" />
                    <h3 className="text-white font-black italic">Cấu hình bảng đấu</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="text-white/60 text-xs uppercase font-bold block mb-2">
                        Số bảng
                      </label>
                      <select
                        value={numGroups}
                        onChange={(e) => setNumGroups(Number(e.target.value))}
                        className="bg-slate-800 border border-white/10 text-white px-4 py-2 rounded-lg font-bold"
                      >
                        {[2, 3, 4, 5, 6, 8].map(n => (
                          <option key={n} value={n}>{n} bảng</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs uppercase font-bold block mb-2">
                        Đội vào Knockout
                      </label>
                      <div className="bg-slate-800 border border-white/10 px-4 py-2 rounded-lg text-white/60">
                        Top {Math.min(2, Math.floor(players.length / numGroups))} mỗi bảng
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nút tạo giải */}
            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentView("upload")}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 text-white/60 font-black italic py-6"
              >
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Quay lại
              </Button>
              <Button
                onClick={handleGenerateTournament}
                className="flex-[2] bg-[#ccff00] hover:bg-[#b8e600] text-black font-black italic py-8 rounded-2xl shadow-[0_20px_40px_rgba(204,255,0,0.15)]"
              >
                <Play className="w-5 h-5 mr-3 fill-current" /> 
                TẠO GIẢI ĐẤU ({players.length} VĐV)
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* BƯỚC 4: HIỂN THỊ GIẢI ĐẤU */}
      <AnimatePresence>
        {currentView === "tournament" && tournamentData && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#ccff00]" />
                <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
                  Lịch thi đấu
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView("format")}
                className="bg-white/5 border-white/10 text-white/60 text-xs font-black italic"
              >
                <Settings2 className="w-4 h-4 mr-2" /> Đổi thể thức
              </Button>
            </div>

            {/* Render theo thể thức */}
            {format === "ROUND_ROBIN" && tournamentData.rrMatches && (
              <RoundRobinView 
                matches={tournamentData.rrMatches} 
                standings={tournamentData.rrStandings || []}
                onMatchResult={handleMatchResult}
              />
            )}

            {format === "ELIMINATION" && bracketData && (
              <TournamentBracket 
                bracket={bracketData}
                onUpdateMatch={handleBracketMatchResult}
                onExport={handleExport}
              />
            )}

            {format === "GROUP_KNOCKOUT" && (
              <GroupKnockoutView 
                groups={tournamentData.groups || []}
                knockoutMatches={tournamentData.knockoutMatches || []}
                onMatchResult={handleMatchResult}
              />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENT: ROUND ROBIN VIEW ---
function RoundRobinView({ 
  matches, 
  standings, 
  onMatchResult 
}: { 
  matches: Match[]; 
  standings: Standing[];
  onMatchResult: (matchId: string, winner: Player, score1: number, score2: number) => void;
}) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const handleSubmitResult = () => {
    if (!selectedMatch || !score1 || !score2) return;
    
    const winner = parseInt(score1) > parseInt(score2) ? selectedMatch.player1 : selectedMatch.player2;
    onMatchResult(selectedMatch.id, winner, parseInt(score1), parseInt(score2));
    setSelectedMatch(null);
    setScore1("");
    setScore2("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Danh sách trận đấu */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
          Lịch thi đấu vòng tròn
        </h3>
        {matches.map((match, idx) => (
          <MatchCard 
            key={match.id} 
            match={match} 
            onClick={() => setSelectedMatch(match)}
          />
        ))}
      </div>

      {/* Bảng xếp hạng */}
      <div>
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
          Bảng xếp hạng
        </h3>
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="p-3 text-left text-white/40 font-bold">#</th>
                <th className="p-3 text-left text-white/40 font-bold">VĐV</th>
                <th className="p-3 text-center text-white/40 font-bold">TD</th>
                <th className="p-3 text-center text-white/40 font-bold">Đ</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, idx) => (
                <tr key={standing.player.id} className="border-t border-white/5">
                  <td className="p-3 text-white/40 font-bold">{idx + 1}</td>
                  <td className="p-3 text-white font-bold">{standing.player.name}</td>
                  <td className="p-3 text-center text-white/60">{standing.won}-{standing.lost}</td>
                  <td className="p-3 text-center text-[#ccff00] font-black">{standing.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nhập kết quả */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-white font-black italic text-lg mb-6 text-center">
                Nhập kết quả
              </h3>
              <div className="flex items-center justify-between mb-8">
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player1.name}</p>
                  <input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <span className="text-white/20 font-black text-xl mx-4">VS</span>
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player2.name}</p>
                  <input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setSelectedMatch(null)}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitResult}
                  className="flex-1 bg-[#ccff00] text-black font-black"
                >
                  Lưu kết quả
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENT: ELIMINATION VIEW ---
function EliminationView({ 
  rounds, 
  onMatchResult 
}: { 
  rounds: Match[][];
  onMatchResult: (matchId: string, winner: Player, score1: number, score2: number) => void;
}) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const handleSubmitResult = () => {
    if (!selectedMatch || !score1 || !score2) return;
    const winner = parseInt(score1) > parseInt(score2) ? selectedMatch.player1 : selectedMatch.player2;
    onMatchResult(selectedMatch.id, winner, parseInt(score1), parseInt(score2));
    setSelectedMatch(null);
    setScore1("");
    setScore2("");
  };

  return (
    <div className="space-y-8">
      {rounds.map((round, roundIdx) => (
        <div key={roundIdx}>
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
            {round[0]?.roundName || `Vòng ${roundIdx + 1}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {round.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onClick={() => setSelectedMatch(match)}
                isElimination
              />
            ))}
          </div>
        </div>
      ))}

      {/* Modal nhập kết quả */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-white font-black italic text-lg mb-6 text-center">
                Nhập kết quả - {selectedMatch.roundName}
              </h3>
              <div className="flex items-center justify-between mb-8">
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player1.name}</p>
                  <input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <span className="text-white/20 font-black text-xl mx-4">VS</span>
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player2.name}</p>
                  <input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setSelectedMatch(null)}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitResult}
                  className="flex-1 bg-[#ccff00] text-black font-black"
                >
                  Lưu kết quả
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENT: GROUP + KNOCKOUT VIEW ---
function GroupKnockoutView({ 
  groups, 
  knockoutMatches, 
  onMatchResult 
}: { 
  groups: Group[];
  knockoutMatches: Match[];
  onMatchResult: (matchId: string, winner: Player, score1: number, score2: number) => void;
}) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [activeTab, setActiveTab] = useState<"groups" | "knockout">("groups");

  const handleSubmitResult = () => {
    if (!selectedMatch || !score1 || !score2) return;
    const winner = parseInt(score1) > parseInt(score2) ? selectedMatch.player1 : selectedMatch.player2;
    onMatchResult(selectedMatch.id, winner, parseInt(score1), parseInt(score2));
    setSelectedMatch(null);
    setScore1("");
    setScore2("");
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-6 py-3 rounded-2xl font-black italic text-sm transition-all ${
            activeTab === "groups" 
              ? "bg-[#ccff00] text-black" 
              : "bg-slate-900 text-white/60 border border-white/10"
          }`}
        >
          Vòng bảng ({groups.length} bảng)
        </button>
        <button
          onClick={() => setActiveTab("knockout")}
          className={`px-6 py-3 rounded-2xl font-black italic text-sm transition-all ${
            activeTab === "knockout" 
              ? "bg-[#ccff00] text-black" 
              : "bg-slate-900 text-white/60 border border-white/10"
          }`}
        >
          Knockout
        </button>
      </div>

      {/* Vòng bảng */}
      {activeTab === "groups" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div key={group.name} className="bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden">
              <div className="bg-slate-800/50 p-4 border-b border-white/5">
                <h3 className="text-[#ccff00] font-black italic">{group.name}</h3>
                <p className="text-white/40 text-xs">{group.players.length} VĐV</p>
              </div>
              
              {/* Bảng xếp hạng bảng */}
              <div className="p-4 border-b border-white/5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/40">
                      <th className="text-left pb-2">#</th>
                      <th className="text-left pb-2">VĐV</th>
                      <th className="text-center pb-2">TD</th>
                      <th className="text-center pb-2">Đ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((standing, idx) => (
                      <tr key={standing.player.id}>
                        <td className="py-1 text-white/40">{idx + 1}</td>
                        <td className="py-1 text-white font-bold">{standing.player.name}</td>
                        <td className="py-1 text-center text-white/60">{standing.won}-{standing.lost}</td>
                        <td className="py-1 text-center text-[#ccff00] font-black">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lịch đấu bảng */}
              <div className="p-4 space-y-2">
                {group.matches.slice(0, 3).map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    onClick={() => setSelectedMatch(match)}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Knockout */}
      {activeTab === "knockout" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {knockoutMatches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onClick={() => setSelectedMatch(match)}
              isElimination
            />
          ))}
        </div>
      )}

      {/* Modal nhập kết quả */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-white font-black italic text-lg mb-6 text-center">
                Nhập kết quả
              </h3>
              <div className="flex items-center justify-between mb-8">
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player1.name}</p>
                  <input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <span className="text-white/20 font-black text-xl mx-4">VS</span>
                <div className="text-center flex-1">
                  <p className="text-white font-bold mb-2">{selectedMatch.player2.name}</p>
                  <input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-20 bg-slate-800 border border-white/10 text-center text-2xl font-black text-white py-2 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setSelectedMatch(null)}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitResult}
                  className="flex-1 bg-[#ccff00] text-black font-black"
                >
                  Lưu kết quả
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENT: MATCH CARD ---
function MatchCard({ 
  match, 
  onClick,
  compact = false,
  isElimination = false 
}: { 
  match: Match; 
  onClick: () => void;
  compact?: boolean;
  isElimination?: boolean;
}) {
  const isFinished = match.status === "finished";
  const isPlaying = match.status === "playing";
  const hasBye = match.player2.name === "BYE";

  return (
    <Card 
      className={`cursor-pointer transition-all hover:scale-[1.02] ${
        isPlaying 
          ? "bg-slate-900 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.15)]" 
          : "bg-slate-900/80 border-white/5 hover:border-white/20"
      } ${compact ? "p-3" : "p-4"}`}
      onClick={hasBye ? undefined : onClick}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.2em]">
            {match.roundName}
          </span>
          {isPlaying && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`font-bold ${isElimination && isFinished && match.winner?.id === match.player1.id ? "text-[#ccff00]" : "text-white/80"}`}>
              {match.player1.name}
            </span>
            {isFinished && match.score1 !== undefined && (
              <span className="text-[#ccff00] font-black">{match.score1}</span>
            )}
          </div>
          <div className="relative h-px bg-white/5 w-full flex items-center justify-center">
            <div className="absolute px-2 text-[8px] font-black text-white/20 uppercase">
              {isFinished ? "FT" : "VS"}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className={`font-bold ${isElimination && isFinished && match.winner?.id === match.player2.id ? "text-[#ccff00]" : "text-white/80"}`}>
              {match.player2.name}
            </span>
            {isFinished && match.score2 !== undefined && (
              <span className="text-[#ccff00] font-black">{match.score2}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
