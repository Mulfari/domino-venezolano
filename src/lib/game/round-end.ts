/**
 * Shared logic for finishing a round.
 *
 * Called by play/route.ts, pass/route.ts, and bot-turn.ts whenever a move or
 * pass results in status === "finished".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateRoundResult } from "./scoring";
import { updateProfileStats } from "@/lib/supabase/update-profile-stats";
import type { Seat, GameState } from "./types";

export interface RoundEndResult {
  winner_team: number | null;
  points: number;
  reason: string;
  is_capicua?: boolean;
}

export interface SharedRoundEndContext {
  gameId: string;
  roomId: string;
  roomCode: string;
  seats: ({ user_id: string; display_name: string } | null)[];
  targetScore: number;
  newScores: number[];
  roundResult: RoundEndResult;
  newHands: Tile[][];
  winnerSeat: number;
}

type Tile = [number, number];

/**
 * Finalizes a round: updates DB with scores, broadcasts round_ended,
 * and closes the room if the match is over.
 */
export async function finalizeRound(
  admin: ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdmin>,
  ctx: SharedRoundEndContext
): Promise<void> {
  const { gameId, roomId, roomCode, seats, targetScore, newScores, roundResult } = ctx;

  // Upsert scores for this round
  await admin.from("scores").upsert([
    { room_id: roomId, game_id: gameId, team: 0, points: roundResult.winner_team === 0 ? roundResult.points : 0 },
    { room_id: roomId, game_id: gameId, team: 1, points: roundResult.winner_team === 1 ? roundResult.points : 0 },
  ]);

  // Broadcast round_ended to all players
  const channel = admin.channel(`room:${roomCode}`);
  await channel.send({
    type: "broadcast",
    event: "game_event",
    payload: {
      type: "round_ended",
      winner_team: roundResult.winner_team,
      points: roundResult.points,
      scores: { team0: newScores[0], team1: newScores[1] },
      reason: roundResult.reason,
      is_capicua: roundResult.is_capicua ?? false,
    },
  });
  await admin.removeChannel(channel);

  // If the match is over, close the room and update stats
  if (roundResult.winner_team !== null && (newScores[0] >= targetScore || newScores[1] >= targetScore)) {
    await updateProfileStats(seats, roundResult.winner_team as 0 | 1, targetScore, newScores);
    await admin.from("rooms").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", roomId);
  }
}

/**
 * Builds the update payload for the games table when a round ends.
 * Also returns the winner seat for external use.
 */
export function buildRoundEndPayload(
  newState: GameState,
  newHands: Tile[][],
  currentScores: number[],
  roundNumber: number
): { updatePayload: Record<string, unknown>; newScores: number[]; winnerSeat: number } {
  const result = calculateRoundResult(newState) as RoundEndResult;
  const updatedScores = [...currentScores];
  if (result.winner_team !== null) {
    updatedScores[result.winner_team] += result.points;
  }

  let winnerSeat = -1;
  for (let i = 0; i < 4; i++) {
    if (newHands[i].length === 0) {
      winnerSeat = i;
      break;
    }
  }

  const updatePayload: Record<string, unknown> = {
    finished_at: new Date().toISOString(),
    winner_seat: winnerSeat,
    winning_team: winnerSeat >= 0 ? winnerSeat % 2 : null,
    scores: updatedScores,
    points_awarded: result.points,
  };

  return { updatePayload, newScores: updatedScores, winnerSeat };
}