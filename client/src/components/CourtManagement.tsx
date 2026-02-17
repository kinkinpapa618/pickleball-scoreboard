import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCourts, useCreateCourt, useUpdateCourt, useDeleteCourt } from "@/hooks/use-api";
import { Plus, X, Trash2, Edit2, Check, Circle } from "lucide-react";

const STATUS_COLORS = {
  free: "bg-green-500",
  busy: "bg-red-500",
  waiting: "bg-yellow-500",
};

const STATUS_LABELS = {
  free: "Trống",
  busy: "Đang đấu",
  waiting: "Chờ",
};

export default function CourtManagement() {
  const { data: courts = [], isLoading } = useCourts();
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const deleteCourt = useDeleteCourt();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtType, setNewCourtType] = useState("indoor");

  const handleAddCourt = async () => {
    if (!newCourtName.trim()) return;
    try {
      await createCourt.mutateAsync({
        name: newCourtName,
        type: newCourtType,
        status: "free",
      });
      setNewCourtName("");
      setNewCourtType("indoor");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating court:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: "free" | "busy" | "waiting") => {
    try {
      await updateCourt.mutateAsync({ id, data: { status } });
    } catch (error) {
      console.error("Error updating court:", error);
    }
  };

  const handleDeleteCourt = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sân này?")) return;
    try {
      await deleteCourt.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting court:", error);
    }
  };

  const freeCourts = courts.filter(c => c.status === "free");
  const busyCourts = courts.filter(c => c.status === "busy");
  const waitingCourts = courts.filter(c => c.status === "waiting");

  return (
    <Card className="bg-slate-900/80 border-white/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">
            Quản lý sân
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-[#ccff00] hover:bg-[#b8e600] text-black"
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm sân
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Tên sân (VD: Sân A, Sân 1)"
                value={newCourtName}
                onChange={(e) => setNewCourtName(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
              <select
                value={newCourtType}
                onChange={(e) => setNewCourtType(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-lg px-2"
              >
                <option value="indoor">Trong nhà</option>
                <option value="outdoor">Ngoài trời</option>
              </select>
              <Button
                onClick={handleAddCourt}
                disabled={createCourt.isPending}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-white/50 text-center py-4">Đang tải...</div>
        ) : courts.length === 0 ? (
          <div className="text-white/50 text-center py-4">Chưa có sân nào. Thêm sân để bắt đầu.</div>
        ) : (
          <div className="space-y-3">
            {/* Free courts */}
            {freeCourts.length > 0 && (
              <div>
                <div className="text-white/50 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                  <Circle className={`w-2 h-2 ${STATUS_COLORS.free}`} />
                  Trống ({freeCourts.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {freeCourts.map((court) => (
                    <div
                      key={court.id}
                      className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <span className="text-white font-medium">{court.name}</span>
                      <span className="text-white/40 text-xs">({court.type === "indoor" ? "Trong nhà" : "Ngoài trời"})</span>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "waiting")}
                        className="text-yellow-500 hover:text-yellow-400"
                        title="Đánh dấu chờ"
                      >
                        <Circle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "busy")}
                        className="text-red-500 hover:text-red-400"
                        title="Đánh dấu đang đấu"
                      >
                        <Circle className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="text-white/30 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting courts */}
            {waitingCourts.length > 0 && (
              <div>
                <div className="text-white/50 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                  <Circle className={`w-2 h-2 ${STATUS_COLORS.waiting}`} />
                  Chờ ({waitingCourts.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {waitingCourts.map((court) => (
                    <div
                      key={court.id}
                      className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <span className="text-white font-medium">{court.name}</span>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "free")}
                        className="text-green-500 hover:text-green-400"
                        title="Đánh dấu trống"
                      >
                        <Circle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "busy")}
                        className="text-red-500 hover:text-red-400"
                        title="Đánh dấu đang đấu"
                      >
                        <Circle className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="text-white/30 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Busy courts */}
            {busyCourts.length > 0 && (
              <div>
                <div className="text-white/50 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                  <Circle className={`w-2 h-2 ${STATUS_COLORS.busy}`} />
                  Đang đấu ({busyCourts.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {busyCourts.map((court) => (
                    <div
                      key={court.id}
                      className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <span className="text-white font-medium">{court.name}</span>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "free")}
                        className="text-green-500 hover:text-green-400"
                        title="Đánh dấu trống"
                      >
                        <Circle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(court.id, "waiting")}
                        className="text-yellow-500 hover:text-yellow-400"
                        title="Đánh dấu chờ"
                      >
                        <Circle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="text-white/30 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
