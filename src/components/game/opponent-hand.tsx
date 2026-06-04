"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { COLORS } from "@/lib/game/constants";

interface Props {
  seat: number;
  position: "top" | "left" | "right";
  playerName: string;
  connected: boolean;
  isActive: boolean;
}

export function OpponentHand({ seat, position, playerName, connected, isActive }: Props) {
  const players = useRoomStore((s) => s.players);
  const me = useRoomStore((s) => s.players[0]); // we look up by current player; placeholder
  // Real count: derive from a join; for now use a stub
  const tileCount = 7;

  const isHorizontal = position === "top";

  return (
    <div className={`flex ${isHorizontal ? "flex-col" : "flex-row"} items-center gap-2`}>
      <div className={`text-gold text-sm font-semibold flex items-center gap-1 ${isActive ? "animate-pulse" : ""}`}>
        <span className={connected ? "text-green-400" : "text-red-400"}>●</span>
        {playerName}
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
