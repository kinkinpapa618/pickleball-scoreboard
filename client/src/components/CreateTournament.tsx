import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Trophy, ChevronRight, Save, User, Users } from "lucide-react";
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

interface TournamentFormData {
  name: string;
  date: string;
  time: string;
  location: string;
  level: string;
  content: string[];
}

interface CreateTournamentProps {
  onSubmit: (data: TournamentFormData) => void;
}

export default function CreateTournament({ onSubmit }: CreateTournamentProps) {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: "",
    date: "",
    time: "",
    location: "",
    level: "",
    content: [],
  });

  const handleChange = (field: keyof TournamentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentToggle = (id: string, checked: boolean) => {
    setFormData((prev) => {
      const newContent = checked
        ? [...prev.content, id]
        : prev.content.filter((c) => c !== id);
      return { ...prev, content: newContent };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.name && formData.date && formData.location && formData.level && formData.content.length > 0;

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
            Bước 1: Nhập thông tin cơ bản
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
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">
              Level & Nội dung thi đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="level" className="text-white/70 text-xs font-bold uppercase">
                Level thi đấu <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.level}
                onValueChange={(value) => handleChange("level", value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#ccff00] focus:ring-[#ccff00]/20">
                  <SelectValue placeholder="Chọn level" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="beginner" className="text-white focus:bg-white/10">
                    Beginner (Mới bắt đầu)
                  </SelectItem>
                  <SelectItem value="intermediate" className="text-white focus:bg-white/10">
                    Intermediate (Trung cấp)
                  </SelectItem>
                  <SelectItem value="advanced" className="text-white focus:bg-white/10">
                    Advanced (Cao cấp)
                  </SelectItem>
                  <SelectItem value="pro" className="text-white focus:bg-white/10">
                    Professional (Chuyên nghiệp)
                  </SelectItem>
                  <SelectItem value="mixed" className="text-white focus:bg-white/10">
                    Mixed (Hỗn hợp)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-white/70 text-xs font-bold uppercase">
                Nội dung thi đấu <span className="text-rose-500">*</span>
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                  <User className="w-4 h-4" />
                  ĐÁNH ĐƠN
                </div>
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {SINGLES_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <Checkbox
                        id={option.id}
                        checked={formData.content.includes(option.id)}
                        onCheckedChange={(checked: boolean) => handleContentToggle(option.id, checked)}
                        className="border-white/20 data-[state=checked]:bg-[#ccff00] data-[state=checked]:border-[#ccff00]"
                      />
                      <span className="text-white/70 text-sm group-hover:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                  <Users className="w-4 h-4" />
                  ĐÁNH ĐÔI
                </div>
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {DOUBLES_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <Checkbox
                        id={option.id}
                        checked={formData.content.includes(option.id)}
                        onCheckedChange={(checked: boolean) => handleContentToggle(option.id, checked)}
                        className="border-white/20 data-[state=checked]:bg-[#ccff00] data-[state=checked]:border-[#ccff00]"
                      />
                      <span className="text-white/70 text-sm group-hover:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
