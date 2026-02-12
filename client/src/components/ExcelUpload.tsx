import { useState } from "react";
import ExcelJS from "exceljs";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("No data");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];

        const players: string[] = [];
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            const val = String(cell.value).trim();
            if (
              val !== "" &&
              val !== "undefined" &&
              val !== "null" &&
              val !== "Họ và Tên"
            ) {
              players.push(val);
            }
          });
        });

        if (players.length === 0) throw new Error("File trống!");

        onDataLoaded(players);
      } catch (err) {
        setError("Không thể đọc file. Vui lòng thử lại.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("DanhSach");
    worksheet.addRow(["Họ và Tên"]);
    worksheet.addRow(["Nguyễn Văn A"]);
    worksheet.addRow(["Trần Thị B"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Mau_Danh_Sach_VDV.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="relative group border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 rounded-2xl p-8 transition-all bg-slate-900/20 text-center">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          data-testid="input-excel-upload"
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

      <Button
        variant="ghost"
        className="text-[10px] text-slate-500 uppercase font-black p-0 mt-2 h-auto hover:bg-transparent hover:text-[#ccff00] underline underline-offset-4"
        onClick={handleDownloadTemplate}
        data-testid="button-download-template"
      >
        Tải file Excel mẫu tại đây
      </Button>
    </div>
  );
}
