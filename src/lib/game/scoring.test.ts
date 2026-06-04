import { describe, it, expect } from "vitest";
import { scoreDomino, scoreTrancado, isCapicuaScoreMultiplier } from "./scoring";
import { encodeTile } from "./tiles";

describe("scoring.scoreDomino", () => {
  it("sums opponents' remaining tiles and credits the winning team", () => {
    const winnerTeam = 0;
    const hands = [
      [],                                  // seat 0 (team 0) - winner
      [encodeTile(0, 1), encodeTile(2, 2)], // seat 1 (team 1) - 0+1+2+2 = 5
      [encodeTile(3, 3)],                   // seat 2 (team 0)
      [encodeTile(4, 5), encodeTile(1, 1)], // seat 3 (team 1) - 4+5+1+1 = 11
    ];
    expect(scoreDomino(hands, 0, winnerTeam)).toEqual({
      points: 16,
      team: 0,
    });
  });
});

describe("scoring.scoreTrancado", () => {
  it("credits the team with fewer points in hand", () => {
    const hands = [
      [encodeTile(0, 1)], // seat 0 team 0 - 1
      [encodeTile(5, 5), encodeTile(6, 6)], // seat 1 team 1 - 22
      [encodeTile(2, 2)], // seat 2 team 0 - 4 (team 0 = 5)
      [encodeTile(0, 0), encodeTile(4, 5)], // seat 3 team 1 - 9 (team 1 = 31)
    ];
    expect(scoreTrancado(hands)).toEqual({
      points: 26, // 31 - 5
      team: 0,
    });
  });

  it("is a tie-safe (no points awarded) when hand sums are equal", () => {
    const hands = [
      [encodeTile(0, 0)], // 0
      [encodeTile(0, 0)], // 0
      [],                 // 0
      [],                 // 0
    ];
    expect(scoreTrancado(hands)).toEqual({ points: 0, team: -1 });
  });
});

describe("scoring.isCapicuaScoreMultiplier", () => {
  it("is true when both board ends match and the capicúa is in play", () => {
    expect(isCapicuaScoreMultiplier(5, 5, true)).toBe(true);
    expect(isCapicuaScoreMultiplier(3, 5, true)).toBe(false);
  });

  it("is false when no capicúa flag is set", () => {
    expect(isCapicuaScoreMultiplier(5, 5, false)).toBe(false);
  });
});
