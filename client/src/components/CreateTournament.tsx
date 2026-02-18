import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Calendar, MapPin, Trophy, ChevronRight, Save, User, Users, Image, Upload } from "lucide-react";
import { motion } from "framer-motion";

const SINGLES_OPTIONS = [
  { id: "don_nam", label: "Đơn Nam" },
  { id: "don_nu", label: "Đơn Nữ" },
];

const DOUBLES_OPTIONS = [
  { id: "doi_nam", label: "Đôi Nam" },
  { id: "doi_nu", label: "Đôi Nữ" },
  { id: "doi_nam_nu", label: "Đôi Nam-Nữ" },
  { id: "doi_hon", label: "Đôi Hỗn Hợp" },
];

interface LevelContent {
  level: string;
  contents: string[];
}

interface TournamentFormData {
  name: string;
  date: string;
  time: string;
  location: string;
  courts: number;
  level: string;
  levels: LevelContent[];
  backdrop?: string;
}

interface CreateTournamentProps {
  onSubmit: (data: TournamentFormData) => void;
}

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

export default function CreateTournament({ onSubmit }: CreateTournamentProps) {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: "",
    date: "",
    time: "",
    location: "",
    courts: 1,
    level: "",
    levels: [],
    backdrop: undefined,
  });

  const [newLevel, setNewLevel] = useState("");
  const [backdropPreview, setBackdropPreview] = useState<string | undefined>(formData.backdrop);
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

  const handleAddLevel = () => {
    if (newLevel && !formData.levels.find(l => l.level === newLevel)) {
      setFormData((prev) => ({
        ...prev,
        levels: [...prev.levels, { level: newLevel, contents: [] }],
      }));
      setNewLevel("");
    }
  };

  const handleRemoveLevel = (levelToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.filter((l) => l.level !== levelToRemove),
    }));
  };

  const handleContentToggle = (level: string, contentId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.map((l) => {
        if (l.level === level) {
          const newContents = checked
            ? [...l.contents, contentId]
            : l.contents.filter((c) => c !== contentId);
          return { ...l, contents: newContents };
        }
        return l;
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.name && formData.date && formData.location && formData.levels.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#ccff00]/10 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-[#ccff00]" />
        </div>
        <div>
          <h2 className="text-white font-black italic text-xl uppercase tracking-tighter">
            Tạo giải đấu mới
          </h2>
          <p className="text-white/40 text-xs font-medium">
            Nhập thông tin giải đấu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-900/80 border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">
              Thông tin giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70 text-xs font-bold uppercase">
                Tên giải đấu <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Giải Pickleball HCM 2024"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-white/70 text-xs font-bold uppercase">
                  Ngày thi đấu <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="bg-white/5 border-white/10 text-white pl-10 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-white/70 text-xs font-bold uppercase">
                  Giờ thi đấu
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-[#ccff00] focus:ring-[#ccff00]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-white/70 text-xs font-bold uppercase">
                Địa điểm <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="location"
                  placeholder="VD: Sân Pickleball Quận 1, TP.HCM"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courts" className="text-white/70 text-xs font-bold uppercase">
                Số lượng sân đăng ký
              </Label>
              <Input
                id="courts"
                type="number"
                min={1}
                max={20}
                placeholder="VD: 2"
                value={formData.courts}
                onChange={(e) => handleChange("courts", parseInt(e.target.value) || 1)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level" className="text-white/70 text-xs font-bold uppercase">
                Level (phân cách bằng dấu phẩy)
              </Label>
              <Input
                id="level"
                placeholder="VD: 4.0, 4.5, 5.0"
                value={formData.level}
                onChange={(e) => handleChange("level", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">
              Backdrop giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-xs font-bold uppercase">
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
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-dashed border-white/20 text-white/50 hover:border-[#ccff00] hover:text-[#ccff00]"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Tải ảnh backdrop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">
              Level & Nội dung thi đấu <span className="text-rose-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-xs font-bold uppercase">
                Thêm level
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="VD: 4.0, 4.5, 5.0"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLevel())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#ccff00] focus:ring-[#ccff00]/20"
                />
                <Button
                  type="button"
                  onClick={handleAddLevel}
                  className="bg-[#ccff00] hover:bg-[#b8e600] text-black"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {formData.levels.length > 0 && (
              <div className="space-y-4">
                {formData.levels.map((levelData) => (
                  <div key={levelData.level} className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#ccff00] font-bold">Level {levelData.level}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLevel(levelData.level)}
                        className="text-white/50 hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                        <User className="w-4 h-4" />
                        ĐÁNH ĐƠN
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {SINGLES_OPTIONS.map((option) => (
                          <label
                            key={`${levelData.level}-${option.id}`}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <Checkbox
                              id={`${levelData.level}-${option.id}`}
                              checked={levelData.contents.includes(option.id)}
                              onCheckedChange={(checked: boolean) => handleContentToggle(levelData.level, option.id, checked)}
                              className="border-white/20 data-[state=checked]:bg-[#ccff00] data-[state=checked]:border-[#ccff00]"
                            />
                            <span className="text-white/70 text-sm group-hover:text-white">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                        <Users className="w-4 h-4" />
                        ĐÁNH ĐÔI
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {DOUBLES_OPTIONS.map((option) => (
                          <label
                            key={`${levelData.level}-${option.id}`}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <Checkbox
                              id={`${levelData.level}-${option.id}`}
                              checked={levelData.contents.includes(option.id)}
                              onCheckedChange={(checked: boolean) => handleContentToggle(levelData.level, option.id, checked)}
                              className="border-white/20 data-[state=checked]:bg-[#ccff00] data-[state=checked]:border-[#ccff00]"
                            />
                            <span className="text-white/70 text-sm group-hover:text-white">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={!isValid}
          className={`w-full py-6 rounded-2xl font-black italic text-sm uppercase tracking-wider transition-all ${
            isValid
              ? "bg-[#ccff00] hover:bg-[#b8e600] text-black shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
              : "bg-white/5 text-white/30 cursor-not-allowed"
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
