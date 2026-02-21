import { useParams, useLocation } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Calendar,
  Target,
  XCircle,
  RefreshCw,
  Timer,
  Lock,
  Award,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

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

function formatTime(timestamp: number | string, matchStartTime: Date | null): string {
  if (!matchStartTime) return "00:00";
  
  let seconds: number;
  
  if (typeof timestamp === "string") {
    const eventTime = new Date(timestamp).getTime();
    seconds = Math.floor((eventTime - matchStartTime.getTime()) / 1000);
  } else {
    seconds = Math.floor((timestamp - matchStartTime.getTime()) / 1000);
  }
  
  if (seconds < 0) seconds = 0;
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

function getEventIcon(type: string) {
  switch (type) {
    case "score":
      return { icon: Target, color: "text-blue-600", bg: "bg-blue-100" };
    case "fault":
      return { icon: XCircle, color: "text-red-600", bg: "bg-red-100" };
    case "switch-sides":
      return { icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-100" };
    case "timeout":
      return { icon: Timer, color: "text-yellow-600", bg: "bg-yellow-100" };
    case "stacking":
      return { icon: Lock, color: "text-slate-600", bg: "bg-slate-100" };
    case "yellow-card":
      return { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-100" };
    case "red-card":
      return { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" };
    case "undo":
      return { icon: RotateCcw, color: "text-slate-500", bg: "bg-slate-100" };
    default:
      return { icon: Award, color: "text-slate-600", bg: "bg-slate-100" };
  }
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
          const end = (match as any).endTime
            ? new Date((match as any).endTime).getTime()
            : Date.now();
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-bold text-slate-900">
              {match.team1Player1} + {match.team1Player2}
            </span>
          </div>
          <span className="text-3xl font-black italic text-blue-600">
            {match.scoreTeam1}
          </span>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm font-bold text-slate-900">
              {match.team2Player1} + {match.team2Player2}
            </span>
          </div>
          <span className="text-3xl font-black italic text-orange-500">
            {match.scoreTeam2}
          </span>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Thời lượng</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {duration > 0
                ? formatDuration(duration)
                : formatTime(
                    match.startTime
                      ? (Date.now() - new Date(match.startTime).getTime()) / 1000
                      : 0,
                    null
                  )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Ngày thi đấu</span>
            </div>
            <span className="text-sm font-medium text-slate-700">
              {match.date
                ? new Date(match.date).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "..."}
            </span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-black text-slate-900 mb-3">Lịch sử trận đấu</h2>

      {timeline.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-slate-400 text-sm">Chưa có dữ liệu lịch sử</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...timeline].reverse().map((event, index) => {
            const { icon: Icon, color, bg } = getEventIcon(event.type);
            return (
              <div
                key={event.id || index}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className={`w-8 h-8 mx-auto rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-1">
                      {formatTime(event.timestamp, match.startTime ? new Date(match.startTime) : null)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">
                      {event.type === "score" && (
                        <>Ghi điểm - Team {event.scorerTeam}</>
                      )}
                      {event.type === "fault" && "Lỗi / Đổi giao"}
                      {event.type === "switch-sides" && "Đổi phía"}
                      {event.type === "timeout" && "Timeout"}
                      {event.type === "stacking" && `Stacking: ${event.playerName || ""}`}
                      {event.type === "yellow-card" && `Thẻ vàng: ${event.playerName || ""}`}
                      {event.type === "red-card" && `Thẻ đỏ: ${event.playerName || ""}`}
                      {event.type === "undo" && "Hoàn tác"}
                    </div>
                    {event.type === "score" && (
                      <div className="text-xs text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Tỷ số:</span>
                          <span className="font-semibold">{event.score1} - {event.score2}</span>
                        </span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center gap-1">
                          <span>Server:</span>
                          <span className="font-medium">P{event.serverHand}</span>
                        </span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center gap-1">
                          <span>Phát:</span>
                          <span className="font-medium">{event.serverPlayer}</span>
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
