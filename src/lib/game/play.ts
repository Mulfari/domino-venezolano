import { createClient } from "@/lib/supabase/client";
import { decodeTile } from "./tiles";
import { canPlayTile } from "./rules";

export async function playTile(
  roomId: string,
  playerId: string,
  tile: number,
  end: "left" | "right",
  boardLeft: number,
  boardRight: number
) {
  if (!canPlayTile(tile, boardLeft, boardRight)) {
    throw new Error("Esa ficha no se puede jugar aquí");
  }
  const supabase = createClient();
  // Determine if the tile needs to be flipped (orientation)
  const [a, b] = decodeTile(tile);
  let flipped = false;
  if (end === "right") {
    // Side touching the chain is the left side of the rendered tile (renderA)
    // If a matches the existing rightEnd, no flip. If b matches, no flip.
    // We just store the natural [a, b] and let the renderer swap if needed.
  } else {
    // Side touching the chain is the right side of the rendered tile (renderB)
    if (a === boardLeft) {
      // a must be on renderB → flip if a < b
      flipped = a < b;
    }
  }
  const { error } = await supabase.from("moves").insert({
    room_id: roomId,
    player_id: playerId,
    type: "play_tile",
    payload: { tile, end, flipped },
  });
  if (error) throw error;

  // Remove the tile from the player's hand
  const { data: hand } = await supabase
    .from("hands")
    .select("tiles, round")
    .eq("room_id", roomId)
    .eq("player_id", playerId)
    .order("round", { ascending: false })
    .limit(1)
    .single();

  if (hand) {
    const newTiles = hand.tiles.filter((t: number) => t !== tile);
    await supabase
      .from("hands")
      .update({ tiles: newTiles })
      .eq("room_id", roomId)
      .eq("player_id", playerId)
      .eq("round", hand.round);
  }
}

export async function pass(roomId: string, playerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("moves").insert({
    room_id: roomId,
    player_id: playerId,
    type: "pass",
    payload: {},
  });
  if (error) throw error;
}
