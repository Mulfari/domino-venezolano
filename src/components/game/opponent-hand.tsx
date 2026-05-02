"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DominoTile } from "./tile";
import { PassIndicator } from "./pass-indicator";
import { useGameStore } from "@/stores/game-store";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Seat } from "@/lib/game/types";
import type { Tile } from "@/lib/game/types";

interface OpponentHandProps {
  seat: Seat;
  tileCount: number;
  playerName: string;
  connected?: boolean;
  isCurrentTurn?: boolean;
  isBot?: boolean;
  isPartner?: boolean;
  position: "top" | "left" | "right";
  showPass?: boolean;
}

const MAX_DISPLAY = 7;

function MiniLastTile({ tile, teamColor }: { tile: Tile; teamColor: string }) {
  const W = 26;
  const H = 14;

  function pips(val: number, xOffset: number) {
    const cx = xOffset + W / 4;
    const positions: [number, number][] = [];
    if (val % 2 === 1) positions.push([cx, H / 2]);
    if (val >= 2) { positions.push([cx - 2.5, H * 0.3]); positions.push([cx + 2.5, H * 0.7]); }
    if (val >= 4) { positions.push([cx + 2.5, H * 0.3]); positions.push([cx - 2.5, H * 0.7]); }
    if (val === 6) { positions.push([cx - 2.5, H / 2]); positions.push([cx + 2.5, H / 2]); }
    return positions.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={1.1} fill="#1a1a1a" />
    ));
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="2" fill="#f5f0e8" stroke={teamColor} strokeWidth="0.9" />
      {/* 3D groove divider */}
      <line x1={W / 2} y1="1.5" x2={W / 2} y2={H - 1.5} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      <line x1={W / 2 + 0.5} y1="1.5" x2={W / 2 + 0.5} y2={H - 1.5} stroke="rgba(255,255,255,0.55)" strokeWidth="0.5" />
      {pips(tile[0], 0)}
      {pips(tile[1], W / 2)}
    </svg>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const TEAM_COLORS = {
  0: { name: "#c9a84c", badge: "#c9a84c", badgeBg: "#2a1a08", badgeBorder: "#5c3a1e", activeBg: "#c9a84c", activeText: "#1a0e00", activeBorder: "#e8c96a", activeShadow: "rgba(201,168,76,0.5)", glow: "rgba(201,168,76,0.45)" },
  1: { name: "#4ca8c9", badge: "#4ca8c9", badgeBg: "#081a2a", badgeBorder: "#1e5c7a", activeBg: "#4ca8c9", activeText: "#0a1e2a", activeBorder: "#6ac8e8", activeShadow: "rgba(76,168,201,0.5)", glow: "rgba(76,168,201,0.45)" },
} as const;

