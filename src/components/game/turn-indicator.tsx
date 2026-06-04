"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";

export function TurnIndicator() {
  const gameState = useRoomStore((s) => s.gameState);
  const players = useRoomStore((s) => s.players);
  const identity = usePlayerStore((s) => s.identity);

  if (!gameState) return null;
  const active = players.find((p) => p.seat === gameState.activeSeat);
  const isMe = identity && active && active.id === identity.id;

  return (
    <div className={`text-center py-2 px-4 rounded-full border-2 ${isMe ? "border-gold bg-gold/20 animate-pulse" : "border-ivory/30 bg-wood/40"}`}>
      <span className="text-ivory font-semibold">
        {active ? (isMe ? "Tu turno" : `Turno de ${active.name}`) : "Esperando..."}
      </span>
    </div>
  );
}
