import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  LogOut,
  Calendar,
  Trophy,
  Edit2,
  Save,
  X,
  Users,
  FileText,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface UserProfile {
  id: number;
  username: string;
  fullName: string | null;
  phone: string;
  idCard: string;
  role: string;
}

interface Stats {
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  totalSchedules: number;
  completedSchedules: number;
}

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "stats" | "admin">("info");

  useEffect(() => {
    if (user) {
      setEditedUser({
        id: user.id,
        username: user.username,
        fullName: user.fullName || "",
        phone: user.phone || "",
        idCard: user.idCard || "",
        role: user.role,
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/stats/referee/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSave = async () => {
    if (!editedUser) return;
    try {
      const res = await fetch(`/api/users/${editedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editedUser.fullName,
          phone: editedUser.phone,
          idCard: editedUser.idCard,
        }),
      });
      if (res.ok) {
        toast({ title: "Cập nhật thành công" });
        setIsEditing(false);
      } else {
        toast({ title: "Cập nhật thất bại", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi cập nhật", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return { text: "Quản trị viên", color: "text-purple-400" };
      case "manager":
        return { text: "Quản lý", color: "text-orange-400" };
      default:
        return { text: "Trọng tài", color: "text-emerald-400" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user || !editedUser) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  const roleInfo = getRoleLabel(editedUser.role);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-black italic uppercase text-white">
        Hồ <span className="text-[#ccff00]">Sơ</span>
      </h1>

      {/* Avatar & Basic Info */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-black">
            {editedUser.fullName
              ? getInitials(editedUser.fullName)
              : editedUser.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              {editedUser.fullName || editedUser.username}
            </h2>
            <p className={`text-xs font-bold uppercase ${roleInfo.color}`}>
              {roleInfo.text}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              @{editedUser.username}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            {isEditing ? (
              <X className="w-5 h-5 text-slate-400" />
            ) : (
              <Edit2 className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-[#ccff00]">
              {stats?.totalMatches || 0}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Trận đấu</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-emerald-400">
              {stats?.completedMatches || 0}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Hoàn thành</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-400">
              {stats?.totalSchedules || 0}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Lịch công tác</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "info"
              ? "bg-[#ccff00] text-black"
              : "bg-slate-900 text-slate-400"
          }`}
        >
          Thông tin
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "stats"
              ? "bg-[#ccff00] text-black"
              : "bg-slate-900 text-slate-400"
          }`}
        >
          Thống kê
        </button>
        {editedUser.role === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === "admin"
                ? "bg-[#ccff00] text-black"
                : "bg-slate-900 text-slate-400"
            }`}
          >
            Admin
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-4 space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={editedUser.fullName || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, fullName: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-1"
                  placeholder="Nhập họ tên"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editedUser.phone}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, phone: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">
                  Căn cước/CMND
                </label>
                <input
                  type="text"
                  value={editedUser.idCard}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, idCard: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-1"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm">Họ tên</span>
                <span className="text-white font-medium">
                  {editedUser.fullName || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm">Số điện thoại</span>
                <span className="text-white font-medium">{editedUser.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-sm">Căn cước/CMND</span>
                <span className="text-white font-medium">{editedUser.idCard}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 text-sm">Vai trò</span>
                <span className={`font-bold ${roleInfo.color}`}>
                  {roleInfo.text}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[#ccff00]" />
            <h3 className="font-bold">Thống kê hoạt động</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <Trophy className="w-5 h-5 text-orange-400 mb-2" />
              <div className="text-2xl font-black text-white">
                {stats?.totalMatches || 0}
              </div>
              <div className="text-xs text-slate-500">Tổng trận đấu</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-2xl font-black text-white">
                {stats?.totalSchedules || 0}
              </div>
              <div className="text-xs text-slate-500">Lịch công tác</div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
              <span className="text-slate-400 text-sm">Trận đã hoàn thành</span>
              <span className="font-black text-emerald-400">
                {stats?.completedMatches || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
              <span className="text-slate-400 text-sm">Trận chờ xử lý</span>
              <span className="font-black text-orange-400">
                {stats?.pendingMatches || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
              <span className="text-slate-400 text-sm">Công tác hoàn thành</span>
              <span className="font-black text-blue-400">
                {stats?.completedSchedules || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "admin" && editedUser.role === "admin" && (
        <div className="space-y-2">
          <Link href="/users">
            <div className="bg-slate-900 p-4 rounded-xl border border-white/10 flex items-center justify-between hover:bg-slate-800 transition">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Quản lý người dùng</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </Link>
          <Link href="/tools">
            <div className="bg-slate-900 p-4 rounded-xl border border-white/10 flex items-center justify-between hover:bg-slate-800 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="font-medium">Quản lý trận đấu</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </Link>
          <div className="bg-slate-900 p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="font-medium">Cài đặt hệ thống</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      )}

      {/* Menu Actions */}
      <div className="space-y-2 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-slate-900 p-4 rounded-xl text-rose-500 hover:bg-rose-950/20 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
