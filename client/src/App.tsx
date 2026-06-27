import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { DarkTabs } from "@/components/DarkTabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/context/ThemeContext";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { useLocation, Redirect, Switch, Route } from "wouter";

const Home = lazy(() => import("@/pages/Home"));
const RefereeTools = lazy(() => import("@/pages/RefereeTools"));
const Match = lazy(() => import("@/pages/Match"));
const MatchView = lazy(() => import("@/pages/MatchView"));
const MatchOverlay = lazy(() => import("@/pages/MatchOverlay"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const Users = lazy(() => import("@/pages/Users"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const RefereeMatchAccess = lazy(() => import("@/pages/RefereeMatchAccess"));
const TournamentPage = lazy(() => import("@/pages/TournamentPage"));

// Badminton Pages
const BadmintonTools = lazy(() => import("@/pages/BadmintonTools"));
const BadmintonMatch = lazy(() => import("@/pages/BadmintonMatch"));
const BadmintonOverlay = lazy(() => import("@/pages/BadmintonOverlay"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
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

// --- 4. QUẢN LÝ ĐIỀU HƯỚNG ---
function Router() {
  return (
    <Switch>
      {/* Trang Auth không được bảo vệ */}
      <Route path="/auth">
        {() => <Suspense fallback={<PageLoader />}><AuthPage /></Suspense>}
      </Route>

      <Route path="/">
        {() => <Suspense fallback={<PageLoader />}><Home /></Suspense>}
      </Route>

      {/* Pickleball Routes */}
      <Route path="/tools">
        {() => <Suspense fallback={<PageLoader />}><RefereeTools /></Suspense>}
      </Route>
      <Route path="/match">{() => <ProtectedRoute component={Match} />}</Route>
      <Route path="/match/:id">
        {() => <ProtectedRoute component={Match} />}
      </Route>
      <Route path="/match-view/:id">
        {() => <Suspense fallback={<PageLoader />}><MatchView /></Suspense>}
      </Route>
      <Route path="/match-overlay/:id">
        {() => <Suspense fallback={<PageLoader />}><MatchOverlay /></Suspense>}
      </Route>
      <Route path="/match-detail/:id">
        {() => <ProtectedRoute component={MatchDetail} />}
      </Route>

      {/* Badminton Routes */}
      <Route path="/badminton">
        {() => <ProtectedRoute component={BadmintonTools} />}
      </Route>
      <Route path="/badminton/match/:id">
        {() => <ProtectedRoute component={BadmintonMatch} />}
      </Route>
      <Route path="/badminton/overlay/:id">
        {() => <Suspense fallback={<PageLoader />}><BadmintonOverlay /></Suspense>}
      </Route>

      {/* Other Routes */}
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/tournament">
        {() => <ProtectedRoute component={TournamentPage} />}
      </Route>
      <Route path="/tournament/:id">
        {() => <ProtectedRoute component={TournamentPage} />}
      </Route>
      <Route path="/users">{() => <ProtectedRoute component={Users} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/manage">{() => <ProtectedRoute component={AdminPanel} />}</Route>
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isOverlayPage = location.includes("/overlay");

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
      <div className={`min-h-screen ${isOverlayPage ? 'bg-transparent' : 'pb-20 bg-background'} text-foreground transition-colors`}>
        <button
          id="install-btn"
          style={{ display: deferredPrompt ? 'block' : 'none' }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50"
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              setDeferredPrompt(null);
            }
          }}
        >Install App</button>
        {/* Theme toggle: nổi top-right, ẩn ở Auth (chưa đăng nhập), Profile (đã có toggle riêng) và Match (toàn màn hình) */}
        <ConditionalThemeToggle />
        <Router />
        {/* BottomNav thường chỉ hiện khi đã đăng nhập */}
        <ConditionalDarkTabs />
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
  if (location.includes("/match") || location.includes("/overlay")) return null;
  return <BottomNav />;
}

// Helper để ẩn DarkTabs ở trang Auth và khi không cần tab
function ConditionalDarkTabs() {
  const [location] = useLocation();
  if (location === "/auth") return null;
  // Không hiện Tab khi đang trong trận đấu để tập trung
  if (location.includes("/match") || location.includes("/overlay")) return null;
  return <DarkTabs />;
}

// Helper để hiện ThemeToggle ở các trang phù hợp.
// Ẩn ở: /auth (chưa đăng nhập), /profile (đã có toggle riêng), /match (toàn màn hình trận đấu).
function ConditionalThemeToggle() {
  const [location] = useLocation();
  if (location === "/auth") return null;
  if (location === "/profile" || location.startsWith("/profile/")) return null;
  if (location.includes("/match") || location.includes("/overlay")) return null;
  return (
    <ThemeToggle className="fixed top-3 right-3 z-40 shadow-md backdrop-blur-sm" />
  );
}

export default App;
