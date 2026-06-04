import { allTileIds } from "./tiles";
import { GAME } from "./constants";

/**
 * Hashes a string to a 32-bit unsigned integer. Used to derive a deal
 * seed from the room id, so all clients see the same shuffle without
 * having to send the shuffled list.
 */
export function seedFromRoomId(roomId: string): number {
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < roomId.length; i++) {
    hash ^= roomId.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV-1a prime
  }
  return hash >>> 0;
}

/**
 * Mulberry32: a tiny seeded PRNG with good distribution for our use.
 */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deals GAME.TILES_PER_PLAYER tiles to each of GAME.PLAYERS players using a
 * shuffled copy of the full set. Same seed → same deal.
 */
export function dealTiles(seed: number): number[][] {
  const rng = mulberry32(seed);
  const tiles = [...allTileIds()];
  // Fisher-Yates with our seeded RNG
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  const hands: number[][] = Array.from({ length: GAME.PLAYERS }, () => []);
  for (let p = 0; p < GAME.PLAYERS; p++) {
    for (let t = 0; t < GAME.TILES_PER_PLAYER; t++) {
      hands[p].push(tiles[p * GAME.TILES_PER_PLAYER + t]);
    }
  }
  return hands;
}
