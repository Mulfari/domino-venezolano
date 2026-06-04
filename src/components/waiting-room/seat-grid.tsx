"use client";
import { useRoomStore } from "@/lib/store/room-store";

export function SeatGrid() {
  const players = useRoomStore((s) => s.players);
  const seats = [0, 1, 2, 3];

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
      {seats.map((seat) => {
        const player = players.find((p) => p.seat === seat);
        return (
          <div
            key={seat}
            className="bg-wood border-2 border-gold rounded-xl p-6 text-center"
          >
            <div className="text-gold text-sm mb-1">Asiento {seat}</div>
            <div className="text-ivory text-xl font-semibold">
              {player ? player.name : "Esperando..."}
            </div>
            {player && (
              <div className={`mt-2 text-sm ${player.connected ? "text-green-400" : "text-red-400"}`}>
                {player.connected ? "● Conectado" : "○ Desconectado"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
