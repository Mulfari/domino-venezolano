"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PresenceState } from "@/lib/realtime/events";

interface UsePresenceOptions {
  roomCode: string;
  userId: string;
  displayName: string;
  seat: number;
}

interface SeatStatus {
  seat: number;
  user_id: string;
  display_name: string;
  connected: boolean;
  online_at: string | null;
}

export function usePresence({ roomCode, userId, displayName, seat }: UsePresenceOptions) {
  const [seats, setSeats] = useState<SeatStatus[]>([
    { seat: 0, user_id: "", display_name: "", connected: false, online_at: null },
    { seat: 1, user_id: "", display_name: "", connected: false, online_at: null },
    { seat: 2, user_id: "", display_name: "", connected: false, online_at: null },
    { seat: 3, user_id: "", display_name: "", connected: false, online_at: null },
  ]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `presence:${roomCode}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      const updatedSeats: SeatStatus[] = [
        { seat: 0, user_id: "", display_name: "", connected: false, online_at: null },
        { seat: 1, user_id: "", display_name: "", connected: false, online_at: null },
        { seat: 2, user_id: "", display_name: "", connected: false, online_at: null },
        { seat: 3, user_id: "", display_name: "", connected: false, online_at: null },
      ];

      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const p = presences[0] as unknown as PresenceState;
          if (p.seat >= 0 && p.seat <= 3) {
            updatedSeats[p.seat] = {
              seat: p.seat,
              user_id: p.user_id,
              display_name: p.display_name,
              connected: true,
              online_at: p.online_at,
            };
          }
        }
      }

      setSeats(updatedSeats);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: userId,
          display_name: displayName,
          seat,
          online_at: new Date().toISOString(),
        } satisfies PresenceState);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, userId, displayName, seat]);

  return { seats };
}
