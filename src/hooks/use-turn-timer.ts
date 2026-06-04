"use client";
import { useEffect, useRef } from "react";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { playTile, pass } from "@/lib/game/play";
import { canPlayTile } from "@/lib/game/rules";
import { GAME } from "@/lib/game/constants";

export function useTurnTimer() {
  const gameState = useRoomStore((s) => s.gameState);
  const myHand = useRoomStore((s) => s.myHand);
  const roomId = useRoomStore((s) => s.roomId);
  const identity = usePlayerStore((s) => s.identity);
  const players = useRoomStore((s) => s.players);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameState || !identity || !roomId) return;
    const me = players.find((p) => p.id === identity.id);
    if (!me) return;
    const isMyTurn = gameState.activeSeat === me.seat;
    if (!isMyTurn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const { left, right } = gameState.boardEnds;
      const playable = myHand.find((t) => canPlayTile(t, left, right));
      if (playable !== undefined) {
        const canLeft = canPlayTile(playable, left, left);
        const canRight = canPlayTile(playable, right, right);
        const end: "left" | "right" = canLeft && !canRight
          ? "left"
          : canRight && !canLeft
          ? "right"
          : canRight
          ? "right"
          : "left";
        try {
          await playTile(roomId, identity.id, playable, end, left, right);
        } catch {
          // If auto-play fails, fall back to pass
          await pass(roomId, identity.id);
        }
      } else {
        await pass(roomId, identity.id);
      }
    }, GAME.TURN_TIMEOUT_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, myHand, identity, roomId, players]);
}
