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

function TeamSection({
  teamIdx, score, targetScore, isMyTeam, seats, players, firstSeat,
}: {
  teamIdx: 0 | 1;
  score: number;
  targetScore: number;
  isMyTeam: boolean;
  seats: Seat[];
  players: { seat: Seat; displayName: string; connected: boolean; isBot?: boolean }[];
  firstSeat: Seat | null;
}) {
  const display = useAnimatedCounter(score);
  const pct = Math.min((score / targetScore) * 100, 100);
  const remaining = Math.max(targetScore - score, 0);

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

  const teamLabel = isMyTeam ? "Nosotros" : "Rivales";
  const accentColor = isMyTeam ? "#c9a84c" : "#a8c4a0";
  const barClass = isMyTeam ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/70";

  return (
    <motion.div
      animate={flash ? { boxShadow: ["0 0 0px rgba(201,168,76,0)", "0 0 20px rgba(201,168,76,0.5)", "0 0 0px rgba(201,168,76,0)"] } : {}}
      transition={{ duration: 0.9 }}
      className={`rounded-xl border px-3 py-2.5 transition-opacity ${
        isMyTeam
          ? "border-[#c9a84c]/40 bg-[#c9a84c]/6"
          : "border-[#f5f0e8]/10 bg-[#0f3520]/25 opacity-75"
      }`}
    >
      {/* Team header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {isMyTeam && <span className="text-[#c9a84c] text-[9px]">◆</span>}
            <span
              className="text-[11px] font-bold uppercase tracking-widest leading-none"
              style={{ color: accentColor }}
            >
              {teamLabel}
            </span>
          </div>
          {/* Player names */}
          <div className="flex flex-col gap-0.5 mt-1">
            {seats.map((s) => {
              const p = players.find((pl) => pl.seat === s);
              const name = p?.displayName ?? `Jugador ${s + 1}`;
              const online = p?.connected ?? false;
              const isBot = p?.isBot ?? false;
              const isFirst = firstSeat === s;
              return (
                <div key={s} className="flex items-center gap-1 min-w-0">
                  <span
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
                      aria-label="Salió primero esta ronda"
                      title="Salió primero esta ronda"
                    >
                      ★
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-end shrink-0 relative">
          <motion.span
            key={score}
            initial={{ scale: 1.5, color: "#ffffff" }}
            animate={{ scale: 1, color: isMyTeam ? "#f5f0e8" : "#a8c4a0" }}
            transition={{ duration: 0.35 }}
            className="text-2xl font-bold tabular-nums leading-none"
          >
            {display}
          </motion.span>
          <span className="text-[9px] text-[#a8c4a0]/40 tabular-nums leading-none mt-0.5">
            /{targetScore}
          </span>
          <AnimatePresence>
            {delta !== null && (
              <motion.span
                key={`d-${score}`}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -18 }}
                exit={{ opacity: 0, y: -28 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="absolute -top-1 -right-1 text-[11px] font-bold text-green-400 tabular-nums pointer-events-none"
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
        className="h-2 rounded-full bg-[#0f3520]/70 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={targetScore}
        aria-label={`${teamLabel}: ${score} de ${targetScore} puntos`}
      >
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-[#a8c4a0]/35 tabular-nums">{pct.toFixed(0)}%</span>
        <span className="text-[8px] text-[#a8c4a0]/40 tabular-nums">
          {remaining > 0 ? `faltan ${remaining}` : "¡meta!"}
        </span>
      </div>
    </motion.div>
  );
}

function RoundHistory({
  history, myTeam,
}: {
  history: RoundHistoryEntry[];
  myTeam: 0 | 1 | null;
}) {
  if (history.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-[#c9a84c]/12">
      <div className="text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-1">Historial</div>
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
              aria-label={`Ronda ${entry.round}: ${tied ? "Empate" : `Equipo ${(entry.winner_team ?? 0) + 1} ganó`}, ${entry.points} pts, ${reasonFull}`}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[8px] font-semibold tabular-nums ${bg}`}
            >
              <span className="text-[#f5f0e8]/30">{entry.round}</span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
              <span className="text-[#f5f0e8]/70">{entry.points}</span>
              <span className="text-[#f5f0e8]/35 text-[7px] font-bold">{reason}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
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

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;
  const firstSeat = (board.plays[0]?.seat ?? null) as Seat | null;
  const firstPlayer = firstSeat !== null ? players.find((p) => p.seat === firstSeat) : null;
  const firstPlayerName = firstPlayer?.displayName.split(" ")[0] ?? null;

  return (
    <>
      {/* ── Mobile compact ── */}
      <div
        className="flex sm:hidden items-center gap-2 rounded-xl bg-[#3a2210]/85 border border-[#c9a84c]/25 backdrop-blur-sm px-2.5 py-1.5 shadow-lg shadow-black/30 shrink-0"
        role="region"
        aria-label="Marcador"
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
            const color = teamIdx === 0 ? "#c9a84c" : "#a8c4a0";
            const isMyTeam = myTeam === teamIdx;
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

      {/* ── Desktop full panel ── */}
      <div
        className="hidden sm:flex flex-col gap-0 rounded-2xl bg-[#3a2210]/88 border border-[#c9a84c]/28 backdrop-blur-sm shadow-xl shadow-black/35 overflow-hidden min-w-[230px]"
        role="region"
        aria-label="Marcador"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#c9a84c]/15 bg-[#2a1a08]/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, y: -6, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-[10px] text-[#a8c4a0]/50 uppercase tracking-widest">Ronda</span>
              <span className="text-[13px] font-bold text-[#c9a84c] tabular-nums">{round}</span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {firstPlayerName && (
              <motion.div
                key={firstPlayerName}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1 bg-[#c9a84c]/12 border border-[#c9a84c]/25 rounded-full px-2 py-0.5"
                aria-label={`Salió primero: ${firstPlayerName}`}
              >
                <span className="text-[#c9a84c] text-[9px]" aria-hidden="true">★</span>
                <span className="text-[10px] text-[#f5f0e8]/80 font-medium leading-none max-w-[60px] truncate">
                  {firstPlayerName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Team sections */}
        <div className="flex flex-col gap-2 p-3">
          {([0, 1] as const).map((teamIdx) => (
            <TeamSection
              key={teamIdx}
              teamIdx={teamIdx}
              score={scores[teamIdx]}
              targetScore={targetScore}
              isMyTeam={myTeam === teamIdx}
              seats={teamIdx === 0 ? [0, 2] : [1, 3]}
              players={players}
              firstSeat={firstSeat}
            />
          ))}

          <RoundHistory history={roundHistory} myTeam={myTeam} />
        </div>
      </div>
    </>
  );
}
