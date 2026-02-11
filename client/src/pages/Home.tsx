import { motion } from "framer-motion";
import { Trophy, Activity, CalendarDays } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
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
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center text-slate-500 text-sm">
          Chưa có lịch phân công mới.
        </div>
      </div>
    </div>
  );
}
