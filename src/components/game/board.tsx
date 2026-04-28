"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import type { Tile, PlayedTile } from "@/lib/game/types";

interface BoardProps {
  onPlaceEnd?: (end: "left" | "right") => void;
}

export function Board({ onPlaceEnd }: BoardProps) {
  const board = useGameStore((s) => s.board);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const isMyTurn = useGameStore((s) => s.isMyTurn());

  const showPlacementOptions = selectedTile !== null && isMyTurn;

  /** Determine rotation for a played tile based on its position in the chain. */
  function getTileRotation(play: PlayedTile, index: number, total: number): number {
    // Tiles at the turning points rotate 90 degrees
    // Simple layout: horizontal chain, turn down after ~6 tiles, then back
    if (total <= 8) return 0;
    if (index >= 6 && index < 8) return 90;
    if (index >= 8 && index < 14) return 0;
    if (index >= 14 && index < 16) return 90;
    return 0;
  }

  /** Orient the tile so the matching pip faces the chain. */
  function orientTile(play: PlayedTile, index: number): Tile {
    const { tile, end } = play;
    if (index === 0) return tile;

    if (end === "right") {
      // The matching pip should be on the left side (facing the chain)
      const prevRight = index > 0 ? getChainRight(index - 1) : null;
      if (prevRight !== null && tile[0] !== prevRight) {
        return [tile[1], tile[0]];
      }
      return tile;
    } else {
      // Left end — matching pip on the right side
      return tile;
    }
  }

  function getChainRight(index: number): number | null {
    if (index < 0 || index >= board.plays.length) return null;
    const play = board.plays[index];
    return play.tile[1];
  }

  // Split plays into left-end plays and right-end plays for rendering
  const leftPlays: PlayedTile[] = [];
  const rightPlays: PlayedTile[] = [];

  board.plays.forEach((play, i) => {
    if (i === 0) {
      rightPlays.push(play);
    } else if (play.end === "left") {
      leftPlays.unshift(play); // prepend so they render left-to-right
    } else {
      rightPlays.push(play);
    }
  });

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-h-0">
      {/* Board surface */}
      <div className="relative w-full max-w-2xl mx-auto px-4">
        {/* Felt texture background */}
        <div className="absolute inset-0 -m-8 rounded-3xl bg-emerald-950/30 border border-emerald-900/20" />

        {/* End values display */}
        {board.left !== null && board.right !== null && (
          <div className="relative flex items-center justify-between mb-3 px-2">
            <span className="text-xs text-slate-500 font-mono">
              ← {board.left}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {board.right} →
            </span>
          </div>
        )}

        {/* Tile chain */}
        <div className="relative flex items-center justify-center flex-wrap gap-0.5 min-h-[60px] py-4">
          {/* Left-end plays (reversed order) */}
          <AnimatePresence mode="popLayout">
            {leftPlays.map((play, i) => (
              <motion.div
                key={`left-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <DominoTile
                  tile={orientTile(play, i)}
                  size="medium"
                  rotation={getTileRotation(play, i, board.plays.length)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Right-end plays */}
          <AnimatePresence mode="popLayout">
            {rightPlays.map((play, i) => (
              <motion.div
                key={`right-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <DominoTile
                  tile={orientTile(play, leftPlays.length + i)}
                  size="medium"
                  rotation={getTileRotation(play, leftPlays.length + i, board.plays.length)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty board message */}
          {board.plays.length === 0 && (
            <p className="text-slate-600 text-sm">Mesa vacía</p>
          )}
        </div>

        {/* Placement options when a tile is selected */}
        <AnimatePresence>
          {showPlacementOptions && board.left !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative flex items-center justify-center gap-4 mt-3"
            >
              <button
                onClick={() => onPlaceEnd?.("left")}
                className="flex items-center gap-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/30 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                ← Izquierda ({board.left})
              </button>
              <button
                onClick={() => onPlaceEnd?.("right")}
                className="flex items-center gap-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/30 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Derecha ({board.right}) →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
