import { describe, it, expect } from "vitest";
import {
  canPlayTile,
  findStarter,
  isDobleSeis,
  countConsecutivePasses,
  isTrancado,
  isCapicua,
} from "./rules";
import { encodeTile } from "./tiles";

describe("rules.canPlayTile", () => {
  it("returns true when one side matches an open end", () => {
    expect(canPlayTile(encodeTile(3, 5), 3, 4)).toBe(true);
    expect(canPlayTile(encodeTile(3, 5), 4, 3)).toBe(true);
  });

  it("returns false when neither side matches", () => {
    expect(canPlayTile(encodeTile(3, 5), 6, 2)).toBe(false);
  });

  it("returns true for doubles (any side matches the open end)", () => {
    expect(canPlayTile(encodeTile(5, 5), 5, 7)).toBe(true);
  });
});

describe("rules.findStarter", () => {
  it("returns the player with doble-6 if present", () => {
    const hands = [
      [encodeTile(0, 1), encodeTile(2, 3)],
      [encodeTile(0, 6), encodeTile(6, 6), encodeTile(3, 3)],
      [encodeTile(1, 1), encodeTile(2, 2)],
      [encodeTile(5, 5), encodeTile(4, 4)],
    ];
    expect(findStarter(hands)).toBe(1);
  });

  it("returns the player with the highest-sum tile when no doble-6", () => {
    const hands = [
      [encodeTile(0, 0)],  // sum 0
      [encodeTile(5, 6)],  // sum 11
      [encodeTile(4, 6)],  // sum 10
      [encodeTile(3, 5)],  // sum 8
    ];
    expect(findStarter(hands)).toBe(1);
  });

  it("uses seat order as tiebreak", () => {
    const hands = [
      [encodeTile(6, 6)],
      [encodeTile(5, 5)],
      [encodeTile(6, 6)],  // same sum as seat 0
      [encodeTile(4, 4)],
    ];
    expect(findStarter(hands)).toBe(0);
  });
});

describe("rules.isDobleSeis", () => {
  it("is true for tile 27", () => {
    expect(isDobleSeis(27)).toBe(true);
    expect(isDobleSeis(0)).toBe(false);
  });
});

describe("rules.countConsecutivePasses", () => {
  it("counts trailing passes from the latest move backwards", () => {
    const moves = [
      { type: "play_tile" as const },
      { type: "pass" as const },
      { type: "pass" as const },
      { type: "pass" as const },
    ];
    expect(countConsecutivePasses(moves)).toBe(3);
  });

  it("stops counting at a play_tile", () => {
    const moves = [
      { type: "pass" as const },
      { type: "play_tile" as const },
      { type: "pass" as const },
    ];
    expect(countConsecutivePasses(moves)).toBe(1);
  });

  it("returns 0 for an empty move list", () => {
    expect(countConsecutivePasses([])).toBe(0);
  });
});

describe("rules.isTrancado", () => {
  it("is true when the last 4 moves are all passes", () => {
    const moves = [
      { type: "pass" as const },
      { type: "pass" as const },
      { type: "pass" as const },
      { type: "pass" as const },
    ];
    expect(isTrancado(moves)).toBe(true);
  });

  it("is false when fewer than 4 passes", () => {
    const moves = [
      { type: "pass" as const },
      { type: "pass" as const },
      { type: "pass" as const },
    ];
    expect(isTrancado(moves)).toBe(false);
  });
});

describe("rules.isCapicua", () => {
  it("is true when both board ends are the same", () => {
    expect(isCapicua(5, 5)).toBe(true);
  });

  it("is false when board ends differ", () => {
    expect(isCapicua(3, 5)).toBe(false);
  });

  it("is true when both ends are 0", () => {
    expect(isCapicua(0, 0)).toBe(true);
  });
});
