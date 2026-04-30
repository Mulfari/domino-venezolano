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
      />
      <span className="text-[9px] sm:text-[10px] text-[#f5f0e8]/75 truncate leading-none">
        {name}
        {isBot && <span className="text-[#a8c4a0]/50 ml-0.5">🤖</span>}
      </span>
      {isFirst && (
        <span
          title="Salió primero esta ronda"
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
  const isLeading = score > 0;

  const teamColor = teamIdx === 0 ? "#c9a84c" : "#a8c4a0";
  const barBg = teamIdx === 0 ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/70";

  return (
    <div
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
        <div className="flex items-baseline gap-0.5">
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
      <div className="h-1.5 sm:h-2 rounded-full bg-[#0f3520]/60 overflow-hidden">
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
    <div className="rounded-2xl bg-[#3a2210]/85 border border-[#c9a84c]/25 backdrop-blur-sm p-2 sm:p-3 min-w-0 sm:min-w-[220px] shadow-lg shadow-black/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]">
            Ronda {round}
          </span>
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
            >
              <span className="text-[#c9a84c] text-[8px] leading-none">★</span>
              <span className="text-[8px] sm:text-[9px] text-[#f5f0e8]/80 leading-none">
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

      {/* Round history */}
      {roundHistory.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-[#c9a84c]/10">
          <div className="text-[7px] sm:text-[8px] uppercase tracking-wider text-[#a8c4a0]/40 mb-1">
            Historial
          </div>
          <div className="flex flex-wrap gap-1">
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
                entry.reason === "domino"
                  ? "D"
                  : entry.reason === "locked"
                  ? "T"
                  : "=";
              const reasonTitle =
                entry.reason === "domino"
                  ? "dominó"
                  : entry.reason === "locked"
                  ? "trancado"
                  : "empate";

              return (
                <motion.div
                  key={entry.round}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  title={`Ronda ${entry.round}: ${
                    isTied
                      ? "Empate"
                      : `Equipo ${(entry.winner_team ?? 0) + 1} ganó`
                  } · ${entry.points} pts · ${reasonTitle}`}
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
        </div>
      )}
    </div>
  );
}
