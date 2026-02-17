import { Link, useLocation } from "wouter";
import { Home, Briefcase, User, Trophy, Settings, Layers } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "TRANG CHỦ" },
    { href: "/tools", icon: Briefcase, label: "CÔNG CỤ" },
    { href: "/tournament", icon: Layers, label: "GIẢI ĐẤU" },
    { href: "/users", icon: Trophy, label: "THÀNH VIÊN" },
    { href: "/profile", icon: Settings, label: "TÀI KHOẢN" },
  ];

  if (location.includes("/match") || location.includes("/trong-tai")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? "fill-current" : ""}`}
                />
                <span className="text-[9px] font-bold uppercase tracking-wide">
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
