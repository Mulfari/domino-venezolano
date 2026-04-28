"use client";

import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tile as TileType } from "@/lib/game/types";

type TileSize = "small" | "medium" | "large";

interface TileProps {
  tile?: TileType;
  faceDown?: boolean;
  size?: TileSize;
  orientation?: "vertical" | "horizontal";
  clickable?: boolean;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  responsive?: boolean;
  onClick?: () => void;
}

// Vertical tiles: w < h (portrait orientation)
const sizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 20, h: 36, pip: 2.5, gap: 1 },
  medium: { w: 30, h: 56, pip: 3.5, gap: 2 },
  large: { w: 40, h: 76, pip: 4.5, gap: 2 },
};

const mobileSizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 16, h: 28, pip: 2, gap: 1 },
  medium: { w: 22, h: 42, pip: 2.5, gap: 1 },
  large: { w: 32, h: 58, pip: 3.5, gap: 2 },
};

function getPipPositions(value: number): [number, number][] {
  const positions: Record<number, [number, number][]> = {
    0: [],
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  return positions[value] ?? [];
}

function PipDots({ value, pipSize, halfWidth, halfHeight }: {
  value: number;
  pipSize: number;
  halfWidth: number;
  halfHeight: number;
}) {
  const positions = getPipPositions(value);
  const padX = halfWidth * 0.22;
  const padY = halfHeight * 0.18;
  const areaW = halfWidth - padX * 2;
  const areaH = halfHeight - padY * 2;

  return (
    <>
      {positions.map(([col, row], i) => (
        <circle
          key={i}
          cx={padX + (areaW * col) / 2}
          cy={padY + (areaH * row) / 2}
          r={pipSize}
          fill="#1a1a1a"
        />
      ))}
    </>
  );
}

export function DominoTile({
  tile,
  faceDown = false,
  size = "medium",
  orientation = "vertical",
  clickable = false,
  disabled = false,
  selected = false,
  highlight = false,
  responsive = false,
  onClick,
}: TileProps) {
  const isMobile = useIsMobile();
  const config = responsive && isMobile ? mobileSizeConfig : sizeConfig;
  const { w: baseW, h: baseH, pip, gap } = config[size];
  const borderRadius = size === "small" ? 3 : 4;

  const isHorizontal = orientation === "horizontal";
  const w = isHorizontal ? baseH : baseW;
  const h = isHorizontal ? baseW : baseH;

  const showFace = !faceDown && tile;

  return (
    <motion.div
      className={`inline-block ${clickable && !disabled ? "cursor-pointer" : ""}`}
      whileHover={clickable && !disabled ? { scale: 1.12, y: -6 } : undefined}
      whileTap={clickable && !disabled ? { scale: 0.95 } : undefined}
      animate={selected ? { y: -12, scale: 1.08 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={clickable && !disabled ? onClick : undefined}
      onKeyDown={clickable && !disabled ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={tile ? `Ficha ${tile[0]}-${tile[1]}${selected ? ", seleccionada" : ""}${disabled ? ", no jugable" : ""}` : faceDown ? "Ficha boca abajo" : undefined}
      aria-disabled={clickable && disabled ? true : undefined}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-md ${
          highlight ? "drop-shadow-[0_0_6px_rgba(201,168,76,0.6)]" : ""
        } ${disabled ? "opacity-40" : ""}`}
      >
        <rect
          x={0} y={0} width={w} height={h}
          rx={borderRadius}
          fill={faceDown ? "#3a2210" : "#f5f0e8"}
          stroke={
            selected ? "#c9a84c"
              : highlight ? "#c9a84c"
                : faceDown ? "#5c3a1e"
                  : "#a8a29e"
          }
          strokeWidth={selected || highlight ? 1.5 : 1}
        />

        {faceDown ? (
          <>
            <rect x={3} y={3} width={w - 6} height={h - 6} rx={2} fill="#2a1a0a" stroke="#5c3a1e" strokeWidth={0.5} />
            {isHorizontal ? (
              <line x1={w / 2} y1={3} x2={w / 2} y2={h - 3} stroke="#5c3a1e" strokeWidth={0.5} />
            ) : (
              <line x1={3} y1={h / 2} x2={w - 3} y2={h / 2} stroke="#5c3a1e" strokeWidth={0.5} />
            )}
          </>
        ) : showFace ? (
          isHorizontal ? (
            <>
              {/* Left half pips */}
              <g>
                <PipDots value={tile[0]} pipSize={pip} halfWidth={w / 2} halfHeight={h} />
              </g>
              {/* Vertical divider */}
              <line
                x1={w / 2} y1={3}
                x2={w / 2} y2={h - 3}
                stroke="#a8a29e" strokeWidth={0.8}
              />
              {/* Right half pips */}
              <g transform={`translate(${w / 2}, 0)`}>
                <PipDots value={tile[1]} pipSize={pip} halfWidth={w / 2} halfHeight={h} />
              </g>
            </>
          ) : (
            <>
              {/* Top half pips */}
              <g>
                <PipDots value={tile[0]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} />
              </g>
              {/* Horizontal divider */}
              <line
                x1={3} y1={(h - gap) / 2 + gap / 2}
                x2={w - 3} y2={(h - gap) / 2 + gap / 2}
                stroke="#a8a29e" strokeWidth={0.8}
              />
              {/* Bottom half pips */}
              <g transform={`translate(0, ${(h - gap) / 2 + gap})`}>
                <PipDots value={tile[1]} pipSize={pip} halfWidth={w} halfHeight={(h - gap) / 2} />
              </g>
            </>
          )
        ) : null}
      </svg>
    </motion.div>
  );
}
