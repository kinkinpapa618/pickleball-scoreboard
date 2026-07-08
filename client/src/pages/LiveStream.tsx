import { useLiveStreamMatches } from "@/hooks/use-api";
import { useState, useEffect, useRef } from "react";
import { Settings, Palette, Check } from "lucide-react";
import ScoreboardOverlay from "@/components/ScoreboardOverlay";

export default function LiveStream() {
  const { data: matches } = useLiveStreamMatches(1000);

  const [theme, setTheme] = useState("dark");
  const [showTournament, setShowTournament] = useState(true);
  const [showMatchCode, setShowMatchCode] = useState(true);

  const [hudVisible, setHudVisible] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  // Auto-hide completed matches after 5 seconds
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!matches) return;
    const completedIds = new Set(
      matches.filter(m => m.status === "completed" || m.status === "finished").map(m => m.id)
    );
    completedIds.forEach(id => {
      if (!timersRef.current.has(id) && !hiddenIds.has(id)) {
        const timer = setTimeout(() => {
          setHiddenIds(prev => new Set(prev).add(id));
          timersRef.current.delete(id);
        }, 5000);
        timersRef.current.set(id, timer);
      }
    });
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, [matches]);

  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get("theme");
    const urlShowTourney = params.get("showTournament");
    const urlShowMatch = params.get("showMatch");

    if (urlTheme) setTheme(urlTheme);
    else setTheme(localStorage.getItem("livestream-theme") || "dark");

    if (urlShowTourney !== null) setShowTournament(urlShowTourney === "1" || urlShowTourney === "true");
    else setShowTournament(localStorage.getItem("livestream-show-tournament") !== "false");

    if (urlShowMatch !== null) setShowMatchCode(urlShowMatch === "1" || urlShowMatch === "true");
    else setShowMatchCode(localStorage.getItem("livestream-show-matchcode") !== "false");
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setHudVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => { if (!hudOpen) setHudVisible(false); }, 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => { window.removeEventListener("mousemove", handleMouseMove); clearTimeout(timeout); };
  }, [hudOpen]);

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("livestream-theme", newTheme);
    updateUrlParams("theme", newTheme);
  };

  const updateShowTournament = (val: boolean) => {
    setShowTournament(val);
    localStorage.setItem("livestream-show-tournament", String(val));
    updateUrlParams("showTournament", val ? "1" : "0");
  };

  const updateShowMatchCode = (val: boolean) => {
    setShowMatchCode(val);
    localStorage.setItem("livestream-show-matchcode", String(val));
    updateUrlParams("showMatch", val ? "1" : "0");
  };

  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };



  const liveMatches = matches?.filter(m => m.status === "live") || [];
  const finishedMatches = matches?.filter(m => m.status !== "live") || [];

  return (
    <div className="h-screen w-full bg-transparent font-sans overflow-hidden select-none">
      <style>{`body { overflow: hidden !important; } ::-webkit-scrollbar { display: none !important; }`}</style>

      <div className="absolute top-[15px] left-[15px] flex flex-col gap-3">
        {liveMatches.map((match) => (
          <ScoreboardOverlay
            key={match.id}
            match={match}
            theme={theme}
            showTournament={showTournament}
            showMatchCode={showMatchCode}
          />
        ))}
        {finishedMatches.map((match) => (
          hiddenIds.has(match.id) ? null : (
            <div key={match.id} className="transition-opacity duration-1000 opacity-100">
              <ScoreboardOverlay
                match={match}
                theme={theme}
                showTournament={showTournament}
                showMatchCode={showMatchCode}
              />
            </div>
          )
        ))}
      </div>

      {/* HUD Settings Panel */}
      <div className={`fixed top-4 right-4 z-50 flex flex-col items-end gap-2 transition-opacity duration-300 ${hudVisible || hudOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button onClick={() => setHudOpen(!hudOpen)} className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 shadow-md transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
        {hudOpen && (
          <div className="bg-slate-950/95 border border-slate-800 text-slate-200 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4 font-sans text-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center gap-1.5"><Palette className="w-4 h-4 text-blue-400" /> Settings</span>
              <button onClick={() => setHudOpen(false)} className="text-xs text-slate-500 hover:text-white">Close</button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Theme</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: "dark", name: "Dark" },
                  { id: "dali-sport", name: "Dali Sport" },
                  { id: "default", name: "Light" },
                  { id: "cyberpunk", name: "Neon" },
                  { id: "retro", name: "Retro" },
                  { id: "glassmorphism", name: "Glass" },
                  { id: "minimal", name: "Minimal" },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => updateTheme(opt.id)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold text-left transition-colors flex items-center justify-between ${theme === opt.id ? "bg-blue-600 text-white" : "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"}`}>
                    {opt.name}{theme === opt.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Display</label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Tournament Name</span>
                <input type="checkbox" checked={showTournament} onChange={(e) => updateShowTournament(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Match Code</span>
                <input type="checkbox" checked={showMatchCode} onChange={(e) => updateShowMatchCode(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
