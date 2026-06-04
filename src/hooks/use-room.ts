"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { deriveGameState } from "@/lib/game/state";
import { GAME } from "@/lib/game/constants";

export function useRoom() {
  const roomId = useRoomStore((s) => s.roomId);
  const playerId = usePlayerStore((s) => s.identity?.id);
  const setMoves = useRoomStore((s) => s.setMoves);
  const setPlayers = useRoomStore((s) => s.setPlayers);
  const setStatus = useRoomStore((s) => s.setStatus);
  const setGameState = useRoomStore((s) => s.setGameState);
  const status = useRoomStore((s) => s.status);
  const moves = useRoomStore((s) => s.moves);
  const players = useRoomStore((s) => s.players);

  useEffect(() => {
    if (!roomId || !playerId) return;
    const supabase = createClient();

    // Set the player id for RLS
    supabase.rpc("set_config", {
      setting: "app.current_player_id",
      value: playerId,
    }).then(() => {});

    // Initial load
    (async () => {
      const { data: room } = await supabase
        .from("rooms")
        .select("status")
        .eq("id", roomId)
        .single();
      if (room) setStatus(room.status as "waiting" | "playing" | "finished");

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("seat");
      if (players) setPlayers(players);

      const { data: ms } = await supabase
        .from("moves")
        .select("*")
        .eq("room_id", roomId)
        .order("seq");
      if (ms) setMoves(ms);
    })();

    // Subscribe to moves
    const movesChannel = supabase
      .channel(`moves:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "moves", filter: `room_id=eq.${roomId}` },
        (payload) => {
          useRoomStore.getState().appendMove(payload.new as any);
        }
      )
      .subscribe();

    // Subscribe to players
    const playersChannel = supabase
      .channel(`players:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        () => {
          supabase
            .from("players")
            .select("*")
            .eq("room_id", roomId)
            .order("seat")
            .then(({ data }) => {
              if (data) setPlayers(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(movesChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [roomId, playerId, setMoves, setPlayers, setStatus]);

  // Recompute game state when moves change
  useEffect(() => {
    if (!roomId) return;
    const gs = deriveGameState({ status, moves, players });
    setGameState(gs);
  }, [moves, players, status, roomId, setGameState]);

  // Heartbeat is in use-presence
  useEffect(() => {
    if (!roomId || !playerId) return;
    const interval = setInterval(async () => {
      const supabase = createClient();
      await supabase
        .from("players")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", playerId);
    }, GAME.HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId, playerId]);
}
