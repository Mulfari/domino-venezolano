import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getValidMoves } from "@/lib/game/engine";
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
    const { game_id } = body as { game_id: string };

    if (!game_id) {
      return NextResponse.json({ error: "Falta game_id." }, { status: 400 });
    }

    // Fetch game state
    const { data: game, error: gameError } = await getSupabaseAdmin()
      .from("games")
      .select("*, rooms!games_room_id_fkey(code, seats)")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Partida no encontrada." }, { status: 404 });
    }

    // Determine player's seat
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

    // Validate player truly has no valid moves
    const allHands = game.hands as Tile[][];
    const playerHand = allHands[playerSeat];
    const board = game.board as BoardState;
    const mustPlayDouble6 = (game.round ?? 1) === 1 && board.plays.length === 0;
    const validMoves = getValidMoves(playerHand, board, mustPlayDouble6);

    if (validMoves.length > 0) {
      return NextResponse.json(
        { error: "No puedes pasar, tienes movimientos válidos." },
        { status: 400 }
      );
    }

    // Reconstruct GameState
    const hands = new Map<Seat, Tile[]>();
    for (let i = 0; i < 4; i++) {
      hands.set(i as Seat, allHands[i]);
    }

    const consecutivePasses = (game.consecutive_passes ?? 0) as number;
    const newPasses = consecutivePasses + 1;
    const locked = newPasses >= 4;
    const nextTurn = locked ? playerSeat : ((playerSeat + 1) % 4);
    const newStatus = locked ? "finished" : "playing";

    // Build update payload — include scores in the same write if locked
    const updatePayload: Record<string, unknown> = {
      current_turn: nextTurn,
      consecutive_passes: newPasses,
      status: newStatus,
    };

    let roundResult: { winner_team: number | null; points: number; reason: string } | null = null;
    let newScores: number[] | null = null;

    if (locked) {
      updatePayload.finished_at = new Date().toISOString();

      // Build GameState for scoring
      const state: GameState = {
        board,
        hands,
        current_turn: playerSeat as Seat,
        consecutive_passes: newPasses,
        status: "finished",
      };

      const result = calculateRoundResult(state);
      roundResult = result;

      const currentScores = (game.scores as number[]) || [0, 0];
      newScores = [...currentScores];
      if (result.winner_team !== null) {
        newScores[result.winner_team] += result.points;
      }

      updatePayload.scores = newScores;
      updatePayload.winning_team = result.winner_team;
      updatePayload.points_awarded = result.points;
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from("games")
      .update(updatePayload)
      .eq("id", game_id);

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar la partida." }, { status: 500 });
    }

    // Broadcast
    const roomCode = (game.rooms as Record<string, unknown>).code as string;
    const channel = getSupabaseAdmin().channel(`room:${roomCode}`);

    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: { type: "turn_passed", seat: playerSeat },
    });

    // If locked, write to scores table and broadcast round_ended
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

    // If next turn is a bot and round isn't over, await bot turns
    if (newStatus === "playing") {
      const nextPlayer = seats[nextTurn];
      if (nextPlayer && isBotUserId(nextPlayer.user_id)) {
        await processBotTurns(game_id);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
