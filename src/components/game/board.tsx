"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface PlacedTile extends TileEntry {
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
}

type Dir = "right" | "down" | "left" | "up";

const DIMS_DESKTOP = { horizW: 52, horizH: 28, doubleW: 28, doubleH: 52, gap: 2 };
const DIMS_MOBILE = { horizW: 38, horizH: 20, doubleW: 20, doubleH: 38, gap: 2 };

function tileSize(isDouble: boolean, dir: Dir, dims: typeof DIMS_DESKTOP) {
  const horiz = dir === "right" || dir === "left";
  if (isDouble) return horiz ? { w: dims.doubleW, h: dims.doubleH } : { w: dims.doubleH, h: dims.doubleW };
  return horiz ? { w: dims.horizW, h: dims.horizH } : { w: dims.horizH, h: dims.horizW };
}

function tileOrientation(isDouble: boolean, dir: Dir): "horizontal" | "vertical" {
  const horiz = dir === "right" || dir === "left";
  if (isDouble) return horiz ? "vertical" : "horizontal";
  return horiz ? "horizontal" : "vertical";
}

function turnRight(dir: Dir): Dir {
  const turns: Record<Dir, Dir> = { right: "down", down: "left", left: "up", up: "right" };
  return turns[dir];
}

function turnLeft(dir: Dir): Dir {
  const turns: Record<Dir, Dir> = { right: "up", up: "left", left: "down", down: "right" };
  return turns[dir];
}

function advance(x: number, y: number, dir: Dir, amount: number): { x: number; y: number } {
  switch (dir) {
    case "right": return { x: x + amount, y };
    case "left": return { x: x - amount, y };
    case "down": return { x, y: y + amount };
    case "up": return { x, y: y - amount };
  }
}

function wouldOverflow(x: number, y: number, w: number, h: number, boardW: number, boardH: number, margin: number): boolean {
  return x - w / 2 < margin || x + w / 2 > boardW - margin || y - h / 2 < margin || y + h / 2 > boardH - margin;
}

function layoutChain(
  tiles: TileEntry[],
  startX: number,
  startY: number,
  startDir: Dir,
  boardW: number,
  boardH: number,
  dims: typeof DIMS_DESKTOP,
  turnFn: (d: Dir) => Dir
): PlacedTile[] {
  if (tiles.length === 0) return [];
  const placed: PlacedTile[] = [];
  let dir = startDir;
  let cx = startX;
  let cy = startY;
  const margin = 6;

  for (let i = 0; i < tiles.length; i++) {
    const entry = tiles[i];
    let sz = tileSize(entry.isDouble, dir, dims);
    const stepAxis = dir === "right" || dir === "left" ? sz.w : sz.h;
    const step = stepAxis / 2 + dims.gap;
    let next = advance(cx, cy, dir, step);

    if (wouldOverflow(next.x, next.y, sz.w, sz.h, boardW, boardH, margin)) {
      const newDir = turnFn(dir);
      sz = tileSize(entry.isDouble, newDir, dims);
      const prevSz = i > 0 ? tileSize(tiles[i - 1].isDouble, dir, dims) : sz;
      const offsetFromPrev = (dir === "right" || dir === "left" ? prevSz.h : prevSz.w) / 2 + dims.gap + (newDir === "right" || newDir === "left" ? sz.h : sz.w) / 2;
      const cornerBase = advance(cx, cy, newDir, offsetFromPrev);
      const newStep = (newDir === "right" || newDir === "left" ? sz.w : sz.h) / 2;
      next = advance(cornerBase.x, cornerBase.y, newDir, newStep - (newDir === "right" || newDir === "left" ? sz.w : sz.h) / 2);
      dir = newDir;
      cx = next.x;
      cy = next.y;
    } else {
      cx = next.x;
      cy = next.y;
    }

    placed.push({ ...entry, x: cx, y: cy, orientation: tileOrientation(entry.isDouble, dir) });

    const halfStep = (dir === "right" || dir === "left" ? sz.w : sz.h) / 2;
    const pos = advance(cx, cy, dir, halfStep);
    cx = pos.x;
    cy = pos.y;
  }

  return placed;
}

