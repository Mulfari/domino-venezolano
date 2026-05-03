"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const TEAM_COLORS = {
  0: { accent: "#c9a84c", glow: "rgba(201,168,76,0.7)", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.5)" },
  1: { accent: "#4ca8c9", glow: "rgba(76,168,201,0.7)", bg: "rgba(76,168,201,0.12)", border: "rgba(76,168,201,0.5)" },
} as const;

export function MatchPointAnnouncement() {
  const [show, setShow] = useState(false);
  const [matchPointTeam, setMatchPointTeam] = useState<0 | 1 | null>(null);
  const [bothTeams, setBothTeams] = useState(false);
  const prevRoundRef = useRef<number>(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = useGameStore((s) => s.round);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);
  const status = useGameStore((s) => s.status);
  const players = useGameStore((s) => s.players);

  const myTeam = mySeat !== null ? ((mySeat % 2) as 0 | 1) : null;

  useEffect(() => {
    if (status !== "playing") return;
    if (round <= 1) {
      prevRoundRef.current = round;
      return;
    }
    if (round === prevRoundRef.current) return;
    prevRoundRef.current = round;

    const MATCH_POINT_THRESHOLD = 20;
    const team0Close = targetScore - scores[0] <= MATCH_POINT_THRESHOLD && scores[0] > 0;
    const team1Close = targetScore - scores[1] <= MATCH_POINT_THRESHOLD && scores[1] > 0;

    if (!team0Close && !team1Close) return;

    if (team0Close && team1Close) {
      setBothTeams(true);
      setMatchPointTeam(myTeam ?? 0);
    } else {
      setBothTeams(false);
      setMatchPointTeam(team0Close ? 0 : 1);
    }

    setShow(true);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setShow(false), 3200);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [round, scores, targetScore, status, myTeam]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (matchPointTeam === null) return null;

  const isMyTeam = myTeam === matchPointTeam;
  const colors = TEAM_COLORS[matchPointTeam];
  const opponentColors = TEAM_COLORS[matchPointTeam === 0 ? 1 : 0];

  function teamName(team: 0 | 1): string {
    const seats = team === 0 ? [0, 2] : [1, 3];
    const names = seats.map((s) => {
      const p = players.find((pl) => pl.seat === s);
      return p?.displayName.split(" ")[0] ?? `J${s + 1}`;
    });
    return names.join(" & ");
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`match-point-${round}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 100%)",
            backdropFilter: "blur(4px)",
          }}
          role="alert"
          aria-live="assertive"
          aria-label={bothTeams
            ? "¡Punto de partido para ambos equipos!"
            : `¡Punto de partido para ${isMyTeam ? "tu equipo" : "los rivales"}!`}
        >
          {/* Expanding rings */}
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 40, height: 40, opacity: 0.8 }}
            animate={{ width: 500, height: 500, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ border: `2px solid ${colors.accent}` }}
          />
          <motion.div
            className="absolute rounded-full"
            initial={{ width: 30, height: 30, opacity: 0.5 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
            style={{ border: `1.5px solid ${bothTeams ? opponentColors.accent : colors.accent}` }}
          />

          {/* Horizontal light streak */}
          <motion.div
            className="absolute h-[2px] pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              top: "50%",
              left: 0,
              right: 0,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.9, 0.4] }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0, y: -10, transition: { duration: 0.4 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 }}
            className="flex flex-col items-center gap-3 sm:gap-4"
          >
            {/* Trophy / alert icon */}
            <motion.svg
              width="48" height="48" viewBox="0 0 48 48" fill="none"
              aria-hidden="true"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
            >
              <motion.circle
                cx="24" cy="24" r="22"
                stroke={colors.accent}
                strokeWidth="2"
                fill="none"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M24 12L27.5 19.5L36 20.5L30 26.5L31.5 35L24 31L16.5 35L18 26.5L12 20.5L20.5 19.5L24 12Z"
                fill={colors.accent}
                stroke={colors.accent}
                strokeWidth="1"
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "center" }}
              />
            </motion.svg>

            {/* Main text */}
            <motion.div
              className="flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.span
                className="text-[36px] sm:text-[48px] font-black uppercase leading-none tracking-tight text-center"
                style={{
                  color: bothTeams ? "#f5f0e8" : colors.accent,
                  textShadow: bothTeams
                    ? `0 0 40px ${colors.glow}, 0 0 40px ${opponentColors.glow}, 0 4px 20px rgba(0,0,0,0.9)`
                    : `0 0 60px ${colors.glow}, 0 0 30px ${colors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                }}
                animate={{
                  textShadow: bothTeams ? [
                    `0 0 40px ${colors.glow}, 0 0 40px ${opponentColors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 70px ${colors.glow}, 0 0 70px ${opponentColors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 40px ${colors.glow}, 0 0 40px ${opponentColors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                  ] : [
                    `0 0 60px ${colors.glow}, 0 0 30px ${colors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 90px ${colors.glow}, 0 0 50px ${colors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                    `0 0 60px ${colors.glow}, 0 0 30px ${colors.glow}, 0 4px 20px rgba(0,0,0,0.9)`,
                  ],
                }}
                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
              >
                {bothTeams ? "¡Punto Decisivo!" : "¡Punto de Partido!"}
              </motion.span>

              <motion.span
                className="text-[13px] sm:text-[15px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: bothTeams
                    ? "rgba(245,240,232,0.7)"
                    : isMyTeam
                    ? `${colors.accent}cc`
                    : "rgba(245,240,232,0.6)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.25 }}
              >
                {bothTeams
                  ? "Ambos equipos pueden ganar"
                  : isMyTeam
                  ? "¡Podemos ganar esta ronda!"
                  : `${teamName(matchPointTeam)} puede ganar`}
              </motion.span>
            </motion.div>

            {/* Score cards */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex items-center gap-4 sm:gap-6"
            >
              {([0, 1] as const).map((team) => {
                const isMe = myTeam === team;
                const tc = TEAM_COLORS[team];
                const remaining = targetScore - scores[team];
                const isClose = remaining <= 20 && scores[team] > 0;

                return (
                  <motion.div
                    key={team}
                    animate={isClose ? {
                      boxShadow: [
                        `0 0 0px ${tc.accent}00`,
                        `0 0 18px ${tc.accent}60`,
                        `0 0 0px ${tc.accent}00`,
                      ],
                    } : {}}
                    transition={isClose ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 min-w-[80px]"
                    style={{
                      background: isClose ? tc.bg : "rgba(0,0,0,0.3)",
                      border: `1.5px solid ${isClose ? tc.border : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <span
                      className="text-[9px] uppercase tracking-widest font-bold leading-none"
                      style={{ color: isMe ? tc.accent : "rgba(245,240,232,0.5)" }}
                    >
                      {isMe ? "Nosotros" : "Rivales"}
                    </span>
                    <span
                      className="text-[28px] sm:text-[32px] font-black tabular-nums leading-none"
                      style={{
                        color: isClose ? tc.accent : "rgba(245,240,232,0.7)",
                        textShadow: isClose ? `0 0 16px ${tc.glow}` : undefined,
                      }}
                    >
                      {scores[team]}
                    </span>
                    <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tc.accent, width: `${Math.min((scores[team] / targetScore) * 100, 100)}%` }}
                      />
                    </div>
                    {isClose && (
                      <motion.span
                        className="text-[8px] font-bold uppercase tracking-widest leading-none"
                        style={{ color: tc.accent }}
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                      >
                        faltan {remaining}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Target score */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-[9px] uppercase tracking-[0.2em] leading-none"
              style={{ color: "rgba(245,240,232,0.3)" }}
            >
              meta: {targetScore} puntos · ronda {round}
            </motion.span>
          </motion.div>

          {/* Radial glow behind content */}
          <motion.div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              background: bothTeams
                ? `radial-gradient(ellipse 50% 40% at 50% 50%, ${colors.bg} 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 50%, ${opponentColors.bg} 0%, transparent 50%)`
                : `radial-gradient(ellipse 55% 45% at 50% 50%, ${colors.bg} 0%, transparent 60%)`,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
