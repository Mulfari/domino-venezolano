"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPlacedTiles, DIMS_DESKTOP, DIMS_MOBILE } from "@/lib/game/board-layout";

interface BoardProps {
  onPlaceEnd?: (end: "left" | "right") => void;
}

export function Board({ onPlaceEnd }: BoardProps) {
  const board = useGameStore((s) => s.board);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 400 });
  const isMobile = useIsMobile();
  const dims = isMobile ? DIMS_MOBILE : DIMS_DESKTOP;

  const isMyTurn = isMyTurnFn();
  const showPlacementOptions = selectedTile !== null && isMyTurn;

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

  const viewBox = `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`;

  return (
    <div ref={containerRef} className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
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
              rgba(0,0,0,0.06) 18px,
              rgba(0,0,0,0.06) 20px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 6px,
              rgba(255,255,255,0.025) 6px,
              rgba(255,255,255,0.025) 7px
            ),
            linear-gradient(180deg,
              #9a6b3e 0%,
              #7a4f2a 6%,
              #4a2e14 18%,
              #6b4020 35%,
              #3a2210 55%,
              #5c3818 72%,
              #4a2e14 85%,
              #7a4f2a 94%,
              #8b5e3c 100%
            )
          `,
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.85),
            0 8px 24px rgba(0,0,0,0.55),
            inset 0 2px 0 rgba(255,255,255,0.14),
            inset 0 -2px 0 rgba(0,0,0,0.45),
            inset 2px 0 0 rgba(255,255,255,0.07),
            inset -2px 0 0 rgba(0,0,0,0.35)
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

        {/* Filete dorado */}
        <div
          style={{
            borderRadius: "10px",
            padding: "2px",
            background:
              "linear-gradient(135deg, #e8c96a 0%, #9b7820 20%, #c9a84c 45%, #f0d878 50%, #c9a84c 55%, #9b7820 80%, #e8c96a 100%)",
            boxShadow: "0 0 14px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
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
                  rgba(0,0,0,0.025) 1px,
                  rgba(0,0,0,0.025) 2px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 1px,
                  rgba(0,0,0,0.025) 1px,
                  rgba(0,0,0,0.025) 2px
                ),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 4px,
                  rgba(255,255,255,0.012) 4px,
                  rgba(255,255,255,0.012) 5px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 4px,
                  rgba(0,0,0,0.018) 4px,
                  rgba(0,0,0,0.018) 5px
                ),
                radial-gradient(ellipse at 35% 28%, rgba(255,255,255,0.09) 0%, transparent 48%),
                radial-gradient(ellipse at 70% 75%, rgba(0,0,0,0.12) 0%, transparent 40%),
                radial-gradient(ellipse at center, #1e6b3d 0%, #165230 45%, #0f3a22 75%, #0a2a18 100%)
              `,
              boxShadow: `
                inset 0 5px 22px rgba(0,0,0,0.72),
                inset 0 0 50px rgba(0,0,0,0.38),
                inset 5px 0 18px rgba(0,0,0,0.22),
                inset -5px 0 18px rgba(0,0,0,0.22),
                inset 0 -5px 18px rgba(0,0,0,0.22)
              `,
            }}
          >
            {board.plays.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-emerald-200/40 text-sm font-medium">
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
              >
                <AnimatePresence>
                  {placedTiles.map((pt) => {
                    const isH = pt.orientation === "horizontal";
                    const tw = isH
                      ? (pt.isDouble ? dims.doubleH : dims.horizW)
                      : (pt.isDouble ? dims.doubleW : dims.horizH);
                    const th = isH
                      ? (pt.isDouble ? dims.doubleW : dims.horizH)
                      : (pt.isDouble ? dims.doubleH : dims.horizW);
                    const isNew = pt.key === animatingKey;
                    return (
                      <motion.g
                        key={pt.key}
                        initial={isNew ? { scale: 0 } : false}
                        animate={isNew ? { scale: 1 } : undefined}
                        transition={isNew ? { type: "spring", stiffness: 380, damping: 18 } : undefined}
                        style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                      >
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
              </svg>
            )}

            {showPlacementOptions && board.plays.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-1.5 rounded-lg bg-amber-700/90 text-amber-100 text-xs font-medium hover:bg-amber-600 transition-colors shadow-lg"
                  onClick={() => onPlaceEnd?.("left")}
                >
                  Izq ({board.left})
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-1.5 rounded-lg bg-amber-700/90 text-amber-100 text-xs font-medium hover:bg-amber-600 transition-colors shadow-lg"
                  onClick={() => onPlaceEnd?.("right")}
                >
                  Der ({board.right})
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
