import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Layers,
  Play,
  Users,
  Target,
  CheckCircle2,
  ChevronRight,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Crown,
  Medal,
  Plus,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  MapPin,
  GitBranch,
  List,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExcelUpload, PlayerData } from "@/components/ExcelUpload";
import {
  useTournaments,
  useTournament,
  useCreateTournament,
  useGenerateTournament,
  useReferees,
  useAssignReferee,
  useAssignCourt,
  useStartTournamentMatch,
  useDeleteTournament,
  useCourts,
} from "@/hooks/use-api";
import { useLocation } from "wouter";

interface MatchFromDB {
  id: number;
  tournamentId: number;
  matchId?: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  groupName: string | null;
  round: number | null;
  matchOrder: number | null;
  status: "pending" | "scheduled" | "live" | "completed";
  refereeId: number | null;
  courtId: number | null;
  scheduledAt: string | null;
}

interface TournamentFromDB {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  level: string | null;
  content: unknown;
  status: "draft" | "active" | "completed" | "cancelled";
  teamsPerGroup: number | null;
}

export default function TournamentPage() {
  const [, setLocation] = useLocation();
  const { data: tournaments } = useTournaments();
  const createTournament = useCreateTournament();
  const generateTournament = useGenerateTournament();
  const deleteTournament = useDeleteTournament();
  const assignReferee = useAssignReferee();
  const startMatch = useStartTournamentMatch();
  const { data: referees } = useReferees();
  const { data: courts = [] } = useCourts();
  const assignCourt = useAssignCourt();

  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const { data: selectedTournament, refetch: refetchTournament } = useTournament(selectedTournamentId || 0);

  const [step, setStep] = useState<"list" | "create" | "detail">("list");
  const [viewTab, setViewTab] = useState<"matches" | "bracket">("matches");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    description: "",
    level: "4.2,4.4",
    teamsPerGroup: 2,
  });

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [teamsPerGroup, setTeamsPerGroup] = useState(2);

  // Modal states
  const [assigningMatchId, setAssigningMatchId] = useState<number | null>(null);
  const [assigningCourtMatchId, setAssigningCourtMatchId] = useState<number | null>(null);
  const [showAccessLink, setShowAccessLink] = useState<{ matchId: number; link: string } | null>(null);

  const handleCreateTournament = async () => {
    if (!formData.name || !formData.date || !formData.location) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const result = await createTournament.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        date: formData.date,
        time: formData.time || null,
        location: formData.location,
        level: formData.level,
        content: "",
        teamsPerGroup: formData.teamsPerGroup,
        status: "draft",
      });
      
      setSelectedTournamentId(result.id);
      setStep("detail");
      setFormData({ name: "", date: "", time: "", location: "", description: "", level: "4.2,4.4", teamsPerGroup: 2 });
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Không thể tạo giải đấu!");
    }
  };

  const handleGenerateMatches = async () => {
    if (!selectedTournamentId || players.length < 2) return;

    try {
      const playerData = players.map(p => ({
        player1: p.player1 || "",
        player2: p.player2 || "",
        player3: p.player3 || "",
        player4: p.player4 || "",
        level: p.level,
        category: p.category
      }));
      
      await generateTournament.mutateAsync({
        tournamentId: selectedTournamentId,
        players: playerData,
        teamsPerGroup,
      });
      refetchTournament();
    } catch (error) {
      console.error("Error generating matches:", error);
      alert("Không thể tạo lịch đấu!");
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
      
      // Lấy link truy cập cho trọng tài
      const accessRes = await fetch(`/api/tournaments/${selectedTournamentId}/matches/${matchId}/access-link`);
      const accessData = await accessRes.json();
      
      if (accessData.link) {
        setShowAccessLink({ matchId, link: accessData.link });
      }
      
      setAssigningMatchId(null);
      refetchTournament();
    } catch (error) {
      console.error("Error assigning referee:", error);
    }
  };

  const handleStartMatch = async (matchId: number) => {
    if (!selectedTournamentId) return;
    try {
      const match = await startMatch.mutateAsync({
        tournamentId: selectedTournamentId,
        matchId,
      });
      if (match?.matchId) {
        setLocation(`/match?matchId=${match.matchId}`);
      }
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const handleAssignCourt = async (matchId: number, courtId: number) => {
    if (!selectedTournamentId) return;
    try {
      await assignCourt.mutateAsync({
        tournamentId: selectedTournamentId,
        matchId,
        courtId,
      });
      setAssigningCourtMatchId(null);
      refetchTournament();
    } catch (error) {
      console.error("Error assigning court:", error);
    }
  };

  const handleDataLoaded = (data: PlayerData[] | string[]) => {
    if (typeof data[0] === "object" && "player1" in (data[0] as PlayerData)) {
      setPlayers(data as PlayerData[]);
    } else {
      setPlayers((data as string[]).map((name) => ({ player1: name })));
    }
  };

  const getMatchesByGroup = () => {
    if (!selectedTournament?.matches) return {};
    const matches = selectedTournament.matches as any[];
    const groups: Record<string, any[]> = {};
    matches.forEach((m) => {
      const groupName = m.groupName || "Chung";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(m);
    });
    return groups;
  };

  if (!tournaments) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans text-slate-900">
      {/* Brand Header */}
      <div className="flex justify-between items-center py-4">
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic tracking-tighter text-blue-600"
          >
            TRONGTAISO.COM
          </motion.h3>
          <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase font-bold">
            Tournament Management
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* STEP 1: LIST TOURNAMENTS */}
      {step === "list" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800">Giải đấu của bạn</h2>
            <Button onClick={() => setStep("create")} className="bg-blue-500 text-white font-bold rounded-2xl">
              <Plus className="w-4 h-4 mr-2" /> Tạo giải
            </Button>
          </div>

          <div className="space-y-3">
            {tournaments?.map((t: any) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all border-slate-100 ${
                  selectedTournamentId === t.id
                    ? "border-blue-500 bg-blue-50"
                    : "bg-white hover:border-blue-300"
                }`}
                onClick={() => {
                  setSelectedTournamentId(t.id);
                  setStep("detail");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-slate-800">{t.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {t.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {t.location}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className={t.status === "active" ? "bg-green-500" : t.status === "completed" ? "bg-slate-400" : "bg-amber-500"}>
                          {t.status === "active" ? "Đang đấu" : t.status === "completed" ? "Đã xong" : "Nháp"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t.level}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Xóa giải đấu này?")) {
                          deleteTournament.mutate(t.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!tournaments || tournaments.length === 0) && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400">Chưa có giải đấu nào</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP 2: CREATE TOURNAMENT */}
      {step === "create" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-white border-slate-100 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
                <Plus className="w-5 h-5 text-blue-500" />
                Tạo giải đấu mới
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tên giải đấu *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Giải Pickleball Cup 2024"
                  className="bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ngày *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Giờ</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Địa điểm *</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="VD: Sân Pickleball Quận 1"
                  className="bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Level</label>
                <Input
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  placeholder="4.2,4.4"
                  className="bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Số đội/bảng</label>
                <select
                  value={formData.teamsPerGroup}
                  onChange={(e) => setFormData({ ...formData, teamsPerGroup: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                >
                  <option value={2}>2 đội/bảng</option>
                  <option value={3}>3 đội/bảng</option>
                  <option value={4}>4 đội/bảng</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả thêm về giải đấu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep("list")} variant="outline" className="flex-1 rounded-2xl">
                  Quay lại
                </Button>
                <Button
                  onClick={handleCreateTournament}
                  disabled={createTournament.isPending}
                  className="flex-1 bg-blue-500 text-white font-bold rounded-2xl"
                >
                  {createTournament.isPending ? "Đang tạo..." : "Tạo giải"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* STEP 3: TOURNAMENT DETAIL */}
      {step === "detail" && selectedTournament && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Tournament Info */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-5 rounded-3xl shadow-lg shadow-blue-200/50 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black italic">{selectedTournament.name}</h2>
                <div className="flex items-center gap-3 text-blue-100 text-xs mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {selectedTournament.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedTournament.time || "Chưa có giờ"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-blue-100 text-xs mt-1">
                  <MapPin className="w-3 h-3" /> {selectedTournament.location}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSelectedTournamentId(null); setStep("list"); }}
                className="bg-white/20 text-white hover:bg-white/30 rounded-xl"
              >
                ← Quay lại
              </Button>
            </div>
          </div>

          {/* Upload & Generate */}
          {selectedTournament.status === "draft" && (
            <Card className="bg-white border-slate-100 rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Tải danh sách VĐV & Tạo lịch đấu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExcelUpload onDataLoaded={handleDataLoaded} mode="tournament" />

                {players.length > 0 && (
                  <>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-sm text-blue-600 font-bold">✓ {players.length} cặp đã tải</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Số đội/bảng</label>
                      <div className="flex gap-2">
                        {[2, 3, 4].map(n => (
                          <button
                            key={n}
                            onClick={() => setTeamsPerGroup(n)}
                            className={`w-12 h-12 rounded-xl font-black ${
                              teamsPerGroup === n ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateMatches}
                      disabled={generateTournament.isPending}
                      className="w-full bg-blue-500 text-white font-bold rounded-2xl"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {generateTournament.isPending ? "Đang tạo..." : "Tạo lịch đấu"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Matches by Group */}
          {selectedTournament.matches && selectedTournament.matches.length > 0 && (
            <div className="space-y-4">
              {/* Tab Buttons */}
              <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100">
                <button
                  onClick={() => setViewTab("matches")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm transition-all ${
                    viewTab === "matches"
                      ? "bg-blue-500 text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Danh sách
                </button>
                <button
                  onClick={() => setViewTab("bracket")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm transition-all ${
                    viewTab === "bracket"
                      ? "bg-blue-500 text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Bracket
                </button>
              </div>

              {viewTab === "matches" && (
                <>
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Lịch thi đấu ({selectedTournament.matches.length} trận)
                  </h3>

                  {Object.entries(getMatchesByGroup()).map(([groupName, matches]) => (
                    <Card key={groupName} className="bg-white border-slate-100 rounded-3xl shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-blue-600">
                          📊 {groupName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {matches.map((match: MatchFromDB) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between bg-slate-50 rounded-2xl p-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {match.round ? `Vòng ${match.round}` : "Chung"}
                                </Badge>
                                <Badge className={
                                  match.status === "live" ? "bg-red-500" :
                                  match.status === "completed" ? "bg-green-500" :
                                  "bg-slate-400"
                                }>
                                  {match.status === "live" ? "LIVE" : match.status === "completed" ? "Xong" : "Chờ"}
                                </Badge>
                              </div>
                              <p className="text-sm font-bold text-slate-800">
                                {match.team1Player1}/{match.team1Player2}
                                <span className="text-slate-400 mx-2">vs</span>
                                {match.team2Player1}/{match.team2Player2}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {assigningMatchId === match.id ? (
                                <select
                                  autoFocus
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                  onChange={(e) => {
                                    if (e.target.value) handleAssignReferee(match.id, Number(e.target.value));
                                  }}
                                  onBlur={() => setAssigningMatchId(null)}
                                >
                                  <option value="">Chọn TT...</option>
                                  {referees?.map(r => (
                                    <option key={r.id} value={r.id}>{r.username}</option>
                                  ))}
                                </select>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAssigningMatchId(match.id)}
                                  className="text-xs bg-slate-100 rounded-xl"
                                >
                                  {match.refereeId ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-blue-600 font-bold">
                                        {referees?.find(r => r.id === match.refereeId)?.username || "TT"}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const accessRes = await fetch(`/api/tournaments/${selectedTournamentId}/matches/${match.id}/access-link`);
                                          const accessData = await accessRes.json();
                                          if (accessData.link) {
                                            const fullLink = `${window.location.origin}${accessData.link}`;
                                            navigator.clipboard.writeText(fullLink);
                                            alert(`Đã copy link: ${fullLink}`);
                                          }
                                        }}
                                      >
                                        📋 Link
                                      </Button>
                                    </div>
                                  ) : (
                                    <UserPlus className="w-4 h-4 text-slate-400" />
                                  )}
                                </Button>
                              )}

                              {assigningCourtMatchId === match.id ? (
                                <select
                                  autoFocus
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                  onChange={(e) => {
                                    if (e.target.value) handleAssignCourt(match.id, Number(e.target.value));
                                  }}
                                  onBlur={() => setAssigningCourtMatchId(null)}
                                >
                                  <option value="">Sân...</option>
                                  {courts.filter(c => c.status === "free").map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAssigningCourtMatchId(match.id)}
                                  className="text-xs bg-slate-100 rounded-xl"
                                >
                                  {match.courtId ? (
                                    <span className="text-green-600 font-bold">
                                      Sân {courts.find(c => c.id === match.courtId)?.name || match.courtId}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Sân</span>
                                  )}
                                </Button>
                              )}

                              {match.status !== "live" && match.status !== "completed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartMatch(match.id)}
                                  disabled={!match.refereeId}
                                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {viewTab === "bracket" && (
                <BracketView matches={selectedTournament.matches || []} />
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Simple Bracket View Component
function BracketView({ matches }: { matches: any[] }) {
  const getMatchesByGroup = () => {
    const groups: Record<string, any[]> = {};
    matches.forEach((m: any) => {
      const groupName = m.groupName || "Chung";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(m);
    });
    return groups;
  };

  const groups = getMatchesByGroup();

  return (
    <div className="space-y-4">
      <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-blue-500" />
        Cây giải đấu
      </h3>

      {Object.entries(groups).map(([groupName, groupMatches]) => (
        <Card key={groupName} className="bg-white border-slate-100 rounded-3xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-blue-600">
              📊 {groupName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupMatches.map((match: any) => (
                <div
                  key={match.id}
                  className={`flex items-center justify-between p-4 rounded-2xl ${
                    match.status === "completed" ? "bg-green-50" :
                    match.status === "live" ? "bg-red-50" :
                    "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={
                      match.status === "live" ? "bg-red-500" :
                      match.status === "completed" ? "bg-green-500" :
                      "bg-slate-400"
                    }>
                      {match.status === "live" ? "LIVE" : match.status === "completed" ? "✓" : "○"}
                    </Badge>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {match.team1Player1}/{match.team1Player2}
                      </p>
                      <p className="text-xs text-slate-400">vs</p>
                      <p className="text-sm font-bold text-slate-800">
                        {match.team2Player1}/{match.team2Player2}
                      </p>
                    </div>
                  </div>
                  {match.status === "completed" && (
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600">
                        {match.scoreTeam1 || 0} - {match.scoreTeam2 || 0}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
