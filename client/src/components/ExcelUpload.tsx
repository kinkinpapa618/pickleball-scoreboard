import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, AlertCircle } from "lucide-react"; // Đã xóa FileUp
import { Button } from "@/src/components/ui/button";

interface ExcelUploadProps {
  onDataLoaded: (players: string[]) => void;
}

export function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const [playerInput, setPlayerInput] = useState("");

    const handleExcelData = (players: string[]) => {
      // Nối danh sách từ Excel vào danh sách hiện tại
      const newList = players.join("\n");
      setPlayerInput(newList);
    };

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        // Sử dụng ArrayBuffer thay vì BinaryString để hết lỗi Deprecated
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const players = jsonData
          .flat()
          .map((p) => String(p).trim())
          .filter(
            (p) =>
              p !== "" &&
              p !== "undefined" &&
              p !== "null" &&
              p !== "Họ và Tên",
          );

        if (players.length === 0) throw new Error("File trống!");

        onDataLoaded(players);
      } catch (err) {
        setError("Không thể đọc file. Vui lòng thử lại.");
      }
    };
    // Thay đổi phương thức đọc file tại đây
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full">
      <div className="relative group border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 rounded-2xl p-8 transition-all bg-slate-900/20 text-center">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="space-y-4">
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

      {/* Sửa variant="link" thành "ghost" + underline để hết lỗi type */}
      <Button
        variant="ghost"
        className="text-[10px] text-slate-500 uppercase font-black p-0 mt-2 h-auto hover:bg-transparent hover:text-[#ccff00] underline underline-offset-4"
        onClick={() => {
          const ws = XLSX.utils.aoa_to_sheet([
            ["Họ và Tên"],
            ["Nguyễn Văn A"],
            ["Trần Thị B"],
          ]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
          XLSX.writeFile(wb, "Mau_Danh_Sach_VDV.xlsx");
        }}
      >
        Tải file Excel mẫu tại đây
      </Button>
    </div>
  );
}
