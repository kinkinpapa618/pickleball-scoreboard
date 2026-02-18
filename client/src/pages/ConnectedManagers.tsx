import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Users,
  Link2,
  Link2Off,
  Plus,
  Check,
  X,
  Search,
} from "lucide-react";

interface Manager {
  id: number;
  username: string;
  fullName: string | null;
  phone: string;
}

interface ConnectedManager extends Manager {}

export default function ConnectedManagers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [connectedManagers, setConnectedManagers] = useState<ConnectedManager[]>([]);
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.role !== "referee") {
      setLocation("/profile");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [connectedRes, allRes] = await Promise.all([
        fetch("/api/connected-managers", { credentials: "same-origin" }),
        fetch("/api/managers", { credentials: "same-origin" }),
      ]);
      
      if (connectedRes.ok) {
        setConnectedManagers(await connectedRes.json());
      }
      if (allRes.ok) {
        const all = await allRes.json();
        // Lọc bỏ những manager đã kết nối
        const connectedIds = connectedManagers.map((m) => m.id);
        setAvailableManagers(all.filter((m: Manager) => !connectedIds.includes(m.id)));
      }
    } catch (error) {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (managerId: number) => {
    try {
      const res = await fetch(`/api/connect-manager/${managerId}`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (res.ok) {
        toast({ title: "Kết nối thành công" });
        setShowAddModal(false);
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Lỗi", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  const handleDisconnect = async (managerId: number) => {
    try {
      const res = await fetch(`/api/disconnect-manager/${managerId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        toast({ title: "Hủy kết nối thành công" });
        fetchData();
      } else {
        toast({ title: "Lỗi", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  const filteredManagers = availableManagers.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 min-h-screen pb-20 bg-[#F8FAFC]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/profile")}
          className="p-2 bg-white rounded-xl hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black italic uppercase text-slate-900">
          Kết nối <span className="text-blue-600">Manager</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-2 border-orange-500 rounded-full border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Connected Managers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h2 className="font-bold text-blue-900 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Đã kết nối ({connectedManagers.length})
              </h2>
            </div>
            
            {connectedManagers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa kết nối với Manager nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {connectedManagers.map((manager) => (
                  <div key={manager.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {manager.fullName
                          ? manager.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                          : manager.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {manager.fullName || manager.username}
                        </div>
                        <div className="text-xs text-slate-400">@{manager.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(manager.id)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                    >
                      <Link2Off className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm kết nối
          </button>

          {/* Info Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-bold text-amber-800 mb-2">💡 Hướng dẫn</h3>
            <p className="text-sm text-amber-700">
              Kết nối với Manager để xem các trận đấu của họ. 
              Sau khi kết nối, bạn sẽ thấy các trận đấu của Manager trong lịch sử trận đấu.
            </p>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-900">Thêm kết nối</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm Manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-900"
              />
            </div>

            {/* Managers List */}
            {filteredManagers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không tìm thấy Manager</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredManagers.map((manager) => (
                  <div
                    key={manager.id}
                    className="p-3 bg-slate-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {manager.fullName
                          ? manager.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                          : manager.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {manager.fullName || manager.username}
                        </div>
                        <div className="text-xs text-slate-400">@{manager.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(manager.id)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
