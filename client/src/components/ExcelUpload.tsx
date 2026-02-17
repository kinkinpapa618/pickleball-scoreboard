import { useState } from "react";
import ExcelJS from "exceljs";
import { FileSpreadsheet, AlertCircle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PlayerData {
  player1?: string;
  player2?: string;
  player3?: string;
  player4?: string;
  level?: string;
  category?: string;
  pairIndex?: number;
}

interface ExcelUploadProps {
  onDataLoaded: (players: PlayerData[] | string[]) => void;
  mode?: "simple" | "tournament";
}

export function ExcelUpload({ onDataLoaded, mode = "simple" }: ExcelUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    levels: string[];
    categories: string[];
    totalPlayers: number;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("No data");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];

        const rows: any[] = [];
        worksheet.eachRow((row) => {
          // row.values is 1-indexed array
          const values = [];
          for (let i = 1; i <= row.cellCount; i++) {
            values.push(row.getCell(i).value);
          }
          rows.push(values);
        });

        if (rows.length < 2) throw new Error("File trống!");

        // Get headers (first row)
        const headers: string[] = rows[0].map((h: any) => String(h || "").toLowerCase().trim());
        
        // Find column indices - support 4 player columns for doubles
        const p1Idx = headers.findIndex(h => h.includes("vdv 1") || h.includes("tên vđv 1") || h.includes("player1"));
        const p2Idx = headers.findIndex(h => h.includes("vdv 2") || h.includes("tên vđv 2") || h.includes("player2"));
        const p3Idx = headers.findIndex(h => h.includes("vdv 3") || h.includes("tên vđv 3") || h.includes("player3"));
        const p4Idx = headers.findIndex(h => h.includes("vdv 4") || h.includes("tên vđv 4") || h.includes("player4"));
        const levelIdx = headers.findIndex(h => h.includes("level"));
        const catIdx = headers.findIndex(h => h.includes("nội dung") || h.includes("category"));
        const sttIdx = headers.findIndex(h => h.includes("stt") || h.includes("cặp"));
        
        const players: PlayerData[] = [];
        const levels = new Set<string>();
        const categories = new Set<string>();

        // Parse data rows (skip header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const p1 = p1Idx >= 0 && row[p1Idx] ? String(row[p1Idx]).trim() : "";
          const p2 = p2Idx >= 0 && row[p2Idx] ? String(row[p2Idx]).trim() : "";
          const p3 = p3Idx >= 0 && row[p3Idx] ? String(row[p3Idx]).trim() : "";
          const p4 = p4Idx >= 0 && row[p4Idx] ? String(row[p4Idx]).trim() : "";
          
          // Skip empty rows
          if (!p1 && !p2 && !p3 && !p4) continue;

          const level = levelIdx >= 0 && row[levelIdx] ? String(row[levelIdx]).trim() : undefined;
          const category = catIdx >= 0 && row[catIdx] ? String(row[catIdx]).trim() : undefined;
          const pairIndex = sttIdx >= 0 && row[sttIdx] ? Number(row[sttIdx]) : undefined;

          if (level) levels.add(level);
          if (category) categories.add(category);

          players.push({
            player1: p1 || undefined,
            player2: p2 || undefined,
            player3: p3 || undefined,
            player4: p4 || undefined,
            level: level || undefined,
            category: category || undefined,
            pairIndex: pairIndex
          });
        }

        if (players.length === 0) throw new Error("Không tìm thấy dữ liệu VĐV!");

        // If simple mode, return just names (flatten)
        if (mode === "simple") {
          const allNames: string[] = [];
          players.forEach(p => {
            if (p.player1) allNames.push(p.player1);
            if (p.player2) allNames.push(p.player2);
            if (p.player3) allNames.push(p.player3);
            if (p.player4) allNames.push(p.player4);
          });
          onDataLoaded(allNames);
        } else {
          // If tournament mode and has level/category, show preview
          if (levels.size > 0 || categories.size > 0) {
            setPreview({
              levels: Array.from(levels),
              categories: Array.from(categories),
              totalPlayers: players.length
            });
          }
          onDataLoaded(players);
        }
      } catch (err: any) {
        setError(err.message || "Không thể đọc file. Vui lòng thử lại.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("DanhSach");

    if (mode === "tournament") {
      // Template for doubles - 4 players per match (2 vs 2)
      worksheet.addRow(["STT", "Level", "Nội dung", "Tên VĐV 1", "Tên VĐV 2", "Tên VĐV 3", "Tên VĐV 4"]);
      worksheet.addRow([1, "4.2", "Đôi Nam-Nữ", "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"]);
      worksheet.addRow([2, "4.2", "Đôi Nữ", "Hoàng Văn E", "Đặng Văn F", "Ngô Văn G", "Vũ Văn H"]);
      worksheet.addRow([3, "4.4", "Đôi Nam", "Phạm Văn I", "Trần Văn J", "Lê Văn K", "Nguyễn Văn L"]);
    } else {
      worksheet.addRow(["Họ và Tên"]);
      worksheet.addRow(["Nguyễn Văn A"]);
      worksheet.addRow(["Trần Thị B"]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "tournament" ? "Mau_Giai_Dau_Pickleball.xlsx" : "Mau_Danh_Sach_VDV.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative group border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 rounded-2xl p-6 transition-all bg-slate-900/20 text-center">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          data-testid="input-excel-upload"
        />

        <div className="space-y-3">
          <div className="w-12 h-12 bg-[#ccff00]/10 rounded-full flex items-center justify-center mx-auto">
            <FileSpreadsheet className="text-[#ccff00] w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {fileName ? fileName : "Tải lên danh sách VĐV"}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase font-black">
              Nhấp để chọn file Excel
            </p>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-500 text-[10px] font-bold bg-rose-500/10 py-2 rounded-lg italic">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview Info */}
      {preview && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[#ccff00]" />
            <span className="text-sm font-bold text-white">Thông tin file:</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {preview.levels.map(level => (
              <Badge key={level} variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Level {level}
              </Badge>
            ))}
            {preview.categories.map(cat => (
              <Badge key={cat} variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {cat}
              </Badge>
            ))}
          </div>
          
          <p className="text-xs text-slate-400">
            Tổng: <span className="text-white font-bold">{preview.totalPlayers}</span> VĐV
          </p>
        </div>
      )}

      <Button
        variant="ghost"
        className="text-[10px] text-slate-500 uppercase font-black p-0 h-auto hover:bg-transparent hover:text-[#ccff00] underline underline-offset-4"
        onClick={handleDownloadTemplate}
        data-testid="button-download-template"
      >
        {mode === "tournament" ? "Tải file mẫu giải đấu" : "Tải file Excel mẫu"}
      </Button>
    </div>
  );
}
