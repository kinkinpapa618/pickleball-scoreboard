import type { Match } from "@shared/schema";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ScoreboardOverlayProps {
  match: Match;
  theme?: string;
  showTournament?: boolean;
  showMatchCode?: boolean;
}

export function makeTeamNames(match: Match) {
  const isDoubles = match.type === "doubles";
  const team1Name = isDoubles && match.team1Player2
    ? `${match.team1Player1} / ${match.team1Player2}`
    : match.team1Player1;
  const team2Name = isDoubles && match.team2Player2
    ? `${match.team2Player1} / ${match.team2Player2}`
    : match.team2Player1;
  return { team1Name, team2Name, isDoubles };
}

export default function ScoreboardOverlay({
  match,
  theme = "dali-sport",
  showTournament = true,
  showMatchCode = true,
}: ScoreboardOverlayProps) {
  const isCompleted = match.status === "completed";
  const { team1Name, team2Name, isDoubles } = makeTeamNames(match);

  const startTime = match.startTime ? (typeof match.startTime === 'string' ? new Date(match.startTime).getTime() : new Date(match.startTime).getTime()) : null;
  const [elapsedSeconds, setElapsedSeconds] = useState(startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 200);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // PPA Broadcast theme
  if (theme === "ppa") {
    return (
      <div className="relative w-fit flex flex-col gap-[6px] select-none py-1 pl-0 ml-0 pr-1 flex-shrink-0 drop-shadow-[0_5px_10px_rgba(0,0,0,0.38)]">
        {/* Team 1 Row */}
        <div className="relative left-0 w-full">
          {/* Yellow Serve Layer underneath active server (Sticks out 8px to the right and 4px to the bottom) */}
          {match.isServer1 && !isCompleted && (
            <div
              className="absolute -bottom-[4px] -left-[2px] w-[calc(100%+32px)] h-[48px] bg-[#dfff00] z-0 transition-all duration-300"
              style={{ borderRadius: "0px 26px 42px 0px" }}
            />
          )}
          <div
            className={`relative z-10 h-[48px] bg-gradient-to-r from-[#3bb8f6] via-[#0dadff] to-[#5ec3ff] text-[#031d38] flex items-center justify-between border-t border-white/60 shadow-inner overflow-hidden transition-all duration-300 ${
              match.isServer1 && !isCompleted ? "w-[calc(100%+20px)]" : "w-full"
            }`}
            style={{ borderRadius: "0px 22px 38px 0px" }}
          >
            {/* Player / Team Name (S1/S2 badge right aligned) */}
            <div className="w-[440px] flex items-center justify-between pl-4 pr-3 flex-shrink-0 min-w-0">
              <span 
                className="font-black italic uppercase text-[18px] tracking-[0.3px] text-[#031d38] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] pr-2 truncate block flex-1 min-w-0"
                style={{ WebkitTextStroke: "0.5px #031d38" }}
              >
                {team1Name}
              </span>
              {isDoubles && match.isServer1 && !isCompleted && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#072440]/80 text-[#dfff00] font-black text-[11px] italic border border-white/20 shadow-sm flex-shrink-0">
                  S{match.isFirstServeOfMatch ? "2" : match.serverNumber}
                </span>
              )}
            </div>

            {/* Set Wins box (BO3 / BO5) - Dark translucent black background */}
            <div className="w-[48px] h-full bg-[#06182a]/75 backdrop-blur-md border-x border-black/30 flex items-center justify-center flex-shrink-0">
              <span className="font-black italic text-[#ffffff] text-[24px] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {match.gamesWonTeam1 ?? 0}
              </span>
            </div>

            {/* Game Points */}
            <div className="w-[58px] h-full flex items-center justify-center flex-shrink-0">
              <span className="font-black italic text-[29px] text-[#031d38] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                {match.scoreTeam1}
              </span>
            </div>

            {/* Compact tail end */}
            <div className="w-[18px] h-full flex-shrink-0" />
          </div>
        </div>

        {/* Team 2 Row */}
        <div className="relative left-0 w-full">
          {/* Yellow Serve Layer underneath active server (Sticks out 8px to the right and 4px to the bottom) */}
          {match.isServer2 && !isCompleted && (
            <div
              className="absolute -bottom-[4px] -left-[2px] w-[calc(100%+32px)] h-[48px] bg-[#dfff00] z-0 transition-all duration-300"
              style={{ borderRadius: "0px 26px 42px 0px" }}
            />
          )}
          <div
            className={`relative z-10 h-[48px] bg-gradient-to-r from-[#3bb8f6] via-[#0dadff] to-[#5ec3ff] text-[#031d38] flex items-center justify-between border-t border-white/60 shadow-inner overflow-hidden transition-all duration-300 ${
              match.isServer2 && !isCompleted ? "w-[calc(100%+20px)]" : "w-full"
            }`}
            style={{ borderRadius: "0px 22px 38px 0px" }}
          >
            {/* Player / Team Name (S1/S2 badge right aligned) */}
            <div className="w-[440px] flex items-center justify-between pl-4 pr-3 flex-shrink-0 min-w-0">
              <span 
                className="font-black italic uppercase text-[18px] tracking-[0.3px] text-[#031d38] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] pr-2 truncate block flex-1 min-w-0"
                style={{ WebkitTextStroke: "0.5px #031d38" }}
              >
                {team2Name}
              </span>
              {isDoubles && match.isServer2 && !isCompleted && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#072440]/80 text-[#dfff00] font-black text-[11px] italic border border-white/20 shadow-sm flex-shrink-0">
                  S{match.isFirstServeOfMatch ? "2" : match.serverNumber}
                </span>
              )}
            </div>

            {/* Set Wins box (BO3 / BO5) - Dark translucent black background */}
            <div className="w-[48px] h-full bg-[#06182a]/75 backdrop-blur-md border-x border-black/30 flex items-center justify-center flex-shrink-0">
              <span className="font-black italic text-[#ffffff] text-[24px] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {match.gamesWonTeam2 ?? 0}
              </span>
            </div>

            {/* Game Points */}
            <div className="w-[58px] h-full flex items-center justify-center flex-shrink-0">
              <span className="font-black italic text-[29px] text-[#031d38] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                {match.scoreTeam2}
              </span>
            </div>

            {/* Compact tail end */}
            <div className="w-[18px] h-full flex-shrink-0" />
          </div>
        </div>

        {/* Tournament & Match Info Footer (Black tournament name, align-right) */}
        {(showTournament || showMatchCode) && (
          <div className="w-full flex flex-col items-end pr-10 font-black italic uppercase text-right pt-1 leading-tight">
            {showTournament && (
              <div className="text-[14px] tracking-[0.12em] text-[#000000] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                {match.tournamentName || "MEN'S DOUBLES"}
              </div>
            )}
            {(showMatchCode || startTime) && (
              <div className="text-[12px] tracking-[0.08em] text-[#dfff00] flex items-center gap-1.5 justify-end mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {showMatchCode && (
                  <span>{match.matchCode || "ROUND OF 16"}</span>
                )}
                {showMatchCode && startTime && (
                  <span className="font-normal opacity-80">|</span>
                )}
                {startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 inline -mt-0.5" />
                    {timeDisplay}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Dali Sport theme
  if (theme === "dali-sport") {
    const showHeaderVal = showTournament && (match.tournamentName || "GIẢI PICKLEBALL DALI SPORT 2026");
    const showFooterVal = showMatchCode && (match.matchCode || "VÒNG ĐẤU");

    return (
      <div className="relative min-w-[580px] h-[146px] flex-shrink-0">
        {showHeaderVal && (
          <div className="absolute top-[5px] left-[35px] bg-white text-[#333] shadow-lg text-[12px] font-extrabold px-[20px] pt-[6px] pb-[16px] rounded-t-[10px] z-10 uppercase tracking-[0.5px] whitespace-nowrap">
            {match.tournamentName || "GIẢI PICKLEBALL DALI SPORT 2026"}
          </div>
        )}
        <div className="absolute top-[32px] left-0 w-full h-[82px] rounded-[12px] flex z-20" style={{ backgroundColor: "#0c1c39" }}>
          <div className="relative flex-shrink-0" style={{ width: 76 }}>
            <div className="absolute -top-2 -bottom-2 left-0 w-[76px] flex items-center justify-center border-r border-white/10">
              <img
                src="/logo-tron.png"
                className="max-w-full max-h-full object-contain"
                alt="Logo"
                onError={(e) => {
                  e.currentTarget.src = "https://biamanhbeo.top/test/uploads/logo-dali.png";
                }}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center pl-[14px] pr-[15px] min-w-0">
            <div className="relative flex items-center h-[38px]">
              <div className={`absolute left-[-9px] top-[8px] bottom-[8px] w-[4px] rounded-full transition-all duration-300 ${match.isServer1 && !isCompleted ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-transparent"}`} />
              <div className="flex justify-between items-center w-full">
                <div className="text-white text-[16px] font-black uppercase tracking-wide truncate">{team1Name}</div>
                <div className="flex gap-[6px] items-center ml-2 flex-shrink-0">
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer1 && !isCompleted && (match.serverNumber >= 1 || match.isFirstServeOfMatch)
                      ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-[#333333]"
                  }`} />
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer1 && !isCompleted && (match.serverNumber === 2 || match.isFirstServeOfMatch)
                      ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-[#333333]"
                  }`} />
                </div>
              </div>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="relative flex items-center h-[38px]">
              <div className={`absolute left-[-9px] top-[8px] bottom-[8px] w-[4px] rounded-full transition-all duration-300 ${match.isServer2 && !isCompleted ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-transparent"}`} />
              <div className="flex justify-between items-center w-full">
                <div className="text-white text-[16px] font-black uppercase tracking-wide truncate">{team2Name}</div>
                <div className="flex gap-[6px] items-center ml-2 flex-shrink-0">
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer2 && !isCompleted && (match.serverNumber >= 1 || match.isFirstServeOfMatch)
                      ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-[#333333]"
                  }`} />
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                  match.isServer2 && !isCompleted && (match.serverNumber === 2 || match.isFirstServeOfMatch)
                    ? "bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-[#333333]"
                }`} />
              </div>
            </div>
            </div>
          </div>
          {(match.mode === "bo3" || match.mode === "bo5") && (
            <div className="w-[30px] bg-black/90 flex flex-col flex-shrink-0">
              <div className="flex-1 flex items-center justify-center text-white text-[16px] font-black border-b border-black/20">{match.gamesWonTeam1}</div>
              <div className="flex-1 flex items-center justify-center text-white text-[16px] font-black">{match.gamesWonTeam2}</div>
            </div>
          )}
          <div className="w-[52px] bg-[#f97316] rounded-r-[12px] flex flex-col flex-shrink-0">
            <div className="flex-1 flex items-center justify-center text-white text-[25px] font-black border-b border-black/25">{match.scoreTeam1}</div>
            <div className="flex-1 flex items-center justify-center text-white text-[25px] font-black">{match.scoreTeam2}</div>
          </div>
        </div>
        {showFooterVal && (
          <div className="absolute top-[104px] left-[35px] bg-white text-[#333] shadow-lg text-[12px] font-semibold px-[24px] pt-[14px] pb-[6px] rounded-b-[10px] z-10 uppercase whitespace-nowrap">
            {match.matchCode || "VÒNG 1 | BẢNG A"}
            {startTime && <span className="ml-3 text-[#555]">| <Clock className="w-3 h-3 inline -mt-0.5" /> {timeDisplay}</span>}
          </div>
        )}
      </div>
    );
  }

  // Minimal theme
  if (theme === "minimal") {
    return (
      <div className="relative min-w-[500px] h-[48px] flex-shrink-0">
        {(showTournament || showMatchCode) && (match.tournamentName || match.matchCode) && (
          <div className="absolute top-0 left-[10px] -translate-y-[26px] flex gap-2 items-center bg-slate-950/80 border border-slate-800 rounded-full px-3 py-0.5 shadow-md">
            {showTournament && match.tournamentName && (
              <span className="text-white/80 text-[9px] font-extrabold uppercase tracking-wider">{match.tournamentName}</span>
            )}
            {showTournament && match.tournamentName && showMatchCode && match.matchCode && (
              <span className="text-slate-600 text-[9px] font-black">|</span>
            )}
            {showMatchCode && match.matchCode && (
              <span className="text-orange-400 text-[9px] font-extrabold uppercase tracking-wider">{match.matchCode}</span>
            )}
          </div>
        )}
        <div className="w-full h-[48px] bg-slate-900/90 border border-slate-700/50 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center px-4 justify-between text-white overflow-hidden">
          <div className={`flex-1 flex items-center gap-2 min-w-0 transition-all duration-300 ${match.isServer1 && !isCompleted ? "text-[#0086ff]" : "text-white"}`}>
            {match.isServer1 && !isCompleted && (
              <div className="w-[6px] h-[6px] rounded-full bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.8)] animate-pulse flex-shrink-0" />
            )}
            <span className="font-extrabold text-[12px] uppercase tracking-wide whitespace-nowrap">{team1Name}</span>
            {match.isServer1 && !isCompleted && isDoubles && (
              <span className="text-[10px] font-black opacity-80">{match.isFirstServeOfMatch ? "²" : (match.serverNumber === 1 ? "¹" : "²")}</span>
            )}
          </div>
          <div className="flex items-center bg-black/40 px-3 py-1 rounded-full border border-white/5 mx-2 flex-shrink-0">
            <span className={`font-black text-[18px] min-w-[20px] text-center ${match.isServer1 && !isCompleted ? "text-[#0086ff]" : "text-slate-200"}`}>
              {match.scoreTeam1}
              {(match.mode === "bo3" || match.mode === "bo5") && (
                <span className="text-[10px] font-black text-amber-500 ml-1">({match.gamesWonTeam1})</span>
              )}
            </span>
            <span className="text-slate-600 font-bold mx-1.5 text-xs">-</span>
            <span className={`font-black text-[18px] min-w-[20px] text-center ${match.isServer2 && !isCompleted ? "text-[#ff6a00]" : "text-slate-200"}`}>
              {(match.mode === "bo3" || match.mode === "bo5") && (
                <span className="text-[10px] font-black text-amber-500 mr-1">({match.gamesWonTeam2})</span>
              )}
              {match.scoreTeam2}
            </span>
          </div>
          <div className={`flex-1 flex items-center justify-end gap-2 min-w-0 transition-all duration-300 ${match.isServer2 && !isCompleted ? "text-[#ff6a00]" : "text-white"}`}>
            {match.isServer2 && !isCompleted && isDoubles && (
              <span className="text-[10px] font-black opacity-80">{match.isFirstServeOfMatch ? "²" : (match.serverNumber === 1 ? "¹" : "²")}</span>
            )}
            <span className="font-extrabold text-[12px] uppercase tracking-wide whitespace-nowrap">{team2Name}</span>
            {match.isServer2 && !isCompleted && (
              <div className="w-[6px] h-[6px] rounded-full bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.8)] animate-pulse flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid themes (default, dark, cyberpunk, retro, glassmorphism)
  const hasHeader = (showTournament && match.tournamentName) || (showMatchCode && match.matchCode);

  let wrapperClass = "";
  let headerClass = "";
  let team1RowClass = "";
  let team2RowClass = "";
  let team1IndicatorClass = "";
  let team2IndicatorClass = "";
  let playerNameClass = "";
  let serverDotActiveT1Class = "";
  let serverDotInactiveT1Class = "";
  let serverDotActiveT2Class = "";
  let serverDotInactiveT2Class = "";
  let scoreT1Class = "";
  let scoreT2Class = "";
  let scoreAreaClass = "";
  let showLogo = false;
  let dotMarginClass = "ml-auto mr-2";

  if (theme === "dark") {
    showLogo = true;
    dotMarginClass = "ml-auto mr-3 pl-4";
    wrapperClass = "bg-[#0f172a] border border-slate-800 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-white";
    headerClass = "bg-[#1e293b] border-b border-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex justify-between";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-blue-950/20" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-orange-950/20" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-transparent";
    playerNameClass = "text-slate-100 text-[14px] font-extrabold uppercase tracking-wide pl-4";
    serverDotActiveT1Class = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]";
    serverDotInactiveT1Class = "bg-slate-700";
    serverDotActiveT2Class = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]";
    serverDotInactiveT2Class = "bg-slate-700";
    scoreAreaClass = "w-[60px] flex flex-col justify-center border-l border-slate-800";
    scoreT1Class = isCompleted
      ? (match.winnerTeam === 1 ? "text-blue-400 text-[26px] font-black" : "text-slate-500 text-[20px] font-bold")
      : (match.isServer1 ? "text-blue-400 text-[26px] font-black [text-shadow:0_0_6px_rgba(59,130,246,0.4)]" : "text-slate-400 text-[20px] font-bold");
    scoreT2Class = isCompleted
      ? (match.winnerTeam === 2 ? "text-orange-400 text-[26px] font-black" : "text-slate-500 text-[20px] font-bold")
      : (match.isServer2 ? "text-orange-400 text-[26px] font-black [text-shadow:0_0_6px_rgba(249,115,22,0.4)]" : "text-slate-400 text-[20px] font-bold");
  } else if (theme === "cyberpunk") {
    wrapperClass = "bg-black border-2 border-cyan-500/80 rounded-[12px] shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-400 font-mono";
    headerClass = "bg-black border-b border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 flex justify-between shadow-[0_0_5px_rgba(6,182,212,0.2)]";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-cyan-950/20" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-pink-950/20" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]" : "bg-transparent";
    playerNameClass = "text-cyan-200 text-[14px] font-black uppercase tracking-wider pl-4";
    serverDotActiveT1Class = "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]";
    serverDotInactiveT1Class = "bg-cyan-950/60";
    serverDotActiveT2Class = "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]";
    serverDotInactiveT2Class = "bg-pink-950/60";
    scoreAreaClass = "w-[60px] flex flex-col justify-center border-l border-cyan-500/30";
    scoreT1Class = isCompleted
      ? (match.winnerTeam === 1 ? "text-cyan-400 text-[26px] font-black [text-shadow:0_0_8px_rgba(34,211,238,0.6)]" : "text-cyan-800 text-[20px] font-bold")
      : (match.isServer1 ? "text-cyan-400 text-[26px] font-black [text-shadow:0_0_8px_rgba(34,211,238,0.6)]" : "text-cyan-700 text-[20px] font-bold");
    scoreT2Class = isCompleted
      ? (match.winnerTeam === 2 ? "text-pink-500 text-[26px] font-black [text-shadow:0_0_8px_rgba(236,72,153,0.6)]" : "text-pink-800 text-[20px] font-bold")
      : (match.isServer2 ? "text-pink-500 text-[26px] font-black [text-shadow:0_0_8px_rgba(236,72,153,0.6)]" : "text-pink-700 text-[20px] font-bold");
  } else if (theme === "retro") {
    wrapperClass = "bg-black border-4 border-yellow-400 rounded-none shadow-[6px_6px_0px_#000] text-yellow-400 font-mono uppercase";
    headerClass = "bg-black border-b-4 border-yellow-400 text-yellow-400 text-[10px] font-black px-4 py-1.5 flex justify-between tracking-wide";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-yellow-950/40" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-yellow-950/40" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-yellow-400" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-yellow-400" : "bg-transparent";
    playerNameClass = "text-yellow-300 text-[14px] font-bold tracking-wide pl-4";
    serverDotActiveT1Class = "bg-green-400";
    serverDotInactiveT1Class = "bg-red-900";
    serverDotActiveT2Class = "bg-green-400";
    serverDotInactiveT2Class = "bg-red-900";
    scoreAreaClass = "w-[60px] flex flex-col justify-center border-l-4 border-yellow-400";
    scoreT1Class = isCompleted
      ? (match.winnerTeam === 1 ? "text-green-400 text-[26px] font-black" : "text-red-500 text-[20px] font-bold")
      : (match.isServer1 ? "text-green-400 text-[26px] font-black" : "text-red-500 text-[20px] font-bold");
    scoreT2Class = isCompleted
      ? (match.winnerTeam === 2 ? "text-green-400 text-[26px] font-black" : "text-red-500 text-[20px] font-bold")
      : (match.isServer2 ? "text-green-400 text-[26px] font-black" : "text-red-500 text-[20px] font-bold");
  } else if (theme === "glassmorphism") {
    wrapperClass = "bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-white";
    headerClass = "bg-white/5 border-b border-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex justify-between";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-white/10" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-white/10" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" : "bg-transparent";
    playerNameClass = "text-white text-[14px] font-extrabold uppercase tracking-wide pl-4";
    serverDotActiveT1Class = "bg-blue-400";
    serverDotInactiveT1Class = "bg-white/20";
    serverDotActiveT2Class = "bg-orange-400";
    serverDotInactiveT2Class = "bg-white/20";
    scoreAreaClass = "w-[60px] flex flex-col justify-center border-l border-white/10";
    scoreT1Class = isCompleted
      ? (match.winnerTeam === 1 ? "text-blue-400 text-[26px] font-black" : "text-white/40 text-[20px] font-bold")
      : (match.isServer1 ? "text-blue-400 text-[26px] font-black [text-shadow:0_0_6px_rgba(96,165,250,0.4)]" : "text-white/60 text-[20px] font-bold");
    scoreT2Class = isCompleted
      ? (match.winnerTeam === 2 ? "text-orange-400 text-[26px] font-black" : "text-white/40 text-[20px] font-bold")
      : (match.isServer2 ? "text-orange-400 text-[26px] font-black [text-shadow:0_0_6px_rgba(251,146,60,0.4)]" : "text-white/60 text-[20px] font-bold");
  } else {
    // Default (Light)
    wrapperClass = "bg-white border border-black/8 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.06)]";
    headerClass = "bg-[#f8fafc] border-b border-black/5 text-[#64748b] text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 flex justify-between";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-blue-50/50" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-orange-50/50" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.5)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.5)]" : "bg-transparent";
    playerNameClass = "text-[#334155] text-[14px] font-extrabold uppercase tracking-wide pl-4";
    serverDotActiveT1Class = "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.4)]";
    serverDotInactiveT1Class = "bg-[#cbd5e1]";
    serverDotActiveT2Class = "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.4)]";
    serverDotInactiveT2Class = "bg-[#cbd5e1]";
    scoreAreaClass = "w-[60px] flex flex-col justify-center border-l border-black/5";
    scoreT1Class = isCompleted
      ? (match.winnerTeam === 1 ? "text-[#0086ff] text-[26px] font-black" : "text-[#64748b] text-[20px] font-bold")
      : (match.isServer1 ? "text-[#0086ff] text-[26px] font-black [text-shadow:0_0_6px_rgba(0,134,255,0.2)]" : "text-[#64748b] text-[20px] font-bold");
    scoreT2Class = isCompleted
      ? (match.winnerTeam === 2 ? "text-[#ff6a00] text-[26px] font-black" : "text-[#64748b] text-[20px] font-bold")
      : (match.isServer2 ? "text-[#ff6a00] text-[26px] font-black [text-shadow:0_0_6px_rgba(255,106,0,0.2)]" : "text-[#64748b] text-[20px] font-bold");
  }

  return (
    <div
      className={`min-w-[420px] overflow-hidden flex flex-col transition-all duration-300 ${wrapperClass} flex-shrink-0`}
      style={{ height: hasHeader ? "126px" : "100px" }}
    >
      {hasHeader && (
        <div className={headerClass}>
          <span className="whitespace-nowrap">{showTournament ? (match.tournamentName || "Giải đấu") : ""}</span>
           <span className="flex-shrink-0 text-right">{showMatchCode ? match.matchCode : ""}{startTime ? <><span className="mx-1">|</span><Clock className="w-3 h-3 inline -mt-0.5" /> {timeDisplay}</> : ""}</span>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        {showLogo && (
          <div className="w-[100px] flex items-center justify-center p-[5px] bg-slate-800/50 rounded-l-[18px]">
            <img
              src="/logo-tron.png"
              className="max-w-[90%] max-h-[90%] object-contain"
              alt="Logo"
              onError={(e) => { e.currentTarget.src = "https://biamanhbeo.top/test/uploads/logo-dali.png"; }}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${team1RowClass}`}>
            <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${team1IndicatorClass}`} />
            <span className={playerNameClass}>{team1Name}</span>
            {isDoubles && (
              <div className={`flex flex-col gap-[3px] justify-center ${dotMarginClass}`}>
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${(match.isServer1 && !isCompleted && (match.serverNumber >= 1 || match.isFirstServeOfMatch)) ? serverDotActiveT1Class : serverDotInactiveT1Class}`} />
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${(match.isServer1 && !isCompleted && (match.serverNumber === 2 || match.isFirstServeOfMatch)) ? serverDotActiveT1Class : serverDotInactiveT1Class}`} />
              </div>
            )}
          </div>
          <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${team2RowClass}`}>
            <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${team2IndicatorClass}`} />
            <span className={playerNameClass}>{team2Name}</span>
            {isDoubles && (
              <div className={`flex flex-col gap-[3px] justify-center ${dotMarginClass}`}>
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${(match.isServer2 && !isCompleted && (match.serverNumber >= 1 || match.isFirstServeOfMatch)) ? serverDotActiveT2Class : serverDotInactiveT2Class}`} />
                <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${(match.isServer2 && !isCompleted && (match.serverNumber === 2 || match.isFirstServeOfMatch)) ? serverDotActiveT2Class : serverDotInactiveT2Class}`} />
              </div>
            )}
          </div>
        </div>
        {(match.mode === "bo3" || match.mode === "bo5") && (
          <div className="w-[30px] flex flex-col justify-stretch bg-[#e65100]/90 text-white font-black text-sm border-r border-black/10 border-l border-black/10">
            <div className="flex-grow flex items-center justify-center h-[50px] border-b border-black/10">{match.gamesWonTeam1}</div>
            <div className="flex-grow flex items-center justify-center h-[50px]">{match.gamesWonTeam2}</div>
          </div>
        )}
        <div className={scoreAreaClass}>
          <div className={`flex items-center justify-center h-[50px] transition-all duration-300 ${scoreT1Class}`}>{match.scoreTeam1}</div>
          <div className={`flex items-center justify-center h-[50px] transition-all duration-300 ${scoreT2Class}`}>{match.scoreTeam2}</div>
        </div>
      </div>
    </div>
  );
}
