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

export const DIMS_DESKTOP: TileDims = { horizW: 40, horizH: 22, doubleW: 22, doubleH: 40, gap: 4 };
export const DIMS_MOBILE: TileDims = { horizW: 32, horizH: 18, doubleW: 18, doubleH: 32, gap: 3 };

function isHoriz(dir: Dir): boolean {
  return dir === "right" || dir === "left";
}

export function tileSize(isDouble: boolean, dir: Dir, dims: TileDims): { w: number; h: number } {
  if (isDouble) return isHoriz(dir) ? { w: dims.doubleW, h: dims.doubleH } : { w: dims.doubleH, h: dims.doubleW };
  return isHoriz(dir) ? { w: dims.horizW, h: dims.horizH } : { w: dims.horizH, h: dims.horizW };
}

export function tileOrientation(isDouble: boolean, dir: Dir): "horizontal" | "vertical" {
  if (isDouble) return isHoriz(dir) ? "vertical" : "horizontal";
  return isHoriz(dir) ? "horizontal" : "vertical";
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
  const margin = 10;

  for (let i = 0; i < tiles.length; i++) {
    const entry = tiles[i];
    let sz = tileSize(entry.isDouble, dir, dims);
    const mainDim = isHoriz(dir) ? sz.w : sz.h;
    let center = advance(cx, cy, dir, mainDim / 2 + dims.gap);

    if (wouldOverflow(center.x, center.y, sz.w, sz.h, boardW, boardH, margin)) {
      const newDir = turnFn(dir);
      const newSz = tileSize(entry.isDouble, newDir, dims);

      const prevCrossDim = isHoriz(dir) ? sz.h : sz.w;
      const newCrossDim = isHoriz(newDir) ? newSz.h : newSz.w;
      const crossOffset = prevCrossDim / 2 + dims.gap * 2 + newCrossDim / 2;

      const shifted = advance(cx, cy, newDir, crossOffset);
      cx = shifted.x;
      cy = shifted.y;
      dir = newDir;
      sz = newSz;

      const newMainDim = isHoriz(dir) ? sz.w : sz.h;
      center = advance(cx, cy, dir, newMainDim / 2 + dims.gap);
    }

    placed.push({
      ...entry,
      x: center.x,
      y: center.y,
      orientation: tileOrientation(entry.isDouble, dir),
    });

    const halfMain = (isHoriz(dir) ? sz.w : sz.h) / 2;
    const next = advance(center.x, center.y, dir, halfMain);
    cx = next.x;
    cy = next.y;
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

  const centerX = boardW / 2;
  const centerY = boardH / 2;
  const firstEntry = rightChain[0];
  const firstSz = tileSize(firstEntry.isDouble, "right", dims);

  const firstPlaced: PlacedTile = {
    ...firstEntry,
    x: centerX,
    y: centerY,
    orientation: tileOrientation(firstEntry.isDouble, "right"),
  };

  // Right chain: right -> up -> left (turnLeft)
  const rightTiles = rightChain.length > 1
    ? layoutChain(
        rightChain.slice(1),
        centerX + firstSz.w / 2,
        centerY,
        "right",
        boardW, boardH, dims, turnLeft
      )
    : [];

  // Left chain: left -> down -> right (turnLeft)
  const leftTiles = leftChain.length > 0
    ? layoutChain(
        [...leftChain].reverse(),
        centerX - firstSz.w / 2,
        centerY,
        "left",
        boardW, boardH, dims, turnLeft
      )
    : [];

  return [...leftTiles.reverse(), firstPlaced, ...rightTiles];
}
