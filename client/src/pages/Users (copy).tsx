import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Shield,
  Trash2,
  Edit2,
  Plus,
} from "lucide-react";

interface UserData {
  id: number;
  username: string;
  fullName: string | null;
  phone: string;
  idCard: string;
  role: string;
}

export default function Users() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    idCard: "",
    role: "referee",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({ title: "Thêm người dùng thành công" });
        setShowAddModal(false);
        setFormData({
          username: "",
          password: "",
          fullName: "",
          phone: "",
          idCard: "",
          role: "referee",
        });
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Thất bại", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
        toast({ title: "Cập nhật thất bại", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400";
      case "manager":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-emerald-500/20 text-emerald-400";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "manager":
        return "Quản lý";
      default:
        return "Trọng tài";
    }
  };

  return (
    <div className="p-4 space-y-4 min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/profile")}
          className="p-2 bg-slate-900 rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black italic uppercase text-white">
          Quản lý <span className="text-[#ccff00]">Users</span>
        </h1>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-[#ccff00] text-black py-3 rounded-xl font-black flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Thêm người dùng
      </button>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-2 border-orange-500 rounded-full border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-slate-900 p-4 rounded-2xl border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-400">
                    {user.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {user.fullName || user.username}
                    </h3>
                    <p className="text-xs text-slate-500">@{user.username}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="w-4 h-4" />
                  {user.idCard}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h2 className="text-xl font-black">Thêm người dùng mới</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                required
              />
              <input
                type="text"
                placeholder="Họ tên"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                required
              />
              <input
                type="text"
                placeholder="Căn cước/CMND"
                value={formData.idCard}
                onChange={(e) =>
                  setFormData({ ...formData, idCard: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                required
              />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="referee">Trọng tài</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-800 py-3 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ccff00] text-black py-3 rounded-xl font-bold"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h2 className="text-xl font-black">Cập nhật người dùng</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                placeholder="Họ tên"
                value={editingUser.fullName || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, fullName: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={editingUser.phone}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                placeholder="Căn cước/CMND"
                value={editingUser.idCard}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, idCard: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              />
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="referee">Trọng tài</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-800 py-3 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ccff00] text-black py-3 rounded-xl font-bold"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
