"use client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  winnerTeam: 0 | 1;
  finalScores: { team0: number; team1: number };
  onNewGame: () => void;
  onExit: () => void;
}

export function GameOverModal({ open, winnerTeam, finalScores, onNewGame, onExit }: Props) {
  return (
    <Modal open={open} onClose={onExit}>
      <h2 className="text-4xl font-bold text-gold mb-2">¡Campeones!</h2>
      <p className="text-ivory text-lg mb-4">Equipo {winnerTeam + 1} gana la partida</p>
      <div className="bg-wood/50 rounded-lg p-4 mb-4">
        <div className="text-ivory/80">Final: Equipo 1 {finalScores.team0} — {finalScores.team1} Equipo 2</div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onExit}>Salir</Button>
        <Button onClick={onNewGame}>Nueva partida</Button>
      </div>
    </Modal>
  );
}
