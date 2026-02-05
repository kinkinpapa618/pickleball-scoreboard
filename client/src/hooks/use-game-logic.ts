import { useState, useCallback } from "react";
import { type InsertMatch } from "@shared/schema";

export type PlayerPosition = {
  id: string; // "t1p1" | "t1p2" | "t2p1" | "t2p2"
  name: string;
  side: "left" | "right"; // Current court side
  team: 1 | 2;
};

export type GameState = {
  score1: number;
  score2: number;
  serverTeam: 1 | 2;
  serverHand: 1 | 2; // 1 = First server, 2 = Second server
  gameHistory: Array<{
    score1: number;
    score2: number;
    serverTeam: 1 | 2;
    serverHand: 1 | 2;
    positions: Record<string, "left" | "right">;
  }>;
  positions: Record<string, "left" | "right">; // Map player ID to side
  winner: 1 | 2 | null;
};

// Initial state helpers
const INITIAL_POSITIONS: Record<string, "left" | "right"> = {
  t1p1: "right", // Team 1 Player 1 starts Right (Even)
  t1p2: "left",  // Team 1 Player 2 starts Left (Odd)
  t2p1: "right", // Team 2 Player 1 starts Right
  t2p2: "left",  // Team 2 Player 2 starts Left
};

export function useGameLogic(
  winningScore: number, 
  initialServerTeam: 1 | 2,
  playerNames: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }
) {
  const [state, setState] = useState<GameState>({
    score1: 0,
    score2: 0,
    serverTeam: initialServerTeam,
    serverHand: 2, // Standard start: 0-0-2
    gameHistory: [],
    positions: { ...INITIAL_POSITIONS },
    winner: null,
  });

  const checkWin = (s1: number, s2: number) => {
    const diff = Math.abs(s1 - s2);
    // Logic: Win at X, must win by 2. Cap at X + 4 (roughly, user logic was 11->15, 15->18)
    const cap = winningScore === 11 ? 15 : winningScore === 15 ? 18 : 25;
    
    // Check Cap first
    if (s1 >= cap && s1 > s2) return 1;
    if (s2 >= cap && s2 > s1) return 2;

    // Check Standard Win
    if (s1 >= winningScore && diff >= 2) return 1;
    if (s2 >= winningScore && diff >= 2) return 2;

    return null;
  };

  const pushHistory = () => {
    setState(prev => ({
      ...prev,
      gameHistory: [
        ...prev.gameHistory,
        {
          score1: prev.score1,
          score2: prev.score2,
          serverTeam: prev.serverTeam,
          serverHand: prev.serverHand,
          positions: { ...prev.positions },
        },
      ],
    }));
  };

  const scorePoint = useCallback(() => {
    if (state.winner) return;
    pushHistory();

    setState(prev => {
      const isTeam1Serving = prev.serverTeam === 1;
      const newScore1 = isTeam1Serving ? prev.score1 + 1 : prev.score1;
      const newScore2 = !isTeam1Serving ? prev.score2 + 1 : prev.score2;

      // Swap positions for serving team ONLY
      const newPositions = { ...prev.positions };
      if (isTeam1Serving) {
        newPositions.t1p1 = prev.positions.t1p1 === "left" ? "right" : "left";
        newPositions.t1p2 = prev.positions.t1p2 === "left" ? "right" : "left";
      } else {
        newPositions.t2p1 = prev.positions.t2p1 === "left" ? "right" : "left";
        newPositions.t2p2 = prev.positions.t2p2 === "left" ? "right" : "left";
      }

      const winner = checkWin(newScore1, newScore2);

      return {
        ...prev,
        score1: newScore1,
        score2: newScore2,
        positions: newPositions,
        winner,
      };
    });
  }, [state.winner, winningScore]);

  const fault = useCallback(() => {
    if (state.winner) return;
    pushHistory();

    setState(prev => {
      let nextServerTeam = prev.serverTeam;
      let nextServerHand = prev.serverHand;

      if (prev.serverHand === 1) {
        // Hand 1 lost -> Hand 2 serves (same team)
        nextServerHand = 2;
      } else {
        // Hand 2 lost -> Side Out (other team serves, Hand 1)
        nextServerTeam = prev.serverTeam === 1 ? 2 : 1;
        nextServerHand = 1;
      }

      return {
        ...prev,
        serverTeam: nextServerTeam,
        serverHand: nextServerHand,
      };
    });
  }, [state.winner]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.gameHistory.length === 0) return prev;
      const lastState = prev.gameHistory[prev.gameHistory.length - 1];
      const newHistory = prev.gameHistory.slice(0, -1);
      
      return {
        ...prev,
        ...lastState,
        gameHistory: newHistory,
        winner: null, // Reset winner if undoing winning shot
      };
    });
  }, []);

  const getMatchData = (): Omit<InsertMatch, "id" | "date"> | null => {
    if (!state.winner) return null;
    return {
      team1Player1: playerNames.t1p1,
      team1Player2: playerNames.t1p2,
      team2Player1: playerNames.t2p1,
      team2Player2: playerNames.t2p2,
      scoreTeam1: state.score1,
      scoreTeam2: state.score2,
      winningScore,
      winnerTeam: state.winner,
    };
  };

  return {
    state,
    scorePoint,
    fault,
    undo,
    getMatchData,
  };
}
