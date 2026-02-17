import { motion } from "framer-motion";
import { Trophy, Activity, CalendarDays, Clock, MapPin, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

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
  const [, setLocation] = useLocation();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch("/api/work-schedules").then((res) => res.json()),
    ])
      .then(async ([userData, scheduleData]) => {
        setUser(userData as User);
        setSchedules((scheduleData as WorkSchedule[]).slice(0, 3));
        
        // Get referee stats
        if (userData && (userData as User).id) {
          try {
            const statsRes = await fetch(`/api/stats/referee/${(userData as User).id}`);
            if (statsRes.ok) {
              const statsData = await statsRes.json() as RefereeStats;
              setStats({
                total: statsData.totalMatches || 0,
                thisMonth: statsData.thisMonth || 0,
              });
            }
          } catch {
            // Ignore stats error
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 space-y-6 pb-20 font-sans text-slate-900">
      <div className="flex justify-between items-center py-4">
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic tracking-tighter text-blue-600"
          >
            BMB PICKLEBALL
          </motion.h3>
          <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase font-bold">
            Hệ thống quản lý trọng tài
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
           <Activity className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-cyan-400 p-6 shadow-xl shadow-blue-200/50 relative overflow-hidden"
      >
        <div className="relative z-10 text-white">
          <h2 className="text-2xl font-black mb-1">
            Xin chào, {user?.fullName?.split(" ").pop() || "Trọng tài"}!
          </h2>
          <p className="text-blue-50 text-xs font-medium mb-5 opacity-90">
            Bạn có {schedules.length} trận đấu được phân công hôm nay.
          </p>
          <div className="flex gap-3">
            <Link href="/tools">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-900/10 hover:scale-105 transition-transform">
                Trận đấu
              </button>
            </Link>
            <Link href="/tournament">
              <button className="bg-white/20 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-white/30 transition-colors">
                Giải đấu
              </button>
            </Link>
          </div>
        </div>
        <Trophy className="absolute -right-2 -bottom-2 w-32 h-32 text-white/20 rotate-12" />
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm"
        >
          <div className="text-slate-400 text-[10px] uppercase font-black mb-2 tracking-wider">
            Tổng trận
          </div>
          <div className="text-3xl font-black text-slate-800">{stats.total}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm"
        >
          <div className="text-orange-400 text-[10px] uppercase font-black mb-2 tracking-wider">
            Tháng này
          </div>
          <div className="text-3xl font-black text-orange-500">{stats.thisMonth}</div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" /> Lịch phân công
          </h3>
          <button onClick={() => setLocation("/profile")} className="text-blue-600 text-[10px] font-black uppercase hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm text-center text-slate-400 text-sm">
              Đang tải...
            </div>
          ) : schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
                onClick={() => setLocation("/profile")}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                   <span className="text-[10px] font-bold uppercase">
                     {new Date(schedule.date).toLocaleDateString("vi-VN", { weekday: "short" })}
                   </span>
                   <span className="text-sm font-black">
                     {new Date(schedule.date).getDate()}
                   </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">{schedule.title}</h4>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {schedule.location || "Sân Pickleball"}
                  </p>
                </div>
                <ChevronRight className="text-slate-300 w-5 h-5" />
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm text-center text-slate-400 text-sm">
              Chưa có lịch phân công.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
