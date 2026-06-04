"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { Tile } from "./tile";
import { canPlayTile } from "@/lib/game/rules";

export function Hand({ onTileClick, selectedTile }: { onTileClick: (tile: number) => void; selectedTile: number | null }) {
  const myHand = useRoomStore((s) => s.myHand);
  const gameState = useRoomStore((s) => s.gameState);
  const players = useRoomStore((s) => s.players);
  const identity = usePlayerStore((s) => s.identity);

  if (!gameState || !identity) return null;
  const me = players.find((p) => p.id === identity.id);
  if (!me) return null;

  const isMyTurn = gameState.activeSeat === me.seat;
  const { left, right } = gameState.boardEnds;
  const canPlay = left >= 0 && right >= 0;

  return (
    <div className="flex justify-center gap-1 p-4 bg-wood/40 rounded-xl">
      {myHand.map((tileId) => {
        const playable = isMyTurn && canPlay && canPlayTile(tileId, left, right);
        const state: "playable" | "disabled" | "normal" | "selected" =
          selectedTile === tileId ? "selected" : playable ? "playable" : isMyTurn ? "disabled" : "normal";
        return (
          <Tile
            key={tileId}
            tileId={tileId}
            size="hand"
            state={state}
            onClick={playable || selectedTile === tileId ? () => onTileClick(tileId) : undefined}
          />
        );
      })}
    </div>
  );
}
