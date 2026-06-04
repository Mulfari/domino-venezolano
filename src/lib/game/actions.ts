import { createClient } from "@/lib/supabase/client";
import { dealTiles, seedFromRoomId } from "./deal";
import { findStarter } from "./rules";
import { scoreDomino, scoreTrancado } from "./scoring";
import { GAME, SEAT_TEAM } from "./constants";

export async function recordRoundEnd(
  roomId: string,
  reason: "domino" | "trancado",
  winnerSeat: number,
  hands: number[][]
) {
  const supabase = createClient();
  let score: { points: number; team: 0 | 1 | -1 };
  if (reason === "domino") {
    const winnerTeam = SEAT_TEAM[winnerSeat] as 0 | 1;
    score = scoreDomino(hands, winnerSeat, winnerTeam);
  } else {
    score = scoreTrancado(hands);
  }
  if (score.team === -1) {
    // Tie-safe trancado: no points awarded, don't persist a round_end move.
    return score;
  }
  await supabase.from("moves").insert({
    room_id: roomId,
    type: "round_end",
    payload: { reason, winnerSeat, ...score },
  });
  return score;
}

export async function dealRound(roomId: string, round: number = 1) {
  const supabase = createClient();
  const seed = seedFromRoomId(roomId) ^ round; // xor with round for variety
  const hands = dealTiles(seed);
  const starterSeat = findStarter(hands);

  // Get player ids by seat
  const { data: players } = await supabase
    .from("players")
    .select("id, seat")
    .eq("room_id", roomId)
    .order("seat");

  if (!players || players.length !== GAME.PLAYERS) {
    throw new Error("Room not ready for deal");
  }

  // Insert the deal move
  await supabase.from("moves").insert({
    room_id: roomId,
    player_id: players[starterSeat].id,
    type: "deal",
    payload: { starterSeat, round },
  });

  // Insert hands
  for (let i = 0; i < players.length; i++) {
    await supabase.from("hands").insert({
      room_id: roomId,
      player_id: players[i].id,
      round,
      tiles: hands[i],
    });
  }

  // Update room status
  await supabase
    .from("rooms")
    .update({ status: "playing" })
    .eq("id", roomId);

  return { hands, starterSeat };
}
