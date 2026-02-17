import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  History,
  GitPullRequest,
  Search,
  Shuffle,
  Users,
  Settings2,
  Coins,
  ArrowRight,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trophy,
  Trash2,
  UserPlus,
  Plus,
  Zap,
  Layers,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateMatch,
  useMatches,
  useTournaments,
  useTournament,
  useCreateTournament,
  useGenerateTournament,
  useReferees,
  useAssignReferee,
  useStartTournamentMatch,
  useDeleteTournament,
  useCourts,
} from "@/hooks/use-api";
import { ExcelUpload } from "@/components/ExcelUpload";
import { CoinTossModal } from "@/components/CoinTossModal";

export default function RefereeTools() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const createMatch = useCreateMatch();

  const isManager = user?.role === "manager" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState("create");
  const [page, setPage] = useState(1);
  const { data: matchesData } = useMatches(page);

  const handleTabChange = (value: string) => {
    if (!user && (value === "history" || value === "draw" || value === "tournament")) {
      setLocation("/auth");
      return;
    }
    if ((value === "tournament") && !isManager) {
      setLocation("/auth");
      return;
    }
    setActiveTab(value);
  };

  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  const [playerInput, setPlayerInput] = useState<string>("");
  const [tournamentGroups, setTournamentGroups] = useState<any>(null);

  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const { data: tournaments } = useTournaments();
  const { data: selectedTournament, refetch: refetchTournament } = useTournament(selectedTournamentId!);
  const createTournament = useCreateTournament();
  const generateTournament = useGenerateTournament();
  const assignReferee = useAssignReferee();
  const startMatch = useStartTournamentMatch();
  const deleteTournament = useDeleteTournament();
  const { data: referees } = useReferees();
  const { data: courts = [] } = useCourts();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentDesc, setNewTournamentDesc] = useState("");
  const [newTournamentDate, setNewTournamentDate] = useState("");
  const [newTournamentTime, setNewTournamentTime] = useState("");
  const [newTournamentLocation, setNewTournamentLocation] = useState("");
  const [newTournamentCourt, setNewTournamentCourt] = useState("");
  const [newTournamentLevels, setNewTournamentLevels] = useState<string[]>([]);
  const [newLevelInput, setNewLevelInput] = useState("");
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [courtCount, setCourtCount] = useState(1);
  const [assigningMatchId, setAssigningMatchId] = useState<number | null>(null);
  const [assigningCourtMatchId, setAssigningCourtMatchId] = useState<number | null>(null);

  const handleExcelData = (data: string[] | import("../components/ExcelUpload").PlayerData[]) => {
    const playerNames = Array.isArray(data) && typeof data[0] === "string"
      ? data as string[]
      : (data as import("../components/ExcelUpload").PlayerData[]).reduce<string[]>((acc, p) => {
          if (p.player1) acc.push(p.player1);
          if (p.player2) acc.push(p.player2);
          if (p.player3) acc.push(p.player3);
          if (p.player4) acc.push(p.player4);
          return acc;
        }, []);
    setPlayerInput(playerNames.join("\n"));
  };

  const handleDraw = () => {
    const players = playerInput.split("\n").filter((p) => p.trim() !== "");
    if (players.length < 4) {
      alert("Cần tối thiểu 4 đội/người để chia bảng!");
      return;
    }
    const { generateGroups } = require("@/lib/tournament");
    const groups = generateGroups(players, 4);
    setTournamentGroups(groups);
  };

  const handleCreateTournament = async () => {
    if (!newTournamentName.trim()) {
      alert("Vui lòng nhập tên giải đấu");
      return;
    }
    if (!newTournamentDate) {
      alert("Vui lòng chọn ngày thi đấu");
      return;
    }
    if (!newTournamentLocation.trim()) {
      alert("Vui lòng nhập địa điểm");
      return;
    }
    if (newTournamentLevels.length === 0) {
      alert("Vui lòng thêm ít nhất một level");
      return;
    }
    try {
      const contentMap: Record<string, string[]> = {};
      newTournamentLevels.forEach(level => {
        contentMap[level] = [];
      });
      
      const result = await createTournament.mutateAsync({
        name: newTournamentName,
        description: newTournamentDesc,
        date: newTournamentDate,
        time: newTournamentTime || null,
        location: newTournamentLocation,
        court: newTournamentCourt || null,
        level: JSON.stringify(newTournamentLevels),
        content: JSON.stringify(contentMap),
        teamsPerGroup,
        winningScore: 11,
        status: "draft",
      });
      setShowCreateModal(false);
      setNewTournamentName("");
      setNewTournamentDesc("");
      setNewTournamentDate("");
      setNewTournamentTime("");
      setNewTournamentLocation("");
      setNewTournamentCourt("");
      setNewTournamentLevels([]);
      setSelectedTournamentId(result.id);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      const message = error?.message || "Không thể tạo giải đấu";
      alert(message);
    }
  };

  const handleAddLevel = () => {
    if (newLevelInput && !newTournamentLevels.includes(newLevelInput)) {
      setNewTournamentLevels([...newTournamentLevels, newLevelInput]);
      setNewLevelInput("");
    }
  };

  const handleRemoveLevel = (level: string) => {
    setNewTournamentLevels(newTournamentLevels.filter(l => l !== level));
  };

  const handleGenerateTournament = async () => {
    if (!selectedTournamentId) return;
    const players = playerInput.split("\n").filter((p) => p.trim() !== "");
    if (players.length < 4) {
      alert("Cần tối thiểu 4 đội/người");
      return;
    }
    try {
      await generateTournament.mutateAsync({
        tournamentId: selectedTournamentId,
        players,
        teamsPerGroup,
      });
      refetchTournament();
      setPlayerInput("");
    } catch (error) {
      console.error("Error generating tournament:", error);
      alert("Không thể tạo lịch đấu");
    }
  };

  const handleAssignReferee = async (matchId: number, refereeId: number) => {
    if (!selectedTournamentId) return;
    try {
      await assignReferee.mutateAsync({
        tournamentId: selectedTournamentId,
        matchId,
        refereeId,
      });
      refetchTournament();
      setAssigningMatchId(null);
    } catch (error) {
      console.error("Error assigning referee:", error);
      alert("Không thể assign trọng tài");
    }
  };

  const handleStartMatch = async (matchId: number) => {
    if (!selectedTournamentId) return;
    try {
      const match = await startMatch.mutateAsync({
        tournamentId: selectedTournamentId,
        matchId,
      });
      setLocation(`/match?matchId=${match.id}`);
    } catch (error) {
      console.error("Error starting match:", error);
      alert("Không thể bắt đầu trận đấu");
    }
  };

  const handleStart = async () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return;

    try {
      const newMatch = await createMatch.mutateAsync({
        team1Player1: t1p1,
        team1Player2: t1p2,
        team2Player1: t2p1,
        team2Player2: t2p2,
        winningScore: parseInt(winningScore),
        scoreTeam1: 0,
        scoreTeam2: 0,
        status: "live",
        isServer1: firstServer === 1,
        isServer2: firstServer === 2,
        serverNumber: 1,
      });

      const params = new URLSearchParams({
        matchId: String(newMatch.id),
        t1p1,
        t1p2,
        t2p1,
        t2p2,
        win: winningScore,
        serve: String(firstServer),
      });
      setLocation(`/match?${params.toString()}`);
    } catch (error) {
      console.error("Không thể tạo trận đấu:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-2 pb-24 flex flex-col font-sans overflow-x-hidden">
      {/* Brand Header */}
      <div className="text-center py-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black italic tracking-tighter text-blue-600"
        >
          TRONGTAISO.COM
        </motion.h3>
        <p className="text-slate-400 text-[10px] tracking-[0.4em] uppercase font-bold">
          Referee Support
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        {/* CUSTOM BEAUTIFUL TABS */}
        <div className="mb-6">
          <div className="relative bg-slate-900/50 rounded-3xl p-1.5 backdrop-blur-xl border border-white/10">
            {/* Active Tab Indicator */}
            <motion.div 
              className="absolute top-1.5 h-[calc(100%-12px)] bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25"
              animate={{
                left: activeTab === "create" ? "4px" : 
                      activeTab === "history" ? isManager ? "calc(25% + 4px)" : "calc(33.33% + 4px)" :
                      activeTab === "draw" ? isManager ? "calc(50% + 4px)" : "calc(66.66% + 4px)" :
                      "calc(75% + 4px)",
                width: isManager ? "calc(25% - 8px)" : "calc(33.33% - 8px)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <div className={`relative flex ${isManager ? 'grid grid-cols-3' : 'grid grid-cols-3'}`}>
              <TabButton 
                active={activeTab === "create"} 
                onClick={() => handleTabChange("create")}
                icon={<Play className="w-4 h-4" />}
                label="Trận đấu"
                color="blue"
              />
              <TabButton 
                active={activeTab === "history"} 
                onClick={() => handleTabChange("history")}
                icon={<History className="w-4 h-4" />}
                label="Lịch sử"
                color="orange"
                locked={!user}
              />
              <TabButton 
                active={activeTab === "draw"} 
                onClick={() => handleTabChange("draw")}
                icon={<GitPullRequest className="w-4 h-4" />}
                label="Bốc thăm"
                color="indigo"
                locked={!user}
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent
            value="create"
            className="space-y-6 animate-in fade-in zoom-in-95 duration-300"
          >
            <Card className="p-4 bg-white border border-slate-100 backdrop-blur-xl rounded-3xl space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  THÔNG TIN VẬN ĐỘNG VIÊN
                </span>
              </div>
              <div className="space-y-2">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase italic">
                    Team 1
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={t1p1}
                      onChange={(e) => setT1p1(e.target.value)}
                      placeholder="Player 1"
                      className="bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-sm text-slate-900 focus:border-blue-500 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={t1p2}
                      onChange={(e) => setT1p2(e.target.value)}
                      placeholder="Player 2"
                      className="bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-sm text-slate-900 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase italic">
                    Team 2
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={t2p1}
                      onChange={(e) => setT2p1(e.target.value)}
                      placeholder="Player 3"
                      className="bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-sm text-slate-900 focus:border-orange-500 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={t2p2}
                      onChange={(e) => setT2p2(e.target.value)}
                      placeholder="Player 4"
                      className="bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-sm text-slate-900 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-100 backdrop-blur-xl rounded-3xl space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-blue-500">
                <Settings2 className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  CÀI ĐẶT TRẬN ĐẤU
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">
                    Điểm thắng
                  </label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {["11", "15", "21"].map((score) => (
                      <button
                        key={score}
                        onClick={() => setWinningScore(score)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${winningScore === score ? "bg-blue-500 text-white" : "text-slate-500"}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">
                    Team Phát Bóng Đầu
                  </label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {[1, 2].map((team) => (
                      <button
                        key={team}
                        onClick={() => setFirstServer(team as 1 | 2)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${firstServer === team ? (team === 1 ? "bg-cyan-500" : "bg-rose-500") : "text-slate-500"}`}
                      >
                        Team {team}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowCoinToss(true)}
                className="w-full bg-slate-100 border border-slate-200 text-blue-500 font-black text-[10px] py-3 rounded-xl gap-4 hover:bg-slate-200 transition-all"
              >
                <Coins className="w-2 h-2" /> TUNG XU PHÂN ĐỊNH
              </Button>
            </Card>

            <Button
              onClick={handleStart}
              disabled={
                !t1p1 || !t1p2 || !t2p1 || !t2p2 || createMatch.isPending
              }
              className={`w-full py-8 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] gap-2 transition-all ${!t1p1 || !t1p2 || !t2p1 || !t2p2 ? "bg-slate-200 text-slate-400" : "bg-blue-500 text-white hover:scale-[1.02] active:scale-95"}`}
            >
              {createMatch.isPending
                ? "ĐANG VÀO TRẬN ĐẤU..."
                : "BẮT ĐẦU TRẬN ĐẤU"}{" "}
              <ArrowRight className="w-6 h-6" />
            </Button>
          </TabsContent>

          {/* TAB 2: BỐC THĂM / CHIA BẢNG */}
          <TabsContent
            value="draw"
            className="space-y-6 animate-in slide-in-from-right-4 duration-300"
          >
            <Card className="p-4 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-lg">
              <ExcelUpload onDataLoaded={handleExcelData} />
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-600 uppercase italic">
                  Hoặc nhập tay
                </span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>
              <textarea
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="Nhập danh sách VĐV, mỗi người một dòng..."
              />
              <Button
                onClick={handleDraw}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black italic rounded-2xl h-14 shadow-lg uppercase tracking-widest"
              >
                <Shuffle className="w-4 h-4 mr-2" /> Xác nhận chia bảng
              </Button>
            </Card>

            {tournamentGroups && (
              <div className="space-y-6 pb-10">
                {Object.values(tournamentGroups).map((group: any) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={group.name}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl"
                  >
                    <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex justify-between items-center">
                      <span className="font-black italic text-indigo-400 uppercase tracking-tighter text-sm">
                        Bảng {group.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {group.players.length} Players
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      {group.matches.map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] font-bold"
                        >
                          <span className="w-[42%] text-right truncate text-slate-800">
                            {m.home}
                          </span>
                          <span className="text-blue-500 font-black mx-2 italic opacity-50">
                            VS
                          </span>
                          <span className="w-[42%] text-left truncate text-slate-800">
                            {m.away}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: LỊCH SỬ TRẬN ĐẤU */}
          <TabsContent
            value="history"
            className="space-y-4 animate-in slide-in-from-left-4 duration-300"
          >
            <div className="relative mb-4">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Tìm kiếm trận đấu..."
                className="pl-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {matchesData
                  ?.sort((a, b) => {
                    if (a.status === "live" && b.status !== "live") return -1;
                    if (a.status !== "live" && b.status === "live") return 1;
                    return b.id - a.id;
                  })
                  .map((match) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key={match.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden group shadow-xl hover:shadow-2xl transition-all"
                  >
                    {/* Header: EYE + PLAY (trái) | LIVE/DONE (phải) */}
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(`/match-view/${match.id}`, "_blank")
                          }
                          className="h-7 w-7 rounded-md bg-slate-200 hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const url = `/match?matchId=${match.id}&t1p1=${encodeURIComponent(match.team1Player1)}&t1p2=${encodeURIComponent(match.team1Player2)}&t2p1=${encodeURIComponent(match.team2Player1)}&t2p2=${encodeURIComponent(match.team2Player2)}&win=${match.winningScore}&serve=1`;
                            window.open(url, "_blank");
                          }}
                          className="h-7 w-7 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </Button>
                      </div>
                      {match.status === "live" ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-red-500 font-black italic text-xs">LIVE</span>
                        </div>
                      ) : (
                        <span className="text-green-500 font-bold text-[10px] uppercase">DONE</span>
                      )}
                    </div>

                    {/* Team 1 Row - nền xanh nếu đang serve */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${match.isServer1 ? "bg-blue-50" : "bg-white"}`}
                    >
                      <div className={`flex flex-col ${match.isServer1 ? "text-black" : "text-slate-900"}`}>
                        <span className="text-lg font-black italic uppercase leading-tight">
                          {match.team1Player1}
                        </span>
                        <span className="text-lg font-black italic uppercase leading-tight opacity-80">
                          {match.team1Player2}
                        </span>
                        </div>
                      <div className="flex items-center gap-3">
                        {/* Score T1 */}
                        <span className="text-2xl font-black text-blue-600 leading-none">{match.scoreTeam1}</span>
                        {/* Serve dots */}
                        <div className="flex flex-col gap-1">
                          <div className={`w-4 h-4 rounded-full ${match.isServer1 && match.serverNumber >= 1 ? "bg-red-500 animate-pulse" : "bg-slate-200"}`} />
                          <div className={`w-4 h-4 rounded-full ${match.isServer1 && match.serverNumber >= 2 ? "bg-red-500 animate-pulse" : "bg-slate-200"}`} />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Team 2 Row */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${match.isServer2 ? "bg-blue-50" : "bg-white"}`}
                    >
                      <div className={`flex flex-col ${match.isServer2 ? "text-black" : "text-slate-900"}`}>
                        <span className="text-lg font-black italic uppercase leading-tight">
                          {match.team2Player1}
                        </span>
                        <span className="text-lg font-black italic uppercase leading-tight opacity-80">
                          {match.team2Player2}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Score T2 */}
                        <span className="text-2xl font-black text-orange-600 leading-none">{match.scoreTeam2}</span>
                        {/* Serve dots */}
                        <div className="flex flex-col gap-1">
                          <div className={`w-4 h-4 rounded-full ${match.isServer2 && match.serverNumber >= 1 ? "bg-red-500 animate-pulse" : "bg-slate-200"}`} />
                          <div className={`w-4 h-4 rounded-full ${match.isServer2 && match.serverNumber >= 2 ? "bg-red-500 animate-pulse" : "bg-slate-200"}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Phân trang */}
            <div className="flex justify-center items-center gap-6 pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                Page {page}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <CoinTossModal
        open={showCoinToss}
        onOpenChange={setShowCoinToss}
        onComplete={(winner: 1 | 2, choice: "serve" | "side") => {
          const server = choice === "serve" ? winner : winner === 1 ? 2 : 1;
          setFirstServer(server);
        }}
        compact={true}
      />
    </div>
  );
}

// Custom Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  color,
  locked = false 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  color: "blue" | "orange" | "indigo" | "amber";
  locked?: boolean;
}) {
  const colorClasses = {
    blue: "text-white",
    orange: "text-white", 
    indigo: "text-white",
    amber: "text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`
        relative z-10 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl
        font-black uppercase text-[10px] tracking-wide transition-all duration-300
        ${active ? colorClasses[color] : "text-slate-400 hover:text-slate-200"}
        ${locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {locked && <Lock className="w-3 h-3" />}
    </button>
  );
}
