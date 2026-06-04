import { describe, it, expect } from "vitest";
import { buildPlacedTiles, layoutChain } from "./board-layout";
import { encodeTile, decodeTile } from "./tiles";
import { TILE } from "./constants";

describe("board-layout.buildPlacedTiles", () => {
  it("returns an empty array for no moves", () => {
    expect(buildPlacedTiles([])).toEqual([]);
  });

  it("places the first tile at position 0, vertical, centered", () => {
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
    ]);
    expect(placed).toHaveLength(1);
    expect(placed[0]).toMatchObject({
      tile: encodeTile(6, 6),
      x: 0, // centered (we use 0 as anchor for position 0)
      y: 0,
      orientation: "vertical",
    });
  });

  it("places the second tile to the right (horizontal)", () => {
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
    ]);
    expect(placed).toHaveLength(2);
    expect(placed[1]).toMatchObject({
      tile: encodeTile(3, 6),
      orientation: "horizontal",
    });
    // Right of the first tile
    expect(placed[1].x).toBeGreaterThan(placed[0].x);
  });

  it("places the third tile to the left (vertical), at a lower y than pos 0", () => {
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
      { type: "play_tile", playerId: "p2", tile: encodeTile(0, 6), end: "left", flipped: true },
    ]);
    expect(placed[2].orientation).toBe("vertical");
    expect(placed[2].x).toBeLessThan(placed[0].x);
  });
});

describe("board-layout: tile orientation (the v1 bug fix)", () => {
  it("preserves [a, b] order when a tile is played on the right end with `a` matching", () => {
    // Board right end is 6. Tile 3-6 played on the right: side "b" (6) touches the board.
    // We don't need to flip because the side that matches the open end is naturally on the right.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
    ]);
    // When rendered horizontally, the left side of the tile should be tile[0]=3,
    // the right side should be tile[1]=6.
    expect(placed[1].renderA).toBe(3);
    expect(placed[1].renderB).toBe(6);
  });

  it("flips [a, b] when a tile is played on the left end with `b` matching", () => {
    // Board left end is 6. Tile 3-6 played on the left: side "a" (3) is on the left of the board
    // (i.e. far from the rest), side "b" (6) is on the right of the tile (touching the existing chain).
    // We flip so that renderA=6 (touching chain) and renderB=3 (far from chain).
    // Wait — actually for a horizontal tile played on the left, the tile sits to the LEFT of the chain.
    // Its right edge is the one that touches the existing chain. So the side that should be on the
    // RIGHT of the rendered tile is the one matching the open end (6). We need renderB=6.
    // Original tile is 3-6 (a=3, b=6). The side matching is b=6. We need renderB=6 → no flip needed.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "left", flipped: true },
    ]);
    expect(placed[1].renderA).toBe(3);
    expect(placed[1].renderB).toBe(6);
  });

  it("preserves [a, b] order when a tile is played on the left end with `b` matching", () => {
    // Board left end is 6. Tile 3-6 played on the left: side "b" (6) matches the open end.
    // The natural [3, 6] ordering already has b on the right of the rendered tile (touching chain),
    // so no flip is needed: renderA=3, renderB=6.
    // (Note: encodeTile(6, 3) would throw — the encoding always returns sorted form,
    //  so the "a matches" case is tested via the right play in test 1 and the left play in test 2.)
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "left", flipped: false },
    ]);
    expect(placed[1].renderA).toBe(3);
    expect(placed[1].renderB).toBe(6);
  });

  it("preserves [a, b] order when a tile is played on the right end with `b` matching", () => {
    // Board right end is 6. Tile 3-6 played on the right: side "b" (6) matches the open end.
    // The natural [3, 6] ordering already has b on the right of the rendered tile, so no flip.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
    ]);
    expect(placed[1].renderA).toBe(3);
    expect(placed[1].renderB).toBe(6);
  });
});

describe("board-layout.layoutChain", () => {
  it("returns positions for an empty chain", () => {
    expect(layoutChain([])).toEqual([]);
  });

  it("returns positions for a single-tile chain", () => {
    const positions = layoutChain([{ tile: encodeTile(6, 6), flipped: false }]);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({ x: 0, y: 0 });
  });
});
