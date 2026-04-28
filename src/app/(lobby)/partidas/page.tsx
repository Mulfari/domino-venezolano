import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PublicRoomsClient } from "./public-rooms-client";

export default async function PartidasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Jugador";

  const { data: rooms } = await getSupabaseAdmin()
    .from("rooms")
    .select("id, code, host_id, seats, status, is_private, created_at")
    .eq("status", "waiting")
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PublicRoomsClient
      initialRooms={rooms ?? []}
      userId={user.id}
      displayName={displayName}
    />
  );
}
