import type { Tile, Seat, Team, GameState, RoundResult } from "./types";
import { TEAM_SEATS, SEATS } from "./constants";

/**
 * Sums all pips in a hand.
 */
export function calculateHandSum(hand: Tile[]): number {
  return hand.reduce((sum, [a, b]) => sum + a + b, 0);
}

/**
 * Determines the result of a finished round.
 *
 * Three possible outcomes:
 * - "domino": a player emptied their hand. Their team wins and scores the sum of opponents' tiles.
 * - "locked": 4 consecutive passes. The team with the lower total pip count wins
 *   and scores the difference between the two teams' totals.
 * - "tied": locked and both teams have the same pip count. No winner, 0 points.
 */
export function calculateRoundResult(state: GameState): RoundResult {
  // Check for domino — a player with an empty hand
  const dominoSeat = SEATS.find((s) => {
    const hand = state.hands.get(s);
    return hand !== undefined && hand.length === 0;
  });

  if (dominoSeat !== undefined) {
    const winnerTeam: Team = (dominoSeat % 2) as Team;
    const losingTeam: Team = winnerTeam === 0 ? 1 : 0;

    // Sum opponents' remaining tiles
    const opponentSeats = TEAM_SEATS[losingTeam];
    let points = 0;
    for (const seat of opponentSeats) {
      const hand = state.hands.get(seat) ?? [];
      points += calculateHandSum(hand);
    }

    return { winner_team: winnerTeam, points, reason: "domino" };
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
  const losingTeam: Team = winnerTeam === 0 ? 1 : 0;
  const points = teamSums[losingTeam] - teamSums[winnerTeam];

  return { winner_team: winnerTeam, points, reason: "locked" };
}
