import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Undo2, Feather, ChevronLeft, AlertCircle, ArrowLeftRight, 
  Home, Trophy, Play, Pause, CheckCircle2, AlertOctagon, Clock 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BadmintonCourt } from "@/components/BadmintonCourt";
import { BadmintonScoreboard } from "@/components/BadmintonScoreboard";
import {
  dbToGameState,
} from "@/utils/badmintonLogic";
import confetti from "canvas-confetti";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ───────────────────────────────────────────────
interface BadmintonMatch {
  id: number;
  type: "singles" | "doubles" | "mixed";
  bestOf: number;
  winningPoints: number;
  status: "pending" | "live" | "completed";
  currentGame: number;
  gamesWonTeam1: number;
  gamesWonTeam2: number;
  winnerTeam: 1 | 2 | null;
  gameScores: Array<[number, number]>;
  currentScoreTeam1: number;
  currentScoreTeam2: number;
  servingTeam: 1 | 2;
  servingPlayer: 1 | 2;
  team1Swapped: boolean;
  team2Swapped: boolean;
  team1Side: "left" | "right";
  endsChanged: boolean;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  startTime?: string | null;
  endTime?: string | null;
  timeline: any[];
}

export default function BadmintonMatch() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [courtSwapped, setCourtSwapped] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);

  // ─── Data ──────────────────────────────────────────────
  const { data: match, isLoading } = useQuery<BadmintonMatch>({
    queryKey: ["/api/badminton/matches", id],
    queryFn: () =>
      apiRequest("GET", `/api/badminton/matches/${id}`).then((r) => r.json()),
    refetchInterval: false,
  });

  // ─── Mutations ─────────────────────────────────────────
  const rallyMutation = useMutation({
    mutationFn: (winner: 1 | 2) =>
      apiRequest("PATCH", `/api/badminton/matches/${id}/rally`, { winner }).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/badminton/matches", id], data);
      if (data.currentScoreTeam1 === 0 && data.currentScoreTeam2 === 0 && data.currentGame > (match?.currentGame ?? 1)) {
        toast({
          title: `🏸 Game ${data.currentGame - 1} kết thúc!`,
          description: `Bắt đầu Game ${data.currentGame}`,
        });
      }
    },
    onError: () => toast({ title: "Lỗi ghi điểm", variant: "destructive" }),
  });

  const undoMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/badminton/matches/${id}/undo`, {}).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/badminton/matches", id], data);
      toast({ title: "Đã hoàn tác" });
    },
    onError: (err: any) =>
      toast({
        title: err?.message || "Không có gì để hoàn tác",
        variant: "destructive",
      }),
  });

  const timeoutMutation = useMutation({
    mutationFn: (team: 1 | 2) =>
      apiRequest("PATCH", `/api/badminton/matches/${id}/timeout`, { team }).then((r) => r.json()),
    onSuccess: (data, team) => {
      queryClient.setQueryData(["/api/badminton/matches", id], data);
      setIsTimeoutActive(true);
      setTimeoutTeam(team);
      setTimeoutSeconds(60); // 60s timeout for badminton
      toast({ title: `Team ${team} Timeout` });
    },
    onError: () => toast({ title: "Lỗi ghi timeout", variant: "destructive" }),
  });

  const [isTimeoutActive, setIsTimeoutActive] = useState(false);
  const [timeoutTeam, setTimeoutTeam] = useState<1 | 2 | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);

  // Timer logic
  useEffect(() => {
    if (!match) return;
    if (match.startTime && match.status === "live") {
      setMatchStartTime(new Date(match.startTime).getTime());
      setIsTimerRunning(true);
    } else if (match.status === "completed") {
      setIsTimerRunning(false);
    }
  }, [match?.startTime, match?.status]);

  // Match timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && matchStartTime && !isTimeoutActive) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, matchStartTime, isTimeoutActive]);

  // Timeout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimeoutActive && timeoutSeconds > 0) {
      interval = setInterval(() => {
        setTimeoutSeconds((prev) => {
          if (prev <= 1) {
            setIsTimeoutActive(false);
            setTimeoutTeam(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeoutSeconds === 0) {
      setIsTimeoutActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimeoutActive, timeoutSeconds]);

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Confetti on win
  useEffect(() => {
    if (match?.winnerTeam) {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = match.winnerTeam === 1 
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff']
        : ['#f97316', '#fb923c', '#fdba74', '#ffffff'];

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
  }, [match?.winnerTeam]);

  // ─── Loading / Error ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Feather className="w-8 h-8 text-blue-500 animate-bounce" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-muted-foreground">Không tìm thấy trận đấu</p>
        <Button onClick={() => setLocation("/badminton")}>Quay lại</Button>
      </div>
    );
  }

  const gameState = dbToGameState(match);
  const isCompleted = match.status === "completed";
  const isSingles = match.type === "singles";

  // Compute positions based on swap state and BWF rules
  const positions: Record<string, "left" | "right"> = {};
  
  if (isSingles) {
    const serverScore = gameState.servingTeam === 1 ? match.currentScoreTeam1 : match.currentScoreTeam2;
    const side = serverScore % 2 === 0 ? "right" : "left";
    positions["t1p1"] = side;
    positions["t2p1"] = side;
  } else {
    positions["t1p1"] = match.team1Swapped ? "left" : "right";
    positions["t1p2"] = match.team1Swapped ? "right" : "left";
    positions["t2p1"] = match.team2Swapped ? "left" : "right";
    positions["t2p2"] = match.team2Swapped ? "right" : "left";
  }

  // Find server player ID (actual player index 1 or 2) based on BWF court position
  let serverPlayerId = "";
  if (isSingles) {
    serverPlayerId = `t${gameState.servingTeam}p1`;
  } else {
    const isSwapped = gameState.servingTeam === 1 ? match.team1Swapped : match.team2Swapped;
    const serverPlayerIdx = isSwapped
      ? (gameState.servingPlayer === 1 ? 2 : 1)
      : gameState.servingPlayer;
    serverPlayerId = `t${gameState.servingTeam}p${serverPlayerIdx}`;
  }

  // Determine receiver based on BWF rules (diagonal to the server)
  let receiverPlayerId = "";
  if (isSingles) {
    receiverPlayerId = `t${gameState.servingTeam === 1 ? 2 : 1}p1`;
  } else {
    const serverSide = positions[serverPlayerId];
    const rcvTeam = gameState.servingTeam === 1 ? 2 : 1;
    const rcvPlayer = positions[`t${rcvTeam}p1`] === serverSide ? 1 : 2;
    receiverPlayerId = `t${rcvTeam}p${rcvPlayer}`;
  }

  // Timeline events specific to badminton (re-mapped if needed, but we can just use timeline data from db)
  // For now, Badminton logic engine in `utils` also logs timeline!
  const timeline = match.timeline || [];

  return (
    <div className="h-[100dvh] bg-background flex flex-col font-sans overflow-hidden select-none">
      
      {/* ── Court View (Top) ── */}
      <section className="flex-shrink-0 w-full max-w-lg mx-auto bg-card border-b border-border">
        <BadmintonCourt
          positions={positions}
          serverTeam={gameState.servingTeam}
          serverPlayerId={serverPlayerId}
          receiverPlayerId={receiverPlayerId}
          names={{
            t1p1: match.team1Player1,
            t1p2: match.team1Player2,
            t2p1: match.team2Player1,
            t2p2: match.team2Player2,
          }}
          compact
          courtSwapped={courtSwapped}
          onSwitchCourt={() => setCourtSwapped(!courtSwapped)}
          isSingles={isSingles}
        />
      </section>

      {/* ── Header Toolbar ── */}
      <header className="px-2 py-1.5 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/badminton")}
          className="text-muted-foreground hover:text-foreground h-8 w-8 bg-muted hover:bg-muted/80 rounded-lg"
        >
          <Home className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-muted rounded-md border border-border">
            <button className="hover:opacity-80">
              {isTimerRunning ? (
                <Play className="w-2.5 h-2.5 text-green-500" />
              ) : isCompleted ? (
                <Trophy className="w-2.5 h-2.5 text-blue-500" />
              ) : (
                <Pause className="w-2.5 h-2.5 text-orange-500" />
              )}
            </button>
            <span className="text-xs font-black italic text-foreground tabular-nums leading-none">
              {formatTimerDisplay(elapsedSeconds)}
            </span>
          </div>
          
          <div className="flex gap-1 bg-muted px-2 py-1 rounded-md border border-border">
            {Array.from({ length: Math.ceil(match.bestOf / 2) }).map((_, i) => (
              <div key={`t1-${i}`} className={`w-2 h-2 rounded-full ${i < match.gamesWonTeam1 ? "bg-blue-500" : "bg-foreground/20"}`} />
            ))}
            <span className="text-[10px] text-muted-foreground mx-1">-</span>
            {Array.from({ length: Math.ceil(match.bestOf / 2) }).map((_, i) => (
              <div key={`t2-${i}`} className={`w-2 h-2 rounded-full ${i < match.gamesWonTeam2 ? "bg-orange-500" : "bg-foreground/20"}`} />
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => undoMutation.mutate()}
          disabled={undoMutation.isPending || isCompleted || (!match.currentScoreTeam1 && !match.currentScoreTeam2 && !match.gamesWonTeam1 && !match.gamesWonTeam2)}
          className="text-muted-foreground hover:text-blue-500 h-8 w-8 bg-muted hover:bg-blue-500/10 rounded-lg"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </header>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-background/50">
        
        {/* Scoreboard */}
        <div className="flex-shrink-0 pt-4 pb-2">
          <BadmintonScoreboard
            score1={match.currentScoreTeam1}
            score2={match.currentScoreTeam2}
            servingTeam={match.servingTeam}
            team1Name={match.team1Player1}
            team2Name={match.team2Player1}
          />
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="px-4 py-3 flex-shrink-0 flex flex-col gap-3">
            {/* Timeout Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => timeoutMutation.mutate(1)}
                disabled={isTimeoutActive || timeoutMutation.isPending}
                className="h-10 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl"
              >
                <Clock className="w-3.5 h-3.5 mr-1" /> TIMEOUT T1
              </Button>
              <Button
                variant="outline"
                onClick={() => timeoutMutation.mutate(2)}
                disabled={isTimeoutActive || timeoutMutation.isPending}
                className="h-10 text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-xl"
              >
                <Clock className="w-3.5 h-3.5 mr-1" /> TIMEOUT T2
              </Button>
            </div>

            {/* Score Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => rallyMutation.mutate(1)}
                disabled={rallyMutation.isPending || isTimeoutActive}
                className="h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                +1 TEAM 1
              </Button>
              <Button
                onClick={() => rallyMutation.mutate(2)}
                disabled={rallyMutation.isPending || isTimeoutActive}
                className="h-16 text-xl font-black bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                +1 TEAM 2
              </Button>
            </div>
          </div>
        )}

        {isCompleted && match.winnerTeam && (
          <div className="px-4 py-4 mt-2">
            <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg uppercase tracking-wide">
                🏆 Team {match.winnerTeam} Thắng!
              </p>
            </div>
          </div>
        )}

        {/* Timeline Log */}
        <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col min-h-[200px]">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex-shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" /> LỊCH SỬ TRẬN ĐẤU
          </h3>
          
          <div className="bg-card border border-border rounded-xl flex-1 overflow-hidden shadow-sm">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {timeline.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs italic">
                    Chưa có sự kiện nào
                  </div>
                ) : (
                  [...timeline].reverse().map((event: any, i: number) => (
                    <div 
                      key={event.id || i}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                        event.type === 'score' && event.scorerTeam === 1 ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300' :
                        event.type === 'score' && event.scorerTeam === 2 ? 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300' :
                        event.type === 'timeout' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                        'bg-muted border-border text-foreground'
                      }`}
                    >
                      {event.type === 'score' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : event.type === 'undo' ? (
                        <Undo2 className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : event.type === 'timeout' ? (
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      
                      {event.type === 'score' && (
                        <span className="font-bold tabular-nums min-w-[50px] whitespace-nowrap text-center flex-shrink-0 bg-background/50 rounded px-1.5">
                          {event.score1} - {event.score2}
                        </span>
                      )}
                      
                      <span className="flex-1 opacity-90 truncate">
                        {event.type === 'score' ? `Điểm cho Team ${event.scorerTeam}` : 
                         event.type === 'undo' ? 'Hoàn tác thao tác cuối' : 
                         event.type === 'timeout' ? `Team ${event.scorerTeam} gọi hội ý` :
                         event.message || 'Sự kiện'}
                      </span>
                      
                      {event.timestamp && (
                        <span className="text-[9px] opacity-50 tabular-nums">
                          {new Date(event.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

      </div>

      {/* Timeout Overlay */}
      {isTimeoutActive && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <Clock 
            className={`w-16 h-16 mx-auto mb-3 ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-orange-500"}`} 
          />
          <h2 className="text-3xl font-black uppercase tracking-widest text-foreground mb-2">
            HỘI Ý
          </h2>
          <p className={`text-lg font-black italic mb-4 ${timeoutTeam === 1 ? "text-blue-500" : "text-orange-500"}`}>
            TEAM {timeoutTeam}
          </p>
          
          <div className={`text-6xl font-black mb-4 tabular-nums ${timeoutSeconds <= 15 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
            {formatTimerDisplay(timeoutSeconds)}
          </div>
          
          <Button
            size="lg"
            variant="outline"
            className="mt-8 rounded-xl font-bold h-14 px-8 border-border"
            onClick={() => {
              setIsTimeoutActive(false);
              setTimeoutTeam(null);
              setTimeoutSeconds(0);
            }}
          >
            Tiếp tục trận đấu
          </Button>
        </div>
      )}
    </div>
  );
}
