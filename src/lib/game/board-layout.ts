import { decodeTile } from "./tiles";
import { TILE } from "./constants";

export type PlayEnd = "left" | "right" | "center";

export interface PlacedTile {
  tile: number;
  renderA: number;
  renderB: number;
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
}

export interface PlayMoveInput {
  type: "play_tile";
  playerId: string;
  tile: number;
  end: PlayEnd;
  flipped: boolean;
}

/**
 * Given a list of play_tile moves, returns each tile with its
 * on-screen position and which side of the tile (renderA, renderB)
 * should be drawn on the left vs right of the rendered tile.
 *
 * The orientation rule: the side of the tile that connects to the
 * rest of the chain must be on the side of the rendered tile that
 * touches the chain.
 *
 *   - Tile played on the RIGHT: its right edge touches the chain.
 *     → the side matching the open end must be renderB.
 *   - Tile played on the LEFT: its left edge touches the chain.
 *     → the side matching the open end must be renderA.
 *
 * If the natural ordering [a, b] already has the matching side in
 * the right place, no flip. Otherwise we swap to [b, a].
 */
export function buildPlacedTiles(moves: PlayMoveInput[]): PlacedTile[] {
  const out: PlacedTile[] = [];
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const [a, b] = decodeTile(move.tile);
    let renderA = a;
    let renderB = b;
    if (move.end === "right" && a === currentRightEnd(out) && b !== a) {
      // a matches → leave as is
    } else if (move.end === "right" && b === currentRightEnd(out) && a !== b) {
      // b matches → leave as is
    } else if (move.end === "left" && a === currentLeftEnd(out) && b !== a) {
      // a matches, must be on left of rendered tile → flip
      [renderA, renderB] = [b, a];
    } else if (move.end === "left" && b === currentLeftEnd(out) && a !== b) {
      // b matches, must be on left of rendered tile → no flip needed
    }
    out.push({
      tile: move.tile,
      renderA,
      renderB,
      x: 0, // placeholder — layoutChain assigns real coords
      y: 0,
      orientation: "horizontal",
    });
  }
  return layoutChain(out);
}

function currentRightEnd(placed: PlacedTile[]): number {
  if (placed.length === 0) return -1;
  return placed[placed.length - 1].renderB;
}

function currentLeftEnd(placed: PlacedTile[]): number {
  if (placed.length === 0) return -1;
  return placed[0].renderA;
}

/**
 * Lays out the chain starting from a center anchor.
 * - Position 0 is centered (vertical).
 * - Odd positions (1, 3, 5, ...) extend to the right of the chain (horizontal).
 * - Even positions (2, 4, 6, ...) extend to the left of the chain (vertical),
 *   zigzagging downward so they don't overlap with right-side tiles.
 *
 * The chain snakes: right tiles are at the same y as their corresponding
 * left tile in the same row.
 */
export function layoutChain(placed: Omit<PlacedTile, "x" | "y" | "orientation">[]): PlacedTile[] {
  const result: PlacedTile[] = [];
  for (let i = 0; i < placed.length; i++) {
    const isEven = i % 2 === 0;
    const orientation: "horizontal" | "vertical" = isEven ? "vertical" : "horizontal";
    let x: number;
    let y: number;
    if (i === 0) {
      x = 0;
      y = 0;
    } else if (i === 1) {
      // First extension to the right (horizontal)
      x = TILE.W + TILE.GAP;
      y = 0;
    } else if (isEven) {
      // Extending left (i=2, 4, 6, ...). Vertical, zigzagging down.
      // i=2: x = -(TILE.W + TILE.GAP), y = (TILE.H + TILE.GAP)
      // i=4: x = -2 * (TILE.W + TILE.GAP), y = 2 * (TILE.H + TILE.GAP)
      x = -Math.floor(i / 2) * (TILE.W + TILE.GAP);
      y = Math.floor(i / 2) * (TILE.H + TILE.GAP);
    } else {
      // Extending right (i=3, 5, ...). Horizontal, at the same y as the
      // corresponding left-side vertical tile in the same row.
      const prevHorizontal = result[i - 2];
      x = prevHorizontal.x + TILE.W + TILE.GAP;
      y = result[i - 1].y;
    }
    result.push({ ...placed[i], x, y, orientation });
  }
  return result;
}
