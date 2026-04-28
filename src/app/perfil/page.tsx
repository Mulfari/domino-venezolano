import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, games_played, games_won, win_streak, created_at")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Jugador";

  const winRate =
    profile && profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  return (
    <ProfileClient
      displayName={displayName}
      email={user.email ?? ""}
      gamesPlayed={profile?.games_played ?? 0}
      gamesWon={profile?.games_won ?? 0}
      winStreak={profile?.win_streak ?? 0}
      winRate={winRate}
      memberSince={profile?.created_at ?? user.created_at}
    />
  );
}
