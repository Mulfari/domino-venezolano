import { decodeTile, tilePipSum } from "./tiles";
import { GAME } from "./constants";

export type MoveType = "deal" | "play_tile" | "pass" | "round_end" | "game_end" | "chat";

export interface BaseMove {
  type: MoveType;
}

/**
 * Returns true if the tile can be played on the board that currently
 * has `leftEnd` on the left and `rightEnd` on the right. Either side of
 * the tile can match either end.
 */
export function canPlayTile(tileId: number, leftEnd: number, rightEnd: number): boolean {
  const [a, b] = decodeTile(tileId);
  return a === leftEnd || b === leftEnd || a === rightEnd || b === rightEnd;
}

/**
 * Finds the seat (0..3) that should start the round, given each player's
 * 7-tile hand. The doble-6 (tile 27) always starts. Otherwise the player
 * with the highest-sum tile starts (seat order breaks ties).
 */
export function findStarter(hands: number[][]): number {
  // Check for doble-6 first
  for (let seat = 0; seat < hands.length; seat++) {
    if (hands[seat].includes(27)) return seat;
  }

  // Highest sum wins; seat order breaks ties
  let bestSeat = 0;
  let bestSum = -1;
  for (let seat = 0; seat < hands.length; seat++) {
    const max = Math.max(...hands[seat].map(tilePipSum));
    if (max > bestSum) {
      bestSum = max;
      bestSeat = seat;
    }
  }
  return bestSeat;
}

export function isDobleSeis(tileId: number): boolean {
  return tileId === 27;
}

/**
 * Counts the number of consecutive 'pass' moves at the end of the move
 * list. Stops at the first non-pass move.
 */
export function countConsecutivePasses(
  moves: ReadonlyArray<{ type: string }>
): number {
  let count = 0;
  for (let i = moves.length - 1; i >= 0; i--) {
    if (moves[i].type === "pass") count++;
    else break;
  }
  return count;
}

export function isTrancado(moves: ReadonlyArray<{ type: string }>): boolean {
  return countConsecutivePasses(moves) >= GAME.PASSES_FOR_TRANCADO;
}

export function isCapicua(leftEnd: number, rightEnd: number): boolean {
  return leftEnd === rightEnd;
}
