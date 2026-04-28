import { createClient } from "@/lib/supabase/server";
import { createRoomWithOptions, quickPlay } from "@/lib/rooms/actions";
import { JoinRoomForm } from "./join-room-form";
import { LobbyClient } from "./lobby-client";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0];

  let stats = { gamesPlayed: 0, gamesWon: 0, winStreak: 0 };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("games_played, games_won, win_streak")
      .eq("id", user.id)
      .single();

    if (profile) {
      stats = {
        gamesPlayed: profile.games_played ?? 0,
        gamesWon: profile.games_won ?? 0,
        winStreak: profile.win_streak ?? 0,
      };
    }
  }

  return (
    <LobbyClient
      user={user ? { displayName: displayName || "Jugador", stats } : null}
      createRoomAction={createRoomWithOptions}
      quickPlayAction={quickPlay}
      joinRoomForm={<JoinRoomForm />}
    />
  );
}
