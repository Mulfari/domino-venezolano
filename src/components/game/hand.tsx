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
    <div
      className="flex flex-col items-center gap-2 sm:gap-3 pb-[max(8px,env(safe-area-inset-bottom))] sm:pb-4 px-1 sm:px-2"
      role="region"
      aria-label="Tu mano"
    >
      <div className="flex items-end justify-center gap-1.5 sm:gap-2 flex-wrap">
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
                  opacity: isMyTurn && !playable && !cochina ? 0.38 : 1,
                  y: cochina ? -8 : selected ? -16 : 0,
                  scale: cochina ? 1.1 : selected ? 1.08 : 1,
                  filter:
                    isMyTurn && !playable && !cochina
                      ? "grayscale(0.7) brightness(0.5) saturate(0.2)"
                      : selected
                      ? "drop-shadow(0 8px 16px rgba(0,0,0,0.65)) drop-shadow(0 0 14px rgba(201,168,76,0.65))"
                      : "drop-shadow(0 2px 5px rgba(0,0,0,0.4))",
                }}
                whileHover={
                  playable
                    ? {
                        y: cochina ? -22 : selected ? -24 : -18,
                        scale: cochina ? 1.18 : 1.13,
                        filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.75)) drop-shadow(0 0 20px rgba(201,168,76,0.7))",
                        transition: { type: "spring", stiffness: 600, damping: 18 },
                      }
                    : undefined
                }
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 350, damping: 22, delay: i * 0.03 }}
                className="relative"
                style={{ cursor: playable ? "pointer" : "default", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {/* Cochina: strong pulsing gold aura */}
                {cochina && (
                  <>
                    <motion.div
                      className="absolute -inset-3 rounded-xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.35) 0%, transparent 70%)" }}
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-1 rounded-lg border-2 border-[#c9a84c] pointer-events-none"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded text-[9px] font-bold text-[#c9a84c] bg-[#1a1a0a]/85 whitespace-nowrap pointer-events-none border border-[#c9a84c]/50"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ¡Cochina!
                    </motion.div>
                  </>
                )}

                {/* Playable: subtle gold shimmer */}
                {playable && !cochina && (
                  <>
                    <motion.div
                      className="absolute -inset-2 rounded-xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.22) 0%, transparent 65%)" }}
                      animate={{ opacity: [0.2, 0.55, 0.2] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-0.5 rounded-lg border border-[#c9a84c]/50 pointer-events-none"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </>
                )}

                <DominoTile
                  tile={tile}
                  size="large"
                  responsive
                  clickable={isMyTurn}
                  disabled={isMyTurn && !playable}
                  selected={selected}
                  highlight={playable || cochina}
                  disableHover
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
            aria-label="Pasar turno"
            className="rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] px-6 py-2.5 text-sm font-semibold text-[#2a1a0a] transition-colors"
          >
            Pasar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
