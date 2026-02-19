import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/context/ThemeContext";
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
  Moon,
  Sun,
  Link2,
  MessageCircle,
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
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stats" | "admin" | "manager" | "info"
  >(() => {
    if (user?.role === "admin") return "admin";
    if (user?.role === "manager") return "manager";
    return "info";
  });

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
      const res = await fetch(`/api/stats/referee/${user.id}`, { credentials: "same-origin" });
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
        credentials: "same-origin",
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
        return { text: "Quản trị viên", color: "text-purple-500" };
      case "manager":
        return { text: "Quản lý", color: "text-orange-500" };
      default:
        return { text: "Trọng tài", color: "text-emerald-500" };
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
      <div className="p-4 flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  const roleInfo = getRoleLabel(editedUser.role);

  return (
    <div className="p-4 space-y-4 bg-background min-h-screen pb-20">
      <h1 className="text-2xl font-black italic uppercase text-foreground">
        Hồ <span className="text-blue-600">Sơ</span>
      </h1>

      {/* Avatar & Basic Info */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white">
            {editedUser.fullName
              ? getInitials(editedUser.fullName)
              : editedUser.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">
              {editedUser.fullName || editedUser.username}
            </h2>
            <p className={`text-xs font-bold uppercase ${roleInfo.color}`}>
              {roleInfo.text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              @{editedUser.username}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition"
            data-testid="button-edit-profile"
          >
            {isEditing ? (
              <X className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Edit2 className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Section - Always Visible */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-foreground">Thống kê hoạt động</h3>
          </div>
        </div>

        {editedUser.role === "referee" && (
          <Link href="/connected-managers">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-sm flex items-center justify-between hover:opacity-90 transition">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">Kết nối Manager</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70" />
            </div>
          </Link>
        )}

        {(editedUser.role === "referee" || editedUser.role === "manager") && (
          <Link href="/chat">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-sm flex items-center justify-between hover:opacity-90 transition">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">Chat nhóm</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-600">
              {stats?.totalMatches || 0}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Trận đấu</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-xl font-black text-emerald-500">
              {stats?.completedMatches || 0}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Hoàn thành
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-xl font-black text-orange-500">
              {stats?.totalSchedules || 0}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Lịch công tác
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle - Visible to ALL roles */}
      <div
        onClick={toggleTheme}
        className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between cursor-pointer hover:bg-muted/50 transition"
        data-testid="button-theme-toggle"
      >
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <Moon className="w-5 h-5 text-blue-400" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500" />
          )}
          <span className="font-medium text-foreground">Giao diện</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" data-testid="text-theme-label">
            {theme === "dark" ? "Tối" : "Sáng"}
          </span>
          <div
            className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
              theme === "dark" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {editedUser.role === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === "admin"
                ? "bg-blue-500 text-white"
                : "bg-card text-muted-foreground border border-border"
            }`}
            data-testid="button-tab-admin"
          >
            Admin
          </button>
        )}
        {editedUser.role === "manager" && (
          <button
            onClick={() => setActiveTab("manager")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === "manager"
                ? "bg-orange-500 text-white"
                : "bg-card text-muted-foreground border border-border"
            }`}
            data-testid="button-tab-manager"
          >
            Quản lý
          </button>
        )}
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "stats"
              ? "bg-blue-500 text-white"
              : "bg-card text-muted-foreground border border-border"
          }`}
          data-testid="button-tab-stats"
        >
          Thống kê
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "info"
              ? "bg-blue-500 text-white"
              : "bg-card text-muted-foreground border border-border"
          }`}
          data-testid="button-tab-info"
        >
          Thông tin
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={editedUser.fullName || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, fullName: e.target.value })
                  }
                  className="w-full bg-muted border border-border rounded-xl p-3 text-foreground mt-1"
                  placeholder="Nhập họ tên"
                  data-testid="input-fullname"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editedUser.phone}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, phone: e.target.value })
                  }
                  className="w-full bg-muted border border-border rounded-xl p-3 text-foreground mt-1"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">
                  Căn cước/CMND
                </label>
                <input
                  type="text"
                  value={editedUser.idCard}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, idCard: e.target.value })
                  }
                  className="w-full bg-muted border border-border rounded-xl p-3 text-foreground mt-1"
                  data-testid="input-idcard"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                data-testid="button-save-profile"
              >
                <Save className="w-4 h-4" /> Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Họ tên</span>
                <span className="text-foreground font-medium">
                  {editedUser.fullName || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Số điện thoại</span>
                <span className="text-foreground font-medium">
                  {editedUser.phone}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Căn cước/CMND</span>
                <span className="text-foreground font-medium">
                  {editedUser.idCard}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Vai trò</span>
                <span className={`font-bold ${roleInfo.color}`}>
                  {roleInfo.text}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-foreground">Chi tiết thống kê</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground text-sm">Trận đã hoàn thành</span>
                <span className="font-black text-emerald-500">
                  {stats?.completedMatches || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground text-sm">Trận chờ xử lý</span>
                <span className="font-black text-orange-500">
                  {stats?.pendingMatches || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground text-sm">
                  Công tác hoàn thành
                </span>
                <span className="font-black text-blue-500">
                  {stats?.completedSchedules || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "admin" && editedUser.role === "admin" && (
        <div className="space-y-3">
          <Link href="/admin">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl shadow-sm flex items-center justify-between hover:opacity-90 transition">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-white" />
                <span className="font-bold text-white">Dashboard</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </Link>
          <Link href="/admin/manage">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between hover:bg-muted/50 transition">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-foreground">
                  Manager Setting
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/users">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between hover:bg-muted/50 transition">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-foreground">
                  Quản lý người dùng
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/tools">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between hover:bg-muted/50 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-foreground">
                  Quản lý trận đấu
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      )}

      {activeTab === "manager" && editedUser.role === "manager" && (
        <div className="space-y-2">
          <Link href="/admin/manage">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-xl shadow-sm flex items-center justify-between hover:opacity-90 transition">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-white" />
                <span className="font-bold text-white">Quản lý giải đấu</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </Link>
          <Link href="/users">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between hover:bg-muted/50 transition">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-foreground">
                  Quản lý trọng tài
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      )}

      {/* Menu Actions */}
      <div className="space-y-2 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-card p-4 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shadow-sm border border-border"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
