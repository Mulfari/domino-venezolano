"use client";
import { useState } from "react";
import { useRoomStore } from "@/lib/store/room-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { createClient } from "@/lib/supabase/client";

export function ChatPanel() {
  const moves = useRoomStore((s) => s.moves);
  const players = useRoomStore((s) => s.players);
  const identity = usePlayerStore((s) => s.identity);
  const roomId = useRoomStore((s) => s.roomId);
  const [text, setText] = useState("");

  const chatMoves = moves.filter((m) => m.type === "chat");
  const send = async () => {
    if (!text.trim() || !identity || !roomId) return;
    const supabase = createClient();
    await supabase.from("moves").insert({
      room_id: roomId,
      player_id: identity.id,
      type: "chat",
      payload: { text: text.trim() },
    });
    setText("");
  };

  return (
    <div className="bg-wood border-2 border-gold rounded-xl p-3 w-64 h-full flex flex-col">
      <h3 className="text-gold font-semibold mb-2">Chat</h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {chatMoves.map((m) => {
          const author = players.find((p) => p.id === m.playerId);
          return (
            <div key={m.seq} className="text-sm">
              <span className="text-gold font-semibold">{author?.name || "??"}:</span>{" "}
              <span className="text-ivory/90">{(m.payload as any).text}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Mensaje..."
          className="flex-1 px-2 py-1 rounded bg-ivory text-wood text-sm"
        />
        <button onClick={send} className="px-3 py-1 bg-gold text-wood rounded font-semibold text-sm">
          Enviar
        </button>
      </div>
    </div>
  );
}
