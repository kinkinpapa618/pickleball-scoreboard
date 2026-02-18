import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Crown,
  Medal,
  ChevronRight,
  Clock,
  Users,
  Target,
  CheckCircle2,
  Circle,
  PlayCircle,
  Eye,
  Edit3,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BracketData,
  BracketMatch,
  BracketProgress,
  BracketPlayer,
  calculateBracketProgress,
  updateBracketMatch,
  isBracketComplete,
  exportBracketToJSON,
} from "@/lib/tournament-bracket";

interface TournamentBracketProps {
  bracket: BracketData;
  onUpdateMatch: (matchId: string, winner: BracketPlayer, score1: number, score2: number) => void;
  onExport?: () => void;
  readOnly?: boolean;
}

export function TournamentBracket({ bracket, onUpdateMatch, onExport, readOnly = false }: TournamentBracketProps) {
  const progress = calculateBracketProgress(bracket);
  const isComplete = isBracketComplete(bracket);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [viewMode, setViewMode] = useState<"bracket" | "schedule">("bracket");

  return (
    <div className="space-y-6">
      {/* HEADER: Progress & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-[#ccff00]/10 to-transparent border-[#ccff00]/20 col-span-1 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ccff00]/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#ccff00]" />
                </div>
                <div>
                  <h3 className="text-white font-black italic">Tiến độ giải đấu</h3>
                  <p className="text-white/40 text-xs">
                    {progress.currentRoundName || "Đang diễn ra"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#ccff00]">{progress.progressPercentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ccff00] to-[#00ff88]"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{progress.completedMatches}</p>
                <p className="text-white/40 text-[10px] uppercase">Hoàn thành</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <PlayCircle className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{progress.playingMatches}</p>
                <p className="text-white/40 text-[10px] uppercase">Đang đấu</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <Circle className="w-4 h-4 text-white/30 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{progress.pendingMatches}</p>
                <p className="text-white/40 text-[10px] uppercase">Chờ đấu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champion / Status Card */}
        <Card className={`${isComplete ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30" : "bg-slate-900/50 border-white/5"}`}>
          <CardContent className="p-5">
            {isComplete && bracket.champion ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-8 h-8 text-black" />
                </div>
                <h4 className="text-amber-400 font-black italic uppercase text-sm">Nhà vô địch</h4>
                <p className="text-white font-bold text-xl mt-1">{bracket.champion.name}</p>
                {bracket.runnerUp && (
                  <p className="text-white/40 text-xs mt-2">
                    Á quân: <span className="text-white/60">{bracket.runnerUp.name}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-white/20" />
                </div>
                <h4 className="text-white/60 font-black italic uppercase text-sm">Đang diễn ra</h4>
                <p className="text-white font-bold text-lg mt-1">{progress.totalMatches - progress.completedMatches} trận</p>
                <p className="text-white/40 text-xs mt-2">chưa hoàn thành</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-5 flex flex-col gap-3">
            {!readOnly && (
              <Button
                onClick={onExport}
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white/80 hover:bg-white/10 text-xs font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> Export JSON
              </Button>
            )}
            <Button
              onClick={() => setViewMode(viewMode === "bracket" ? "schedule" : "bracket")}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white/80 hover:bg-white/10 text-xs font-bold"
            >
              <Eye className="w-4 h-4 mr-2" /> 
              {viewMode === "bracket" ? "Xem lịch thi đấu" : "Xem bracket"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Round Progress Indicators */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {progress.rounds.map((r, idx) => (
          <div
            key={r.round}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all ${
              r.round === progress.currentRound
                ? "bg-[#ccff00]/10 border-[#ccff00]/30"
                : r.completedMatches === r.totalMatches
                ? "bg-green-500/10 border-green-500/30"
                : "bg-slate-900/50 border-white/5"
            }`}
          >
            <p className={`text-xs font-bold ${r.round === progress.currentRound ? "text-[#ccff00]" : "text-white/60"}`}>
              {r.roundName}
            </p>
            <p className="text-[10px] text-white/40">
              {r.completedMatches}/{r.totalMatches} trận
            </p>
          </div>
        ))}
      </div>

      {/* BRACKET VIEW */}
      {viewMode === "bracket" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-8 min-w-max px-4">
            {bracket.rounds.map((round, roundIdx) => (
              <div key={round.round} className="flex flex-col justify-center gap-4">
                {/* Round Header */}
                <div className="text-center mb-2">
                  <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">{round.roundName}</h4>
                  <p className="text-white/30 text-[10px]">{round.matches.length} trận</p>
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-center gap-3">
                  {round.matches.map((match, matchIdx) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      isLastRound={roundIdx === bracket.rounds.length - 1}
                      onClick={() => !readOnly && setSelectedMatch(match)}
                    />
                  ))}
                </div>

                {/* Connector Lines */}
                {roundIdx < bracket.rounds.length - 1 && (
                  <div className="absolute left-full top-1/2 w-8 h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE VIEW */}
      {viewMode === "schedule" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bracket.rounds.map((round) => (
            <div key={round.round}>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> {round.roundName}
              </h4>
              <div className="space-y-2">
                {round.matches.map((match) => (
                  <ScheduleMatchCard
                    key={match.id}
                    match={match}
                    onClick={() => !readOnly && setSelectedMatch(match)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Nhập kết quả */}
      <AnimatePresence>
        {selectedMatch && !readOnly && (
          <MatchResultModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onSubmit={(winner, score1, score2) => {
              onUpdateMatch(selectedMatch.id, winner, score1, score2);
              setSelectedMatch(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// BRACKET MATCH CARD
// ============================================
function BracketMatchCard({
  match,
  isLastRound,
  onClick,
}: {
  match: BracketMatch;
  isLastRound: boolean;
  onClick: () => void;
}) {
  const isFinished = match.status === "finished";
  const isPlaying = match.status === "playing";
  const isBye = match.status === "bye";
  const hasPlayers = match.player1 && match.player2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-56 ${isLastRound ? "border-2 border-amber-500/30 bg-amber-500/5" : ""}`}
    >
      <Card
        className={`cursor-pointer transition-all hover:scale-[1.02] ${
          isPlaying
            ? "bg-slate-900 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
            : isFinished
            ? "bg-slate-900/80 border-white/10"
            : isBye
            ? "bg-slate-900/30 border-white/5 opacity-50"
            : "bg-slate-900/80 border-white/10 hover:border-white/30"
        }`}
        onClick={hasPlayers && !isBye ? onClick : undefined}
      >
        <CardContent className="p-3">
          {/* Status Badge */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">
              Trận {match.matchNumber + 1}
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[8px] font-bold text-yellow-400">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            {isFinished && (
              <CheckCircle2 className="w-3 h-3 text-green-400" />
            )}
          </div>

          {/* Player 1 */}
          <div className={`flex justify-between items-center py-1 ${
            isFinished && match.winner?.id === match.player1?.id ? "text-[#ccff00]" : "text-white/80"
          }`}>
            <span className="text-xs font-bold truncate flex-1">
              {match.player1?.name || "Chờ..."}
            </span>
            {isFinished && match.score1 !== undefined && (
              <span className="text-xs font-black ml-2">{match.score1}</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-1" />

          {/* Player 2 */}
          <div className={`flex justify-between items-center py-1 ${
            isFinished && match.winner?.id === match.player2?.id ? "text-[#ccff00]" : "text-white/80"
          }`}>
            <span className="text-xs font-bold truncate flex-1">
              {match.player2?.name || "Chờ..."}
            </span>
            {isFinished && match.score2 !== undefined && (
              <span className="text-xs font-black ml-2">{match.score2}</span>
            )}
          </div>

          {/* BYE indicator */}
          {isBye && (
            <div className="text-center mt-2">
              <span className="text-[10px] font-bold text-white/40 uppercase">BYE</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connector Lines */}
      <ConnectorLines match={match} isLastRound={isLastRound} />
    </motion.div>
  );
}

// ============================================
// CONNECTOR LINES (SVG)
// ============================================
function ConnectorLines({ match, isLastRound }: { match: BracketMatch; isLastRound: boolean }) {
  if (isLastRound) return null;

  return (
    <svg className="absolute left-full top-1/2 -translate-y-1/2 w-4 h-full -z-10" style={{ height: '120%' }}>
      <path
        d="M0,50% C20,50% 20,0% 40,0%"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ============================================
// SCHEDULE MATCH CARD
// ============================================
function ScheduleMatchCard({ match, onClick }: { match: BracketMatch; onClick: () => void }) {
  const isFinished = match.status === "finished";
  const isPlaying = match.status === "playing";
  const hasPlayers = match.player1 && match.player2;

  return (
    <Card
      className={`cursor-pointer transition-all hover:bg-slate-800 ${
        isPlaying ? "bg-slate-900 border-yellow-400" : "bg-slate-900/50 border-white/5"
      }`}
      onClick={hasPlayers ? onClick : undefined}
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isFinished ? "bg-green-400" : isPlaying ? "bg-yellow-400 animate-pulse" : "bg-white/20"
          }`} />
          <div>
            <p className={`text-sm font-bold ${isFinished ? "text-white/60" : "text-white"}`}>
              {match.player1?.name || "???"}
              <span className="text-white/30 mx-2">vs</span>
              {match.player2?.name || "???"}
            </p>
            <p className="text-[10px] text-white/40">{match.roundName}</p>
          </div>
        </div>
        {isFinished && match.score1 !== undefined && (
          <div className="text-right">
            <p className="text-[#ccff00] font-black text-sm">
              {match.score1} - {match.score2}
            </p>
          </div>
        )}
        {!isFinished && !isPlaying && (
          <ChevronRight className="w-4 h-4 text-white/20" />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MATCH RESULT MODAL
// ============================================
function MatchResultModal({
  match,
  onClose,
  onSubmit,
}: {
  match: BracketMatch;
  onClose: () => void;
  onSubmit: (winner: BracketPlayer, score1: number, score2: number) => void;
}) {
  const [score1, setScore1] = useState(match.score1?.toString() || "");
  const [score2, setScore2] = useState(match.score2?.toString() || "");

  const handleSubmit = () => {
    const s1 = parseInt(score1) || 0;
    const s2 = parseInt(score2) || 0;
    
    if (s1 === 0 && s2 === 0) return;
    
    if (!match.player1 && !match.player2) return;
    
    const winner = s1 > s2 
      ? (match.player1 ?? { id: "unknown", name: "Unknown" }) 
      : (match.player2 ?? { id: "unknown", name: "Unknown" });
    onSubmit(winner, s1, s2);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-white font-black italic text-xl">{match.roundName}</h3>
          <p className="text-white/40 text-sm">Nhập kết quả trận đấu</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <p className="text-white/60 text-xs mb-2">Hạt {match.player1?.seed || "-"}</p>
            <p className="text-white font-bold text-lg mb-3">{match.player1?.name}</p>
            <input
              type="number"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="w-20 bg-slate-800 border border-white/10 text-center text-3xl font-black text-white py-3 rounded-xl"
              placeholder="0"
            />
          </div>

          <div className="text-white/20 font-black text-2xl mx-4">VS</div>

          <div className="text-center flex-1">
            <p className="text-white/60 text-xs mb-2">Hạt {match.player2?.seed || "-"}</p>
            <p className="text-white font-bold text-lg mb-3">{match.player2?.name}</p>
            <input
              type="number"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="w-20 bg-slate-800 border border-white/10 text-center text-3xl font-black text-white py-3 rounded-xl"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white/5 border-white/10 text-white font-bold py-6"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-[#ccff00] text-black font-black text-lg py-6"
          >
            <Trophy className="w-5 h-5 mr-2" /> Lưu kết quả
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// PROGRESS BAR COMPONENT (Standalone)
// ============================================
export function BracketProgressBar({ progress }: { progress: BracketProgress }) {
  return (
    <div className="space-y-3">
      {progress.rounds.map((round) => (
        <div key={round.round} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/60 font-bold">{round.roundName}</span>
            <span className="text-white/40">
              {round.completedMatches}/{round.totalMatches}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                round.completedMatches === round.totalMatches
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-[#ccff00] to-[#00ff88]"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${round.progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TournamentBracket;
