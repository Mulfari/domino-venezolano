import type { Tile, Seat } from "./types";
import { MAX_PIP, SEATS, TILES_PER_PLAYER } from "./constants";

/** The complete set of 28 double-six domino tiles. */
export const FULL_SET: readonly Tile[] = (() => {
  const tiles: Tile[] = [];
  for (let a = 0; a <= MAX_PIP; a++) {
    for (let b = a; b <= MAX_PIP; b++) {
      tiles.push([a, b]);
    }
  }
  return Object.freeze(tiles);
})();

/**
 * Returns a shuffled copy of the full tile set.
 * Uses Fisher-Yates shuffle for uniform distribution.
 */
export function shuffle(set: readonly Tile[] = FULL_SET): Tile[] {
  const tiles = set.map<Tile>(([a, b]) => [a, b]);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/**
 * Shuffles and deals 7 tiles to each of the 4 seats.
 */
export function deal(): Map<Seat, Tile[]> {
  const shuffled = shuffle();
  const hands = new Map<Seat, Tile[]>();
  for (const seat of SEATS) {
    const start = seat * TILES_PER_PLAYER;
    hands.set(seat, shuffled.slice(start, start + TILES_PER_PLAYER));
  }
  return hands;
}

/**
 * Finds the seat holding the [6,6] tile.
 * Returns the seat number, or null if no one has it (shouldn't happen in a standard deal).
 */
export function findStartingSeat(hands: Map<Seat, Tile[]>): Seat | null {
  for (const seat of SEATS) {
    const hand = hands.get(seat);
    if (hand?.some(([a, b]) => a === MAX_PIP && b === MAX_PIP)) {
      return seat;
    }
  }
  return null;
}
