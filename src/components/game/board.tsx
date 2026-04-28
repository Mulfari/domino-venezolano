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

  function buildOrientedChains(): { leftChain: { tile: Tile; isDouble: boolean }[]; rightChain: { tile: Tile; isDouble: boolean }[] } {
    if (board.plays.length === 0) return { leftChain: [], rightChain: [] };

    const leftChain: { tile: Tile; isDouble: boolean }[] = [];
    const rightChain: { tile: Tile; isDouble: boolean }[] = [];

    const firstPlay = board.plays[0];
    const isFirstDouble = firstPlay.tile[0] === firstPlay.tile[1];
    rightChain.push({ tile: firstPlay.tile, isDouble: isFirstDouble });

    let runningLeft = firstPlay.tile[0];
    let runningRight = firstPlay.tile[1];

    for (let i = 1; i < board.plays.length; i++) {
      const play = board.plays[i];
      const { tile, end } = play;
      const isDouble = tile[0] === tile[1];

      if (end === "right") {
        if (tile[0] === runningRight) {
          rightChain.push({ tile, isDouble });
          runningRight = tile[1];
        } else {
          rightChain.push({ tile: [tile[1], tile[0]], isDouble });
          runningRight = tile[0];
        }
      } else {
        if (tile[1] === runningLeft) {
          leftChain.unshift({ tile, isDouble });
          runningLeft = tile[0];
        } else {
          leftChain.unshift({ tile: [tile[1], tile[0]], isDouble });
          runningLeft = tile[1];
        }
      }
    }

    return { leftChain, rightChain };
  }

  const { leftChain, rightChain } = buildOrientedChains();
  const allTiles = [...leftChain, ...rightChain];
  const lastIndex = allTiles.length - 1;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-h-0">
      <div className="relative w-full max-w-2xl mx-auto px-2 sm:px-4">
        <div className="absolute inset-0 -m-4 sm:-m-8 rounded-3xl bg-[#1e5c3a]/30 border border-[#c9a84c]/10" />

        {board.left !== null && board.right !== null && (
          <div className="relative flex items-center justify-between mb-2 px-2">
            <motion.span
              animate={isMyTurn ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`text-xs font-mono px-2 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}
            >
              ← {board.left}
            </motion.span>
            <motion.span
              animate={isMyTurn ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
              className={`text-xs font-mono px-2 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}
            >
              {board.right} →
            </motion.span>
          </div>
        )}

        {/* Tile chain */}
        <div className="relative flex items-center justify-center flex-wrap gap-[2px] min-h-[70px] py-4 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {allTiles.map((entry, i) => {
              const isLast = i === lastIndex;
              return (
                <motion.div
                  key={`tile-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex items-center justify-center ${isLast ? "ring-1 ring-[#c9a84c]/60 rounded" : ""}`}
                >
                  <DominoTile
                    tile={entry.tile}
                    size="small"
                    responsive
                    orientation={entry.isDouble ? "vertical" : "horizontal"}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {board.plays.length === 0 && (
            <p className="text-[#a8c4a0]/50 text-sm">Mesa vacía</p>
          )}
        </div>

        {/* Placement buttons */}
        <AnimatePresence>
          {showPlacementOptions && board.left !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative flex items-center justify-center gap-2 sm:gap-4 mt-2 sm:mt-3"
            >
              <button
                onClick={() => onPlaceEnd?.("left")}
                className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[#3a2210]/80 hover:bg-[#4a2c0f] active:bg-[#5c3a1e] border border-[#c9a84c]/30 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#f5f0e8] transition-colors"
              >
                ← Izq ({board.left})
              </button>
              <button
                onClick={() => onPlaceEnd?.("right")}
                className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[#3a2210]/80 hover:bg-[#4a2c0f] active:bg-[#5c3a1e] border border-[#c9a84c]/30 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-[#f5f0e8] transition-colors"
              >
                Der ({board.right}) →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
