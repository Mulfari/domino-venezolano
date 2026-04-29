"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tile } from "@/lib/game/types";

interface BoardProps {
  onPlaceEnd?: (end: "left" | "right") => void;
}

interface TileEntry {
  tile: Tile;
  isDouble: boolean;
  key: string;
}

const DESKTOP = { horizW: 56, horizH: 30, doubleW: 30, doubleH: 56, gap: 3, rowGap: 6 };
const MOBILE = { horizW: 42, horizH: 22, doubleW: 22, doubleH: 42, gap: 2, rowGap: 4 };

export function Board({ onPlaceEnd }: BoardProps) {
  const board = useGameStore((s) => s.board);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const isMobile = useIsMobile();

  const isMyTurn = isMyTurnFn();
  const showPlacementOptions = selectedTile !== null && isMyTurn;
  const dims = isMobile ? MOBILE : DESKTOP;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  function buildOrientedChains(): { leftChain: TileEntry[]; rightChain: TileEntry[] } {
    if (board.plays.length === 0) return { leftChain: [], rightChain: [] };

    const leftChain: TileEntry[] = [];
    const rightChain: TileEntry[] = [];

    const firstPlay = board.plays[0];
    const isFirstDouble = firstPlay.tile[0] === firstPlay.tile[1];
    rightChain.push({ tile: firstPlay.tile, isDouble: isFirstDouble, key: `p0-${firstPlay.tile[0]}-${firstPlay.tile[1]}` });

    let runningLeft = firstPlay.tile[0];
    let runningRight = firstPlay.tile[1];

    for (let i = 1; i < board.plays.length; i++) {
      const play = board.plays[i];
      const { tile, end } = play;
      const isDouble = tile[0] === tile[1];
      const key = `p${i}-${tile[0]}-${tile[1]}`;

      if (end === "right") {
        if (tile[0] === runningRight) {
          rightChain.push({ tile, isDouble, key });
          runningRight = tile[1];
        } else {
          rightChain.push({ tile: [tile[1], tile[0]], isDouble, key });
          runningRight = tile[0];
        }
      } else {
        if (tile[1] === runningLeft) {
          leftChain.unshift({ tile, isDouble, key });
          runningLeft = tile[0];
        } else {
          leftChain.unshift({ tile: [tile[1], tile[0]], isDouble, key });
          runningLeft = tile[1];
        }
      }
    }

    return { leftChain, rightChain };
  }

  const { leftChain, rightChain } = buildOrientedChains();
  const allTiles = [...leftChain, ...rightChain];

  // Build snake rows
  const padding = 8;
  const usableWidth = containerWidth - padding * 2;

  const rows: { tiles: TileEntry[]; direction: "ltr" | "rtl" }[] = [];
  let currentRow: TileEntry[] = [];
  let currentWidth = 0;
  let direction: "ltr" | "rtl" = "ltr";

  for (const entry of allTiles) {
    const tileW = entry.isDouble ? dims.doubleW : dims.horizW;
    if (currentWidth + tileW > usableWidth && currentRow.length > 0) {
      rows.push({ tiles: currentRow, direction });
      currentRow = [];
      currentWidth = 0;
      direction = direction === "ltr" ? "rtl" : "ltr";
    }
    currentRow.push(entry);
    currentWidth += tileW + dims.gap;
  }
  if (currentRow.length > 0) {
    rows.push({ tiles: currentRow, direction });
  }

  const rowHeight = Math.max(dims.horizH, dims.doubleH);
  const lastTileIndex = allTiles.length - 1;
  let globalIndex = 0;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-h-0">
      <div ref={containerRef} className="relative w-full max-w-3xl mx-auto px-2 sm:px-4">
        <div className="absolute inset-0 -m-3 sm:-m-6 rounded-3xl bg-[#1e5c3a]/30 border border-[#c9a84c]/10" />

        {board.left !== null && board.right !== null && (
          <div className="relative flex items-center justify-between mb-1 px-1">
            <span className={`text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}>
              ← {board.left}
            </span>
            <span className={`text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded ${isMyTurn ? "bg-[#3a2210]/60 text-[#c9a84c] border border-[#c9a84c]/30" : "text-[#a8c4a0]/50"}`}>
              {board.right} →
            </span>
          </div>
        )}

        {/* Snake tile layout */}
        <div className="relative py-2 sm:py-3 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: `${rowHeight * 4 + dims.rowGap * 3 + 24}px` }}>
          <div className="flex flex-col items-center" style={{ gap: `${dims.rowGap}px` }}>
            {rows.map((row, ri) => {
              const rowElements = row.tiles.map((entry) => {
                const isLast = globalIndex === lastTileIndex;
                globalIndex++;
                return (
                  <motion.div
                    key={entry.key}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`flex-shrink-0 flex items-center justify-center ${isLast ? "ring-2 ring-[#c9a84c]/50 rounded" : ""}`}
                  >
                    <DominoTile
                      tile={entry.tile}
                      size="medium"
                      responsive
                      orientation={entry.isDouble ? "vertical" : "horizontal"}
                    />
                  </motion.div>
                );
              });

              return (
                <div
                  key={ri}
                  className={`flex items-center ${row.direction === "rtl" ? "flex-row-reverse" : "flex-row"}`}
                  style={{ gap: `${dims.gap}px`, minHeight: `${rowHeight}px`, paddingLeft: padding, paddingRight: padding }}
                >
                  {rowElements}
                </div>
              );
            })}

            {board.plays.length === 0 && (
              <p className="text-[#a8c4a0]/50 text-sm py-4">Mesa vacía</p>
            )}
          </div>
        </div>

        {/* Placement buttons */}
        <AnimatePresence>
          {showPlacementOptions && board.left !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="relative flex items-center justify-center gap-3 sm:gap-6 mt-1 sm:mt-2 pb-1"
            >
              <button
                onClick={() => onPlaceEnd?.("left")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3a2210] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#5c3a1e] active:scale-95 border-2 border-[#c9a84c]/40 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#c9a84c] transition-all shadow-lg shadow-[#c9a84c]/10"
              >
                <span className="text-lg">←</span>
                Izquierda ({board.left})
              </button>
              <button
                onClick={() => onPlaceEnd?.("right")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3a2210] to-[#4a2c0f] hover:from-[#4a2c0f] hover:to-[#5c3a1e] active:scale-95 border-2 border-[#c9a84c]/40 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#c9a84c] transition-all shadow-lg shadow-[#c9a84c]/10"
              >
                Derecha ({board.right})
                <span className="text-lg">→</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
