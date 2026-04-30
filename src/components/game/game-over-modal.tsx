"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { RoundResult } from "@/lib/game/types";

const AUTO_START_DELAY = 7;

const CONFETTI_COLORS = [
  "#c9a84c", "#f5f0e8", "#4caf50", "#ff6b6b", "#64b5f6",
  "#ffb74d", "#ce93d8", "#80cbc4", "#fff176", "#ef9a9a",
];

interface ConfettiParticle {
  id: number;
  x: number;
  startY: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  drift: number;
  shape: "rect" | "circle" | "strip";
  burst: boolean;
  angle: number;
  radius: number;
}

function Confetti({ active }: { active: boolean }) {
  const particles = useMemo<ConfettiParticle[]>(() => {
    const falling = Array.from({ length: 70 }, (_, i) => {
      const shape = (i % 3 === 0 ? "circle" : i % 3 === 1 ? "strip" : "rect") as "rect" | "circle" | "strip";
      return {
        id: i,
        x: 5 + Math.random() * 90,
        startY: -10 - Math.random() * 40,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: shape === "strip" ? 3 + Math.random() * 3 : 5 + Math.random() * 9,
        duration: 2.2 + Math.random() * 2.8,
        delay: Math.random() * 2.0,
        rotate: Math.random() * 720 - 360,
        drift: (Math.random() - 0.5) * 200,
        shape,
        burst: false,
        angle: 0,
        radius: 0,
      };
    });
    // Burst particles from center
    const burst = Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2;
      return {
        id: 70 + i,
        x: 50,
        startY: 0,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        duration: 1.0 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
        rotate: Math.random() * 540,
        drift: 0,
        shape: (i % 2 === 0 ? "circle" : "rect") as "rect" | "circle" | "strip",
        burst: true,
        angle,
        radius: 120 + Math.random() * 180,
      };
    });
    return [...falling, ...burst];
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[60]" aria-hidden="true">
      {particles.map((p) => {
        if (p.burst) {
          const dx = Math.cos(p.angle) * p.radius;
          const dy = Math.sin(p.angle) * p.radius;
          return (
            <motion.div
              key={p.id}
              initial={{ x: "50vw", y: "50vh", opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: `calc(50vw + ${dx}px)`,
                y: `calc(50vh + ${dy}px)`,
                opacity: [1, 1, 0],
                scale: [1, 1.2, 0.4],
                rotate: p.rotate,
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0, 0.6, 1] }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: p.size,
                height: p.shape === "circle" ? p.size : p.size * 0.6,
                backgroundColor: p.color,
                borderRadius: p.shape === "circle" ? "50%" : "3px",
              }}
            />
          );
        }
        return (
          <motion.div
            key={p.id}
            initial={{ y: `${p.startY}px`, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              y: "108vh",
              x: `calc(${p.x}vw + ${p.drift}px)`,
              opacity: [1, 1, 1, 0.4, 0],
              rotate: p.rotate,
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0, 0.8, 1] }}
            style={{
              position: "fixed",
              top: 0,
              width: p.size,
              height: p.shape === "strip" ? p.size * 4 : p.shape === "circle" ? p.size : p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "strip" ? "2px" : "3px",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, from = 0, delay = 0 }: { value: number; from?: number; delay?: number }) {
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const duration = 700;
      const tick = () => {
        const elapsed = Date.now() - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(from + (value - from) * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, from, delay]);

  return <>{display}</>;
}

// ─── Flash overlay ────────────────────────────────────────────────────────────

function FlashOverlay({ color = "white" }: { color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.55 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="pointer-events-none fixed inset-0 z-[55]"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
    return (
      <GameOverView
        scores={scores}
        myTeam={myTeam}
        team0Names={team0Names}
        team1Names={team1Names}
        onBackToLobby={onBackToLobby}
      />
    );
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

const REASON_META: Record<string, { label: string; icon: string; desc: string }> = {
  domino: { label: "¡Dominó!", icon: "🁣", desc: "Jugó todas sus fichas" },
  locked: { label: "Trancado", desc: "El juego quedó bloqueado", icon: "🔒" },
  tied:   { label: "Empate",   desc: "Ambos equipos empataron", icon: "🤝" },
};

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
  const meta = REASON_META[roundResult.reason] ?? { label: roundResult.reason, icon: "🁣", desc: "" };

  const winnerTeam = roundResult.winner_team;
  const winnerNames =
    winnerTeam === 0 ? team0Names :
    winnerTeam === 1 ? team1Names : [];

  const winnerLabel = isDraw
    ? "Sin ganador"
    : winnerTeam === myTeam
    ? "¡Tu equipo ganó!"
    : `Equipo ${winnerTeam === 0 ? "A" : "B"} gana`;

  const progress0 = Math.min((scores[0] / targetScore) * 100, 100);
  const progress1 = Math.min((scores[1] / targetScore) * 100, 100);

  // Pre-round scores for animating bars from their previous position
  const prevScore0 = roundResult.winner_team === 0 ? Math.max(0, scores[0] - roundResult.points) : scores[0];
  const prevScore1 = roundResult.winner_team === 1 ? Math.max(0, scores[1] - roundResult.points) : scores[1];
  const prevProgress0 = Math.min((prevScore0 / targetScore) * 100, 100);
  const prevProgress1 = Math.min((prevScore1 / targetScore) * 100, 100);

  const flashColor = iWon ? "rgba(201,168,76,0.35)" : isDraw ? "rgba(168,196,160,0.2)" : "rgba(180,30,30,0.25)";
  const accentColor = iWon ? "text-[#c9a84c]" : isDraw ? "text-[#a8c4a0]" : "text-red-400";
  const headerGradient = iWon
    ? "from-[#c9a84c]/25 via-[#c9a84c]/10 to-transparent"
    : isDraw
    ? "from-[#a8c4a0]/15 to-transparent"
    : "from-red-900/25 to-transparent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-end-title"
    >
      <Confetti active={!isDraw} />
      <FlashOverlay color={flashColor} />

      <motion.div
        initial={{ scale: 0.55, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/30 overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.7)]"
      >
        {iWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.3, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: "inset 0 0 50px rgba(201,168,76,0.3)" }}
          />
        )}

        {/* Header */}
        <div className={`px-6 pt-8 pb-4 text-center bg-gradient-to-b ${headerGradient}`}>
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -30 }}
            animate={{ scale: [0, 1.4, 0.85, 1], opacity: 1, rotate: [0, 12, -6, 0] }}
            transition={{ delay: 0.05, duration: 0.65, ease: "easeOut" }}
            className="text-6xl mb-2 leading-none"
            aria-hidden="true"
          >
            {isDraw ? "🤝" : iWon ? "🏆" : "😔"}
          </motion.div>

          <motion.p
            id="round-end-title"
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.22, type: "spring", stiffness: 420, damping: 20 }}
            className={`text-3xl font-bold tracking-tight ${accentColor}`}
          >
            {winnerLabel}
          </motion.p>

          {!isDraw && winnerNames.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="text-sm text-[#f5f0e8]/70 mt-1 font-medium"
            >
              {winnerNames.join(" & ")}
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-[#a8c4a0]/55 mt-1.5 uppercase tracking-widest"
          >
            {meta.icon} {meta.label} · Ronda {round}
          </motion.p>
        </div>

        {/* Reason + winner card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, type: "spring", stiffness: 260, damping: 22 }}
          className={`mx-5 mb-4 rounded-xl border overflow-hidden ${
            iWon
              ? "bg-[#c9a84c]/10 border-[#c9a84c]/35"
              : isDraw
              ? "bg-[#1e5c3a]/50 border-[#a8c4a0]/20"
              : "bg-red-950/30 border-red-800/25"
          }`}
        >
          {/* Reason row */}
          {meta.desc && (
            <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{meta.icon}</span>
              <p className="text-xs text-[#f5f0e8]/55">{meta.desc}</p>
            </div>
          )}

          {/* Winner + points row */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-xs uppercase tracking-wider font-bold ${accentColor}`}>
                {winnerLabel}
              </p>
              {winnerNames.length > 0 && (
                <p className="text-[#f5f0e8]/55 text-xs truncate mt-0.5">
                  {winnerNames.join(" & ")}
                </p>
              )}
            </div>
            {!isDraw && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-[#a8c4a0]/70 uppercase tracking-wider">puntos</p>
                <motion.p
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                  className={`text-2xl font-bold tabular-nums ${iWon ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}
                >
                  +<AnimatedNumber value={roundResult.points} delay={0.65} />
                </motion.p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Score progress bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62 }}
          className="mx-5 mb-5 space-y-2.5"
        >
          <p className="text-[10px] uppercase tracking-widest text-[#a8c4a0]/50 mb-1">
            Marcador acumulado
          </p>
          {([0, 1] as const).map((team) => {
            const isMyT = myTeam === team;
            const names = team === 0 ? team0Names : team1Names;
            const score = scores[team];
            const progress = team === 0 ? progress0 : progress1;
            const isWinnerTeam = roundResult.winner_team === team;
            return (
              <div key={team}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${isMyT ? "text-[#c9a84c]" : "text-[#f5f0e8]/55"}`}>
                    {isWinnerTeam && !isDraw && <span className="text-[10px]">★</span>}
                    {names.length > 0 ? names.join(" & ") : `Equipo ${team === 0 ? "A" : "B"}`}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${isMyT ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                    <AnimatedNumber value={score} from={team === 0 ? prevScore0 : prevScore1} delay={0.72} />
                    <span className="text-[10px] font-normal text-[#a8c4a0]/60">/{targetScore}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0f3520]/80 overflow-hidden">
                  <motion.div
                    initial={{ width: `${team === 0 ? prevProgress0 : prevProgress1}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.72, duration: 0.75, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isMyT
                        ? "bg-gradient-to-r from-[#c9a84c] to-[#e8c96a]"
                        : "bg-gradient-to-r from-[#4a8c6a] to-[#5aac7a]"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mx-5 mb-6"
        >
          {onNextRound ? (
            <div className="space-y-2">
              <div className="relative h-1.5 rounded-full bg-[#0f3520]/80 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: AUTO_START_DELAY, ease: "linear" }}
                  className="absolute inset-y-0 left-0 bg-[#c9a84c]/60 rounded-full"
                />
              </div>
              <p className="text-center text-xs text-[#a8c4a0]/55" aria-live="polite" aria-atomic="true">
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

  const teamTag = (team: 0 | 1) =>
    team === myTeam ? "tu equipo" : `equipo ${team === 0 ? "A" : "B"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <Confetti active={iWon} />
      <FlashOverlay color={iWon ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.12)"} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/45 overflow-hidden shadow-[0_12px_64px_rgba(0,0,0,0.85)]"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.4, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "inset 0 0 70px rgba(201,168,76,0.22)" }}
        />

        {/* Header */}
        <div className="pt-9 pb-4 text-center bg-gradient-to-b from-[#c9a84c]/22 via-[#c9a84c]/8 to-transparent">
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -25 }}
            animate={{ scale: [0, 1.5, 0.85, 1], opacity: 1, rotate: [0, 14, -7, 0] }}
            transition={{ delay: 0.1, duration: 0.75, ease: "easeOut" }}
            className="text-7xl mb-2 leading-none"
            aria-hidden="true"
          >
            {iWon ? "🏆" : "🎖️"}
          </motion.div>

          <motion.p
            id="game-over-title"
            initial={{ opacity: 0, y: 16, scale: 0.75 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 400, damping: 18 }}
            className={`text-4xl font-bold tracking-tight ${iWon ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}
          >
            {iWon ? "¡Victoria!" : "Fin de partida"}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
            className="text-sm text-[#a8c4a0]/70 mt-1"
          >
            {teamLabel(winnerTeam)} gana la partida
          </motion.p>
        </div>

        {/* Podium */}
        <div className="mx-5 mt-2 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-[#a8c4a0]/45 text-center mb-4">
            Resultado final
          </p>

          {/* Side-by-side podium pedestals */}
          <div className="flex items-end justify-center gap-3 mb-4" aria-label="Podio final">
            {/* Loser pedestal — shorter, left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 220, damping: 22 }}
              className="flex flex-col items-center flex-1"
            >
              <span className="text-2xl mb-1" aria-hidden="true">🥈</span>
              <p className="text-[10px] text-[#a8c4a0]/55 uppercase tracking-wider mb-1 text-center">
                {teamTag(loserTeam)}
              </p>
              <p className="text-xs font-medium text-[#f5f0e8]/60 truncate max-w-full text-center px-1 mb-2">
                {teamLabel(loserTeam)}
              </p>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.0, duration: 0.5, ease: "easeOut" }}
                  style={{ originY: 1, height: 64 }}
                className="w-full rounded-t-lg bg-[#1e5c3a]/70 border border-[#f5f0e8]/10 flex flex-col items-center justify-center py-3"
              >
                <p className="text-xl font-bold text-[#f5f0e8]/65 tabular-nums leading-none">
                  {scores[loserTeam]}
                </p>
                <p className="text-[9px] text-[#a8c4a0]/40 uppercase tracking-wider">pts</p>
              </motion.div>
            </motion.div>

            {/* Winner pedestal — taller, center */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="flex flex-col items-center flex-1"
            >
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.5, 0.9, 1], rotate: [0, 15, -5, 0] }}
                transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                className="text-3xl mb-1"
                aria-hidden="true"
              >
                🥇
              </motion.span>
              <p className="text-[10px] text-[#c9a84c]/70 uppercase tracking-wider mb-1 text-center">
                {teamTag(winnerTeam)}
              </p>
              <p className="text-xs font-bold text-[#c9a84c] truncate max-w-full text-center px-1 mb-2">
                {teamLabel(winnerTeam)}
              </p>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.75, duration: 0.55, ease: "easeOut" }}
                style={{ originY: 1, height: 96 }}
                className="w-full rounded-t-lg bg-gradient-to-b from-[#c9a84c]/35 to-[#c9a84c]/15 border border-[#c9a84c]/50 flex flex-col items-center justify-center py-3"
              >
                <motion.p
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.1, type: "spring", stiffness: 380 }}
                  className="text-2xl font-bold text-[#c9a84c] tabular-nums leading-none"
                >
                  <AnimatedNumber value={scores[winnerTeam]} delay={1.15} />
                </motion.p>
                <p className="text-[9px] text-[#c9a84c]/55 uppercase tracking-wider">pts</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Difference callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.25 }}
          className="mx-5 mb-4 text-center"
        >
          <p className="text-xs text-[#a8c4a0]/45">
            Diferencia de{" "}
            <span className="text-[#c9a84c] font-semibold">
              {Math.abs(scores[winnerTeam] - scores[loserTeam])} puntos
            </span>
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35 }}
          className="mx-5 mb-7"
        >
          <button
            onClick={onBackToLobby}
            className="w-full rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] active:bg-[#b8943e] px-6 py-3 text-sm font-bold text-[#2a1a0a] transition-colors shadow-lg"
          >
            Volver al inicio
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
