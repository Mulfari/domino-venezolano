"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

const AUTO_START_DELAY = 5;

interface GameOverModalProps {
  onNextRound?: () => void;
  onBackToLobby?: () => void;
}

export function GameOverModal({ onNextRound, onBackToLobby }: GameOverModalProps) {
  const roundResult = useGameStore((s) => s.roundResult);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const mySeat = useGameStore((s) => s.mySeat);

  const [countdown, setCountdown] = useState(AUTO_START_DELAY);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggered = useRef(false);

  const gameOver = scores[0] >= targetScore || scores[1] >= targetScore;

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

  const reasonText: Record<string, string> = {
    domino: "¡Dominó!",
    locked: "Trancado",
    tied: "Empate",
  };

  const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;
  const iWon = myTeam !== null && roundResult.winner_team === myTeam;

  const winnerTeamLabel =
    roundResult.winner_team !== null
      ? roundResult.winner_team === myTeam ? "Tu equipo" : "Equipo rival"
      : null;

  const winnerColor =
    roundResult.winner_team === 0
      ? "text-[#f5f0e8]"
      : roundResult.winner_team === 1
        ? "text-[#c9a84c]"
        : "text-[#a8c4a0]";

  const finalWinner =
    scores[0] >= targetScore
      ? (myTeam === 0 ? "Tu equipo" : "Equipo rival")
    : scores[1] >= targetScore
      ? (myTeam === 1 ? "Tu equipo" : "Equipo rival")
    : null;

  const iWonMatch = gameOver && myTeam !== null && (
    (myTeam === 0 && scores[0] >= targetScore) ||
    (myTeam === 1 && scores[1] >= targetScore)
  );

  if (gameOver) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/30 p-6 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="text-6xl"
            >
              {iWonMatch ? "🏆" : "😔"}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-2xl font-bold ${iWonMatch ? "text-[#c9a84c]" : "text-red-400"}`}
            >
              {iWonMatch ? "¡Victoria!" : "Derrota"}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[#a8c4a0] text-sm"
            >
              {finalWinner} gana la partida
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-8 py-3"
            >
              <div className="text-center">
                <p className={`text-[10px] uppercase tracking-wider ${myTeam === 0 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                  {myTeam === 0 ? "Tú" : "Ellos"}
                </p>
                <p className="text-3xl font-bold text-[#f5f0e8]">{scores[0]}</p>
              </div>
              <span className="text-[#c9a84c]/40 text-xl">—</span>
              <div className="text-center">
                <p className={`text-[10px] uppercase tracking-wider ${myTeam === 1 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                  {myTeam === 1 ? "Tú" : "Ellos"}
                </p>
                <p className="text-3xl font-bold text-[#f5f0e8]">{scores[1]}</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={onBackToLobby}
              className="w-full rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] px-6 py-3 text-sm font-semibold text-[#2a1a0a] transition-colors"
            >
              Volver al inicio
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm rounded-2xl bg-[#163d28] border border-[#c9a84c]/30 p-6 text-center space-y-4"
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            className={`text-3xl font-bold ${iWon ? "text-[#c9a84c]" : roundResult.winner_team === null ? "text-[#a8c4a0]" : "text-red-400"}`}
          >
            {reasonText[roundResult.reason] ?? roundResult.reason}
          </motion.p>

          {winnerTeamLabel ? (
            <p className={`text-lg font-semibold ${winnerColor}`}>
              {iWon ? "¡Tu equipo gana!" : `Gana ${winnerTeamLabel}`}
            </p>
          ) : (
            <p className="text-lg text-[#a8c4a0]">Sin ganador</p>
          )}

          <div className="rounded-xl bg-[#1e5c3a]/40 border border-[#c9a84c]/15 p-3">
            <p className="text-sm text-[#a8c4a0] mb-1">Puntos esta ronda</p>
            <p className="text-2xl font-bold text-[#f5f0e8]">+{roundResult.points}</p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className={`text-[10px] uppercase tracking-wider ${myTeam === 0 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                {myTeam === 0 ? "Tú" : "Ellos"}
              </p>
              <p className="text-xl font-bold text-[#f5f0e8]">{scores[0]}</p>
            </div>
            <span className="text-[#c9a84c]/40">—</span>
            <div className="text-center">
              <p className={`text-[10px] uppercase tracking-wider ${myTeam === 1 ? "text-[#c9a84c]" : "text-[#f5f0e8]"}`}>
                {myTeam === 1 ? "Tú" : "Ellos"}
              </p>
              <p className="text-xl font-bold text-[#f5f0e8]">{scores[1]}</p>
            </div>
          </div>

          {onNextRound ? (
            <div className="space-y-2">
              <div className="relative h-1.5 rounded-full bg-[#1e5c3a]/50 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: AUTO_START_DELAY, ease: "linear" }}
                  className="absolute inset-y-0 left-0 bg-[#c9a84c] rounded-full"
                />
              </div>
              <p className="text-xs text-[#a8c4a0]/60">
                Siguiente ronda en {countdown}s
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              <p className="text-sm text-[#a8c4a0]">
                Esperando al host...
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
