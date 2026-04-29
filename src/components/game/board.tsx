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

  const placedTiles = useMemo(
    () => buildPlacedTiles(board.plays, BOARD_SIZE, BOARD_SIZE, dims),
    [board.plays, BOARD_SIZE, dims]
  );

  const viewBox = `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`;

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        className="relative rounded-xl border border-amber-900/30 overflow-hidden"
        style={{
          width: "100%",
          maxWidth: `${BOARD_SIZE}px`,
          aspectRatio: "1 / 1",
          background: "radial-gradient(ellipse at center, #1a5c35 0%, #14472a 60%, #0f3520 100%)",
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
            {placedTiles.map((pt) => {
              const isH = pt.orientation === "horizontal";
              const tw = isH
                ? (pt.isDouble ? dims.doubleH : dims.horizW)
                : (pt.isDouble ? dims.doubleW : dims.horizH);
              const th = isH
                ? (pt.isDouble ? dims.doubleW : dims.horizH)
                : (pt.isDouble ? dims.doubleH : dims.horizW);
              return (
                <foreignObject
                  key={pt.key}
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
              );
            })}
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
  );
}
