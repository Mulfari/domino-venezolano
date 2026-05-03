"use client";

import type { ReactNode } from "react";

interface PlayerSeatProps {
  children: ReactNode;
  position: "top" | "bottom" | "left" | "right";
  teamIndex: 0 | 1;
  isActive?: boolean;
}

const TEAM_ACCENT = {
  0: { border: "rgba(201,168,76,0.25)", glow: "rgba(201,168,76,0.08)", stud: "#c9a84c" },
  1: { border: "rgba(76,168,201,0.25)", glow: "rgba(76,168,201,0.08)", stud: "#4ca8c9" },
} as const;

export function PlayerSeat({ children, position, teamIndex, isActive = false }: PlayerSeatProps) {
  const accent = TEAM_ACCENT[teamIndex];
  const isVertical = position === "left" || position === "right";

  const borderRadius = isVertical ? "10px" : "12px";
  const padding = isVertical ? "6px 4px" : "6px 10px";

  return (
    <div
      className="relative"
      style={{
        borderRadius,
        padding,
        background: `
          linear-gradient(
            ${isVertical ? "180deg" : "90deg"},
            rgba(22,61,40,0.0) 0%,
            rgba(22,61,40,0.55) 30%,
            rgba(22,61,40,0.55) 70%,
            rgba(22,61,40,0.0) 100%
          )
        `,
        border: `1px solid ${isActive ? accent.border : "rgba(168,196,160,0.08)"}`,
        boxShadow: isActive
          ? `inset 0 0 20px ${accent.glow}, 0 0 12px ${accent.glow}`
          : "inset 0 0 12px rgba(0,0,0,0.15)",
        transition: "border-color 0.6s ease, box-shadow 0.6s ease",
      }}
    >
      {/* Subtle felt texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius,
          background: `
            repeating-linear-gradient(
              ${isVertical ? "0deg" : "90deg"},
              transparent,
              transparent 2px,
              rgba(255,255,255,0.008) 2px,
              rgba(255,255,255,0.008) 3px
            )
          `,
          opacity: 0.6,
        }}
        aria-hidden="true"
      />

      {/* Corner studs — team colored */}
      {!isVertical && (
        <>
          <div
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              borderRadius: "50%",
              top: 3,
              left: 5,
              background: `radial-gradient(circle at 35% 35%, ${accent.stud}, rgba(0,0,0,0.4))`,
              opacity: isActive ? 0.7 : 0.25,
              transition: "opacity 0.6s ease",
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              borderRadius: "50%",
              top: 3,
              right: 5,
              background: `radial-gradient(circle at 35% 35%, ${accent.stud}, rgba(0,0,0,0.4))`,
              opacity: isActive ? 0.7 : 0.25,
              transition: "opacity 0.6s ease",
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              borderRadius: "50%",
              bottom: 3,
              left: 5,
              background: `radial-gradient(circle at 35% 35%, ${accent.stud}, rgba(0,0,0,0.4))`,
              opacity: isActive ? 0.7 : 0.25,
              transition: "opacity 0.6s ease",
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              borderRadius: "50%",
              bottom: 3,
              right: 5,
              background: `radial-gradient(circle at 35% 35%, ${accent.stud}, rgba(0,0,0,0.4))`,
              opacity: isActive ? 0.7 : 0.25,
              transition: "opacity 0.6s ease",
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-[1]">
        {children}
      </div>
    </div>
  );
}
