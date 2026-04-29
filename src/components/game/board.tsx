"use client";

import { useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMyTurn = isMyTurnFn();
  const showPlacementOptions = selectedTile !== null && isMyTurn;

  function buildOrientedChains(): { leftChain: { tile: Tile; isDouble: boolean; key: string }[]; rightChain: { tile: Tile; isDouble: boolean; key: string }[] } {
    if (board.plays.length === 0) return { leftChain: [], rightChain: [] };

    const leftChain: { tile: Tile; isDouble: boolean; key: string }[] = [];
    const rightChain: { tile: Tile; isDouble: boolean; key: string }[] = [];

    const firstPlay = board.plays[0];
    const isFirstDouble = firstPlay.tile[0] === firstPlay.tile[1];
    rightChain.push({ tile: firstPlay.tile, isDouble: isFirstDouble, key: `p0-${firstPlay.tile[0]}-${firstPlay.tile[1]}` });

    let runningLeft = firstPlay.tile[0];
    let runningRight = firstPlay.tile[1];

    for (let i = 1; i < board.plays.length; i++) {
      const play = board.plays[i];
      const { tile, end } = play;
      const isDouble = tile[0] === tile[1];
      const key = `p${i}-${tile[0]}-${tile[1]}`;

      if (end === "right") {
        if (tile[0] === runningRight) {
          rightChain.push({ tile, isDouble, key });
          runningRight = tile[1];
        } else {
          rightChain.push({ tile: [tile[1], tile[0]], isDouble, key });
          runningRight = tile[0];
        }
      } else {
        if (tile[1] === runningLeft) {
          leftChain.unshift({ tile, isDouble, key });
          runningLeft = tile[0];
        } else {
          leftChain.unshift({ tile: [tile[1], tile[0]], isDouble, key });
          runningLeft = tile[1];
        }
      }
    }

    return { leftChain, rightChain };
  }

  const { leftChain, rightChain } = buildOrientedChains();
  const allTiles = [...leftChain, ...rightChain];
  const lastIndex = allTiles.length - 1;

  useEffect(() => {
    if (scrollRef.current && allTiles.length > 0) {
      const el = scrollRef.current;
      el.scrollTo({ left: (el.scrollWidth - el.clientWidth) / 2, behavior: "smooth" });
    }
  }, [allTiles.length]);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-h-0">
      <div className="relative w-full max-w-3xl mx-auto px-2 sm:px-4">
        <div className="absolute inset-0 -m-4 sm:-m-8 rounded-3xl bg-[#1e5c3a]/30 border border-[#c9a84c]/10" />

        {board.left !== null && board.right !== null && (
          <div className="relative flex items-center justify-between mb-1 px-2">
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}>
              ← {board.left}
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}>
              {board.right} →
            </span>
          </div>
        )}

        {/* Tile chain */}
        <div ref={scrollRef} className="relative min-h-[70px] sm:min-h-[80px] py-2 sm:py-3 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex items-center justify-center gap-[2px] sm:gap-[3px] min-w-min px-2">
            {allTiles.map((entry, i) => {
              const isLast = i === lastIndex;
              return (
                <motion.div
                  key={entry.key}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`flex-shrink-0 flex items-center justify-center ${isLast ? "ring-2 ring-[#c9a84c]/50 rounded" : ""}`}
                >
                  <DominoTile
                    tile={entry.tile}
                    size="medium"
                    responsive
                    orientation={entry.isDouble ? "vertical" : "horizontal"}
                  />
                </motion.div>
              );
            })}

            {board.plays.length === 0 && (
              <p className="text-[#a8c4a0]/50 text-sm">Mesa vacía</p>
            )}
          </div>
        </div>

        {/* Placement buttons */}
        <AnimatePresence>
          {showPlacementOptions && board.left !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="relative flex items-center justify-center gap-3 sm:gap-6 mt-1 sm:mt-2 pb-1"
            >
              <button
                onClick={() => onPlaceEnd?.("left")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3a2210] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#5c3a1e] active:scale-95 border-2 border-[#c9a84c]/40 px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold text-[#c9a84c] transition-all shadow-lg shadow-[#c9a84c]/10"
              >
                <span className="text-lg">←</span>
                Izquierda ({board.left})
              </button>
              <button
                onClick={() => onPlaceEnd?.("right")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3a2210] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#5c3a1e] active:scale-95 border-2 border-[#c9a84c]/40 px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold text-[#c9a84c] transition-all shadow-lg shadow-[#c9a84c]/10"
              >
                Derecha ({board.right})
                <span className="text-lg">→</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
