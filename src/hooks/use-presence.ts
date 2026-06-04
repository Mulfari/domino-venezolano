"use client";
import { useEffect, useState } from "react";
import { useRoomStore } from "@/lib/store/room-store";
import { GAME } from "@/lib/game/constants";

/**
 * Returns true if at least one other player is connected.
 * Recomputes based on last_seen every 5 seconds.
 */
export function usePresence() {
  const players = useRoomStore((s) => s.players);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  return players.map((p) => ({
    ...p,
    isConnected: Date.now() - new Date(p.last_seen).getTime() < GAME.RECONNECT_GRACE_MS,
  }));
}
