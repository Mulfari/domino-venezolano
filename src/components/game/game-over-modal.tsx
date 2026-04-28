"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/game-store";

interface GameOverModalProps {
  onNextRound?: () => void;
  onBackToLobby?: () => void;
}

export function GameOverModal({ onNextRound, onBackToLobby }: GameOverModalProps) {
  const roundResult = useGameStore((s) => s.roundResult);
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);

  if (!roundResult) return null;

  const reasonText: Record<string, string> = {
    domino: "¡Dominó!",
    locked: "Trancado",
    tied: "Empate",
  };

  const winnerTeamLabel =
    roundResult.winner_team !== null
      ? roundResult.winner_team === 0
        ? "Equipo A"
        : "Equipo B"
      : null;

  const winnerColor =
    roundResult.winner_team === 0
      ? "text-emerald-400"
      : roundResult.winner_team === 1
        ? "text-amber-400"
        : "text-slate-400";

  const gameOver =
    scores[0] >= targetScore || scores[1] >= targetScore;

  const finalWinner =
    scores[0] >= targetScore
      ? "Equipo A"
      : scores[1] >= targetScore
        ? "Equipo B"
        : null;

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
          className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center space-y-4"
        >
          {/* Reason */}
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            className="text-3xl font-bold text-white"
          >
            {reasonText[roundResult.reason] ?? roundResult.reason}
          </motion.p>

          {/* Winner */}
          {winnerTeamLabel ? (
            <p className={`text-lg font-semibold ${winnerColor}`}>
              Gana {winnerTeamLabel}
            </p>
          ) : (
            <p className="text-lg text-slate-400">Sin ganador</p>
          )}

          {/* Points */}
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
            <p className="text-sm text-slate-400 mb-1">Puntos esta ronda</p>
            <p className="text-2xl font-bold text-white">
              +{roundResult.points}
            </p>
          </div>

          {/* Updated scores */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald-500">
                Equipo A
              </p>
              <p className="text-xl font-bold text-white">{scores[0]}</p>
            </div>
            <span className="text-slate-600">—</span>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-amber-500">
                Equipo B
              </p>
              <p className="text-xl font-bold text-white">{scores[1]}</p>
            </div>
          </div>

          {/* Game over banner */}
          {gameOver && finalWinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 p-3"
            >
              <p className="text-lg font-bold text-emerald-400">
                🏆 ¡{finalWinner} gana la partida!
              </p>
            </motion.div>
          )}

          {/* Action button */}
          {gameOver ? (
            <button
              onClick={onBackToLobby}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Volver al lobby
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Siguiente ronda
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
