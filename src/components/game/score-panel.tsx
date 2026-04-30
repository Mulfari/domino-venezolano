"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

function useAnimatedCounter(target: number, duration = 800) {
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
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

function PlayerDot({
  seat,
  players,
  isFirst,
}: {
  seat: Seat;
  players: { seat: Seat; displayName: string; connected: boolean; isBot?: boolean }[];
  isFirst: boolean;
}) {
  const player = players.find((p) => p.seat === seat);
  const name = player ? player.displayName.split(" ")[0] : `J${seat + 1}`;
  const online = player?.connected ?? false;
  const isBot = player?.isBot ?? false;

  return (
    <div className="flex items-center gap-1 min-w-0">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          online ? "bg-green-400/80" : "bg-red-400/50"
        }`}
        aria-label={online ? "conectado" : "desconectado"}
        role="img"
      />
      <span className="text-[9px] sm:text-[10px] text-[#f5f0e8]/75 truncate leading-none">
        {name}
        {isBot && <span className="text-[#a8c4a0]/50 ml-0.5">🤖</span>}
      </span>
      {isFirst && (
        <span
          aria-label="Salió primero esta ronda"
          className="text-[8px] leading-none text-[#c9a84c] shrink-0"
        >
          ★
        </span>
      )}
    </div>
  );
}

function TeamBlock({
  teamIdx,
  score,
  targetScore,
  isMyTeam,
  seats,
  players,
  firstSeat,
}: {
  teamIdx: 0 | 1;
  score: number;
  targetScore: number;
  isMyTeam: boolean;
  seats: Seat[];
  players: { seat: Seat; displayName: string; connected: boolean; isBot?: boolean }[];
  firstSeat: Seat | null;
}) {
  const display = useAnimatedCounter(score, 600);
  const pct = Math.min((score / targetScore) * 100, 100);
  const remaining = Math.max(targetScore - score, 0);

  const teamColor = teamIdx === 0 ? "#c9a84c" : "#a8c4a0";
  const barBg = teamIdx === 0 ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/70";

  const prevScoreRef = useRef(score);
  const [flashing, setFlashing] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      const diff = score - prevScoreRef.current;
      setDelta(diff);
      if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
      deltaTimerRef.current = setTimeout(() => setDelta(null), 2000);
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 900);
      prevScoreRef.current = score;
      return () => clearTimeout(t);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <motion.div
      animate={flashing ? { boxShadow: ["0 0 0px rgba(201,168,76,0)", "0 0 18px rgba(201,168,76,0.55)", "0 0 0px rgba(201,168,76,0)"] } : {}}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className={`rounded-xl p-2 sm:p-2.5 border transition-opacity ${
        isMyTeam
          ? "border-[#c9a84c]/35 bg-[#c9a84c]/5"
          : "border-[#f5f0e8]/8 bg-[#0f3520]/20 opacity-70"
      }`}
    >
      {/* Team header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          {isMyTeam && (
            <span className="text-[#c9a84c] text-[8px] leading-none">◆</span>
          )}
          <span
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide"
            style={{ color: teamColor }}
          >
            Equipo {teamIdx + 1}
          </span>
        </div>
        <div className="flex items-baseline gap-0.5 relative">
          <motion.span
            key={score}
            initial={{ scale: 1.4, color: "#ffffff" }}
            animate={{ scale: 1, color: isMyTeam ? "#f5f0e8" : "#a8c4a0" }}
            transition={{ duration: 0.3 }}
            className="text-base sm:text-lg font-bold tabular-nums leading-none"
          >
            {display}
          </motion.span>
          <span className="text-[8px] text-[#a8c4a0]/40 tabular-nums">/{targetScore}</span>
          <AnimatePresence>
            {delta !== null && (
              <motion.span
                key={`delta-${score}`}
                initial={{ opacity: 0, y: 0, x: 4 }}
                animate={{ opacity: 1, y: -14, x: 8 }}
                exit={{ opacity: 0, y: -22, x: 8 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute right-0 top-0 text-[10px] font-bold text-green-400 tabular-nums pointer-events-none"
                style={{ textShadow: "0 0 8px rgba(74,222,128,0.6)" }}
              >
                +{delta}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Player names */}
      <div className="flex flex-col gap-0.5 mb-2">
        {seats.map((s) => (
          <PlayerDot
            key={s}
            seat={s}
            players={players}
            isFirst={firstSeat === s}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 sm:h-2 rounded-full bg-[#0f3520]/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={targetScore}
        aria-label={`Equipo ${teamIdx + 1}: ${score} de ${targetScore} puntos`}
      >
        <motion.div
          className={`h-full rounded-full ${barBg}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Remaining */}
      <div className="flex justify-between items-center mt-0.5">
        <span className="text-[7px] sm:text-[8px] text-[#a8c4a0]/35 tabular-nums">
          {pct.toFixed(0)}%
        </span>
        <span className="text-[7px] sm:text-[8px] text-[#a8c4a0]/40 tabular-nums">
          {remaining > 0 ? `faltan ${remaining}` : "¡meta!"}
        </span>
      </div>
    </motion.div>
  );
}

