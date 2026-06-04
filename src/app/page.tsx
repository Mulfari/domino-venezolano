"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createNewPlayerId, usePlayerStore } from "@/lib/store/player-store";
import { useToastStore } from "@/components/ui/toast";

function generateRoomId(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let id = "";
  for (let i = 0; i < 4; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  id += "-";
  for (let i = 0; i < 4; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
}

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const setIdentity = usePlayerStore((s) => s.setIdentity);
  const pushToast = useToastStore((s) => s.push);

  const createRoom = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const roomId = generateRoomId();
      const playerId = createNewPlayerId();

      const { error: roomErr } = await supabase
        .from("rooms")
        .insert({ id: roomId, status: "waiting" });

      if (roomErr) throw roomErr;

      const { error: playerErr } = await supabase
        .from("players")
        .insert({
          id: playerId,
          room_id: roomId,
          seat: 0,
          name: "Anfitrión",
          team: 0,
        });

      if (playerErr) throw playerErr;

      setIdentity(playerId, roomId);
      router.push(`/juego/${roomId}`);
    } catch (err) {
      pushToast("No se pudo crear la sala", "error");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-gold mb-2">Dominó Venezolano</h1>
      <p className="text-ivory/70 mb-8">Juega con tu familia desde cualquier dispositivo</p>
      <button
        onClick={createRoom}
        disabled={busy}
        className="px-8 py-4 bg-gold text-wood font-bold text-lg rounded-lg border-2 border-gold hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "Creando..." : "Crear sala"}
      </button>
    </main>
  );
}
