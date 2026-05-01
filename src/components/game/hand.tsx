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

const TEAM_COLORS = {
  0: { name: "#c9a84c", badgeBg: "#2a1a08", badgeBorder: "rgba(201,168,76,0.45)", glow: "rgba(201,168,76,0.3)" },
  1: { name: "#4ca8c9", badgeBg: "#081a2a", badgeBorder: "rgba(76,168,201,0.45)", glow: "rgba(76,168,201,0.3)" },
} as const;

export function Hand({ onPlayTile, onPass, disabled = false }: HandProps) {
  const mySeat = useGameStore((s) => s.mySeat);
  const hands = useGameStore((s) => s.hands);
  const players = useGameStore((s) => s.players);
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

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : 0;
  const myName = players.find((p) => p.seat === mySeat)?.displayName ?? "Tú";
  const teamColors = TEAM_COLORS[myTeam];

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

  // A tile is selected and needs the player to pick an end on the board
  const awaitingEndChoice = selectedTile !== null && board.plays.length > 0 && board.left !== board.right;

  return (
    <div
      className="flex flex-col items-center gap-2 sm:gap-3 pb-[max(8px,env(safe-area-inset-bottom))] sm:pb-4 px-1 sm:px-2"
      role="region"
      aria-label="Tu mano"
    >
      {/* Player identity badge */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: teamColors.name }}
          aria-hidden="true"
        />
        <span
          className="text-[10px] sm:text-[11px] font-semibold truncate max-w-[100px] leading-none"
          style={{ color: teamColors.name }}
        >
          {myName}
        </span>
        <span
          className="text-[8px] uppercase tracking-widest leading-none px-1 py-0.5 rounded"
          style={{
            color: teamColors.name,
            backgroundColor: teamColors.badgeBg,
            border: `1px solid ${teamColors.badgeBorder}`,
          }}
        >
          tú
        </span>
      </div>

      {/* "Choose an end" hint — shown when a tile is selected and needs end selection */}
      <AnimatePresence>
        {awaitingEndChoice && (
          <motion.div
            key="choose-end-hint"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="flex items-center gap-2 rounded-full px-4 py-2 pointer-events-none"
            role="status"
            aria-live="polite"
            style={{
              background: "linear-gradient(135deg, rgba(42,26,8,0.97) 0%, rgba(26,14,0,0.97) 100%)",
              border: "1.5px solid rgba(201,168,76,0.6)",
              boxShadow: "0 0 20px rgba(201,168,76,0.25), 0 4px 16px rgba(0,0,0,0.6)",
            }}
          >
            {/* Up arrow */}
            <motion.svg
              width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M7 2L12 9H2L7 2Z" fill="#c9a84c" />
            </motion.svg>
            <span className="text-[12px] sm:text-[13px] font-bold text-[#c9a84c] tracking-wide leading-none">
              Elige un extremo en el tablero
            </span>
            {/* Tap to deselect hint */}
            <span className="text-[9px] text-[#c9a84c]/45 uppercase tracking-widest leading-none hidden sm:inline">
              · toca la ficha para cancelar
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
            initial={{ opacity: 0, scale: 0.75, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 6 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            whileTap={{ scale: 0.93 }}
            onClick={onPass}
            aria-label="Pasar turno — sin jugadas disponibles"
            className="relative flex items-center gap-2.5 rounded-2xl min-h-[44px] px-5 py-2.5 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3a2210 0%, #2a1808 100%)",
              border: "1.5px solid rgba(201,168,76,0.55)",
              boxShadow: "0 0 18px rgba(201,168,76,0.18), 0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(201,168,76,0.12)",
            }}
          >
            {/* Pulsing ring */}
            <motion.span
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: "1.5px solid rgba(201,168,76,0.6)" }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Skip icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
              <circle cx="9" cy="9" r="7.5" stroke="#c9a84c" strokeWidth="1.5" />
              <line x1="5.5" y1="5.5" x2="12.5" y2="12.5" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12.5" y1="5.5" x2="5.5" y2="12.5" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
            </svg>

            {/* Label */}
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-bold text-[#c9a84c] tracking-wide leading-none">
                Pasar
              </span>
              <span className="text-[9px] text-[#c9a84c]/55 uppercase tracking-widest leading-none mt-0.5">
                sin jugadas
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
