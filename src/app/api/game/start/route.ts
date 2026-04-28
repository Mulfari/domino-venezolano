import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tile, Seat } from "@/lib/game/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const { room_id } = body as { room_id: string };

    if (!room_id) {
      return NextResponse.json({ error: "Falta room_id." }, { status: 400 });
    }

    // Fetch room
    const { data: room, error: roomError } = await getSupabaseAdmin()
      .from("rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });
    }

    // Only host can start
    if (room.host_id !== user.id) {
      return NextResponse.json({ error: "Solo el host puede iniciar." }, { status: 403 });
    }

    // Validate 4 players
    const seats = room.seats as ({ user_id: string; display_name: string } | null)[];
    const filledSeats = seats.filter((s) => s !== null);
    if (filledSeats.length < 4) {
      return NextResponse.json(
        { error: "Se necesitan 4 jugadores para iniciar." },
        { status: 400 }
      );
    }

    // Get previous game scores if continuing a match
    let previousScores = [0, 0];
    if (room.current_game_id) {
      const { data: prevGame } = await getSupabaseAdmin()
        .from("games")
        .select("scores")
        .eq("id", room.current_game_id)
        .single();

      if (prevGame?.scores) {
        previousScores = prevGame.scores as number[];
      }
    }

    // Generate and shuffle all 28 domino tiles
    const tiles: [number, number][] = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push([i, j]);
      }
    }
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Deal 7 tiles to each player
    const hands: Tile[][] = [
      tiles.slice(0, 7),
      tiles.slice(7, 14),
      tiles.slice(14, 21),
      tiles.slice(21, 28),
    ];

    // Find who has the highest double to start
    let startingSeat = 0;
    let highestDouble = -1;
    for (let s = 0; s < 4; s++) {
      for (const tile of hands[s]) {
        if (tile[0] === tile[1] && tile[0] > highestDouble) {
          highestDouble = tile[0];
          startingSeat = s;
        }
      }
    }

    // Create new game
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .insert({
        room_id: room.id,
        hands,
        board: { left: null, right: null, plays: [] },
        current_turn: startingSeat,
        consecutive_passes: 0,
        status: "playing",
        scores: previousScores,
      })
      .select("id")
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "No se pudo crear la partida." }, { status: 500 });
    }

    // Update room
    await getSupabaseAdmin()
      .from("rooms")
      .update({ status: "playing", current_game_id: game.id })
      .eq("id", room.id);

    // Broadcast round_started
    const channel = getSupabaseAdmin().channel(`room:${room.code}`);
    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: {
        type: "round_started",
        game_id: game.id,
        current_turn: startingSeat,
      },
    });
    await getSupabaseAdmin().removeChannel(channel);

    return NextResponse.json({ success: true, game_id: game.id });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
