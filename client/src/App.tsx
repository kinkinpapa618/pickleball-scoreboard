import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Match from "@/pages/Match";
import { TournamentProvider } from "./context/TournamentContext";
import MatchView from "@/pages/MatchView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/match" component={Match} />
      <Route path="/match-view/:id" component={MatchView} />

      <Route component={NotFound} />
    </Switch>
  );
}

    function App() {
      return (
      <TournamentProvider>
        <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
    </TournamentProvider>
  );
}

export default App;
