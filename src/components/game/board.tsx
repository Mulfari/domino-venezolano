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
              92deg,
              transparent,
              transparent 14px,
              rgba(0,0,0,0.07) 14px,
              rgba(0,0,0,0.07) 16px
            ),
            repeating-linear-gradient(
              88deg,
              transparent,
              transparent 5px,
              rgba(255,255,255,0.03) 5px,
              rgba(255,255,255,0.03) 6px
            ),
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 22px,
              rgba(0,0,0,0.04) 22px,
              rgba(0,0,0,0.04) 24px
            ),
            linear-gradient(180deg,
              #b07d4a 0%,
              #8a5c2e 4%,
              #5c3818 12%,
              #7a4f2a 22%,
              #3a2210 38%,
              #4a2e14 50%,
              #6b4020 62%,
              #3a2210 72%,
              #5c3818 82%,
              #7a4f2a 92%,
              #9a6b3e 100%
            )
          `,
          boxShadow: `
            0 24px 70px rgba(0,0,0,0.9),
            0 10px 30px rgba(0,0,0,0.6),
            inset 0 3px 0 rgba(255,255,255,0.18),
            inset 0 -3px 0 rgba(0,0,0,0.55),
            inset 3px 0 0 rgba(255,255,255,0.09),
            inset -3px 0 0 rgba(0,0,0,0.45),
            inset 0 1px 8px rgba(255,255,255,0.06)
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
              /* Fieltro casino: fibra fina + trama cruzada + gradiente de profundidad */
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.028) 2px,
                  rgba(0,0,0,0.028) 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.018) 2px,
                  rgba(255,255,255,0.018) 3px
                ),
                repeating-linear-gradient(
                  47deg,
                  transparent,
                  transparent 1px,
                  rgba(255,255,255,0.048) 1px,
                  rgba(255,255,255,0.048) 2px
                ),
                repeating-linear-gradient(
                  -47deg,
                  transparent,
                  transparent 1px,
                  rgba(0,0,0,0.062) 1px,
                  rgba(0,0,0,0.062) 2px
                ),
                repeating-linear-gradient(
                  43deg,
                  transparent,
                  transparent 3px,
                  rgba(255,255,255,0.022) 3px,
                  rgba(255,255,255,0.022) 4px
                ),
                repeating-linear-gradient(
                  -43deg,
                  transparent,
                  transparent 3px,
                  rgba(0,0,0,0.028) 3px,
                  rgba(0,0,0,0.028) 4px
                ),
                radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.18) 0%, transparent 38%),
                radial-gradient(ellipse at 62% 68%, rgba(0,0,0,0.28) 0%, transparent 36%),
                radial-gradient(ellipse at 50% 48%, rgba(30,110,62,0.45) 0%, transparent 52%),
                radial-gradient(ellipse at center, #1f7040 0%, #175c32 25%, #0f4022 55%, #082010 100%)
              `,
              /* Sombra interna: canal hundido con luz cenital */
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.70),
                inset 0 8px 28px rgba(0,0,0,0.90),
                inset 0 -8px 28px rgba(0,0,0,0.65),
                inset 8px 0 28px rgba(0,0,0,0.60),
                inset -8px 0 28px rgba(0,0,0,0.60),
                inset 0 0 80px rgba(0,0,0,0.45),
                inset 0 2px 6px rgba(255,255,255,0.06),
                inset 0 1px 0 rgba(255,255,255,0.08)
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
            {board.plays.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-emerald-200/70 text-sm font-medium" aria-live="polite">
                  {isMyTurn ? "Juega tu primera ficha" : "Esperando primera jugada..."}
                </p>
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
                          {/* "Place here" dot indicator */}
                          <motion.g style={{ pointerEvents: "none" }}>
                            <motion.circle
                              cx={ghost.x}
                              cy={ghost.y + th / 2 + (isMobile ? 9 : 11)}
                              r={isMobile ? 4 : 5}
                              fill="#c9a84c"
                              animate={{ opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 0.85, 0.4], scale: isHovered ? [1, 1.25, 1] : [0.9, 1.1, 0.9] }}
                              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                              style={{ filter: isHovered ? "drop-shadow(0 0 5px #c9a84c)" : undefined }}
                            />
                            <motion.line
                              x1={ghost.x - (isMobile ? 2.5 : 3)}
                              y1={ghost.y + th / 2 + (isMobile ? 9 : 11)}
                              x2={ghost.x + (isMobile ? 2.5 : 3)}
                              y2={ghost.y + th / 2 + (isMobile ? 9 : 11)}
                              stroke="#2a1a0a"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              animate={{ opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 0.85, 0.4] }}
                              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.line
                              x1={ghost.x}
                              y1={ghost.y + th / 2 + (isMobile ? 6 : 8)}
                              x2={ghost.x}
                              y2={ghost.y + th / 2 + (isMobile ? 12 : 14)}
                              stroke="#2a1a0a"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              animate={{ opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 0.85, 0.4] }}
                              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                            />
                          </motion.g>
                        </motion.g>
                      );
                    })}
                </AnimatePresence>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
