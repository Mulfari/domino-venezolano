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
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);

  const isMyTurn = isMyTurnFn();
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

  /**
   * Build oriented tile chains for rendering.
   * Walk through plays and determine correct tile orientation based on connectivity.
   */
  function buildOrientedChains(): { leftChain: Tile[]; rightChain: Tile[] } {
    if (board.plays.length === 0) return { leftChain: [], rightChain: [] };

    const leftChain: Tile[] = [];
    const rightChain: Tile[] = [];

    // First tile is always rendered as-is in the right chain
    const firstPlay = board.plays[0];
    rightChain.push(firstPlay.tile);

    // Track the running endpoints as we add tiles
    let runningLeft = firstPlay.tile[0];
    let runningRight = firstPlay.tile[1];

    // Process remaining plays in order
    for (let i = 1; i < board.plays.length; i++) {
      const play = board.plays[i];
      const { tile, end } = play;

      if (end === "right") {
        // Connecting to the right end: one pip must match runningRight
        // Orient so the matching pip is on the left (index 0) of the rendered tile
        if (tile[0] === runningRight) {
          rightChain.push(tile);
          runningRight = tile[1];
        } else {
          rightChain.push([tile[1], tile[0]]);
          runningRight = tile[0];
        }
      } else {
        // Connecting to the left end: one pip must match runningLeft
        // Orient so the matching pip is on the right (index 1) of the rendered tile
        if (tile[1] === runningLeft) {
          leftChain.unshift(tile);
          runningLeft = tile[0];
        } else {
          leftChain.unshift([tile[1], tile[0]]);
          runningLeft = tile[1];
        }
      }
    }

    return { leftChain, rightChain };
  }

  const { leftChain, rightChain } = buildOrientedChains();

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
          {/* Left-end tiles (rendered left-to-right) */}
          <AnimatePresence mode="popLayout">
            {leftChain.map((tile, i) => (
              <motion.div
                key={`left-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <DominoTile
                  tile={tile}
                  size="medium"
                  rotation={getTileRotation(board.plays[0], i, board.plays.length)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Right-end tiles (rendered left-to-right) */}
          <AnimatePresence mode="popLayout">
            {rightChain.map((tile, i) => (
              <motion.div
                key={`right-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <DominoTile
                  tile={tile}
                  size="medium"
                  rotation={getTileRotation(board.plays[0], leftChain.length + i, board.plays.length)}
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