function RoundHistoryRow({
  roundHistory,
  myTeam,
  compact = false,
}: {
  roundHistory: import("@/stores/game-store").RoundHistoryEntry[];
  myTeam: 0 | 1 | null;
  compact?: boolean;
}) {
  if (roundHistory.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-1 ${compact ? "" : "mt-2 pt-1.5 border-t border-[#c9a84c]/10"}`}
      role="list"
      aria-label="Historial de rondas"
    >
      {!compact && (
        <div className="w-full text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-0.5">
          Historial
        </div>
      )}
      {roundHistory.map((entry) => {
        const isTied = entry.winner_team === null;
        const isMyTeamWon = myTeam !== null && entry.winner_team === myTeam;
        const bgColor = isTied
          ? "bg-[#a8c4a0]/10 border-[#a8c4a0]/25"
          : isMyTeamWon
          ? "bg-[#c9a84c]/15 border-[#c9a84c]/35"
          : "bg-[#f5f0e8]/5 border-[#f5f0e8]/12";
        const dotColor = isTied
          ? "bg-[#a8c4a0]/50"
          : entry.winner_team === 0
          ? "bg-[#c9a84c]"
          : "bg-[#a8c4a0]";
        const reasonLabel =
          entry.reason === "domino" ? "D" : entry.reason === "locked" ? "T" : "=";
        const reasonTitle =
          entry.reason === "domino" ? "dominó" : entry.reason === "locked" ? "trancado" : "empate";

        return (
          <motion.div
            key={entry.round}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            role="listitem"
            aria-label={`Ronda ${entry.round}: ${
              isTied ? "Empate" : `Equipo ${(entry.winner_team ?? 0) + 1} ganó`
            }, ${entry.points} puntos, ${reasonTitle}`}
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] font-semibold tabular-nums ${bgColor}`}
          >
            <span className="text-[#f5f0e8]/30 tabular-nums leading-none">{entry.round}</span>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            <span className="text-[#f5f0e8]/70">{entry.points}</span>
            <span className="text-[#f5f0e8]/40 text-[7px] leading-none font-bold">{reasonLabel}</span>
          </motion.div>
        );
      })}
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
  const firstPlayerName = firstPlayer
    ? firstPlayer.displayName.split(" ")[0]
    : null;

  return (
    <>
      {/* Mobile compact — scores + history */}
      <div className="flex sm:hidden flex-col gap-1 rounded-xl bg-[#3a2210]/85 border border-[#c9a84c]/25 backdrop-blur-sm px-2 py-1.5 shadow-lg shadow-black/30 shrink-0" role="region" aria-label="Marcador">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={round}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] shrink-0"
            >
              R{round}
            </motion.span>
          </AnimatePresence>
          <div className="flex flex-col gap-0.5">
            {([0, 1] as const).map((teamIdx) => {
              const score = scores[teamIdx];
              const pct = Math.min((score / targetScore) * 100, 100);
              const isMyTeam = myTeam === teamIdx;
              const color = teamIdx === 0 ? "#c9a84c" : "#a8c4a0";
              return (
                <div key={teamIdx} className="flex items-center gap-1">
                  {isMyTeam && <span className="text-[#c9a84c] text-[8px] leading-none shrink-0">◆</span>}
                  <span className="text-[9px] font-bold tabular-nums w-5 text-right shrink-0" style={{ color }}>
                    {score}
                  </span>
                  <div
                    className="w-10 h-1.5 rounded-full bg-[#0f3520]/60 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={targetScore}
                    aria-label={`Equipo ${teamIdx + 1}: ${score} de ${targetScore} puntos`}
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
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[#c9a84c] text-[8px] leading-none">★</span>
              <span className="text-[8px] text-[#f5f0e8]/70 leading-none max-w-[40px] truncate">
                {firstPlayerName}
              </span>
            </div>
          )}
        </div>
        {roundHistory.length > 0 && (
          <div className="border-t border-[#c9a84c]/10 pt-1">
            <RoundHistoryRow roundHistory={roundHistory} myTeam={myTeam} compact />
          </div>
        )}
      </div>

      {/* Desktop full panel */}
      <div className="hidden sm:block rounded-2xl bg-[#3a2210]/85 border border-[#c9a84c]/25 backdrop-blur-sm p-3 min-w-[220px] shadow-lg shadow-black/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={round}
                initial={{ opacity: 0, y: -8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.85 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]"
              >
                Ronda {round}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            {firstPlayerName && (
              <motion.div
                key={firstPlayerName}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full px-1.5 py-0.5"
                aria-label={`Salió primero: ${firstPlayerName}`}
              >
                <span className="text-[#c9a84c] text-[8px] leading-none" aria-hidden="true">★</span>
                <span className="text-[9px] text-[#f5f0e8]/80 leading-none" aria-hidden="true">
                  {firstPlayerName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Team blocks */}
        <div className="flex flex-col gap-1.5">
          {([0, 1] as const).map((teamIdx) => (
            <TeamBlock
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
        </div>

        <RoundHistoryRow roundHistory={roundHistory} myTeam={myTeam} />
      </div>
    </>
  );
}
