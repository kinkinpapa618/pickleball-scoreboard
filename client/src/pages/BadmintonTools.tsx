import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trophy,
  Eye,
  Trash2,
  Play,
  MonitorPlay,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings2,
  Feather,
  Coins,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CoinTossModal } from "@/components/CoinTossModal";

// ─── Types ────────────────────────────────────────────────
interface BadmintonMatch {
  id: number;
  type: "singles" | "doubles" | "mixed";
  bestOf: number;
  winningPoints: number;
  status: "pending" | "live" | "completed";
  currentGame: number;
  gamesWonTeam1: number;
  gamesWonTeam2: number;
  winnerTeam: 1 | 2 | null;
  gameScores: Array<[number, number]>;
  currentScoreTeam1: number;
  currentScoreTeam2: number;
  servingTeam: 1 | 2;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  date: string;
}

const MATCH_TYPE_LABELS = {
  singles: "Đơn",
  doubles: "Đôi",
  mixed: "Đôi HH",
};

// ─── Main Component ───────────────────────────────────────
export default function BadmintonTools() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create form state
  const [matchType, setMatchType] = useState<"singles" | "doubles" | "mixed">("doubles");
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [bestOf, setBestOf] = useState<1 | 3 | 5>(1);
  const [isBestOf, setIsBestOf] = useState(false);
  const [winningPoints, setWinningPoints] = useState<21 | 31>(21);
  const [firstServer, setFirstServer] = useState<1 | 2>(1);
  const [showCoinToss, setShowCoinToss] = useState(false);

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);

  // ─── Queries ───────────────────────────────────────────
  const { data: myMatchesData } = useQuery<{
    matches: BadmintonMatch[];
    pagination: { total: number; totalPages: number; hasMore: boolean };
  }>({
    queryKey: ["/api/badminton/matches", historyPage],
    queryFn: () => apiRequest("GET", `/api/badminton/matches?page=${historyPage}`).then((r) => r.json()),
  });

  // ─── Mutations ──────────────────────────────────────────
  const createMatch = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/badminton/matches", data).then((r) => r.json()),
    onSuccess: (match) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badminton/matches"] });
      setLocation(`/badminton/match/${match.id}`);
    },
    onError: () => toast({ title: "Lỗi tạo trận đấu", variant: "destructive" }),
  });

  const deleteMatch = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/badminton/matches/${id}`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/badminton/matches"] });
      toast({ title: "Đã xóa trận đấu" });
    },
    onError: () => toast({ title: "Lỗi xóa trận đấu", variant: "destructive" }),
  });

  // ─── Handlers ──────────────────────────────────────────
  const handleCreate = () => {
    const isDoubles = matchType !== "singles";
    if (!t1p1.trim() || !t2p1.trim()) {
      toast({ title: "Vui lòng nhập tên cầu thủ", variant: "destructive" });
      return;
    }
    if (isDoubles && (!t1p2.trim() || !t2p2.trim())) {
      toast({ title: "Vui lòng nhập đủ tên 4 cầu thủ", variant: "destructive" });
      return;
    }
    createMatch.mutate({
      team1Player1: t1p1.trim(),
      team1Player2: isDoubles ? t1p2.trim() : "",
      team2Player1: t2p1.trim(),
      team2Player2: isDoubles ? t2p2.trim() : "",
      type: matchType,
      bestOf: isBestOf ? bestOf : 1,
      winningPoints,
      servingTeam: firstServer,
    });
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Feather className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground uppercase italic tracking-tight leading-none">
              Cầu Lông
            </h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
              Badminton Scoreboard
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Tabs defaultValue="create">
          <TabsList className="w-full mb-4 bg-muted rounded-xl p-1 h-auto">
            <TabsTrigger
              value="create"
              className="flex-1 text-[10px] font-black uppercase py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Trận Đấu
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 text-[10px] font-black uppercase py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Lịch Sử ({myMatchesData?.pagination.total || 0})
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: TẠO TRẬN ── */}
          <TabsContent value="create" className="space-y-4 animate-in fade-in duration-300">
            {/* Player Info Card */}
            <Card className="p-4 bg-card border border-border rounded-3xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-500">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-black italic uppercase tracking-widest">
                    THÔNG TIN VẬN ĐỘNG VIÊN
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Team 1 */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase italic">
                    Team 1
                  </span>
                  <div className={`grid gap-2 ${matchType !== "singles" ? "grid-cols-2" : "grid-cols-1"}`}>
                    <input
                      type="text"
                      value={t1p1}
                      onChange={(e) => setT1p1(e.target.value)}
                      placeholder="Player 1"
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-blue-500 outline-none transition-all w-full"
                    />
                    {matchType !== "singles" && (
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
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase italic">
                    Team 2
                  </span>
                  <div className={`grid gap-2 ${matchType !== "singles" ? "grid-cols-2" : "grid-cols-1"}`}>
                    <input
                      type="text"
                      value={t2p1}
                      onChange={(e) => setT2p1(e.target.value)}
                      placeholder="Player 3"
                      className="bg-muted border border-border rounded-xl h-10 px-3 text-sm text-foreground focus:border-orange-500 outline-none transition-all w-full"
                    />
                    {matchType !== "singles" && (
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

            {/* Settings Card */}
            <Card className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-blue-500">
                <Settings2 className="w-4 h-4" />
                <span className="text-[10px] font-black italic uppercase tracking-widest">
                  CÀI ĐẶT TRẬN ĐẤU
                </span>
              </div>

              <div className="space-y-4">
                {/* Grid 2 cột: Loại Trận và Best Of */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Match Type */}
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                      Loại Trận
                    </label>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                      {(["singles", "doubles", "mixed"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setMatchType(t)}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                            matchType === t ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {MATCH_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Best Of */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">
                        Best Of
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBestOf}
                          onChange={(e) => {
                            setIsBestOf(e.target.checked);
                            if (!e.target.checked) {
                              setBestOf(1);
                            } else {
                              setBestOf(3);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 accent-blue-500 cursor-pointer"
                        />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Chơi nhiều Set</span>
                      </label>
                    </div>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                      {([3, 5] as const).map((bo) => (
                        <button
                          key={bo}
                          disabled={!isBestOf}
                          onClick={() => setBestOf(bo)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                            !isBestOf
                              ? "opacity-30 cursor-not-allowed text-muted-foreground"
                              : bestOf === bo
                                ? "bg-blue-500 text-white"
                                : "text-muted-foreground"
                          }`}
                        >
                          BO{bo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid 2 cột: Điểm/Ván và Giao Đầu */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Điểm thắng */}
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                      Điểm/Ván
                    </label>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                      {([21, 31] as const).map((pts) => (
                        <button
                          key={pts}
                          onClick={() => setWinningPoints(pts)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                            winningPoints === pts ? "bg-blue-500 text-white" : "text-muted-foreground"
                          }`}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* First Serve */}
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">
                      Giao Đầu
                    </label>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                      {([1, 2] as const).map((team) => (
                        <button
                          key={team}
                          onClick={() => setFirstServer(team)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                            firstServer === team
                              ? team === 1
                                ? "bg-cyan-500 text-white"
                                : "bg-rose-500 text-white"
                              : "text-muted-foreground"
                          }`}
                        >
                          Team {team}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary badge */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-500 uppercase">
                  {MATCH_TYPE_LABELS[matchType]}
                </span>
                <span className="px-2 py-0.5 bg-muted border border-border rounded-full text-[9px] font-black text-muted-foreground uppercase">
                  {winningPoints} điểm
                </span>
                <span className="px-2 py-0.5 bg-muted border border-border rounded-full text-[9px] font-black text-muted-foreground uppercase">
                  {isBestOf ? `Best of ${bestOf}` : "Đấu 1 Set (BO1)"}
                </span>
                <span className="px-2 py-0.5 bg-muted border border-border rounded-full text-[9px] font-black text-muted-foreground uppercase">
                  Team {firstServer} giao đầu
                </span>
              </div>
            </Card>

            {/* Coin Toss Button */}
            <Button
              onClick={() => setShowCoinToss(true)}
              className="w-full py-5 rounded-2xl font-bold bg-card border border-border text-blue-500 hover:bg-accent/50 transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
            >
              <Coins className="w-3.5 h-3.5" /> TUNG XU PHÂN ĐỊNH
            </Button>

            {/* Start Button */}
            {(() => {
              const isFormValid = matchType === "singles"
                ? (t1p1.trim().length > 0 && t2p1.trim().length > 0)
                : (t1p1.trim().length > 0 && t1p2.trim().length > 0 && t2p1.trim().length > 0 && t2p2.trim().length > 0);
              return (
                <Button
                  onClick={handleCreate}
                  disabled={!isFormValid || createMatch.isPending}
                  className={`w-full py-8 rounded-2xl font-black italic text-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] gap-2 transition-all ${
                    !isFormValid
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-blue-500 text-white hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {createMatch.isPending ? "ĐANG VÀO TRẬN ĐẤU..." : "BẮT ĐẦU TRẬN ĐẤU"}
                  <ArrowRight className="w-6 h-6" />
                </Button>
              );
            })()}
          </TabsContent>

          {/* ── TAB 2: LỊCH SỬ ── */}
          <TabsContent value="history" className="space-y-4 animate-in slide-in-from-left-4 duration-300">
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
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Match List */}
            <div className="space-y-3">
              {myMatchesData?.matches.map((match) => {
                const isLive = match.status === "live";
                const isCompleted = match.status === "completed";
                const winner = match.winnerTeam;
                const hasWinner = winner !== null;
                const typeLabel = MATCH_TYPE_LABELS[match.type];

                return (
                  <div
                    key={match.id}
                    className={`relative bg-card dark:bg-slate-950/70 dark:backdrop-blur-xl border rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                      isLive && !hasWinner
                        ? "border-red-400/40 dark:border-red-500/25"
                        : "border-border dark:border-white/10"
                    }`}
                  >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/60 dark:bg-black/30 border-b border-border dark:border-white/5">
                      <div className="flex items-center gap-2">
                        {/* Status */}
                        {hasWinner && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest">KẾT THÚC</span>
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
                        {/* Type badge */}
                        <span className="px-2 py-0.5 bg-muted border border-border dark:bg-white/5 dark:border-white/10 rounded-full text-[9px] font-black text-muted-foreground dark:text-white/40 uppercase">
                          {typeLabel} • Bo{match.bestOf} • {match.winningPoints}pt
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {isLive && !hasWinner && (
                          <>
                            <button
                              onClick={() => setLocation(`/badminton/match/${match.id}`)}
                              className="h-7 w-7 rounded-lg bg-blue-600/80 text-white hover:bg-blue-500 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                              title="Tiếp tục trận"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              onClick={() => window.open(`/badminton/overlay/${match.id}`, "_blank", "width=650,height=260")}
                              className="h-7 w-7 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500 transition-all flex items-center justify-center"
                              title="Overlay Livestream"
                            >
                              <MonitorPlay className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {hasWinner && (
                          <button
                            onClick={() => setLocation(`/badminton/match/${match.id}`)}
                            className="h-7 w-7 rounded-lg bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center"
                            title="Xem lại"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa trận này?")) {
                              deleteMatch.mutate(match.id);
                            }
                          }}
                          className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 hover:text-red-500 border border-red-200 dark:border-red-900/20 transition-all flex items-center justify-center"
                          title="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Score Rows */}
                    <div className="flex flex-col">
                      {/* Team 1 */}
                      <div className="relative flex items-center justify-between px-5 py-3">
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                            isLive && match.servingTeam === 1
                              ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                              : winner === 1
                              ? "bg-blue-500"
                              : "bg-transparent"
                          }`}
                        />
                        {((isLive && match.servingTeam === 1) || winner === 1) && (
                          <div className={`absolute inset-0 pointer-events-none ${
                            winner === 1
                              ? "bg-blue-500/10 dark:bg-blue-500/20"
                              : "bg-gradient-to-r from-blue-500/8 dark:from-blue-500/5 to-transparent"
                          }`} />
                        )}
                        <div className="flex flex-col z-10 pl-2">
                          <span className={`font-black uppercase tracking-wide text-sm transition-colors ${
                            winner === 1 ? "text-blue-500 dark:text-blue-400" : "text-foreground"
                          }`}>
                            {match.team1Player1}
                          </span>
                          {match.type !== "singles" && match.team1Player2 && (
                            <span className={`font-black uppercase tracking-wide text-xs ${
                              winner === 1 ? "text-blue-500/70 dark:text-blue-400/70" : "text-muted-foreground"
                            }`}>
                              {match.team1Player2}
                            </span>
                          )}
                        </div>
                        {/* Game scores breakdown */}
                        <div className="flex items-center gap-4 z-10">
                          <div className="flex items-center gap-2">
                            {match.bestOf > 1 && match.gameScores.map(([s1], gi) => (
                              <span key={gi} className="text-[12px] font-bold text-muted-foreground w-6 text-center">{s1}</span>
                            ))}
                            {/* Serve Icon */}
                            <div className="w-6 flex items-center justify-center">
                              <Feather className={`w-5 h-5 transition-all duration-300 ${
                                isLive && match.servingTeam === 1 ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "text-transparent"
                              }`} />
                            </div>
                          </div>
                          {/* Main Score */}
                          <span className={`font-black tabular-nums text-right transition-all duration-300 min-w-[2.5rem] ${
                            winner === 1
                              ? "text-blue-500 dark:text-blue-400 text-4xl"
                              : isLive && match.servingTeam === 1
                              ? "text-blue-500 dark:text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)] dark:drop-shadow-[0_0_15px_rgba(96,165,250,0.9)] text-4xl"
                              : "text-blue-500/70 dark:text-blue-400/80 text-3xl"
                          }`}>
                            {match.bestOf === 1
                              ? (isCompleted ? (match.gameScores[0]?.[0] ?? match.currentScoreTeam1) : match.currentScoreTeam1)
                              : (isCompleted ? match.gamesWonTeam1 : match.currentScoreTeam1)
                            }
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent mx-5" />

                      {/* Team 2 */}
                      <div className="relative flex items-center justify-between px-5 py-3">
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${
                            isLive && match.servingTeam === 2
                              ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.6)]"
                              : winner === 2
                              ? "bg-orange-500"
                              : "bg-transparent"
                          }`}
                        />
                        {((isLive && match.servingTeam === 2) || winner === 2) && (
                          <div className={`absolute inset-0 pointer-events-none ${
                            winner === 2
                              ? "bg-orange-500/10 dark:bg-orange-500/20"
                              : "bg-gradient-to-r from-orange-500/8 dark:from-orange-500/5 to-transparent"
                          }`} />
                        )}
                        <div className="flex flex-col z-10 pl-2">
                          <span className={`font-black uppercase tracking-wide text-sm transition-colors ${
                            winner === 2 ? "text-orange-500 dark:text-orange-400" : "text-foreground"
                          }`}>
                            {match.team2Player1}
                          </span>
                          {match.type !== "singles" && match.team2Player2 && (
                            <span className={`font-black uppercase tracking-wide text-xs ${
                              winner === 2 ? "text-orange-500/70 dark:text-orange-400/70" : "text-muted-foreground"
                            }`}>
                              {match.team2Player2}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 z-10">
                          <div className="flex items-center gap-2">
                            {match.bestOf > 1 && match.gameScores.map(([, s2], gi) => (
                              <span key={gi} className="text-[12px] font-bold text-muted-foreground w-6 text-center">{s2}</span>
                            ))}
                            {/* Serve Icon */}
                            <div className="w-6 flex items-center justify-center">
                              <Feather className={`w-5 h-5 transition-all duration-300 ${
                                isLive && match.servingTeam === 2 ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "text-transparent"
                              }`} />
                            </div>
                          </div>
                          {/* Main Score */}
                          <span className={`font-black tabular-nums text-right transition-all duration-300 min-w-[2.5rem] ${
                            winner === 2
                              ? "text-orange-500 dark:text-orange-400 text-4xl"
                              : isLive && match.servingTeam === 2
                              ? "text-orange-500 dark:text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)] dark:drop-shadow-[0_0_15px_rgba(251,146,60,0.9)] text-4xl"
                              : "text-orange-500/70 dark:text-orange-400/80 text-3xl"
                          }`}>
                            {match.bestOf === 1
                              ? (isCompleted ? (match.gameScores[0]?.[1] ?? match.currentScoreTeam2) : match.currentScoreTeam2)
                              : (isCompleted ? match.gamesWonTeam2 : match.currentScoreTeam2)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {(!myMatchesData?.matches || myMatchesData.matches.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Feather className="w-7 h-7 text-muted-foreground/40 dark:text-white/20" />
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
                  className="w-9 h-9 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, myMatchesData.pagination.totalPages) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setHistoryPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      historyPage === pageNum
                        ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                        : "bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={!myMatchesData.pagination.hasMore}
                  className="w-9 h-9 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
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
    </div>
  );
}