export function Board({ onPlaceEnd }: BoardProps) {
  const board = useGameStore((s) => s.board);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const isMyTurnFn = useGameStore((s) => s.isMyTurn);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 300 });
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

  const placedTiles = useMemo(() => {
    if (board.plays.length === 0) return [];

    const rightChain: TileEntry[] = [];
    const leftChain: TileEntry[] = [];

    for (const play of board.plays) {
      const t = play.tile;
      const isDouble = t[0] === t[1];
      const key = `${t[0]}-${t[1]}-${play.end}-${rightChain.length + leftChain.length}`;
      if (play.end === "right" || board.plays.indexOf(play) === 0) {
        rightChain.push({ tile: t, isDouble, key });
      } else {
        leftChain.unshift({ tile: t, isDouble, key });
      }
    }

    const boardW = size.w;
    const boardH = size.h;
    const cx = boardW / 2;
    const cy = boardH / 2;

    const firstEntry = rightChain[0];
    const firstSz = tileSize(firstEntry.isDouble, "right", dims);

    const rightTiles = rightChain.length > 1
      ? layoutChain(rightChain.slice(1), cx + firstSz.w / 2, cy, "right", boardW, boardH, dims, turnRight)
      : [];

    const leftTiles = leftChain.length > 0
      ? layoutChain(leftChain.reverse(), cx - firstSz.w / 2, cy, "left", boardW, boardH, dims, turnLeft)
      : [];

    const firstPlaced: PlacedTile = {
      ...firstEntry,
      x: cx,
      y: cy,
      orientation: tileOrientation(firstEntry.isDouble, "right"),
    };

    return [...leftTiles.reverse(), firstPlaced, ...rightTiles];
  }, [board.plays, size.w, size.h, dims]);

  const allBounds = placedTiles.length > 0 ? placedTiles.reduce(
    (acc, t) => {
      const isH = t.orientation === "horizontal";
      const tw = isH ? (t.isDouble ? dims.doubleH : dims.horizW) : (t.isDouble ? dims.doubleW : dims.horizH);
      const th = isH ? (t.isDouble ? dims.doubleW : dims.horizH) : (t.isDouble ? dims.doubleH : dims.horizW);
      return {
        minX: Math.min(acc.minX, t.x - tw / 2),
        maxX: Math.max(acc.maxX, t.x + tw / 2),
        minY: Math.min(acc.minY, t.y - th / 2),
        maxY: Math.max(acc.maxY, t.y + th / 2),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  ) : null;

  const viewBox = allBounds
    ? `${allBounds.minX - 10} ${allBounds.minY - 10} ${allBounds.maxX - allBounds.minX + 20} ${allBounds.maxY - allBounds.minY + 20}`
    : `0 0 ${size.w} ${size.h}`;

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border border-amber-900/30 overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          maxHeight: "100%",
          maxWidth: "100%",
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
            <AnimatePresence>
              {placedTiles.map((pt) => {
                const isH = pt.orientation === "horizontal";
                const tw = isH ? (pt.isDouble ? dims.doubleH : dims.horizW) : (pt.isDouble ? dims.doubleW : dims.horizH);
                const th = isH ? (pt.isDouble ? dims.doubleW : dims.horizH) : (pt.isDouble ? dims.doubleH : dims.horizW);
                return (
                  <motion.foreignObject
                    key={pt.key}
                    x={pt.x - tw / 2}
                    y={pt.y - th / 2}
                    width={tw}
                    height={th}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <DominoTile
                      tile={pt.tile}
                      size="small"
                      orientation={pt.orientation}
                    />
                  </motion.foreignObject>
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
              className="px-4 py-2 rounded-lg bg-amber-700/90 text-amber-100 text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg"
              onClick={() => onPlaceEnd?.("left")}
            >
              ← Izquierda ({board.left})
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 rounded-lg bg-amber-700/90 text-amber-100 text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg"
              onClick={() => onPlaceEnd?.("right")}
            >
              Derecha ({board.right}) →
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
