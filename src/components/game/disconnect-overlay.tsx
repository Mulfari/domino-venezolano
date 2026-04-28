"use client";

import { useGameStore } from "@/stores/game-store";

export function DisconnectOverlay() {
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const mySeat = useGameStore((s) => s.mySeat);

  if (status !== "playing") return null;

  const disconnected = players.filter(
    (p) => !p.connected && p.seat !== mySeat
  );

  if (disconnected.length === 0) return null;

  const names = disconnected.map((p) => p.displayName).join(", ");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl bg-slate-900 border border-amber-500/30 p-6 max-w-sm text-center space-y-3 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-400 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-amber-300 font-semibold text-sm">
          Esperando reconexión
        </p>
        <p className="text-slate-400 text-xs">
          {names} {disconnected.length === 1 ? "se desconectó" : "se desconectaron"}. La partida continúa cuando {disconnected.length === 1 ? "vuelva" : "vuelvan"}.
        </p>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
