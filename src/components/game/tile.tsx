"use client";

import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tile as TileType } from "@/lib/game/types";

type TileSize = "small" | "medium" | "large";

interface TileProps {
  tile?: TileType;
  faceDown?: boolean;
  size?: TileSize;
  rotation?: number;
  clickable?: boolean;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  responsive?: boolean;
  onClick?: () => void;
}

const sizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 36, h: 20, pip: 3, gap: 1 },
  medium: { w: 56, h: 30, pip: 4, gap: 2 },
  large: { w: 76, h: 40, pip: 5, gap: 2 },
};

const mobileSizeConfig: Record<TileSize, { w: number; h: number; pip: number; gap: number }> = {
  small: { w: 28, h: 16, pip: 2, gap: 1 },
  medium: { w: 42, h: 22, pip: 3, gap: 1 },
  large: { w: 58, h: 32, pip: 4, gap: 2 },
};

/** Pip positions for values 0-6 on a single half, in a 3x3 grid. */
function getPipPositions(value: number): [number, number][] {
  // Positions: [col, row] in a 3x3 grid (0-2)
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
  const padX = halfWidth * 0.2;
  const padY = halfHeight * 0.15;
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
          fill="white"
        />
      ))}
    </>
  );
}

export function DominoTile({
  tile,
  faceDown = false,
  size = "medium",
  rotation = 0,
  clickable = false,
  disabled = false,
  selected = false,
  highlight = false,
  responsive = false,
  onClick,
}: TileProps) {
  const isMobile = useIsMobile();
  const config = responsive && isMobile ? mobileSizeConfig : sizeConfig;
  const { w, h, pip, gap } = config[size];
  const halfW = (w - gap) / 2;
  const borderRadius = size === "small" ? 3 : 4;

  const showFace = !faceDown && tile;

  return (
    <motion.div
      className={`inline-block ${clickable && !disabled ? "cursor-pointer" : ""}`}
      style={{ rotate: rotation }}
      whileHover={
        clickable && !disabled
          ? { scale: 1.12, y: -6 }
          : undefined
      }
      whileTap={clickable && !disabled ? { scale: 0.95 } : undefined}
      animate={selected ? { y: -12, scale: 1.08 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={clickable && !disabled ? onClick : undefined}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-md ${
          highlight
            ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            : ""
        } ${disabled ? "opacity-40" : ""}`}
      >
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={borderRadius}
          fill={faceDown ? "#1e293b" : "#fefce8"}
          stroke={
            selected
              ? "#10b981"
              : highlight
                ? "#10b981"
                : faceDown
                  ? "#334155"
                  : "#a8a29e"
          }
          strokeWidth={selected || highlight ? 1.5 : 1}
        />

        {faceDown ? (
          /* Face-down pattern */
          <>
            <rect x={4} y={3} width={w - 8} height={h - 6} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={0.5} />
            <line x1={w / 2} y1={3} x2={w / 2} y2={h - 3} stroke="#334155" strokeWidth={0.5} />
          </>
        ) : showFace ? (
          <>
            {/* Left half pips */}
            <g>
              <PipDots value={tile[0]} pipSize={pip} halfWidth={halfW} halfHeight={h} />
            </g>
            {/* Divider */}
            <line
              x1={halfW + gap / 2}
              y1={3}
              x2={halfW + gap / 2}
              y2={h - 3}
              stroke="#a8a29e"
              strokeWidth={0.8}
            />
            {/* Right half pips */}
            <g transform={`translate(${halfW + gap}, 0)`}>
              <PipDots value={tile[1]} pipSize={pip} halfWidth={halfW} halfHeight={h} />
            </g>
          </>
        ) : null}
      </svg>
    </motion.div>
  );
}
