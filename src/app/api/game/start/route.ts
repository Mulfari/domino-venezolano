import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { processBotTurns } from "@/lib/game/bot-turn";
import { isBotUserId } from "@/lib/game/bot-engine";
import type { Tile } from "@/lib/game/types";

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

    const { data: room, error: roomError } = await getSupabaseAdmin()
      .from("rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });
    }

    if (room.host_id !== user.id) {
      return NextResponse.json({ error: "Solo el host puede iniciar." }, { status: 403 });
    }

    const seats = (room.seats ?? [null, null, null, null]) as (
      | { user_id: string; display_name: string }
      | null
    )[];
    const filledSeats = seats.filter((s) => s !== null);
    if (filledSeats.length < 4) {
      return NextResponse.json(
        { error: "Se necesitan 4 jugadores para iniciar." },
        { status: 400 }
      );
    }

    // Get previous game info for scores and starter rotation
    let previousScores = [0, 0];
    let roundNumber = 1;
    let previousStarterSeat = -1;
    if (room.current_game_id) {
      const { data: prevGame } = await getSupabaseAdmin()
        .from("games")
        .select("scores, round_number, starter_seat, winner_seat")
        .eq("id", room.current_game_id)
        .single();

      if (prevGame?.scores) {
        previousScores = prevGame.scores as number[];
      }
      if (prevGame?.round_number) {
        roundNumber = (prevGame.round_number as number) + 1;
      }
      if (prevGame?.winner_seat !== null && prevGame?.winner_seat !== undefined) {
        previousStarterSeat = prevGame.winner_seat as number;
      } else if (prevGame?.starter_seat !== null && prevGame?.starter_seat !== undefined) {
        // Locked game: rotate clockwise from previous starter
        previousStarterSeat = ((prevGame.starter_seat as number) + 1) % 4;
      }
    }

    // Generate and shuffle all 28 domino tiles
    const tiles: [number, number][] = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push([i, j]);
      }
    }
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    const hands: Tile[][] = [
      tiles.slice(0, 7),
      tiles.slice(7, 14),
      tiles.slice(14, 21),
      tiles.slice(21, 28),
    ];

    // Venezuelan rules: round 1 = whoever has double-6 starts
    // Subsequent rounds = winner of previous round starts (locked game falls back to rotate)
    let startingSeat: number;
    if (roundNumber === 1) {
      startingSeat = 0;
      for (let s = 0; s < 4; s++) {
        if (hands[s].some(([a, b]) => a === 6 && b === 6)) {
          startingSeat = s;
          break;
        }
      }
    } else {
      startingSeat = previousStarterSeat >= 0 ? previousStarterSeat : 0;
    }

    const boardState = { left: null, right: null, plays: [] };

    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .insert({
        room_id: room.id,
        round_number: roundNumber,
        starter_seat: startingSeat,
        hands,
        board: boardState,
        board_left: null,
        board_right: null,
        tiles_played: [],
        current_turn: startingSeat,
        consecutive_passes: 0,
        status: "playing",
        scores: previousScores,
      })
      .select("id")
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "No se pudo crear la partida: " + (gameError?.message ?? "unknown") },
        { status: 500 }
      );
    }

    const handInserts = seats
      .map((seat, i) => ({ seat: seat!, index: i }))
      .filter(({ seat }) => !isBotUserId(seat.user_id))
      .map(({ seat, index }) => ({
        game_id: game.id,
        player_id: seat.user_id,
        seat: index,
        tiles: hands[index],
      }));
    if (handInserts.length > 0) {
      await getSupabaseAdmin().from("game_hands").insert(handInserts);
    }

    await getSupabaseAdmin()
      .from("rooms")
      .update({ status: "playing", current_game_id: game.id, started_at: new Date().toISOString() })
      .eq("id", room.id);

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

    // Await bot turns so Vercel doesn't kill the function early
    const startingPlayer = seats[startingSeat];
    if (startingPlayer && isBotUserId(startingPlayer.user_id)) {
      await processBotTurns(game.id);
    }

    return NextResponse.json({ success: true, game_id: game.id });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