export function OpponentHand({
  seat,
  tileCount,
  playerName,
  connected = true,
  isCurrentTurn = false,
  isBot = false,
  isPartner = false,
  position,
  showPass = false,
}: OpponentHandProps) {
  const team = (seat % 2) as 0 | 1;
  const colors = TEAM_COLORS[team];
  const isVertical = position === "left" || position === "right";
  const isMobile = useIsMobile();
  const moveLog = useGameStore((s) => s.moveLog);
  const currentRound = useGameStore((s) => s.round);
  const board = useGameStore((s) => s.board);
  const isMano = board.plays.length > 0 && board.plays[0].seat === seat;

  // Find the last tile this opponent played in the current round only
  const lastPlayedTile: Tile | null = (() => {
    for (let i = moveLog.length - 1; i >= 0; i--) {
      const entry = moveLog[i];
      if (entry.round !== currentRound) break;
      if (entry.seat === seat && entry.type === "play" && entry.tile) {
        return entry.tile;
      }
    }
    return null;
  })();

  const passCount = moveLog.filter(
    (e) => e.round === currentRound && e.seat === seat && e.type === "pass"
  ).length;
  const maxDisplay = isMobile ? (isVertical ? 3 : 5) : MAX_DISPLAY;
  const displayCount = Math.min(tileCount, maxDisplay);

  // Overlap: tighter for vertical stacks, looser fan for horizontal
  const overlapPx = isMobile ? (isVertical ? 14 : 12) : (isVertical ? 18 : 16);

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 overflow-visible ${
        isVertical ? "flex-col" : "flex-col-reverse"
      }`}
      role="region"
      aria-label={`Mano de ${playerName}: ${tileCount} fichas${isCurrentTurn ? ", turno activo" : ""}`}
    >
      <PassIndicator show={showPass} playerName={playerName} />

      {/* "Pensando..." indicator for bots on their turn */}
      <AnimatePresence>
        {isBot && isCurrentTurn && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 pointer-events-none"
            style={{
              background: "rgba(10,20,12,0.85)",
              border: `1px solid ${colors.activeBorder}`,
              boxShadow: `0 0 10px ${colors.activeShadow}`,
            }}
          >
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.name }}>
              pensando
            </span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block w-1 h-1 rounded-full"
                  style={{ backgroundColor: colors.name }}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player name + avatar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Avatar circle with initials */}
        <motion.div
          className="relative flex-shrink-0 flex items-center justify-center rounded-full font-black leading-none select-none"
          style={{
            width: isMobile ? 26 : 30,
            height: isMobile ? 26 : 30,
            fontSize: isMobile ? 9 : 10,
            background: isCurrentTurn
              ? `linear-gradient(135deg, ${colors.activeBg} 0%, ${colors.name} 100%)`
              : `linear-gradient(135deg, ${colors.badgeBg} 0%, rgba(0,0,0,0.6) 100%)`,
            color: isCurrentTurn ? colors.activeText : colors.name,
            border: `1.5px solid ${isCurrentTurn ? colors.activeBorder : colors.badgeBorder}`,
            boxShadow: isCurrentTurn ? `0 0 10px ${colors.activeShadow}` : "0 2px 6px rgba(0,0,0,0.5)",
          }}
          animate={isCurrentTurn ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={isCurrentTurn ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
          role="img"
          aria-label={connected ? `${playerName} conectado` : `${playerName} desconectado`}
        >
          {isBot ? (
            /* Robot icon for bots */
            <svg width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <rect x="4.5" y="6" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="7.5" y="6" width="2" height="2" rx="0.5" fill="currentColor"/>
              <line x1="7" y1="2" x2="7" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="7" cy="1.5" r="0.8" fill="currentColor"/>
              <line x1="2" y1="8.5" x2="0.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="12" y1="8.5" x2="13.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          ) : (
            getInitials(playerName)
          )}
          {/* Connection dot overlay */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#163d28] ${
              connected ? "bg-[#4ade80]" : "bg-red-400"
            }`}
            aria-hidden="true"
          />
        </motion.div>

        <span
          className={`text-[10px] sm:text-xs font-medium truncate max-w-[60px] sm:max-w-[100px] ${
            isVertical ? "hidden sm:inline" : ""
          }`}
          style={{ color: isCurrentTurn ? colors.name : "#a8c4a0" }}
        >
          {playerName}
        </span>

        {/* Partner / Rival badge */}
        <span
          className={`shrink-0 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded leading-none ${
            isVertical ? "hidden sm:inline" : ""
          }`}
          style={isPartner ? {
            color: "#c9a84c",
            backgroundColor: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.35)",
          } : {
            color: "rgba(239,68,68,0.75)",
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {isPartner ? "Compa" : "Rival"}
        </span>

        {/* Mano badge — shown when this player opened the round */}
        <AnimatePresence>
          {isMano && (
            <motion.span
              key="mano-badge"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded leading-none ${
                isVertical ? "hidden sm:inline" : ""
              }`}
              style={{
                color: "#c9a84c",
                backgroundColor: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.5)",
                textShadow: "0 0 6px rgba(201,168,76,0.6)",
              }}
              title="Salió primero esta ronda"
              aria-label="Mano: salió primero esta ronda"
            >
              ♟ mano
            </motion.span>
          )}
        </AnimatePresence>

        {/* Tile count pill — always visible next to name */}
        <motion.div
          key={tileCount}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="flex-shrink-0 flex items-center justify-center min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1.5 rounded-full text-[10px] sm:text-xs font-bold leading-none border shadow-md"
          style={isCurrentTurn ? {
            backgroundColor: colors.activeBg,
            color: colors.activeText,
            borderColor: colors.activeBorder,
            boxShadow: `0 0 6px ${colors.activeShadow}`,
          } : {
            backgroundColor: colors.badgeBg,
            color: colors.badge,
            borderColor: colors.badgeBorder,
          }}
          aria-label={`${tileCount} fichas`}
        >
          {tileCount}
        </motion.div>

        {/* Pass count badge — shows how many times this player has passed this round */}
        <AnimatePresence>
          {passCount > 0 && (
            <motion.div
              key={passCount}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="flex flex-col items-center gap-0.5 shrink-0"
              title={`Pasó ${passCount} vez${passCount !== 1 ? "es" : ""} esta ronda`}
              aria-label={`Pasó ${passCount} vez${passCount !== 1 ? "es" : ""} esta ronda`}
            >
              <span
                className="text-[7px] uppercase tracking-widest leading-none font-semibold"
                style={{ color: "rgba(251,146,60,0.6)" }}
              >
                pases
              </span>
              <motion.div
                className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-black text-[10px] leading-none tabular-nums"
                animate={passCount >= 3 ? { opacity: [1, 0.6, 1] } : {}}
                transition={passCount >= 3 ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : {}}
                style={{
                  background: passCount >= 3
                    ? "rgba(232,74,58,0.18)"
                    : "rgba(251,146,60,0.12)",
                  border: `1px solid ${passCount >= 3 ? "rgba(232,74,58,0.65)" : "rgba(251,146,60,0.45)"}`,
                  color: passCount >= 3 ? "#e84a3a" : "#fb923c",
                  boxShadow: passCount >= 3 ? "0 0 8px rgba(232,74,58,0.4)" : undefined,
                }}
              >
                {passCount}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last played tile — persistent mini domino showing opponent's most recent play */}
        <AnimatePresence mode="wait">
          {lastPlayedTile && (
            <motion.div
              key={`${lastPlayedTile[0]}-${lastPlayedTile[1]}`}
              initial={{ opacity: 0, scale: 0.5, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className="flex flex-col items-center gap-0.5 shrink-0"
              title={`Última jugada: ${lastPlayedTile[0]}-${lastPlayedTile[1]}`}
              aria-label={`Última ficha jugada: ${lastPlayedTile[0]}-${lastPlayedTile[1]}`}
            >
              <span
                className="text-[7px] uppercase tracking-widest leading-none font-semibold"
                style={{ color: `${colors.name}60` }}
              >
                última
              </span>
              <MiniLastTile tile={lastPlayedTile} teamColor={`${colors.name}70`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Face-down tile stack */}
      {tileCount > 0 && (
        <div className="relative" aria-hidden="true">
          {/* ¡Una ficha! aura — only when 1 tile left */}
          {tileCount === 1 && (
            <motion.div
              className="absolute -inset-4 rounded-2xl pointer-events-none z-0"
              style={{ background: `radial-gradient(ellipse, ${colors.glow} 0%, transparent 70%)` }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.08, 0.9] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div
            className={`flex items-end justify-center ${
              isVertical ? "flex-col" : "flex-row"
            }`}
          >
            {Array.from({ length: displayCount }).map((_, i) => {
              const offset = i - (displayCount - 1) / 2;

              // Horizontal: fan spread with rotation + arc lift
              // Vertical: straight stack with slight x-shift for depth
              const rotation = !isVertical ? offset * 6 : 0;
              const yLift = !isVertical ? -Math.abs(offset) * 3 : 0;
              const xShift = isVertical ? offset * 1.5 : 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, y: isVertical ? -8 : 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 340,
                    damping: 20,
                  }}
                  style={{
                    marginTop: isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    marginLeft: !isVertical && i > 0 ? `-${overlapPx}px` : undefined,
                    transform: `rotate(${rotation}deg) translateY(${yLift}px) translateX(${xShift}px)`,
                    transformOrigin: "bottom center",
                    zIndex: i,
                    // Slight perspective depth: tiles further from center appear slightly smaller
                    filter: isVertical && i < displayCount - 1
                      ? "brightness(0.88)"
                      : undefined,
                  }}
                >
                  <DominoTile
                    faceDown
                    size="medium"
                    responsive
                    orientation={isVertical ? "horizontal" : "vertical"}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Count badge overlaid on the tile stack */}
          <motion.div
            key={`badge-${tileCount}`}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute -bottom-3 -right-3 z-20 flex items-center justify-center min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1.5 rounded-full text-[11px] sm:text-[12px] font-black leading-none shadow-lg border-2"
            style={tileCount === 1 || isCurrentTurn ? {
              backgroundColor: colors.activeBg,
              color: colors.activeText,
              borderColor: colors.activeBorder,
              boxShadow: `0 0 ${tileCount === 1 ? "16px" : "12px"} ${colors.activeShadow}`,
            } : {
              backgroundColor: "#1e0e04",
              color: colors.badge,
              borderColor: "#7a4a22",
              boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
            }}
            aria-hidden="true"
          >
            {tileCount}
          </motion.div>

          {/* ¡DOS! label — floats above the stack when 2 tiles left */}
          <AnimatePresence>
            {tileCount === 2 && (
              <motion.div
                key="dos-label"
                initial={{ opacity: 0, y: 6, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <motion.span
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  style={{ color: colors.name, textShadow: `0 0 6px ${colors.glow}, 0 1px 3px rgba(0,0,0,0.9)` }}
                >
                  ¡DOS!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ¡UNA! label — floats above the stack when 1 tile left */}
          <AnimatePresence>
            {tileCount === 1 && (
              <motion.div
                key="una-label"
                initial={{ opacity: 0, y: 6, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <motion.span
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  style={{ color: colors.name, textShadow: `0 0 8px ${colors.glow}, 0 1px 3px rgba(0,0,0,0.9)` }}
                >
                  ¡UNA!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ▼ Turno label — floats above the stack when it's this player's turn (human only) */}
          <AnimatePresence>
            {isCurrentTurn && !isBot && tileCount > 1 && (
              <motion.div
                key="turno-label"
                initial={{ opacity: 0, y: 8, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 480, damping: 24 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    background: colors.badgeBg,
                    border: `1px solid ${colors.activeBorder}`,
                    boxShadow: `0 0 10px ${colors.activeShadow}`,
                  }}
                >
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap leading-none"
                    style={{ color: colors.name, textShadow: `0 0 8px ${colors.glow}` }}
                  >
                    ▼ Turno
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty hand indicator */}
      {tileCount === 0 && (
        <div className="text-[9px] sm:text-[10px] text-[#5a7a5a] italic">
          sin fichas
        </div>
      )}
    </div>
  );
}
