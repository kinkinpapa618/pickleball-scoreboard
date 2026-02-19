import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy, ChevronRight, Save, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface TournamentFormData {
  name: string;
  date: string;
  time: string;
  location: string;
  courts: number;
  level: string;
  content: string;
  backdrop?: string;
}

interface CreateTournamentProps {
  onSubmit: (data: TournamentFormData) => void;
  initialData?: TournamentFormData;
}

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

export default function CreateTournament({ onSubmit, initialData }: CreateTournamentProps) {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: initialData?.name || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    courts: initialData?.courts || 0,
    level: initialData?.level || "",
    content: initialData?.content || "",
    backdrop: initialData?.backdrop || undefined,
  });

  const [backdropPreview, setBackdropPreview] = useState<string | undefined>(initialData?.backdrop);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof TournamentFormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackdropUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Chỉ chấp nhận file JPEG, JPG, PNG");
      return;
    }

    try {
      const resized = await resizeImage(file, 1024);
      setBackdropPreview(resized);
      setFormData((prev) => ({ ...prev, backdrop: resized }));
    } catch (err) {
      console.error("Error resizing image:", err);
      alert("Không thể xử lý ảnh");
    }
  };

  const handleRemoveBackdrop = () => {
    setBackdropPreview(undefined);
    setFormData((prev) => ({ ...prev, backdrop: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.location || formData.courts <= 0) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (!formData.level) {
      alert("Vui lòng nhập level");
      return;
    }
    if (!formData.content) {
      alert("Vui lòng chọn nội dung thi đấu");
      return;
    }
    onSubmit(formData);
  };

  const isValid =
    formData.name &&
    formData.date &&
    formData.location &&
    formData.courts > 0 &&
    formData.level &&
    formData.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-slate-900 font-black italic text-xl uppercase tracking-tighter">
            {initialData ? "Chỉnh sửa giải đấu" : "Tạo giải đấu mới"}
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Nhập thông tin giải đấu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-wider">
              Thông tin giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 text-xs font-bold uppercase">
                Tên giải đấu <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Giải Pickleball HCM 2024"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 text-xs font-bold uppercase">
                  Ngày thi đấu <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-900 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-700 text-xs font-bold uppercase">
                  Giờ thi đấu
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 text-xs font-bold uppercase">
                Địa điểm <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="location"
                  placeholder="VD: Sân Pickleball Quận 1, TP.HCM"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courts" className="text-slate-700 text-xs font-bold uppercase">
                  Số lượng sân đăng ký <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="courts"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="VD: 2"
                  value={formData.courts || ""}
                  onChange={(e) => handleChange("courts", parseInt(e.target.value) || 0)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level" className="text-slate-700 text-xs font-bold uppercase">
                  Level <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="level"
                  placeholder="VD: 4.0"
                  value={formData.level}
                  onChange={(e) => handleChange("level", e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-xs font-bold uppercase">
                Nội dung thi đấu <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.content}
                onValueChange={(value) => handleChange("content", value)}
              >
                <SelectTrigger className="bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue placeholder="Chọn nội dung thi đấu" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_OPTIONS.map((content) => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-wider">
              Backdrop giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 text-xs font-bold uppercase">
                Ảnh backdrop (JPEG, JPG, PNG - dưới 1MB)
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleBackdropUpload}
                className="hidden"
              />
              {backdropPreview ? (
                <div className="relative">
                  <img
                    src={backdropPreview}
                    alt="Backdrop preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveBackdrop}
                    className="absolute top-2 right-2"
                  >
                    Xóa
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Tải ảnh backdrop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={!isValid}
          className={`w-full py-6 rounded-2xl font-black italic text-sm uppercase tracking-wider transition-all ${
            isValid
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          Lưu & Tiếp theo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </motion.div>
  );
}
