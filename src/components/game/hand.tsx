"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import type { Tile } from "@/lib/game/types";

interface HandProps {
  onPlayTile?: (tile: Tile, end: "left" | "right") => void;
  onPass?: () => void;
  disabled?: boolean;
}

export function Hand({ onPlayTile, onPass, disabled = false }: HandProps) {
  const mySeat = useGameStore((s) => s.mySeat);
  const hands = useGameStore((s) => s.hands);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const validMovesFn = useGameStore((s) => s.validMoves);
  const canPassFn = useGameStore((s) => s.canPass);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const selectTile = useGameStore((s) => s.selectTile);
  const board = useGameStore((s) => s.board);
  const round = useGameStore((s) => s.round);

  const myHand = mySeat !== null ? hands[mySeat] : [];
  const isMyTurn = isMyTurnFn();
  const validMoves = validMovesFn();
  const canPass = canPassFn();
  const isFirstPlay = round === 1 && board.plays.length === 0;

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

  function isCochina(tile: Tile): boolean {
    return isFirstPlay && tile[0] === 6 && tile[1] === 6;
  }

  function handleTileClick(tile: Tile) {
    if (disabled || !isMyTurn || !isTilePlayable(tile)) return;

    if (isTileSelected(tile)) {
      selectTile(null);
      return;
    }

    const ends = getEndsForTile(tile);

    if (ends.length === 1 || board.left === null || board.left === board.right) {
      onPlayTile?.(tile, ends[0]);
      return;
    }

    selectTile(tile);
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 pb-2 sm:pb-4 px-1 sm:px-2">
      <div className="flex items-end justify-center gap-0.5 sm:gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {myHand.map((tile, i) => {
            const playable = isMyTurn && isTilePlayable(tile);
            const selected = isTileSelected(tile);
            const cochina = isCochina(tile);

            return (
              <motion.div
                key={`${tile[0]}-${tile[1]}-${i}`}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: cochina ? -6 : 0,
                  scale: cochina ? 1.1 : 1,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 }}
                className={cochina ? "relative" : ""}
              >
                {cochina && isMyTurn && (
                  <motion.div
                    className="absolute -inset-1 rounded-lg bg-[#c9a84c]/30 blur-sm"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <DominoTile
                  tile={tile}
                  size="large"
                  responsive
                  clickable={isMyTurn}
                  disabled={isMyTurn && !playable}
                  selected={selected}
                  highlight={playable || cochina}
                  onClick={() => handleTileClick(tile)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isMyTurn && canPass && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onPass}
            className="rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] px-6 py-2.5 text-sm font-semibold text-[#2a1a0a] transition-colors"
          >
            Pasar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
