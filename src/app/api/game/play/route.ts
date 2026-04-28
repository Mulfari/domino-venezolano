import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { applyMove, getValidMoves } from "@/lib/game/engine";
import { calculateRoundResult } from "@/lib/game/scoring";
import type { Tile, Seat, BoardState, GameState } from "@/lib/game/types";

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
    const { game_id, tile, end } = body as {
      game_id: string;
      tile: [number, number];
      end: "left" | "right";
    };

    if (!game_id || !tile || !end) {
      return NextResponse.json(
        { error: "Faltan parámetros: game_id, tile, end." },
        { status: 400 }
      );
    }

    // Fetch game state
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .select("*, rooms!inner(code, seats)")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    // Determine player's seat
    const seats = game.rooms.seats as ({ user_id: string; display_name: string } | null)[];
    const playerSeat = seats.findIndex((s) => s?.user_id === user.id);

    if (playerSeat === -1) {
      return NextResponse.json({ error: "No estás en esta partida." }, { status: 403 });
    }

    if (game.status !== "playing") {
      return NextResponse.json({ error: "La ronda no está en curso." }, { status: 400 });
    }

    if (game.current_turn !== playerSeat) {
      return NextResponse.json({ error: "No es tu turno." }, { status: 400 });
    }

    // Reconstruct GameState from DB
    const hands = new Map<Seat, Tile[]>();
    for (let i = 0; i < 4; i++) {
      hands.set(i as Seat, (game.hands as Tile[][])[i]);
    }

    const state: GameState = {
      board: game.board as BoardState,
      hands,
      current_turn: game.current_turn as Seat,
      consecutive_passes: game.consecutive_passes,
      status: game.status as "playing",
    };

    // Apply the move (validates internally)
    let newState: GameState;
    try {
      newState = applyMove(state, playerSeat as Seat, tile as Tile, end);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Movimiento inválido.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Serialize hands back to array
    const newHands: Tile[][] = [];
    for (let i = 0; i < 4; i++) {
      newHands.push(newState.hands.get(i as Seat) ?? []);
    }

    // Update game in DB
    const { error: updateError } = await getSupabaseAdmin()
      .from("games")
      .update({
        board: newState.board,
        hands: newHands,
        current_turn: newState.current_turn,
        consecutive_passes: newState.consecutive_passes,
        status: newState.status,
      })
      .eq("id", game_id);

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar la partida." }, { status: 500 });
    }

    // Broadcast tile_played event
    const roomCode = game.rooms.code as string;
    const channel = getSupabaseAdmin().channel(`room:${roomCode}`);

    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: { type: "tile_played", seat: playerSeat, tile, end },
    });

    // Check if round is over
    if (newState.status === "finished") {
      const result = calculateRoundResult(newState);

      // Update scores
      const currentScores = (game.scores as number[]) || [0, 0];
      const newScores = [...currentScores];
      if (result.winner_team !== null) {
        newScores[result.winner_team] += result.points;
      }

      await getSupabaseAdmin()
        .from("games")
        .update({ scores: newScores })
        .eq("id", game_id);

      await channel.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "round_ended",
          winner_team: result.winner_team,
          points: result.points,
          scores: { team0: newScores[0], team1: newScores[1] },
          reason: result.reason,
        },
      });
    }

    await getSupabaseAdmin().removeChannel(channel);

    return NextResponse.json({ success: true, status: newState.status });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
