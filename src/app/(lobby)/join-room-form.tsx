"use client";

import { useState } from "react";
import { joinRoom } from "@/lib/rooms/actions";

export function JoinRoomForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("El código debe tener 6 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await joinRoom(code);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Error al unirse a la sala.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="CÓDIGO"
          maxLength={6}
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-center text-lg font-mono tracking-widest uppercase text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-semibold transition-colors"
        >
          {loading ? "..." : "Unirse"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
