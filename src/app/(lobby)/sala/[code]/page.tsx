import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoomLobby } from "./room-lobby";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return {
    title: `Sala ${code.toUpperCase()}`,
  };
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) {
    redirect("/");
  }

  if (room.status === "playing" && room.current_game_id) {
    redirect(`/juego/${room.current_game_id}`);
  }

  if (room.status === "finished") {
    redirect("/");
  }

  return (
    <RoomLobby
      room={room}
      userId={user.id}
      displayName={
        user.user_metadata?.display_name || user.email?.split("@")[0] || "Jugador"
      }
    />
  );
}
