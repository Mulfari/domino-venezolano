import type { Tile, Team, GameState, RoundResult } from "./types";
import { TEAM_SEATS, SEATS } from "./constants";

/**
 * Sums all pips in a hand.
 */
export function calculateHandSum(hand: Tile[]): number {
  return hand.reduce((sum, [a, b]) => sum + a + b, 0);
}

/**
 * Determines the result of a finished round (Venezuelan rules).
 *
 * Scoring: winner scores the sum of ALL remaining tiles across all 4 players.
 *
 * - "domino": a player emptied their hand. Their team scores all remaining pips.
 * - "locked": 4 consecutive passes. Team with fewer pips wins and scores all remaining pips.
 * - "tied": locked and both teams have the same pip count. No winner, 0 points.
 */
export function calculateRoundResult(state: GameState): RoundResult {
  const dominoSeat = SEATS.find((s) => {
    const hand = state.hands.get(s);
    return hand !== undefined && hand.length === 0;
  });

  if (dominoSeat !== undefined) {
    const winnerTeam: Team = (dominoSeat % 2) as Team;

    let points = 0;
    for (const seat of SEATS) {
      const hand = state.hands.get(seat) ?? [];
      points += calculateHandSum(hand);
    }

    const is_capicua =
      state.board.left !== null &&
      state.board.left === state.board.right &&
      state.board.plays.length > 1;

    if (is_capicua) {
      points *= 2;
    }

    return { winner_team: winnerTeam, points, reason: "domino", is_capicua };
  }

  // Locked game (4 consecutive passes)
  const teamSums: Record<Team, number> = { 0: 0, 1: 0 };

  for (const team of [0, 1] as Team[]) {
    for (const seat of TEAM_SEATS[team]) {
      const hand = state.hands.get(seat) ?? [];
      teamSums[team] += calculateHandSum(hand);
    }
  }

  if (teamSums[0] === teamSums[1]) {
    return { winner_team: null, points: 0, reason: "tied" };
  }

  const winnerTeam: Team = teamSums[0] < teamSums[1] ? 0 : 1;

  let points = 0;
  for (const seat of SEATS) {
    const hand = state.hands.get(seat) ?? [];
    points += calculateHandSum(hand);
  }

  return { winner_team: winnerTeam, points, reason: "locked" };
}
