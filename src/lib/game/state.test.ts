import { describe, it, expect } from "vitest";
import { deriveGameState } from "./state";
import { encodeTile } from "./tiles";

describe("state.deriveGameState", () => {
  it("returns the waiting state when no moves", () => {
    const s = deriveGameState({ status: "waiting", players: [], moves: [] });
    expect(s.phase).toBe("waiting");
    expect(s.activeSeat).toBe(-1);
  });

  it("returns the active seat and board ends after the first move", () => {
    const s = deriveGameState({
      status: "playing",
      players: [
        { id: "p0", seat: 0 },
        { id: "p1", seat: 1 },
        { id: "p2", seat: 2 },
        { id: "p3", seat: 3 },
      ],
      moves: [
        { seq: 1, type: "deal", payload: { starterSeat: 0 } },
        { seq: 2, type: "play_tile", playerId: "p0", payload: { tile: encodeTile(6, 6), end: "center" } },
      ],
    });
    expect(s.phase).toBe("playing");
    expect(s.activeSeat).toBe(1);
    expect(s.boardEnds).toEqual({ left: 6, right: 6 });
  });

  it("updates board ends as tiles are added", () => {
    const s = deriveGameState({
      status: "playing",
      players: [
        { id: "p0", seat: 0 },
        { id: "p1", seat: 1 },
        { id: "p2", seat: 2 },
        { id: "p3", seat: 3 },
      ],
      moves: [
        { seq: 1, type: "deal", payload: { starterSeat: 0 } },
        { seq: 2, type: "play_tile", playerId: "p0", payload: { tile: encodeTile(6, 6), end: "center" } },
        { seq: 3, type: "play_tile", playerId: "p1", payload: { tile: encodeTile(3, 6), end: "right" } },
      ],
    });
    expect(s.boardEnds).toEqual({ left: 6, right: 3 });
  });

  it("detects trancado and ends the round", () => {
    const s = deriveGameState({
      status: "playing",
      players: [
        { id: "p0", seat: 0 },
        { id: "p1", seat: 1 },
        { id: "p2", seat: 2 },
        { id: "p3", seat: 3 },
      ],
      moves: [
        { seq: 1, type: "deal", payload: { starterSeat: 0 } },
        { seq: 2, type: "play_tile", playerId: "p0", payload: { tile: encodeTile(6, 6), end: "center" } },
        { seq: 3, type: "pass", playerId: "p1", payload: {} },
        { seq: 4, type: "pass", playerId: "p2", payload: {} },
        { seq: 5, type: "pass", playerId: "p3", payload: {} },
        { seq: 6, type: "pass", playerId: "p0", payload: {} },
      ],
    });
    expect(s.phase).toBe("round_end");
    expect(s.roundEndReason).toBe("trancado");
  });
});
