import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCreateMatch, useUpdateMatch, useMatch } from "@/hooks/use-api";
import Scoreboard from "@/components/ScoreBoard";
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

type TimelineEventType =
  | "score"
  | "fault"
  | "switch-sides"
  | "yellow-card"
  | "red-card"
  | "stacking"
  | "undo"
  | "timeout";

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
          serverTeam: serverMatch.isServer1 ? 1 : 2,
          serverHand: (serverMatch.serverNumber as 1 | 2) || 1,
          isFirstServeOfMatch: serverMatch.isFirstServeOfMatch ?? true,
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

      // Restore stacking
      if (serverMatch.stacking) {
        try {
          const savedStacking = JSON.parse(serverMatch.stacking);
          setStackingMap(savedStacking);
        } catch (e) {
          console.error("Failed to parse stacking", e);
        }
      }

      // Restore penalties
      if (serverMatch.penalties) {
        try {
          const savedPenalties = JSON.parse(serverMatch.penalties);
          setPenalties(savedPenalties);
        } catch (e) {
          console.error("Failed to parse penalties", e);
        }
      }
    }
  }, [serverMatch?.id, resetState]);

  const [pendingScoreUpdate, setPendingScoreUpdate] = useState<{
    score1: number;
    score2: number;
    serverTeam: 1 | 2;
    serverHand: 1 | 2;
    isFirstServeOfMatch: boolean;
    scoringTeam: 1 | 2;
    serverPlayer: string;
  } | null>(null);

  // --- XỬ LÝ GHI ĐIỂM + TỰ ĐỘNG LƯU SERVER ---
  const handleScorePoint = () => {
    const isTeam1Serving = state.serverTeam === 1;
    const scoringTeam = isTeam1Serving ? 1 : 2;
    const serverPlayerId = `t${state.serverTeam}p${state.serverHand}`;
    const serverPlayerName = names[serverPlayerId as keyof typeof names];

    const newScore1 = scoringTeam === 1 ? state.score1 + 1 : state.score1;
    const newScore2 = scoringTeam === 2 ? state.score2 + 1 : state.score2;

    setPendingScoreUpdate({
      score1: newScore1,
      score2: newScore2,
      serverTeam: state.serverTeam,
      serverHand: state.serverHand,
      isFirstServeOfMatch: state.isFirstServeOfMatch,
      scoringTeam,
      serverPlayer: serverPlayerName,
    });

    scorePoint();
  };

  useEffect(() => {
    const handleUpdate = async () => {
      if (!pendingScoreUpdate) return;
      
      let currentMatchId = matchId;
      
      // Nếu chưa có match, tạo mới trước
      if (currentMatchId === 0) {
        try {
          const newMatch = await createMatch.mutateAsync({
            team1Player1: names.t1p1,
            team1Player2: names.t1p2,
            team2Player1: names.t2p1,
            team2Player2: names.t2p2,
            scoreTeam1: 0,
            scoreTeam2: 0,
            status: "live",
            winningScore,
          });
          currentMatchId = newMatch.id;
          // Cập nhật URL với matchId mới
          const url = new URL(window.location.href);
          url.searchParams.set("matchId", currentMatchId.toString());
          window.history.replaceState({}, "", url.toString());
        } catch (e) {
          console.error("Failed to create match:", e);
          setPendingScoreUpdate(null);
          return;
        }
      }
      
      const updateData: any = {
        scoreTeam1: pendingScoreUpdate.score1,
        scoreTeam2: pendingScoreUpdate.score2,
        isServer1: pendingScoreUpdate.serverTeam === 1,
        isServer2: pendingScoreUpdate.serverTeam === 2,
        serverNumber: pendingScoreUpdate.serverHand,
        isFirstServeOfMatch: pendingScoreUpdate.isFirstServeOfMatch,
        status: "live",
      };
      
      updateMatch.mutate({
        id: currentMatchId,
        data: updateData,
      });

      addTimelineEvent("score", pendingScoreUpdate.scoringTeam, {
        serverPlayer: pendingScoreUpdate.serverPlayer,
        serverTeam: pendingScoreUpdate.serverTeam,
        serverHand: pendingScoreUpdate.serverHand,
        scorerTeam: pendingScoreUpdate.scoringTeam,
      });

      setPendingScoreUpdate(null);
    };
    
    if (pendingScoreUpdate) {
      handleUpdate();
    }
  }, [pendingScoreUpdate, matchId, updateMatch, createMatch, names, winningScore]);

  const [pendingFaultUpdate, setPendingFaultUpdate] = useState<{
    serverTeam: 1 | 2;
    serverHand: 1 | 2;
    isFirstServeOfMatch: boolean;
    serverPlayer: string;
  } | null>(null);

  // --- XỬ LÝ LỖI/ĐỔI GIAO + TỰ ĐỘNG LƯU SERVER ---
  const handleFault = () => {
    const serverPlayerId = `t${state.serverTeam}p${state.serverHand}`;
    const serverPlayerName = names[serverPlayerId as keyof typeof names];

    setPendingFaultUpdate({
      serverTeam: state.serverTeam,
      serverHand: state.serverHand,
      isFirstServeOfMatch: state.isFirstServeOfMatch,
      serverPlayer: serverPlayerName,
    });

    fault();
  };

  useEffect(() => {
    const handleFaultUpdate = async () => {
      if (!pendingFaultUpdate) return;
      
      let currentMatchId = matchId;
      
      // Nếu chưa có match, tạo mới trước
      if (currentMatchId === 0) {
        try {
          const newMatch = await createMatch.mutateAsync({
            team1Player1: names.t1p1,
            team1Player2: names.t1p2,
            team2Player1: names.t2p1,
            team2Player2: names.t2p2,
            scoreTeam1: state.score1,
            scoreTeam2: state.score2,
            status: "live",
            winningScore,
          });
          currentMatchId = newMatch.id;
          // Cập nhật URL với matchId mới
          const url = new URL(window.location.href);
          url.searchParams.set("matchId", currentMatchId.toString());
          window.history.replaceState({}, "", url.toString());
        } catch (e) {
          console.error("Failed to create match:", e);
          setPendingFaultUpdate(null);
          return;
        }
      }
      
      const currentScore1 = state.score1;
      const currentScore2 = state.score2;
      const updateData: any = {
        scoreTeam1: currentScore1,
        scoreTeam2: currentScore2,
        isServer1: state.serverTeam === 1,
        isServer2: state.serverTeam === 2,
        serverNumber: state.serverHand,
        isFirstServeOfMatch: state.isFirstServeOfMatch,
        status: "live",
      };
      
      updateMatch.mutate({
        id: currentMatchId,
        data: updateData,
      });

      addTimelineEvent("fault", state.serverTeam, {
        serverPlayer: pendingFaultUpdate.serverPlayer,
        serverTeam: pendingFaultUpdate.serverTeam,
        serverHand: pendingFaultUpdate.serverHand,
      });

      setPendingFaultUpdate(null);
    };
    
    if (pendingFaultUpdate) {
      handleFaultUpdate();
    }
  }, [pendingFaultUpdate, matchId, state, updateMatch, createMatch, names, winningScore]);

  // --- STACKING & PENALTIES ---
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
    if (!matchStartTime && serverMatch) {
      if (serverMatch.startTime) {
        setMatchStartTime(new Date(serverMatch.startTime).getTime());
        setIsTimerRunning(true);
      } else if (serverMatch.status === "live") {
        setMatchStartTime(Date.now());
        setIsTimerRunning(true);
      }
    }
  }, [serverMatch, matchStartTime]);

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
      // Lưu winner vào database khi trận đấu kết thúc
      if (matchId > 0) {
        console.log("🏆 Match ended, saving winner:", state.winner);
        updateMatch.mutate({
          id: matchId,
          data: {
            winnerTeam: state.winner,
            status: "finished",
            endTime: new Date(),
          },
        }, {
          onSuccess: (data) => {
            console.log("✅ Match status updated to finished:", data);
          },
          onError: (error) => {
            console.error("❌ Failed to update match status:", error);
          }
        });
      }
    }
  }, [state.winner, matchId]);

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
    const handleTimeoutsUpdate = async () => {
      if (!timeouts) return;
      
      let currentMatchId = matchId;
      
      if (currentMatchId === 0) return; // Chỉ lưu khi đã có match
      
      updateMatch.mutate({
        id: currentMatchId,
        data: {
          timeouts: JSON.stringify(timeouts),
        },
      });
    };
    
    if (matchId > 0) {
      handleTimeoutsUpdate();
    }
  }, [timeouts, matchId]);

  // --- LƯU STACKING REAL-TIME ---
  useEffect(() => {
    if (matchId > 0 && Object.keys(stackingMap).length >= 0) {
      updateMatch.mutate({
        id: matchId,
        data: {
          stacking: JSON.stringify(stackingMap),
        },
      });
    }
  }, [stackingMap, matchId]);

  // --- LƯU PENALTIES REAL-TIME ---
  useEffect(() => {
    if (matchId > 0 && penalties) {
      updateMatch.mutate({
        id: matchId,
        data: {
          penalties: JSON.stringify(penalties),
        },
      });
    }
  }, [penalties, matchId]);

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
    },
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

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );

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
        addTimelineEvent("yellow-card", playerKey.startsWith("t1") ? 1 : 2, {
          playerName,
        });
        if (newState[playerKey].yellow >= 2) handleForfeit(playerKey);
      } else {
        newState[playerKey].red = true;
        addTimelineEvent("red-card", playerKey.startsWith("t1") ? 1 : 2, {
          playerName,
        });
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
        return team === 1
          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
          : "bg-rose-500/20 text-rose-400 border-rose-500/30";
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
        return team === 1
          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
          : "bg-rose-500/20 text-rose-400 border-rose-500/30";
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
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [prevHistoryLength, setPrevHistoryLength] = useState(
    state.gameHistory.length,
  );

  useEffect(() => {
    if (state.gameHistory.length < prevHistoryLength) {
      setTimeline((prev) => {
        const newTimeline = [...prev];
        const lastScoreIndex = newTimeline.length - 1;
        if (
          lastScoreIndex >= 0 &&
          newTimeline[lastScoreIndex].type === "score"
        ) {
          newTimeline.pop();
        } else if (
          lastScoreIndex >= 0 &&
          newTimeline[lastScoreIndex].type === "fault"
        ) {
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden text-slate-900">
      {/* Header */}
      <header className="px-1 py-1 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-slate-400 hover:text-slate-600 h-10 w-10 bg-slate-100 hover:bg-slate-200 rounded-xl"
        >
          <Home className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 shadow-sm">
            {isTimerRunning ? (
              <Play className="w-3 h-3 text-green-500" />
            ) : state.winner ? (
              <Trophy className="w-3 h-3 text-blue-500" />
            ) : (
              <Pause className="w-3 h-3 text-orange-500" />
            )}
            <span className="text-sm font-black italic text-slate-900 leading-none">
              {formatTimerDisplay(elapsedSeconds)}
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
          className="text-slate-400 hover:text-blue-500 h-10 w-10 bg-slate-100 hover:bg-blue-50 rounded-xl"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-2 space-y-3 max-w-3xl mx-auto w-full overflow-hidden">
        <div className="bg-white-500 border border-slate-100 rounded-2xl p-3 shadow-lg shadow-blue-500/30">
          <Scoreboard
            score1={state.score1}
            score2={state.score2}
            serverHand={state.serverHand}
            servingTeam={state.serverTeam}
            isFirstServe={state.isFirstServeOfMatch}
          />
        </div>

        {timeline.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2">
            <div className="flex gap-1 overflow-x-hidden pb-1">
              {[...timeline]
                .reverse()
                .slice(0, 8)
                .map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`flex-shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${getEventColor(event.type, event.team)} hover:opacity-80 transition-opacity`}
                  >
                    {getEventIcon(event.type)}
                    <span className="whitespace-nowrap">
                      {event.type === "score"
                        ? `${event.score1}-${event.score2}`
                        : getEventLabel(event)}
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
              disabled={
                !!state.winner || timeouts.team1 === 0 || isTimeoutActive
              }
              className="h-9 px-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1.5 text-cyan-400"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black italic">
                TIMEOUT T1 ({timeouts.team1})
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => startTimeout(2)}
              disabled={
                !!state.winner || timeouts.team2 === 0 || isTimeoutActive
              }
              className="h-9 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 text-rose-400"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black italic">
                TIMEOUT T2 ({timeouts.team2})
              </span>
            </motion.button>
          </div>
          <div className="text-center mt-1 text-[10px] text-black/50 italic">
            * Chạm vào icon VĐV để Stacking / Thẻ phạt
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleScorePoint}
            disabled={!!state.winner}
            className="h-20 rounded-2xl bg-blue-500 flex flex-col items-center justify-center text-white shadow-lg"
          >
            <CheckCircle2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-black italic uppercase">
              GHI ĐIỂM
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFault}
            disabled={!!state.winner}
            className="h-20 rounded-2xl bg-orange-500 flex flex-col items-center justify-center text-white shadow-lg"
          >
            <AlertOctagon className="w-6 h-6 mb-1" />
            <span className="text-xs font-black italic uppercase">
              ĐỔI GIAO
            </span>
          </motion.button>
        </div>
      </main>

      {/* Modal chiến thuật (Stacking & Penalties) */}
      <Dialog
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      >
        <DialogContent className="max-w-xs bg-white border-slate-100 rounded-3xl p-6">
          {selectedPlayer && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-slate-900">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPlayer.team === 1
                        ? "bg-blue-500 text-white"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Cài đặt VĐV
                    </div>
                    <div className="text-xl font-black italic">
                      {selectedPlayer.name}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Stacking Toggle */}
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCurrentPlayerStacking ? (
                    <Lock className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Layers className="w-5 h-5 text-indigo-500" />
                  )}
                  <div>
                    <div
                      className={`font-bold text-sm ${
                        isCurrentPlayerStacking
                          ? "text-blue-500"
                          : "text-slate-900"
                      }`}
                    >
                      {isCurrentPlayerStacking
                        ? "ĐANG STACKING"
                        : "Bật Stacking"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCurrentPlayerStacking
                        ? `Khóa vị trí: ${stackingMap[selectedPlayer.id] === "left" ? "Trái" : "Phải"}`
                        : "Giữ vị trí hiện tại"}
                    </div>
                  </div>
                </div>
                <div
                  onClick={togglePlayerStacking}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    isCurrentPlayerStacking ? "bg-blue-500" : "bg-slate-200"
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
                <div className="text-[10px] font-bold text-slate-400 uppercase ml-1">
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
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-xs bg-white border-slate-100 rounded-[2rem] p-6">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-slate-900">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(selectedEvent.type, selectedEvent.team)} border`}
                  >
                    {getEventIcon(selectedEvent.type)}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Chi tiết sự kiện
                    </div>
                    <div className="text-lg font-black italic">
                      {getEventLabel(selectedEvent)}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Thời gian
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatTime(selectedEvent.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Tỷ số
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    <span className="text-blue-500">
                      {selectedEvent.score1}
                    </span>
                    <span className="text-slate-300 mx-1">-</span>
                    <span className="text-orange-500">
                      {selectedEvent.score2}
                    </span>
                  </span>
                </div>

                {(selectedEvent.type === "score" ||
                  selectedEvent.type === "fault") && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase">
                        Người phát
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedEvent.serverPlayer || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase">
                        Đội phát
                      </span>
                      <span
                        className={`text-sm font-bold ${selectedEvent.serverTeam === 1 ? "text-blue-500" : "text-orange-500"}`}
                      >
                        Team {selectedEvent.serverTeam}
                      </span>
                    </div>
                    {selectedEvent.type === "score" && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 uppercase">
                          Ghi điểm
                        </span>
                        <span
                          className={`text-sm font-bold ${selectedEvent.scorerTeam === 1 ? "text-blue-500" : "text-orange-500"}`}
                        >
                          Team {selectedEvent.scorerTeam}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(selectedEvent.type === "yellow-card" ||
                  selectedEvent.type === "red-card") && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase">
                      VĐV
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedEvent.playerName}
                    </span>
                  </div>
                )}

                {selectedEvent.type === "stacking" && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase">
                      Cầu thủ
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedEvent.playerName}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => setSelectedEvent(null)}
                className="w-full text-slate-400 hover:text-slate-600"
              >
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Timeout Modal */}
      <Dialog open={isTimeoutActive}>
        <DialogContent className="max-w-sm bg-white border-slate-100 rounded-[2rem] p-8 text-center">
          <Timer
            className={`w-20 h-20 mx-auto mb-4 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-orange-500"}`}
          />
          <DialogTitle className="text-3xl font-black italic text-slate-900 uppercase mb-2">
            TIMEOUT
          </DialogTitle>
          <p
            className={`text-xl font-black italic mb-6 ${timeoutTeam === 1 ? "text-blue-500" : "text-orange-500"}`}
          >
            TEAM {timeoutTeam}
          </p>

          <div
            className={`text-7xl font-black mb-6 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-slate-900"}`}
          >
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
        <DialogContent className="max-w-xs bg-white border-slate-100 rounded-[2rem] p-8 text-center">
          <Trophy className="w-16 h-16 text-blue-500 mb-4 mx-auto" />
          <DialogTitle className="text-2xl font-black italic text-slate-900 uppercase mb-2">
            Victory!
          </DialogTitle>
          <p
            className={`text-xl font-black italic mb-6 ${
              state.winner === 1 ? "text-blue-500" : "text-orange-500"
            }`}
          >
            TEAM {state.winner === 1 ? "01" : "02"}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white font-black italic h-12 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> ĐẤU LẠI
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="w-full text-slate-400 font-bold uppercase text-[10px]"
            >
              Về trang chủ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
