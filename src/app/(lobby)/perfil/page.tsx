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
      <div className="min-h-screen flex items-center justify-center bg-[#1a3a2a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a3a2a]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20">
        <Link href="/" className="flex items-center gap-2 text-[#a8c4a0] hover:text-[#f5f0e8] transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
        <span className="text-sm font-semibold text-[#f5f0e8]">Mi Perfil</span>
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
              <label className="block text-xs text-[#a8c4a0]/60 mb-1.5">Nombre de jugador</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                className="w-full text-center rounded-xl bg-[#1e5c3a]/30 border border-[#c9a84c]/20 px-4 py-2.5 text-[#f5f0e8] placeholder-[#a8c4a0]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 text-sm"
                placeholder="Tu nombre"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs text-[#a8c4a0]/60 mb-2">Elige tu avatar</label>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAvatar(a)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === a
                        ? "bg-[#c9a84c]/20 border-2 border-[#c9a84c] scale-110"
                        : "bg-[#1e5c3a]/40 border border-[#c9a84c]/15 hover:bg-[#1e5c3a]/60"
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
              className="w-full rounded-xl bg-[#c9a84c] hover:bg-[#dfc06a] disabled:bg-[#3a2210]/60 px-4 py-2.5 text-sm font-semibold text-[#2a1a0a] transition-colors"
            >
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#f5f0e8]">Estadísticas</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Partidas" value={String(profile.games_played)} />
              <StatBox label="Victorias" value={String(profile.games_won)} />
              <StatBox label="% Victoria" value={`${winRate}%`} />
            </div>
          </div>

          {/* Member since */}
          <div className="text-center text-xs text-[#a8c4a0]/40">
            Miembro desde {new Date(profile.created_at).toLocaleDateString("es-VE", { year: "numeric", month: "long" })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1e5c3a]/40 border border-[#c9a84c]/15 p-3 text-center">
      <p className="text-lg font-bold text-[#f5f0e8]">{value}</p>
      <p className="text-[10px] text-[#a8c4a0]/60 mt-0.5">{label}</p>
    </div>
  );
}
