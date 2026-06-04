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

describe("board-layout: tile orientation", () => {
  it("a matches on RIGHT — no flip; renderA (touching chain) = a", () => {
    // Chain 0-3, then 3-6 on right. Chain right=3 matches a=3.
    // New tile sits to the right of chain; renderA (left of rendered tile) touches chain.
    // Matching (3) must be renderA. Natural [3,6] has renderA=3 → no flip.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(0, 3), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
    ]);
    expect(placed[1].renderA).toBe(3);
    expect(placed[1].renderB).toBe(6);
  });

  it("b matches on RIGHT — FLIP; renderA (touching chain) = b", () => {
    // Chain 6-6, then 3-6 on right. Chain right=6 matches b=6.
    // New tile sits to the right of chain; renderA (left of rendered tile) touches chain.
    // Matching (6) must be renderA. Natural [3,6] has renderA=3 → FLIP to renderA=6, renderB=3.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "right", flipped: false },
    ]);
    expect(placed[1].renderA).toBe(6);
    expect(placed[1].renderB).toBe(3);
  });

  it("a matches on LEFT — FLIP; renderB (touching chain) = a", () => {
    // Chain 3-6, then 3-6 on left. Chain left=3 matches a=3.
    // New tile sits to the left of chain; renderB (right of rendered tile) touches chain.
    // Matching (3) must be renderB. Natural [3,6] has renderB=6 → FLIP to renderA=6, renderB=3.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(3, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "left", flipped: false },
    ]);
    expect(placed[1].renderA).toBe(6);
    expect(placed[1].renderB).toBe(3);
  });

  it("b matches on LEFT — no flip; renderB (touching chain) = b", () => {
    // Chain 6-6, then 3-6 on left. Chain left=6 matches b=6.
    // New tile sits to the left of chain; renderB (right of rendered tile) touches chain.
    // Matching (6) must be renderB. Natural [3,6] has renderB=6 → no flip.
    const placed = buildPlacedTiles([
      { type: "play_tile", playerId: "p0", tile: encodeTile(6, 6), end: "center", flipped: false },
      { type: "play_tile", playerId: "p1", tile: encodeTile(3, 6), end: "left", flipped: false },
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
    const positions = layoutChain([{ tile: encodeTile(6, 6), renderA: 6, renderB: 6 }]);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({ x: 0, y: 0 });
  });
});
