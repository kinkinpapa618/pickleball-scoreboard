import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";

import Home from "@/pages/Home";
import RefereeTools from "@/pages/RefereeTools";
import Match from "@/pages/Match";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools" component={RefereeTools} />
      <Route path="/match" component={Match} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#050505] text-white pb-20">
        <Router />
        <BottomNav />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
