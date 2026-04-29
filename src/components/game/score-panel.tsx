"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { Seat } from "@/lib/game/types";

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
  const firstPlayerName =
    firstSeat !== null
      ? (players.find((p) => p.seat === firstSeat)?.displayName ?? `J${firstSeat + 1}`).split(" ")[0]
      : null;

  function teamLabel(teamIdx: 0 | 1): string {
    const seats: Seat[] = teamIdx === 0 ? [0, 2] : [1, 3];
    return seats
      .map((s) => {
        const name = players.find((p) => p.seat === s)?.displayName ?? `J${s + 1}`;
        return name.split(" ")[0];
      })
      .join(" & ");
  }

  const team0Label = teamLabel(0);
  const team1Label = teamLabel(1);

  return (
    <div className="rounded-2xl bg-[#3a2210]/80 border border-[#c9a84c]/20 backdrop-blur-sm p-2 sm:p-3 min-w-0 sm:min-w-[200px]">
      {/* Round + target */}
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#c9a84c]/80 font-semibold">
          Ronda {round}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#a8c4a0]/50">
          meta: {targetScore}
        </span>
      </div>

      {/* Who started — hidden on mobile to save vertical space */}
      {firstPlayerName && (
        <div className="hidden sm:block mb-1.5 sm:mb-2 text-center">
          <span className="text-[8px] sm:text-[9px] text-[#a8c4a0]/50 uppercase tracking-wider">
            salió:{" "}
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#f5f0e8]/70">
            {firstPlayerName}
          </span>
        </div>
      )}

      {/* Team rows */}
      {([0, 1] as const).map((teamIdx) => {
        const score = scores[teamIdx];
        const pct = Math.min((score / targetScore) * 100, 100);
        const isMyTeam = myTeam === teamIdx;
        const opponent = teamIdx === 0 ? 1 : 0;
        const isWinning = score > scores[opponent];
        const label = teamIdx === 0 ? team0Label : team1Label;

        return (
          <div
            key={teamIdx}
            className={`mb-1 sm:mb-1.5 last:mb-0 ${isMyTeam ? "opacity-100" : "opacity-70"}`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={`text-[9px] sm:text-[10px] font-medium truncate max-w-[100px] sm:max-w-[140px] ${
                  isMyTeam ? "text-[#c9a84c]" : "text-[#f5f0e8]/80"
                }`}
              >
                {label}
              </span>
              <motion.span
                key={score}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`text-sm sm:text-base font-bold tabular-nums ml-2 shrink-0 ${
                  isWinning ? "text-[#f5f0e8]" : "text-[#a8c4a0]/60"
                }`}
              >
                {score}
              </motion.span>
            </div>
            <div className="h-1 sm:h-1.5 rounded-full bg-[#0f3520]/60 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isMyTeam ? "bg-[#c9a84c]" : "bg-[#a8c4a0]/40"
                }`}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}

      {/* Round history — hidden on mobile to save vertical space */}
      {roundHistory.length > 0 && (
        <div className="hidden sm:block mt-2 pt-1.5 border-t border-[#c9a84c]/10">
          <div className="flex flex-wrap gap-1">
            {roundHistory.map((entry) => {
              const isTeam0 = entry.winner_team === 0;
              const isTeam1 = entry.winner_team === 1;
              const isTied = entry.winner_team === null;
              const isMyTeamWon = myTeam !== null && entry.winner_team === myTeam;

              const bgColor = isTied
                ? "bg-[#a8c4a0]/15 border-[#a8c4a0]/30"
                : isMyTeamWon
                ? "bg-[#c9a84c]/20 border-[#c9a84c]/40"
                : "bg-[#f5f0e8]/5 border-[#f5f0e8]/15";

              const dotColor = isTied
                ? "bg-[#a8c4a0]/60"
                : isTeam0
                ? "bg-[#c9a84c]"
                : "bg-[#a8c4a0]";

              const reasonIcon = entry.reason === "domino" ? "⬛" : entry.reason === "locked" ? "🔒" : "=";

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
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                  />
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
