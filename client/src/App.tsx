import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Loader2, Lock } from "lucide-react";
import { FloatingChat } from "@/components/FloatingChat";

import Home from "@/pages/Home";
import RefereeTools from "@/pages/RefereeTools";
import TournamentPage from "@/pages/TournamentPage";
import Match from "@/pages/Match";
import MatchView from "@/pages/MatchView";
import MatchDetail from "@/pages/MatchDetail";
import Profile from "@/pages/Profile";
import Users from "@/pages/Users";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import RefereeMatchAccess from "@/pages/RefereeMatchAccess";
import ConnectedManagers from "@/pages/ConnectedManagers";
import ChatPage from "@/pages/ChatPage";

// --- 1. COMPONENT HIỂN THỊ KHÔNG CÓ QUYỀN ---
function RestrictedPage({ feature }: { feature: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Không có quyền truy cập</h2>
      <p className="text-slate-500 mb-6">Chỉ Admin và Manager mới có thể sử dụng {feature}</p>
      <button
        onClick={() => setLocation("/profile")}
        className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
      >
        Quay lại Profile
      </button>
    </div>
  );
}

// --- 2. COMPONENT BẢO VỆ ROUTE ---
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

// --- 3. COMPONENT BẢO VỆ ROUTE CHO ADMIN/MANAGER ---
function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return <RestrictedPage feature="Giải đấu" />;
  }

  return <Component />;
}

// --- 4. QUẢN LÝ ĐIỀU HƯỚNG ---
function Router() {
  return (
    <Switch>
      {/* Trang Auth không được bảo vệ */}
      <Route path="/auth" component={AuthPage} />

      {/* Các trang yêu cầu Đăng nhập mới được vào */}
      <Route path="/" component={Home} />

      <Route path="/tools">
        {() => <RefereeTools />}
      </Route>

      <Route path="/tournament">
        {() => <AdminRoute component={TournamentPage} />}
      </Route>

      {/* Route cho trận đấu với query string (?matchId=...) */}
      <Route path="/match">{() => <ProtectedRoute component={Match} />}</Route>

      {/* Sửa lại Path có :id để nhận ID trận đấu từ DB */}
      <Route path="/match/:id">
        {() => <ProtectedRoute component={Match} />}
      </Route>

      {/* Route xem công khai (không cần bảo vệ) */}
      <Route path="/match-view/:id" component={MatchView} />

      {/* Route chi tiết trận đấu (cho trận đã hoàn thành) */}
      <Route path="/match-detail/:id">
        {() => <ProtectedRoute component={MatchDetail} />}
      </Route>

      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      <Route path="/users">{() => <ProtectedRoute component={Users} />}</Route>

      <Route path="/connected-managers">{() => <ProtectedRoute component={ConnectedManagers} />}</Route>

      <Route path="/chat">{() => <ProtectedRoute component={ChatPage} />}</Route>

      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} />}</Route>

      <Route path="/admin/manage">{() => <ProtectedRoute component={AdminPanel} />}</Route>

      {/* Route truy cập trận đấu bằng token (cho trọng tài) */}
      <Route path="/trong-tai/:token" component={RefereeMatchAccess} />

      {/* Trang lỗi */}
      <Route component={NotFound} />
    </Switch>
  );
}

// --- 3. COMPONENT TỔNG ---
function AppContent() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 bg-white text-foreground`}>
      <Router />
      {/* BottomNav thường chỉ hiện khi đã đăng nhập */}
      <ConditionalBottomNav />
      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
            <Toaster />
            <NotificationCenter />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Helper để ẩn BottomNav ở trang Auth
function ConditionalBottomNav() {
  const [location] = useLocation();
  if (location === "/auth") return null;
  // Không hiện Nav khi đang trong trận đấu để tập trung
  if (location.includes("/match")) return null;
  return <BottomNav />;
}

export default App;
