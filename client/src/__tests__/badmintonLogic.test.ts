import { describe, it, expect } from "vitest";
import {
  createInitialState,
  processRally,
  getSinglesServiceCourt,
  isGameOver,
  isMatchOver,
} from "../utils/badmintonLogic";

describe("Badminton Logic Engine - BWF Rules", () => {
  describe("Basic Helpers", () => {
    it("should calculate correct singles service court based on score", () => {
      expect(getSinglesServiceCourt(0)).toBe("right");
      expect(getSinglesServiceCourt(2)).toBe("right");
      expect(getSinglesServiceCourt(1)).toBe("left");
      expect(getSinglesServiceCourt(15)).toBe("left");
    });

    it("should check if game is over correctly", () => {
      // Mode A (21): Straight win at 21 points
      expect(isGameOver(21, 19, 21)).toBe(true);
      expect(isGameOver(20, 20, 21)).toBe(false);
      expect(isGameOver(21, 20, 21)).toBe(true); // Straight win!

      // Mode B (31): Win by 2, cap at 31
      expect(isGameOver(21, 19, 31)).toBe(true); // Led by 2 points at 21
      expect(isGameOver(20, 20, 31)).toBe(false);
      expect(isGameOver(21, 20, 31)).toBe(false); // No straight win, must lead by 2
      expect(isGameOver(22, 20, 31)).toBe(true);  // Led by 2 points
      expect(isGameOver(29, 29, 31)).toBe(false);
      expect(isGameOver(30, 29, 31)).toBe(false);
      expect(isGameOver(31, 30, 31)).toBe(true);  // Cap at 31!
    });

    it("should check if match is over correctly", () => {
      expect(isMatchOver(2, 0, 3)).toBe(true);
      expect(isMatchOver(1, 1, 3)).toBe(false);
      expect(isMatchOver(3, 2, 5)).toBe(true);
    });
  });

  describe("processRally - Singles", () => {
    it("should award point and keep same server if serving team wins rally", () => {
      let state = createInitialState({
        type: "singles",
        bestOf: 3,
        winningPoints: 21,
        firstServingTeam: 1,
      });

      state = processRally(state, 1);
      expect(state.currentScoreTeam1).toBe(1);
      expect(state.currentScoreTeam2).toBe(0);
      expect(state.servingTeam).toBe(1);
    });

    it("should award point and transfer serve if receiving team wins rally", () => {
      let state = createInitialState({
        type: "singles",
        bestOf: 3,
        winningPoints: 21,
        firstServingTeam: 1,
      });

      state = processRally(state, 2);
      expect(state.currentScoreTeam1).toBe(0);
      expect(state.currentScoreTeam2).toBe(1);
      expect(state.servingTeam).toBe(2);
    });
  });

  describe("processRally - Doubles (BWF Rules)", () => {
    it("should swap players when serving team wins point", () => {
      let state = createInitialState({
        type: "doubles",
        bestOf: 3,
        winningPoints: 21,
        firstServingTeam: 1,
      });

      expect(state.team1Swapped).toBe(false);
      expect(state.servingPlayer).toBe(1); // Player 1 starts serving (from Right court)

      state = processRally(state, 1); // Team 1 wins point (now 1-0)
      expect(state.currentScoreTeam1).toBe(1);
      expect(state.team1Swapped).toBe(true); // Swapped!
      expect(state.servingPlayer).toBe(2); // Player 2 is now serving from Left court
    });

    it("should NOT swap players when serve transfers, and choose server correctly based on score", () => {
      let state = createInitialState({
        type: "doubles",
        bestOf: 3,
        winningPoints: 21,
        firstServingTeam: 1,
      });

      // 0-0. Team 1 serving. Player 1 serves from right. Player 2 stands in left.
      // Team 2 Player 1 stands in right, Player 2 in left.
      expect(state.team2Swapped).toBe(false);

      // Team 2 wins the rally. Score becomes 0-1 (odd). Serve transfers to Team 2.
      // Under BWF rules: No swap occurs.
      // Since Team 2's new score is 1 (odd), the server must be the player in the LEFT court.
      // Team 2 is NOT swapped, so Player 2 is in the left court. Player 2 must serve!
      state = processRally(state, 2);
      expect(state.currentScoreTeam2).toBe(1);
      expect(state.servingTeam).toBe(2);
      expect(state.team2Swapped).toBe(false); // No swap
      expect(state.servingPlayer).toBe(2); // Player 2 serves (from left court) because score is odd!
    });

    it("should choose server in right court when serve transfers and team score is even", () => {
      let state = createInitialState({
        type: "doubles",
        bestOf: 3,
        winningPoints: 21,
        firstServingTeam: 1,
      });

      // 1. Team 1 wins rally -> 1-0. Team 1 Swapped. Player 2 serves from Left.
      state = processRally(state, 1);

      // 2. Team 2 wins rally -> 1-1. Serve transfers to Team 2.
      // Team 2 score is 1 (odd). Team 2 is not swapped, so Player 2 serves from Left.
      state = processRally(state, 2);
      expect(state.servingTeam).toBe(2);
      expect(state.servingPlayer).toBe(2);

      // 3. Team 2 wins rally again -> 1-2. Team 2 Swapped. Player 2 serves from Right.
      state = processRally(state, 2);
      expect(state.team2Swapped).toBe(true);

      // 4. Team 1 wins rally -> 2-2. Serve transfers to Team 1.
      // Team 1 score is 2 (even). Team 1 is swapped, so Player 2 is in the Right court.
      // Player 2 must serve!
      state = processRally(state, 1);
      expect(state.servingTeam).toBe(1);
      expect(state.team1Swapped).toBe(true); // Still swapped from step 1
      expect(state.servingPlayer).toBe(1); // Player 2 serves (from right court, position 1) because score is even!
    });
  });
});
