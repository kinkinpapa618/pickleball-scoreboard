import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface PlayerSetupProps {
  team: 1 | 2;
  p1: string;
  p2: string;
  onP1Change: (val: string) => void;
  onP2Change: (val: string) => void;
}

export function PlayerSetup({ team, p1, p2, onP1Change, onP2Change }: PlayerSetupProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${team === 1 ? 'bg-blue-500' : 'bg-red-500'}`}>
          {team}
        </div>
        <h3 className="text-xl font-bold text-foreground">Đội {team} (Team {team})</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Người chơi 1 (Player 1)
          </Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={p1}
              onChange={(e) => onP1Change(e.target.value)}
              className="pl-9 bg-background/50 border-border focus:ring-primary/20 transition-all"
              placeholder="Nhập tên..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Người chơi 2 (Player 2)
          </Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={p2}
              onChange={(e) => onP2Change(e.target.value)}
              className="pl-9 bg-background/50 border-border focus:ring-primary/20 transition-all"
              placeholder="Nhập tên..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
