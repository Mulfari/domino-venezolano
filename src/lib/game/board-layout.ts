import type { Tile, PlayedTile } from "./types";

export interface TileEntry {
  tile: Tile;
  isDouble: boolean;
  key: string;
}

export interface PlacedTile extends TileEntry {
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
}

export type Dir = "right" | "down" | "left" | "up";

export interface TileDims {
  horizW: number;
  horizH: number;
  doubleW: number;
  doubleH: number;
  gap: number;
}

export const DIMS_DESKTOP: TileDims = { horizW: 44, horizH: 22, doubleW: 22, doubleH: 44, gap: 2 };
export const DIMS_MOBILE: TileDims = { horizW: 32, horizH: 16, doubleW: 16, doubleH: 32, gap: 2 };

export function tileSize(isDouble: boolean, dir: Dir, dims: TileDims) {
  const horiz = dir === "right" || dir === "left";
  if (isDouble) return horiz ? { w: dims.doubleW, h: dims.doubleH } : { w: dims.doubleH, h: dims.doubleW };
  return horiz ? { w: dims.horizW, h: dims.horizH } : { w: dims.horizH, h: dims.horizW };
}

export function tileOrientation(isDouble: boolean, dir: Dir): "horizontal" | "vertical" {
  const horiz = dir === "right" || dir === "left";
  if (isDouble) return horiz ? "vertical" : "horizontal";
  return horiz ? "horizontal" : "vertical";
}

export function turnRight(dir: Dir): Dir {
  const turns: Record<Dir, Dir> = { right: "down", down: "left", left: "up", up: "right" };
  return turns[dir];
}

export function turnLeft(dir: Dir): Dir {
  const turns: Record<Dir, Dir> = { right: "up", up: "left", left: "down", down: "right" };
  return turns[dir];
}

export function advance(x: number, y: number, dir: Dir, amount: number): { x: number; y: number } {
  switch (dir) {
    case "right": return { x: x + amount, y };
    case "left": return { x: x - amount, y };
    case "down": return { x, y: y + amount };
    case "up": return { x, y: y - amount };
  }
}

export function wouldOverflow(x: number, y: number, w: number, h: number, boardW: number, boardH: number, margin: number): boolean {
  return x - w / 2 < margin || x + w / 2 > boardW - margin || y - h / 2 < margin || y + h / 2 > boardH - margin;
}

export function layoutChain(
  tiles: TileEntry[],
  startX: number,
  startY: number,
  startDir: Dir,
  boardW: number,
  boardH: number,
  dims: TileDims,
  turnFn: (d: Dir) => Dir
): PlacedTile[] {
  if (tiles.length === 0) return [];
  const placed: PlacedTile[] = [];
  let dir = startDir;
  let cx = startX;
  let cy = startY;
  const margin = 8;

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
      const crossPrev = dir === "right" || dir === "left" ? prevSz.h : prevSz.w;
      const crossNew = newDir === "right" || newDir === "left" ? sz.h : sz.w;
      const offsetFromPrev = crossPrev / 2 + dims.gap + crossNew / 2;
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

export function buildPlacedTiles(
  plays: PlayedTile[],
  boardW: number,
  boardH: number,
  dims: TileDims
): PlacedTile[] {
  if (plays.length === 0) return [];

  const rightChain: TileEntry[] = [];
  const leftChain: TileEntry[] = [];

  for (let i = 0; i < plays.length; i++) {
    const play = plays[i];
    const t = play.tile;
    const isDouble = t[0] === t[1];
    const key = `${t[0]}-${t[1]}-${play.end}-${i}`;
    if (i === 0 || play.end === "right") {
      rightChain.push({ tile: t, isDouble, key });
    } else {
      leftChain.unshift({ tile: t, isDouble, key });
    }
  }

  const cx = boardW / 2;
  const cy = boardH / 2;
  const firstEntry = rightChain[0];
  const firstSz = tileSize(firstEntry.isDouble, "right", dims);

  const rightTiles = rightChain.length > 1
    ? layoutChain(rightChain.slice(1), cx + firstSz.w / 2, cy, "right", boardW, boardH, dims, turnRight)
    : [];

  const leftTiles = leftChain.length > 0
    ? layoutChain([...leftChain].reverse(), cx - firstSz.w / 2, cy, "left", boardW, boardH, dims, turnLeft)
    : [];

  const firstPlaced: PlacedTile = {
    ...firstEntry,
    x: cx,
    y: cy,
    orientation: tileOrientation(firstEntry.isDouble, "right"),
  };

  return [...leftTiles.reverse(), firstPlaced, ...rightTiles];
}
