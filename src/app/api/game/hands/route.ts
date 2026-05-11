import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tile } from "@/lib/game/types";

/**
 * Returns the current player's hand tiles from the game_hands table.
 * Used after reconnection to restore the player's hand without reloading the full game.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get("game_id");

    if (!game_id) {
      return NextResponse.json({ error: "Falta game_id." }, { status: 400 });
    }

    // Get player's seat from rooms
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .select("*, rooms!games_room_id_fkey(seats)")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    const seats = ((game.rooms as Record<string, unknown>).seats ?? [null, null, null, null]) as (
      | { user_id: string; display_name: string }
      | null
    )[];
    const playerSeat = seats.findIndex((s) => s?.user_id === user.id);

    if (playerSeat === -1) {
      return NextResponse.json({ error: "No estás en esta partida." }, { status: 403 });
    }

    const { data: handData, error: handError } = await getSupabaseAdmin()
      .from("game_hands")
      .select("tiles")
      .eq("game_id", game_id)
      .eq("seat", playerSeat)
      .single();

    if (handError || !handData) {
      return NextResponse.json({ tiles: [] as Tile[] });
    }

    return NextResponse.json({ tiles: (handData.tiles ?? []) as Tile[] });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
