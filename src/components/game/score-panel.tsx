"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";
import type { RoundHistoryEntry } from "@/stores/game-store";

function useAnimatedCounter(target: number, duration = 700) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    prevRef.current = target;
    const start = performance.now();
    const diff = target - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return display;
}

function getStreak(history: RoundHistoryEntry[], team: 0 | 1): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].winner_team === team) streak++;
    else break;
  }
  return streak;
}

const CERCA_THRESHOLD = 20;

function TeamCard({
  teamIdx, score, targetScore, isMyTeam, seats, players, firstSeat, streak,
}: {
  teamIdx: 0 | 1;
  score: number;
  targetScore: number;
  isMyTeam: boolean;
  seats: Seat[];
  players: { seat: Seat; displayName: string; connected: boolean; isBot?: boolean }[];
  firstSeat: Seat | null;
  streak: number;
}) {
  const display = useAnimatedCounter(score);
  const pct = Math.min((score / targetScore) * 100, 100);
  const remaining = Math.max(targetScore - score, 0);
  const isCerca = remaining > 0 && remaining <= CERCA_THRESHOLD;

  const prevRef = useRef(score);
  const [delta, setDelta] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (score > prevRef.current) {
      const diff = score - prevRef.current;
      setDelta(diff);
      setFlash(true);
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
      deltaTimer.current = setTimeout(() => setDelta(null), 2200);
      const t = setTimeout(() => setFlash(false), 900);
      prevRef.current = score;
      return () => clearTimeout(t);
    }
    prevRef.current = score;
  }, [score]);

  const teamNames = seats.map((s) => {
    const p = players.find((pl) => pl.seat === s);
    return p?.displayName.split(" ")[0] ?? `J${s + 1}`;
  });
  const teamLabel = teamNames.join(" & ");

  // Cerca border color: amber for opponent, gold-red for my team
  const cercaBorderColor = isMyTeam ? "rgba(220,80,40,0.7)" : "rgba(201,168,76,0.55)";

  return (
    <motion.div
      animate={
        isCerca
          ? { boxShadow: [`0 0 0px ${cercaBorderColor}`, `0 0 22px ${cercaBorderColor}`, `0 0 0px ${cercaBorderColor}`] }
          : flash
          ? { boxShadow: ["0 0 0px rgba(201,168,76,0)", "0 0 18px rgba(201,168,76,0.45)", "0 0 0px rgba(201,168,76,0)"] }
          : {}
      }
      transition={isCerca ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.9 }}
      className={`rounded-xl border px-3 py-2.5 ${
        isMyTeam
          ? "border-[#c9a84c]/45 bg-[#c9a84c]/8"
          : "border-[#f5f0e8]/10 bg-[#0f3520]/30 opacity-80"
      }`}
      style={isCerca ? { borderColor: cercaBorderColor } : undefined}
    >
      {/* Top row: team label + score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Left: team label + players */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isMyTeam && <span className="text-[#c9a84c] text-[9px] shrink-0">◆</span>}
            <span
              className="text-[11px] font-bold uppercase tracking-widest leading-none truncate max-w-[120px]"
              style={{ color: isMyTeam ? "#c9a84c" : "#a8c4a0" }}
              title={teamLabel}
            >
              {teamLabel}
            </span>
            {isMyTeam && (
              <span className="text-[8px] text-[#c9a84c]/50 uppercase tracking-wider shrink-0 leading-none">(tú)</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {seats.map((s) => {
              const p = players.find((pl) => pl.seat === s);
              const name = p?.displayName ?? `Jugador ${s + 1}`;
              const online = p?.connected ?? false;
              const isBot = p?.isBot ?? false;
              const isFirst = firstSeat === s;
              return (
                <div key={s} className="flex items-center gap-1 min-w-0">
                  <span
                    role="img"
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${online ? "bg-green-400/80" : "bg-red-400/40"}`}
                    aria-label={online ? "conectado" : "desconectado"}
                  />
                  <span className="text-[10px] text-[#f5f0e8]/80 truncate leading-none font-medium">
                    {name}
                    {isBot && <span className="text-[#a8c4a0]/50 ml-0.5 text-[8px]">bot</span>}
                  </span>
                  {isFirst && (
                    <span
                      className="text-[#c9a84c] text-[9px] shrink-0 leading-none"
                      title="Salió primero esta ronda"
                      aria-label="Salió primero esta ronda"
                    >
                      ★
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak badge */}
        {streak >= 2 && (
          <motion.div
            key={streak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 shrink-0"
            style={{
              background: isMyTeam ? "rgba(201,168,76,0.15)" : "rgba(168,196,160,0.1)",
              border: `1px solid ${isMyTeam ? "rgba(201,168,76,0.4)" : "rgba(168,196,160,0.25)"}`,
            }}
            aria-label={`Racha de ${streak} rondas`}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-[10px] leading-none"
              aria-hidden="true"
            >
              🔥
            </motion.span>
            <span
              className="text-[10px] font-black tabular-nums leading-none"
              style={{ color: isMyTeam ? "#c9a84c" : "#a8c4a0" }}
            >
              {streak}
            </span>
          </motion.div>
        )}

        {/* Right: score */}
        <div className="flex flex-col items-end shrink-0 relative">
          <motion.span
            key={score}
            initial={{ scale: 1.4, color: "#ffffff" }}
            animate={{ scale: 1, color: isMyTeam ? "#f5f0e8" : "#a8c4a0" }}
            transition={{ duration: 0.35 }}
            className="text-[28px] font-bold tabular-nums leading-none"
          >
            {display}
          </motion.span>
          <span className="text-[9px] text-[#a8c4a0]/40 tabular-nums leading-none mt-0.5">
            meta {targetScore}
          </span>
          <AnimatePresence>
            {delta !== null && (
              <motion.span
                key={`d-${score}`}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="absolute -top-1 -right-1 text-[12px] font-bold text-green-400 tabular-nums pointer-events-none"
                style={{ textShadow: "0 0 8px rgba(74,222,128,0.7)" }}
                aria-hidden="true"
              >
                +{delta}
              </motion.span>
            )}
          </AnimatePresence>
          {delta !== null && (
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {teamLabel} suma {delta} puntos, total {score}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2.5 rounded-full bg-[#0f3520]/70 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={targetScore}
        aria-label={`${teamLabel}: ${score} de ${targetScore} puntos`}
      >
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={isCerca ? {
            width: `${pct}%`,
            opacity: [1, 0.65, 1],
          } : { width: `${pct}%`, opacity: 1 }}
          transition={isCerca ? {
            width: { duration: 0.65, ease: "easeOut" },
            opacity: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
          } : { duration: 0.65, ease: "easeOut" }}
          style={{
            background: isCerca
              ? "linear-gradient(90deg, #c0392b 0%, #e84a3a 60%, #ff6b5a 100%)"
              : isMyTeam
              ? "linear-gradient(90deg, #a07830 0%, #c9a84c 60%, #e8c96a 100%)"
              : "linear-gradient(90deg, #6a8f6a 0%, #a8c4a0 100%)",
          }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[8px] text-[#a8c4a0]/40 tabular-nums">{pct.toFixed(0)}%</span>
        <AnimatePresence mode="wait">
          {isCerca ? (
            <motion.span
              key="cerca"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="flex items-center gap-1"
            >
              <motion.span
                className="text-[8px] font-black uppercase tracking-widest tabular-nums"
                style={{ color: "#e84a3a", textShadow: "0 0 8px rgba(232,74,58,0.7)" }}
                animate={{ opacity: [1, 0.55, 1] }}
                transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
              >
                ¡Cerca! {remaining} pts
              </motion.span>
            </motion.span>
          ) : (
            <motion.span
              key="normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[8px] text-[#a8c4a0]/45 tabular-nums"
            >
              {remaining > 0 ? `faltan ${remaining} pts` : "¡meta!"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RoundHistory({ history, myTeam, className = "mt-2 pt-2 border-t border-[#c9a84c]/12" }: { history: RoundHistoryEntry[]; myTeam: 0 | 1 | null; className?: string }) {
  if (history.length === 0) return null;
  return (
    <div className={className}>
      <div className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-1.5">Historial</div>
      <div className="flex flex-wrap gap-1" role="list" aria-label="Historial de rondas">
        {history.map((entry) => {
          const tied = entry.winner_team === null;
          const won = myTeam !== null && entry.winner_team === myTeam;
          const bg = tied
            ? "bg-[#a8c4a0]/10 border-[#a8c4a0]/25"
            : won
            ? "bg-[#c9a84c]/15 border-[#c9a84c]/35"
            : "bg-[#f5f0e8]/5 border-[#f5f0e8]/12";
          const dot = tied ? "bg-[#a8c4a0]/50" : entry.winner_team === 0 ? "bg-[#c9a84c]" : "bg-[#a8c4a0]";
          const reason = entry.reason === "domino" ? "D" : entry.reason === "locked" ? "T" : "=";
          const reasonFull = entry.reason === "domino" ? "dominó" : entry.reason === "locked" ? "trancado" : "empate";
          return (
            <motion.div
              key={entry.round}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              role="listitem"
              aria-label={`Ronda ${entry.round}: ${tied ? "Empate" : `Equipo ${(entry.winner_team ?? 0) + 1} ganó`}, ${entry.points} pts, ${reasonFull}${entry.is_capicua ? ", capicúa" : ""}`}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[8px] font-semibold tabular-nums ${bg}`}
              style={entry.is_capicua ? { borderColor: "rgba(201,168,76,0.7)", boxShadow: "0 0 6px rgba(201,168,76,0.3)" } : undefined}
            >
              <span className="text-[#f5f0e8]/30">{entry.round}</span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
              <span className="text-[#f5f0e8]/70">{entry.points}</span>
              <span className="text-[#f5f0e8]/35 text-[7px] font-bold">{reason}</span>
              {entry.is_capicua && (
                <span
                  className="text-[7px] font-black leading-none"
                  style={{ color: "#c9a84c", textShadow: "0 0 6px rgba(201,168,76,0.8)" }}
                  title="Capicúa"
                  aria-hidden="true"
                >
                  ✦
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PipBalance({ team0Pips, team1Pips, myTeam }: { team0Pips: number; team1Pips: number; myTeam: 0 | 1 | null }) {
  const total = team0Pips + team1Pips;
  if (total === 0) return null;

  const team0Pct = (team0Pips / total) * 100;
  const winning: 0 | 1 | null = team0Pips < team1Pips ? 0 : team1Pips < team0Pips ? 1 : null;
  const tied = winning === null;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.6 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-1 px-1"
      aria-label={`Puntos en mano: equipo 1 tiene ${team0Pips}, equipo 2 tiene ${team1Pips}${tied ? ", empate" : `, equipo ${(winning ?? 0) + 1} lleva ventaja`}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[7px] uppercase tracking-widest font-semibold" style={{ color: "rgba(168,196,160,0.4)" }}>
          puntos en mano
        </span>
        {!tied && (
          <motion.span
            key={winning}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="text-[7px] font-black uppercase tracking-widest leading-none"
            style={{
              color: winning === 0 ? "rgba(201,168,76,0.8)" : "rgba(76,168,201,0.8)",
              textShadow: winning === 0 ? "0 0 6px rgba(201,168,76,0.5)" : "0 0 6px rgba(76,168,201,0.5)",
            }}
          >
            {winning === myTeam ? "ventaja" : "desventaja"}
          </motion.span>
        )}
      </div>

      {/* Tug-of-war bar */}
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.35)" }}>
        {/* Team 0 fill (left) */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-full"
          initial={false}
          animate={{ width: `${team0Pct}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            background: winning === 0
              ? "linear-gradient(90deg, #a07830 0%, #c9a84c 100%)"
              : "linear-gradient(90deg, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.5) 100%)",
          }}
        />
        {/* Team 1 fill (right) */}
        <motion.div
          className="absolute right-0 top-0 h-full rounded-r-full"
          initial={false}
          animate={{ width: `${100 - team0Pct}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            background: winning === 1
              ? "linear-gradient(90deg, #4ca8c9 0%, #6ac8e8 100%)"
              : "linear-gradient(90deg, rgba(76,168,201,0.5) 0%, rgba(76,168,201,0.35) 100%)",
          }}
        />
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px" style={{ background: "rgba(0,0,0,0.5)" }} />
      </div>

      {/* Pip counts */}
      <div className="flex items-center justify-between">
        <motion.span
          key={team0Pips}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="text-[9px] font-black tabular-nums leading-none"
          style={{
            color: winning === 0 ? "#c9a84c" : "rgba(201,168,76,0.45)",
            textShadow: winning === 0 ? "0 0 6px rgba(201,168,76,0.5)" : undefined,
          }}
        >
          {team0Pips}
        </motion.span>
        <span className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(168,196,160,0.25)" }}>
          {tied ? "iguales" : "pts"}
        </span>
        <motion.span
          key={team1Pips}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="text-[9px] font-black tabular-nums leading-none"
          style={{
            color: winning === 1 ? "#4ca8c9" : "rgba(76,168,201,0.45)",
            textShadow: winning === 1 ? "0 0 6px rgba(76,168,201,0.5)" : undefined,
          }}
        >
          {team1Pips}
        </motion.span>
      </div>
    </motion.div>
  );
}

function ScoreGap({ scores, myTeam }: { scores: { 0: number; 1: number }; myTeam: 0 | 1 | null }) {
  const gap = Math.abs(scores[0] - scores[1]);
  if (gap === 0) return (
    <div className="flex items-center justify-center gap-2 py-0.5" aria-label="Marcador empatado">
      <div className="flex-1 h-px" style={{ background: "rgba(168,196,160,0.12)" }} />
      <span className="text-[8px] uppercase tracking-widest font-semibold" style={{ color: "rgba(168,196,160,0.35)" }}>
        iguales
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(168,196,160,0.12)" }} />
    </div>
  );

  const leader: 0 | 1 = scores[0] > scores[1] ? 0 : 1;
  const leaderColor = leader === 0 ? "#c9a84c" : "#4ca8c9";
  const leaderColorSubtle = leader === 0 ? "rgba(201,168,76,0.18)" : "rgba(76,168,201,0.18)";
  const leaderColorBorder = leader === 0 ? "rgba(201,168,76,0.4)" : "rgba(76,168,201,0.4)";
  const isMyTeamLeading = myTeam === leader;

  return (
    <motion.div
      key={gap}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="flex items-center justify-center gap-2 py-0.5"
      aria-label={`Diferencia: ${gap} puntos, equipo ${leader + 1} va adelante`}
    >
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${leaderColorBorder})` }} />
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
        style={{ background: leaderColorSubtle, border: `1px solid ${leaderColorBorder}` }}
      >
        <motion.span
          key={gap}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="text-[11px] font-black tabular-nums leading-none"
          style={{ color: leaderColor, textShadow: `0 0 8px ${leaderColorBorder}` }}
        >
          +{gap}
        </motion.span>
        <span
          className="text-[8px] font-semibold uppercase tracking-widest leading-none"
          style={{ color: `${leaderColor}99` }}
        >
          {isMyTeamLeading ? "ventaja" : "desventaja"}
        </span>
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${leaderColorBorder}, transparent)` }} />
    </motion.div>
  );
}

export function ScorePanel() {
  const scores = useGameStore((s) => s.scores);
  const round = useGameStore((s) => s.round);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const players = useGameStore((s) => s.players);
  const board = useGameStore((s) => s.board);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const hands = useGameStore((s) => s.hands);
  const status = useGameStore((s) => s.status);

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;
  const firstSeat = (board.plays[0]?.seat ?? null) as Seat | null;
  const firstPlayer = firstSeat !== null ? players.find((p) => p.seat === firstSeat) : null;
  const firstPlayerName = firstPlayer?.displayName.split(" ")[0] ?? null;

  const team0Pips = (hands[0] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                  + (hands[2] ?? []).reduce((s, [a, b]) => s + a + b, 0);
  const team1Pips = (hands[1] ?? []).reduce((s, [a, b]) => s + a + b, 0)
                  + (hands[3] ?? []).reduce((s, [a, b]) => s + a + b, 0);
  const showPipBalance = status === "playing" && board.plays.length > 0 && (team0Pips + team1Pips) > 0;

  return (
    <>
      {/* ── Mobile compact ── */}
      <div className="flex sm:hidden flex-col rounded-xl bg-[#3a2210]/85 border border-[#c9a84c]/25 backdrop-blur-sm shadow-lg shadow-black/30 shrink-0" role="region" aria-label="Marcador">
      <div
        className="flex items-center gap-2 px-2 py-1"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={round}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c] shrink-0"
          >
            R{round}
          </motion.span>
        </AnimatePresence>

        <div className="flex flex-col gap-0.5">
          {([0, 1] as const).map((teamIdx) => {
            const s = scores[teamIdx];
            const pct = Math.min((s / targetScore) * 100, 100);
            const isMyTeam = myTeam === teamIdx;
            const color = isMyTeam ? "#c9a84c" : "#a8c4a0";
            return (
              <div key={teamIdx} className="flex items-center gap-1.5">
                {isMyTeam && <span className="text-[#c9a84c] text-[8px] shrink-0">◆</span>}
                <span className="text-[10px] font-bold tabular-nums w-5 text-right shrink-0" style={{ color }}>
                  {s}
                </span>
                <div
                  className="w-12 h-1.5 rounded-full bg-[#0f3520]/60 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={s}
                  aria-valuemin={0}
                  aria-valuemax={targetScore}
                  aria-label={`Equipo ${teamIdx + 1}: ${s} de ${targetScore}`}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {firstPlayerName && (
          <div className="flex items-center gap-0.5 shrink-0 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full px-1.5 py-0.5">
            <span className="text-[#c9a84c] text-[8px]">★</span>
            <span className="text-[9px] text-[#f5f0e8]/75 max-w-[36px] truncate leading-none">
              {firstPlayerName}
            </span>
          </div>
        )}
      </div>
      <RoundHistory
        history={roundHistory}
        myTeam={myTeam}
        className="px-2 pb-1.5 pt-1.5 border-t border-[#c9a84c]/12"
      />
      </div>

      {/* ── Desktop full panel ── */}
      <div
        className="hidden sm:flex flex-col rounded-2xl bg-[#3a2210]/90 border border-[#c9a84c]/30 backdrop-blur-sm shadow-xl shadow-black/40 overflow-hidden min-w-[240px]"
        role="region"
        aria-label="Marcador"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#c9a84c]/15 bg-[#2a1a08]/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, y: -6, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              <span className="text-[9px] text-[#a8c4a0]/50 uppercase tracking-widest font-semibold">Ronda</span>
              <span className="text-[15px] font-bold text-[#c9a84c] tabular-nums leading-none">{round}</span>
              <span className="text-[9px] text-[#a8c4a0]/30 uppercase tracking-widest">/ meta {targetScore}</span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {firstPlayerName ? (
              <motion.div
                key={firstPlayerName}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1 bg-[#c9a84c]/12 border border-[#c9a84c]/28 rounded-full px-2 py-0.5"
                aria-label={`Salió primero: ${firstPlayerName}`}
              >
                <span className="text-[#c9a84c] text-[9px]" aria-hidden="true">★</span>
                <span className="text-[10px] text-[#f5f0e8]/80 font-medium leading-none max-w-[64px] truncate">
                  {firstPlayerName}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="no-first"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 bg-[#f5f0e8]/5 border border-[#f5f0e8]/10 rounded-full px-2 py-0.5"
              >
                <span className="text-[#a8c4a0]/40 text-[9px]">★</span>
                <span className="text-[10px] text-[#a8c4a0]/35 leading-none">esperando</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Team cards */}
        <div className="flex flex-col gap-2 p-3">
          <TeamCard
            teamIdx={0}
            score={scores[0]}
            targetScore={targetScore}
            isMyTeam={myTeam === 0}
            seats={[0, 2]}
            players={players}
            firstSeat={firstSeat}
            streak={getStreak(roundHistory, 0)}
          />
          <ScoreGap scores={scores} myTeam={myTeam} />
          <TeamCard
            teamIdx={1}
            score={scores[1]}
            targetScore={targetScore}
            isMyTeam={myTeam === 1}
            seats={[1, 3]}
            players={players}
            firstSeat={firstSeat}
            streak={getStreak(roundHistory, 1)}
          />

          <AnimatePresence>
            {showPipBalance && (
              <PipBalance team0Pips={team0Pips} team1Pips={team1Pips} myTeam={myTeam} />
            )}
          </AnimatePresence>

          <RoundHistory history={roundHistory} myTeam={myTeam} />
        </div>
      </div>
    </>
  );
}
