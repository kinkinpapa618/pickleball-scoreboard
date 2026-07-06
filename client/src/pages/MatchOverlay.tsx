import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useState, useEffect } from "react";
import { Settings, Palette, Check } from "lucide-react";

export default function MatchOverlay() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"), 1000);
  const [visible, setVisible] = useState(true);

  // Cấu hình hiển thị và giao diện
  const [theme, setTheme] = useState("default");
  const [showTournament, setShowTournament] = useState(true);
  const [showMatchCode, setShowMatchCode] = useState(true);

  // HUD state
  const [hudVisible, setHudVisible] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  const isCompleted = match?.status === "completed";

  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    // Parse URL search params
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get("theme");
    const urlShowTourney = params.get("showTournament");
    const urlShowMatch = params.get("showMatch");

    // Resolve Theme
    if (urlTheme) {
      setTheme(urlTheme);
    } else {
      const savedTheme = localStorage.getItem("scoreboard-theme") || "default";
      setTheme(savedTheme);
    }

    // Resolve Show Tournament Name
    if (urlShowTourney !== null) {
      setShowTournament(urlShowTourney === "1" || urlShowTourney === "true");
    } else {
      const savedShow = localStorage.getItem("scoreboard-show-tournament");
      setShowTournament(savedShow === null ? true : savedShow === "true");
    }

    // Resolve Show Match Code
    if (urlShowMatch !== null) {
      setShowMatchCode(urlShowMatch === "1" || urlShowMatch === "true");
    } else {
      const savedShow = localStorage.getItem("scoreboard-show-matchcode");
      setShowMatchCode(savedShow === null ? true : savedShow === "true");
    }
  }, [id]);

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isCompleted]);

  // Live database settings synchronization for real-time overlay updates
  useEffect(() => {
    if (!match) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("theme") && match.theme && match.theme !== theme) {
      setTheme(match.theme);
    }
    if (params.get("showTournament") === null && match.showTournament !== undefined && match.showTournament !== showTournament) {
      setShowTournament(match.showTournament);
    }
    if (params.get("showMatch") === null && match.showMatchCode !== undefined && match.showMatchCode !== showMatchCode) {
      setShowMatchCode(match.showMatchCode);
    }
  }, [match?.theme, match?.showTournament, match?.showMatchCode, showTournament, showMatchCode, theme]);

  // HUD timer auto-hide
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setHudVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!hudOpen) {
          setHudVisible(false);
        }
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [hudOpen]);

  if (!match) return null;

  const isDoubles = match.type === "doubles";
  const team1Name = isDoubles && match.team1Player2
    ? `${match.team1Player1} / ${match.team1Player2}`
    : match.team1Player1;
  const team2Name = isDoubles && match.team2Player2
    ? `${match.team2Player1} / ${match.team2Player2}`
    : match.team2Player1;

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("scoreboard-theme", newTheme);
    updateUrlParams("theme", newTheme);
  };

  const updateShowTournament = (val: boolean) => {
    setShowTournament(val);
    localStorage.setItem("scoreboard-show-tournament", String(val));
    updateUrlParams("showTournament", val ? "1" : "0");
  };

  const updateShowMatchCode = (val: boolean) => {
    setShowMatchCode(val);
    localStorage.setItem("scoreboard-show-matchcode", String(val));
    updateUrlParams("showMatch", val ? "1" : "0");
  };

  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Render Theme: Dali Sport (cloned from biamanhbeo.top/bangdiem)
  if (theme === "dali-sport") {
    const showHeaderVal = showTournament && (match.tournamentName || "GIẢI PICKLEBALL DALI SPORT 2026");
    const showFooterVal = showMatchCode && (match.matchCode || "VÒNG ĐẤU");

    return (
      <div id="overlay-root" className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <div className="absolute top-[15px] left-[15px] w-[580px] h-[140px]">
          
          {/* Header Tab */}
          {showHeaderVal && (
            <div className="absolute top-[5px] left-[35px] bg-[#545454] text-[#e2e2e2] text-[12px] font-extrabold px-[20px] pt-[6px] pb-[16px] rounded-t-[10px] z-10 uppercase tracking-[0.5px] whitespace-nowrap">
              {match.tournamentName || "GIẢI PICKLEBALL DALI SPORT 2026"}
            </div>
          )}

          {/* Main Board */}
          <div className="absolute top-[32px] left-0 w-full h-[76px] bg-[#181818] rounded-[12px] flex z-20 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            
            {/* Logo Area */}
            <div className="w-[120px] flex items-center justify-center p-[5px]">
              <img 
                src="/logo-tron.png" 
                className="max-w-[90%] max-h-[90%] object-contain" 
                alt="Logo Dali"
                onError={(e) => {
                  e.currentTarget.src = "https://biamanhbeo.top/test/uploads/logo-dali.png";
                }}
              />
            </div>

            {/* Names & Dots Area */}
            <div className="flex-1 flex flex-col justify-center pl-[5px] pr-[15px]">
              
              {/* Row Team 1 */}
              <div className="flex justify-between items-center h-[34px]">
                <div className="text-white text-[16px] font-black uppercase tracking-wide truncate max-w-[280px]">
                  {team1Name}
                </div>
                <div className="flex gap-[6px] items-center">
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer1 && !isCompleted && match.serverNumber >= 1 
                      ? "bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]" 
                      : "bg-[#333333]"
                  }`} />
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer1 && !isCompleted && match.serverNumber === 2 
                      ? "bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]" 
                      : "bg-[#333333]"
                  }`} />
                </div>
              </div>

              {/* Row Team 2 */}
              <div className="flex justify-between items-center h-[34px]">
                <div className="text-white text-[16px] font-black uppercase tracking-wide truncate max-w-[280px]">
                  {team2Name}
                </div>
                <div className="flex gap-[6px] items-center">
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer2 && !isCompleted && match.serverNumber >= 1 
                      ? "bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]" 
                      : "bg-[#333333]"
                  }`} />
                  <div className={`w-[13px] h-[13px] rounded-full transition-all duration-200 ${
                    match.isServer2 && !isCompleted && match.serverNumber === 2 
                      ? "bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]" 
                      : "bg-[#333333]"
                  }`} />
                </div>
              </div>

            </div>

            {/* Sets Area (Only for BO3/BO5) */}
            {(match.mode === "bo3" || match.mode === "bo5") && (
              <div className="w-[30px] bg-amber-600/90 flex flex-col border-r border-black/20">
                <div className="flex-1 flex items-center justify-center text-white text-[16px] font-black border-b border-black/20">
                  {match.gamesWonTeam1}
                </div>
                <div className="flex-1 flex items-center justify-center text-white text-[16px] font-black">
                  {match.gamesWonTeam2}
                </div>
              </div>
            )}

            {/* Score Area */}
            <div className="w-[52px] bg-[#009a44] rounded-r-[12px] flex flex-col">
              <div className="flex-1 flex items-center justify-center text-white text-[26px] font-black border-b border-black/25">
                {match.scoreTeam1}
              </div>
              <div className="flex-1 flex items-center justify-center text-white text-[26px] font-black">
                {match.scoreTeam2}
              </div>
            </div>

          </div>

          {/* Footer Tab */}
          {showFooterVal && (
            <div className="absolute top-[96px] left-[35px] bg-[#545454] text-[#c0c0c0] text-[12px] font-semibold px-[24px] pt-[14px] pb-[6px] rounded-b-[10px] z-10 uppercase whitespace-nowrap">
              {match.matchCode || "VÒNG 1 | BẢNG A"}
            </div>
          )}

        </div>

        {/* Floating HUD Settings panel */}
        {renderHud()}
      </div>
    );
  }

  // Render Theme: Minimal Bar
  if (theme === "minimal") {
    return (
      <div id="overlay-root" className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        
        {/* Floating Tournament/Match Header */}
        {(showTournament || showMatchCode) && (match.tournamentName || match.matchCode) && (
          <div className="absolute top-[15px] left-[25px] -translate-y-[26px] flex gap-2 items-center bg-slate-950/80 border border-slate-800 rounded-full px-3 py-0.5 shadow-md">
            {showTournament && match.tournamentName && (
              <span className="text-white/80 text-[9px] font-extrabold uppercase tracking-wider">
                {match.tournamentName}
              </span>
            )}
            {showTournament && match.tournamentName && showMatchCode && match.matchCode && (
              <span className="text-slate-600 text-[9px] font-black">|</span>
            )}
            {showMatchCode && match.matchCode && (
              <span className="text-orange-400 text-[9px] font-extrabold uppercase tracking-wider">
                {match.matchCode}
              </span>
            )}
          </div>
        )}

        {/* Minimal Bar Card */}
        <div className="absolute top-[15px] left-[15px] w-[500px] h-[48px] bg-slate-900/90 border border-slate-700/50 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center px-4 justify-between text-white overflow-hidden">
          
          {/* Team 1 Section */}
          <div className={`flex-1 flex items-center gap-2 min-w-0 transition-all duration-300 ${
            match.isServer1 && !isCompleted ? "text-[#0086ff]" : "text-white"
          }`}>
            {match.isServer1 && !isCompleted && (
              <div className="w-[6px] h-[6px] rounded-full bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.8)] animate-pulse flex-shrink-0" />
            )}
            <span className="font-extrabold text-[12px] uppercase tracking-wide truncate">
              {team1Name}
            </span>
            {match.isServer1 && !isCompleted && isDoubles && (
              <span className="text-[10px] font-black opacity-80">
                {match.serverNumber === 1 ? "¹" : "²"}
              </span>
            )}
          </div>

          {/* Scoreboard Middle */}
          <div className="flex items-center bg-black/40 px-3 py-1 rounded-full border border-white/5 mx-2 flex-shrink-0">
            <span className={`font-black text-[18px] min-w-[20px] text-center ${
              match.isServer1 && !isCompleted ? "text-[#0086ff]" : "text-slate-200"
            }`}>
              {match.scoreTeam1}
              {(match.mode === "bo3" || match.mode === "bo5") && (
                <span className="text-[10px] font-black text-amber-500 ml-1">
                  ({match.gamesWonTeam1})
                </span>
              )}
            </span>
            <span className="text-slate-600 font-bold mx-1.5 text-xs">-</span>
            <span className={`font-black text-[18px] min-w-[20px] text-center ${
              match.isServer2 && !isCompleted ? "text-[#ff6a00]" : "text-slate-200"
            }`}>
              {(match.mode === "bo3" || match.mode === "bo5") && (
                <span className="text-[10px] font-black text-amber-500 mr-1">
                  ({match.gamesWonTeam2})
                </span>
              )}
              {match.scoreTeam2}
            </span>
          </div>

          {/* Team 2 Section */}
          <div className={`flex-1 flex items-center justify-end gap-2 min-w-0 transition-all duration-300 ${
            match.isServer2 && !isCompleted ? "text-[#ff6a00]" : "text-white"
          }`}>
            {match.isServer2 && !isCompleted && isDoubles && (
              <span className="text-[10px] font-black opacity-80">
                {match.serverNumber === 1 ? "¹" : "²"}
              </span>
            )}
            <span className="font-extrabold text-[12px] uppercase tracking-wide truncate">
              {team2Name}
            </span>
            {match.isServer2 && !isCompleted && (
              <div className="w-[6px] h-[6px] rounded-full bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.8)] animate-pulse flex-shrink-0" />
            )}
          </div>

        </div>

        {/* Floating HUD Settings panel */}
        {renderHud()}
      </div>
    );
  }

  // Configurations for Grid themes
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

  if (theme === "dark") {
    wrapperClass = "bg-[#0f172a] border border-slate-800 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-white";
    headerClass = "bg-[#1e293b] border-b border-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex justify-between";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-blue-950/20" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-orange-950/20" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-transparent";
    playerNameClass = "text-slate-100 text-[14px] font-extrabold uppercase tracking-wide truncate pl-4";
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
    playerNameClass = "text-cyan-200 text-[14px] font-black uppercase tracking-wider truncate pl-4";
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
    playerNameClass = "text-yellow-300 text-[14px] font-bold tracking-wide truncate pl-4";
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
    playerNameClass = "text-white text-[14px] font-extrabold uppercase tracking-wide truncate pl-4";
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
    // Default (Light Theme)
    wrapperClass = "bg-white border border-black/8 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.06)]";
    headerClass = "bg-[#f8fafc] border-b border-black/5 text-[#64748b] text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 flex justify-between";
    team1RowClass = match.isServer1 && !isCompleted ? "bg-blue-50/50" : "";
    team2RowClass = match.isServer2 && !isCompleted ? "bg-orange-50/50" : "";
    team1IndicatorClass = match.isServer1 && !isCompleted ? "bg-[#0086ff] shadow-[0_0_8px_rgba(0,134,255,0.5)]" : "bg-transparent";
    team2IndicatorClass = match.isServer2 && !isCompleted ? "bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.5)]" : "bg-transparent";
    playerNameClass = "text-[#334155] text-[14px] font-extrabold uppercase tracking-wide truncate pl-4";
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
    <div id="overlay-root" className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      <div 
        className={`absolute top-[15px] left-[15px] w-[420px] overflow-hidden flex flex-col transition-all duration-300 ${wrapperClass}`}
        style={{ height: hasHeader ? "126px" : "100px" }}
      >
        {/* Header Bar */}
        {hasHeader && (
          <div className={headerClass}>
            <span className="truncate max-w-[240px]">
              {showTournament ? (match.tournamentName || "Giải đấu") : ""}
            </span>
            <span className="flex-shrink-0 text-right">
              {showMatchCode ? match.matchCode : ""}
            </span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Names Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Team 1 Row */}
            <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${team1RowClass}`}>
              <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${team1IndicatorClass}`} />
              <span className={playerNameClass}>
                {team1Name}
              </span>
              {match.isServer1 && !isCompleted && isDoubles && (
                <div className="flex flex-col gap-[3px] justify-center ml-auto mr-1">
                  <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                    match.serverNumber >= 1 ? serverDotActiveT1Class : serverDotInactiveT1Class
                  }`} />
                  <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                    match.serverNumber === 2 ? serverDotActiveT1Class : serverDotInactiveT1Class
                  }`} />
                </div>
              )}
            </div>

            {/* Team 2 Row */}
            <div className={`relative flex items-center h-[50px] px-3 transition-all duration-300 ${team2RowClass}`}>
              <div className={`absolute left-[10px] top-[10px] bottom-[10px] w-[4px] rounded-full transition-all duration-300 ${team2IndicatorClass}`} />
              <span className={playerNameClass}>
                {team2Name}
              </span>
              {match.isServer2 && !isCompleted && isDoubles && (
                <div className="flex flex-col gap-[3px] justify-center ml-auto mr-1">
                  <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                    match.serverNumber >= 1 ? serverDotActiveT2Class : serverDotInactiveT2Class
                  }`} />
                  <div className={`w-[12px] h-[5px] rounded-[2px] transition-all duration-300 ${
                    match.serverNumber === 2 ? serverDotActiveT2Class : serverDotInactiveT2Class
                  }`} />
                </div>
              )}
            </div>
          </div>

          {/* Sets Area (Only for BO3/BO5) */}
          {(match.mode === "bo3" || match.mode === "bo5") && (
            <div className="w-[30px] flex flex-col justify-stretch bg-[#e65100]/90 text-white font-black text-sm border-r border-black/10 border-l border-black/10">
              <div className="flex-grow flex items-center justify-center h-[50px] border-b border-black/10">
                {match.gamesWonTeam1}
              </div>
              <div className="flex-grow flex items-center justify-center h-[50px]">
                {match.gamesWonTeam2}
              </div>
            </div>
          )}

          {/* Score Area */}
          <div className={scoreAreaClass}>
            <div className={`flex items-center justify-center h-[50px] transition-all duration-300 ${scoreT1Class}`}>
              {match.scoreTeam1}
            </div>
            <div className={`flex items-center justify-center h-[50px] transition-all duration-300 ${scoreT2Class}`}>
              {match.scoreTeam2}
            </div>
          </div>
        </div>
      </div>

      {/* Floating HUD Settings panel */}
      {renderHud()}
    </div>
  );

  // Helper for HUD UI Rendering
  function renderHud() {
    return (
      <div 
        className={`fixed top-4 right-4 z-50 flex flex-col items-end gap-2 transition-opacity duration-300 ${
          hudVisible || hudOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => setHudOpen(!hudOpen)}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 shadow-md transition-colors"
          title="Cài đặt giao diện"
        >
          <Settings className="w-4 h-4" />
        </button>

        {hudOpen && (
          <div className="bg-slate-950/95 border border-slate-800 text-slate-200 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4 font-sans text-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-400" /> Cài đặt Overlay
              </span>
              <button onClick={() => setHudOpen(false)} className="text-xs text-slate-500 hover:text-white">Đóng</button>
            </div>

            {/* Theme Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Chủ đề bảng điểm</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: "default", name: "Sáng" },
                  { id: "dark", name: "Tối" },
                  { id: "cyberpunk", name: "Neon" },
                  { id: "retro", name: "Retro" },
                  { id: "glassmorphism", name: "Kính mờ" },
                  { id: "minimal", name: "Thanh ngang" },
                  { id: "dali-sport", name: "Dali Sport" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateTheme(opt.id)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                      theme === opt.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {opt.name}
                    {theme === opt.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Toggles */}
            <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thông tin hiển thị</label>
              
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Tên giải đấu</span>
                <input
                  type="checkbox"
                  checked={showTournament}
                  onChange={(e) => updateShowTournament(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Mã trận đấu</span>
                <input
                  type="checkbox"
                  checked={showMatchCode}
                  onChange={(e) => updateShowMatchCode(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }
}
