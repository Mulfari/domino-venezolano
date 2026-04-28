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
  const lastPlayIndex = board.plays.length - 1;

  function getTileRotation(_play: PlayedTile, index: number, total: number): number {
    if (total <= 8) return 0;
    if (index >= 6 && index < 8) return 90;
    if (index >= 8 && index < 14) return 0;
    if (index >= 14 && index < 16) return 90;
    return 0;
  }

  function buildOrientedChains(): { leftChain: Tile[]; rightChain: Tile[]; lastSide: "left" | "right" | null } {
    if (board.plays.length === 0) return { leftChain: [], rightChain: [], lastSide: null };

    const leftChain: Tile[] = [];
    const rightChain: Tile[] = [];

    const firstPlay = board.plays[0];
    rightChain.push(firstPlay.tile);

    let runningLeft = firstPlay.tile[0];
    let runningRight = firstPlay.tile[1];
    let lastSide: "left" | "right" = "right";

    for (let i = 1; i < board.plays.length; i++) {
      const play = board.plays[i];
      const { tile, end } = play;

      if (end === "right") {
        if (tile[0] === runningRight) {
          rightChain.push(tile);
          runningRight = tile[1];
        } else {
          rightChain.push([tile[1], tile[0]]);
          runningRight = tile[0];
        }
        lastSide = "right";
      } else {
        if (tile[1] === runningLeft) {
          leftChain.unshift(tile);
          runningLeft = tile[0];
        } else {
          leftChain.unshift([tile[1], tile[0]]);
          runningLeft = tile[1];
        }
        lastSide = "left";
      }
    }

    return { leftChain, rightChain, lastSide };
  }

  const { leftChain, rightChain, lastSide } = buildOrientedChains();

  const lastLeftIndex = lastSide === "left" ? 0 : -1;
  const lastRightIndex = lastSide === "right" ? rightChain.length - 1 : -1;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-h-0">
      <div className="relative w-full max-w-2xl mx-auto px-2 sm:px-4">
        <div className="absolute inset-0 -m-4 sm:-m-8 rounded-3xl bg-[#1e5c3a]/30 border border-[#c9a84c]/10" />

        {board.left !== null && board.right !== null && (
          <div className="relative flex items-center justify-between mb-3 px-2">
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

        <div className="relative flex items-center justify-center flex-wrap gap-0.5 min-h-[60px] py-4">
          <AnimatePresence mode="popLayout">
            {leftChain.map((tile, i) => (
              <motion.div
                key={`left-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  boxShadow: i === lastLeftIndex ? "0 0 12px rgba(16,185,129,0.5)" : "none",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={i === lastLeftIndex ? "rounded ring-1 ring-[#c9a84c]/60" : ""}
              >
                <DominoTile
                  tile={tile}
                  size="medium"
                  responsive
                  rotation={getTileRotation(board.plays[0], i, board.plays.length)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {rightChain.map((tile, i) => (
              <motion.div
                key={`right-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  boxShadow: i === lastRightIndex ? "0 0 12px rgba(16,185,129,0.5)" : "none",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={i === lastRightIndex ? "rounded ring-1 ring-[#c9a84c]/60" : ""}
              >
                <DominoTile
                  tile={tile}
                  size="medium"
                  responsive
                  rotation={getTileRotation(board.plays[0], leftChain.length + i, board.plays.length)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {board.plays.length === 0 && (
            <p className="text-[#a8c4a0]/50 text-sm">Mesa vacía</p>
          )}
        </div>

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
