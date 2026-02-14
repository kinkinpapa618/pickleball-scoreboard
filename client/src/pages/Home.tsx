import { motion } from "framer-motion";
import { Trophy, Activity, CalendarDays, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface WorkSchedule {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
}

export default function Home() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/work-schedules")
      .then((res) => res.json())
      .then((data) => {
        setSchedules(data.slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/20 text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center py-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black italic tracking-tighter text-[#ccff00]"
        >
          TRONGTAISO.COM
        </motion.h3>
        <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">
          Referee Support
        </p>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-40 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden flex items-center p-6"
      >
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2">Xin chào, Trọng tài!</h2>
          <p className="text-sm text-white/80 mb-4">
            Bạn đã sẵn sàng cho giải đấu hôm nay chưa?
          </p>
          <Link href="/tools">
            <button className="bg-white text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-slate-100 transition">
              Vào công cụ ngay
            </button>
          </Link>
        </div>
        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
      </motion.div>

      {/* Quick Stats (Demo) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
          <div className="text-slate-400 text-xs uppercase font-bold mb-1">
            Trận đã bắt
          </div>
          <div className="text-2xl font-black text-white">24</div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
          <div className="text-slate-400 text-xs uppercase font-bold mb-1">
            Tháng này
          </div>
          <div className="text-2xl font-black text-[#ccff00]">08</div>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-400" /> Lịch công tác
        </h3>
        {loading ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center text-slate-500 text-sm">
            Đang tải...
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white">{schedule.title}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      schedule.status
                    )}`}
                  >
                    {schedule.status === "assigned"
                      ? "Đã phân công"
                      : schedule.status === "completed"
                      ? "Hoàn thành"
                      : "Đã hủy"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDate(schedule.date)}
                  </div>
                  {schedule.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {schedule.location}
                    </div>
                  )}
                </div>
                {schedule.description && (
                  <p className="mt-2 text-sm text-slate-500">
                    {schedule.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center text-slate-500 text-sm">
            Chưa có lịch phân công mới.
          </div>
        )}
      </div>
    </div>
  );
}
