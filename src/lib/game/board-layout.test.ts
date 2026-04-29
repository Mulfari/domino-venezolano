import { describe, it, expect } from "vitest";
import {
  tileSize,
  tileOrientation,
  turnRight,
  turnLeft,
  advance,
  wouldOverflow,
  layoutChain,
  buildPlacedTiles,
  DIMS_DESKTOP,
  DIMS_MOBILE,
} from "./board-layout";
import type { TileEntry, PlacedTile, Dir } from "./board-layout";
import type { PlayedTile } from "./types";

function entry(a: number, b: number, i: number): TileEntry {
  return { tile: [a, b], isDouble: a === b, key: `${a}-${b}-${i}` };
}

describe("tileSize", () => {
  it("horizontal non-double matches tile.tsx small config (w=20,h=36 → horiz 36x20)", () => {
    const sz = tileSize(false, "right", DIMS_DESKTOP);
    expect(sz).toEqual({ w: 36, h: 20 });
  });

  it("vertical non-double (20x36)", () => {
    const sz = tileSize(false, "down", DIMS_DESKTOP);
    expect(sz).toEqual({ w: 20, h: 36 });
  });

  it("horizontal double is perpendicular (20x36)", () => {
    const sz = tileSize(true, "right", DIMS_DESKTOP);
    expect(sz).toEqual({ w: 20, h: 36 });
  });

  it("vertical double is perpendicular (36x20)", () => {
    const sz = tileSize(true, "down", DIMS_DESKTOP);
    expect(sz).toEqual({ w: 36, h: 20 });
  });
});

describe("tileOrientation", () => {
  it("non-double going right is horizontal", () => {
    expect(tileOrientation(false, "right")).toBe("horizontal");
  });
  it("non-double going down is vertical", () => {
    expect(tileOrientation(false, "down")).toBe("vertical");
  });
  it("double going right is vertical (perpendicular)", () => {
    expect(tileOrientation(true, "right")).toBe("vertical");
  });
  it("double going down is horizontal (perpendicular)", () => {
    expect(tileOrientation(true, "down")).toBe("horizontal");
  });
});

describe("turnRight / turnLeft", () => {
  it("turnRight cycles clockwise", () => {
    expect(turnRight("right")).toBe("down");
    expect(turnRight("down")).toBe("left");
    expect(turnRight("left")).toBe("up");
    expect(turnRight("up")).toBe("right");
  });
  it("turnLeft cycles counter-clockwise", () => {
    expect(turnLeft("right")).toBe("up");
    expect(turnLeft("up")).toBe("left");
    expect(turnLeft("left")).toBe("down");
    expect(turnLeft("down")).toBe("right");
  });
});

describe("advance", () => {
  it("moves right", () => expect(advance(10, 20, "right", 5)).toEqual({ x: 15, y: 20 }));
  it("moves left", () => expect(advance(10, 20, "left", 5)).toEqual({ x: 5, y: 20 }));
  it("moves down", () => expect(advance(10, 20, "down", 5)).toEqual({ x: 10, y: 25 }));
  it("moves up", () => expect(advance(10, 20, "up", 5)).toEqual({ x: 10, y: 15 }));
});

describe("wouldOverflow", () => {
  it("returns false when tile fits", () => {
    expect(wouldOverflow(200, 200, 36, 20, 400, 400, 10)).toBe(false);
  });
  it("returns true when tile exceeds right edge", () => {
    expect(wouldOverflow(390, 200, 36, 20, 400, 400, 10)).toBe(true);
  });
  it("returns true when tile exceeds left edge", () => {
    expect(wouldOverflow(10, 200, 36, 20, 400, 400, 10)).toBe(true);
  });
  it("returns true when tile exceeds bottom edge", () => {
    expect(wouldOverflow(200, 395, 36, 20, 400, 400, 10)).toBe(true);
  });
});

