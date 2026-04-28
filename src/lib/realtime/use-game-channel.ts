"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameEvent, PresenceState } from "./events";

interface UseGameChannelOptions {
  roomCode: string;
  userId: string;
  displayName: string;
  seat: number;
  onEvent: (event: GameEvent) => void;
  onPresenceChange?: (players: PresenceState[]) => void;
}

export function useGameChannel({
  roomCode,
  userId,
  displayName,
  seat,
  onEvent,
  onPresenceChange,
}: UseGameChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs for callbacks to avoid stale closures in the channel listener
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onPresenceChangeRef = useRef(onPresenceChange);
  onPresenceChangeRef.current = onPresenceChange;

  const broadcast = useCallback(
    (event: GameEvent) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "game_event",
        payload: event,
      });
    },
    []
  );

  useEffect(() => {
    if (!roomCode || !userId) return;

    const supabase = createClient();
    const channelName = `room:${roomCode}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    // Listen for broadcast game events
    channel.on("broadcast", { event: "game_event" }, ({ payload }) => {
      onEventRef.current(payload as GameEvent);
    });

    // Presence tracking
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      const players: PresenceState[] = [];
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          players.push(presences[0] as PresenceState);
        }
      }
      onPresenceChangeRef.current?.(players);
    });

    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      for (const presence of newPresences) {
        const p = presence as unknown as PresenceState;
        onEventRef.current({
          type: "player_connected",
          seat: p.seat,
          display_name: p.display_name,
        });
      }
    });

    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      for (const presence of leftPresences) {
        const p = presence as unknown as PresenceState;
        onEventRef.current({
          type: "player_disconnected",
          seat: p.seat,
        });
      }
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

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Attempt reconnection after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          channel.subscribe();
        }, 3000);
      }
    });

    channelRef.current = channel;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, userId, displayName, seat]);

  return { broadcast };
}
