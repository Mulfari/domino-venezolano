"use client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  reason: "domino" | "trancado" | null;
  winnerTeam: 0 | 1 | null;
  points: number;
  onContinue: () => void;
}

export function RoundEndModal({ open, reason, winnerTeam, points, onContinue }: Props) {
  return (
    <Modal open={open} onClose={onContinue}>
      <h2 className="text-3xl font-bold text-gold mb-2">
        {reason === "domino" ? "¡Dominó!" : "Trancado"}
      </h2>
      <p className="text-ivory mb-4">
        Equipo {winnerTeam !== null ? winnerTeam + 1 : "?"} gana {points} puntos
      </p>
      <div className="flex justify-end">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </Modal>
  );
}
