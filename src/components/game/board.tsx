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

  const BOARD_SIZE = isMobile ? 300 : 420;
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
      {/* Marco de madera */}
      <div
        style={{
          width: "100%",
          maxWidth: `${BOARD_SIZE + FRAME_PAD * 2 + 4}px`,
          borderRadius: "14px",
          padding: `${FRAME_PAD}px`,
          background:
            "linear-gradient(160deg, #7a4f2a 0%, #4a2e14 20%, #6b4020 45%, #3a2210 70%, #5c3818 100%)",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          border: "1px solid #8b5e3c",
        }}
      >
        {/* Filete dorado */}
        <div
          style={{
            borderRadius: "8px",
            padding: "2px",
            background:
              "linear-gradient(135deg, #c9a84c 0%, #8b6914 30%, #e8c96a 50%, #8b6914 70%, #c9a84c 100%)",
            boxShadow: "0 0 8px rgba(201,168,76,0.3)",
          }}
        >
          {/* Superficie de fieltro */}
          <div
            ref={containerRef}
            className="relative rounded-md overflow-hidden"
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.04) 2px,
                  rgba(0,0,0,0.04) 4px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.04) 2px,
                  rgba(0,0,0,0.04) 4px
                ),
                radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.07) 0%, transparent 55%),
                radial-gradient(ellipse at center, #1a5c35 0%, #14472a 60%, #0f3520 100%)
              `,
              boxShadow:
                "inset 0 3px 14px rgba(0,0,0,0.65), inset 0 0 32px rgba(0,0,0,0.3)",
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
                  ← Izq ({board.left})
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-1.5 rounded-lg bg-amber-700/90 text-amber-100 text-xs font-medium hover:bg-amber-600 transition-colors shadow-lg"
                  onClick={() => onPlaceEnd?.("right")}
                >
                  Der ({board.right}) →
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
