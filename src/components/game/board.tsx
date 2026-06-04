"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { buildPlacedTiles } from "@/lib/game/board-layout";
import { Tile } from "./tile";
import { COLORS, TILE } from "@/lib/game/constants";

export function Board() {
  const moves = useRoomStore((s) => s.moves);
  const gameState = useRoomStore((s) => s.gameState);

  const playMoves = moves
    .filter((m) => m.type === "play_tile")
    .map((m) => ({
      type: "play_tile" as const,
      playerId: m.playerId || "",
      tile: (m.payload as any).tile as number,
      end: ((m.payload as any).end as "left" | "right" | "center") || "right",
      flipped: false,
    }));

  const placed = buildPlacedTiles(playMoves);

  return (
    <div
      className="relative w-full h-96 overflow-hidden rounded-2xl border-4"
      style={{
        background: `linear-gradient(135deg, ${COLORS.felt}, #08443A)`,
        borderColor: COLORS.gold,
        boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {placed.length === 0 && (
          <div className="text-ivory/40 text-lg">Esperando primera ficha...</div>
        )}
        {placed.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
            }}
          >
            <Tile
              tileId={p.tile}
              orientation={p.orientation}
              showPips
              // For simplicity, render with renderA/renderB matching a/b; orientation handled in layout
            />
          </div>
        ))}
      </div>
    </div>
  );
}
