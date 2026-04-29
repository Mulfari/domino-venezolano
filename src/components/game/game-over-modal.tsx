"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { RoundResult } from "@/lib/game/types";

const AUTO_START_DELAY = 6;

const CONFETTI_COLORS = [
  "#c9a84c", "#f5f0e8", "#4caf50", "#ff6b6b", "#64b5f6", "#ffb74d", "#ce93d8",
];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  drift: number;
}

function Confetti({ active }: { active: boolean }) {
  const particles = useMemo<ConfettiParticle[]>(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      duration: 2.2 + Math.random() * 1.8,
      delay: Math.random() * 1.2,
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            x: `calc(${p.x}vw + ${p.drift}px)`,
            opacity: [1, 1, 0.6, 0],
            rotate: p.rotate + 360,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 0.4),
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

interface GameOverModalProps {
  onNextRound?: () => void;
  onBackToLobby?: () => void;
}

export function GameOverModal({ onNextRound, onBackToLobby }: GameOverModalProps) {
  const roundResult = useGameStore((s) => s.roundResult);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);

  const [countdown, setCountdown] = useState(AUTO_START_DELAY);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggered = useRef(false);

  const gameOver = scores[0] >= targetScore || scores[1] >= targetScore;
  const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;

  const teamPlayers = (team: 0 | 1) =>
    players.filter((p) => p.seat % 2 === team).map((p) => p.displayName);

  const team0Names = teamPlayers(0);
  const team1Names = teamPlayers(1);

  useEffect(() => {
    if (!roundResult || gameOver || !onNextRound) {
      setCountdown(AUTO_START_DELAY);
      hasTriggered.current = false;
      return;
    }

    hasTriggered.current = false;
    setCountdown(AUTO_START_DELAY);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (!hasTriggered.current) {
            hasTriggered.current = true;
            onNextRound();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [roundResult, gameOver, onNextRound]);

  if (!roundResult) return null;

  if (gameOver) {
    return <GameOverView scores={scores} myTeam={myTeam} team0Names={team0Names} team1Names={team1Names} onBackToLobby={onBackToLobby} />;
  }

  return (
    <RoundEndView
      roundResult={roundResult}
      scores={scores}
      targetScore={targetScore}
      myTeam={myTeam}
      round={round}
      team0Names={team0Names}
      team1Names={team1Names}
      countdown={countdown}
      onNextRound={onNextRound}
    />
  );
}

// ─── Round End ────────────────────────────────────────────────────────────────

interface RoundEndViewProps {
  roundResult: RoundResult;
  scores: { 0: number; 1: number };
  targetScore: number;
  myTeam: 0 | 1 | null;
  round: number;
  team0Names: string[];
  team1Names: string[];
  countdown: number;
  onNextRound?: () => void;
}

function RoundEndView({
  roundResult,
  scores,
  targetScore,
  myTeam,
  round,
  team0Names,
  team1Names,
  countdown,
  onNextRound,
}: RoundEndViewProps) {
  const iWon = myTeam !== null && roundResult.winner_team === myTeam;
  const isDraw = roundResult.winner_team === null;

  const reasonLabel: Record<string, string> = {
    domino: "¡Dominó!",
    locked: "Trancado",
    tied: "Empate",
  };

  const reasonIcon: Record<string, string> = {
    domino: "🁣",
    locked: "🔒",
    tied: "🤝",
  };

  const winnerNames =
    roundResult.winner_team === 0 ? team0Names : roundResult.winner_team === 1 ? team1Names : [];

  const winnerLabel = isDraw
    ? "Sin ganador"
    : roundResult.winner_team === myTeam
    ? "¡Tu equipo!"
    : `Equipo ${roundResult.winner_team === 0 ? "A" : "B"}`;

  const progress0 = Math.min((scores[0] / targetScore) * 100, 100);
  const progress1 = Math.min((scores[1] / targetScore) * 100, 100);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-end-title"
      >
        {/* Confetti layer — outside the card so it fills the screen */}
        <Confetti active={iWon} />

        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="relative w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/30 overflow-hidden shadow-2xl"
        >
          {/* Header band */}
          <div
            className={`px-6 pt-6 pb-4 text-center ${
              iWon
                ? "bg-gradient-to-b from-[#c9a84c]/20 to-transparent"
                : isDraw
                ? "bg-gradient-to-b from-[#a8c4a0]/10 to-transparent"
                : "bg-gradient-to-b from-red-900/20 to-transparent"
            }`}
          >
            <motion.p
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
              className="text-4xl mb-1"
            >
              {reasonIcon[roundResult.reason] ?? "🁣"}
            </motion.p>

            <motion.p
              id="round-end-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`text-2xl font-bold tracking-tight ${
                iWon ? "text-[#c9a84c]" : isDraw ? "text-[#a8c4a0]" : "text-red-400"
              }`}
            >
              {reasonLabel[roundResult.reason] ?? roundResult.reason}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-[#f5f0e8]/70 mt-0.5"
            >
              Ronda {round}
            </motion.p>
          </div>

          {/* Winner row */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="mx-6 mb-4 rounded-xl bg-[#1e5c3a]/50 border border-[#c9a84c]/15 px-4 py-3 flex items-center gap-3"
          >
            <span className="text-xl">{isDraw ? "🤝" : iWon ? "🏆" : "😔"}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs uppercase tracking-wider font-semibold ${iWon ? "text-[#c9a84c]" : isDraw ? "text-[#a8c4a0]" : "text-red-400"}`}>
                {winnerLabel}
              </p>
              {winnerNames.length > 0 && (
                <p className="text-[#f5f0e8]/60 text-xs truncate">{winnerNames.join(" & ")}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#a8c4a0] uppercase tracking-wider">puntos</p>
              <p className="text-xl font-bold text-[#f5f0e8]">+{roundResult.points}</p>
            </div>
          </motion.div>

          {/* Score progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-6 mb-5 space-y-2"
          >
            {([0, 1] as const).map((team) => {
              const isMyT = myTeam === team;
              const names = team === 0 ? team0Names : team1Names;
              const score = scores[team];
              const progress = team === 0 ? progress0 : progress1;
              return (
                <div key={team}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-[11px] font-medium ${isMyT ? "text-[#c9a84c]" : "text-[#f5f0e8]/60"}`}>
                      {names.length > 0 ? names.join(" & ") : `Equipo ${team === 0 ? "A" : "B"}`}
                    </span>
                    <span className={`text-sm font-bold ${isMyT ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                      {score}
                      <span className="text-[10px] font-normal text-[#a8c4a0]">/{targetScore}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1e5c3a]/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${isMyT ? "bg-[#c9a84c]" : "bg-[#f5f0e8]/40"}`}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Countdown / waiting */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="mx-6 mb-6"
          >
            {onNextRound ? (
              <div className="space-y-1.5">
                <div className="relative h-1 rounded-full bg-[#1e5c3a]/50 overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: AUTO_START_DELAY, ease: "linear" }}
                    className="absolute inset-y-0 left-0 bg-[#c9a84c]/70 rounded-full"
                  />
                </div>
                <p className="text-center text-xs text-[#a8c4a0]/60">
                  Siguiente ronda en {countdown}s
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                <p className="text-sm text-[#a8c4a0]">Esperando al host…</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Game Over / Podium ───────────────────────────────────────────────────────

interface GameOverViewProps {
  scores: { 0: number; 1: number };
  myTeam: 0 | 1 | null;
  team0Names: string[];
  team1Names: string[];
  onBackToLobby?: () => void;
}

function GameOverView({ scores, myTeam, team0Names, team1Names, onBackToLobby }: GameOverViewProps) {
  const winnerTeam: 0 | 1 = scores[0] >= scores[1] ? 0 : 1;
  const loserTeam: 0 | 1 = winnerTeam === 0 ? 1 : 0;
  const iWon = myTeam === winnerTeam;

  const teamLabel = (team: 0 | 1) => {
    const names = team === 0 ? team0Names : team1Names;
    return names.length > 0 ? names.join(" & ") : `Equipo ${team === 0 ? "A" : "B"}`;
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <Confetti active={iWon} />

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/40 overflow-hidden shadow-2xl"
        >
          {/* Title */}
          <div className="pt-7 pb-3 text-center bg-gradient-to-b from-[#c9a84c]/15 to-transparent">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 350 }}
              className="text-5xl mb-2"
            >
              {iWon ? "🏆" : "🎖️"}
            </motion.p>
            <motion.p
              id="game-over-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={`text-2xl font-bold ${iWon ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}
            >
              {iWon ? "¡Victoria!" : "Fin de partida"}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-[#a8c4a0] mt-0.5"
            >
              {teamLabel(winnerTeam)} gana la partida
            </motion.p>
          </div>

          {/* Podium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mx-6 my-5 flex items-end justify-center gap-4"
          >
            {/* Loser — shorter block */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-[11px] text-[#f5f0e8]/50 text-center leading-tight">
                {teamLabel(loserTeam)}
              </p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 56 }}
                transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
                className="w-full rounded-t-lg bg-[#1e5c3a]/70 border border-[#f5f0e8]/10 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-lg">🥈</span>
                <span className="text-lg font-bold text-[#f5f0e8]">{scores[loserTeam]}</span>
              </motion.div>
            </div>

            {/* Winner — taller block */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-[11px] text-[#c9a84c] text-center leading-tight font-semibold">
                {teamLabel(winnerTeam)}
              </p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 88 }}
                transition={{ delay: 0.65, duration: 0.55, ease: "easeOut" }}
                className="w-full rounded-t-lg bg-gradient-to-b from-[#c9a84c]/30 to-[#1e5c3a]/70 border border-[#c9a84c]/40 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-2xl">🥇</span>
                <span className="text-2xl font-bold text-[#c9a84c]">{scores[winnerTeam]}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mx-6 mb-6"
          >
            <button
              onClick={onBackToLobby}
              className="w-full rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] active:bg-[#b8943e] px-6 py-3 text-sm font-semibold text-[#2a1a0a] transition-colors"
            >
              Volver al inicio
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
