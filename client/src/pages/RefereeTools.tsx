import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Search,
  Users,
  Settings2,
  ArrowRight,
  Eye,
  Trophy,
  Trash2,
  Zap,
  Layers,
  Calendar,
  Coins,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateMatch,
  useMyMatches,
  useMatches,
  useTournaments,
  useTournament,
  useCreateTournament,
  useGenerateTournament,
  useReferees,
  useAssignReferee,
  useStartTournamentMatch,
  useDeleteTournament,
  useDeleteMatch,
} from "@/hooks/use-api";

import { CoinTossModal } from "@/components/CoinTossModal";

export default function RefereeTools() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const createMatch = useCreateMatch();
  const queryClient = useQueryClient();

  const [showBulkConfigModal, setShowBulkConfigModal] = useState(false);
  const [bulkTournamentName, setBulkTournamentName] = useState("");
  const [bulkTheme, setBulkTheme] = useState("dali-sport");

  const handleSaveBulkConfig = async () => {
    try {
      await apiRequest("POST", "/api/matches/bulk-update", {
        tournamentName: bulkTournamentName,
        theme: bulkTheme,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-matches"] });
      setShowBulkConfigModal(false);
    } catch (e) {
      console.error("Failed to bulk update matches:", e);
    }
  };

  const isManager = user?.role === "manager" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const isConnectedToManager = !!user?.managerId;

  const [activeTab, setActiveTab] = useState("create");
  const [historyPage, setHistoryPage] = useState(1);
  const { data: myMatchesData } = useMyMatches(historyPage);
  const { data: matchesData } = useMatches(1);

  const handleTabChange = (value: string) => {
    if (!user && (value === "history" || value === "tournament")) {
      setLocation("/auth");
      return;
    }
    if ((value === "tournament") && !isManager && !isConnectedToManager) {
      setLocation("/auth");
      return;
    }
    setActiveTab(value);
  };

  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [winningScore, setWinningScore] = useState("15");
  const [boMode, setBoMode] = useState<"bo1" | "bo3" | "bo5">("bo1");
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [matchType, setMatchType] = useState<"singles" | "doubles">("doubles");
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [matchCodeInput, setMatchCodeInput] = useState("");
  const [tournamentNameInput, setTournamentNameInput] = useState("");

  const [playerInput, setPlayerInput] = useState<string>("");

  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const { data: tournaments } = useTournaments();
  const { data: selectedTournament, refetch: refetchTournament } = useTournament(selectedTournamentId!);
  const createTournament = useCreateTournament();
  const generateTournament = useGenerateTournament();
  const assignReferee = useAssignReferee();
  const startMatch = useStartTournamentMatch();
  const deleteTournament = useDeleteTournament();
  const deleteMatch = useDeleteMatch();
  const { data: referees } = useReferees();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentDesc, setNewTournamentDesc] = useState("");
  const [newTournamentDate, setNewTournamentDate] = useState("");
  const [newTournamentTime, setNewTournamentTime] = useState("");
  const [newTournamentLocation, setNewTournamentLocation] = useState("");
  const [newTournamentLevels, setNewTournamentLevels] = useState<string[]>([]);
  const [newLevelInput, setNewLevelInput] = useState("");
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [assigningMatchId, setAssigningMatchId] = useState<number | null>(null);

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
        level: JSON.stringify(newTournamentLevels),
        content: JSON.stringify(contentMap),
        teamsPerGroup,
        winningScore: 15,
        status: "draft",
      });
      setShowCreateModal(false);
      setNewTournamentName("");
      setNewTournamentDesc("");
      setNewTournamentDate("");
      setNewTournamentTime("");
      setNewTournamentLocation("");
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
      setLocation(`/match/${match.id}`);
    } catch (error) {
      console.error("Error starting match:", error);
      alert("Không thể bắt đầu trận đấu");
    }
  };

  const handleStart = async () => {
    if (matchType === "doubles" && (!t1p1 || !t1p2 || !t2p1 || !t2p2)) return;
    if (matchType === "singles" && (!t1p1 || !t2p1)) return;

    const p1t2 = matchType === "singles" ? "" : t1p2;
    const p2t2 = matchType === "singles" ? "" : t2p2;

    try {
      const newMatch = await createMatch.mutateAsync({
        team1Player1: t1p1,
        team1Player2: p1t2,
        team2Player1: t2p1,
        team2Player2: p2t2,
        winningScore: parseInt(winningScore),
        scoreTeam1: 0,
        scoreTeam2: 0,
        status: "live",
        isServer1: firstServer === 1,
        isServer2: firstServer === 2,
        serverNumber: 1,
        type: matchType,
        mode: boMode,
        matchCode: matchCodeInput,
        tournamentName: tournamentNameInput,
      });

      const params = new URLSearchParams({
        t1p1,
        t1p2: p1t2,
        t2p1,
        t2p2: p2t2,
        win: winningScore,
        serve: String(firstServer),
        type: matchType,
        mode: boMode,
      });
      setLocation(`/match/${newMatch.id}?${params.toString()}`);
    } catch (error) {
      console.error("Không thể tạo trận đấu:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 pb-24 flex flex-col font-sans overflow-x-hidden transition-colors">
      {/* Brand Header */}
      <div className="text-center py-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black italic tracking-tighter text-blue-600"
        >
          TRONGTAISO.COM
        </motion.h3>
        <p className="text-muted-foreground text-[10px] tracking-[0.4em] uppercase font-bold">
          Referee Support
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        {/* TABS */}
        <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl">
          <button
            onClick={() => handleTabChange("create")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === "create" ? "bg-blue-500 text-white shadow" : "text-muted-foreground hover:bg-accent"
              }`}
          >
            Trận đấu
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === "history" ? "bg-blue-500 text-white shadow" : "text-muted-foreground hover:bg-accent"
              }`}
          >
            Lịch sử
          </button>

        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent
            value="create"
            className="space-y-6 animate-in fade-in zoom-in-95 duration-300"
          >
            <Card className="p-4 bg-card border border-border backdrop-blur-xl rounded-3xl space-y-4 shadow-lg transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-500">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-black italic uppercase tracking-widest">
                    THÔNG TIN VẬN ĐỘNG VIÊN
                  </span>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setMatchType("singles")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${matchType === "singles" ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    Đơn
                  </button>
                  <button
                    onClick={() => setMatchType("doubles")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${matchType === "doubles" ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    Đôi
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Team 1 */}
                <div className="flex items-center gap-3 w-full">
                  {/* T1 Badge */}
                  <div className="flex-shrink-0 w-12 h-10 bg-blue-600 dark:bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-sm uppercase tracking-wider">T1</span>
                  </div>
                  {/* Inputs */}
                  <div className={`grid gap-2 flex-1 ${matchType === "doubles" ? "grid-cols-2" : "grid-cols-1"}`}>
                    <input
                      type="text"
                      value={t1p1}
                      onChange={(e) => setT1p1(e.target.value)}
                      placeholder="Player 1"
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-blue-500 outline-none transition-all w-full"
                    />
                    {matchType === "doubles" && (
                      <input
                        type="text"
                        value={t1p2}
                        onChange={(e) => setT1p2(e.target.value)}
                        placeholder="Player 2"
                        className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-blue-500 outline-none transition-all w-full"
                      />
                    )}
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-3 w-full">
                  {/* T2 Badge */}
                  <div className="flex-shrink-0 w-12 h-10 bg-orange-600 dark:bg-orange-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-sm uppercase tracking-wider">T2</span>
                  </div>
                  {/* Inputs */}
                  <div className={`grid gap-2 flex-1 ${matchType === "doubles" ? "grid-cols-2" : "grid-cols-1"}`}>
                    <input
                      type="text"
                      value={t2p1}
                      onChange={(e) => setT2p1(e.target.value)}
                      placeholder="Player 3"
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-orange-500 outline-none transition-all w-full"
                    />
                    {matchType === "doubles" && (
                      <input
                        type="text"
                        value={t2p2}
                        onChange={(e) => setT2p2(e.target.value)}
                        placeholder="Player 4"
                        className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-orange-500 outline-none transition-all w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border backdrop-blur-xl rounded-3xl space-y-2 shadow-xl transition-colors">
              <div className="flex items-center gap-2 text-blue-500">
                <Settings2 className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  CÀI ĐẶT TRẬN ĐẤU
                </span>
              </div>
              
              <div className="space-y-1.5 pb-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Tên giải đấu
                    </label>
                    <input
                      type="text"
                      value={tournamentNameInput}
                      onChange={(e) => setTournamentNameInput(e.target.value)}
                      placeholder="Ví dụ: GIẢI PICKLEBALL..."
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-orange-500 outline-none transition-all w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Mã trận đấu / Vòng đấu
                    </label>
                    <input
                      type="text"
                      value={matchCodeInput}
                      onChange={(e) => setMatchCodeInput(e.target.value)}
                      placeholder="Ví dụ: VÒNG 1 | BẢNG A..."
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-orange-500 outline-none transition-all w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                    Điểm thắng
                  </label>
                  <div className="flex gap-1 bg-muted p-1 rounded-xl">
                    {["11", "15", "21"].map((score) => (
                      <button
                        key={score}
                        onClick={() => setWinningScore(score)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${winningScore === score ? "bg-blue-500 text-white" : "text-muted-foreground"}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                    Thể thức
                  </label>
                  <div className="flex gap-1 bg-muted p-1 rounded-xl">
                    {[
                      { key: "bo1", label: "BO1" },
                      { key: "bo3", label: "BO3" },
                      { key: "bo5", label: "BO5" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setBoMode(item.key as any)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${boMode === item.key ? "bg-blue-500 text-white" : "text-muted-foreground"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                    Team Phát Đầu
                  </label>
                  <div className="flex gap-1 bg-muted p-1 rounded-xl">
                    {[1, 2].map((team) => (
                      <button
                        key={team}
                        onClick={() => setFirstServer(team as 1 | 2)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${firstServer === team ? (team === 1 ? "bg-cyan-500" : "bg-rose-500") : "text-muted-foreground"}`}
                      >
                        T{team}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowCoinToss(true)}
                className="w-full bg-muted border border-border text-blue-500 font-black text-[10px] py-3 rounded-xl gap-4 hover:bg-accent transition-all"
              >
                <Coins className="w-2 h-2" /> TUNG XU PHÂN ĐỊNH
              </Button>
            </Card>

            <Button
              onClick={handleStart}
              disabled={
                (matchType === "doubles" && (!t1p1 || !t1p2 || !t2p1 || !t2p2)) ||
                (matchType === "singles" && (!t1p1 || !t2p1)) ||
                createMatch.isPending
              }
              className={`w-full py-8 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] gap-2 transition-all ${
                (matchType === "doubles" && (!t1p1 || !t1p2 || !t2p1 || !t2p2)) ||
                (matchType === "singles" && (!t1p1 || !t2p1))
                  ? "bg-muted text-muted-foreground"
                  : "bg-blue-500 text-white hover:scale-[1.02] active:scale-95"
              }`}
            >
              {createMatch.isPending
                ? "ĐANG VÀO TRẬN ĐẤU..."
                : "BẮT ĐẦU TRẬN ĐẤU"}{" "}
              <ArrowRight className="w-6 h-6" />
            </Button>
          </TabsContent>

          {/* TAB 2: LỊCH SỬ TRẬN ĐẤU */}
          <TabsContent
            value="history"
            className="space-y-4 animate-in slide-in-from-left-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">
                  Lịch sử
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {myMatchesData?.pagination.total || 0} trận đã ghi nhận
                </p>
              </div>
              <button
                onClick={() => setShowBulkConfigModal(true)}
                className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 active:scale-95 transition"
                title="Cấu hình tất cả trận đấu"
              >
                <Trophy className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Match List */}
            <div className="space-y-3">
              {myMatchesData?.matches.map((match) => {
                const isLive = match.status === "live";
                const isCompleted = match.status === "completed";
                const isPending = match.status === "pending";
                const winner = match.winnerTeam as 1 | 2 | null;
                const hasWinner = winner !== null;
                const isServer1 = match.isServer1;
                const serverNumber = match.serverNumber || 1;

                return (
                  <div
                    key={match.id}
                    className={`relative bg-card dark:bg-slate-950/70 dark:backdrop-blur-xl border rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 ${
                      isLive && !hasWinner
                        ? "border-red-400/40 dark:border-red-500/25 dark:shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
                        : "border-border dark:border-white/10"
                    }`}
                  >
                    {/* Top bar: Status + Actions */}
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/60 dark:bg-black/30 border-b border-border dark:border-white/5">
                      {/* Status badge */}
                      <div className="flex items-center gap-2">
                        {hasWinner && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest">
                              KẾT THÚC
                            </span>
                          </div>
                        )}
                        {!hasWinner && isLive && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </div>
                            <span className="text-red-500 dark:text-red-400 font-black text-[9px] uppercase tracking-widest">LIVE</span>
                          </div>
                        )}
                        {isPending && !isLive && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-amber-500 dark:bg-amber-400 rounded-full" />
                            <span className="text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest">CHỜ</span>
                          </div>
                        )}
                        {!hasWinner && isCompleted && !isLive && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted border border-border dark:bg-slate-500/10 dark:border-slate-500/20 rounded-full">
                            <span className="text-muted-foreground dark:text-slate-400 font-black text-[9px] uppercase tracking-widest">HOÀN TẤT</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {hasWinner && (
                          <button
                            onClick={() => setLocation(`/match-detail/${match.id}`)}
                            className="h-7 w-7 rounded-lg bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center"
                            title="Chi tiết trận đấu"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        {!hasWinner && isLive && (
                          <button
                            onClick={() => {
                              const url = `/match/${match.id}?t1p1=${encodeURIComponent(match.team1Player1)}&t1p2=${encodeURIComponent(match.team1Player2)}&t2p1=${encodeURIComponent(match.team2Player1)}&t2p2=${encodeURIComponent(match.team2Player2)}&win=${match.winningScore}&serve=1`;
                              setLocation(url);
                            }}
                            className="h-7 w-7 rounded-lg bg-blue-600/80 text-white hover:bg-blue-500 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            title="Tiếp tục trận đấu"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {!hasWinner && isLive && (
                          <button
                            onClick={() => {
                              window.open(`/match-overlay/${match.id}?theme=dali-sport`, "_blank", "width=650,height=250");
                            }}
                            className="h-7 w-7 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            title="Mở Overlay Livestream"
                          >
                            <MonitorPlay className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa trận đấu này?")) {
                              deleteMatch.mutate(match.id);
                            }
                          }}
                          className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-400 dark:text-red-400/70 hover:bg-red-100 dark:hover:bg-red-900/60 hover:text-red-500 dark:hover:text-red-300 border border-red-200 dark:border-red-900/20 transition-all flex items-center justify-center"
                          title="Xóa trận đấu"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Scores area */}
                    <div className="flex flex-col">
                      {/* Team 1 Row */}
                      <div className="relative flex items-center justify-between px-5 py-3.5 group">
                        {/* Serving or Winning left indicator */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                            isLive && isServer1
                              ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                              : winner === 1
                              ? "bg-blue-500 dark:bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                              : "bg-transparent"
                          }`}
                        />
                        {/* Subtle team color bg when serving or winning */}
                        {((isLive && isServer1) || winner === 1) && (
                          <div className={`absolute inset-0 pointer-events-none ${
                            winner === 1 
                              ? "bg-blue-500/10 dark:bg-blue-500/20" 
                              : "bg-gradient-to-r from-blue-500/8 dark:from-blue-500/5 to-transparent"
                          }`} />
                        )}

                        <div className="flex flex-col z-10 pl-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                                isLive
                                  ? isServer1 && serverNumber === 1
                                    ? "text-blue-500 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)] dark:drop-shadow-[0_0_10px_rgba(96,165,250,0.6)] text-base"
                                    : isServer1
                                    ? "text-foreground text-base"
                                    : "text-muted-foreground text-sm"
                                  : winner === 1
                                  ? "text-foreground text-base"
                                  : winner === 2
                                  ? "text-muted-foreground text-sm"
                                  : "text-foreground/80 text-sm"
                              }`}
                            >
                              {match.team1Player1}
                            </span>
                          </div>
                          {match.type === "doubles" && (
                            <span
                              className={`font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                                isLive
                                  ? isServer1 && serverNumber === 2
                                    ? "text-blue-500 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)] dark:drop-shadow-[0_0_10px_rgba(96,165,250,0.6)] text-base"
                                    : isServer1
                                    ? "text-foreground/80 text-sm"
                                    : "text-muted-foreground text-sm"
                                  : winner === 1
                                  ? "text-foreground/70 text-sm"
                                  : winner === 2
                                  ? "text-muted-foreground text-sm"
                                  : "text-foreground/60 text-sm"
                              }`}
                            >
                              {match.team1Player2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 z-10">
                          {/* Serve dots */}
                          <div className="flex flex-col gap-1 items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                isLive && isServer1 && serverNumber >= 1
                                  ? "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)] dark:shadow-[0_0_8px_rgba(96,165,250,0.9)] scale-110"
                                  : "bg-border dark:bg-white/10"
                              }`}
                            />
                            {match.type === "doubles" && (
                              <div
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  isLive && isServer1 && serverNumber >= 2
                                    ? "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)] dark:shadow-[0_0_8px_rgba(96,165,250,0.9)] scale-110"
                                    : "bg-border dark:bg-white/10"
                                }`}
                              />
                            )}
                          </div>
                          {/* Score */}
                          <span
                            className={`font-black tabular-nums text-right transition-all duration-300 ${
                              isLive && isServer1
                                ? "text-blue-500 dark:text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)] dark:drop-shadow-[0_0_15px_rgba(96,165,250,0.9)] text-4xl"
                                : "text-blue-500/70 dark:text-blue-400/80 text-3xl"
                            }`}
                            style={{ minWidth: "2.5rem" }}
                          >
                            {match.scoreTeam1}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent mx-5" />

                      {/* Team 2 Row */}
                      <div className="relative flex items-center justify-between px-5 py-3.5 group">
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                            isLive && !isServer1
                              ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.6)]"
                              : winner === 2
                              ? "bg-orange-500 dark:bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                              : "bg-transparent"
                          }`}
                        />
                        {((isLive && !isServer1) || winner === 2) && (
                          <div className={`absolute inset-0 pointer-events-none ${
                            winner === 2 
                              ? "bg-orange-500/10 dark:bg-orange-500/20" 
                              : "bg-gradient-to-r from-orange-500/8 dark:from-orange-500/5 to-transparent"
                          }`} />
                        )}

                        <div className="flex flex-col z-10 pl-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                                isLive
                                  ? !isServer1 && serverNumber === 1
                                    ? "text-orange-500 dark:text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.4)] dark:drop-shadow-[0_0_10px_rgba(251,146,60,0.6)] text-base"
                                    : !isServer1
                                    ? "text-foreground text-base"
                                    : "text-muted-foreground text-sm"
                                  : winner === 2
                                  ? "text-foreground text-base"
                                  : winner === 1
                                  ? "text-muted-foreground text-sm"
                                  : "text-foreground/80 text-sm"
                              }`}
                            >
                              {match.team2Player1}
                            </span>
                          </div>
                          {match.type === "doubles" && (
                            <span
                              className={`font-black uppercase tracking-wide leading-tight transition-all duration-300 ${
                                isLive
                                  ? !isServer1 && serverNumber === 2
                                    ? "text-orange-500 dark:text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.4)] dark:drop-shadow-[0_0_10px_rgba(251,146,60,0.6)] text-base"
                                    : !isServer1
                                    ? "text-foreground/80 text-sm"
                                    : "text-muted-foreground text-sm"
                                  : winner === 2
                                  ? "text-foreground/70 text-sm"
                                  : winner === 1
                                  ? "text-muted-foreground text-sm"
                                  : "text-foreground/60 text-sm"
                              }`}
                            >
                              {match.team2Player2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 z-10">
                          <div className="flex flex-col gap-1 items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                isLive && !isServer1 && serverNumber >= 1
                                  ? "bg-orange-500 dark:bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)] dark:shadow-[0_0_8px_rgba(251,146,60,0.9)] scale-110"
                                  : "bg-border dark:bg-white/10"
                              }`}
                            />
                            {match.type === "doubles" && (
                              <div
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  isLive && !isServer1 && serverNumber >= 2
                                    ? "bg-orange-500 dark:bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)] dark:shadow-[0_0_8px_rgba(251,146,60,0.9)] scale-110"
                                    : "bg-border dark:bg-white/10"
                                }`}
                              />
                            )}
                          </div>
                          <span
                            className={`font-black tabular-nums text-right transition-all duration-300 ${
                              isLive && !isServer1
                                ? "text-orange-500 dark:text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)] dark:drop-shadow-[0_0_15px_rgba(251,146,60,0.9)] text-4xl"
                                : "text-orange-500/70 dark:text-orange-400/80 text-3xl"
                            }`}
                            style={{ minWidth: "2.5rem" }}
                          >
                            {match.scoreTeam2}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!myMatchesData?.matches || myMatchesData.matches.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-7 h-7 text-muted-foreground/40 dark:text-white/20" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground dark:text-white/30 uppercase tracking-widest">
                    Chưa có trận đấu nào
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 dark:text-white/20 uppercase tracking-wider mt-1">
                    Tạo trận đấu mới để bắt đầu
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {myMatchesData && myMatchesData.pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="w-9 h-9 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground dark:text-white/50 hover:bg-accent dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, myMatchesData.pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setHistoryPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                          historyPage === pageNum
                            ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                            : "bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground dark:text-white/40 hover:bg-accent dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={!myMatchesData.pagination.hasMore}
                  className="w-9 h-9 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground dark:text-white/50 hover:bg-accent dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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

      <Dialog open={showBulkConfigModal} onOpenChange={setShowBulkConfigModal}>
        <DialogContent className="max-w-sm rounded-2xl p-5 bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Cấu hình hàng loạt (Tất cả trận đấu)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Tên giải đấu
              </label>
              <Input
                value={bulkTournamentName}
                onChange={(e) => setBulkTournamentName(e.target.value)}
                placeholder="Nhập tên giải đấu..."
                className="bg-muted border-none h-11 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Chủ đề bảng điểm mặc định
              </label>
              <select
                value={bulkTheme}
                onChange={(e) => setBulkTheme(e.target.value)}
                className="w-full bg-muted border-none h-11 rounded-xl px-3 text-sm focus:outline-none focus:ring-0 text-foreground"
              >
                <option value="default">Sáng</option>
                <option value="dark">Tối</option>
                <option value="glassmorphism">Kính mờ</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="retro">Retro</option>
                <option value="minimal">Thanh ngang</option>
                <option value="dali-sport">Dali Sport</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowBulkConfigModal(false)}
                className="flex-1 h-11 rounded-xl font-bold text-muted-foreground"
              >
                HỦY
              </Button>
              <Button
                onClick={handleSaveBulkConfig}
                className="flex-1 h-11 rounded-xl bg-[#FF5722] hover:bg-[#FF7043] text-white font-bold"
              >
                LƯU TẤT CẢ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
