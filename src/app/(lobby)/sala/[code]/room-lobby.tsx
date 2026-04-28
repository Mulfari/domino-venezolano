"use client";

import { createClient } from "@/lib/supabase/client";
import { startGame } from "@/lib/rooms/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Seat = { user_id: string; display_name: string } | null;

interface Room {
  id: string;
  code: string;
  host_id: string;
  status: string;
  seats: Seat[];
  current_game_id: string | null;
}

interface Props {
  room: Room;
  userId: string;
  displayName: string;
}

const seatLabels = ["Jugador 1 (Sur)", "Jugador 2 (Oeste)", "Jugador 3 (Norte)", "Jugador 4 (Este)"];
const teamLabels = ["Equipo A", "Equipo B", "Equipo A", "Equipo B"];

export function RoomLobby({ room, userId, displayName }: Props) {
  const [seats, setSeats] = useState<Seat[]>(room.seats);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const isHost = room.host_id === userId;
  const filledCount = seats.filter((s) => s !== null).length;

  useEffect(() => {
    // Subscribe to room changes via Realtime
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setSeats(updated.seats);

          // If game started, redirect
          if (updated.status === "playing" && updated.current_game_id) {
            router.push(`/juego/${updated.current_game_id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase, router]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const result = await startGame(room.id);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Error al iniciar la partida.");
    } finally {
      setStarting(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Room code */}
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-1">Código de sala</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-6 py-3 hover:border-emerald-600 transition-colors"
          >
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-400">
              {room.code}
            </span>
            <span className="text-xs text-slate-500">
              {copied ? "¡Copiado!" : "Copiar"}
            </span>
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Comparte este código con tus amigos
          </p>
        </div>

        {/* Seats */}
        <div className="space-y-3">
          {seats.map((seat, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                seat
                  ? "bg-slate-900 border-slate-700"
                  : "bg-slate-900/50 border-slate-800 border-dashed"
              }`}
            >
              {/* Seat number */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  seat
                    ? i % 2 === 0
                      ? "bg-emerald-900/50 text-emerald-400"
                      : "bg-amber-900/50 text-amber-400"
                    : "bg-slate-800 text-slate-600"
                }`}
              >
                {i + 1}
              </div>

              {/* Player info */}
              <div className="flex-1">
                {seat ? (
                  <>
                    <p className="font-semibold">
                      {seat.display_name}
                      {seat.user_id === room.host_id && (
                        <span className="ml-2 text-xs text-amber-400">
                          HOST
                        </span>
                      )}
                      {seat.user_id === userId && (
                        <span className="ml-2 text-xs text-emerald-400">
                          (tú)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{teamLabels[i]}</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500">Esperando...</p>
                    <p className="text-xs text-slate-600">{seatLabels[i]}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Start button (host only) */}
        {isHost && (
          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={filledCount < 4 || starting}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed px-6 py-4 text-lg font-semibold transition-colors"
            >
              {starting
                ? "Iniciando..."
                : filledCount < 4
                  ? `Esperando jugadores (${filledCount}/4)`
                  : "Iniciar partida"}
            </button>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-slate-400">
              {filledCount < 4
                ? `Esperando jugadores (${filledCount}/4)...`
                : "Esperando que el host inicie la partida..."}
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Volver al lobby
          </a>
        </div>
      </div>
    </div>
  );
}
