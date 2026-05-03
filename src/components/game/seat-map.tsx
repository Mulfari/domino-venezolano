"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

const TEAM_COLORS = {
  0: { bg: "#c9a84c", glow: "rgba(201,168,76,0.6)", subtle: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.45)" },
  1: { bg: "#4ca8c9", glow: "rgba(76,168,201,0.6)", subtle: "rgba(76,168,201,0.15)", border: "rgba(76,168,201,0.45)" },
} as const;

function getRelativeSeats(mySeat: Seat): { bottom: Seat; right: Seat; top: Seat; left: Seat } {
  return {
    bottom: mySeat,
    right: ((mySeat + 1) % 4) as Seat,
    top: ((mySeat + 2) % 4) as Seat,
    left: ((mySeat + 3) % 4) as Seat,
  };
}

interface SeatNodeProps {
  seat: Seat;
  name: string;
  tileCount: number;
  isCurrentTurn: boolean;
  isMe: boolean;
  isPartner: boolean;
  connected: boolean;
  isBot: boolean;
  position: "top" | "bottom" | "left" | "right";
}

function SeatNode({ seat, name, tileCount, isCurrentTurn, isMe, isPartner, connected, isBot, position }: SeatNodeProps) {
  const team = (seat % 2) as 0 | 1;
  const colors = TEAM_COLORS[team];
  const firstName = name.split(" ")[0];
  const displayName = isMe ? "Tú" : firstName.length > 6 ? firstName.slice(0, 5) + "…" : firstName;

  const isVertical = position === "top" || position === "bottom";

  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 select-none"
      animate={isCurrentTurn ? {
        scale: [1, 1.08, 1],
      } : { scale: 1 }}
      transition={isCurrentTurn ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
    >
      {/* Avatar circle */}
      <div className="relative">
        {isCurrentTurn && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: colors.bg }}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: isCurrentTurn ? colors.bg : colors.subtle,
            border: `1.5px solid ${isCurrentTurn ? colors.bg : colors.border}`,
            boxShadow: isCurrentTurn ? `0 0 10px ${colors.glow}` : "none",
          }}
        >
          <span
            className="text-[8px] font-black leading-none"
            style={{ color: isCurrentTurn ? "#0f1e14" : colors.bg }}
          >
            {tileCount}
          </span>
        </div>
        {/* Connection dot */}
        {!isBot && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-[5px] h-[5px] rounded-full z-20"
            style={{
              backgroundColor: connected ? "#4ade80" : "#ef4444",
              border: "1px solid rgba(0,0,0,0.5)",
            }}
          />
        )}
      </div>

      {/* Name label */}
      <span
        className="text-[7px] font-bold leading-none truncate max-w-[40px] text-center"
        style={{
          color: isMe ? colors.bg : isCurrentTurn ? colors.bg : `${colors.bg}99`,
        }}
      >
        {displayName}
      </span>

      {/* Role label */}
      <span
        className="text-[6px] uppercase tracking-wider leading-none"
        style={{ color: "rgba(168,196,160,0.45)" }}
      >
        {isMe ? "" : isPartner ? "aliado" : "rival"}
      </span>
    </motion.div>
  );
}

interface SeatMapProps {
  handCounts: number[];
}

export function SeatMap({ handCounts }: SeatMapProps) {
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);

  if (mySeat === null || status !== "playing") return null;

  const seats = getRelativeSeats(mySeat);

  function getInfo(seat: Seat) {
    const player = players.find((p) => p.seat === seat);
    return {
      name: player?.displayName ?? `Jugador ${seat + 1}`,
      connected: player?.connected ?? false,
      isBot: player?.isBot ?? false,
    };
  }

  const topInfo = getInfo(seats.top);
  const bottomInfo = getInfo(seats.bottom);
  const leftInfo = getInfo(seats.left);
  const rightInfo = getInfo(seats.right);

  const myTeam = (mySeat % 2) as 0 | 1;

  // Turn order arrows: show clockwise flow
  const turnOrder = [seats.bottom, seats.right, seats.top, seats.left];
  const currentIdx = turnOrder.indexOf(currentTurn);

  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ width: 110, height: 90 }}
      role="status"
      aria-label={`Mesa: turno de ${currentTurn === mySeat ? "ti" : getInfo(currentTurn).name}`}
    >
      {/* Center table icon */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md"
        style={{
          width: 22,
          height: 22,
          background: "radial-gradient(ellipse, rgba(30,107,60,0.6) 0%, rgba(15,53,32,0.4) 100%)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      />

      {/* Turn flow arrows */}
      <svg
        className="absolute inset-0"
        width="110"
        height="90"
        viewBox="0 0 110 90"
        fill="none"
        aria-hidden="true"
      >
        {/* Clockwise path: bottom → right → top → left → bottom */}
        {[
          { x1: 55, y1: 62, x2: 78, y2: 45, idx: 0 },
          { x1: 78, y1: 45, x2: 55, y2: 22, idx: 1 },
          { x1: 55, y1: 22, x2: 32, y2: 45, idx: 2 },
          { x1: 32, y1: 45, x2: 55, y2: 62, idx: 3 },
        ].map(({ x1, y1, x2, y2, idx }) => {
          const isActive = idx === currentIdx;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={midX}
              y2={midY}
              stroke={isActive ? "rgba(201,168,76,0.5)" : "rgba(168,196,160,0.12)"}
              strokeWidth={isActive ? 1.5 : 0.8}
              strokeDasharray={isActive ? "none" : "2 2"}
            />
          );
        })}
      </svg>

      {/* Top seat (partner) */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <SeatNode
          seat={seats.top}
          name={topInfo.name}
          tileCount={handCounts[seats.top] ?? 0}
          isCurrentTurn={currentTurn === seats.top}
          isMe={false}
          isPartner={true}
          connected={topInfo.connected}
          isBot={topInfo.isBot}
          position="top"
        />
      </div>

      {/* Bottom seat (me) */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
        <SeatNode
          seat={seats.bottom}
          name={bottomInfo.name}
          tileCount={handCounts[seats.bottom] ?? 0}
          isCurrentTurn={currentTurn === seats.bottom}
          isMe={true}
          isPartner={false}
          connected={bottomInfo.connected}
          isBot={bottomInfo.isBot}
          position="bottom"
        />
      </div>

      {/* Left seat (opponent) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <SeatNode
          seat={seats.left}
          name={leftInfo.name}
          tileCount={handCounts[seats.left] ?? 0}
          isCurrentTurn={currentTurn === seats.left}
          isMe={false}
          isPartner={false}
          connected={leftInfo.connected}
          isBot={leftInfo.isBot}
          position="left"
        />
      </div>

      {/* Right seat (opponent) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <SeatNode
          seat={seats.right}
          name={rightInfo.name}
          tileCount={handCounts[seats.right] ?? 0}
          isCurrentTurn={currentTurn === seats.right}
          isMe={false}
          isPartner={false}
          connected={rightInfo.connected}
          isBot={rightInfo.isBot}
          position="right"
        />
      </div>
    </div>
  );
}
