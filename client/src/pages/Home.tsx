import { motion } from "framer-motion";
import {
  Trophy,
  Activity,
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
  Users,
  Timer,
  Target,
  BarChart3,
  Smartphone,
  Zap,
  Layers,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface WorkSchedule {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
}

interface User {
  id: number;
  fullName: string | null;
  role: string;
}

interface RefereeStats {
  totalMatches: number;
  thisMonth: number;
}

export default function Home() {
  const { user: authUser } = useAuth();
  const [, setLocation] = useLocation();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user", { credentials: "same-origin" }).then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch("/api/work-schedules", { credentials: "same-origin" }).then((res) => res.json()),
    ])
      .then(async ([userData, scheduleData]) => {
        setUser(userData as User);
        setSchedules((scheduleData as WorkSchedule[]).slice(0, 3));

        if (userData && (userData as User).id) {
          try {
            const statsRes = await fetch(
              `/api/stats/referee/${(userData as User).id}`,
              { credentials: "same-origin" }
            );
            if (statsRes.ok) {
              const statsData = (await statsRes.json()) as RefereeStats;
              setStats({
                total: statsData.totalMatches || 0,
                thisMonth: statsData.thisMonth || 0,
              });
            }
          } catch {
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 pb-20 font-sans text-foreground">
      <div className="flex justify-between items-center py-4">
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic tracking-tighter text-blue-600"
          >
            TRONGTAISO.COM
          </motion.h3>
          <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase font-bold">
            Referee Management
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" /> Tính năng nổi bật
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 p-4 rounded-2xl border border-orange-200 dark:border-orange-500/20"
          >
            <Target className="w-8 h-8 text-orange-500 mb-2" />
            <h4 className="font-black text-sm text-orange-700 dark:text-orange-400">Ghi điểm nhanh</h4>
            <p className="text-[10px] text-orange-600 dark:text-orange-300 mt-1">Chạm để ghi điểm, đổi giao hoặc undo ngay lập tức</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-500/10 dark:to-cyan-500/5 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-500/20"
          >
            <Timer className="w-8 h-8 text-cyan-500 mb-2" />
            <h4 className="font-black text-sm text-cyan-700 dark:text-cyan-400">Timeout 3 phút</h4>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-300 mt-1">Mỗi đội có 2 quyền timeout trong trận</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-500/5 p-4 rounded-2xl border border-purple-200 dark:border-purple-500/20"
          >
            <Users className="w-8 h-8 text-purple-500 mb-2" />
            <h4 className="font-black text-sm text-purple-700 dark:text-purple-400">Quản lý nhóm</h4>
            <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-1">Manager tạo nhóm, thêm trọng tài và chat nhóm</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-500/5 p-4 rounded-2xl border border-green-200 dark:border-green-500/20"
          >
            <BarChart3 className="w-8 h-8 text-green-500 mb-2" />
            <h4 className="font-black text-sm text-green-700 dark:text-green-400">Thống kê</h4>
            <p className="text-[10px] text-green-600 dark:text-green-300 mt-1">Theo dõi số trận đã điều khiển theo tháng</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/20"
          >
            <Trophy className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="font-black text-sm text-blue-700 dark:text-blue-400">Giải đấu</h4>
            <p className="text-[10px] text-blue-600 dark:text-blue-300 mt-1">Tạo và quản lý giải đấu Pickleball dễ dàng</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-500/10 dark:to-rose-500/5 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/20"
          >
            <Smartphone className="w-8 h-8 text-rose-500 mb-2" />
            <h4 className="font-black text-sm text-rose-700 dark:text-rose-400">Công khai</h4>
            <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-1">Chia sẻ link cho khán giả xem trực tiếp</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/5 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 mt-2"
        >
          <div className="flex items-start gap-3">
            <Layers className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-black text-sm text-indigo-700 dark:text-indigo-400">Giả lập vị trí VĐV</h4>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300 mt-1">
                Trọng tài xác định chính xác vị trí từng Vận Động viên trên sân. Nhấn vào player để bật/tắt stacking - khóa vị trí VĐV theo ý muốn.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/5 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-500/20 mt-2"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-black text-sm text-yellow-700 dark:text-yellow-400">Thẻ phạt</h4>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">
                Nhắc nhở, cảnh cáo hoặc truất quyền thi đấu với VĐV có thái độ hoặc hành động không đúng mực. Thẻ vàng cảnh báo, thẻ đỏ truất quyền.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-500/10 dark:to-gray-500/5 p-4 rounded-2xl border border-slate-200 dark:border-slate-500/20 mt-2"
        >
          <div className="flex items-start gap-3">
            <Clock className="w-8 h-8 text-slate-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-black text-sm text-slate-700 dark:text-slate-400">Timeline sự kiện</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                Thống kê chi tiết mọi sự kiện xảy ra trong trận: ghi điểm, đổi giao, đổi sân, timeout, thẻ phạt. Chính xác tuyệt đối với thời gian và tỷ số.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" /> Lịch phân công
          </h3>
          <button
            onClick={() => setLocation("/profile")}
            className="text-blue-600 text-[10px] font-black uppercase hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-card p-4 rounded-3xl border border-border shadow-sm text-center text-muted-foreground text-sm">
              Đang tải...
            </div>
          ) : schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-4 rounded-3xl border border-border shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors"
                onClick={() => setLocation("/profile")}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/20 flex flex-col items-center justify-center text-blue-600">
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(schedule.date).toLocaleDateString("vi-VN", {
                      weekday: "short",
                    })}
                  </span>
                  <span className="text-sm font-black">
                    {new Date(schedule.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-sm">
                    {schedule.title}
                  </h4>
                  <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{" "}
                    {schedule.location || "Sân Pickleball"}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground w-5 h-5" />
              </motion.div>
            ))
          ) : (
            <div className="bg-card p-4 rounded-3xl border border-border shadow-sm text-center text-muted-foreground text-sm">
              Chưa có lịch phân công.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
