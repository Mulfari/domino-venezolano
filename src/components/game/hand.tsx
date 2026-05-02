"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);

  const myHand = mySeat !== null ? hands[mySeat] : [];
  const isMyTurn = isMyTurnFn();
  const validMoves = validMovesFn();
  const canPass = canPassFn();
  const isFirstPlay = round === 1 && board.plays.length === 0;

  // Track dealing animation: fires once when a new round starts and hand is populated
  const prevRoundRef = useRef(round);
  const [isDealing, setIsDealing] = useState(false);
  const dealingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select the only valid tile when there's exactly one move available
  const prevIsMyTurnRef = useRef(false);
  const [soloJugadaHint, setSoloJugadaHint] = useState(false);
  const soloJugadaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSelectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const justBecameMyTurn = isMyTurn && !prevIsMyTurnRef.current;
    prevIsMyTurnRef.current = isMyTurn;

    if (!isMyTurn) return;
    if (!justBecameMyTurn || selectedTile !== null) return;

    if (validMoves.length !== 1) return;

    if (autoSelectTimerRef.current) clearTimeout(autoSelectTimerRef.current);
    autoSelectTimerRef.current = setTimeout(() => {
      const state = useGameStore.getState();
      if (!state.isMyTurn()) return;
      const moves = state.validMoves();
      if (moves.length !== 1) return;
      selectTile(moves[0].tile);
      setSoloJugadaHint(true);
      if (soloJugadaTimerRef.current) clearTimeout(soloJugadaTimerRef.current);
      soloJugadaTimerRef.current = setTimeout(() => setSoloJugadaHint(false), 2200);
    }, 450);

    return () => {
      if (autoSelectTimerRef.current) clearTimeout(autoSelectTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, validMoves.length, canPass]);

  useEffect(() => {
    if (round !== prevRoundRef.current && myHand.length > 0) {
      prevRoundRef.current = round;
      setIsDealing(true);
      if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current);
      // Keep dealing state active long enough for all tiles to animate in
      dealingTimerRef.current = setTimeout(() => setIsDealing(false), myHand.length * 110 + 400);
    }
    return () => {
      if (dealingTimerRef.current) clearTimeout(dealingTimerRef.current);
    };
  }, [round, myHand.length]);

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : 0;
  const myName = players.find((p) => p.seat === mySeat)?.displayName ?? "Tú";
  const teamColors = TEAM_COLORS[myTeam];
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  const [hintTile, setHintTile] = useState<Tile | null>(null);
  const [hintEnd, setHintEnd] = useState<"left" | "right" | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rejectedTile, setRejectedTile] = useState<Tile | null>(null);
  const rejectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortByPips, setSortByPips] = useState(false);
  const displayHand = sortByPips
    ? [...myHand].sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]))
    : myHand;

  // Close shortcuts popover when clicking outside
  useEffect(() => {
    if (!showShortcuts) return;
    function onPointerDown(e: PointerEvent) {
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) {
        setShowShortcuts(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showShortcuts]);

  const totalPips = myHand.reduce((sum, [a, b]) => sum + a + b, 0);
  // trancado is imminent when 2+ consecutive passes have happened
  const trancadoImminent = consecutivePasses >= 2 && myHand.length > 0;

  // Clear hint and rejection state when turn changes or tile is played
  useEffect(() => {
    setHintTile(null);
    setHintEnd(null);
    setRejectedTile(null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (rejectedTimerRef.current) clearTimeout(rejectedTimerRef.current);
  }, [isMyTurn, myHand.length]);

  function handleHint() {
    if (!isMyTurn || validMoves.length < 2) return;
    // Pick the move with the highest pip sum (best to shed)
    const bestMove = validMoves.reduce<{ tile: Tile; end: "left" | "right" } | null>((acc, m) => {
      if (!acc) return m;
      return m.tile[0] + m.tile[1] > acc.tile[0] + acc.tile[1] ? m : acc;
    }, null);
    setHintTile(bestMove?.tile ?? null);
    setHintEnd(bestMove?.end ?? null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => { setHintTile(null); setHintEnd(null); }, 3500);
  }

  function isHintTile(tile: Tile): boolean {
    if (!hintTile) return false;
    return (
      (hintTile[0] === tile[0] && hintTile[1] === tile[1]) ||
      (hintTile[0] === tile[1] && hintTile[1] === tile[0])
    );
  }

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

  function isCapicuaTile(tile: Tile): boolean {
    if (!isMyTurn || !isTilePlayable(tile)) return false;
    if (board.left === null || board.right === null || board.plays.length === 0) return false;
    const L = board.left;
    const R = board.right;
    const [a, b] = tile;
    if (L === R) {
      // Both ends already equal — only a matching double keeps capicúa
      return a === L && b === L;
    }
    return (a === L && b === R) || (b === L && a === R);
  }

  // Must be declared before the keyboard useEffect so it's not in the TDZ when the dep array is evaluated
  const awaitingEndChoice = selectedTile !== null && board.plays.length > 0 && board.left !== board.right;

  // Keyboard shortcuts: 1-7 select tiles, Escape deselects, P passes,
  // ArrowLeft/ArrowRight pick an end when awaiting end choice.
  useEffect(() => {
    if (!isMyTurn || disabled) return;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore when focus is inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const key = e.key;

      if (key === "Escape") {
        e.preventDefault();
        selectTile(null);
        return;
      }

      if ((key === "p" || key === "P") && canPass) {
        e.preventDefault();
        onPass?.();
        return;
      }

      if ((key === "h" || key === "H") && validMoves.length >= 2) {
        e.preventDefault();
        handleHint();
        return;
      }

      if (awaitingEndChoice && selectedTile) {
        if (key === "ArrowLeft") {
          const ends = getEndsForTile(selectedTile);
          if (ends.includes("left")) {
            e.preventDefault();
            onPlayTile?.(selectedTile, "left");
            selectTile(null);
          }
          return;
        }
        if (key === "ArrowRight") {
          const ends = getEndsForTile(selectedTile);
          if (ends.includes("right")) {
            e.preventDefault();
            onPlayTile?.(selectedTile, "right");
            selectTile(null);
          }
          return;
        }
      }

      const num = parseInt(key, 10);
      if (num >= 1 && num <= 7) {
        const tile = displayHand[num - 1];
        if (tile && isTilePlayable(tile)) {
          e.preventDefault();
          handleTileClick(tile);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, disabled, canPass, awaitingEndChoice, selectedTile, displayHand]);

  // S key toggles sort — works regardless of turn
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "s" || e.key === "S") && myHand.length >= 2) {
        e.preventDefault();
        setSortByPips((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [myHand.length]);

  function handleRejectedClick(tile: Tile) {
    if (rejectedTimerRef.current) clearTimeout(rejectedTimerRef.current);
    setRejectedTile(tile);
    rejectedTimerRef.current = setTimeout(() => setRejectedTile(null), 500);
  }

  function isTileRejected(tile: Tile): boolean {
    if (!rejectedTile) return false;
    return (
      (rejectedTile[0] === tile[0] && rejectedTile[1] === tile[1]) ||
      (rejectedTile[0] === tile[1] && rejectedTile[1] === tile[0])
    );
  }

  function handleTileClick(tile: Tile) {
    if (disabled) return;
    if (!isMyTurn || !isTilePlayable(tile)) {
      if (isMyTurn && !isTilePlayable(tile)) handleRejectedClick(tile);
      return;
    }

    if (isTileSelected(tile)) {
      selectTile(null);
      return;
    }

    const ends = getEndsForTile(tile);

    if (ends.length === 1 || board.left === null || board.left === board.right) {
      onPlayTile?.(tile, ends[0]);
      return;
    }

    // If this is the hint tile and we already know the best end, auto-play there
    if (isHintTile(tile) && hintEnd && ends.includes(hintEnd)) {
      onPlayTile?.(tile, hintEnd);
      setHintTile(null);
      setHintEnd(null);
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
      {/* ¡Solo una jugada! hint — auto-selected tile */}
      <AnimatePresence>
        {soloJugadaHint && (
          <motion.div
            key="solo-jugada"
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, #1a2a10 0%, #0e1a08 100%)",
              border: "1px solid rgba(168,196,160,0.45)",
              boxShadow: "0 0 12px rgba(168,196,160,0.2), 0 2px 8px rgba(0,0,0,0.5)",
            }}
            role="status"
            aria-live="polite"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="rgba(168,196,160,0.7)" strokeWidth="1.2"/>
              <circle cx="6" cy="6" r="2" fill="rgba(168,196,160,0.8)"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest leading-none" style={{ color: "rgba(168,196,160,0.85)" }}>
              ¡Solo una jugada!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pass button — prominent tap target when no valid moves exist */}
      <AnimatePresence>
        {isMyTurn && canPass && validMoves.length === 0 && (
          <motion.button
            key="pass-btn"
            initial={{ opacity: 0, scale: 0.82, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            whileTap={{ scale: 0.93 }}
            onClick={onPass}
            disabled={disabled}
            aria-label="Pasar turno — no hay jugadas disponibles"
            className="relative flex items-center gap-2.5 rounded-2xl min-h-[48px] px-6 py-3 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3a2210 0%, #2a1808 100%)",
              border: "1.5px solid rgba(201,168,76,0.65)",
              boxShadow: "0 0 20px rgba(201,168,76,0.22), 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.14)",
            }}
          >
            {/* Pulsing ring */}
            <motion.span
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: "1.5px solid rgba(201,168,76,0.45)" }}
              animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.025, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Arrow icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[14px] font-black text-[#c9a84c] uppercase tracking-widest leading-none">
                Pasar Turno
              </span>
              <span className="text-[9px] text-[#c9a84c]/50 uppercase tracking-widest leading-none mt-0.5">
                sin jugadas disponibles
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Player identity badge + pip count */}
      <div className="flex items-center gap-2">
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

        {/* Pip count badge — always visible, escalates when trancado is imminent */}
        <AnimatePresence mode="wait">
          {myHand.length > 0 && (
            <motion.div
              key={`pips-${trancadoImminent}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: trancadoImminent
                  ? "linear-gradient(135deg, #3a1a08 0%, #2a1000 100%)"
                  : "rgba(0,0,0,0.25)",
                border: trancadoImminent
                  ? "1px solid rgba(220,80,40,0.65)"
                  : "1px solid rgba(245,240,232,0.12)",
                boxShadow: trancadoImminent
                  ? "0 0 10px rgba(220,80,40,0.3)"
                  : "none",
              }}
              aria-label={`Total de puntos en mano: ${totalPips}`}
            >
              {/* Domino pip icon */}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="9" height="9" rx="2" fill="none"
                  stroke={trancadoImminent ? "rgba(220,80,40,0.8)" : "rgba(245,240,232,0.3)"}
                  strokeWidth="1"
                />
                <circle cx="5" cy="5" r="1.8"
                  fill={trancadoImminent ? "rgba(220,80,40,0.9)" : "rgba(245,240,232,0.4)"}
                />
              </svg>
              <motion.span
                key={totalPips}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="text-[10px] font-bold tabular-nums leading-none"
                style={{
                  color: trancadoImminent ? "rgba(220,80,40,1)" : "rgba(245,240,232,0.55)",
                }}
              >
                {totalPips}
              </motion.span>
              {trancadoImminent && (
                <motion.span
                  className="text-[8px] font-bold uppercase tracking-wider leading-none"
                  style={{ color: "rgba(220,80,40,0.85)" }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  pts
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End-selection buttons — shown when a tile is selected and both ends are valid */}
      <AnimatePresence>
        {awaitingEndChoice && selectedTile && (
          <motion.div
            key="choose-end-buttons"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="flex flex-col items-center gap-2"
            role="group"
            aria-label="Elige un extremo para colocar la ficha"
          >
            <span className="text-[10px] uppercase tracking-widest text-[#c9a84c]/60 font-semibold leading-none">
              ¿En qué extremo?
            </span>
            <div className="flex items-center gap-3">
              {(["left", "right"] as const)
                .filter((end) => getEndsForTile(selectedTile).includes(end))
                .map((end) => {
                  const pipValue = end === "left" ? board.left : board.right;
                  const label = end === "left" ? "Izquierda" : "Derecha";
                  const arrow = end === "left" ? "←" : "→";
                  return (
                    <motion.button
                      key={end}
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.06 }}
                      onClick={() => {
                        onPlayTile?.(selectedTile, end);
                        selectTile(null);
                      }}
                      aria-label={`Colocar en extremo ${label} — ${pipValue}`}
                      className="relative flex items-center gap-2 rounded-2xl min-h-[44px] px-4 py-2.5 overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #3a2210 0%, #2a1808 100%)",
                        border: "1.5px solid rgba(201,168,76,0.55)",
                        boxShadow: "0 0 14px rgba(201,168,76,0.18), 0 4px 12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(201,168,76,0.12)",
                      }}
                    >
                      {/* Pulsing ring */}
                      <motion.span
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ border: "1.5px solid rgba(201,168,76,0.5)" }}
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {end === "left" && (
                        <span className="text-[#c9a84c]/70 text-sm font-bold leading-none">{arrow}</span>
                      )}
                      {/* Pip value badge */}
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[13px] font-black text-[#c9a84c] leading-none tabular-nums">
                          {pipValue ?? 0}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-[#c9a84c]/50 leading-none mt-0.5">
                          {label}
                        </span>
                      </div>
                      {end === "right" && (
                        <span className="text-[#c9a84c]/70 text-sm font-bold leading-none">{arrow}</span>
                      )}
                    </motion.button>
                  );
                })}
            </div>
            <span className="text-[9px] text-[#c9a84c]/35 uppercase tracking-widest leading-none">
              toca la ficha para cancelar
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¡DOS! persistent label — mirrors the opponent-hand treatment */}
      <AnimatePresence>
        {myHand.length === 2 && (
          <motion.div
            key="dos-label"
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="pointer-events-none"
          >
            <motion.span
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{
                color: teamColors.name,
                textShadow: `0 0 8px ${teamColors.glow}, 0 1px 3px rgba(0,0,0,0.9)`,
              }}
              role="status"
              aria-live="polite"
              aria-label="¡Dos fichas! — quedan dos fichas en mano"
            >
              ¡DOS!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¡UNA FICHA! persistent label + glow — mirrors the opponent-hand treatment */}
      <AnimatePresence>
        {myHand.length === 1 && (
          <motion.div
            key="una-ficha-label"
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="pointer-events-none"
          >
            <motion.span
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
              className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest whitespace-nowrap"
              style={{
                color: teamColors.name,
                textShadow: `0 0 10px ${teamColors.glow}, 0 1px 3px rgba(0,0,0,0.9)`,
              }}
              role="status"
              aria-live="polite"
              aria-label="¡Una ficha! — última ficha en mano"
            >
              ¡UNA FICHA!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulsing aura behind the tile when 1 tile left */}
        {myHand.length === 1 && (
          <motion.div
            className="absolute -inset-6 rounded-2xl pointer-events-none z-0"
            style={{ background: `radial-gradient(ellipse, ${teamColors.glow} 0%, transparent 70%)` }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.08, 0.9] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
        )}
      <div className="flex items-end justify-center gap-1.5 sm:gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {displayHand.map((tile, i) => {
            const playable = isMyTurn && isTilePlayable(tile);
            const selected = isTileSelected(tile);
            const cochina = isCochina(tile);
            const isDouble = tile[0] === tile[1] && !cochina;

            // Dealing animation: tiles fly in from above with stagger, like being dealt from a deck
            const dealDelay = isDealing ? i * 0.11 : i * 0.03;
            const dealInitial = isDealing
              ? { opacity: 0, y: -80, x: (i - (myHand.length - 1) / 2) * -12, scale: 0.6, rotate: (i % 2 === 0 ? -18 : 18) }
              : { opacity: 0, y: 30, scale: 0.8 };
            const dealTransition = isDealing
              ? { type: "spring" as const, stiffness: 320, damping: 22, delay: dealDelay }
              : { type: "spring" as const, stiffness: 350, damping: 22, delay: dealDelay };

            return (
              <motion.div
                key={`${tile[0]}-${tile[1]}-${i}`}
                layout
                initial={dealInitial}
                animate={isTileRejected(tile) ? {
                  x: [0, -7, 7, -5, 5, -3, 3, 0],
                  opacity: 0.38,
                  y: 0,
                  scale: 1,
                  filter: "grayscale(0.7) brightness(0.5) saturate(0.2)",
                } : {
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
                transition={isTileRejected(tile)
                  ? { duration: 0.4, ease: "easeInOut" }
                  : dealTransition}
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

                {/* Hint: bright teal glow when this tile is the suggested play */}
                {isHintTile(tile) && playable && (
                  <>
                    <motion.div
                      className="absolute -inset-3 rounded-xl pointer-events-none z-10"
                      style={{ background: "radial-gradient(ellipse, rgba(56,220,180,0.45) 0%, transparent 65%)" }}
                      animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-0.5 rounded-lg border-2 pointer-events-none z-10"
                      style={{ borderColor: "rgba(56,220,180,0.85)" }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none z-20"
                      style={{
                        color: "rgba(56,220,180,1)",
                        backgroundColor: "rgba(4,20,14,0.88)",
                        border: "1px solid rgba(56,220,180,0.5)",
                      }}
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {hintEnd === "left" ? "← izq" : hintEnd === "right" ? "der →" : "sugerida"}
                    </motion.div>
                  </>
                )}

                {/* Playable: subtle gold shimmer */}
                {playable && !cochina && !isHintTile(tile) && (
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

                {/* Double tile badge — hidden when hint badge already occupies the same slot */}
                {isDouble && !isHintTile(tile) && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none z-10"
                    style={{
                      color: playable ? "#c9a84c" : "rgba(168,196,160,0.55)",
                      backgroundColor: "rgba(10,20,12,0.82)",
                      border: `1px solid ${playable ? "rgba(201,168,76,0.4)" : "rgba(168,196,160,0.2)"}`,
                    }}
                  >
                    doble
                  </div>
                )}

                {/* Capicúa opportunity — violet glow aura + border + badge */}
                {isCapicuaTile(tile) && (
                  <>
                    <motion.div
                      className="absolute -inset-3 rounded-xl pointer-events-none z-10"
                      style={{ background: "radial-gradient(ellipse, rgba(168,100,255,0.42) 0%, transparent 65%)" }}
                      animate={{ opacity: [0.45, 1, 0.45], scale: [0.95, 1.06, 0.95] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-0.5 rounded-lg border-2 pointer-events-none z-10"
                      style={{ borderColor: "rgba(168,100,255,0.85)" }}
                      animate={{ opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded pointer-events-none z-20"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background: "rgba(20,8,36,0.9)",
                        border: "1px solid rgba(168,100,255,0.65)",
                        boxShadow: "0 0 10px rgba(168,100,255,0.4)",
                      }}
                      aria-label="Esta ficha cierra capicúa"
                    >
                      <span
                        className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap leading-none"
                        style={{ color: "rgba(200,140,255,1)", textShadow: "0 0 8px rgba(168,100,255,0.9)" }}
                      >
                        ✦ capicúa
                      </span>
                    </motion.div>
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

                {/* Keyboard shortcut badge — desktop only */}
                {isMyTurn && i < 7 && (
                  <div
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 hidden sm:flex items-center justify-center w-4 h-4 rounded pointer-events-none z-20"
                    style={{
                      background: playable ? "rgba(201,168,76,0.18)" : "rgba(0,0,0,0.22)",
                      border: `1px solid ${playable ? "rgba(201,168,76,0.45)" : "rgba(245,240,232,0.1)"}`,
                      color: playable ? "#c9a84c" : "rgba(245,240,232,0.2)",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      </div>

      {/* Hint button — visible when it's your turn and 2+ valid moves exist */}
      <AnimatePresence>
        {isMyTurn && validMoves.length >= 2 && (
          <motion.button
            key="hint-btn"
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleHint}
            aria-label="Sugerencia: resaltar la mejor ficha a jugar"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
            style={hintTile ? {
              background: "linear-gradient(135deg, #0a2a20 0%, #061a12 100%)",
              border: "1.5px solid rgba(56,220,180,0.65)",
              boxShadow: "0 0 14px rgba(56,220,180,0.25), 0 2px 8px rgba(0,0,0,0.5)",
              color: "rgba(56,220,180,1)",
            } : {
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(168,196,160,0.2)",
              color: "rgba(168,196,160,0.55)",
            }}
          >
            {/* Lightbulb icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1.5C4.067 1.5 2.5 3.067 2.5 5c0 1.2.6 2.26 1.5 2.9V9a.5.5 0 00.5.5h3A.5.5 0 008 9V7.9C8.9 7.26 9.5 6.2 9.5 5c0-1.933-1.567-3.5-3.5-3.5z" stroke="currentColor" strokeWidth="1" fill="none"/>
              <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">
              {hintTile ? "Sugerida" : "Sugerencia"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sort toggle button — always visible when hand has 2+ tiles */}
      <AnimatePresence>
        {myHand.length >= 2 && (
          <motion.button
            key="sort-btn"
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setSortByPips((v) => !v)}
            aria-label={sortByPips ? "Orden original" : "Ordenar por puntos"}
            aria-pressed={sortByPips}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
            style={sortByPips ? {
              background: "linear-gradient(135deg, #1a2a10 0%, #0e1a08 100%)",
              border: "1.5px solid rgba(168,196,160,0.65)",
              boxShadow: "0 0 14px rgba(168,196,160,0.25), 0 2px 8px rgba(0,0,0,0.5)",
              color: "rgba(168,196,160,1)",
            } : {
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(168,196,160,0.2)",
              color: "rgba(168,196,160,0.55)",
            }}
          >
            {/* Sort icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <line x1="1" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="2.5" y1="6" x2="9.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">
              {sortByPips ? "Ordenado" : "Ordenar"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts help button — desktop only */}
      <div ref={shortcutsRef} className="hidden sm:block relative">
        <button
          onClick={() => setShowShortcuts((v) => !v)}
          aria-label="Atajos de teclado"
          aria-expanded={showShortcuts}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-widest transition-colors"
          style={{
            color: showShortcuts ? "#c9a84c" : "rgba(168,196,160,0.45)",
            background: showShortcuts ? "rgba(201,168,76,0.1)" : "transparent",
            border: `1px solid ${showShortcuts ? "rgba(201,168,76,0.35)" : "rgba(168,196,160,0.15)"}`,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1"/>
            <path d="M3.5 3.5h1M5.5 3.5h1M3.5 5h1M5.5 5h1M3.5 6.5h3" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          </svg>
          Atajos
        </button>

        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              key="shortcuts-popover"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #1e3a20 0%, #0f2010 100%)",
                border: "1px solid rgba(201,168,76,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.4)",
                minWidth: 200,
              }}
              role="tooltip"
              aria-label="Atajos de teclado disponibles"
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-[#c9a84c]/15 flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="9" height="9" rx="2" stroke="#c9a84c" strokeWidth="1" opacity="0.7"/>
                  <path d="M3.5 3.5h1M5.5 3.5h1M3.5 5h1M5.5 5h1M3.5 6.5h3" stroke="#c9a84c" strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#c9a84c]/70">
                  Atajos de teclado
                </span>
              </div>

              {/* Shortcut rows */}
              <div className="px-3 py-2 space-y-1.5">
                {[
                  { keys: ["1", "–", "7"], desc: "Seleccionar ficha" },
                  { keys: ["←", "→"], desc: "Elegir extremo" },
                  { keys: ["P"], desc: "Pasar turno" },
                  { keys: ["H"], desc: "Sugerencia" },
                  { keys: ["S"], desc: "Ordenar fichas" },
                  { keys: ["Esc"], desc: "Cancelar selección" },
                ].map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-0.5">
                      {keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && k !== "–" && (
                            <span className="text-[8px] text-[#a8c4a0]/30 mx-0.5">/</span>
                          )}
                          <kbd
                            className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-bold leading-none"
                            style={{
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(201,168,76,0.25)",
                              color: "#c9a84c",
                              minWidth: k === "–" ? undefined : 18,
                              fontFamily: "monospace",
                            }}
                          >
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#f5f0e8]/55 leading-none text-right">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
