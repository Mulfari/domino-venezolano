import { createClient } from "@/lib/supabase/server";
import { createRoom } from "@/lib/rooms/actions";
import Link from "next/link";
import { JoinRoomForm } from "./join-room-form";

export default async function LobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo / Title */}
        <div>
          <div className="text-6xl mb-4">🁣</div>
          <h1 className="text-4xl font-bold tracking-tight">
            Dominó Venezolano
          </h1>
          <p className="mt-2 text-slate-400">
            Partidas de 4 jugadores en parejas
          </p>
        </div>

        {/* User status */}
        {user ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <p className="text-slate-300">
              Jugando como{" "}
              <span className="font-semibold text-emerald-400">
                {displayName}
              </span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <p className="text-slate-400 mb-3">
              Inicia sesión para jugar
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 font-semibold transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Actions */}
        {user && (
          <div className="space-y-4">
            {/* Create room */}
            <form action={createRoom}>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-4 text-lg font-semibold transition-colors"
              >
                Crear sala
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-sm text-slate-500">o</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Join room */}
            <JoinRoomForm />
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-600">
          Dominó de parejas — 28 fichas — Partida a 100 puntos
        </p>
      </div>
    </div>
  );
}
