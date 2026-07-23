import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
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
  Layers,
  UserCog,
  Lock,
  Clock,
  Play,
  Pause,
  Timer,
  StopCircle,
  ArrowLeftRight,
  Pencil,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

type TimelineEventType =
  | "score"
  | "fault"
  | "switch-sides"
  | "stacking"
  | "undo"
  | "timeout"
  | "swap-positions";

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

function InlineEditableField({
  label,
  value,
  placeholder,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0 flex-1">
      <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-wider flex-shrink-0">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <input
            autoFocus
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
            placeholder={placeholder}
            className="flex-1 min-w-0 text-[10px] font-bold bg-muted border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
          />
          <button onClick={onSave} className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500 flex-shrink-0">
            <Check className="w-3 h-3" />
          </button>
          <button onClick={onCancel} className="p-0.5 rounded hover:bg-muted text-muted-foreground flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <span className="text-[10px] font-bold truncate min-w-0 text-foreground">{value || placeholder}</span>
          <button onClick={onEdit} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0">
            <Pencil className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Match() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const search = new URLSearchParams(window.location.search);
  const initialMatchId = parseInt(id || search.get("matchId") || "0");
  const [currentMatchId, setCurrentMatchId] = useState(initialMatchId);
  const matchIdRef = useRef(initialMatchId);

  // Sync URL changes to state
  useEffect(() => {
    const newSearch = new URLSearchParams(window.location.search);
    const newId = parseInt(id || newSearch.get("matchId") || "0");
    if (newId && newId !== currentMatchId) {
      setCurrentMatchId(newId);
      matchIdRef.current = newId;
    }
  }, [window.location.search, id]);

  const names = {
    t1p1: search.get("t1p1") || "P1",
    t1p2: search.get("t1p2") || "P2",
    t2p1: search.get("t2p1") || "P3",
    t2p2: search.get("t2p2") || "P4",
  };
  const [editableNames, setEditableNames] = useState(names);
  const winningScore = parseInt(search.get("win") || "15");
  const initialServer = parseInt(search.get("serve") || "1") as 1 | 2;
  const matchTypeFromUrl = search.get("type") as "singles" | "doubles" | null;

  const { data: serverMatch } = useMatch(currentMatchId);
  const matchType = matchTypeFromUrl || (serverMatch?.type as "singles" | "doubles") || "doubles";

  const { 
    state, 
    scorePoint, 
    fault, 
    undo, 
    getMatchData, 
    resetState, 
    setWinner, 
    swapPositions,
    toggleServerHand 
  } = useGameLogic(winningScore, initialServer, names, matchType);

  const isBO3 = serverMatch?.mode === "bo3";
  const isBO5 = serverMatch?.mode === "bo5";
  const targetGames = isBO5 ? 3 : isBO3 ? 2 : 1;

  const currentGamesWon1 = serverMatch?.gamesWonTeam1 || 0;
  const currentGamesWon2 = serverMatch?.gamesWonTeam2 || 0;

  const nextGamesWon1 = currentGamesWon1 + (state.winner === 1 ? 1 : 0);
  const nextGamesWon2 = currentGamesWon2 + (state.winner === 2 ? 1 : 0);
  const isSeriesOver = state.winner ? (nextGamesWon1 >= targetGames || nextGamesWon2 >= targetGames) : false;

  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const [saved, setSaved] = useState(false);

  // Guard ref to prevent concurrent match creation (race condition)
  const isCreatingRef = useRef(false);

  // Cấu hình Tournament & Match Code
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [matchCode, setMatchCode] = useState("");
  const [matchTheme, setMatchTheme] = useState("default");
  const [livestream, setLivestream] = useState(false);

  const [editingField, setEditingField] = useState<"tournament" | "match" | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");

  const [editTournamentName, setEditTournamentName] = useState("");
  const [editMatchCode, setEditMatchCode] = useState("");
  const [editTheme, setEditTheme] = useState("default");

  const handleSaveFieldEdit = () => {
    if (!editingField || !editFieldValue.trim()) return;
    if (editingField === "tournament") {
      setTournamentName(editFieldValue.trim());
      if (currentMatchId > 0) updateMatch.mutate({ id: currentMatchId, data: { tournamentName: editFieldValue.trim() } });
    } else {
      setMatchCode(editFieldValue.trim());
      if (currentMatchId > 0) updateMatch.mutate({ id: currentMatchId, data: { matchCode: editFieldValue.trim() } });
    }
    setEditingField(null);
    setEditFieldValue("");
  };

  const handleSaveConfig = async () => {
    if (currentMatchId > 0) {
      try {
        await updateMatch.mutateAsync({
          id: currentMatchId,
          data: {
            tournamentName: editTournamentName,
            matchCode: editMatchCode,
            theme: editTheme,
          },
        });
        setShowConfigModal(false);
      } catch (e) {
        console.error("Failed to update tournament info:", e);
        alert("Lỗi khi cập nhật cấu hình giải đấu");
      }
    } else {
      setTournamentName(editTournamentName);
      setMatchCode(editMatchCode);
      setMatchTheme(editTheme);
      setShowConfigModal(false);
    }
  };

  useEffect(() => {
    if (!serverMatch) return;

    if (serverMatch.tournamentName) {
      setTournamentName(serverMatch.tournamentName);
    }
    if (serverMatch.matchCode) {
      setMatchCode(serverMatch.matchCode);
    }
    if (serverMatch.theme) {
      setMatchTheme(serverMatch.theme);
    }
    if (serverMatch.livestream !== undefined) {
      setLivestream(serverMatch.livestream ?? false);
    }

    setEditableNames({
      t1p1: serverMatch.team1Player1 || names.t1p1,
      t1p2: serverMatch.team1Player2 || names.t1p2,
      t2p1: serverMatch.team2Player1 || names.t2p1,
      t2p2: serverMatch.team2Player2 || names.t2p2,
    });

    if (serverMatch.status === "finished" && serverMatch.winnerTeam) {
      if (state.winner !== serverMatch.winnerTeam) {
        resetState({
          score1: serverMatch.scoreTeam1,
          score2: serverMatch.scoreTeam2,
        });
        setWinner(serverMatch.winnerTeam as 1 | 2);
      }
      return;
    }

    if (serverMatch.status === "live" && !state.winner) {
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

      if (serverMatch.timeouts) {
        try {
          const savedTimeouts = typeof serverMatch.timeouts === "string"
            ? JSON.parse(serverMatch.timeouts)
            : serverMatch.timeouts;
          setTimeouts(savedTimeouts);
        } catch (e) {
          console.error("Failed to parse timeouts", e);
        }
      }

      if (serverMatch.timeline) {
        try {
            const savedTimeline: TimelineEvent[] = typeof serverMatch.timeline === "string"
              ? JSON.parse(serverMatch.timeline)
              : serverMatch.timeline;
          setTimeline(savedTimeline);
        } catch (e) {
          console.error("Failed to parse timeline", e);
        }
      }

      if (serverMatch.stacking) {
        try {
          const stackingData = typeof serverMatch.stacking === "string"
            ? JSON.parse(serverMatch.stacking)
            : serverMatch.stacking;
          setStackingMap(stackingData);
        } catch (e) {
          console.error("Failed to parse stacking", e);
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
      // Prevent running again while already handling
      if (isCreatingRef.current) return;

      let matchId = matchIdRef.current;

      if (matchId === 0) {
        // Guard: prevent concurrent creation
        isCreatingRef.current = true;
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
            type: matchType,
            tournamentName,
            matchCode,
            theme: matchTheme,
          });
          matchId = newMatch.id;
          matchIdRef.current = matchId;
          setCurrentMatchId(matchId);
          const url = new URL(window.location.href);
          url.searchParams.set("matchId", matchId.toString());
          window.history.replaceState({}, "", url.toString());
        } catch (e) {
          console.error("Failed to create match:", e);
          setPendingScoreUpdate(null);
          isCreatingRef.current = false;
          return;
        } finally {
          isCreatingRef.current = false;
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

      // Use local matchId (not stale React state) to avoid wrong match update
      updateMatch.mutate({
        id: matchId,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScoreUpdate]);

  const [pendingFaultUpdate, setPendingFaultUpdate] = useState<{
    serverTeam: 1 | 2;
    serverHand: 1 | 2;
    isFirstServeOfMatch: boolean;
    serverPlayer: string;
  } | null>(null);

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
      if (isCreatingRef.current) return;

      let matchId = matchIdRef.current;

      if (matchId === 0) {
        isCreatingRef.current = true;
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
            type: matchType,
            tournamentName,
            matchCode,
            theme: matchTheme,
          });
          matchId = newMatch.id;
          matchIdRef.current = matchId;
          setCurrentMatchId(matchId);
          const url = new URL(window.location.href);
          url.searchParams.set("matchId", matchId.toString());
          window.history.replaceState({}, "", url.toString());
        } catch (e) {
          console.error("Failed to create match:", e);
          setPendingFaultUpdate(null);
          isCreatingRef.current = false;
          return;
        } finally {
          isCreatingRef.current = false;
        }
      }

      const updateData: any = {
        scoreTeam1: state.score1,
        scoreTeam2: state.score2,
        isServer1: state.serverTeam === 1,
        isServer2: state.serverTeam === 2,
        serverNumber: state.serverHand,
        isFirstServeOfMatch: state.isFirstServeOfMatch,
        status: "live",
      };

      // Use local matchId (not stale React state)
      updateMatch.mutate({
        id: matchId,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFaultUpdate]);

  const [stackingMap, setStackingMap] = useState<StackingMap>({});
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInitialized, setTimerInitialized] = useState(false);

  useEffect(() => {
    if (timerInitialized || !serverMatch) return;
    
    if (serverMatch.startTime) {
      setMatchStartTime(new Date(serverMatch.startTime).getTime());
      setIsTimerRunning(true);
      setTimerInitialized(true);
    } else if (serverMatch.status === "live") {
      const now = Date.now();
      setMatchStartTime(now);
      setIsTimerRunning(true);
      setTimerInitialized(true);
      if (currentMatchId > 0) {
        updateMatch.mutate({
          id: currentMatchId,
          data: {
            startTime: new Date(now).toISOString() as any,
          },
        });
      }
    }
  }, [serverMatch, timerInitialized]);

    // Reset UI state when switching to a new match
    useEffect(() => {
      // Clear timeline and stacking map
      setTimeline([]);
      setStackingMap({});
      // Reset previous history length tracker
      setPrevHistoryLength(0);
      // Reset timer related states
      setMatchStartTime(null);
      setElapsedSeconds(0);
      setIsTimerRunning(false);
      setTimerInitialized(false);
      // Reset game logic state
      resetState({ score1: 0, score2: 0 });
      matchIdRef.current = currentMatchId;
    }, [currentMatchId]);

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

  // Hiệu ứng confetti khi có winner
  useEffect(() => {
    if (state.winner) {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = state.winner === 1 
        ? ['#06b6d4', '#22d3ee', '#67e8f9', '#ffffff']  // Cyan for team 1
        : ['#f43f5e', '#fb7185', '#fda4af', '#ffffff']; // Rose for team 2

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [state.winner]);

  useEffect(() => {
    if (state.winner && currentMatchId > 0 && serverMatch) {
      if (serverMatch.status === "finished" || serverMatch.status === "completed") return;
      setIsTimerRunning(false);

      const nextSets = [...(serverMatch.sets as any || []), { score1: state.score1, score2: state.score2 }];

      if (isSeriesOver) {
        updateMatch.mutate({
          id: currentMatchId,
          data: {
            winnerTeam: state.winner as number,
            status: "completed" as const,
            endTime: new Date().toISOString() as any,
            gamesWonTeam1: nextGamesWon1,
            gamesWonTeam2: nextGamesWon2,
            sets: nextSets,
            livestream: false,
          },
        }, {
          onSuccess: (data) => {
            console.log("Match status updated to completed:", data);
            setLivestream(false);
          },
          onError: (error: any) => {
            console.error("Failed to update match status:", error);
          }
        });
      }
    }
  }, [state.winner, currentMatchId, serverMatch]);

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
      if (currentMatchId === 0) return;
      updateMatch.mutate({
        id: currentMatchId,
        data: {
          timeouts: JSON.stringify(timeouts),
        },
      });
    };
    if (currentMatchId > 0) {
      handleTimeoutsUpdate();
    }
    if (currentMatchId > 0 && Object.keys(stackingMap).length >= 0) {
      updateMatch.mutate({
        id: currentMatchId,
        data: {
          stacking: JSON.stringify(stackingMap),
        },
      });
    }
  }, [stackingMap, currentMatchId]);

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
      if (currentMatchId > 0) {
        const endTime = new Date(Date.now() + 180 * 1000);
        updateMatch.mutate({
          id: currentMatchId,
          data: {
            timeoutActive: true,
            timeoutTeam: team,
            timeoutEndTime: endTime.toISOString() as any,
          },
        });
      }
    }
  };

  const stopTimeout = () => {
    setIsTimeoutActive(false);
    if (currentMatchId > 0) {
      updateMatch.mutate({
        id: currentMatchId,
        data: {
          timeoutActive: false,
          timeoutTeam: null as any,
          timeoutEndTime: null as any,
        },
      });
    }
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
      if (currentMatchId > 0) {
        updateMatch.mutate({
          id: currentMatchId,
          data: {
            timeline: JSON.stringify(newTimeline),
          },
        });
      }
      return newTimeline;
    });
  };

  const [courtSwapped, setCourtSwapped] = useState(false);

  const handleSwitchCourt = () => {
    setCourtSwapped(!courtSwapped);
    addTimelineEvent("switch-sides", null);
  };

  const handleToggleServerHand = async () => {
    if (matchType !== "doubles" || state.winner) return;
    
    const nextServerHand = state.serverHand === 1 ? 2 : 1;
    toggleServerHand();
    addTimelineEvent("swap-positions", state.serverTeam);

    if (currentMatchId > 0) {
      try {
        await updateMatch.mutateAsync({
          id: currentMatchId,
          data: {
            serverNumber: nextServerHand,
          },
        });
      } catch (e) {
        console.error("Failed to update server hand in database:", e);
      }
    }
  };

  const handleStartNextSet = async () => {
    if (currentMatchId > 0 && serverMatch) {
      const nextSets = [...(serverMatch.sets as any || []), { score1: state.score1, score2: state.score2 }];

      try {
        await updateMatch.mutateAsync({
          id: currentMatchId,
          data: {
            scoreTeam1: 0,
            scoreTeam2: 0,
            gamesWonTeam1: nextGamesWon1,
            gamesWonTeam2: nextGamesWon2,
            sets: nextSets,
            isFirstServeOfMatch: true,
          },
        });
      } catch (e) {
        console.error("Failed to reset scores for next set:", e);
      }
    }

    resetState({
      score1: 0,
      score2: 0,
      isFirstServeOfMatch: true,
    });
    setWinner(null);
  };

  const displayNames = courtSwapped
    ? { t1p1: editableNames.t2p1, t1p2: editableNames.t2p2, t2p1: editableNames.t1p1, t2p2: editableNames.t1p2 }
    : editableNames;

  const displayServerTeam = courtSwapped ? (state.serverTeam === 1 ? 2 : 1) : state.serverTeam;

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    team: 1 | 2;
    name: string;
    currentSide: "left" | "right";
  } | null>(null);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  const handleSavePlayerName = () => {
    if (!editingPlayerId || !editNameValue.trim()) return;
    const fieldMap: Record<string, string> = {
      t1p1: "team1Player1",
      t1p2: "team1Player2",
      t2p1: "team2Player1",
      t2p2: "team2Player2",
    };
    const dbField = fieldMap[editingPlayerId];
    if (!dbField) return;

    setEditableNames(prev => ({ ...prev, [editingPlayerId]: editNameValue.trim() }));
    if (currentMatchId > 0) {
      updateMatch.mutate({
        id: currentMatchId,
        data: { [dbField]: editNameValue.trim() } as any,
      });
    }
    setEditingPlayerId(null);
    setEditNameValue("");
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
      case "stacking":
        return <Layers className="w-3 h-3 text-indigo-400" />;
      case "undo":
        return <Undo2 className="w-3 h-3" />;
      case "timeout":
        return <Timer className="w-3 h-3 text-yellow-400" />;
      case "swap-positions":
        return <ArrowLeftRight className="w-3 h-3 text-emerald-400" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: TimelineEventType, team: 1 | 2 | null) => {
    switch (type) {
      case "score":
        return team === 1
          ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "fault":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "stacking":
        return "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      case "undo":
        return "bg-muted text-muted-foreground border-border";
      case "timeout":
        return team === 1
          ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "swap-positions":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getEventLabel = (event: TimelineEvent) => {
    switch (event.type) {
      case "score":
        return event.team === 1 ? "+1 T1" : "+1 T2";
      case "fault":
        return "Lỗi/Đổi giao";
      case "stacking":
        return `${event.playerName} Stack`;
      case "undo":
        return "Hoàn tác";
      case "timeout":
        return `T${event.team} TO`;
      case "swap-positions":
        return "Đổi vị trí";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPlayer || selectedEvent || isTimeoutActive || state.winner || showConfigModal) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleScorePoint();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleFault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlayer, selectedEvent, isTimeoutActive, state.winner, showConfigModal, handleScorePoint, handleFault]);

  const isFirstServeActive = state.isFirstServeOfMatch;

  return (
    <div className="h-[100dvh] bg-background flex flex-col font-sans overflow-hidden" data-testid="match-page">
      <section className="flex-shrink-0 w-full max-w-lg mx-auto" data-testid="section-court">
          <Court
            positions={state.positions}
            serverTeam={displayServerTeam}
            serverHand={state.serverHand}
            names={displayNames}
            score1={state.score1}
            score2={state.score2}
            firstServe={isFirstServeActive}
            compact
            stackingMap={stackingMap}
            courtSwapped={courtSwapped}
            onPlayerClick={(id, team, name, currentSide) =>
              setSelectedPlayer({ id, team, name, currentSide })
            }
            onSwitchCourt={handleSwitchCourt}
          />
        </section>
      <header className="px-2 py-1.5 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground h-8 w-8 bg-muted hover:bg-muted/80 rounded-lg"
            data-testid="button-home"
          >
            <Home className="w-4 h-4" />
          </Button>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={livestream}
              onChange={(e) => {
                const val = e.target.checked;
                setLivestream(val);
                if (currentMatchId > 0) {
                  updateMatch.mutate({
                    id: currentMatchId,
                    data: { livestream: val },
                  });
                }
              }}
              className="w-3.5 h-3.5 rounded border-border accent-red-500 cursor-pointer"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 whitespace-nowrap">
              LIVESTREAM
            </span>
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-muted rounded-md border border-border">
            <button
              onClick={() => {
                if (!matchStartTime && currentMatchId > 0) {
                  const now = Date.now();
                  setMatchStartTime(now);
                  setIsTimerRunning(true);
                  updateMatch.mutate({
                    id: currentMatchId,
                    data: {
                      startTime: new Date(now).toISOString() as any,
                    },
                  });
                } else {
                  setIsTimerRunning(!isTimerRunning);
                }
              }}
              className="hover:opacity-80"
            >
              {isTimerRunning ? (
                <Play className="w-2.5 h-2.5 text-green-500" />
              ) : state.winner ? (
                <Trophy className="w-2.5 h-2.5 text-blue-500" />
              ) : (
                <Pause className="w-2.5 h-2.5 text-orange-500" />
              )}
            </button>
            <span className="text-xs font-black italic text-foreground tabular-nums leading-none" data-testid="text-timer">
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
          className="text-muted-foreground hover:text-blue-500 h-8 w-8 bg-muted hover:bg-blue-500/10 rounded-lg"
          data-testid="button-undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-2 gap-4 max-w-lg mx-auto w-full overflow-y-auto">
        {(isBO3 || isBO5) ? (
          <div className="flex items-center px-3 py-2 bg-card border border-border rounded-xl shadow-sm text-xs font-black text-foreground flex-shrink-0 gap-1.5">
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-muted-foreground uppercase text-[8px] tracking-wider font-extrabold">SET</span>
              <span className="text-cyan-500 font-extrabold text-sm font-mono">{currentGamesWon1}</span>
              <span className="text-muted-foreground font-light text-xs">-</span>
              <span className="text-rose-500 font-extrabold text-sm font-mono">{currentGamesWon2}</span>
            </div>
            <div className="w-px h-4 bg-border flex-shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <InlineEditableField
                label="GIẢI"
                value={tournamentName}
                placeholder="Tên giải"
                isEditing={editingField === "tournament"}
                editValue={editFieldValue}
                onEdit={() => { setEditingField("tournament"); setEditFieldValue(tournamentName); }}
                onSave={handleSaveFieldEdit}
                onCancel={() => { setEditingField(null); setEditFieldValue(""); }}
                onChange={setEditFieldValue}
              />
              <InlineEditableField
                label="TRẬN"
                value={matchCode}
                placeholder="Mã trận"
                isEditing={editingField === "match"}
                editValue={editFieldValue}
                onEdit={() => { setEditingField("match"); setEditFieldValue(matchCode); }}
                onSave={handleSaveFieldEdit}
                onCancel={() => { setEditingField(null); setEditFieldValue(""); }}
                onChange={setEditFieldValue}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center px-3 py-2 bg-card border border-border rounded-xl shadow-sm text-xs font-black text-foreground flex-shrink-0 gap-1.5">
            <InlineEditableField
              label="GIẢI"
              value={tournamentName}
              placeholder="Tên giải"
              isEditing={editingField === "tournament"}
              editValue={editFieldValue}
              onEdit={() => { setEditingField("tournament"); setEditFieldValue(tournamentName); }}
              onSave={handleSaveFieldEdit}
              onCancel={() => { setEditingField(null); setEditFieldValue(""); }}
              onChange={setEditFieldValue}
            />
            <InlineEditableField
              label="TRẬN"
              value={matchCode}
              placeholder="Mã trận"
              isEditing={editingField === "match"}
              editValue={editFieldValue}
              onEdit={() => { setEditingField("match"); setEditFieldValue(matchCode); }}
              onSave={handleSaveFieldEdit}
              onCancel={() => { setEditingField(null); setEditFieldValue(""); }}
              onChange={setEditFieldValue}
            />
          </div>
        )}

        <section className="bg-card border border-border rounded-xl p-3 shadow-sm flex-shrink-0" data-testid="section-scoreboard">
          <Scoreboard
            score1={state.score1}
            score2={state.score2}
            serverHand={state.serverHand}
            servingTeam={state.serverTeam}
            isFirstServe={state.isFirstServeOfMatch}
          />
        </section>

        {timeline.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-2 flex-shrink-0" data-testid="section-timeline">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timeline</h3>
              <button className="text-xs font-semibold text-[#FF5722]">...</button>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {timeline
                .slice(-10)
                .map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex-shrink-0 bg-slate-900 border border-white/5 dark:bg-white/5 dark:border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm hover:bg-slate-800 dark:hover:bg-white/10 transition"
                    data-testid={`timeline-event-${event.id}`}
                  >
                    <span className="text-[10px] font-bold text-[#FF5722]">
                      {formatTime(event.timestamp)}
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      {event.type === "score" 
                        ? (event.team === 1 ? "Đội 1 +1 điểm" : "Đội 2 +1 điểm")
                        : event.type === "fault" 
                        ? "Đổi giao bóng"
                        : event.type === "switch-sides"
                        ? "Đổi sân"
                        : event.type === "timeout"
                        ? `T${event.team} Timeout`
                        : event.type === "swap-positions"
                        ? "Đổi vị trí"
                        : getEventLabel(event)
                      }
                    </span>
                  </button>
                ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-4 gap-2" data-testid="section-quick-actions">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (timeouts.team1 > 0 && timeouts.team2 > 0) {
                // Show dialog to choose team - for now just use team 1
                startTimeout(1);
              } else if (timeouts.team1 > 0) {
                startTimeout(1);
              } else if (timeouts.team2 > 0) {
                startTimeout(2);
              }
            }}
            disabled={!!state.winner || (timeouts.team1 === 0 && timeouts.team2 === 0) || isTimeoutActive}
            className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm active:bg-slate-900 transition disabled:opacity-40 text-slate-300 dark:text-slate-200"
            data-testid="button-timeout"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-300">
              <Timer className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 text-center leading-none">Timeout ({timeouts.team1 + timeouts.team2})</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              undo();
              addTimelineEvent("undo", null);
            }}
            disabled={state.gameHistory.length === 0}
            className="bg-slate-100 dark:bg-slate-800/60 border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm active:bg-slate-900 transition disabled:opacity-40 text-slate-300 dark:text-slate-200"
            data-testid="button-undo"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-300">
              <Undo2 className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 text-center leading-none">HOÀN TÁC</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchCourt}
            className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm active:bg-slate-900 transition text-slate-300 dark:text-slate-200"
            data-testid="button-switch-court"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-300">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 text-center leading-none">Đổi sân</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleServerHand}
            disabled={matchType !== "doubles" || !!state.winner}
            className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm active:bg-slate-900 transition disabled:opacity-40 text-slate-300 dark:text-slate-200"
            title="Đổi người phát bóng trong cùng đội"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 text-center leading-none">Đổi người giao</span>
          </motion.button>
        </section>

        <footer className="mt-auto p-2 sticky bottom-0 bg-background border-t border-border">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleScorePoint}
              disabled={!!state.winner}
              style={{ color: 'white' }}
              className="h-20 rounded-2xl bg-green-600 hover:bg-green-500 font-black py-4 px-5 flex items-center justify-center gap-2 active:scale-95 transition text-lg"
              data-testid="button-score"
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: 'white' }} />
              GHI ĐIỂM
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFault}
              disabled={!!state.winner}
              style={{ color: 'white' }}
              className="h-20 rounded-2xl bg-rose-600 hover:bg-rose-500 font-black py-4 px-5 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition text-lg"
              data-testid="button-fault"
            >
              <AlertOctagon className="w-7 h-7" style={{ color: 'white' }} />
              ĐỔI GIAO
            </motion.button>
          </div>
        </footer>
      </main>

      <Dialog
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      >
        <DialogContent className="max-w-xs bg-card border-border rounded-2xl p-5">
          {selectedPlayer && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-foreground">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      selectedPlayer.team === 1
                        ? "bg-cyan-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Cài đặt VĐV
                    </div>
                    {editingPlayerId === selectedPlayer.id ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          autoFocus
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSavePlayerName();
                            if (e.key === "Escape") {
                              setEditingPlayerId(null);
                              setEditNameValue("");
                            }
                          }}
                          className="text-lg font-black italic bg-transparent border-b border-border outline-none w-full max-w-[160px] text-foreground"
                        />
                        <button
                          onClick={handleSavePlayerName}
                          className="p-0.5 rounded hover:bg-muted text-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="text-lg font-black italic">
                          {editableNames[selectedPlayer.id as keyof typeof editableNames] || selectedPlayer.name}
                        </div>
                        <button
                          onClick={() => {
                            setEditingPlayerId(selectedPlayer.id);
                            setEditNameValue(editableNames[selectedPlayer.id as keyof typeof editableNames] || selectedPlayer.name);
                          }}
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Sửa tên"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCurrentPlayerStacking ? (
                    <Lock className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Layers className="w-4 h-4 text-indigo-500" />
                  )}
                  <div>
                    <div className={`font-bold text-xs ${isCurrentPlayerStacking ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {isCurrentPlayerStacking ? "ĐANG STACKING" : "Bật Stacking"}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {isCurrentPlayerStacking
                        ? `Khóa vị trí: ${stackingMap[selectedPlayer.id] === "left" ? "Trái" : "Phải"}`
                        : "Giữ vị trí hiện tại"}
                    </div>
                  </div>
                </div>
                <div
                  onClick={togglePlayerStacking}
                  className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                    isCurrentPlayerStacking ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  data-testid="toggle-stacking"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isCurrentPlayerStacking ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPlayer) {
                    swapPositions(selectedPlayer.team);
                    addTimelineEvent("swap-positions", selectedPlayer.team);
                    setSelectedPlayer(null);
                  }
                }}
                className="w-full text-foreground border-border hover:bg-muted"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2 text-emerald-500" />
                Đổi vị trí với đồng đội
              </Button>

            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-xs bg-card border-border rounded-2xl p-5">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-foreground">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${getEventColor(selectedEvent.type, selectedEvent.team)} border`}
                  >
                    {getEventIcon(selectedEvent.type)}
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Chi tiết sự kiện
                    </div>
                    <div className="text-lg font-black italic">
                      {getEventLabel(selectedEvent)}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="bg-muted rounded-lg p-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted-foreground uppercase">Thời gian</span>
                  <span className="text-sm font-bold text-foreground">{formatTime(selectedEvent.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted-foreground uppercase">Tỷ số</span>
                  <span className="text-sm font-black text-foreground">
                    <span className="text-cyan-500">{selectedEvent.score1}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-rose-500">{selectedEvent.score2}</span>
                  </span>
                </div>

                {(selectedEvent.type === "score" || selectedEvent.type === "fault") && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground uppercase">Người phát</span>
                      <span className="text-sm font-bold text-foreground">{selectedEvent.serverPlayer || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground uppercase">Đội phát</span>
                      <span className={`text-sm font-bold ${selectedEvent.serverTeam === 1 ? "text-cyan-500" : "text-rose-500"}`}>
                        Team {selectedEvent.serverTeam}
                      </span>
                    </div>
                    {selectedEvent.type === "score" && (
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-muted-foreground uppercase">Ghi điểm</span>
                        <span className={`text-sm font-bold ${selectedEvent.scorerTeam === 1 ? "text-cyan-500" : "text-rose-500"}`}>
                          Team {selectedEvent.scorerTeam}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {selectedEvent.type === "stacking" && (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground uppercase">Cầu thủ</span>
                    <span className="text-sm font-bold text-foreground">{selectedEvent.playerName}</span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => setSelectedEvent(null)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTimeoutActive}>
        <DialogContent className="max-w-sm bg-card border-border rounded-2xl p-6 text-center">
          <Timer
            className={`w-16 h-16 mx-auto mb-3 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-orange-500"}`}
          />
          <DialogTitle className="text-2xl font-black italic text-foreground uppercase mb-1">
            TIMEOUT
          </DialogTitle>
          <p className={`text-lg font-black italic mb-4 ${timeoutTeam === 1 ? "text-cyan-500" : "text-rose-500"}`}>
            TEAM {timeoutTeam}
          </p>

          <div className={`text-6xl font-black mb-4 tabular-nums ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
            {formatTimerDisplay(timeoutSeconds)}
          </div>

          <Button
            onClick={stopTimeout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black italic h-12 rounded-xl"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            DỪNG TIMEOUT
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!state.winner && isSeriesOver}>
        <DialogContent className="max-w-xs bg-card border-border rounded-2xl p-6 text-center">
          <DialogTitle className="text-xl font-black italic text-foreground uppercase mb-3">
            Victory!
          </DialogTitle>
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CHÚC MỪNG</p>
            <div className={`flex items-center justify-center gap-3 text-2xl font-black italic ${state.winner === 1 ? "text-cyan-500" : "text-rose-500"}`}>
              <Trophy className={`h-16 w-16 ${state.winner === 1 ? "text-cyan-400" : "text-rose-400"}`} />
              <span>
                {state.winner === 1 
                  ? (matchType === "singles" ? names.t1p1 : `${names.t1p1} & ${names.t1p2}`)
                  : (matchType === "singles" ? names.t2p1 : `${names.t2p1} & ${names.t2p2}`)
                }
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">ĐÃ CHIẾN THẮNG</p>
            {(isBO3 || isBO5) && (
              <div className="mt-4 p-2.5 bg-muted rounded-xl text-sm font-bold text-foreground">
                Tỷ số trận đấu: {nextGamesWon1} - {nextGamesWon2}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => setLocation("/match-detail/" + currentMatchId)}
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#FF9800] hover:from-[#FF7043] hover:to-[#FFB74D] text-white font-black italic h-12 rounded-xl shadow-lg shadow-orange-500/30 animate-pulse"
            >
              <Layers className="w-5 h-5 mr-2" /> CHI TIẾT TRẬN ĐẤU
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!state.winner && !isSeriesOver}>
        <DialogContent className="max-w-xs bg-card border-border rounded-2xl p-6 text-center">
          <DialogTitle className="text-xl font-black italic text-foreground uppercase mb-3">
            Set Kết Thúc!
          </DialogTitle>
          <div className="mb-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ĐỘI THẮNG SET</p>
              <div className={`text-xl font-black italic ${state.winner === 1 ? "text-cyan-500" : "text-rose-500"}`}>
                {state.winner === 1 
                  ? (matchType === "singles" ? names.t1p1 : `${names.t1p1} & ${names.t1p2}`)
                  : (matchType === "singles" ? names.t2p1 : `${names.t2p1} & ${names.t2p2}`)
                }
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Tỷ số Set hiện tại</p>
              <div className="text-2xl font-black text-foreground">
                {nextGamesWon1} - {nextGamesWon2}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleStartNextSet}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-12 rounded-xl"
            >
              BẮT ĐẦU SET TIẾP THEO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tournament & Match Code Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-sm rounded-2xl p-5 bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Cấu hình giải đấu & mã trận
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Tên giải đấu
              </label>
              <input
                type="text"
                value={editTournamentName}
                onChange={(e) => setEditTournamentName(e.target.value)}
                placeholder="GIẢI PICKLEBALL DALI SPORT 2026"
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Mã trận đấu
              </label>
              <input
                type="text"
                value={editMatchCode}
                onChange={(e) => setEditMatchCode(e.target.value)}
                placeholder="Bảng A - Vòng 1 - Trận 2"
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Chủ đề bảng điểm
              </label>
              <select
                value={editTheme}
                onChange={(e) => setEditTheme(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Sáng (Mặc định)</option>
                <option value="dark">Tối (Dark)</option>
                <option value="ppa">PPA Tour Broadcast</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="retro">Retro Arcade</option>
                <option value="glassmorphism">Glassmorphism (Kính mờ)</option>
                <option value="minimal">Minimal Bar (Thanh ngang)</option>
                <option value="dali-sport">Dali Sport (Biamanhbeo)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2.5 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfigModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveConfig}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm"
            >
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
