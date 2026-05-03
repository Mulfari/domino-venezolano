"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/game-store";

const BASE_TITLE = "Dominó Venezolano";

export function useDocumentTitle() {
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const scores = useGameStore((s) => s.scores);
  const round = useGameStore((s) => s.round);
  const players = useGameStore((s) => s.players);
  const roundResult = useGameStore((s) => s.roundResult);
  const targetScore = useGameStore((s) => s.targetScore);

  useEffect(() => {
    if (status !== "playing" && !roundResult) {
      document.title = BASE_TITLE;
      return;
    }

    const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;
    const gameOver = scores[0] >= targetScore || scores[1] >= targetScore;

    if (gameOver) {
      const iWon = myTeam !== null && scores[myTeam] >= targetScore;
      document.title = iWon
        ? `🏆 ¡Victoria! — ${BASE_TITLE}`
        : `Fin de partida — ${BASE_TITLE}`;
      return;
    }

    if (roundResult) {
      const iWon = myTeam !== null && roundResult.winner_team === myTeam;
      document.title = iWon
        ? `✓ ¡Ronda ganada! — R${round}`
        : `Ronda terminada — R${round}`;
      return;
    }

    const isMyTurn = mySeat !== null && currentTurn === mySeat;
    const scoreStr = myTeam !== null
      ? `${scores[myTeam]}–${scores[myTeam === 0 ? 1 : 0]}`
      : `${scores[0]}–${scores[1]}`;

    if (isMyTurn) {
      document.title = `🎲 ¡Tu turno! — ${scoreStr} · R${round}`;
    } else {
      const turnPlayer = players.find((p) => p.seat === currentTurn);
      const firstName = (turnPlayer?.displayName ?? "").split(" ")[0] || "...";
      document.title = `⏳ ${firstName} — ${scoreStr} · R${round}`;
    }
  }, [status, mySeat, currentTurn, scores, round, players, roundResult, targetScore]);

  // Reset title on unmount
  useEffect(() => {
    return () => { document.title = BASE_TITLE; };
  }, []);
}
