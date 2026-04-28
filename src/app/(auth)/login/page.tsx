"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function IconMail() {
  return (
    <svg className="w-4 h-4 text-[#a8c4a0]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-4 h-4 text-[#a8c4a0]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="w-4 h-4 text-[#a8c4a0]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DominoLogo() {
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto w-20 h-20 rounded-2xl bg-[#f5f0e8] flex items-center justify-center shadow-lg glow-gold"
    >
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 300 }}
            className="w-3 h-3 rounded-full bg-[#2a1a0a]"
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl bg-[#1e5c3a]/30 border border-[#c9a84c]/20 pl-10 pr-4 py-3 text-[#f5f0e8] placeholder-[#a8c4a0]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:border-[#c9a84c]/50 text-sm";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-felt">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 sm:p-10 glow-gold">
          <DominoLogo />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6 mb-8"
          >
            <h1 className="text-2xl font-bold tracking-tight text-[#f5f0e8]">
              Dominó Venezolano
            </h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={isSignUp ? "signup" : "login"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-1.5 text-sm text-[#a8c4a0]"
              >
                {isSignUp ? "Crea tu cuenta para jugar" : "Inicia sesión para entrar a la mesa"}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pb-1">
                    <label htmlFor="displayName" className="block text-sm font-medium text-[#e8dcc8] mb-1.5">
                      Nombre de jugador
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <IconUser />
                      </div>
                      <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Tu nombre en la mesa" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e8dcc8] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <IconMail />
                </div>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#e8dcc8]">
                  Contraseña
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim()) { setError("Ingresa tu correo para recuperar la contraseña."); return; }
                      setError(null); setLoading(true);
                      const supabase = createClient();
                      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
                      setLoading(false);
                      if (error) setError(error.message);
                      else setError("Te enviamos un correo para restablecer tu contraseña.");
                    }}
                    className="text-xs text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <IconLock />
                </div>
                <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 rounded-xl bg-red-900/20 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#dfc06a] hover:from-[#dfc06a] hover:to-[#e8cc7a] disabled:from-[#2a3a2a] disabled:to-[#2a3a2a] disabled:text-[#6b7b6b] disabled:cursor-not-allowed px-4 py-3 font-semibold text-sm text-[#2a1a0a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c9a84c]/20 disabled:shadow-none"
            >
              {loading ? (<><Spinner /><span>Cargando...</span></>) : isSignUp ? "Crear cuenta" : "Entrar"}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm text-[#a8c4a0] hover:text-[#c9a84c] transition-colors"
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center">
          <p className="text-xs text-[#a8c4a0]/50">Dominó Venezolano — Dominó de parejas en línea</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
