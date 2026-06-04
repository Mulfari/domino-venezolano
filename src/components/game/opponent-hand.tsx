"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { COLORS, GAME } from "@/lib/game/constants";

interface Props {
  seat: number;
  position: "top" | "left" | "right";
  playerId: string;
  playerName: string;
  connected: boolean;
  isActive: boolean;
}

export function OpponentHand({ seat, position, playerId, playerName, connected, isActive }: Props) {
  const moves = useRoomStore((s) => s.moves);

  // Count tiles the opponent has played in the current round
  const tilesPlayed = moves.filter(
    (m) => m.type === "play_tile" && m.playerId === playerId
  ).length;

  // Tiles remaining = initial hand minus played
  const tileCount = Math.max(0, GAME.TILES_PER_PLAYER - tilesPlayed);

  const isHorizontal = position === "top";

  return (
    <div className={`flex ${isHorizontal ? "flex-col" : "flex-row"} items-center gap-2`}>
      <div className={`text-gold text-sm font-semibold flex items-center gap-1 ${isActive ? "animate-pulse" : ""}`}>
        <span className={connected ? "text-green-400" : "text-red-400"}>●</span>
        {playerName}
        <span className="text-ivory/60 ml-1">({tileCount})</span>
      </div>
      <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"} gap-px`}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: isHorizontal ? 24 : 20,
              height: isHorizontal ? 16 : 24,
              background: `linear-gradient(135deg, ${COLORS.wood}, #2a1810)`,
              border: `1px solid ${COLORS.gold}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
