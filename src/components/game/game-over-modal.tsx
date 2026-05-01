"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import type { RoundResult, Seat } from "@/lib/game/types";

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

function Confetti({ active, intensity = 1 }: { active: boolean; intensity?: number }) {
  const fallingCount = Math.round(70 * intensity);
  const burstCount = Math.round(40 * intensity);
  const particles = useMemo<ConfettiParticle[]>(() => {
    const falling = Array.from({ length: fallingCount }, (_, i) => {
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
    const burst = Array.from({ length: burstCount }, (_, i) => {
      const angle = (i / burstCount) * Math.PI * 2;
      return {
        id: fallingCount + i,
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
  }, [fallingCount, burstCount]);

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

// ─── Reason splash ────────────────────────────────────────────────────────────

const REASON_SPLASH: Record<string, { text: string; sub: string; color: string; shadow: string }> = {
  domino:  { text: "¡Dominó!",  sub: "Jugó todas sus fichas",      color: "#c9a84c", shadow: "0 0 80px rgba(201,168,76,0.9), 0 4px 24px rgba(0,0,0,0.9)" },
  locked:  { text: "Trancado",  sub: "El juego quedó bloqueado",   color: "#f5f0e8", shadow: "0 0 40px rgba(255,255,255,0.3), 0 4px 24px rgba(0,0,0,0.9)" },
  tied:    { text: "Empate",    sub: "Ambos equipos empataron",    color: "#a8c4a0", shadow: "0 0 40px rgba(168,196,160,0.5), 0 4px 24px rgba(0,0,0,0.9)" },
};

function ReasonSplash({ reason }: { reason: string }) {
  const splash = REASON_SPLASH[reason] ?? { text: reason, sub: "", color: "#f5f0e8", shadow: "0 4px 24px rgba(0,0,0,0.9)" };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration: 2.2, times: [0, 0.12, 0.55, 0.75, 1], ease: "easeInOut" }}
      className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center bg-black/60"
      aria-hidden="true"
    >
      <motion.div
        initial={{ scale: 0.25, rotate: -10, opacity: 0 }}
        animate={{ scale: [0.25, 1.18, 0.96, 1], rotate: [-10, 5, -2, 0], opacity: [0, 1, 1, 1] }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="text-center px-8"
      >
        <p
          className="text-[72px] sm:text-[108px] font-black uppercase tracking-tight leading-none select-none"
          style={{ color: splash.color, textShadow: splash.shadow }}
        >
          {splash.text}
        </p>
        {splash.sub && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm sm:text-base text-[#f5f0e8]/70 mt-2 font-medium tracking-wide"
          >
            {splash.sub}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
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
  onRevancha?: () => void;
}

export function GameOverModal({ onNextRound, onBackToLobby, onRevancha }: GameOverModalProps) {
  const roundResult = useGameStore((s) => s.roundResult);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const hands = useGameStore((s) => s.hands);

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
        roundHistory={roundHistory}
        onBackToLobby={onBackToLobby}
        onRevancha={onRevancha}
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
      hands={hands}
      players={players}
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
  hands: { 0: import("@/lib/game/types").Tile[]; 1: import("@/lib/game/types").Tile[]; 2: import("@/lib/game/types").Tile[]; 3: import("@/lib/game/types").Tile[] };
  players: { seat: Seat; displayName: string; connected: boolean; isBot?: boolean }[];
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
  hands,
  players,
}: RoundEndViewProps) {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCard(true), 2400);
    return () => clearTimeout(t);
  }, []);

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
    : `Equipo ${(winnerTeam ?? 0) + 1} gana`;

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
      aria-describedby="round-end-desc"
    >
      <p id="round-end-desc" className="sr-only">
        {isDraw
          ? `Ronda ${round} terminó en empate.`
          : `${winnerLabel}. ${meta.label}: ${meta.desc}. Puntos ganados: ${roundResult.points}.`}
      </p>
      <Confetti active={!isDraw} intensity={isDraw ? 0 : iWon ? 1.6 : 0.8} />
      <FlashOverlay color={flashColor} />
      <ReasonSplash reason={roundResult.reason} />

      <AnimatePresence>
      {showCard && (
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

        {/* Points burst */}
        {!isDraw && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.38, type: "spring", stiffness: 280, damping: 20 }}
            className="text-center mb-3 px-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#a8c4a0]/50 mb-1">
              puntos ganados
            </p>
            <motion.p
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.55, 0.88, 1], opacity: 1 }}
              transition={{ delay: 0.48, duration: 0.7, ease: "easeOut" }}
              className={`text-7xl font-bold tabular-nums leading-none ${iWon ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}
              style={iWon ? { textShadow: "0 0 32px rgba(201,168,76,0.55)" } : undefined}
            >
              +<AnimatedNumber value={roundResult.points} delay={0.52} />
            </motion.p>
          </motion.div>
        )}

        {/* Reason badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="flex justify-center mb-4 px-5"
        >
          <div className={`inline-flex flex-col items-center gap-1 px-5 py-2 rounded-xl border text-sm font-medium ${
            iWon
              ? "bg-[#c9a84c]/12 border-[#c9a84c]/35 text-[#c9a84c]"
              : isDraw
              ? "bg-[#1e5c3a]/50 border-[#a8c4a0]/25 text-[#a8c4a0]"
              : "bg-red-950/30 border-red-800/30 text-red-300"
          }`}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{meta.icon}</span>
              <span className="font-bold">{meta.label}</span>
            </div>
            {meta.desc && (
              <span className="text-[#f5f0e8]/50 text-xs">{meta.desc}</span>
            )}
          </div>
        </motion.div>

        {/* Pip breakdown — only for locked/tied rounds */}
        {(roundResult.reason === "locked" || roundResult.reason === "tied") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.60 }}
            className="mx-5 mb-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#a8c4a0]/50 mb-2 text-center">
              Fichas en mano
            </p>
            <div className="rounded-xl border border-[#f5f0e8]/8 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-1.5 bg-[#0f3520]/60">
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">Jugador</span>
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40 text-center">Equipo</span>
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40 text-right">Puntos</span>
              </div>
              {([0, 1, 2, 3] as const).map((seat, i) => {
                const player = players.find((p) => p.seat === seat);
                const name = player?.displayName ?? `J${seat + 1}`;
                const team = (seat % 2) as 0 | 1;
                const isWinnerTeam = roundResult.winner_team === team;
                const isMyTeamRow = myTeam === team;
                const pipSum = (hands[seat] ?? []).reduce((s, [a, b]) => s + a + b, 0);
                return (
                  <div
                    key={seat}
                    className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-1.5 border-t border-[#f5f0e8]/5 ${
                      i % 2 === 0 ? "bg-[#163d28]" : "bg-[#1a4530]/40"
                    }`}
                  >
                    <span className={`text-[10px] font-medium truncate ${isMyTeamRow ? "text-[#c9a84c]" : "text-[#f5f0e8]/65"}`}>
                      {name}
                    </span>
                    <span
                      className="text-[9px] font-bold text-center tabular-nums"
                      style={{ color: team === 0 ? "#c9a84c" : "#4ca8c9" }}
                    >
                      {team === 0 ? "A" : "B"}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums text-right ${isWinnerTeam && !isDraw ? "text-green-400" : "text-[#f5f0e8]/55"}`}>
                      {pipSum}
                    </span>
                  </div>
                );
              })}
              {/* Team totals row */}
              <div className="grid grid-cols-2 gap-x-2 px-3 py-1.5 border-t border-[#c9a84c]/15 bg-[#0f3520]/50">
                {([0, 1] as const).map((team) => {
                  const teamPips = ([0, 2] as const).map(offset => {
                    const seat = (team === 0 ? offset : offset + 1) as 0 | 1 | 2 | 3;
                    return (hands[seat] ?? []).reduce((s, [a, b]) => s + a + b, 0);
                  }).reduce((a, b) => a + b, 0);
                  const isWinner = roundResult.winner_team === team;
                  const isMyT = myTeam === team;
                  return (
                    <div key={team} className="flex items-center justify-between gap-1">
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: team === 0 ? "rgba(201,168,76,0.6)" : "rgba(76,168,201,0.6)" }}>
                        Eq. {team === 0 ? "A" : "B"}
                      </span>
                      <span
                        className="text-[11px] font-black tabular-nums"
                        style={{
                          color: isWinner && !isDraw ? "#4ade80" : isMyT ? "#c9a84c" : "#f5f0e8",
                          textShadow: isWinner && !isDraw ? "0 0 8px rgba(74,222,128,0.5)" : undefined,
                        }}
                      >
                        {teamPips} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

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
      )}
      </AnimatePresence>
    </div>
  );
}

// ─── Game Over / Podium ───────────────────────────────────────────────────────

interface GameOverViewProps {
  scores: { 0: number; 1: number };
  myTeam: 0 | 1 | null;
  team0Names: string[];
  team1Names: string[];
  roundHistory: import("@/stores/game-store").RoundHistoryEntry[];
  onBackToLobby?: () => void;
  onRevancha?: () => void;
}

function GameOverView({ scores, myTeam, team0Names, team1Names, roundHistory, onBackToLobby, onRevancha }: GameOverViewProps) {
  const winnerTeam: 0 | 1 = scores[0] >= scores[1] ? 0 : 1;
  const loserTeam: 0 | 1 = winnerTeam === 0 ? 1 : 0;
  const iWon = myTeam === winnerTeam;

  const roundsWon0 = roundHistory.filter((e) => e.winner_team === 0).length;
  const roundsWon1 = roundHistory.filter((e) => e.winner_team === 1).length;
  const totalRounds = roundHistory.length;

  const teamLabel = (team: 0 | 1) => {
    const names = team === 0 ? team0Names : team1Names;
    return names.length > 0 ? names.join(" & ") : `Equipo ${team === 0 ? "A" : "B"}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      aria-describedby="game-over-desc"
    >
      <p id="game-over-desc" className="sr-only">
        {`${teamLabel(winnerTeam)} gana la partida con ${scores[winnerTeam]} puntos. ${teamLabel(loserTeam)} terminó con ${scores[loserTeam]} puntos.`}
      </p>
      <Confetti active intensity={2} />
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
        <div className="pt-8 pb-3 text-center bg-gradient-to-b from-[#c9a84c]/22 via-[#c9a84c]/8 to-transparent">
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -25 }}
            animate={{ scale: [0, 1.5, 0.85, 1], opacity: 1, rotate: [0, 14, -7, 0] }}
            transition={{ delay: 0.1, duration: 0.75, ease: "easeOut" }}
            className="text-6xl mb-2 leading-none"
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
            style={iWon ? { textShadow: "0 0 28px rgba(201,168,76,0.5)" } : undefined}
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
        <div className="mx-5 mt-3 mb-2" aria-label="Podio final">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[10px] font-bold uppercase text-[#c9a84c]/55 text-center mb-4"
            style={{ letterSpacing: "0.3em" }}
          >
            — Resultado final —
          </motion.p>

          <div className="flex items-end justify-center gap-4">

            {/* Winner — tallest */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 20 }}
              className="flex flex-col items-center w-[50%]"
            >
              {/* ¡CAMPEONES! banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4, y: -12 }}
                animate={{ opacity: 1, scale: [0.4, 1.25, 0.92, 1], y: 0 }}
                transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
                className="mb-1 px-3 py-0.5 rounded-full bg-[#c9a84c]/25 border border-[#c9a84c]/60"
                style={{ boxShadow: "0 0 14px rgba(201,168,76,0.35)" }}
              >
                <motion.p
                  animate={{ opacity: [1, 0.65, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
                  className="text-[9px] font-black uppercase tracking-widest text-[#c9a84c]"
                >
                  ¡Campeones!
                </motion.p>
              </motion.div>

              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.7, 0.85, 1], rotate: [0, 20, -8, 0] }}
                transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                className="text-4xl mb-1"
                aria-hidden="true"
              >
                🥇
              </motion.span>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.68 }}
                className="text-[10px] text-[#c9a84c]/80 uppercase tracking-wider mb-0.5 text-center leading-tight font-bold"
              >
                {winnerTeam === myTeam ? "tu equipo" : `equipo ${winnerTeam === 0 ? "A" : "B"}`}
              </motion.p>
              <p className="text-[11px] font-bold text-[#c9a84c] text-center px-1 mb-1 leading-tight line-clamp-2">
                {teamLabel(winnerTeam)}
              </p>
              {/* Rounds won badge */}
              {totalRounds > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-[9px] text-[#c9a84c]/60 mb-2"
                >
                  {winnerTeam === 0 ? roundsWon0 : roundsWon1}/{totalRounds} rondas
                </motion.p>
              )}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.68, duration: 0.7, ease: [0.2, 0, 0.4, 1] }}
                style={{ originY: 1, height: 150 }}
                className="relative w-full rounded-t-xl bg-gradient-to-b from-[#c9a84c]/45 to-[#c9a84c]/12 border border-[#c9a84c]/60 flex flex-col items-center justify-center overflow-hidden"
                aria-label={`Ganador: ${scores[winnerTeam]} puntos`}
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute inset-0 pointer-events-none rounded-t-xl"
                  style={{ boxShadow: "inset 0 0 30px rgba(201,168,76,0.3)" }}
                />
                <motion.div
                  initial={{ x: "-120%" }}
                  animate={{ x: "220%" }}
                  transition={{ delay: 1.4, duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                />
                <motion.p
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 1.5, 0.88, 1], opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.65, ease: "easeOut" }}
                  className="text-4xl font-black text-[#c9a84c] tabular-nums leading-none"
                  style={{ textShadow: "0 0 28px rgba(201,168,76,0.65)" }}
                >
                  <AnimatedNumber value={scores[winnerTeam]} delay={1.05} />
                </motion.p>
                <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-wider mt-1">pts</p>
              </motion.div>
            </motion.div>

            {/* Loser — shorter */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, type: "spring", stiffness: 220, damping: 22 }}
              className="flex flex-col items-center w-[38%]"
            >
              <span className="text-2xl mb-1" aria-hidden="true">🥈</span>
              <p className="text-[10px] text-[#a8c4a0]/50 uppercase tracking-wider mb-0.5 text-center leading-tight">
                {loserTeam === myTeam ? "tu equipo" : `equipo ${loserTeam === 0 ? "A" : "B"}`}
              </p>
              <p className="text-[11px] font-medium text-[#f5f0e8]/55 text-center px-1 mb-1 leading-tight line-clamp-2">
                {teamLabel(loserTeam)}
              </p>
              {totalRounds > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.35 }}
                  className="text-[9px] text-[#a8c4a0]/40 mb-2"
                >
                  {loserTeam === 0 ? roundsWon0 : roundsWon1}/{totalRounds} rondas
                </motion.p>
              )}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.1, duration: 0.5, ease: [0.2, 0, 0.4, 1] }}
                style={{ originY: 1, height: 84 }}
                className="w-full rounded-t-lg bg-[#1e5c3a]/70 border border-[#f5f0e8]/10 flex flex-col items-center justify-center"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="text-2xl font-bold text-[#f5f0e8]/60 tabular-nums leading-none"
                >
                  {scores[loserTeam]}
                </motion.p>
                <p className="text-[9px] text-[#a8c4a0]/35 uppercase tracking-wider mt-0.5">pts</p>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mx-5 mt-3 mb-3 flex justify-center gap-6 text-center"
        >
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">Diferencia</p>
            <p className="text-xs font-semibold text-[#c9a84c]">
              {Math.abs(scores[winnerTeam] - scores[loserTeam])} pts
            </p>
          </div>
          {totalRounds > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">Rondas jugadas</p>
              <p className="text-xs font-semibold text-[#f5f0e8]/60">{totalRounds}</p>
            </div>
          )}
        </motion.div>

        {/* Round history */}
        {roundHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mx-5 mb-4"
          >
            <p className="text-[9px] uppercase tracking-widest text-[#a8c4a0]/40 mb-2 text-center">
              Historial de rondas
            </p>
            <div className="rounded-xl border border-[#f5f0e8]/8 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-x-2 px-3 py-1.5 bg-[#0f3520]/60">
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">#</span>
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">Ganador</span>
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40">Motivo</span>
                <span className="text-[9px] uppercase tracking-wider text-[#a8c4a0]/40 text-right">Pts</span>
              </div>
              {roundHistory.map((entry, i) => {
                const isTeam0Win = entry.winner_team === 0;
                const isTeam1Win = entry.winner_team === 1;
                const isDraw = entry.winner_team === null;
                const winnerLabel = isDraw
                  ? "Empate"
                  : isTeam0Win
                  ? (team0Names[0] ?? "Eq. A")
                  : (team1Names[0] ?? "Eq. B");
                const reasonIcon = entry.reason === "domino" ? "🁣" : entry.reason === "locked" ? "🔒" : "🤝";
                const reasonLabel = entry.reason === "domino" ? "Dominó" : entry.reason === "locked" ? "Trancado" : "Empate";
                const isMyTeamWin = myTeam !== null && entry.winner_team === myTeam;
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-x-2 px-3 py-1.5 border-t border-[#f5f0e8]/5 ${
                      i % 2 === 0 ? "bg-[#163d28]" : "bg-[#1a4530]/40"
                    }`}
                  >
                    <span className="text-[10px] text-[#a8c4a0]/35 tabular-nums">{entry.round}</span>
                    <span className={`text-[10px] font-medium truncate ${isMyTeamWin ? "text-[#c9a84c]" : isDraw ? "text-[#a8c4a0]/60" : "text-[#f5f0e8]/55"}`}>
                      {winnerLabel}
                    </span>
                    <span className="text-[10px] text-[#a8c4a0]/50 flex items-center gap-1">
                      <span aria-hidden="true">{reasonIcon}</span>
                      {reasonLabel}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums text-right ${isMyTeamWin ? "text-[#c9a84c]" : "text-[#f5f0e8]/50"}`}>
                      +{entry.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mx-5 mb-7 flex flex-col gap-2"
        >
          {onRevancha && (
            <button
              onClick={onRevancha}
              autoFocus
              aria-label="Jugar revancha"
              className="w-full rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] active:bg-[#b8943e] px-6 py-3 text-sm font-bold text-[#2a1a0a] transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>¡Revancha!</span>
            </button>
          )}
          <button
            onClick={onBackToLobby}
            autoFocus={!onRevancha}
            aria-label="Volver al inicio"
            className={`w-full rounded-xl px-6 py-3 text-sm font-bold transition-colors shadow-lg ${
              onRevancha
                ? "bg-[#3a2210]/80 hover:bg-[#4a2c14] active:bg-[#2a1a08] text-[#f5f0e8]/80 border border-[#c9a84c]/20"
                : "bg-[#c9a84c] hover:bg-[#dfc06a] active:bg-[#b8943e] text-[#2a1a0a]"
            }`}
          >
            Volver al inicio
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
