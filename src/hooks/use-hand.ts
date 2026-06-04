"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";

export function useHand() {
  const roomId = useRoomStore((s) => s.roomId);
  const playerId = usePlayerStore((s) => s.identity?.id);
  const setMyHand = useRoomStore((s) => s.setMyHand);

  useEffect(() => {
    if (!roomId || !playerId) return;
    const supabase = createClient();
    // Set config for RLS
    supabase.rpc("set_config", {
      setting: "app.current_player_id",
      value: playerId,
    });

    const fetchHand = async () => {
      const { data } = await supabase
        .from("hands")
        .select("tiles, round")
        .eq("room_id", roomId)
        .eq("player_id", playerId)
        .order("round", { ascending: false })
        .limit(1)
        .single();
      if (data) setMyHand(data.tiles, data.round);
    };
    fetchHand();

    const channel = supabase
      .channel(`hand:${roomId}:${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hands",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchHand()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId, setMyHand]);
}
