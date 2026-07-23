import { useParams } from "wouter";
import { useMatch } from "@/hooks/use-api";
import { useState, useEffect } from "react";
import { Settings, Palette, Check } from "lucide-react";
import ScoreboardOverlay from "@/components/ScoreboardOverlay";

export default function MatchOverlay() {
  const { id } = useParams();
  const { data: match } = useMatch(parseInt(id || "0"), 1000);
  const [visible, setVisible] = useState(true);

  const [theme, setTheme] = useState("default");
  const [showTournament, setShowTournament] = useState(true);
  const [showMatchCode, setShowMatchCode] = useState(true);

  const [hudVisible, setHudVisible] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  const isCompleted = match?.status === "completed";

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
    else setTheme(localStorage.getItem("scoreboard-theme") || "default");

    if (urlShowTourney !== null) setShowTournament(urlShowTourney === "1" || urlShowTourney === "true");
    else setShowTournament(localStorage.getItem("scoreboard-show-tournament") !== "false");

    if (urlShowMatch !== null) setShowMatchCode(urlShowMatch === "1" || urlShowMatch === "true");
    else setShowMatchCode(localStorage.getItem("scoreboard-show-matchcode") !== "false");
  }, [id]);

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [isCompleted]);

  useEffect(() => {
    if (!match) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("theme") && match.theme && match.theme !== theme) setTheme(match.theme);
    if (params.get("showTournament") === null && match.showTournament !== undefined && match.showTournament !== showTournament)
      setShowTournament(match.showTournament ?? true);
    if (params.get("showMatch") === null && match.showMatchCode !== undefined && match.showMatchCode !== showMatchCode)
      setShowMatchCode(match.showMatchCode ?? true);
  }, [match?.theme, match?.showTournament, match?.showMatchCode]);

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

  if (!match) return null;

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
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div id="overlay-root" className={`h-screen w-full bg-transparent font-sans overflow-hidden select-none transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <style>{`body { overflow: hidden !important; } ::-webkit-scrollbar { display: none !important; }`}</style>

      <div className="absolute top-[15px] left-[15px]">
        <ScoreboardOverlay match={match} theme={theme} showTournament={showTournament} showMatchCode={showMatchCode} />
      </div>

      <div className={`fixed top-4 right-4 z-50 flex flex-col items-end gap-2 transition-opacity duration-300 ${hudVisible || hudOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button onClick={() => setHudOpen(!hudOpen)} className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 shadow-md transition-colors" title="Cài đặt giao diện">
          <Settings className="w-4 h-4" />
        </button>
        {hudOpen && (
          <div className="bg-slate-950/95 border border-slate-800 text-slate-200 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4 font-sans text-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center gap-1.5"><Palette className="w-4 h-4 text-blue-400" /> Cài đặt Overlay</span>
              <button onClick={() => setHudOpen(false)} className="text-xs text-slate-500 hover:text-white">Đóng</button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Chủ đề bảng điểm</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: "default", name: "Sáng" }, { id: "dark", name: "Tối" }, { id: "ppa", name: "PPA Tour" }, { id: "cyberpunk", name: "Neon" },
                  { id: "retro", name: "Retro" }, { id: "glassmorphism", name: "Kính mờ" }, { id: "minimal", name: "Thanh ngang" }, { id: "dali-sport", name: "Dali Sport" },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => updateTheme(opt.id)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold text-left transition-colors flex items-center justify-between ${theme === opt.id ? "bg-blue-600 text-white" : "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"}`}>
                    {opt.name}{theme === opt.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thông tin hiển thị</label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Tên giải đấu</span>
                <input type="checkbox" checked={showTournament} onChange={(e) => updateShowTournament(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300">Mã trận đấu</span>
                <input type="checkbox" checked={showMatchCode} onChange={(e) => updateShowMatchCode(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
