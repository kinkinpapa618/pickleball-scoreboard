import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/context/ThemeContext";
import { Loader2, Lock } from "lucide-react";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/Home"));
const RefereeTools = lazy(() => import("@/pages/RefereeTools"));
const TournamentPage = lazy(() => import("@/pages/TournamentPage"));
const Match = lazy(() => import("@/pages/Match"));
const MatchView = lazy(() => import("@/pages/MatchView"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const Users = lazy(() => import("@/pages/Users"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const RefereeMatchAccess = lazy(() => import("@/pages/RefereeMatchAccess"));
const ConnectedManagers = lazy(() => import("@/pages/ConnectedManagers"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  );
}

// --- 1. COMPONENT HIỂN THỊ KHÔNG CÓ QUYỀN ---
function RestrictedPage({ feature }: { feature: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Không có quyền truy cập</h2>
      <p className="text-muted-foreground mb-6">Chỉ Admin và Manager mới có thể sử dụng {feature}</p>
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
    return <PageLoader />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// --- 3. COMPONENT BẢO VỆ ROUTE CHO ADMIN/MANAGER ---
function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return <RestrictedPage feature="Giải đấu" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// --- 4. QUẢN LÝ ĐIỀU HƯỚNG ---
function Router() {
  return (
    <Switch>
      {/* Trang Auth không được bảo vệ */}
      <Route path="/auth">
        {() => <Suspense fallback={<PageLoader />}><AuthPage /></Suspense>}
      </Route>

      {/* Các trang yêu cầu Đăng nhập mới được vào */}
      <Route path="/">
        {() => <Suspense fallback={<PageLoader />}><Home /></Suspense>}
      </Route>

      <Route path="/tools">
        {() => <Suspense fallback={<PageLoader />}><RefereeTools /></Suspense>}
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
      <Route path="/match-view/:id">
        {() => <Suspense fallback={<PageLoader />}><MatchView /></Suspense>}
      </Route>

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
      <Route path="/trong-tai/:token">
        {() => <Suspense fallback={<PageLoader />}><RefereeMatchAccess /></Suspense>}
      </Route>

      {/* Trang lỗi */}
      <Route>
        {() => <Suspense fallback={<PageLoader />}><NotFound /></Suspense>}
      </Route>
    </Switch>
  );
}

// --- 3. COMPONENT TỔNG ---
function AppContent() {
  const [location] = useLocation();
  const isMatchPage = location.startsWith("/match");

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      <Router />
      {/* BottomNav thường chỉ hiện khi đã đăng nhập */}
      <ConditionalBottomNav />
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
