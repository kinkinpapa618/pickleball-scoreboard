import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch, useUpdateMatch, useMatch } from "@/hooks/use-api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Court, StackingMap } from "@/components/Court";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trophy,
  CheckCircle2,
  AlertOctagon,
  Undo2,
  Home,
  ShieldAlert,
  Layers,
  UserCog,
  Lock,
  Clock,
  Play,
  Pause,
  Timer,
  StopCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

interface PlayerPenalty {
  yellow: number;
  red: boolean;
}
interface PenaltiesState {
  [key: string]: PlayerPenalty;
}

type TimelineEventType = "score" | "fault" | "switch-sides" | "yellow-card" | "red-card" | "stacking" | "undo" | "timeout";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  team: 1 | 2 | null;
  playerName?: string;
  timestamp: number;
  score1: number;
  score2: number;
  serverPlayer?: string;
  serverTeam?: 1 | 2;
  serverHand?: 1 | 2;
  scorerTeam?: 1 | 2;
}

export default function Match() {
  const [, setLocation] = useLocation();
  const search = new URLSearchParams(window.location.search);
  const matchId = parseInt(search.get("matchId") || "0");

  const names = {
    t1p1: search.get("t1p1") || "P1",
    t1p2: search.get("t1p2") || "P2",
    t2p1: search.get("t2p1") || "P3",
    t2p2: search.get("t2p2") || "P4",
  };
  const winningScore = parseInt(search.get("win") || "11");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;

  const { state, scorePoint, fault, undo, getMatchData, resetState } =
    useGameLogic(winningScore, initialServer, names);

  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const { data: serverMatch } = useMatch(matchId);
  const [saved, setSaved] = useState(false);

  // --- KHÔI PHỤC ĐIỂM KHI VÀO TRẬN (nếu có matchId và đang live) ---
  useEffect(() => {
    if (serverMatch && serverMatch.status === "live" && !state.winner) {
      if (
        serverMatch.scoreTeam1 !== state.score1 ||
        serverMatch.scoreTeam2 !== state.score2
      ) {
        resetState({
          score1: serverMatch.scoreTeam1,
          score2: serverMatch.scoreTeam2,
        });
      }
      
      // Restore timeouts
      if (serverMatch.timeouts) {
        try {
          const savedTimeouts = JSON.parse(serverMatch.timeouts);
          setTimeouts(savedTimeouts);
        } catch (e) {
          console.error("Failed to parse timeouts", e);
        }
      }
      
      // Restore timeline
      if (serverMatch.timeline) {
        try {
          const savedTimeline = JSON.parse(serverMatch.timeline);
          setTimeline(savedTimeline);
        } catch (e) {
          console.error("Failed to parse timeline", e);
        }
      }
    }
  }, [serverMatch?.id, resetState]);

  // --- XỬ LÝ GHI ĐIỂM + TỰ ĐỘNG LƯU SERVER ---
  const handleScorePoint = () => {
    const isTeam1Serving = state.serverTeam === 1;
    const scoringTeam = isTeam1Serving ? 1 : 2;
    const serverPlayerId = `t${state.serverTeam}p${state.serverHand}`;
    const serverPlayerName = names[serverPlayerId as keyof typeof names];
    scorePoint();
    addTimelineEvent("score", scoringTeam, {
      serverPlayer: serverPlayerName,
      serverTeam: state.serverTeam,
      serverHand: state.serverHand,
      scorerTeam: scoringTeam,
    });
    if (matchId > 0) {
      const isTeam1Serving = state.serverTeam === 1;
      updateMatch.mutate({
        id: matchId,
        data: {
          scoreTeam1: isTeam1Serving ? state.score1 + 1 : state.score1,
          scoreTeam2: !isTeam1Serving ? state.score2 + 1 : state.score2,
          status: "live",
        },
      });
    }
  };

  // --- XỬ LÝ LỖI/ĐỔI GIAO + TỰ ĐỘNG LƯU SERVER ---
  const handleFault = () => {
    const serverPlayerId = `t${state.serverTeam}p${state.serverHand}`;
    const serverPlayerName = names[serverPlayerId as keyof typeof names];
    fault();
    addTimelineEvent("fault", state.serverTeam === 1 ? 2 : 1, {
      serverPlayer: serverPlayerName,
      serverTeam: state.serverTeam,
      serverHand: state.serverHand,
    });
    if (matchId > 0) {
      updateMatch.mutate({
        id: matchId,
        data: {
          scoreTeam1: state.score1,
          scoreTeam2: state.score2,
          status: "live",
        },
      });
    }
  };

  // --- XỬ LÝ KẾT THÚC TRẬN ĐẤU (tự động lưu) ---
  useEffect(() => {
    if (state.winner && !saved) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

      if (matchId > 0) {
        updateMatch.mutate({
          id: matchId,
          data: {
            scoreTeam1: state.score1,
            scoreTeam2: state.score2,
            winnerTeam: state.winner,
            status: "finished",
          },
        });
      } else {
        // Nếu không có matchId (trận mới), tạo mới
        const rawData = getMatchData();
        if (rawData) {
          createMatch.mutate({
            team1Player1: names.t1p1,
            team1Player2: names.t1p2,
            team2Player1: names.t2p1,
            team2Player2: names.t2p2,
            winningScore: winningScore,
            scoreTeam1: state.score1,
            scoreTeam2: state.score2,
            winnerTeam: state.winner,
            status: "finished",
            isServer1: false,
            isServer2: false,
            serverNumber: 1,
          });
        }
      }
      setSaved(true);
    }
  }, [
    state.winner,
    saved,
    matchId,
    state.score1,
    state.score2,
    names,
    winningScore,
    getMatchData,
    createMatch,
    updateMatch,
  ]);

  // --- STACKING & PENALTIES (giữ nguyên từ code chính) ---
  const [stackingMap, setStackingMap] = useState<StackingMap>({});
  const [penalties, setPenalties] = useState<PenaltiesState>({
    t1p1: { yellow: 0, red: false },
    t1p2: { yellow: 0, red: false },
    t2p1: { yellow: 0, red: false },
    t2p2: { yellow: 0, red: false },
  });
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (!matchStartTime) {
      setMatchStartTime(Date.now());
      setIsTimerRunning(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && matchStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, matchStartTime]);

  useEffect(() => {
    if (state.winner) {
      setIsTimerRunning(false);
    }
  }, [state.winner]);

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [timeouts, setTimeouts] = useState<{ team1: number; team2: number }>({ team1: 2, team2: 2 });
  const [isTimeoutActive, setIsTimeoutActive] = useState(false);
  const [timeoutTeam, setTimeoutTeam] = useState<1 | 2 | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState(180);

  useEffect(() => {
    if (matchId > 0 && timeouts) {
      updateMatch.mutate({
        id: matchId,
        data: {
          timeouts: JSON.stringify(timeouts),
        },
      });
    }
  }, [timeouts, matchId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimeoutActive && timeoutSeconds > 0) {
      interval = setInterval(() => {
        setTimeoutSeconds((prev) => {
          if (prev <= 1) {
            setIsTimeoutActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimeoutActive, timeoutSeconds]);

  const startTimeout = (team: 1 | 2) => {
    if (timeouts[`team${team}`] > 0 && !isTimeoutActive && !state.winner) {
      setTimeoutTeam(team);
      setTimeoutSeconds(180);
      setIsTimeoutActive(true);
      setTimeouts((prev) => ({
        ...prev,
        [`team${team}`]: prev[`team${team}`] - 1,
      }));
      addTimelineEvent("timeout", team);
    }
  };

  const stopTimeout = () => {
    setIsTimeoutActive(false);
  };

  const addTimelineEvent = (
    type: TimelineEventType,
    team: 1 | 2 | null,
    options?: {
      playerName?: string;
      serverPlayer?: string;
      serverTeam?: 1 | 2;
      serverHand?: 1 | 2;
      scorerTeam?: 1 | 2;
    }
  ) => {
    const event: TimelineEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      team,
      playerName: options?.playerName,
      timestamp: Date.now(),
      score1: state.score1,
      score2: state.score2,
      serverPlayer: options?.serverPlayer,
      serverTeam: options?.serverTeam,
      serverHand: options?.serverHand,
      scorerTeam: options?.scorerTeam,
    };
    setTimeline((prev) => {
      const newTimeline = [...prev, event];
      if (matchId > 0) {
        updateMatch.mutate({
          id: matchId,
          data: {
            timeline: JSON.stringify(newTimeline),
          },
        });
      }
      return newTimeline;
    });
  };

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    team: 1 | 2;
    name: string;
    currentSide: "left" | "right";
  } | null>(null);

  const giveCard = (playerKey: string, type: "yellow" | "red") => {
    const playerName = names[playerKey as keyof typeof names];
    setPenalties((prev) => {
      const newState = { ...prev };
      newState[playerKey] = { ...prev[playerKey] };
      if (type === "yellow") {
        newState[playerKey].yellow += 1;
        addTimelineEvent("yellow-card", playerKey.startsWith("t1") ? 1 : 2, { playerName });
        if (newState[playerKey].yellow >= 2) handleForfeit(playerKey);
      } else {
        newState[playerKey].red = true;
        addTimelineEvent("red-card", playerKey.startsWith("t1") ? 1 : 2, { playerName });
        handleForfeit(playerKey);
      }
      return newState;
    });
    setSelectedPlayer(null);
  };

  const handleForfeit = (loserKey: string) => {
    const winningTeam = loserKey.startsWith("t1") ? 2 : 1;
    // Cập nhật winner trong state (có thể dùng resetState hoặc force)
    // Ở đây ta tạm thời set winner bằng cách mutate state trực tiếp?
    // Tốt nhất nên có hàm xử lý riêng trong gameLogic, nhưng tạm thời ta dùng cách này.
    // Vì đây là demo, ta sẽ set winner qua một biến riêng?
    // Thực tế, nên có action "forfeit" trong gameLogic. Nhưng để đơn giản, ta sẽ dùng một state phụ.
    // Tôi sẽ thêm một useEffect theo dõi forfeit, nhưng để gọn, tôi tạm thời gán state.winner bằng cách clone?
    // Không nên mutate state trực tiếp. Ta sẽ tạo một biến winner tạm và dùng nó để hiển thị modal.
    // Cách tốt nhất: gọi một hàm từ gameLogic, nhưng hook chưa có. Tạm thời, ta dùng một state riêng.
    // Ở đây, tôi sẽ giữ nguyên logic của code chính: gán (state as any).winner = winningTeam.
    // Lưu ý: cách này không an toàn, nhưng để giữ đúng code chính.
    (state as any).winner = winningTeam;
  };

  const togglePlayerStacking = () => {
    if (!selectedPlayer) return;
    const { id, team, currentSide, name } = selectedPlayer;

    const wasStacking = stackingMap[id];
    
    setStackingMap((prev) => {
      const newMap = { ...prev };
      if (newMap[id]) {
        delete newMap[id];
      } else {
        const teammateId = id === `t${team}p1` ? `t${team}p2` : `t${team}p1`;
        if (newMap[teammateId]) delete newMap[teammateId];
        newMap[id] = currentSide;
      }
      return newMap;
    });
    
    if (!wasStacking) {
      addTimelineEvent("stacking", team, { playerName: name });
    }
  };

  const isCurrentPlayerStacking = selectedPlayer
    ? !!stackingMap[selectedPlayer.id]
    : false;

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case "score":
        return <CheckCircle2 className="w-3 h-3" />;
      case "fault":
        return <AlertOctagon className="w-3 h-3" />;
      case "yellow-card":
        return <ShieldAlert className="w-3 h-3 text-yellow-500" />;
      case "red-card":
        return <ShieldAlert className="w-3 h-3 text-red-500" />;
      case "stacking":
        return <Layers className="w-3 h-3 text-indigo-400" />;
      case "undo":
        return <Undo2 className="w-3 h-3" />;
      case "timeout":
        return <Timer className="w-3 h-3 text-yellow-400" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: TimelineEventType, team: 1 | 2 | null) => {
    switch (type) {
      case "score":
        return team === 1 ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "fault":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "yellow-card":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "red-card":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "stacking":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "undo":
        return "bg-white/10 text-white/50 border-white/20";
      case "timeout":
        return team === 1 ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-white/10 text-white/50 border-white/20";
    }
  };

  const getEventLabel = (event: TimelineEvent) => {
    switch (event.type) {
      case "score":
        return event.team === 1 ? "+1 T1" : "+1 T2";
      case "fault":
        return "Lỗi/Đổi giao";
      case "yellow-card":
        return `${event.playerName} 🟨`;
      case "red-card":
        return `${event.playerName} 🟥`;
      case "stacking":
        return `${event.playerName} Stacking`;
      case "undo":
        return "Hoàn tác";
      case "timeout":
        return `T${event.team} Timeout`;
      default:
        return "";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const [prevHistoryLength, setPrevHistoryLength] = useState(state.gameHistory.length);
  
  useEffect(() => {
    if (state.gameHistory.length < prevHistoryLength) {
      setTimeline((prev) => {
        const newTimeline = [...prev];
        const lastScoreIndex = newTimeline.length - 1;
        if (lastScoreIndex >= 0 && newTimeline[lastScoreIndex].type === "score") {
          newTimeline.pop();
        } else if (lastScoreIndex >= 0 && newTimeline[lastScoreIndex].type === "fault") {
          newTimeline.pop();
        }
        return newTimeline;
      });
    }
    setPrevHistoryLength(state.gameHistory.length);
  }, [state.gameHistory.length, prevHistoryLength]);

  // Lấy giá trị firstServe từ state (theo hook mới nhất)
  const isFirstServeActive = state.isFirstServeOfMatch;
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="px-3 py-2 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-white/40 hover:text-white h-9 w-9"
        >
          <Home className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black rounded-lg border border-white/10">
            {isTimerRunning ? (
              <Play className="w-2.5 h-2.5 text-green-400" />
            ) : state.winner ? (
              <Trophy className="w-2.5 h-2.5 text-[#ccff00]" />
            ) : (
              <Pause className="w-2.5 h-2.5 text-yellow-400" />
            )}
            <span className="text-sm font-black italic text-white leading-none">
              {formatTimerDisplay(elapsedSeconds)}
            </span>
          </div>
          <div className="px-2 py-1 bg-black rounded-lg border border-white/10">
            <span className="text-xs font-black text-white/60 leading-none">
              {state.serverTeam === 1 
                ? `${state.score1}-${state.score2}-${state.serverHand}`
                : `${state.score2}-${state.score1}-${state.serverHand}`
              }
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            undo();
            addTimelineEvent("undo", null);
          }}
          disabled={state.gameHistory.length === 0}
          className="text-white/40 hover:text-[#ccff00] h-9 w-9"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-3 space-y-3 max-w-3xl mx-auto w-full overflow-hidden">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 backdrop-blur-md">
          <ScoreBoard
            score1={state.score1}
            score2={state.score2}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            compact
          />
        </div>

        {timeline.length > 0 && (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-2 backdrop-blur-md">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {[...timeline].reverse().slice(0, 8).map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`flex-shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${getEventColor(event.type, event.team)} hover:opacity-80 transition-opacity`}
                >
                  {getEventIcon(event.type)}
                  <span className="whitespace-nowrap">
                    {event.type === "score" ? `${event.score1}-${event.score2}` : getEventLabel(event)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
          <Court
            positions={state.positions}
            serverTeam={state.serverTeam}
            serverHand={state.serverHand}
            names={names}
            score1={state.score1}
            score2={state.score2}
            firstServe={isFirstServeActive}
            compact
            stackingMap={stackingMap}
            penalties={penalties}
            onPlayerClick={(id, team, name, currentSide) =>
              setSelectedPlayer({ id, team, name, currentSide })
            }
          />
          <div className="flex justify-center gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => startTimeout(1)}
              disabled={!!state.winner || timeouts.team1 === 0 || isTimeoutActive}
              className="h-9 px-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1.5 text-cyan-400"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black italic">
                T1 ({timeouts.team1})
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => startTimeout(2)}
              disabled={!!state.winner || timeouts.team2 === 0 || isTimeoutActive}
              className="h-9 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 text-rose-400"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black italic">
                T2 ({timeouts.team2})
              </span>
            </motion.button>
          </div>
          <div className="text-center mt-1 text-[9px] text-white/30 italic">
            * Chạm cầu thủ để Stacking / Thẻ phạt
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleScorePoint}
            disabled={!!state.winner}
            className="h-16 rounded-2xl bg-[#ccff00] flex flex-col items-center justify-center text-black shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black italic uppercase">
              GHI ĐIỂM
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFault}
            disabled={!!state.winner}
            className="h-16 rounded-2xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center text-white"
          >
            <AlertOctagon className="w-5 h-5 mb-1 text-rose-500" />
            <span className="text-[10px] font-black italic uppercase text-white/60">
              LỖI / ĐỔI GIAO
            </span>
          </motion.button>
        </div>
      </main>

      {/* Modal chiến thuật (Stacking & Penalties) */}
      <Dialog
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      >
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-3xl p-6">
          {selectedPlayer && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPlayer.team === 1
                        ? "bg-cyan-500 text-black"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Cài đặt cầu thủ
                    </div>
                    <div className="text-xl font-black italic">
                      {selectedPlayer.name}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Stacking Toggle */}
              <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCurrentPlayerStacking ? (
                    <Lock className="w-5 h-5 text-[#ccff00]" />
                  ) : (
                    <Layers className="w-5 h-5 text-indigo-400" />
                  )}
                  <div>
                    <div
                      className={`font-bold text-sm ${
                        isCurrentPlayerStacking
                          ? "text-[#ccff00]"
                          : "text-white"
                      }`}
                    >
                      {isCurrentPlayerStacking
                        ? "ĐANG STACKING"
                        : "Bật Stacking"}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {isCurrentPlayerStacking
                        ? `Khóa vị trí: ${stackingMap[selectedPlayer.id] === "left" ? "Trái" : "Phải"}`
                        : "Giữ vị trí hiện tại"}
                    </div>
                  </div>
                </div>
                <div
                  onClick={togglePlayerStacking}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    isCurrentPlayerStacking ? "bg-[#ccff00]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isCurrentPlayerStacking
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              {/* Penalty Controls */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-white/40 uppercase ml-1">
                  Xử lý vi phạm
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => giveCard(selectedPlayer.id, "yellow")}
                    className="h-12 bg-yellow-400/10 border border-yellow-400/30 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 hover:text-black hover:border-transparent transition-all group"
                  >
                    <ShieldAlert className="w-4 h-4 text-yellow-500 group-hover:text-black" />
                    <span className="font-bold text-yellow-500 group-hover:text-black text-sm">
                      THẺ VÀNG
                    </span>
                  </button>
                  <button
                    onClick={() => giveCard(selectedPlayer.id, "red")}
                    className="h-12 bg-red-600/10 border border-red-600/30 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white hover:border-transparent transition-all group"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-500 group-hover:text-white" />
                    <span className="font-bold text-red-500 group-hover:text-white text-sm">
                      THẺ ĐỎ
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Timeline Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-[2rem] p-6">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(selectedEvent.type, selectedEvent.team)} border`}>
                    {getEventIcon(selectedEvent.type)}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Chi tiết sự kiện
                    </div>
                    <div className="text-lg font-black italic">
                      {getEventLabel(selectedEvent)}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase">Thời gian</span>
                  <span className="text-sm font-bold text-white">{formatTime(selectedEvent.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase">Tỷ số</span>
                  <span className="text-sm font-black text-white">
                    <span className="text-cyan-400">{selectedEvent.score1}</span>
                    <span className="text-white/30 mx-1">-</span>
                    <span className="text-rose-400">{selectedEvent.score2}</span>
                  </span>
                </div>
                
                {(selectedEvent.type === "score" || selectedEvent.type === "fault") && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase">Người phát</span>
                      <span className="text-sm font-bold text-white">
                        {selectedEvent.serverPlayer || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase">Đội phát</span>
                      <span className={`text-sm font-bold ${selectedEvent.serverTeam === 1 ? "text-cyan-400" : "text-rose-400"}`}>
                        Team {selectedEvent.serverTeam}
                      </span>
                    </div>
                    {selectedEvent.type === "score" && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase">Ghi điểm</span>
                        <span className={`text-sm font-bold ${selectedEvent.scorerTeam === 1 ? "text-cyan-400" : "text-rose-400"}`}>
                          Team {selectedEvent.scorerTeam}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(selectedEvent.type === "yellow-card" || selectedEvent.type === "red-card") && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase">Cầu thủ</span>
                    <span className="text-sm font-bold text-white">{selectedEvent.playerName}</span>
                  </div>
                )}

                {selectedEvent.type === "stacking" && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase">Cầu thủ</span>
                    <span className="text-sm font-bold text-white">{selectedEvent.playerName}</span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => setSelectedEvent(null)}
                className="w-full text-white/40 hover:text-white"
              >
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Timeout Modal */}
      <Dialog open={isTimeoutActive}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10 rounded-[2rem] p-8 text-center">
          <Timer className={`w-20 h-20 mx-auto mb-4 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-yellow-400"}`} />
          <DialogTitle className="text-3xl font-black italic text-white uppercase mb-2">
            TIMEOUT
          </DialogTitle>
          <p className={`text-xl font-black italic mb-6 ${timeoutTeam === 1 ? "text-cyan-400" : "text-rose-400"}`}>
            TEAM {timeoutTeam}
          </p>
          
          <div className={`text-7xl font-black mb-6 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-white"}`}>
            {formatTimerDisplay(timeoutSeconds)}
          </div>

          <Button
            onClick={stopTimeout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black italic h-14 rounded-xl"
          >
            <StopCircle className="w-5 h-5 mr-2" />
            DỪNG TIMEOUT
          </Button>
        </DialogContent>
      </Dialog>

      {/* Winner Modal */}
      <Dialog open={!!state.winner}>
        <DialogContent className="max-w-xs bg-slate-900 border-white/10 rounded-[2rem] p-8 text-center">
          <Trophy className="w-16 h-16 text-[#ccff00] mb-4 mx-auto" />
          <DialogTitle className="text-2xl font-black italic text-white uppercase mb-2">
            Victory!
          </DialogTitle>
          <p
            className={`text-xl font-black italic mb-6 ${
              state.winner === 1 ? "text-cyan-400" : "text-rose-500"
            }`}
          >
            TEAM {state.winner === 1 ? "01" : "02"}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-[#ccff00] text-black font-black italic h-12 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> ĐẤU LẠI
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="w-full text-white/40 font-bold uppercase text-[10px]"
            >
              Về trang chủ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
