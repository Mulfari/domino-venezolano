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
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 400 });
  const [hoveredEnd, setHoveredEnd] = useState<"left" | "right" | null>(null);
  const [focusedEnd, setFocusedEnd] = useState<"left" | "right" | null>(null);
  const isMobile = useIsMobile();
  const dims = isMobile ? DIMS_MOBILE : DIMS_DESKTOP;

  const isMyTurn = isMyTurnFn();
  const validMoves = validMovesFn();
  const showPlacementOptions = selectedTile !== null && isMyTurn && board.plays.length > 0;

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

  useEffect(() => {
    if (board.plays.length === 0) {
      prevLastKeyRef.current = null;
      return;
    }
    const idx = board.plays.length - 1;
    const lastPlay = board.plays[idx];
    const lastKey = `${lastPlay.tile[0]}-${lastPlay.tile[1]}-${lastPlay.end}-${idx}`;
    if (lastKey !== prevLastKeyRef.current) {
      prevLastKeyRef.current = lastKey;
      setAnimatingKey(lastKey);
    }
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

  const viewBox = `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`;

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
                    className="absolute bottom-2 left-2 z-20 pointer-events-none"
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
                  {/* Decorative domino silhouette */}
                  <motion.svg
                    width={isMobile ? 36 : 44}
                    height={isMobile ? 64 : 80}
                    viewBox="0 0 44 80"
                    fill="none"
                    aria-hidden="true"
                    animate={{ opacity: [0.18, 0.38, 0.18] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <rect x="2" y="2" width="40" height="76" rx="6" stroke="rgba(201,168,76,0.5)" strokeWidth="2" fill="rgba(201,168,76,0.04)" />
                    <line x1="2" y1="40" x2="42" y2="40" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" />
                    <circle cx="22" cy="20" r="4" fill="rgba(201,168,76,0.35)" />
                    <circle cx="13" cy="58" r="3" fill="rgba(201,168,76,0.3)" />
                    <circle cx="22" cy="58" r="3" fill="rgba(201,168,76,0.3)" />
                    <circle cx="31" cy="58" r="3" fill="rgba(201,168,76,0.3)" />
                  </motion.svg>

                  {/* Status text */}
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
                        <span className="text-[10px] sm:text-[11px] text-[#a8c4a0]/55 uppercase tracking-wider">
                          Juega la primera ficha
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#a8c4a0]/60 uppercase tracking-widest">
                          Esperando...
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#a8c4a0]/35 uppercase tracking-wider">
                          Primera jugada
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <svg
                width="100%"
                height="100%"
                viewBox={viewBox}
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
                        initial={isNew ? { scale: 0 } : false}
                        animate={isNew ? { scale: 1 } : undefined}
                        exit={clearing ? { scale: 0, opacity: 0, transition: { duration: 0.25, delay: exitDelay, ease: "easeIn" } } : undefined}
                        transition={isNew ? { type: "spring", stiffness: 380, damping: 18 } : undefined}
                        style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                      >
                        {/* Fading "just played" glow — one-shot, fades out over 2.5s */}
                        {isNew && (
                          <>
                            <motion.rect
                              x={pt.x - tw / 2 - 9}
                              y={pt.y - th / 2 - 9}
                              width={tw + 18}
                              height={th + 18}
                              rx={8}
                              fill="rgba(201,168,76,0.22)"
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
                              stroke="#c9a84c"
                              strokeWidth={2.5}
                              initial={{ opacity: 0.95 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 2.0, delay: 0.2, ease: "easeOut" }}
                              style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.9))" }}
                            />
                          </>
                        )}
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
                        <foreignObject
                          x={pt.x - tw / 2}
                          y={pt.y - th / 2}
                          width={tw}
                          height={th}
                        >
                          <DominoTile
                            tile={pt.tile}
                            size="small"
                            orientation={pt.orientation}
                          />
                        </foreignObject>
                        {/* Team dot — tiny colored circle showing which player placed this tile */}
                        {board.plays[tileIdx] && (
                          <circle
                            cx={pt.x + tw / 2 - (isMobile ? 2.5 : 3)}
                            cy={pt.y - th / 2 + (isMobile ? 2.5 : 3)}
                            r={isMobile ? 1.8 : 2.2}
                            fill={(board.plays[tileIdx].seat % 2) === 0 ? "#c9a84c" : "#4ca8c9"}
                            opacity={0.88}
                            style={{ filter: `drop-shadow(0 0 2px ${(board.plays[tileIdx].seat % 2) === 0 ? "rgba(201,168,76,0.9)" : "rgba(76,168,201,0.9)"})` }}
                          />
                        )}
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
