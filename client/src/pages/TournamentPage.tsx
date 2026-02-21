import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Play,
  Target,
  ChevronRight,
  Upload,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  MapPin,
  GitBranch,
  List,
  X,
  FileSpreadsheet,
  Users,
  Edit,
  ArrowLeft,
  FolderOpen,
  Settings,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CreateTournament from "@/components/CreateTournament";
import {
  useTournaments,
  useTournament,
  useCreateTournament,
  useGenerateTournament,
  useReferees,
  useAssignReferee,
  useStartTournamentMatch,
  useDeleteTournament,
  useUpdateTournament,
} from "@/hooks/use-api";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

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
  backdrop?: string;
}

interface PlayerEntry {
  stt: number;
  player1: string;
  player2: string;
  level: string;
  seed?: number;
}

interface ContentInfo {
  id: string;
  name: string;
  players: PlayerEntry[];
}

interface LevelContent {
  level: string;
  contents: ContentInfo[];
}

const CONTENT_LABELS: Record<string, string> = {
  doi_nam: "Đôi Nam",
  doi_nu: "Đôi Nữ",
  doi_nam_nu: "Đôi Nam-Nữ",
  doi_hon: "Đôi Hỗn Hợp",
};

export default function TournamentPage() {
  const { user: authUser } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState("list");
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [editingTournamentId, setEditingTournamentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    level: "",
    content: "",
    backdrop: undefined as string | undefined,
  });

  const { data: tournaments, refetch: refetchTournaments } = useTournaments();
  const { data: tournament, refetch: refetchTournament } = useTournament(selectedTournamentId || 0);
  const createTournament = useCreateTournament();
  const generateTournament = useGenerateTournament();
  const referees = useReferees();
  const assignReferee = useAssignReferee();
  const startMatch = useStartTournamentMatch();
  const deleteTournament = useDeleteTournament();
  const updateTournament = useUpdateTournament();

  const [playersByLevel, setPlayersByLevel] = useState<Record<string, PlayerEntry[]>>({});
  const [teamsPerGroup, setTeamsPerGroup] = useState(2);
  const [groupingMethod, setGroupingMethod] = useState<"round_robin" | "group_knockout" | "knockout">("group_knockout");
  const [assigningMatchId, setAssigningMatchId] = useState<number | null>(null);
  const [pendingContents, setPendingContents] = useState<{ level: string; content: string; name: string }[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [pendingTournamentId, setPendingTournamentId] = useState<number | null>(null);

  // Round Robin Algorithm
  const generateRoundRobin = (teams: any[]) => {
    let teamsList = [...teams];
    if (teamsList.length % 2 !== 0) {
      teamsList.push({ player1: "Bye", player2: "", id: null, level: "" });
    }
    
    const numTeams = teamsList.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;
    const matches: any[] = [];
    let round = 1;

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < half; i++) {
        const team1 = teamsList[i];
        const team2 = teamsList[numTeams - 1 - i];
        
        if (team1 && team2 && team1.id && team2.id) {
          matches.push({
            round,
            team1Player1: team1.player1,
            team1Player2: team1.player2,
            team2Player1: team2.player1,
            team2Player2: team2.player2,
            level: team1.level || "",
            groupName: "A",
          });
        }
      }
      // Rotate teams (keep first team fixed)
      const last = teamsList.pop();
      if (last) {
        teamsList.splice(1, 0, last);
      }
      round++;
    }
    return matches;
  };

  // Knockout Algorithm
  const generateKnockout = (teams: any[]) => {
    let teamsList = [...teams];
    const powersOfTwo = [2, 4, 8, 16, 32, 64];
    let nextPower = powersOfTwo.find(p => p >= teamsList.length) || 16;
    
    // Add BYE slots
    const byes = nextPower - teamsList.length;
    for (let i = 0; i < byes; i++) {
      teamsList.push({ player1: "Bye", player2: "", id: null, level: "" });
    }
    
    // Shuffle for random seeding or use original order
    const matches: any[] = [];
    const numTeams = teamsList.length;
    
    for (let i = 0; i < numTeams / 2; i++) {
      const team1 = teamsList[i];
      const team2 = teamsList[numTeams - 1 - i];
      
      if (team1 && team2) {
        matches.push({
          round: 1,
          team1Player1: team1.player1,
          team1Player2: team1.player2,
          team2Player1: team2.player1,
          team2Player2: team2.player2,
          level: team1.level || "",
          groupName: "",
        });
      }
    }
    return matches;
  };

  // Group + Knockout Algorithm
  const generateGroupKnockout = (teams: any[], teamsPerGroup: number) => {
    const matches: any[] = [];
    let round = 1;
    let groupIndex = 0;
    const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    // Shuffle teams
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    
    // Split into groups
    const groups: any[][] = [];
    for (let i = 0; i < shuffled.length; i += teamsPerGroup) {
      groups.push(shuffled.slice(i, i + teamsPerGroup));
    }
    
    // Generate round robin for each group
    groups.forEach((group, gIdx) => {
      const groupName = groupNames[gIdx] || `G${gIdx + 1}`;
      
      if (group.length < 2) return;
      
      let groupTeams = [...group];
      if (groupTeams.length % 2 !== 0) {
        groupTeams.push({ player1: "Bye", player2: "", id: null, level: "" });
      }
      
      const numTeams = groupTeams.length;
      const rounds = numTeams - 1;
      const half = numTeams / 2;
      
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < half; i++) {
          const team1 = groupTeams[i];
          const team2 = groupTeams[numTeams - 1 - i];
          
          if (team1 && team2 && team1.id && team2.id) {
            matches.push({
              round,
              team1Player1: team1.player1,
              team1Player2: team1.player2,
              team2Player1: team2.player1,
              team2Player2: team2.player2,
              level: team1.level || "",
              groupName,
              isGroupStage: true,
            });
          }
        }
        const last = groupTeams.pop();
        if (last) {
          groupTeams.splice(1, 0, last);
        }
        round++;
      }
    });
    
    return matches;
  };
  const [pendingData, setPendingData] = useState<any>(null);

  const groupPlayersByLevel = (players: PlayerEntry[]): Record<string, PlayerEntry[]> => {
    const grouped: Record<string, PlayerEntry[]> = {};
    players.forEach((player) => {
      const level = player.level || "Khác";
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(player);
    });
    return grouped;
  };

  const handleCreateTournament = async (data: any) => {
    if (!data.name || !data.date) {
      alert("Vui lòng nhập tên và ngày giải!");
      return;
    }

    if (!data.players || data.players.length < 2) {
      alert("Cần ít nhất 2 cặp VĐV để tạo giải!");
      return;
    }

    setPendingData(data);
    setStep("grouping");
  };

  const handleSaveDraft = async (data: any) => {
    try {
      const tournamentData = {
        name: data.name || "",
        date: data.date || "",
        time: data.time || "",
        location: data.location || "",
        level: data.level || "",
        content: data.content || "",
        status: "draft" as const,
        backdrop: data.backdrop || null,
      };
      
      let tournamentId = editingTournamentId;
      
      if (editingTournamentId) {
        // Update existing tournament
        await updateTournament.mutateAsync({
          id: editingTournamentId,
          data: tournamentData,
        });
      } else {
        // Create new tournament
        const result = await createTournament.mutateAsync(tournamentData);
        tournamentId = result.id;
      }
      
      // Group players by level and save
      if (data.players && data.players.length > 0) {
        const playersByLevelData: Record<string, typeof data.players> = {};
        
        data.players.forEach((player: any) => {
          const level = player.level || "default";
          if (!playersByLevelData[level]) {
            playersByLevelData[level] = [];
          }
          playersByLevelData[level].push(player);
        });
        
        const contents = Object.entries(playersByLevelData).map(([level, players]) => ({
          level,
          name: data.name || "Giải đấu",
          content: data.content || "doi_nam_nu",
          players: players,
        }));
        
        await fetch(`/api/tournament/${tournamentId}/contents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });
        
        // Set playersByLevel for step 3
        setPlayersByLevel(playersByLevelData);
      }
      
      setPendingTournamentId(tournamentId);
      setPendingData(data);
      
      // Only go to grouping if there are players (coming from Step 2)
      if (data.players && data.players.length > 0) {
        setStep("grouping");
      }
      alert("Đã lưu bản nháp!");
    } catch (err) {
      console.error("Lỗi lưu bản nháp:", err);
      alert("Không thể lưu bản nháp!");
    }
  };

  const handlePlayerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingTournamentId) return;

    try {
      const ExcelJS = (await import("exceljs")).default;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          if (!data) return;

          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data as ArrayBuffer);
          const worksheet = workbook.worksheets[0];

          const rows: any[] = [];
          worksheet.eachRow((row) => {
            const values = [];
            for (let i = 1; i <= row.cellCount; i++) {
              values.push(row.getCell(i).value);
            }
            rows.push(values);
          });

          if (rows.length < 2) return;

          const headers: string[] = rows[0].map((h: any) => String(h || "").toLowerCase().trim());
          const sttIdx = headers.findIndex(h => h.includes("stt"));
          const p1Idx = headers.findIndex(h => h.includes("player 1") || h.includes("tên player 1") || h.includes("vđv 1"));
          const p2Idx = headers.findIndex(h => h.includes("player 2") || h.includes("tên player 2") || h.includes("vđv 2"));
          const levelIdx = headers.findIndex(h => h.includes("level") || h.includes("cấp"));
          const seedIdx = headers.findIndex(h => h.includes("hạt giống") || h.includes("seed"));

          const players: any[] = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const p1 = p1Idx >= 0 && row[p1Idx] ? String(row[p1Idx]).trim() : "";
            const p2 = p2Idx >= 0 && row[p2Idx] ? String(row[p2Idx]).trim() : "";
            
            if (!p1 && !p2) continue;

            const stt = sttIdx >= 0 && row[sttIdx] ? Number(row[sttIdx]) : i;
            const level = levelIdx >= 0 && row[levelIdx] ? String(row[levelIdx]).trim() : "";
            const seed = seedIdx >= 0 && row[seedIdx] ? (row[seedIdx] === 1 || row[seedIdx] === "1" ? 1 : undefined) : undefined;

            players.push({
              player1: p1,
              player2: p2,
              level: level,
              category: pendingContents[currentContentIndex].content,
              level1: "",
              level2: "",
            });
          }

          if (players.length < 2) {
            alert("Cần ít nhất 2 cặp đấu!");
            return;
          }

          await generateTournament.mutateAsync({
            tournamentId: pendingTournamentId!,
            players,
            teamsPerGroup: teamsPerGroup || 2,
            groupingMethod,
          });

          if (currentContentIndex < pendingContents.length - 1) {
            setCurrentContentIndex(currentContentIndex + 1);
          } else {
            refetchTournaments();
            setPendingTournamentId(null);
            setPendingContents([]);
            setCurrentContentIndex(0);
            setStep("list");
            alert("Tạo giải đấu thành công!");
          }
        } catch (err) {
          console.error("Error parsing Excel:", err);
          alert("Không thể đọc file Excel");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error importing exceljs:", err);
    }
  };

  const handleGenerateMatches = async () => {
    if (!selectedTournamentId) return;

    const allPlayers: any[] = [];
    Object.entries(playersByLevel).forEach(([level, players]) => {
      players.forEach(p => {
        allPlayers.push({
          player1: p.player1,
          player2: p.player2,
          level: p.level,
          category: "",
          level1: "",
          level2: "",
        });
      });
    });

    if (allPlayers.length < 2) {
      alert("Cần ít nhất 2 cặp đấu!");
      return;
    }

    try {
      await generateTournament.mutateAsync({
        tournamentId: selectedTournamentId!,
        players: allPlayers,
        teamsPerGroup: teamsPerGroup || 2,
        groupingMethod,
      });
      refetchTournament();
      setStep("detail");
    } catch (error) {
      console.error("Error generating matches:", error);
      alert("Không thể tạo lịch đấu!");
    }
  };

  const handleAssignReferee = async (matchId: number, refereeId: number) => {
    if (!selectedTournamentId) return;
    try {
      await assignReferee.mutateAsync({ tournamentId: selectedTournamentId, matchId, refereeId });
      refetchTournament();
    } catch (error) {
      console.error("Error assigning referee:", error);
    }
  };

  const handleStartMatch = async (matchId: number) => {
    if (!selectedTournamentId) return;
    try {
      const createdMatch = await startMatch.mutateAsync({ tournamentId: selectedTournamentId, matchId });
      refetchTournament();
      if (createdMatch && createdMatch.id) {
        setLocation(`/match/${createdMatch.id}`);
      }
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const handleEditTournament = (tournament: any) => {
    setEditingTournamentId(tournament.id);
    let content = "";
    try {
      const parsed = tournament.content ? (Array.isArray(tournament.content) ? tournament.content[0] : JSON.parse(tournament.content)) : "";
      content = typeof parsed === "string" ? parsed : "";
    } catch (e) {
      content = "";
    }
    setFormData({
      name: tournament.name || "",
      date: tournament.date ? new Date(tournament.date).toISOString().split('T')[0] : "",
      time: tournament.time || "",
      location: tournament.location || "",
      level: tournament.level || "",
      content: content,
      backdrop: tournament.backdrop || undefined,
    });
    
    // Try to load players from tournament contents if available
    if (tournament.contents && tournament.contents.length > 0) {
      const loadedPlayers: Record<string, any[]> = {};
      tournament.contents.forEach((cont: any) => {
        const level = cont.level || "default";
        loadedPlayers[level] = cont.players || [];
      });
      setPlayersByLevel(loadedPlayers);
      setPendingTournamentId(tournament.id);
    }
    
    setStep("create");
  };

  const handleUpdateTournament = async (data: any) => {
    if (!editingTournamentId) return;

    try {
      await updateTournament.mutateAsync({
        id: editingTournamentId,
        data: {
          name: data.name,
          description: null,
          date: data.date,
          time: data.time || null,
          location: data.location,
          level: data.level,
          content: JSON.stringify([data.content]),
          status: "draft",
          backdrop: data.backdrop,
        },
      });
      
      refetchTournament();
      setEditingTournamentId(null);
      setStep("list");
      alert("Cập nhật giải đấu thành công!");
    } catch (error) {
      console.error("Error updating tournament:", error);
      alert("Không thể cập nhật giải đấu!");
    }
  };

  if (step === "list" && !tournaments) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans text-slate-900 overflow-x-hidden max-w-full">
      <div className="flex justify-between items-center py-4 gap-2">
        <div className="min-w-0">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic tracking-tighter text-blue-600 truncate"
          >
            TRONGTAISO.COM
          </motion.h3>
          <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase font-bold">
            Tournament Management
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {step === "create" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("list");
              setEditingTournamentId(null);
            }}
            className="mb-4 flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <CreateTournament
            onSubmit={handleCreateTournament}
            onSaveDraft={handleSaveDraft}
            initialData={editingTournamentId ? formData as any : undefined}
          />
        </motion.div>
      )}

      {step === "grouping" && pendingData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("create");
              setPendingData(null);
            }}
            className="mb-4 flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                <Settings className="w-4 h-4 text-blue-500" />
                Phương thức chia bảng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    Tổng số cặp: {Object.values(playersByLevel).flat().length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {Object.values(playersByLevel).flat().length >= 4 && Object.values(playersByLevel).flat().length <= 6 && "→ Gợi ý: Round Robin (đánh vòng tròn)"}
                    {Object.values(playersByLevel).flat().length >= 8 && Object.values(playersByLevel).flat().length <= 16 && "→ Gợi ý: Chia bảng → Loại trực tiếp"}
                    {Object.values(playersByLevel).flat().length > 16 && "→ Gợi ý: Chia bảng → Loại trực tiếp (giảm thời gian)"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {groupingMethod !== "knockout" && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-xs font-bold uppercase">
                        Số đội mỗi bảng <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={2}
                        max={8}
                        value={teamsPerGroup || ""}
                        onChange={(e) => setTeamsPerGroup(parseInt(e.target.value) || 2)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500"
                        placeholder="VD: 2"
                      />
                      <p className="text-xs text-slate-500">
                        Số đội trong mỗi bảng (2-8 đội)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Option 1: Round Robin */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      groupingMethod === "round_robin"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                    onClick={() => setGroupingMethod("round_robin")}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${
                        groupingMethod === "round_robin" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                      }`}>
                        {groupingMethod === "round_robin" && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">1. Chia bảng vòng tròn (Round Robin)</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Mỗi đội/VĐV trong bảng sẽ đấu với tất cả các đội còn lại. Xếp hạng dựa trên: số trận thắng → hiệu số → điểm.
                        </p>
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-700">✓ Ưu điểm: Công bằng, ai cũng được thi đấu nhiều. Phù hợp giải phong trào, giao lưu.</p>
                          <p className="text-xs font-medium text-red-600 mt-1">✗ Nhược điểm: Tốn thời gian nếu bảng đông.</p>
                          <p className="text-xs font-medium text-slate-600 mt-1">📌 Thường dùng khi: 3–6 đội/bảng</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Group + Knockout */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      groupingMethod === "group_knockout"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                    onClick={() => setGroupingMethod("group_knockout")}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${
                        groupingMethod === "group_knockout" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                      }`}>
                        {groupingMethod === "group_knockout" && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">2. Chia bảng + vòng loại trực tiếp (Group → Knockout)</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Mô hình chuẩn của nhiều giải lớn. Chia bảng đấu vòng tròn, lấy Top 1 / Top 2 mỗi bảng vào vòng loại trực tiếp.
                        </p>
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-700">✓ Ưu điểm: Kết hợp được tính công bằng & kịch tính. Giảm số trận ở giai đoạn cuối.</p>
                          <p className="text-xs font-medium text-slate-600 mt-1">📌 Thường dùng khi: 8–16–32 đội. Giải có cúp, trao giải rõ ràng.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Knockout */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      groupingMethod === "knockout"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                    onClick={() => setGroupingMethod("knockout")}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${
                        groupingMethod === "knockout" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                      }`}>
                        {groupingMethod === "knockout" && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">3. Loại trực tiếp (Knockout / Single Elimination)</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Nhanh – gọn – kịch tính. Thua 1 trận là bị loại. Không chia bảng hoặc chia để xếp cặp.
                        </p>
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-700">✓ Ưu điểm: Tiết kiệm thời gian. Dễ tổ chức.</p>
                          <p className="text-xs font-medium text-red-600 mt-1">✗ Nhược điểm: Ít trận, kém công bằng nếu bốc thăm lệch.</p>
                          <p className="text-xs font-medium text-slate-600 mt-1">📌 Thường dùng khi: Giải biểu diễn, ít thời gian.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {groupingMethod === "round_robin" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">
                      💡 Gợi ý: 3 - 6 đội (Đánh vòng tròn tốn khá nhiều thời gian)
                    </p>
                  </div>
                )}

                {groupingMethod === "group_knockout" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">
                      💡 Gợi ý: 8, 12, 16... (Số chia hết cho 4 để chia đều vào các bảng)
                    </p>
                  </div>
                )}

                {groupingMethod === "knockout" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">
                      💡 Gợi ý: 4, 8, 16, 32... (Lũy thừa của 2 để sơ đồ đẹp nhất)
                    </p>
                  </div>
                )}

              </div>

              <Button
                onClick={async () => {
                  try {
                    // Generate matches based on grouping method and players
                    const allPlayers = Object.values(playersByLevel).flat();
                    
                    if (allPlayers.length < 2) {
                      alert("Cần ít nhất 2 cặp đấu!");
                      return;
                    }

                    // Generate matches based on grouping method
                    let matches: any[] = [];
                    
                    if (groupingMethod === "round_robin") {
                      // Round Robin algorithm
                      matches = generateRoundRobin(allPlayers);
                    } else if (groupingMethod === "knockout") {
                      // Knockout algorithm
                      matches = generateKnockout(allPlayers);
                    } else {
                      // Group + Knockout
                      matches = generateGroupKnockout(allPlayers, teamsPerGroup);
                    }

                    // Create tournament and save matches
                    const result = await createTournament.mutateAsync({
                      name: pendingData.name,
                      description: null,
                      date: pendingData.date,
                      time: pendingData.time || null,
                      location: pendingData.location,
                      level: pendingData.level,
                      content: JSON.stringify([pendingData.content]),
                      teamsPerGroup: teamsPerGroup,
                      status: "draft",
                      backdrop: pendingData.backdrop,
                    });

                    // Save players and matches
                    if (matches.length > 0) {
                      await fetch(`/api/tournament/${result.id}/matches`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ matches }),
                      });
                    }

                    setPendingTournamentId(result.id);
                    setSelectedTournamentId(result.id);
                    setStep("detail");
                    alert("Tạo giải thành công!");
                  } catch (error) {
                    console.error("Error creating tournament:", error);
                    alert("Không thể tạo giải đấu!");
                  }
                }}
                className="w-full py-6 rounded-2xl font-black italic text-sm uppercase tracking-wider bg-blue-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Tạo giải & Chia bảng
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "upload_players" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("list");
              setPendingTournamentId(null);
              setPendingContents([]);
              setCurrentContentIndex(0);
            }}
            className="mb-4 flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Hủy
          </Button>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                Tải danh sách VĐV - {pendingContents[currentContentIndex]?.level} - {CONTENT_LABELS[pendingContents[currentContentIndex]?.content || ""]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Vui lòng tải danh sách cặp player cho nội dung này. Mỗi nội dung tải 1 file Excel.
              </p>
              <p className="text-xs text-slate-500">
                Tiến trình: {currentContentIndex + 1} / {pendingContents.length}
              </p>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handlePlayerFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors">
                  <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-medium">
                    Tải file Excel danh sách cặp
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cột: STT | Tên Player 1 | Tên Player 2 | Level | Hạt giống
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "list" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 min-w-0 truncate">
              {authUser?.role === "referee" ? "Giải đấu" : "Giải đấu của bạn"}
            </h2>
            {authUser?.role !== "referee" && (
              <Button onClick={() => setStep("create")} className="bg-blue-500 text-white font-bold rounded-2xl shrink-0">
                <Trophy className="w-4 h-4 mr-2" /> Tạo giải
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {tournaments?.map((t: any) => (
              <Card key={t.id} className="bg-white border border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div 
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        setSelectedTournamentId(t.id);
                        setStep("detail");
                      }}
                    >
                      <h3 className="font-black text-slate-800 truncate">{t.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" /> <span className="truncate">{t.date}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{t.location}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className={t.status === "active" ? "bg-green-500" : t.status === "completed" ? "bg-slate-400" : "bg-amber-500"}>
                          {t.status === "active" ? "Đang đấu" : t.status === "completed" ? "Đã xong" : "Nháp"}
                        </Badge>
                        {t.level && (
                          <Badge variant="outline" className="text-xs">
                            Level {t.level}
                          </Badge>
                        )}
                        {(() => {
                          let content = "";
                          try {
                            const parsed = t.content ? (Array.isArray(t.content) ? t.content[0] : JSON.parse(String(t.content))) : "";
                            content = typeof parsed === "string" ? parsed : "";
                          } catch (e) {
                            content = "";
                          }
                          if (content) {
                            return (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-600">
                                {CONTENT_LABELS[content] || content}
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    {authUser?.role !== "referee" && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-400 hover:text-blue-600"
                          onClick={() => handleEditTournament(t)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm("Xóa giải đấu này?")) {
                              deleteTournament.mutate(t.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!tournaments || tournaments.length === 0) && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400">
                  {authUser?.role === "referee" ? "Chưa có giải đấu nào từ Manager của bạn" : "Chưa có giải đấu nào"}
                </p>
                {authUser?.role !== "referee" && (
                  <Button onClick={() => setStep("create")} className="mt-4 bg-blue-500 text-white font-bold rounded-2xl">
                    Tạo giải đấu đầu tiên
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {step === "detail" && tournament && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTournamentId(null);
              setStep("list");
            }}
            className="mb-4 flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>

          <Card className="bg-white border border-slate-200 shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black text-slate-800 truncate">{tournament.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" /> <span className="truncate">{tournament.date}</span>
                    </span>
                    {tournament.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" /> {tournament.time}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{tournament.location}</span>
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className={tournament.status === "active" ? "bg-green-500" : tournament.status === "completed" ? "bg-slate-400" : "bg-amber-500"}>
                      {tournament.status === "active" ? "Đang đấu" : tournament.status === "completed" ? "Đã xong" : "Nháp"}
                    </Badge>
                    {tournament.level && (
                      <Badge variant="outline" className="text-xs">
                        Level {tournament.level}
                      </Badge>
                    )}
                    {(() => {
                      let content = "";
                      try {
                        const parsed = tournament.content ? (Array.isArray(tournament.content) ? tournament.content[0] : JSON.parse(String(tournament.content))) : "";
                        content = typeof parsed === "string" ? parsed : "";
                      } catch (e) {
                        content = "";
                      }
                      if (content) {
                        return (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-600">
                            {CONTENT_LABELS[content] || content}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                {tournament.backdrop && (
                  <img
                    src={tournament.backdrop.startsWith('/') ? tournament.backdrop : `/backdrop-uploads/${tournament.backdrop}`}
                    alt="Backdrop"
                    className="w-24 h-16 object-cover rounded-lg shrink-0"
                  />
                )}
              </div>

              {tournament.status === "draft" && authUser?.role !== "referee" && (
                <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        groupingMethod === "round_robin"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                      onClick={() => setGroupingMethod("round_robin")}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          groupingMethod === "round_robin" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                        }`} />
                        <span className="text-sm font-medium text-slate-700">Round Robin (Vòng tròn)</span>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        groupingMethod === "group_knockout"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                      onClick={() => setGroupingMethod("group_knockout")}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          groupingMethod === "group_knockout" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                        }`} />
                        <span className="text-sm font-medium text-slate-700">Chia bảng + Loại trực tiếp</span>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        groupingMethod === "knockout"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                      onClick={() => setGroupingMethod("knockout")}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          groupingMethod === "knockout" ? "bg-blue-500 border-blue-500" : "border-slate-300"
                        }`} />
                        <span className="text-sm font-medium text-slate-700">Loại trực tiếp (Knockout)</span>
                      </div>
                    </div>
                  </div>

                  {groupingMethod !== "knockout" && (
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-500">Số đội/bảng</Label>
                        <Input
                          type="number"
                          min={2}
                          max={8}
                          value={teamsPerGroup || ""}
                          onChange={(e) => setTeamsPerGroup(parseInt(e.target.value) || 2)}
                          className="mt-1"
                          placeholder="2"
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateMatches}
                    disabled={generateTournament.isPending}
                    className="bg-blue-500 text-white font-bold rounded-2xl mt-5"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {generateTournament.isPending ? "Đang tạo..." : "Tạo lịch đấu"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {(tournament as any).matches?.length > 0 && (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Lịch đấu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(tournament as any).matches
                  ?.sort((a: any, b: any) => {
                    if (a.round !== b.round) return (a.round || 0) - (b.round || 0);
                    return (a.matchOrder || 0) - (b.matchOrder || 0);
                  })
                  .map((match: MatchFromDB) => (
                    <div
                      key={match.id}
                      className={`p-3 rounded-lg border ${
                        match.status === "live"
                          ? "bg-green-50 border-green-200"
                          : match.status === "completed"
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-500">
                          Vòng {match.round || 1} - Trận {match.matchOrder || 1}
                        </span>
                        <Badge
                          className={
                            match.status === "live"
                              ? "bg-green-500"
                              : match.status === "completed"
                              ? "bg-slate-400"
                              : "bg-amber-500"
                          }
                        >
                          {match.status === "live"
                            ? "Đang đấu"
                            : match.status === "completed"
                            ? "Đã xong"
                            : "Chờ"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-1">
                        <span className="font-medium min-w-0 truncate flex-1 text-left">
                          {match.team1Player1}
                          {match.team1Player2 && ` / ${match.team1Player2}`}
                        </span>
                        <span className="text-slate-400 shrink-0">vs</span>
                        <span className="font-medium min-w-0 truncate flex-1 text-right">
                          {match.team2Player1}
                          {match.team2Player2 && ` / ${match.team2Player2}`}
                        </span>
                      </div>
                      {match.status === "pending" && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                          {authUser?.role === "referee" ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartMatch(match.id)}
                              className="bg-green-500 text-white text-xs w-full"
                              data-testid={`btn-start-match-${match.id}`}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Vào trận
                            </Button>
                          ) : (
                            <>
                              <select
                                className="text-xs border rounded px-2 py-1 min-w-0 flex-1"
                                onChange={(e) =>
                                  e.target.value &&
                                  handleAssignReferee(match.id, parseInt(e.target.value))
                                }
                                defaultValue=""
                              >
                                <option value="">Chọn trọng tài (tuỳ chọn)</option>
                                {referees.data?.map((r: any) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                onClick={() => handleStartMatch(match.id)}
                                className="bg-green-500 text-white text-xs shrink-0"
                                data-testid={`btn-start-match-${match.id}`}
                              >
                                Bắt đầu
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      {match.status === "live" && match.matchId && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                          <Button
                            size="sm"
                            onClick={() => setLocation(`/match/${match.matchId}`)}
                            className="bg-blue-500 text-white text-xs w-full"
                            data-testid={`btn-enter-match-${match.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Vào xem trận
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
