import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/lib/queryClient";
import { Toaster } from "@/src/components/ui/toaster";
import { BottomNav } from "@/src/components/BottomNav";

import Home from "@/src/pages/Home";
import RefereeTools from "@/src/pages/RefereeTools";
import Match from "@/src/pages/Match";
import Profile from "@/src/pages/Profile";
import NotFound from "@/src/pages/not-found";

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