describe("layoutChain", () => {
  const boardW = 400;
  const boardH = 400;
  const dims = DIMS_DESKTOP;

  it("returns empty array for empty tiles", () => {
    expect(layoutChain([], 200, 200, "right", boardW, boardH, dims, turnRight)).toEqual([]);
  });

  it("places a single tile to the right of start", () => {
    const tiles = [entry(3, 5, 0)];
    const placed = layoutChain(tiles, 200, 200, "right", boardW, boardH, dims, turnRight);
    expect(placed).toHaveLength(1);
    expect(placed[0].x).toBeGreaterThan(200);
    expect(placed[0].y).toBe(200);
    expect(placed[0].orientation).toBe("horizontal");
  });

  it("places tiles in a straight line when space allows", () => {
    const tiles = [entry(3, 5, 0), entry(5, 2, 1), entry(2, 4, 2)];
    const placed = layoutChain(tiles, 100, 200, "right", boardW, boardH, dims, turnRight);
    expect(placed).toHaveLength(3);
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i].x).toBeGreaterThan(placed[i - 1].x);
    }
  });

  it("turns when reaching the board edge", () => {
    const tiles: TileEntry[] = [];
    for (let i = 0; i < 12; i++) {
      tiles.push(entry(i % 7, (i + 1) % 7, i));
    }
    const placed = layoutChain(tiles, 200, 200, "right", boardW, boardH, dims, turnRight);
    expect(placed.length).toBe(12);
    const orientations = new Set(placed.map((p) => p.orientation));
    expect(orientations.size).toBeGreaterThan(1);
  });

  it("all tiles stay within board bounds", () => {
    const tiles: TileEntry[] = [];
    for (let i = 0; i < 14; i++) {
      tiles.push(entry(i % 7, (i + 1) % 7, i));
    }
    const placed = layoutChain(tiles, 200, 200, "right", boardW, boardH, dims, turnRight);
    for (const pt of placed) {
      const isH = pt.orientation === "horizontal";
      const tw = isH ? (pt.isDouble ? dims.doubleH : dims.horizW) : (pt.isDouble ? dims.doubleW : dims.horizH);
      const th = isH ? (pt.isDouble ? dims.doubleW : dims.horizH) : (pt.isDouble ? dims.doubleH : dims.horizW);
      expect(pt.x - tw / 2).toBeGreaterThanOrEqual(0);
      expect(pt.x + tw / 2).toBeLessThanOrEqual(boardW);
      expect(pt.y - th / 2).toBeGreaterThanOrEqual(0);
      expect(pt.y + th / 2).toBeLessThanOrEqual(boardH);
    }
  });

  it("tiles are connected (no large gaps between consecutive tiles)", () => {
    const tiles: TileEntry[] = [];
    for (let i = 0; i < 8; i++) {
      tiles.push(entry(i % 7, (i + 1) % 7, i));
    }
    const placed = layoutChain(tiles, 200, 200, "right", boardW, boardH, dims, turnRight);
    for (let i = 1; i < placed.length; i++) {
      const dx = Math.abs(placed[i].x - placed[i - 1].x);
      const dy = Math.abs(placed[i].y - placed[i - 1].y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Max distance: a corner turn shifts cross + main, roughly 2 tile lengths
      expect(dist).toBeLessThan(100);
    }
  });

  it("handles doubles correctly (perpendicular orientation)", () => {
    const tiles = [entry(3, 3, 0)];
    const placed = layoutChain(tiles, 200, 200, "right", boardW, boardH, dims, turnRight);
    expect(placed[0].isDouble).toBe(true);
    expect(placed[0].orientation).toBe("vertical");
  });
});

describe("buildPlacedTiles", () => {
  const boardW = 400;
  const boardH = 400;
  const dims = DIMS_DESKTOP;

  it("returns empty for no plays", () => {
    expect(buildPlacedTiles([], boardW, boardH, dims)).toEqual([]);
  });

  it("places first tile at center", () => {
    const plays: PlayedTile[] = [{ tile: [6, 6], seat: 0, end: "right" }];
    const placed = buildPlacedTiles(plays, boardW, boardH, dims);
    expect(placed).toHaveLength(1);
    expect(placed[0].x).toBe(200);
    expect(placed[0].y).toBe(200);
  });

  it("places right-end tiles to the right of center", () => {
    const plays: PlayedTile[] = [
      { tile: [6, 6], seat: 0, end: "right" },
      { tile: [6, 3], seat: 1, end: "right" },
    ];
    const placed = buildPlacedTiles(plays, boardW, boardH, dims);
    expect(placed).toHaveLength(2);
    expect(placed[1].x).toBeGreaterThan(placed[0].x);
  });

  it("places left-end tiles to the left of center", () => {
    const plays: PlayedTile[] = [
      { tile: [6, 6], seat: 0, end: "right" },
      { tile: [6, 3], seat: 1, end: "left" },
    ];
    const placed = buildPlacedTiles(plays, boardW, boardH, dims);
    expect(placed).toHaveLength(2);
    const leftTile = placed.find((p) => p.tile[0] === 6 && p.tile[1] === 3);
    const centerTile = placed.find((p) => p.tile[0] === 6 && p.tile[1] === 6);
    expect(leftTile!.x).toBeLessThan(centerTile!.x);
  });

  it("handles a full game (28 tiles) without crashing", () => {
    const plays: PlayedTile[] = [];
    for (let i = 0; i < 28; i++) {
      plays.push({
        tile: [i % 7, (i + 1) % 7],
        seat: (i % 4) as 0 | 1 | 2 | 3,
        end: i === 0 ? "right" : i % 2 === 0 ? "right" : "left",
      });
    }
    const placed = buildPlacedTiles(plays, boardW, boardH, dims);
    expect(placed).toHaveLength(28);
  });

  it("works with mobile dimensions on small board", () => {
    const plays: PlayedTile[] = [
      { tile: [6, 6], seat: 0, end: "right" },
      { tile: [6, 3], seat: 1, end: "right" },
      { tile: [3, 5], seat: 2, end: "right" },
    ];
    const placed = buildPlacedTiles(plays, 320, 320, DIMS_MOBILE);
    expect(placed).toHaveLength(3);
    for (const pt of placed) {
      expect(pt.x).toBeGreaterThan(0);
      expect(pt.y).toBeGreaterThan(0);
    }
  });

  it("first tile is always centered regardless of count", () => {
    for (let count = 1; count <= 5; count++) {
      const plays: PlayedTile[] = [];
      for (let i = 0; i < count; i++) {
        plays.push({
          tile: [i % 7, (i + 1) % 7],
          seat: (i % 4) as 0 | 1 | 2 | 3,
          end: i === 0 ? "right" : "right",
        });
      }
      const placed = buildPlacedTiles(plays, boardW, boardH, dims);
      const first = placed.find((p) => p.tile[0] === 0 && p.tile[1] === 1);
      expect(first!.x).toBe(200);
      expect(first!.y).toBe(200);
    }
  });
});
