"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const AVATARS = ["🎲", "🃏", "🏆", "⭐", "🔥", "💎", "🎯", "🦅", "🐉", "🎭", "👑", "🌟"];

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎲");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setSelectedAvatar(data.avatar_url || "🎲");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!profile || saving) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || "Jugador",
        avatar_url: selectedAvatar,
      })
      .eq("id", profile.id);

    if (!error) {
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() || "Jugador" },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
        <span className="text-sm font-semibold text-slate-300">Mi Perfil</span>
        <div className="w-16" />
      </nav>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Avatar + Name */}
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <div className="text-5xl">{selectedAvatar}</div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Nombre de jugador</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                className="w-full text-center rounded-xl bg-slate-900/80 border border-slate-700/50 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                placeholder="Tu nombre"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Elige tu avatar</label>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAvatar(a)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === a
                        ? "bg-emerald-600/30 border-2 border-emerald-500 scale-110"
                        : "bg-slate-800/60 border border-slate-700/40 hover:bg-slate-700/60"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Estadísticas</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Partidas" value={String(profile.games_played)} />
              <StatBox label="Victorias" value={String(profile.games_won)} />
              <StatBox label="% Victoria" value={`${winRate}%`} />
            </div>
          </div>

          {/* Member since */}
          <div className="text-center text-xs text-slate-600">
            Miembro desde {new Date(profile.created_at).toLocaleDateString("es-VE", { year: "numeric", month: "long" })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
