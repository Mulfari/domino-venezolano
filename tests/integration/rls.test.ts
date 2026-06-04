import { describe, it, expect, beforeAll } from "vitest";
import { getTestClient } from "./setup";

describe("RLS policies", () => {
  let roomId: string;
  let playerA: string;
  let playerB: string;

  beforeAll(async () => {
    const supa = getTestClient();
    roomId = "test-" + Date.now();
    playerA = crypto.randomUUID();
    playerB = crypto.randomUUID();
    await supa.from("rooms").insert({ id: roomId, status: "playing" });
    await supa.from("players").insert([
      { id: playerA, room_id: roomId, seat: 0, name: "A", team: 0 },
      { id: playerB, room_id: roomId, seat: 1, name: "B", team: 1 },
    ]);
    await supa.from("hands").insert([
      { room_id: roomId, player_id: playerA, round: 1, tiles: [0, 1, 2, 3, 4, 5, 6] },
      { room_id: roomId, player_id: playerB, round: 1, tiles: [7, 8, 9, 10, 11, 12, 13] },
    ]);
  });

  it("player A cannot read player B's hand", async () => {
    const supa = getTestClient();
    await supa.rpc("set_config", { setting: "app.current_player_id", value: playerA });
    const { data } = await supa.from("hands").select("*").eq("room_id", roomId);
    expect(data?.every((h) => h.player_id === playerA)).toBe(true);
  });

  it("anyone can read the moves log", async () => {
    const supa = getTestClient();
    const { data } = await supa.from("moves").select("*").eq("room_id", roomId);
    expect(Array.isArray(data)).toBe(true);
  });
});
