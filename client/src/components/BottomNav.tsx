import { Link, useLocation } from "wouter";
import { Target, Settings, Feather } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

export function BottomNav() {
  const [location] = useLocation();
  const { unreadCount } = useNotifications();

  const navItems = [
    { href: "/tools", icon: Target, label: "PICKLEBALL" },
    { href: "/badminton", icon: Feather, label: "CẦU LÔNG" },
    { href: "/profile", icon: Settings, label: "TÀI KHOẢN" },
  ];

  if (location.includes("/match") || location.includes("/trong-tai")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50 shadow-lg transition-colors">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const isProfile = item.href === "/profile";

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`relative flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:text-foreground"
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
