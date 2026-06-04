import { describe, it, expect } from "vitest";
import { dealTiles, seedFromRoomId } from "./deal";
import { allTileIds } from "./tiles";

describe("deal.seedFromRoomId", () => {
  it("produces a deterministic 32-bit integer from a string", () => {
    expect(seedFromRoomId("k7m2-x9pq")).toBe(seedFromRoomId("k7m2-x9pq"));
    expect(seedFromRoomId("k7m2-x9pq")).not.toBe(seedFromRoomId("other-room"));
  });
});

describe("deal.dealTiles", () => {
  it("returns 4 hands of 7 tiles each (28 total)", () => {
    const hands = dealTiles(42);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(7);
    }
    const allDealt = hands.flat();
    expect(allDealt).toHaveLength(28);
    expect(new Set(allDealt).size).toBe(28);
  });

  it("uses every tile from the standard set exactly once", () => {
    const hands = dealTiles(42);
    const allIds = allTileIds();
    for (const id of allIds) {
      expect(hands.flat()).toContain(id);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = dealTiles(123);
    const b = dealTiles(123);
    expect(a).toEqual(b);
  });

  it("produces different distributions for different seeds", () => {
    const a = dealTiles(1);
    const b = dealTiles(2);
    expect(a).not.toEqual(b);
  });
});
