"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import type { Tile } from "@/lib/game/types";

interface HandProps {
  onPlayTile?: (tile: Tile, end: "left" | "right") => void;
  onPass?: () => void;
}

export function Hand({ onPlayTile, onPass }: HandProps) {
  const mySeat = useGameStore((s) => s.mySeat);
  const hands = useGameStore((s) => s.hands);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const validMovesFn = useGameStore((s) => s.validMoves);
  const canPassFn = useGameStore((s) => s.canPass);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const selectTile = useGameStore((s) => s.selectTile);
  const board = useGameStore((s) => s.board);

  const myHand = mySeat !== null ? hands[mySeat] : [];
  const isMyTurn = isMyTurnFn();
  const validMoves = validMovesFn();
  const canPass = canPassFn();

  function isTilePlayable(tile: Tile): boolean {
    return validMoves.some(
      (m) =>
        (m.tile[0] === tile[0] && m.tile[1] === tile[1]) ||
        (m.tile[0] === tile[1] && m.tile[1] === tile[0])
    );
  }

  function isTileSelected(tile: Tile): boolean {
    if (!selectedTile) return false;
    return (
      (selectedTile[0] === tile[0] && selectedTile[1] === tile[1]) ||
      (selectedTile[0] === tile[1] && selectedTile[1] === tile[0])
    );
  }

  function getEndsForTile(tile: Tile): ("left" | "right")[] {
    return validMoves
      .filter(
        (m) =>
          (m.tile[0] === tile[0] && m.tile[1] === tile[1]) ||
          (m.tile[0] === tile[1] && m.tile[1] === tile[0])
      )
      .map((m) => m.end);
  }

  function handleTileClick(tile: Tile) {
    if (!isMyTurn || !isTilePlayable(tile)) return;

    if (isTileSelected(tile)) {
      // Deselect
      selectTile(null);
      return;
    }

    const ends = getEndsForTile(tile);

    // If only one end possible, or board is empty, play directly
    if (ends.length === 1 || board.left === null) {
      onPlayTile?.(tile, ends[0]);
      return;
    }

    // Multiple ends — select tile and let board show placement options
    selectTile(tile);
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-4 px-2">
      {/* Tiles row */}
      <div className="flex items-end justify-center gap-1.5 sm:gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {myHand.map((tile, i) => {
            const playable = isMyTurn && isTilePlayable(tile);
            const selected = isTileSelected(tile);

            return (
              <motion.div
                key={`${tile[0]}-${tile[1]}-${i}`}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
              >
                <DominoTile
                  tile={tile}
                  size="large"
                  clickable={isMyTurn}
                  disabled={isMyTurn && !playable}
                  selected={selected}
                  highlight={playable}
                  onClick={() => handleTileClick(tile)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pass button */}
      <AnimatePresence>
        {isMyTurn && canPass && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onPass}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Pasar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
