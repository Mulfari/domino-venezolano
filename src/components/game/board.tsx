"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPlacedTiles, DIMS_DESKTOP, DIMS_MOBILE, tileSize, tileOrientation } from "@/lib/game/board-layout";
import type { PlacedTile } from "@/lib/game/board-layout";
import type { Seat } from "@/lib/game/types";

interface BoardProps {
  onPlaceEnd?: (end: "left" | "right") => void;
  clearing?: boolean;
}

export function Board({ onPlaceEnd, clearing = false }: BoardProps) {
  const board = useGameStore((s) => s.board);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const validMovesFn = useGameStore((s) => s.validMoves);
  const consecutivePasses = useGameStore((s) => s.consecutivePasses);
  const status = useGameStore((s) => s.status);
  const round = useGameStore((s) => s.round);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 400 });
  const [hoveredEnd, setHoveredEnd] = useState<"left" | "right" | null>(null);
  const [focusedEnd, setFocusedEnd] = useState<"left" | "right" | null>(null);
  const [inspectedIdx, setInspectedIdx] = useState<number | null>(null);
  const inspectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const dims = isMobile ? DIMS_MOBILE : DIMS_DESKTOP;

  const isMyTurn = isMyTurnFn();
  const validMoves = validMovesFn();
  const showPlacementOptions = selectedTile !== null && isMyTurn && board.plays.length > 0;

  // Dismiss inspect popup when board changes or placement mode activates
  useEffect(() => {
    setInspectedIdx(null);
    if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
  }, [board.plays.length, showPlacementOptions]);

  function handleInspectTile(idx: number) {
    if (showPlacementOptions) return;
    if (inspectedIdx === idx) {
      setInspectedIdx(null);
      if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
      return;
    }
    setInspectedIdx(idx);
    if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
    inspectTimerRef.current = setTimeout(() => setInspectedIdx(null), 4000);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const BOARD_SIZE = Math.min(size.w, size.h, isMobile ? 500 : 600);
  const FRAME_PAD = isMobile ? 8 : 12;

  const prevLastKeyRef = useRef<string | null>(null);
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);
  const [lastPlayedSeat, setLastPlayedSeat] = useState<Seat | null>(null);
  const [showDoubleBadge, setShowDoubleBadge] = useState(false);
  const doubleBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPlaysLengthRef = useRef(0);
  const [lastPlayEnd, setLastPlayEnd] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (board.plays.length === 0) {
      prevLastKeyRef.current = null;
      prevPlaysLengthRef.current = 0;
      setLastPlayedSeat(null);
      return;
    }
    const idx = board.plays.length - 1;
    const lastPlay = board.plays[idx];
    const lastKey = `${lastPlay.tile[0]}-${lastPlay.tile[1]}-${lastPlay.end}-${idx}`;
    if (lastKey !== prevLastKeyRef.current) {
      prevLastKeyRef.current = lastKey;
      setAnimatingKey(lastKey);
      setLastPlayedSeat(lastPlay.seat);
      setLastPlayEnd(lastPlay.end);
      // Show ¡Doble! badge when a new double tile is placed
      if (board.plays.length > prevPlaysLengthRef.current && lastPlay.tile[0] === lastPlay.tile[1]) {
        setShowDoubleBadge(true);
        if (doubleBadgeTimerRef.current) clearTimeout(doubleBadgeTimerRef.current);
        doubleBadgeTimerRef.current = setTimeout(() => setShowDoubleBadge(false), 1800);
      }
    }
    prevPlaysLengthRef.current = board.plays.length;
  }, [board.plays]);

  const placedTiles = useMemo(
    () => buildPlacedTiles(board.plays, BOARD_SIZE, BOARD_SIZE, dims),
    [board.plays, BOARD_SIZE, dims]
  );

  // Compute ghost tile positions by simulating placement on each valid end
  const ghostTiles = useMemo<Partial<Record<"left" | "right", PlacedTile>>>(() => {
    if (!selectedTile || !showPlacementOptions) return {};

    const validEnds = validMoves
      .filter(
        (m) =>
          (m.tile[0] === selectedTile[0] && m.tile[1] === selectedTile[1]) ||
          (m.tile[0] === selectedTile[1] && m.tile[1] === selectedTile[0])
      )
      .map((m) => m.end);

    const result: Partial<Record<"left" | "right", PlacedTile>> = {};

    for (const end of validEnds) {
      const simulatedPlays = [
        ...board.plays,
        { tile: selectedTile, seat: 0 as Seat, end },
      ];
      const placed = buildPlacedTiles(simulatedPlays, BOARD_SIZE, BOARD_SIZE, dims);
      result[end] = end === "right" ? placed[placed.length - 1] : placed[0];
    }

    return result;
  }, [selectedTile, showPlacementOptions, board.plays, validMoves, BOARD_SIZE, dims]);

  // The actual end tiles on the board (for highlight ring)
  const leftEndTile = placedTiles.length > 0 ? placedTiles[0] : null;
  const rightEndTile = placedTiles.length > 0 ? placedTiles[placedTiles.length - 1] : null;

  // Dynamic viewBox: zoom into the bounding box of placed tiles so they appear larger
  const dynamicViewBox = useMemo(() => {
    const allTiles = [...placedTiles];
    // Include ghost tiles so the viewBox doesn't jump when placement options appear
    if (ghostTiles["left"]) allTiles.push(ghostTiles["left"]);
    if (ghostTiles["right"]) allTiles.push(ghostTiles["right"]);

    if (allTiles.length === 0) return `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of allTiles) {
      const isH = pt.orientation === "horizontal";
      const tw = isH
        ? (pt.isDouble ? dims.doubleH : dims.horizW)
        : (pt.isDouble ? dims.doubleW : dims.horizH);
      const th = isH
        ? (pt.isDouble ? dims.doubleW : dims.horizH)
        : (pt.isDouble ? dims.doubleH : dims.horizW);
      minX = Math.min(minX, pt.x - tw / 2);
      minY = Math.min(minY, pt.y - th / 2);
      maxX = Math.max(maxX, pt.x + tw / 2);
      maxY = Math.max(maxY, pt.y + th / 2);
    }

    const pad = isMobile ? 40 : 50;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;

    let vbW = maxX - minX;
    let vbH = maxY - minY;

    // Keep aspect ratio square (matches the 1:1 board)
    const side = Math.max(vbW, vbH);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Clamp: never zoom in more than 45% of board, never exceed full board
    const minSide = BOARD_SIZE * 0.45;
    const clampedSide = Math.max(minSide, Math.min(side, BOARD_SIZE));

    const vbX = Math.max(0, Math.min(cx - clampedSide / 2, BOARD_SIZE - clampedSide));
    const vbY = Math.max(0, Math.min(cy - clampedSide / 2, BOARD_SIZE - clampedSide));

    return `${vbX} ${vbY} ${clampedSide} ${clampedSide}`;
  }, [placedTiles, ghostTiles, BOARD_SIZE, dims, isMobile]);

  const boardDescription = board.plays.length === 0
    ? (isMyTurn ? "Tablero vacío. Es tu turno, juega la primera ficha." : "Tablero vacío. Esperando la primera jugada.")
    : `Tablero con ${board.plays.length} ficha${board.plays.length !== 1 ? "s" : ""}. Extremo izquierdo: ${board.left ?? 0}. Extremo derecho: ${board.right ?? 0}.${showPlacementOptions ? " Selecciona un extremo para colocar tu ficha." : ""}`;

  return (
    <div ref={containerRef} className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden" role="region" aria-label="Tablero de juego">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{boardDescription}</div>
      {/* Marco de madera */}
      <div
        style={{
          width: "100%",
          maxWidth: `${BOARD_SIZE + FRAME_PAD * 2 + 4}px`,
          borderRadius: "16px",
          padding: `${FRAME_PAD}px`,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 18px,
              rgba(0,0,0,0.10) 18px,
              rgba(0,0,0,0.10) 19px,
              transparent 19px,
              transparent 22px,
              rgba(255,255,255,0.04) 22px,
              rgba(255,255,255,0.04) 23px
            ),
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 28px,
              rgba(0,0,0,0.08) 28px,
              rgba(0,0,0,0.08) 30px,
              transparent 30px,
              transparent 34px,
              rgba(255,255,255,0.03) 34px,
              rgba(255,255,255,0.03) 35px
            ),
            repeating-linear-gradient(
              175deg,
              transparent,
              transparent 6px,
              rgba(255,255,255,0.025) 6px,
              rgba(255,255,255,0.025) 7px
            ),
            linear-gradient(180deg,
              #c49a5a 0%,
              #a07038 3%,
              #6b4220 8%,
              #8a5c30 16%,
              #3e2410 28%,
              #5a3618 38%,
              #7a5028 48%,
              #3e2410 58%,
              #5a3618 68%,
              #7a5028 80%,
              #9a6c3c 92%,
              #b88040 100%
            )
          `,
          boxShadow: `
            0 28px 80px rgba(0,0,0,0.95),
            0 12px 35px rgba(0,0,0,0.65),
            0 4px 12px rgba(0,0,0,0.5),
            inset 0 4px 0 rgba(255,255,255,0.22),
            inset 0 2px 0 rgba(255,255,255,0.10),
            inset 0 -4px 0 rgba(0,0,0,0.60),
            inset 4px 0 0 rgba(255,255,255,0.10),
            inset -4px 0 0 rgba(0,0,0,0.50),
            inset 0 1px 10px rgba(255,255,255,0.07)
          `,
          border: "1px solid #3a2210",
          position: "relative",
        }}
      >
        {/* Esquinas decorativas */}
        {[
          { top: 4, left: 4 },
          { top: 4, right: 4 },
          { bottom: 4, left: 4 },
          { bottom: 4, right: 4 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #e8c96a, #9b7820)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
              ...pos,
            }}
          />
        ))}

        {/* Filete dorado con bisel tallado */}
        <div
          style={{
            borderRadius: "10px",
            padding: "3px",
            background:
              "linear-gradient(135deg, #f0d878 0%, #9b7820 18%, #c9a84c 42%, #f5e090 50%, #c9a84c 58%, #9b7820 82%, #f0d878 100%)",
            boxShadow: "0 0 22px rgba(201,168,76,0.6), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 2px rgba(0,0,0,0.65), 0 0 0 4px rgba(255,255,255,0.06)",
          }}
        >
          {/* Superficie de fieltro */}
          <div
            className="relative rounded-lg overflow-hidden"
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 1px,
                  rgba(0,0,0,0.022) 1px,
                  rgba(0,0,0,0.022) 2px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 1px,
                  rgba(255,255,255,0.014) 1px,
                  rgba(255,255,255,0.014) 2px
                ),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.032) 2px,
                  rgba(255,255,255,0.032) 3px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.042) 2px,
                  rgba(0,0,0,0.042) 3px
                ),
                repeating-linear-gradient(
                  44deg,
                  transparent,
                  transparent 5px,
                  rgba(255,255,255,0.016) 5px,
                  rgba(255,255,255,0.016) 6px
                ),
                repeating-linear-gradient(
                  -44deg,
                  transparent,
                  transparent 5px,
                  rgba(0,0,0,0.018) 5px,
                  rgba(0,0,0,0.018) 6px
                ),
                radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.14) 0%, transparent 42%),
                radial-gradient(ellipse at 60% 70%, rgba(0,0,0,0.22) 0%, transparent 40%),
                radial-gradient(ellipse at center, #1e6b3c 0%, #165830 22%, #0e4020 50%, #071a0e 100%)
              `,
              boxShadow: `
                inset 0 0 0 1px rgba(0,0,0,0.55),
                inset 0 6px 22px rgba(0,0,0,0.80),
                inset 0 -6px 22px rgba(0,0,0,0.55),
                inset 6px 0 22px rgba(0,0,0,0.50),
                inset -6px 0 22px rgba(0,0,0,0.50),
                inset 0 0 60px rgba(0,0,0,0.35),
                inset 0 2px 4px rgba(255,255,255,0.07)
              `,
            }}
          >
            {/* Ruido fractal de fibra de fieltro */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75 0.55' numOctaves='5' seed='12' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
                opacity: 0.11,
                mixBlendMode: "soft-light",
                pointerEvents: "none",
              }}
            />
            {/* Vignette: oscurece bordes, simula hundimiento del fieltro */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: `radial-gradient(ellipse at 38% 35%, transparent 30%, rgba(0,0,0,0.38) 80%, rgba(0,0,0,0.60) 100%)`,
                pointerEvents: "none",
              }}
            />


            {/* Capicúa indicator — both open ends show the same number */}
            <AnimatePresence>
              {board.left !== null && board.right !== null && board.left === board.right && board.plays.length > 1 && status === "playing" && (
                <motion.div
                  key={`capicua-${board.left}`}
                  initial={{ opacity: 0, scale: 0.7, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="absolute top-2 left-2 z-20 pointer-events-none"
                  role="status"
                  aria-live="polite"
                  aria-label={`Capicúa disponible — ambos extremos muestran el ${board.left}`}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #2a1a00 0%, #1a0e00 100%)",
                      border: "1.5px solid rgba(201,168,76,0.75)",
                      borderRadius: "8px",
                      padding: isMobile ? "3px 6px" : "4px 8px",
                      boxShadow: "0 0 16px rgba(201,168,76,0.4), 0 2px 8px rgba(0,0,0,0.7)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {/* Two matching pip dots */}
                      <div className="flex gap-0.5" aria-hidden="true">
                        {[0, 1].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                            style={{
                              width: isMobile ? 5 : 6,
                              height: isMobile ? 5 : 6,
                              borderRadius: "50%",
                              backgroundColor: "#c9a84c",
                              boxShadow: "0 0 6px rgba(201,168,76,0.8)",
                            }}
                          />
                        ))}
                      </div>
                      <motion.span
                        animate={{ opacity: [0.75, 1, 0.75] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          fontSize: isMobile ? 8 : 9,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#c9a84c",
                          lineHeight: 1,
                        }}
                      >
                        ¡Capicúa!
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ¡Doble! badge — flashes briefly when a double tile is placed */}
            <AnimatePresence>
              {showDoubleBadge && (
                <motion.div
                  key="doble-badge"
                  initial={{ opacity: 0, scale: 0.6, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: -6 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  role="status"
                  aria-live="polite"
                  aria-label="¡Doble!"
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #1a0e2a 0%, #0e0818 100%)",
                      border: "1.5px solid rgba(201,168,76,0.8)",
                      borderRadius: "10px",
                      padding: isMobile ? "3px 8px" : "4px 10px",
                      boxShadow: "0 0 18px rgba(201,168,76,0.45), 0 2px 8px rgba(0,0,0,0.7)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {/* Two matching pips */}
                      <div className="flex gap-0.5" aria-hidden="true">
                        {[0, 1].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 0.5, delay: i * 0.12, ease: "easeInOut" }}
                            style={{
                              width: isMobile ? 5 : 6,
                              height: isMobile ? 5 : 6,
                              borderRadius: "50%",
                              backgroundColor: "#c9a84c",
                              boxShadow: "0 0 6px rgba(201,168,76,0.9)",
                            }}
                          />
                        ))}
                      </div>
                      <motion.span
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 0.7, repeat: 2, ease: "easeInOut" }}
                        style={{
                          fontSize: isMobile ? 9 : 10,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#c9a84c",
                          lineHeight: 1,
                          textShadow: "0 0 8px rgba(201,168,76,0.7)",
                        }}
                      >
                        ¡Doble!
                      </motion.span>
                      <div className="flex gap-0.5" aria-hidden="true">
                        {[0, 1].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 0.5, delay: 0.24 + i * 0.12, ease: "easeInOut" }}
                            style={{
                              width: isMobile ? 5 : 6,
                              height: isMobile ? 5 : 6,
                              borderRadius: "50%",
                              backgroundColor: "#c9a84c",
                              boxShadow: "0 0 6px rgba(201,168,76,0.9)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trancado warning — shows when consecutive passes accumulate */}
            <AnimatePresence>
              {consecutivePasses >= 1 && status === "playing" && (
                <motion.div
                  key={consecutivePasses}
                  initial={{ opacity: 0, scale: 0.7, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="absolute top-2 right-2 z-20 pointer-events-none"
                  role="status"
                  aria-live="polite"
                  aria-label={`${consecutivePasses} pases consecutivos de 4`}
                >
                  <div
                    style={{
                      background: consecutivePasses >= 3
                        ? "linear-gradient(135deg, #4a0a0a 0%, #2a0505 100%)"
                        : consecutivePasses === 2
                        ? "linear-gradient(135deg, #3a1a00 0%, #1e0e00 100%)"
                        : "linear-gradient(135deg, #1a2a10 0%, #0e1a08 100%)",
                      border: `1.5px solid ${consecutivePasses >= 3 ? "rgba(239,68,68,0.75)" : consecutivePasses === 2 ? "rgba(251,146,60,0.65)" : "rgba(168,196,160,0.35)"}`,
                      borderRadius: "8px",
                      padding: isMobile ? "3px 6px" : "4px 8px",
                      boxShadow: consecutivePasses >= 3
                        ? "0 0 16px rgba(239,68,68,0.4), 0 2px 8px rgba(0,0,0,0.7)"
                        : "0 2px 8px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {/* Pip dots showing pass count */}
                      <div className="flex gap-0.5" aria-hidden="true">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            animate={i < consecutivePasses && consecutivePasses >= 3
                              ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                              : {}}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                            style={{
                              width: isMobile ? 5 : 6,
                              height: isMobile ? 5 : 6,
                              borderRadius: "50%",
                              backgroundColor: i < consecutivePasses
                                ? consecutivePasses >= 3 ? "#ef4444"
                                  : consecutivePasses === 2 ? "#fb923c"
                                  : "#a8c4a0"
                                : "rgba(255,255,255,0.12)",
                              boxShadow: i < consecutivePasses && consecutivePasses >= 3
                                ? "0 0 6px rgba(239,68,68,0.8)"
                                : "none",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: isMobile ? 8 : 9,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: consecutivePasses >= 3 ? "#ef4444"
                            : consecutivePasses === 2 ? "#fb923c"
                            : "rgba(168,196,160,0.75)",
                          lineHeight: 1,
                        }}
                      >
                        {consecutivePasses >= 3 ? "¡Trancado!" : "Pasos"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ¡Cerca! tension badge — appears when any team is within 20 pts of winning */}
            {(() => {
              if (status !== "playing") return null;
              const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;
              const remaining0 = targetScore - scores[0];
              const remaining1 = targetScore - scores[1];
              const close0 = remaining0 <= 20 && remaining0 > 0;
              const close1 = remaining1 <= 20 && remaining1 > 0;
              if (!close0 && !close1) return null;

              // Pick the team that's closest; prefer my team on tie
              let alertTeam: 0 | 1;
              if (close0 && close1) {
                alertTeam = remaining0 <= remaining1 ? 0 : 1;
              } else {
                alertTeam = close0 ? 0 : 1;
              }
              const isMyTeam = myTeam === alertTeam;
              const remaining = alertTeam === 0 ? remaining0 : remaining1;
              const borderColor = isMyTeam ? "rgba(201,168,76,0.8)" : "rgba(239,68,68,0.75)";
              const textColor = isMyTeam ? "#c9a84c" : "#ef4444";
              const bgColor = isMyTeam
                ? "linear-gradient(135deg, #2a1a00 0%, #1a0e00 100%)"
                : "linear-gradient(135deg, #4a0a0a 0%, #2a0505 100%)";
              const glowColor = isMyTeam ? "rgba(201,168,76,0.4)" : "rgba(239,68,68,0.4)";

              return (
                <AnimatePresence>
                  <motion.div
                    key={`cerca-${alertTeam}`}
                    initial={{ opacity: 0, scale: 0.7, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    role="status"
                    aria-live="polite"
                    aria-label={`${isMyTeam ? "Tu equipo" : "El equipo rival"} está a ${remaining} puntos de ganar`}
                  >
                    <div
                      style={{
                        background: bgColor,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: "8px",
                        padding: isMobile ? "3px 6px" : "4px 8px",
                        boxShadow: `0 0 16px ${glowColor}, 0 2px 8px rgba(0,0,0,0.7)`,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {/* Flame / trophy icon */}
                        <motion.span
                          animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
                          style={{ fontSize: isMobile ? 9 : 10, lineHeight: 1 }}
                          aria-hidden="true"
                        >
                          {isMyTeam ? "🏆" : "⚠️"}
                        </motion.span>
                        <div className="flex flex-col leading-none gap-0.5">
                          <motion.span
                            animate={{ opacity: [0.75, 1, 0.75] }}
                            transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                              fontSize: isMobile ? 8 : 9,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: textColor,
                              lineHeight: 1,
                            }}
                          >
                            ¡Cerca!
                          </motion.span>
                          <span
                            style={{
                              fontSize: isMobile ? 7 : 8,
                              color: isMyTeam ? "rgba(201,168,76,0.6)" : "rgba(239,68,68,0.6)",
                              lineHeight: 1,
                              letterSpacing: "0.04em",
                            }}
                          >
                            faltan {remaining} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })()}

            {board.plays.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center" aria-live="polite">
                <div className="flex flex-col items-center gap-3 select-none pointer-events-none">
                  {/* Radial glow behind icon */}
                  <div
                    className="absolute"
                    style={{
                      width: isMobile ? 110 : 140,
                      height: isMobile ? 110 : 140,
                      borderRadius: "50%",
                      background: "radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)",
                    }}
                  />

                  {/* Round-specific domino icon */}
                  <motion.div
                    animate={{ opacity: [0.55, 0.9, 0.55] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {round === 1 ? (
                      /* 6-6 cochina — horizontal */
                      <svg width={isMobile ? 56 : 72} height={isMobile ? 30 : 38} viewBox="0 0 72 38" fill="none" aria-hidden="true">
                        <rect x="1" y="1" width="70" height="36" rx="6" fill="rgba(245,240,232,0.06)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"/>
                        <line x1="36" y1="2" x2="36" y2="36" stroke="rgba(201,168,76,0.38)" strokeWidth="1"/>
                        {/* Left 6 */}
                        {[[9,8],[15,8],[9,19],[15,19],[9,30],[15,30]].map(([cx,cy],i) => (
                          <circle key={i} cx={cx} cy={cy} r="2.4" fill="rgba(201,168,76,0.6)"/>
                        ))}
                        {/* Right 6 */}
                        {[[57,8],[63,8],[57,19],[63,19],[57,30],[63,30]].map(([cx,cy],i) => (
                          <circle key={i} cx={cx} cy={cy} r="2.4" fill="rgba(201,168,76,0.6)"/>
                        ))}
                      </svg>
                    ) : (
                      /* Generic domino — horizontal */
                      <svg width={isMobile ? 56 : 72} height={isMobile ? 30 : 38} viewBox="0 0 72 38" fill="none" aria-hidden="true">
                        <rect x="1" y="1" width="70" height="36" rx="6" fill="rgba(245,240,232,0.06)" stroke="rgba(201,168,76,0.38)" strokeWidth="1.5"/>
                        <line x1="36" y1="2" x2="36" y2="36" stroke="rgba(201,168,76,0.28)" strokeWidth="1"/>
                        <circle cx="18" cy="19" r="3.5" fill="rgba(201,168,76,0.5)"/>
                        <circle cx="54" cy="19" r="3.5" fill="rgba(201,168,76,0.5)"/>
                      </svg>
                    )}
                  </motion.div>

                  {/* Round context label */}
                  <motion.span
                    className="text-center font-bold uppercase tracking-widest leading-none"
                    style={{
                      fontSize: isMobile ? 9 : 10,
                      color: round === 1 ? "rgba(201,168,76,0.75)" : "rgba(168,196,160,0.55)",
                      textShadow: round === 1 ? "0 0 12px rgba(201,168,76,0.4)" : "none",
                    }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {round === 1 ? "¡Cochina para abrir!" : "Primera jugada"}
                  </motion.span>

                  {/* Turn status */}
                  <div className="flex flex-col items-center gap-1">
                    {isMyTurn ? (
                      <>
                        <motion.span
                          className="text-[13px] sm:text-sm font-bold uppercase tracking-widest"
                          style={{ color: "#c9a84c", textShadow: "0 0 16px rgba(201,168,76,0.5)" }}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ¡Tu turno!
                        </motion.span>
                        <span className="text-[10px] sm:text-[11px] text-[#a8c4a0]/50 uppercase tracking-wider">
                          {round === 1 ? "Juega el doble-seis" : "Juega la primera ficha"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#a8c4a0]/55 uppercase tracking-widest">
                          Esperando...
                        </span>
                        {(() => {
                          const starter = players.find((p) => p.seat === currentTurn);
                          const starterName = starter?.displayName ?? `Jugador ${currentTurn + 1}`;
                          const teamColor = (currentTurn % 2) === 0 ? "#c9a84c" : "#4ca8c9";
                          return (
                            <motion.span
                              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider"
                              style={{ color: teamColor }}
                              animate={{ opacity: [0.55, 1, 0.55] }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            >
                              {starterName}
                            </motion.span>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <svg
                width="100%"
                height="100%"
                viewBox={dynamicViewBox}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0"
                aria-hidden="true"
              >
                <AnimatePresence>
                  {placedTiles.map((pt, tileIdx) => {
                    const isH = pt.orientation === "horizontal";
                    const tw = isH
                      ? (pt.isDouble ? dims.doubleH : dims.horizW)
                      : (pt.isDouble ? dims.doubleW : dims.horizH);
                    const th = isH
                      ? (pt.isDouble ? dims.doubleW : dims.horizH)
                      : (pt.isDouble ? dims.doubleH : dims.horizW);
                    const isNew = pt.key === animatingKey;

                    const isLeftEnd = showPlacementOptions && pt === leftEndTile && ghostTiles["left"] !== undefined;
                    const isRightEnd = showPlacementOptions && pt === rightEndTile && ghostTiles["right"] !== undefined;
                    const isEndTile = isLeftEnd || isRightEnd;
                    const thisEnd: "left" | "right" | null = isLeftEnd ? "left" : isRightEnd ? "right" : null;
                    const isHoveredEnd = thisEnd !== null && hoveredEnd === thisEnd;
                    // Stagger exit from center outward
                    const totalTiles = placedTiles.length;
                    const centerIdx = (totalTiles - 1) / 2;
                    const distFromCenter = Math.abs(tileIdx - centerIdx);
                    const exitDelay = clearing ? distFromCenter * 0.03 : 0;

                    return (
                      <motion.g
                        key={pt.key}
                        initial={isNew ? {
                          scale: 0.7,
                          opacity: 0,
                          x: lastPlayEnd === "left" ? -28 : lastPlayEnd === "right" ? 28 : 0,
                        } : false}
                        animate={isNew ? { scale: 1, opacity: 1, x: 0 } : undefined}
                        exit={clearing ? { scale: 0, opacity: 0, transition: { duration: 0.25, delay: exitDelay, ease: "easeIn" } } : undefined}
                        transition={isNew ? { type: "spring", stiffness: 340, damping: 22 } : undefined}
                        style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                      >
                        {/* Shockwave ripple + glow — one-shot radial burst when a tile is placed */}
                        {isNew && (() => {
                          const glowTeam = (pt.seat % 2) as 0 | 1;
                          const glowStroke = glowTeam === 0 ? "#c9a84c" : "#4ca8c9";
                          const glowFill = glowTeam === 0 ? "rgba(201,168,76,0.22)" : "rgba(76,168,201,0.22)";
                          const glowDrop = glowTeam === 0 ? "drop-shadow(0 0 6px rgba(201,168,76,0.9))" : "drop-shadow(0 0 6px rgba(76,168,201,0.9))";
                          const rippleStroke = glowTeam === 0 ? "rgba(201,168,76," : "rgba(76,168,201,";
                          const isDouble = pt.tile[0] === pt.tile[1];
                          const rippleCount = isDouble ? 3 : 2;
                          const maxRadius = isDouble ? 55 : 40;
                          return (
                          <>
                            {/* Radial shockwave rings — expand outward from placement point */}
                            {Array.from({ length: rippleCount }).map((_, ri) => (
                              <motion.circle
                                key={`ripple-${ri}`}
                                cx={pt.x}
                                cy={pt.y}
                                r={Math.max(tw, th) / 2}
                                fill="none"
                                stroke={`${rippleStroke}0.7)`}
                                strokeWidth={isDouble ? 2.5 : 2}
                                initial={{ r: Math.max(tw, th) / 2, opacity: 0.8, strokeWidth: isDouble ? 2.5 : 2 }}
                                animate={{ r: maxRadius + ri * 12, opacity: 0, strokeWidth: 0.3 }}
                                transition={{ duration: 0.6 + ri * 0.15, delay: ri * 0.1, ease: "easeOut" }}
                                style={{ filter: `drop-shadow(0 0 3px ${rippleStroke}0.6))` }}
                              />
                            ))}
                            {/* Brief radial flash at impact point */}
                            <motion.circle
                              cx={pt.x}
                              cy={pt.y}
                              r={Math.max(tw, th) * 0.6}
                              fill={`${rippleStroke}0.18)`}
                              initial={{ opacity: 1, scale: 0.5 }}
                              animate={{ opacity: 0, scale: 1.8 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              style={{ transformOrigin: `${pt.x}px ${pt.y}px`, filter: "blur(3px)" }}
                            />
                            <motion.rect
                              x={pt.x - tw / 2 - 9}
                              y={pt.y - th / 2 - 9}
                              width={tw + 18}
                              height={th + 18}
                              rx={8}
                              fill={glowFill}
                              stroke="none"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
                              style={{ filter: "blur(5px)" }}
                            />
                            <motion.rect
                              x={pt.x - tw / 2 - 5}
                              y={pt.y - th / 2 - 5}
                              width={tw + 10}
                              height={th + 10}
                              rx={6}
                              fill="none"
                              stroke={glowStroke}
                              strokeWidth={2.5}
                              initial={{ opacity: 0.95 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 2.0, delay: 0.2, ease: "easeOut" }}
                              style={{ filter: glowDrop }}
                            />
                          </>
                          );
                        })()}
                        {/* Persistent "last played" ring — stays until next tile is placed */}
                        {pt.key === animatingKey && !isNew && !isEndTile && (() => {
                          const team = lastPlayedSeat !== null ? (lastPlayedSeat % 2) as 0 | 1 : 0;
                          const ringColor = team === 0 ? "rgba(201,168,76,0.55)" : "rgba(76,168,201,0.55)";
                          const glowColor = team === 0 ? "rgba(201,168,76,0.7)" : "rgba(76,168,201,0.7)";
                          return (
                            <motion.rect
                              x={pt.x - tw / 2 - 3}
                              y={pt.y - th / 2 - 3}
                              width={tw + 6}
                              height={th + 6}
                              rx={5}
                              fill="none"
                              stroke={ringColor}
                              strokeWidth={1.5}
                              animate={{ opacity: [0.35, 0.75, 0.35] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
                            />
                          );
                        })()}
                        {isEndTile && (
                          <>
                            {/* Outer glow */}
                            <motion.rect
                              x={pt.x - tw / 2 - 7}
                              y={pt.y - th / 2 - 7}
                              width={tw + 14}
                              height={th + 14}
                              rx={7}
                              fill={isHoveredEnd ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.06)"}
                              stroke="none"
                              animate={{ opacity: isHoveredEnd ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3] }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                              style={{ filter: "blur(3px)" }}
                            />
                            {/* Highlight ring */}
                            <motion.rect
                              x={pt.x - tw / 2 - 4}
                              y={pt.y - th / 2 - 4}
                              width={tw + 8}
                              height={th + 8}
                              rx={5}
                              fill="none"
                              stroke="#c9a84c"
                              strokeWidth={isHoveredEnd ? 3 : 2}
                              animate={{ opacity: isHoveredEnd ? [0.8, 1, 0.8] : [0.4, 0.85, 0.4] }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                              style={{ filter: isHoveredEnd ? "drop-shadow(0 0 8px #c9a84c)" : "drop-shadow(0 0 4px rgba(201,168,76,0.6))" }}
                            />
                          </>
                        )}
                        {/* Invisible hit area for tap-to-inspect */}
                        {!isEndTile && !showPlacementOptions && (
                          <rect
                            x={pt.x - tw / 2 - 3}
                            y={pt.y - th / 2 - 3}
                            width={tw + 6}
                            height={th + 6}
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => { e.stopPropagation(); handleInspectTile(tileIdx); }}
                          />
                        )}
                        <foreignObject
                          x={pt.x - tw / 2}
                          y={pt.y - th / 2}
                          width={tw}
                          height={th}
                          style={{ pointerEvents: "none" }}
                        >
                          <DominoTile
                            tile={pt.tile}
                            size="small"
                            orientation={pt.orientation}
                          />
                        </foreignObject>
                        {/* Team dot — tiny colored circle in the corner showing which team placed this tile */}
                        <circle
                          cx={pt.x + tw / 2 - (isMobile ? 2.5 : 3)}
                          cy={pt.y - th / 2 + (isMobile ? 2.5 : 3)}
                          r={isMobile ? 1.8 : 2.2}
                          fill={(pt.seat % 2) === 0 ? "#c9a84c" : "#4ca8c9"}
                          opacity={0.88}
                          style={{ filter: `drop-shadow(0 0 2px ${(pt.seat % 2) === 0 ? "rgba(201,168,76,0.9)" : "rgba(76,168,201,0.9)"})`, pointerEvents: "none" }}
                        />
                        {/* Opening tile star — marks the first play of the round */}
                        {tileIdx === 0 && (
                          <>
                            <circle
                              cx={pt.x - tw / 2 + (isMobile ? 3 : 4)}
                              cy={pt.y - th / 2 + (isMobile ? 3 : 4)}
                              r={isMobile ? 4 : 5}
                              fill="rgba(201,168,76,0.9)"
                              style={{ filter: "drop-shadow(0 0 4px rgba(201,168,76,0.85))", pointerEvents: "none" }}
                            />
                            <text
                              x={pt.x - tw / 2 + (isMobile ? 3 : 4)}
                              y={pt.y - th / 2 + (isMobile ? 6 : 7.5)}
                              textAnchor="middle"
                              fontSize={isMobile ? 5 : 6}
                              fontWeight="bold"
                              fill="#1a0e00"
                              fontFamily="system-ui, -apple-system, sans-serif"
                              style={{ userSelect: "none", pointerEvents: "none" }}
                              aria-hidden="true"
                            >
                              ★
                            </text>
                          </>
                        )}
                        {/* Inspect popup — shows who played this tile and move number */}
                        {inspectedIdx === tileIdx && (() => {
                          const inspPlayer = players.find((p) => p.seat === pt.seat);
                          const inspName = inspPlayer?.displayName?.split(" ")[0] ?? `J${pt.seat + 1}`;
                          const inspTeam = (pt.seat % 2) as 0 | 1;
                          const inspColor = inspTeam === 0 ? "#c9a84c" : "#4ca8c9";
                          const inspBg = inspTeam === 0 ? "rgba(42,26,8,0.95)" : "rgba(8,26,42,0.95)";
                          const inspBorder = inspTeam === 0 ? "rgba(201,168,76,0.75)" : "rgba(76,168,201,0.75)";
                          const popW = isMobile ? 62 : 76;
                          const popH = isMobile ? 28 : 32;
                          const popX = pt.x - popW / 2;
                          const popY = pt.y - th / 2 - popH - 5;
                          const clampedX = Math.max(4, Math.min(popX, BOARD_SIZE - popW - 4));
                          const clampedY = popY < 4 ? pt.y + th / 2 + 5 : popY;
                          return (
                            <motion.g
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ pointerEvents: "none" }}
                            >
                              <rect
                                x={clampedX}
                                y={clampedY}
                                width={popW}
                                height={popH}
                                rx={isMobile ? 5 : 6}
                                fill={inspBg}
                                stroke={inspBorder}
                                strokeWidth={1.2}
                                style={{ filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.7))` }}
                              />
                              <text
                                x={clampedX + popW / 2}
                                y={clampedY + (isMobile ? 11 : 13)}
                                textAnchor="middle"
                                fontSize={isMobile ? 7.5 : 9}
                                fontWeight="800"
                                fill={inspColor}
                                fontFamily="system-ui, -apple-system, sans-serif"
                                style={{ userSelect: "none" }}
                              >
                                {inspName}
                              </text>
                              <text
                                x={clampedX + popW / 2}
                                y={clampedY + (isMobile ? 21 : 25)}
                                textAnchor="middle"
                                fontSize={isMobile ? 6.5 : 7.5}
                                fontWeight="600"
                                fill="rgba(245,240,232,0.5)"
                                fontFamily="system-ui, -apple-system, sans-serif"
                                style={{ userSelect: "none" }}
                              >
                                jugada #{tileIdx + 1} · {pt.tile[0]}·{pt.tile[1]}
                              </text>
                            </motion.g>
                          );
                        })()}
                      </motion.g>
                    );
                  })}
                </AnimatePresence>

                {/* Ghost tile previews */}
                <AnimatePresence>
                  {showPlacementOptions &&
                    (["left", "right"] as const).map((end) => {
                      const ghost = ghostTiles[end];
                      if (!ghost) return null;

                      const isH = ghost.orientation === "horizontal";
                      const tw = isH
                        ? (ghost.isDouble ? dims.doubleH : dims.horizW)
                        : (ghost.isDouble ? dims.doubleW : dims.horizH);
                      const th = isH
                        ? (ghost.isDouble ? dims.doubleW : dims.horizH)
                        : (ghost.isDouble ? dims.doubleH : dims.horizW);
                      const isHovered = hoveredEnd === end;
                      // Hit area padding for easier touch/click
                      const hitPad = isMobile ? 10 : 6;

                      return (
                        <motion.g
                          key={`ghost-${end}`}
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Colocar ficha en el extremo ${end === "left" ? "izquierdo" : "derecho"}`}
                          style={{
                            transformOrigin: `${ghost.x}px ${ghost.y}px`,
                            cursor: "pointer",
                            outline: "none", // focus ring drawn manually below
                          }}
                          onClick={() => { onPlaceEnd?.(end); setHoveredEnd(null); }}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onPlaceEnd?.(end);
                              setHoveredEnd(null);
                              setFocusedEnd(null);
                            }
                          }}
                          onFocus={() => setFocusedEnd(end)}
                          onBlur={() => setFocusedEnd(null)}
                          onMouseEnter={() => setHoveredEnd(end)}
                          onMouseLeave={() => setHoveredEnd(null)}
                          onTouchStart={() => setHoveredEnd(end)}
                          onTouchEnd={() => { onPlaceEnd?.(end); setHoveredEnd(null); }}
                        >
                          {/* Invisible enlarged hit area */}
                          <rect
                            x={ghost.x - tw / 2 - hitPad}
                            y={ghost.y - th / 2 - hitPad}
                            width={tw + hitPad * 2}
                            height={th + hitPad * 2}
                            fill="transparent"
                          />
                          {/* Outer glow blur */}
                          <motion.rect
                            x={ghost.x - tw / 2 - 8}
                            y={ghost.y - th / 2 - 8}
                            width={tw + 16}
                            height={th + 16}
                            rx={8}
                            fill={isHovered ? "rgba(201,168,76,0.25)" : "rgba(201,168,76,0.12)"}
                            stroke="none"
                            animate={{ opacity: isHovered ? [0.7, 1, 0.7] : [0.4, 0.8, 0.4] }}
                            transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                            style={{ filter: "blur(4px)" }}
                          />
                          {/* Keyboard focus ring */}
                          {focusedEnd === end && (
                            <rect
                              x={ghost.x - tw / 2 - 6}
                              y={ghost.y - th / 2 - 6}
                              width={tw + 12}
                              height={th + 12}
                              rx={7}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth={2.5}
                              strokeDasharray="none"
                              opacity={0.9}
                            />
                          )}
                          {/* Dashed border */}
                          <motion.rect
                            x={ghost.x - tw / 2 - 4}
                            y={ghost.y - th / 2 - 4}
                            width={tw + 8}
                            height={th + 8}
                            rx={5}
                            fill={isHovered ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.05)"}
                            stroke="#c9a84c"
                            strokeWidth={isHovered ? 2.5 : 1.8}
                            strokeDasharray="5 3"
                            animate={{
                              opacity: isHovered ? [0.9, 1, 0.9] : [0.5, 0.85, 0.5],
                              strokeDashoffset: [0, -16],
                            }}
                            transition={{
                              opacity: { duration: 1.0, repeat: Infinity, ease: "easeInOut" },
                              strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: "linear" },
                            }}
                            style={{ filter: isHovered ? "drop-shadow(0 0 10px rgba(201,168,76,0.8))" : "drop-shadow(0 0 4px rgba(201,168,76,0.4))" }}
                          />
                          {/* Ghost tile */}
                          <foreignObject
                            x={ghost.x - tw / 2}
                            y={ghost.y - th / 2}
                            width={tw}
                            height={th}
                            style={{ opacity: isHovered ? 0.96 : 0.82, pointerEvents: "none" }}
                          >
                            <DominoTile
                              tile={ghost.tile}
                              size="small"
                              orientation={ghost.orientation}
                            />
                          </foreignObject>
                          {/* Direction label badge */}
                          <motion.g style={{ pointerEvents: "none" }}>
                            <motion.rect
                              x={ghost.x - (isMobile ? 17 : 21)}
                              y={ghost.y - th / 2 - (isMobile ? 17 : 21)}
                              width={isMobile ? 34 : 42}
                              height={isMobile ? 13 : 15}
                              rx={isMobile ? 4 : 5}
                              fill={isHovered ? "rgba(201,168,76,0.95)" : "rgba(201,168,76,0.72)"}
                              animate={{ opacity: isHovered ? [0.88, 1, 0.88] : [0.55, 0.82, 0.55] }}
                              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                              style={{ filter: isHovered ? "drop-shadow(0 0 7px rgba(201,168,76,0.9))" : "drop-shadow(0 0 3px rgba(201,168,76,0.5))" }}
                            />
                            <text
                              x={ghost.x}
                              y={ghost.y - th / 2 - (isMobile ? 7 : 9)}
                              textAnchor="middle"
                              fontSize={isMobile ? 7 : 8}
                              fontWeight="bold"
                              fill="#2a1a0a"
                              fontFamily="system-ui, -apple-system, sans-serif"
                              style={{ userSelect: "none" }}
                            >
                              {end === "left" ? "← Izq" : "Der →"}
                            </text>
                          </motion.g>
                        </motion.g>
                      );
                    })}
                </AnimatePresence>
              </svg>
            )}

            {/* End value badges — show current open numbers at each end */}
            {board.plays.length > 0 && board.left !== null && board.right !== null && (
              <>
                <motion.div
                  key={`left-${board.left}`}
                  initial={{ opacity: 0, scale: 0.7, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="absolute bottom-2 left-2 z-10 pointer-events-none"
                  aria-hidden="true"
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #2a1a08 0%, #1a0e04 100%)",
                      border: "1.5px solid rgba(201,168,76,0.55)",
                      borderRadius: "8px",
                      padding: isMobile ? "3px 5px" : "4px 7px",
                      boxShadow: "0 0 12px rgba(201,168,76,0.2), 0 2px 8px rgba(0,0,0,0.7)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: isMobile ? 8 : 9, color: "rgba(201,168,76,0.55)", fontWeight: 700, lineHeight: 1 }}>←</span>
                      <span style={{ fontSize: isMobile ? 15 : 18, color: "#c9a84c", fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }}>{board.left}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  key={`right-${board.right}`}
                  initial={{ opacity: 0, scale: 0.7, x: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="absolute bottom-2 right-2 z-10 pointer-events-none"
                  aria-hidden="true"
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #2a1a08 0%, #1a0e04 100%)",
                      border: "1.5px solid rgba(201,168,76,0.55)",
                      borderRadius: "8px",
                      padding: isMobile ? "3px 5px" : "4px 7px",
                      boxShadow: "0 0 12px rgba(201,168,76,0.2), 0 2px 8px rgba(0,0,0,0.7)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: isMobile ? 15 : 18, color: "#c9a84c", fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }}>{board.right}</span>
                      <span style={{ fontSize: isMobile ? 8 : 9, color: "rgba(201,168,76,0.55)", fontWeight: 700, lineHeight: 1 }}>→</span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
