import { Link, useLocation } from "wouter";
import { Home, Briefcase, User, Trophy, HelpCircle } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "TRỌNG TÀI SỐ" },
    { href: "/tools", icon: Briefcase, label: "PICKLEBALL" },
    { href: "/ranking", icon: Trophy, label: "XẾP HẠNG" },
    { href: "/profile", icon: User, label: "ID" },
  ];

  // Không hiện Nav khi đang trong trận đấu để tập trung
  if (location.includes("/match")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <item.icon
                  className={`w-6 h-6 ${isActive ? "fill-current" : ""}`}
                />
                <span className="text-[10px] font-bold uppercase">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
