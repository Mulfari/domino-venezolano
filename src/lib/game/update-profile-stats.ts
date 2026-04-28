import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isBotUserId } from "./bot-engine";

interface SeatInfo {
  user_id: string;
  display_name: string;
}

export async function updateProfileStats(
  seats: (SeatInfo | null)[],
  winnerTeam: 0 | 1,
  targetScore: number,
  newScores: number[]
) {
  const matchOver =
    newScores[0] >= targetScore || newScores[1] >= targetScore;
  if (!matchOver) return;

  const admin = getSupabaseAdmin();

  for (let i = 0; i < 4; i++) {
    const seat = seats[i];
    if (!seat || isBotUserId(seat.user_id)) continue;

    const isWinner = (i % 2) === winnerTeam;

    if (isWinner) {
      await admin.rpc("increment_profile_win", { uid: seat.user_id });
    } else {
      await admin.rpc("increment_profile_loss", { uid: seat.user_id });
    }
  }
}
