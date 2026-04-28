import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { applyMove } from "@/lib/game/engine";
import { calculateRoundResult } from "@/lib/game/scoring";
import { processBotTurns } from "@/lib/game/bot-turn";
import { isBotUserId } from "@/lib/game/bot-engine";
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

    // Fetch game + room data
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .select("*, rooms!games_room_id_fkey(code, seats)")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    // Determine player's seat from room seats
    const seats = ((game.rooms as Record<string, unknown>).seats ?? [null, null, null, null]) as (
      | { user_id: string; display_name: string }
      | null
    )[];
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
    const allHands = game.hands as Tile[][];
    const hands = new Map<Seat, Tile[]>();
    for (let i = 0; i < 4; i++) {
      hands.set(i as Seat, allHands[i]);
    }

    const board = game.board as BoardState;

    const state: GameState = {
      board,
      hands,
      current_turn: game.current_turn as Seat,
      consecutive_passes: game.consecutive_passes ?? 0,
      status: "playing",
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

    // Build the update payload — include scores in the same write if round ended
    const updatePayload: Record<string, unknown> = {
      board: newState.board,
      board_left: newState.board.left,
      board_right: newState.board.right,
      tiles_played: newState.board.plays,
      hands: newHands,
      current_turn: newState.current_turn,
      consecutive_passes: newState.consecutive_passes,
      status: newState.status,
    };

    // If round ended, calculate scores and include in the same update
    let roundResult: { winner_team: number | null; points: number; reason: string } | null = null;
    let newScores: number[] | null = null;

    if (newState.status === "finished") {
      const result = calculateRoundResult(newState);
      roundResult = result;

      updatePayload.finished_at = new Date().toISOString();

      // Find the winner seat (the one with empty hand)
      for (let i = 0; i < 4; i++) {
        if (newHands[i].length === 0) {
          updatePayload.winner_seat = i;
          updatePayload.winning_team = i % 2;
          break;
        }
      }

      // Calculate and include scores in the same update
      const currentScores = (game.scores as number[]) || [0, 0];
      newScores = [...currentScores];
      if (result.winner_team !== null) {
        newScores[result.winner_team] += result.points;
      }
      updatePayload.scores = newScores;
      updatePayload.points_awarded = result.points;
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from("games")
      .update(updatePayload)
      .eq("id", game_id);

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar la partida." }, { status: 500 });
    }

    // Update the player's hand in game_hands table
    await getSupabaseAdmin()
      .from("game_hands")
      .update({ tiles: newHands[playerSeat] })
      .eq("game_id", game_id)
      .eq("seat", playerSeat);

    // Broadcast tile_played event
    const roomCode = (game.rooms as Record<string, unknown>).code as string;
    const channel = getSupabaseAdmin().channel(`room:${roomCode}`);

    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: { type: "tile_played", seat: playerSeat, tile, end },
    });

    // If round ended, write to scores table and broadcast
    if (roundResult && newScores) {
      const roomId = game.room_id as string;
      const scoreInserts = [
        { room_id: roomId, game_id, team: 0, points: roundResult.winner_team === 0 ? roundResult.points : 0 },
        { room_id: roomId, game_id, team: 1, points: roundResult.winner_team === 1 ? roundResult.points : 0 },
      ];
      await getSupabaseAdmin().from("scores").upsert(scoreInserts);

      await channel.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "round_ended",
          winner_team: roundResult.winner_team,
          points: roundResult.points,
          scores: { team0: newScores[0], team1: newScores[1] },
          reason: roundResult.reason,
        },
      });
    }

    await getSupabaseAdmin().removeChannel(channel);

    // If next turn is a bot and round isn't over, process bot turns
    if (newState.status === "playing") {
      const nextSeat = newState.current_turn;
      const nextPlayer = seats[nextSeat];
      if (nextPlayer && isBotUserId(nextPlayer.user_id)) {
        processBotTurns(game_id).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, status: newState.status });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
