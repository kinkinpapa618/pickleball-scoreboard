import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import RefereeTools from "@/pages/RefereeTools";
import Match from "@/pages/Match";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";

// --- 1. COMPONENT BẢO VỆ ROUTE ---
// Tách ra ngoài hoặc để trên Router để sử dụng
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

// --- 2. QUẢN LÝ ĐIỀU HƯỚNG ---
function Router() {
  return (
    <Switch>
      {/* Trang Auth không được bảo vệ */}
      <Route path="/auth" component={AuthPage} />

      {/* Các trang yêu cầu Đăng nhập mới được vào */}
      <Route path="/">{() => <ProtectedRoute component={Home} />}</Route>

      <Route path="/tools">
        {() => <ProtectedRoute component={RefereeTools} />}
      </Route>

      {/* Sửa lại Path có :id để nhận ID trận đấu từ DB */}
      <Route path="/match/:id">
        {() => <ProtectedRoute component={Match} />}
      </Route>

      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      {/* Trang lỗi */}
      <Route component={NotFound} />
    </Switch>
  );
}

// --- 3. COMPONENT TỔNG ---
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-[#050505] text-white pb-20">
          <Router />
          {/* BottomNav thường chỉ hiện khi đã đăng nhập */}
          <ConditionalBottomNav />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Helper để ẩn BottomNav ở trang Auth
function ConditionalBottomNav() {
  const { user } = useAuth();
  if (!user) return null;
  return <BottomNav />;
}

export default App;
