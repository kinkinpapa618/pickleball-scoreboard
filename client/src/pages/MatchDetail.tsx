import { useParams, useLocation } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Trophy, Calendar } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: string;
  team: 1 | 2 | null;
  timestamp: number;
  score1?: number;
  score2?: number;
  playerName?: string;
  serverPlayer?: string;
  serverTeam?: number;
  serverHand?: number;
  scorerTeam?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}p ${seconds}gi`;
  }
  if (minutes > 0) {
    return `${minutes}p ${seconds}gi`;
  }
  return `${seconds}gi`;
}

export default function MatchDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: match } = useMatch(parseInt(id || "0"));
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (match?.timeline) {
      try {
        const parsed = JSON.parse(match.timeline);
        setTimeline(parsed);
        
        if (match.startTime) {
          const start = new Date(match.startTime).getTime();
          const end = (match as any).endTime ? new Date((match as any).endTime).getTime() : Date.now();
          setDuration(end - start);
        }
      } catch (e) {
        console.error("Failed to parse timeline", e);
      }
    }
  }, [match]);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setLocation("/tools")}
          className="p-2 bg-white rounded-xl hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black italic uppercase text-slate-900">
          Chi tiết trận đấu
        </h1>
      </div>

      {/* Match Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold text-slate-900">
              {match.team1Player1} + {match.team1Player2}
            </span>
          </div>
          <span className="text-2xl font-black italic text-blue-500">
            {match.scoreTeam1}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-bold text-slate-900">
              {match.team2Player1} + {match.team2Player2}
            </span>
          </div>
          <span className="text-2xl font-black italic text-orange-500">
            {match.scoreTeam2}
          </span>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Thời gian thi đấu:</span>
              <span className="text-sm font-black text-slate-900">
                {duration > 0 ? formatDuration(duration) : formatTime(match.startTime ? (Date.now() - new Date(match.startTime).getTime()) / 1000 : 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Ngày:</span>
            <span className="text-sm font-medium text-slate-900">
              {match.date ? new Date(match.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              }) : "..."}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-lg font-black text-slate-900 mb-3">Lịch sử trận đấu</h2>
      
      {timeline.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-slate-400 text-sm">Chưa có dữ liệu timeline</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...timeline].reverse().map((event, index) => (
            <div
              key={event.id || index}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3"
            >
              <div className="text-xs font-black text-slate-400 w-12">
                {formatTime(event.timestamp)}
              </div>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                event.type === "score" 
                  ? (event.team === 1 ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600")
                  : event.type === "fault"
                  ? "bg-red-100 text-red-600"
                  : event.type === "timeout"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {event.type === "score" && "⚽"}
                {event.type === "fault" && "❌"}
                {event.type === "switch-sides" && "🔄"}
                {event.type === "timeout" && "⏱"}
                {event.type === "stacking" && "🔒"}
                {event.type === "yellow-card" && "🟨"}
                {event.type === "red-card" && "🟥"}
                {event.type === "undo" && "↩"}
              </div>

              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">
                  {event.type === "score" && (
                    <>Ghi điểm - Team {event.scorerTeam}</>
                  )}
                  {event.type === "fault" && "Lỗi/Đổi giao"}
                  {event.type === "switch-sides" && "Đổi phía"}
                  {event.type === "timeout" && "Timeout"}
                  {event.type === "stacking" && `Stacking: ${event.playerName || ""}`}
                  {event.type === "yellow-card" && `Thẻ vàng: ${event.playerName || ""}`}
                  {event.type === "red-card" && `Thẻ đỏ: ${event.playerName || ""}`}
                  {event.type === "undo" && "Hoàn tác"}
                </div>
                {event.type === "score" && (
                  <div className="text-xs text-slate-500">
                    Tỷ số: {event.score1} - {event.score2} | Server: P{event.serverHand} | Người phát: {event.serverPlayer}
                  </div>
                )}
              </div>

              <div className="text-lg font-black italic text-slate-300">
                {event.score1 !== undefined && `${event.score1}-${event.score2}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
