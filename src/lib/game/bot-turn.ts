import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { applyMove, applyPass } from "./engine";
import { calculateRoundResult } from "./scoring";
import { chooseBotMove, isBotUserId } from "./bot-engine";
import type { Tile, Seat, BoardState, GameState } from "./types";

export async function processBotTurns(gameId: string) {
  const admin = getSupabaseAdmin();

  for (let safety = 0; safety < 20; safety++) {
    const { data: game } = await admin
      .from("games")
      .select("*, rooms!inner(code, seats)")
      .eq("id", gameId)
      .single();

    if (!game || game.status !== "playing") break;

    const seats = ((game.rooms as Record<string, unknown>).seats ?? []) as (
      | { user_id: string; display_name: string }
      | null
    )[];
    const currentSeat = game.current_turn as Seat;
    const currentPlayer = seats[currentSeat];

    if (!currentPlayer || !isBotUserId(currentPlayer.user_id)) break;

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    const allHands = game.hands as Tile[][];
    const hands = new Map<Seat, Tile[]>();
    for (let i = 0; i < 4; i++) hands.set(i as Seat, allHands[i]);

    const board = game.board as BoardState;
    const state: GameState = {
      board,
      hands,
      current_turn: currentSeat,
      consecutive_passes: game.consecutive_passes ?? 0,
      status: "playing",
    };

    const botHand = allHands[currentSeat];
    const move = chooseBotMove(botHand, board);

    let newState: GameState;
    let eventPayload: Record<string, unknown>;

    if (move) {
      newState = applyMove(state, currentSeat, move.tile, move.end);
      eventPayload = { type: "tile_played", seat: currentSeat, tile: move.tile, end: move.end };
    } else {
      newState = applyPass(state, currentSeat);
      eventPayload = { type: "turn_passed", seat: currentSeat };
    }

    const newHands: Tile[][] = [];
    for (let i = 0; i < 4; i++) newHands.push(newState.hands.get(i as Seat) ?? []);

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

    let roundResult: { winner_team: number | null; points: number; reason: string } | null = null;
    let newScores: number[] | null = null;

    if (newState.status === "finished") {
      const result = calculateRoundResult(newState);
      roundResult = result;
      updatePayload.finished_at = new Date().toISOString();

      for (let i = 0; i < 4; i++) {
        if (newHands[i].length === 0) {
          updatePayload.winner_seat = i;
          updatePayload.winning_team = i % 2;
          break;
        }
      }

      const currentScores = (game.scores as number[]) || [0, 0];
      newScores = [...currentScores];
      if (result.winner_team !== null) newScores[result.winner_team] += result.points;
      updatePayload.scores = newScores;
      updatePayload.points_awarded = result.points;
    }

    await admin.from("games").update(updatePayload).eq("id", gameId);

    if (move) {
      await admin
        .from("game_hands")
        .update({ tiles: newHands[currentSeat] })
        .eq("game_id", gameId)
        .eq("seat", currentSeat);
    }

    const roomCode = (game.rooms as Record<string, unknown>).code as string;
    const channel = admin.channel(`room:${roomCode}`);

    await channel.send({ type: "broadcast", event: "game_event", payload: eventPayload });

    if (roundResult && newScores) {
      await admin.from("scores").upsert([
        { room_id: game.room_id, game_id: gameId, team: 0, points: roundResult.winner_team === 0 ? roundResult.points : 0 },
        { room_id: game.room_id, game_id: gameId, team: 1, points: roundResult.winner_team === 1 ? roundResult.points : 0 },
      ]);

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

    await admin.removeChannel(channel);

    if (newState.status === "finished") break;
  }
}
