"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

function TeamRow({
  teamIdx,
  score,
  targetScore,
  label,
  isMyTeam,
  isWinning,
  seats,
  players,
}: {
  teamIdx: 0 | 1;
  score: number;
  targetScore: number;
  label: string;
  isMyTeam: boolean;
  isWinning: boolean;
  seats: Seat[];
  players: { seat: Seat; connected: boolean; isBot?: boolean }[];
}) {
  const display = useAnimatedCounter(score, 600);
  const pct = Math.min((score / targetScore) * 100, 100);
  const remaining = Math.max(targetScore - score, 0);

  return (
    <div className={`${isMyTeam ? "opacity-100" : "opacity-65"}`}>
      {/* Team header: name + score */}
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <div className="flex items-center gap-1 min-w-0">
          {isMyTeam && (
            <span className="text-[#c9a84c] text-[9px] leading-none shrink-0">★</span>
          )}
          <span
            className={`text-[9px] sm:text-[10px] font-semibold truncate ${
              isMyTeam ? "text-[#c9a84c]" : "text-[#f5f0e8]/80"
            }`}
          >
            {label}
          </span>
          {/* connection dots */}
          <div className="flex gap-0.5 shrink-0">
            {seats.map((s) => {
              const p = players.find((pl) => pl.seat === s);
              const online = p?.connected ?? false;
              return (
                <span
                  key={s}
                  className={`w-1 h-1 rounded-full ${online ? "bg-green-400/70" : "bg-red-400/50"}`}
                />
              );
            })}
          </div>
        </div>
        <motion.span
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-sm sm:text-base font-bold tabular-nums shrink-0 ${
            isWinning ? "text-[#f5f0e8]" : "text-[#a8c4a0]/60"
          }`}
        >
          {display}
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="h-1 sm:h-1.5 rounded-full bg-[#0f3520]/60 overflow-hidden mb-0.5">
        <motion.div
          className={`h-full rounded-full ${isMyTeam ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/40"}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Points remaining */}
      <div className="text-right">
        <span className="text-[8px] text-[#a8c4a0]/40 tabular-nums">
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

  const firstSeat = board.plays[0]?.seat ?? null;
  const firstPlayer = firstSeat !== null ? players.find((p) => p.seat === firstSeat) : null;
  const firstPlayerName = firstPlayer
    ? firstPlayer.displayName.split(" ")[0]
    : null;

  function teamLabel(teamIdx: 0 | 1): string {
    const seats: Seat[] = teamIdx === 0 ? [0, 2] : [1, 3];
    return seats
      .map((s) => (players.find((p) => p.seat === s)?.displayName ?? `J${s + 1}`).split(" ")[0])
      .join(" & ");
  }

  return (
    <div className="rounded-2xl bg-[#3a2210]/80 border border-[#c9a84c]/20 backdrop-blur-sm p-2 sm:p-3 min-w-0 sm:min-w-[210px]">
      {/* Header: round + meta + salió */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#c9a84c]/80 font-semibold">
          Ronda {round}
        </span>
        <div className="flex items-center gap-1.5">
          {firstPlayerName && (
            <span className="text-[8px] sm:text-[9px] text-[#a8c4a0]/60">
              salió: <span className="text-[#f5f0e8]/80">{firstPlayerName}</span>
            </span>
          )}
          <span className="text-[8px] sm:text-[9px] text-[#a8c4a0]/40">
            /{targetScore}
          </span>
        </div>
      </div>

      {/* Team rows */}
      <div className="flex flex-col gap-1.5">
        {([0, 1] as const).map((teamIdx) => (
          <TeamRow
            key={teamIdx}
            teamIdx={teamIdx}
            score={scores[teamIdx]}
            targetScore={targetScore}
            label={teamLabel(teamIdx)}
            isMyTeam={myTeam === teamIdx}
            isWinning={scores[teamIdx] > scores[teamIdx === 0 ? 1 : 0]}
            seats={teamIdx === 0 ? [0, 2] : [1, 3]}
            players={players}
          />
        ))}
      </div>

      {/* Round history */}
      {roundHistory.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-[#c9a84c]/10">
          <div className="flex flex-wrap gap-1">
            {roundHistory.map((entry) => {
              const isTied = entry.winner_team === null;
              const isMyTeamWon = myTeam !== null && entry.winner_team === myTeam;
              const bgColor = isTied
                ? "bg-[#a8c4a0]/15 border-[#a8c4a0]/30"
                : isMyTeamWon
                ? "bg-[#c9a84c]/20 border-[#c9a84c]/40"
                : "bg-[#f5f0e8]/5 border-[#f5f0e8]/15";
              const dotColor = isTied
                ? "bg-[#a8c4a0]/60"
                : entry.winner_team === 0
                ? "bg-[#c9a84c]"
                : "bg-[#a8c4a0]";
              const reasonIcon =
                entry.reason === "domino" ? "⬛" : entry.reason === "locked" ? "🔒" : "=";

              return (
                <motion.div
                  key={entry.round}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  title={`Ronda ${entry.round}: ${
                    isTied ? "Empate" : `Equipo ${(entry.winner_team ?? 0) + 1} ganó`
                  } · ${entry.points} pts · ${
                    entry.reason === "domino" ? "dominó" : entry.reason === "locked" ? "trancado" : "empate"
                  }`}
                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] font-semibold tabular-nums ${bgColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <span className="text-[#f5f0e8]/70">{entry.points}</span>
                  <span className="text-[8px] leading-none">{reasonIcon}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
