"use client";
import { useRoomStore } from "@/lib/store/room-store";
import { SEAT_TEAM, GAME } from "@/lib/game/constants";

export function ScorePanel() {
  const players = useRoomStore((s) => s.players);
  const team0Score = useRoomStore((s) => s.team0Score);
  const team1Score = useRoomStore((s) => s.team1Score);

  const team0 = players.filter((p) => SEAT_TEAM[p.seat] === 0);
  const team1 = players.filter((p) => SEAT_TEAM[p.seat] === 1);

  const Bar = ({ score, color, label }: { score: number; color: string; label: string }) => (
    <div>
      <div className="text-ivory/80 text-sm mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-ivory/10 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (score / GAME.TARGET_SCORE) * 100)}%`, background: color }}
          />
        </div>
        <span className="text-ivory font-bold text-sm w-16 text-right">
          {score} / {GAME.TARGET_SCORE}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-wood border-2 border-gold rounded-xl p-4 w-full max-w-sm">
      <Bar
        score={team0Score}
        color="#1E88E5"
        label={`Equipo 1 (${team0.map((p) => p.name).join(" + ") || "..."})`}
      />
      <div className="my-3" />
      <Bar
        score={team1Score}
        color="#D4AF37"
        label={`Equipo 2 (${team1.map((p) => p.name).join(" + ") || "..."})`}
      />
    </div>
  );
}
