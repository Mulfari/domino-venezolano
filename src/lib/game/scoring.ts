import { tilePipSum } from "./tiles";
import { SEAT_TEAM } from "./constants";

export interface ScoreResult {
  points: number;
  team: 0 | 1;
}

export function handSum(hand: number[]): number {
  return hand.reduce((sum, id) => sum + tilePipSum(id), 0);
}

/**
 * Score a round ended by dominó. The winner's team gets the sum of
 * the opponents' remaining tiles.
 */
export function scoreDomino(
  hands: number[][],
  winnerSeat: number,
  winnerTeam: 0 | 1
): ScoreResult {
  let opponentSum = 0;
  for (let seat = 0; seat < hands.length; seat++) {
    if (SEAT_TEAM[seat] !== winnerTeam) {
      opponentSum += handSum(hands[seat]);
    }
  }
  return { points: opponentSum, team: winnerTeam };
}

/**
 * Score a round ended by trancado. The team with fewer points in hand
 * wins the difference. Returns points=0, team=-1 if tied.
 */
export function scoreTrancado(hands: number[][]): ScoreResult & { team: 0 | 1 | -1 } {
  const team0Sum = hands
    .filter((_, seat) => SEAT_TEAM[seat] === 0)
    .reduce((sum, h) => sum + handSum(h), 0);
  const team1Sum = hands
    .filter((_, seat) => SEAT_TEAM[seat] === 1)
    .reduce((sum, h) => sum + handSum(h), 0);

  if (team0Sum < team1Sum) return { points: team1Sum - team0Sum, team: 0 };
  if (team1Sum < team0Sum) return { points: team0Sum - team1Sum, team: 1 };
  return { points: 0, team: -1 };
}

/**
 * True when the capicúa multiplier applies to the current scoring.
 * Callers set `capicuaInPlay=true` if the round included a capicúa
 * state (both board ends equal) at the moment of scoring.
 */
export function isCapicuaScoreMultiplier(
  leftEnd: number,
  rightEnd: number,
  capicuaInPlay: boolean
): boolean {
  return capicuaInPlay && leftEnd === rightEnd;
}
