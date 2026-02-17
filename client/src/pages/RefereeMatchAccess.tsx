import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Target, MapPin, Calendar, Clock } from "lucide-react";

interface TournamentMatch {
  id: number;
  tournamentId: number;
  matchId?: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  groupName: string | null;
  round: number | null;
  matchOrder: number | null;
  status: "pending" | "scheduled" | "live" | "completed";
  refereeId: number | null;
  refereeToken: string | null;
  tournamentName?: string;
}

export default function RefereeMatchAccess() {
  const { token } = useParams();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/matches/token/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy trận đấu");
        return res.json();
      })
      .then((data) => {
        setMatch(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">Lỗi</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-[#ccff00] mx-auto mb-2" />
          <h1 className="text-2xl font-black text-white uppercase italic">
            {match.tournamentName || "Giải đấu"}
          </h1>
          <p className="text-white/50 text-sm">Link truy cập trọng tài</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Bảng</span>
              <span className="text-[#ccff00] font-bold">{match.groupName || "-"}</span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold">Đội 1</span>
              </div>
              <p className="text-white ml-6">{match.team1Player1}</p>
              <p className="text-white ml-6">{match.team1Player2}</p>
            </div>

            <div className="text-center py-2">
              <span className="text-white/50 text-sm">VS</span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                <span className="text-white font-bold">Đội 2</span>
              </div>
              <p className="text-white ml-6">{match.team2Player1}</p>
              <p className="text-white ml-6">{match.team2Player2}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <span className="text-white/70">Trạng thái</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                match.status === "live" ? "bg-green-500/20 text-green-400" :
                match.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                "bg-slate-500/20 text-slate-400"
              }`}>
                {match.status === "live" ? "Đang thi đấu" :
                 match.status === "scheduled" ? "Đã lên lịch" :
                 match.status === "completed" ? "Đã kết thúc" : "Chờ"}
              </span>
            </div>

            <Button
              className="w-full bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold py-4 rounded-2xl mt-4"
              onClick={() => {
                // Tạo trận đấu mới hoặc chuyển đến trận đấu
                if (match.matchId) {
                  window.location.href = `/match?matchId=${match.matchId}`;
                } else {
                  alert("Trận đấu chưa được tạo. Vui lòng liên hệ ban tổ chức.");
                }
              }}
            >
              <Target className="w-5 h-5 mr-2" />
              Vào điều khiển trận đấu
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-white/30 text-xs mt-6">
          Link có hiệu lực với vai trò trọng tài được phân công
        </p>
      </div>
    </div>
  );
}
