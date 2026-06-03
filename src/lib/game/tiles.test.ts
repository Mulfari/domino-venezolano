import { describe, it, expect } from "vitest";
import { encodeTile, decodeTile, allTileIds, tilePipSum } from "./tiles";

describe("tiles", () => {
  it("encodes a tile with offset a*7 - a*(a-1)/2 plus (b - a)", () => {
    expect(encodeTile(0, 0)).toBe(0);
    expect(encodeTile(0, 6)).toBe(6);
    expect(encodeTile(1, 1)).toBe(7);
    expect(encodeTile(6, 6)).toBe(27);
  });

  it("decodes a tile id back to [a, b]", () => {
    expect(decodeTile(0)).toEqual([0, 0]);
    expect(decodeTile(6)).toEqual([0, 6]);
    expect(decodeTile(7)).toEqual([1, 1]);
    expect(decodeTile(27)).toEqual([6, 6]);
  });

  it("roundtrips every tile", () => {
    for (const id of allTileIds()) {
      const [a, b] = decodeTile(id);
      expect(encodeTile(a, b)).toBe(id);
    }
  });

  it("returns 28 unique tile ids", () => {
    const ids = allTileIds();
    expect(ids).toHaveLength(28);
    expect(new Set(ids).size).toBe(28);
  });

  it("sums the pips of a tile", () => {
    expect(tilePipSum(0)).toBe(0);   // 0-0
    expect(tilePipSum(7)).toBe(2);   // 1-1
    expect(tilePipSum(27)).toBe(12); // 6-6
    expect(tilePipSum(3)).toBe(3);   // 0-3
  });
});
