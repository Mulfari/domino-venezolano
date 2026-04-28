import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PublicRoomsClient } from "./public-rooms-client";

export const dynamic = "force-dynamic";

export default async function PublicRoomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rooms } = await getSupabaseAdmin()
    .from("rooms")
    .select("id, code, seats, created_at, is_private, status")
    .eq("status", "waiting")
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const roomList = (rooms ?? []).map((room) => {
    const seats = (room.seats ?? [null, null, null, null]) as (
      | { user_id: string; display_name: string }
      | null
    )[];
    const filledCount = seats.filter((s) => s !== null).length;
    const playerNames = seats
      .filter((s): s is { user_id: string; display_name: string } => s !== null)
      .map((s) => s.display_name);

    return {
      id: room.id as string,
      code: room.code as string,
      playerCount: filledCount,
      playerNames,
      createdAt: room.created_at as string,
    };
  });

  return <PublicRoomsClient rooms={roomList} />;
}
