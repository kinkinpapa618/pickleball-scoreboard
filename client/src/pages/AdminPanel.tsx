import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useUpdateSetting, useGroups, useGroupMembers } from "@/hooks/use-api";
import {
  ArrowLeft,
  Users,
  Calendar,
  Trophy,
  Play,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  X,
  Save,
  RefreshCw,
  Settings,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string | null;
  phone: string;
  idCard: string;
  role: string;
}

interface WorkSchedule {
  id: number;
  refereeId: number | null;
  title: string;
  description: string | null;
  matchId: number | null;
  date: string;
  location: string | null;
  status: string;
}

interface Match {
  id: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  scoreTeam1: number;
  scoreTeam2: number;
  status: string;
  refereeId: number | null;
  date: string;
}

interface Tournament {
  id: number;
  name: string;
  description: string | null;
  status: string;
  creatorId: number;
  createdAt: string;
}

type TabType = "users" | "schedules" | "matches" | "tournaments" | "settings";

function SettingsTab() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  const defaultSettings = [
    { key: "winningScore", label: "Điểm thắng mặc định", type: "number", defaultValue: "11", description: "Số điểm cần đạt để thắng một game" },
    { key: "timeoutDuration", label: "Thời gian timeout (giây)", type: "number", defaultValue: "180", description: "Thời gian nghỉ timeout cho mỗi đội" },
    { key: "maxTimeouts", label: "Số timeout mỗi đội", type: "number", defaultValue: "2", description: "Số timeout tối đa mỗi đội được sử dụng" },
    { key: "deuceAt", label: "Điểm deuce bắt đầu", type: "number", defaultValue: "10", description: "Bắt đầu tính deuce khi đạt mốc này" },
    { key: "requireTwoPointsGap", label: "Cách thắng cách biệt 2 điểm", type: "boolean", defaultValue: "true", description: "Yêu cầu thắng cách biệt 2 điểm" },
    { key: "autoStartTimer", label: "Tự động bắt đầu timer", type: "boolean", defaultValue: "true", description: "Tự động bắt đầu đếm thời gian khi vào trận" },
    { key: "showServerNumber", label: "Hiển thị số lượt giao", type: "boolean", defaultValue: "true", description: "Hiển thị số (1 hoặc 2) lượt giao hiện tại" },
    { key: "enableStacking", label: "Cho phép khóa vị trí (Stacking)", type: "boolean", defaultValue: "true", description: "Cho phép người chơi khóa vị trí trên sân" },
    { key: "enablePenalties", label: "Cho phép thẻ phạt", type: "boolean", defaultValue: "true", description: "Bật chức năng thẻ vàng/đỏ" },
  ];

  const getSettingValue = (key: string) => {
    const found = settings?.find(s => s.key === key);
    if (found) return found.value;
    const def = defaultSettings.find(d => d.key === key);
    return def?.defaultValue || "";
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast({ title: "Đã lưu cài đặt" });
    } catch (e) {
      toast({ title: "Lỗi lưu cài đặt", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-slate-500 text-center py-8">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-black text-slate-900 text-xl">Cài đặt hệ thống</h3>
      <p className="text-sm text-slate-500">Cấu hình các thông số mặc định cho trận đấu</p>
      
      <div className="grid gap-3">
        {defaultSettings.map((setting) => (
          <div key={setting.key} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="font-bold text-slate-700 text-sm block">{setting.label}</label>
                <p className="text-xs text-slate-400 mt-0.5">{setting.description}</p>
              </div>
              {setting.type === "boolean" ? (
                <button
                  onClick={() => handleUpdate(setting.key, getSettingValue(setting.key) === "true" ? "false" : "true")}
                  disabled={updateSetting.isPending}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    getSettingValue(setting.key) === "true" ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    getSettingValue(setting.key) === "true" ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              ) : (
                <input
                  type={setting.type}
                  value={getSettingValue(setting.key)}
                  onChange={(e) => handleUpdate(setting.key, e.target.value)}
                  disabled={updateSetting.isPending}
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-slate-700"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    idCard: "",
    role: "referee",
  });

  // Schedules state
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    refereeId: "",
    title: "",
    description: "",
    date: "",
    location: "",
    status: "assigned",
  });

  // Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatchAssignModal, setShowMatchAssignModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [assignForm, setAssignForm] = useState({ refereeId: "" });

  // Groups for manager
  const { data: groups } = useGroups();
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<number | null>(null);
  const { data: groupMembers } = useGroupMembers(selectedGroupForAssign || 0);

  // Tournaments state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "manager")) {
      fetchUsers();
      fetchSchedules();
      fetchMatches();
      fetchTournaments();
    }
  }, [user]);

  useEffect(() => {
    // Auto-select first group when groups load
    if (groups && groups.length > 0 && !selectedGroupForAssign) {
      setSelectedGroupForAssign(groups[0].id);
    }
  }, [groups]);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "same-origin" });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      toast({ title: "Lỗi tải users", variant: "destructive" });
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/work-schedules", { credentials: "same-origin" });
      if (res.ok) setSchedules(await res.json());
    } catch (e) {
      toast({ title: "Lỗi tải lịch", variant: "destructive" });
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches", { credentials: "same-origin" });
      if (res.ok) setMatches(await res.json());
    } catch (e) {
      toast({ title: "Lỗi tải trận", variant: "destructive" });
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments", { credentials: "same-origin" });
      if (res.ok) setTournaments(await res.json());
    } catch (e) {
      toast({ title: "Lỗi tải giải", variant: "destructive" });
    }
  };

  // --- USER HANDLERS ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        toast({ title: "Thêm user thành công" });
        setShowUserModal(false);
        setUserForm({ username: "", password: "", fullName: "", phone: "", idCard: "", role: "referee" });
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Lỗi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: editingUser.fullName,
          phone: editingUser.phone,
          idCard: editingUser.idCard,
          role: editingUser.role,
        }),
      });
      if (res.ok) {
        toast({ title: "Cập nhật thành công" });
        setEditingUser(null);
        fetchUsers();
      } else {
        toast({ title: "Lỗi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  // --- SCHEDULE HANDLERS ---
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/work-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...scheduleForm,
          refereeId: scheduleForm.refereeId ? parseInt(scheduleForm.refereeId) : null,
        }),
      });
      if (res.ok) {
        toast({ title: "Thêm lịch thành công" });
        setShowScheduleModal(false);
        setScheduleForm({ refereeId: "", title: "", description: "", date: "", location: "", status: "assigned" });
        fetchSchedules();
      } else {
        toast({ title: "Lỗi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      const res = await fetch(`/api/work-schedules/${editingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(editingSchedule),
      });
      if (res.ok) {
        toast({ title: "Cập nhật thành công" });
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        toast({ title: "Lỗi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Xóa lịch công tác?")) return;
    try {
      const res = await fetch(`/api/work-schedules/${id}`, { method: "DELETE", credentials: "same-origin" });
      if (res.ok) {
        toast({ title: "Xóa thành công" });
        fetchSchedules();
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  // --- MATCH ASSIGN HANDLERS ---
  const handleAssignReferee = async () => {
    if (!selectedMatch || !assignForm.refereeId) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeId: parseInt(assignForm.refereeId) }),
      });
      if (res.ok) {
        toast({ title: "Phân công thành công" });
        setShowMatchAssignModal(false);
        setSelectedMatch(null);
        setAssignForm({ refereeId: "" });
        fetchMatches();
      } else {
        toast({ title: "Lỗi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  // --- TOURNAMENT HANDLERS ---
  const handleUpdateTournamentStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: "Cập nhật thành công" });
        fetchTournaments();
      }
    } catch (e) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-600";
      case "manager": return "bg-orange-500/20 text-orange-600";
      default: return "bg-emerald-500/20 text-emerald-600";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "manager": return "QLý";
      default: return "Trọng tài";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-500/20 text-blue-600";
      case "completed": return "bg-emerald-500/20 text-emerald-600";
      case "cancelled": return "bg-red-500/20 text-red-600";
      default: return "bg-slate-500/20 text-slate-600";
    }
  };

  const getMatchReferee = (refereeId: number | null) => {
    if (!refereeId) return <span className="text-slate-400 text-xs">Chưa phân công</span>;
    const referee = users.find(u => u.id === refereeId);
    return referee ? (
      <span className="text-blue-600 text-xs font-medium">{referee.fullName || referee.username}</span>
    ) : <span className="text-slate-400 text-xs">Unknown</span>;
  };

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-slate-500">Không có quyền truy cập</p>
          <button onClick={() => setLocation("/profile")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold">
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
        <button onClick={() => setLocation("/profile")} className="p-2 bg-white rounded-xl hover:bg-slate-100 transition shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black italic uppercase text-slate-900">
          Quản {isManager ? "Lý" : "Trị"} <span className="text-blue-600">{isManager ? "Giải" : "Hệ"}</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "schedules", label: "Lịch công tác", icon: Calendar },
          { id: "matches", label: "Phân công TT", icon: Play },
          { id: "tournaments", label: "Giải đấu", icon: Trophy },
          ...(user?.role === "admin" ? [{ id: "settings", label: "Cài đặt", icon: Settings }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition ${
              activeTab === tab.id ? "bg-blue-500 text-white" : "bg-white text-slate-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowUserModal(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm User
          </button>

          {users.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
                    {(u.fullName || u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{u.fullName || u.username}</h3>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadge(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(u)}
                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  <Edit2 className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
                <span>{u.phone}</span>
                <span>{u.idCard}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULES TAB */}
      {activeTab === "schedules" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm Lịch
          </button>

          {schedules.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(s.date).toLocaleString("vi-VN")}</span>
                    {s.location && <span>{s.location}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(s.status)}`}>
                    {s.status === "assigned" ? "Chờ" : s.status === "completed" ? "Hoàn thành" : "Hủy"}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingSchedule(s)} className="p-1.5 bg-slate-100 rounded">
                      <Edit2 className="w-3 h-3 text-slate-500" />
                    </button>
                    <button onClick={() => handleDeleteSchedule(s.id)} className="p-1.5 bg-red-50 rounded">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              {s.refereeId && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">TT: </span>
                  {getMatchReferee(s.refereeId)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MATCHES TAB */}
      {activeTab === "matches" && (
        <div className="space-y-3">
          {matches.filter(m => m.status === "live" || m.status === "pending").map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">#{m.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.status === "live" ? "bg-red-500/20 text-red-600" : "bg-slate-500/20 text-slate-600"}`}>
                  {m.status === "live" ? "Đang đấu" : "Chờ"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-700">{m.team1Player1}/{m.team1Player2}</div>
                  <div className="text-sm font-bold text-slate-700">{m.team2Player1}/{m.team2Player2}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">{m.scoreTeam1}</div>
                  <div className="text-xl font-black text-orange-600">{m.scoreTeam2}</div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {getMatchReferee(m.refereeId)}
                </div>
                <button
                  onClick={() => { setSelectedMatch(m); setShowMatchAssignModal(true); }}
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold"
                >
                  <UserPlus className="w-3 h-3 inline mr-1" /> Phân công
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOURNAMENTS TAB */}
      {activeTab === "tournaments" && (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t.description || "Không có mô tả"}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  t.status === "active" ? "bg-green-500/20 text-green-600" :
                  t.status === "completed" ? "bg-slate-500/20 text-slate-600" :
                  "bg-amber-500/20 text-amber-600"
                }`}>
                  {t.status === "active" ? "Đang đấu" : t.status === "completed" ? "Hoàn thành" : "Bản nháp"}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                {t.status === "draft" && (
                  <button
                    onClick={() => handleUpdateTournamentStatus(t.id, "active")}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Bắt đầu
                  </button>
                )}
                {t.status === "active" && (
                  <button
                    onClick={() => handleUpdateTournamentStatus(t.id, "completed")}
                    className="flex-1 bg-slate-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Kết thúc
                  </button>
                )}
                <button
                  onClick={() => setLocation(`/tools?tournament=${t.id}`)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Trophy className="w-3 h-3" /> Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <SettingsTab />
      )}

      {/* ADD USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-black">Thêm User mới</h2>
            <form onSubmit={handleAddUser} className="space-y-3">
              <input type="text" id="username" name="username" placeholder="Tên đăng nhập" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <input type="password" id="password" name="password" placeholder="Mật khẩu" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <input type="text" id="fullName" name="fullName" placeholder="Họ tên" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <input type="text" id="phone" name="phone" placeholder="Số điện thoại" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <input type="text" id="idCard" name="idCard" placeholder="Căn cước/CMND" value={userForm.idCard} onChange={e => setUserForm({...userForm, idCard: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <select id="role" name="role" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <option value="referee">Trọng tài</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-blue-500 py-3 rounded-xl font-bold text-sm text-white">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-black">Sửa User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <input type="text" id="editFullName" name="fullName" placeholder="Họ tên" value={editingUser.fullName || ""} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <input type="text" id="editPhone" name="phone" placeholder="Số điện thoại" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <input type="text" id="editIdCard" name="idCard" placeholder="Căn cước/CMND" value={editingUser.idCard} onChange={e => setEditingUser({...editingUser, idCard: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <select id="editRole" name="role" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <option value="referee">Trọng tài</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-blue-500 py-3 rounded-xl font-bold text-sm text-white">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-black">Thêm Lịch Công Tác</h2>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <input type="text" id="scheduleTitle" name="title" placeholder="Tiêu đề" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <textarea id="scheduleDescription" name="description" placeholder="Mô tả" value={scheduleForm.description} onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm h-20" />
              <input type="datetime-local" id="scheduleDate" name="date" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <input type="text" id="scheduleLocation" name="location" placeholder="Địa điểm" value={scheduleForm.location} onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <select id="scheduleRefereeId" name="refereeId" value={scheduleForm.refereeId} onChange={e => setScheduleForm({...scheduleForm, refereeId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <option value="">Chọn Trọng tài...</option>
                {users.filter(u => u.role === "referee").map(u => (
                  <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-blue-500 py-3 rounded-xl font-bold text-sm text-white">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-black">Sửa Lịch Công Tác</h2>
            <form onSubmit={handleUpdateSchedule} className="space-y-3">
              <input type="text" id="editScheduleTitle" name="title" placeholder="Tiêu đề" value={editingSchedule.title} onChange={e => setEditingSchedule({...editingSchedule, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" required />
              <textarea id="editScheduleDescription" name="description" placeholder="Mô tả" value={editingSchedule.description || ""} onChange={e => setEditingSchedule({...editingSchedule, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm h-20" />
              <input type="text" id="editScheduleLocation" name="location" placeholder="Địa điểm" value={editingSchedule.location || ""} onChange={e => setEditingSchedule({...editingSchedule, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
              <select id="editScheduleStatus" name="status" value={editingSchedule.status} onChange={e => setEditingSchedule({...editingSchedule, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <option value="assigned">Chờ</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Hủy</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingSchedule(null)} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-blue-500 py-3 rounded-xl font-bold text-sm text-white">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN REFEREE MODAL */}
      {showMatchAssignModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-black">Phân công Trọng tài</h2>
            <div className="bg-slate-50 p-3 rounded-xl text-sm">
              <div className="font-bold">{selectedMatch.team1Player1}/{selectedMatch.team1Player2}</div>
              <div className="text-slate-400">vs</div>
              <div className="font-bold">{selectedMatch.team2Player1}/{selectedMatch.team2Player2}</div>
            </div>
            {/* Group selector */}
            {groups && groups.length > 0 && (
              <select 
                value={selectedGroupForAssign || ""} 
                onChange={e => setSelectedGroupForAssign(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm mb-2"
              >
                <option value="">Chọn nhóm...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
            <select id="assignRefereeId" name="refereeId" value={assignForm.refereeId} onChange={e => setAssignForm({...assignForm, refereeId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
              <option value="">Chọn Trọng tài từ nhóm...</option>
              {(groupMembers || []).map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.user.fullName || m.user.username} ({m.user.phone})
                </option>
              ))}
              {(!groupMembers || groupMembers.length === 0) && (
                <option disabled>Chưa có thành viên trong nhóm</option>
              )}
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowMatchAssignModal(false); setSelectedMatch(null); }} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold text-sm">Hủy</button>
              <button onClick={handleAssignReferee} className="flex-1 bg-blue-500 py-3 rounded-xl font-bold text-sm text-white">Phân công</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
