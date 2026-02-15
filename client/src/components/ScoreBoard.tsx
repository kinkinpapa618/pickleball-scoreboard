import { FlipNumber } from "./FlipNumber";
import { motion } from "framer-motion";

interface ScoreboardProps {
  score1: number;
  score2: number;
  serverHand: 1 | 2;
  team1Name?: string;
  team2Name?: string;
  servingTeam: 1 | 2;
  isFirstServe?: boolean;
}

export default function Scoreboard({
  score1,
  score2,
  serverHand,
  team1Name = "Đội 1",
  team2Name = "Đội 2",
  servingTeam,
  isFirstServe = false,
}: ScoreboardProps) {
  const servingScore = servingTeam === 1 ? score1 : score2;
  const receivingScore = servingTeam === 1 ? score2 : score1;
  const displayServerHand = isFirstServe ? 2 : serverHand;

  return (
    <div className="w-full flex items-center justify-center gap-2 py-2">
      <div className="flex items-center gap-1">
        <FlipNumber number={servingScore} />
        <span className="text-4xl font-black text-slate-300">- </span>
        <FlipNumber number={receivingScore} />
        <span className="text-4xl font-black text-slate-300">- </span>
        <div className="bg-rose-500 text-white w-10 h-12 rounded-lg flex items-center justify-center text-3xl font-black shadow-lg shadow-rose-600/30">
          {displayServerHand}
        </div>
      </div>
    </div>
  );
}
