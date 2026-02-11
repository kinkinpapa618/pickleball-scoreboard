import { User, Settings, LogOut } from "lucide-react";

export default function Profile() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-black italic uppercase text-white">
        My <span className="text-[#ccff00]">ID</span>
      </h1>

      {/* Avatar Section */}
      <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-white/10">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-black">
          AD
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Admin User</h2>
          <p className="text-xs text-emerald-400 font-bold uppercase">
            Level 1 Referee
          </p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl text-slate-300 hover:bg-slate-800 transition">
          <Settings className="w-5 h-5" /> Cài đặt hệ thống
        </button>
        <button className="w-full flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl text-rose-500 hover:bg-rose-950/20 transition">
          <LogOut className="w-5 h-5" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
