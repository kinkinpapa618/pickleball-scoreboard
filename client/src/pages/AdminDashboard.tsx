import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Play,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
} from "lucide-react";

interface AdminStats {
  totalMatches: number;
  liveMatches: number;
  finishedMatches: number;
  pendingMatches: number;
  totalUsers: number;
  adminUsers: number;
  managerUsers: number;
  refereeUsers: number;
  totalSchedules: number;
  completedSchedules: number;
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/admin");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-slate-500">Bạn không có quyền truy cập</p>
          <button
            onClick={() => setLocation("/profile")}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/profile")}
          className="p-2 bg-white rounded-xl hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black italic uppercase text-slate-900">
          Admin <span className="text-purple-600">Dashboard</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white">
              <Play className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-3xl font-black">{stats?.liveMatches || 0}</div>
              <div className="text-xs opacity-80">Trận đang đấu</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white">
              <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-3xl font-black">{stats?.finishedMatches || 0}</div>
              <div className="text-xs opacity-80">Trận hoàn thành</div>
            </div>
          </div>

          {/* Matches Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-slate-900">Trận đấu</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-600">{stats?.totalMatches || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Tổng</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-orange-500">{stats?.pendingMatches || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Chờ</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-500">{stats?.finishedMatches || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Xong</div>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-slate-900">Người dùng</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-purple-50 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-purple-600">{stats?.totalUsers || 0}</div>
                <div className="text-[9px] text-slate-400 uppercase">Tổng</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-slate-600">{stats?.adminUsers || 0}</div>
                <div className="text-[9px] text-slate-400 uppercase">Admin</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-orange-500">{stats?.managerUsers || 0}</div>
                <div className="text-[9px] text-slate-400 uppercase">QLý</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-emerald-500">{stats?.refereeUsers || 0}</div>
                <div className="text-[9px] text-slate-400 uppercase">TT</div>
              </div>
            </div>
          </div>

          {/* Tournaments Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900">Giải đấu</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-slate-600">{stats?.totalTournaments || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Tổng</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-500">{stats?.activeTournaments || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Đang đấu</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-500">{stats?.completedTournaments || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Hoàn thành</div>
              </div>
            </div>
          </div>

          {/* Schedules Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-500" />
              <h2 className="font-bold text-slate-900">Lịch công tác</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-slate-600">{stats?.totalSchedules || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Tổng lịch</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-500">{stats?.completedSchedules || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase">Hoàn thành</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
