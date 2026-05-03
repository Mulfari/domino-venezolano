"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

const TEAM_COLORS = {
  0: { accent: "#c9a84c", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.4)", rgb: "201,168,76" },
  1: { accent: "#4ca8c9", bg: "rgba(76,168,201,0.12)", border: "rgba(76,168,201,0.4)", rgb: "76,168,201" },
} as const;

interface PlayerStats {
  seat: Seat;
  name: string;
  team: 0 | 1;
  plays: number;
  passes: number;
  doubles: number;
  totalPips: number;
  isBot: boolean;
}

function computeStats(
  moveLog: ReturnType<typeof useGameStore.getState>["moveLog"],
  players: ReturnType<typeof useGameStore.getState>["players"],
): PlayerStats[] {
  const stats: Record<number, PlayerStats> = {};

  for (const p of players) {
    stats[p.seat] = {
      seat: p.seat,
      name: p.displayName.split(" ")[0],
      team: (p.seat % 2) as 0 | 1,
      plays: 0,
      passes: 0,
      doubles: 0,
      totalPips: 0,
      isBot: p.isBot ?? false,
    };
  }

  for (const entry of moveLog) {
    const s = stats[entry.seat];
    if (!s) continue;
    if (entry.type === "play") {
      s.plays++;
      if (entry.tile) {
        s.totalPips += entry.tile[0] + entry.tile[1];
        if (entry.tile[0] === entry.tile[1]) s.doubles++;
      }
    } else {
      s.passes++;
    }
  }

  return Object.values(stats).sort((a, b) => a.seat - b.seat);
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.35)", width: "100%" }}>
      <motion.div
        className="h-full rounded-full"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function MatchStats() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const moveLog = useGameStore((s) => s.moveLog);
  const players = useGameStore((s) => s.players);
  const mySeat = useGameStore((s) => s.mySeat);
  const round = useGameStore((s) => s.round);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const stats = computeStats(moveLog, players);
  const maxPlays = Math.max(...stats.map((s) => s.plays), 1);
  const maxPasses = Math.max(...stats.map((s) => s.passes), 1);
  const maxDoubles = Math.max(...stats.map((s) => s.doubles), 1);
  const maxPips = Math.max(...stats.map((s) => s.totalPips), 1);
  const totalMoves = moveLog.length;

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? "Cerrar estadísticas" : "Ver estadísticas de la partida"}
        aria-expanded={open}
        className="flex items-center justify-center rounded-lg border px-2 py-1 transition-colors"
        style={{
          minHeight: 36,
          minWidth: 36,
          background: open ? "rgba(201,168,76,0.18)" : "rgba(58,34,16,0.8)",
          borderColor: open ? "rgba(201,168,76,0.55)" : "rgba(201,168,76,0.2)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="9" width="3" height="6" rx="0.8" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.8" />
          <rect x="5.5" y="5" width="3" height="10" rx="0.8" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.8" />
          <rect x="10" y="1" width="3" height="14" rx="0.8" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.8" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="match-stats-panel"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #2a1a08 0%, #1a1008 100%)",
              borderColor: "rgba(201,168,76,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)",
              minWidth: 280,
              maxWidth: 340,
            }}
            role="dialog"
            aria-label="Estadísticas de la partida"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="0.5" y="6" width="3" height="5.5" rx="0.6" fill="#c9a84c" opacity="0.7" />
                  <rect x="4.5" y="3" width="3" height="8.5" rx="0.6" fill="#c9a84c" opacity="0.7" />
                  <rect x="8.5" y="0.5" width="3" height="11" rx="0.6" fill="#c9a84c" opacity="0.7" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                  Estadísticas
                </span>
              </div>
              <span className="text-[9px] text-[#a8c4a0]/50 uppercase tracking-wider">
                Ronda {round} · {totalMoves} jugadas
              </span>
            </div>

            {/* Player stats */}
            <div className="flex flex-col gap-0.5 p-2">
              {stats.map((ps) => {
                const tc = TEAM_COLORS[ps.team];
                const isMe = mySeat === ps.seat;
                const totalActions = ps.plays + ps.passes;
                const passRate = totalActions > 0 ? Math.round((ps.passes / totalActions) * 100) : 0;
                const avgPips = ps.plays > 0 ? (ps.totalPips / ps.plays).toFixed(1) : "—";

                return (
                  <div
                    key={ps.seat}
                    className="rounded-lg px-2.5 py-2"
                    style={{
                      background: isMe ? tc.bg : "rgba(0,0,0,0.15)",
                      border: `1px solid ${isMe ? tc.border : "rgba(245,240,232,0.06)"}`,
                    }}
                  >
                    {/* Player name row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tc.accent }}
                        />
                        <span
                          className="text-[11px] font-bold truncate max-w-[100px] leading-none"
                          style={{ color: isMe ? tc.accent : "#f5f0e8" }}
                        >
                          {ps.name}
                        </span>
                        {isMe && (
                          <span
                            className="text-[7px] uppercase tracking-widest leading-none px-1 py-0.5 rounded"
                            style={{ color: tc.accent, background: `rgba(${tc.rgb},0.15)`, border: `1px solid rgba(${tc.rgb},0.3)` }}
                          >
                            tú
                          </span>
                        )}
                        {ps.isBot && (
                          <span className="text-[7px] text-[#a8c4a0]/40 uppercase tracking-wider leading-none">
                            bot
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[9px] font-semibold tabular-nums leading-none"
                        style={{ color: `rgba(${tc.rgb},0.6)` }}
                      >
                        {totalActions} acciones
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {/* Plays */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/50 leading-none">Jugadas</span>
                          <span className="text-[10px] font-bold tabular-nums leading-none" style={{ color: tc.accent }}>{ps.plays}</span>
                        </div>
                        <StatBar value={ps.plays} max={maxPlays} color={tc.accent} />
                      </div>

                      {/* Passes */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/50 leading-none">Pases</span>
                          <span className="text-[10px] font-bold tabular-nums leading-none" style={{ color: passRate >= 40 ? "#ef4444" : passRate >= 25 ? "#fb923c" : "rgba(168,196,160,0.7)" }}>
                            {ps.passes}
                            <span className="text-[7px] font-normal ml-0.5 opacity-60">({passRate}%)</span>
                          </span>
                        </div>
                        <StatBar value={ps.passes} max={maxPasses} color={passRate >= 40 ? "#ef4444" : passRate >= 25 ? "#fb923c" : "rgba(168,196,160,0.5)"} />
                      </div>

                      {/* Doubles */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/50 leading-none">Dobles</span>
                          <span className="text-[10px] font-bold tabular-nums leading-none" style={{ color: "rgba(192,132,252,0.85)" }}>{ps.doubles}</span>
                        </div>
                        <StatBar value={ps.doubles} max={maxDoubles} color="rgba(192,132,252,0.7)" />
                      </div>

                      {/* Avg pips */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/50 leading-none">Prom. pts</span>
                          <span className="text-[10px] font-bold tabular-nums leading-none" style={{ color: "rgba(245,240,232,0.65)" }}>{avgPips}</span>
                        </div>
                        <StatBar value={ps.totalPips} max={maxPips} color="rgba(245,240,232,0.35)" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Team summary */}
            {stats.length === 4 && (() => {
              const team0 = stats.filter((s) => s.team === 0);
              const team1 = stats.filter((s) => s.team === 1);
              const t0Plays = team0.reduce((a, s) => a + s.plays, 0);
              const t1Plays = team1.reduce((a, s) => a + s.plays, 0);
              const t0Passes = team0.reduce((a, s) => a + s.passes, 0);
              const t1Passes = team1.reduce((a, s) => a + s.passes, 0);
              const t0Doubles = team0.reduce((a, s) => a + s.doubles, 0);
              const t1Doubles = team1.reduce((a, s) => a + s.doubles, 0);

              return (
                <div className="px-2 pb-2">
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(245,240,232,0.06)" }}>
                    <div className="px-2.5 py-1.5" style={{ background: "rgba(0,0,0,0.2)" }}>
                      <span className="text-[8px] uppercase tracking-widest text-[#a8c4a0]/40 font-semibold">
                        Equipos
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-0 text-center">
                      {/* Header */}
                      <div className="px-1 py-1" />
                      <div className="px-1 py-1">
                        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: TEAM_COLORS[0].accent }}>
                          Eq. 1
                        </span>
                      </div>
                      <div className="px-1 py-1">
                        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: TEAM_COLORS[1].accent }}>
                          Eq. 2
                        </span>
                      </div>
                      {/* Plays */}
                      <div className="px-1 py-0.5 text-left">
                        <span className="text-[8px] text-[#a8c4a0]/45 uppercase tracking-wider">Jugadas</span>
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: TEAM_COLORS[0].accent }}>{t0Plays}</span>
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: TEAM_COLORS[1].accent }}>{t1Plays}</span>
                      </div>
                      {/* Passes */}
                      <div className="px-1 py-0.5 text-left">
                        <span className="text-[8px] text-[#a8c4a0]/45 uppercase tracking-wider">Pases</span>
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: t0Passes > t1Passes ? "#fb923c" : "rgba(168,196,160,0.6)" }}>{t0Passes}</span>
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: t1Passes > t0Passes ? "#fb923c" : "rgba(168,196,160,0.6)" }}>{t1Passes}</span>
                      </div>
                      {/* Doubles */}
                      <div className="px-1 py-0.5 pb-1.5 text-left">
                        <span className="text-[8px] text-[#a8c4a0]/45 uppercase tracking-wider">Dobles</span>
                      </div>
                      <div className="px-1 py-0.5 pb-1.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: "rgba(192,132,252,0.75)" }}>{t0Doubles}</span>
                      </div>
                      <div className="px-1 py-0.5 pb-1.5">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: "rgba(192,132,252,0.75)" }}>{t1Doubles}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Empty state */}
            {totalMoves === 0 && (
              <div className="px-3 pb-3 text-center">
                <span className="text-[10px] text-[#a8c4a0]/40 italic">
                  Las estadísticas aparecerán cuando empiece el juego
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
