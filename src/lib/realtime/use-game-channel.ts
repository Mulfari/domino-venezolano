"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameEvent, PresenceState } from "./events";

const DISCONNECT_GRACE_MS = 30_000;

interface UseGameChannelOptions {
  roomCode: string;
  userId: string;
  displayName: string;
  seat: number;
  onEvent: (event: GameEvent) => void;
  onPresenceChange?: (players: PresenceState[]) => void;
  onReconnected?: () => void;
}

export function useGameChannel({
  roomCode,
  userId,
  displayName,
  seat,
  onEvent,
  onPresenceChange,
  onReconnected,
}: UseGameChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onPresenceChangeRef = useRef(onPresenceChange);
  onPresenceChangeRef.current = onPresenceChange;
  const onReconnectedRef = useRef(onReconnected);
  onReconnectedRef.current = onReconnected;

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

    let isMounted = true;
    const supabase = createClient();
    const channelName = `room:${roomCode}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel.on("broadcast", { event: "game_event" }, ({ payload }) => {
      onEventRef.current(payload as GameEvent);
    });

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
        const timer = disconnectTimers.current.get(p.seat);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.current.delete(p.seat);
        }
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
        const timer = setTimeout(() => {
          disconnectTimers.current.delete(p.seat);
          onEventRef.current({
            type: "player_disconnected",
            seat: p.seat,
          });
        }, DISCONNECT_GRACE_MS);
        disconnectTimers.current.set(p.seat, timer);
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
        if (!isMounted) return;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) channel.subscribe();
        }, 3000);
      }
    });

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && channel) {
        channel.track({
          user_id: userId,
          display_name: displayName,
          seat,
          online_at: new Date().toISOString(),
        } satisfies PresenceState);
        onReconnectedRef.current?.();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    channelRef.current = channel;

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      for (const timer of disconnectTimers.current.values()) {
        clearTimeout(timer);
      }
      disconnectTimers.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, userId, displayName, seat]);

  return { broadcast };
}
