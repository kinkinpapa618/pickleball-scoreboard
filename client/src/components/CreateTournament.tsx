import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy, ChevronRight, Save, Upload, FileSpreadsheet, Users, Plus, X, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";

interface PlayerEntry {
  id: number;
  player1: string;
  player2: string;
  level: string;
  seed?: number;
}

interface TournamentFormData {
  name: string;
  date: string;
  time: string;
  location: string;
  level: string;
  content: string;
  backdrop?: string;
  players?: PlayerEntry[];
  groupingMethod?: GroupingMethod;
}

interface CreateTournamentProps {
  onSubmit: (data: TournamentFormData) => void;
  onSaveDraft?: (data: TournamentFormData) => void;
  initialData?: TournamentFormData;
}

type GroupingMethod = "round_robin" | "group_knockout" | "knockout";

const CONTENT_OPTIONS = [
  { id: "doi_nam", label: "Đôi Nam" },
  { id: "doi_nu", label: "Đôi Nữ" },
  { id: "doi_nam_nu", label: "Đôi Nam-Nữ" },
  { id: "doi_hon", label: "Đôi Hỗn Hợp" },
];

function resizeImage(file: File, maxSizeKB: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window.Image || (globalThis as any).Image)();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        const fileSizeKB = file.size / 1024;
        if (fileSizeKB <= maxSizeKB) {
          resolve(e.target?.result as string);
          return;
        }

        const scale = Math.sqrt(maxSizeKB / fileSizeKB);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateTournament({ onSubmit, onSaveDraft, initialData }: CreateTournamentProps) {
  const [step, setStep] = useState(1);
  const [groupingMethod, setGroupingMethod] = useState<GroupingMethod>("group_knockout");
  const [formData, setFormData] = useState<TournamentFormData>({
    name: initialData?.name || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    level: initialData?.level || "",
    content: initialData?.content || "",
    backdrop: initialData?.backdrop || "",
  });

  const [players, setPlayers] = useState<PlayerEntry[]>(initialData?.players || []);
  const [newPlayer1, setNewPlayer1] = useState("");
  const [newPlayer2, setNewPlayer2] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);

  const parsePastedData = (text: string) => {
    const lines = text.trim().split("\n");
    const newPlayers: PlayerEntry[] = [];
    let id = players.length + 1;

    lines.forEach((line) => {
      if (!line.trim()) return;
      
      const parts = line.split(/[\t,;]/).map((p) => p.trim());
      const player1 = parts[0] || "";
      const player2 = parts[1] || "";
      const level = parts[2] || "";

      if (player1 || player2) {
        newPlayers.push({
          id: id++,
          player1,
          player2,
          level,
        });
      }
    });

    if (newPlayers.length > 0) {
      setPlayers([...players, ...newPlayers]);
      setNewPlayer1("");
      setPasteMode(true);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof TournamentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await resizeImage(file);
      setFormData((prev) => ({ ...prev, backdrop: base64 }));
    } catch (err) {
      console.error("Lỗi xử lý ảnh:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      
      if (!worksheet) {
        setError("Không tìm thấy sheet trong file Excel");
        return;
      }

      const newPlayers: PlayerEntry[] = [];
      let id = 1;

      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        
        const cellValues = row.values as any[];
        const player1 = cellValues[1]?.toString().trim() || "";
        const player2 = cellValues[2]?.toString().trim() || "";
        const level = cellValues[3]?.toString().trim() || "";

        if (player1 || player2) {
          newPlayers.push({
            id: id++,
            player1,
            player2,
            level,
          });
        }
      });

      if (newPlayers.length === 0) {
        setError("Không tìm thấy dữ liệu trong file Excel");
        return;
      }

      setPlayers(newPlayers);
    } catch (err) {
      setError("Lỗi khi đọc file Excel: " + (err as Error).message);
    }
  };

  const handleAddPlayer = () => {
    if (!newPlayer1.trim()) return;
    
    setPlayers([
      ...players,
      {
        id: players.length + 1,
        player1: newPlayer1.trim(),
        player2: newPlayer2.trim(),
        level: newLevel,
      },
    ]);
    setNewPlayer1("");
    setNewPlayer2("");
    setNewLevel("");
  };

  const handleRemovePlayer = (id: number) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleNextStep = () => {
    if (!formData.name || !formData.date || !formData.location || !formData.content) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (onSaveDraft) {
      onSaveDraft({ ...formData, players: [] });
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (players.length < 2) {
      setError("Cần ít nhất 2 cặp để tạo giải");
      return;
    }
    if (onSaveDraft) {
      onSaveDraft({ ...formData, players });
    }
    setStep(3);
  };

  const handleSubmit = () => {
    if (players.length < 2) {
      setError("Cần ít nhất 2 cặp để tạo giải");
      return;
    }

    onSubmit({
      ...formData,
      players,
      groupingMethod,
    });
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="bg-card border border-border shadow-sm transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />
                Thông tin giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Tên giải <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="VD: Giải Pickleball ABC"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-muted border border-border text-foreground focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Nội dung thi đấu <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.content}
                    onValueChange={(value) => handleInputChange("content", value)}
                  >
                    <SelectTrigger className="bg-muted border border-border">
                      <SelectValue placeholder="Chọn nội dung" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Ngày <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="pl-10 bg-muted border border-border text-foreground focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Giờ
                  </Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="bg-muted border border-border text-foreground focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Địa điểm <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="VD: Sân Pickleball ABC - TP.Hà Nội"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="pl-10 bg-muted border border-border text-foreground focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-medium uppercase">
                    Level (Điểm trình)
                  </Label>
                  <Input
                    placeholder="Chỉ nhập 1 lv duy nhất (VD: A hoặc 1200)"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="bg-muted border border-border text-foreground focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-xs font-medium uppercase">
                  Ảnh bìa (không bắt buộc)
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Tải ảnh
                      </span>
                    </Button>
                  </label>
                  {formData.backdrop && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={formData.backdrop}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, backdrop: "" }))}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleNextStep}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
              >
                Tiếp theo <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="bg-card border border-border shadow-sm transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Danh sách Vận động viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="mb-2 text-sm"
              >
                ← Quay lại
              </Button>

              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {fileName ? fileName : "Tải file Excel"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cột 1: Player 1 | Cột 2: Player 2 | Cột 3: Level
                  </p>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-[10px] font-medium text-muted-foreground uppercase">
                  Hoặc dán dữ liệu từ Excel
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Dán dữ liệu (Copy từ Excel và dán vào đây)
                </Label>
                <textarea
                  placeholder={`Dán dữ liệu từ Excel theo định dạng:\nPlayer 1\tPlayer 2\tLevel\nNguyễn Văn A\tTrần Văn B\tA\nLê Văn C\tPhạm Văn D\tB`}
                  value={newPlayer1}
                  onChange={(e) => setNewPlayer1(e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    parsePastedData(text);
                  }}
                  className="w-full h-40 bg-muted border border-border rounded-lg p-3 text-sm text-foreground focus:border-blue-500 outline-none resize-none font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Mỗi dòng là một cặp, các cột cách nhau bằng Tab hoặc dấu phẩy
                </p>
              </div>

              {players.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">
                      Danh sách ({players.length} cặp)
                    </Label>
                    <Button
                      onClick={handleSubmit}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      Tạo giải <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {player.player1}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className="truncate text-foreground">
                            {player.player2}
                          </span>
                          {player.level && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">
                              {player.level}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-muted-foreground hover:text-red-500 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {players.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Chưa có cặp nào. Hãy tải file Excel hoặc dán dữ liệu từ Excel.
                </div>
              )}

              {players.length >= 2 && (
                <div className="space-y-2">
                  <Button
                    onClick={handleNextStep2}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    Tiếp theo <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="bg-card border border-border shadow-sm transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-500" />
                Phương thức chia bảng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="mb-2 text-sm"
              >
                ← Quay lại
              </Button>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  Tổng số cặp: {players.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {players.length >= 4 && players.length <= 6 && "→ Gợi ý: Round Robin (đánh vòng tròn)"}
                  {players.length >= 8 && players.length <= 16 && "→ Gợi ý: Chia bảng → Loại trực tiếp"}
                  {players.length > 16 && "→ Gợi ý: Chia bảng → Loại trực tiếp (giảm thời gian)"}
                  {(players.length === 2 || players.length === 4 || players.length === 8 || players.length === 16 || players.length === 32) && "→ Gợi ý: Số lũy thừa 2 rất phù hợp cho Loại trực tiếp!"}
                </p>
              </div>

              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    groupingMethod === "round_robin"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                  onClick={() => setGroupingMethod("round_robin")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
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
                        <p className="text-xs text-slate-600 mt-1">📌 Thường dùng khi: 3–6 đội/bảng</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    groupingMethod === "group_knockout"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                  onClick={() => setGroupingMethod("group_knockout")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
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
                        <p className="text-xs font-medium text-green-700">✓ Ưu điểm: Kết hợp tính công bằng & kịch tính. Giảm số trận ở giai đoạn cuối.</p>
                        <p className="text-xs text-slate-600 mt-1">📌 Thường dùng khi: 8–16–32 đội. Giải có cúp, trao giải rõ ràng.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    groupingMethod === "knockout"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                  onClick={() => setGroupingMethod("knockout")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
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
                        <p className="text-xs text-slate-600 mt-1">📌 Thường dùng khi: Giải biểu diễn, ít thời gian.</p>
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

              <Button
                onClick={handleSubmit}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
              >
                Tạo giải <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
