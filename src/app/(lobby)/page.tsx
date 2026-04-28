import { createClient } from "@/lib/supabase/server";
import { createRoom, quickPlay } from "@/lib/rooms/actions";
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

  return (
    <LobbyClient
      user={user ? { displayName: displayName || "Jugador" } : null}
      createRoomAction={createRoom}
      quickPlayAction={quickPlay}
      joinRoomForm={<JoinRoomForm />}
    />
  );
}
