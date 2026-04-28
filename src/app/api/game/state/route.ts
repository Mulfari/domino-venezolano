import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tile, Seat, BoardState } from "@/lib/game/types";

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
    let game_id = searchParams.get("game_id");
    const room_code = searchParams.get("room_code");

    // If no game_id but we have a room_code, look up the current game for that room
    if (!game_id && room_code) {
      const { data: room } = await getSupabaseAdmin()
        .from("rooms")
        .select("current_game_id")
        .eq("code", room_code.toUpperCase())
        .single();

      if (room?.current_game_id) {
        game_id = room.current_game_id;
      }
    }

    if (!game_id) {
      return NextResponse.json({ error: "Falta game_id." }, { status: 400 });
    }

    // Fetch game state
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .select("*, rooms!games_room_id_fkey(code, seats, host_id, target_score)")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    // Determine player's seat
    const roomData = game.rooms as Record<string, unknown>;
    const seats = (roomData.seats ?? [null, null, null, null]) as (
      | { user_id: string; display_name: string }
      | null
    )[];
    const playerSeat = seats.findIndex((s) => s?.user_id === user.id);

    if (playerSeat === -1) {
      return NextResponse.json({ error: "No estás en esta partida." }, { status: 403 });
    }

    const allHands = (game.hands ?? [[], [], [], []]) as Tile[][];
    const board = (game.board ?? { left: null, right: null, plays: [] }) as BoardState;
    const scores = (game.scores as number[]) || [0, 0];

    // Return only the player's own hand + public info
    // Other players' hand counts are visible but not their tiles
    const handCounts = allHands.map((h) => (h ? h.length : 0));

    return NextResponse.json({
      game_id: game.id,
      room_id: game.room_id,
      room_code: roomData.code,
      board,
      hand: allHands[playerSeat] ?? [],
      hand_counts: handCounts,
      current_turn: game.current_turn as Seat,
      consecutive_passes: game.consecutive_passes ?? 0,
      status: game.status,
      scores: { team0: scores[0], team1: scores[1] },
      seat: playerSeat,
      seats: seats.map((s) =>
        s ? { user_id: s.user_id, display_name: s.display_name } : null
      ),
      host_id: roomData.host_id ?? null,
      round: game.round_number ?? 1,
      target_score: (roomData.target_score as number) ?? 100,
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
