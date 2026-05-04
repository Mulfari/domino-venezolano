"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SHORTCUT_SECTIONS = [
  {
    title: "Fichas",
    icon: "🎲",
    shortcuts: [
      { keys: ["1", "–", "7"], desc: "Seleccionar ficha por posición" },
      { keys: ["Esc"], desc: "Deseleccionar ficha" },
      { keys: ["←"], desc: "Colocar en extremo izquierdo" },
      { keys: ["→"], desc: "Colocar en extremo derecho" },
    ],
  },
  {
    title: "Acciones",
    icon: "⚡",
    shortcuts: [
      { keys: ["P"], desc: "Pasar turno" },
      { keys: ["H"], desc: "Pista (mejor jugada)" },
      { keys: ["S"], desc: "Cambiar orden de fichas" },
    ],
  },
];

function KeyCap({ label }: { label: string }) {
  const isWide = label.length > 1;
  return (
    <span
      className="inline-flex items-center justify-center rounded-md text-[10px] font-bold leading-none select-none"
      style={{
        minWidth: isWide ? 32 : 22,
        height: 22,
        padding: "0 4px",
        background: "linear-gradient(180deg, rgba(245,240,232,0.14) 0%, rgba(245,240,232,0.06) 100%)",
        border: "1px solid rgba(245,240,232,0.18)",
        boxShadow: "0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,240,232,0.08)",
        color: "#f5f0e8",
      }}
    >
      {label}
    </span>
  );
}

export function ShortcutsPanel() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Toggle with ? key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar atajos de teclado" : "Ver atajos de teclado"}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors"
        style={{
          background: open ? "rgba(201,168,76,0.18)" : "rgba(0,0,0,0.25)",
          border: `1px solid ${open ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="12" height="9" rx="2" stroke={open ? "#c9a84c" : "#a8c4a0"} strokeWidth="1.1" fill="none"/>
          <rect x="3" y="5.5" width="2" height="1.5" rx="0.4" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.7"/>
          <rect x="6" y="5.5" width="2" height="1.5" rx="0.4" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.7"/>
          <rect x="9" y="5.5" width="2" height="1.5" rx="0.4" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.7"/>
          <rect x="4" y="8" width="6" height="1.5" rx="0.4" fill={open ? "#c9a84c" : "#a8c4a0"} opacity="0.5"/>
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: open ? "#c9a84c" : "#a8c4a0" }}>
          Atajos
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="shortcuts-panel"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed top-14 sm:top-16 right-2 sm:right-4 z-50"
            role="dialog"
            aria-label="Atajos de teclado"
          >
            <div
              className="rounded-2xl p-3 sm:p-4 backdrop-blur-md"
              style={{
                background: "linear-gradient(160deg, #1a1208 0%, #0e0c06 100%)",
                border: "1.5px solid rgba(201,168,76,0.35)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5)",
                minWidth: 240,
                maxWidth: 300,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="1" y="3" width="12" height="9" rx="2" stroke="#c9a84c" strokeWidth="1.1" fill="none"/>
                    <rect x="3" y="5.5" width="2" height="1.5" rx="0.4" fill="#c9a84c" opacity="0.7"/>
                    <rect x="6" y="5.5" width="2" height="1.5" rx="0.4" fill="#c9a84c" opacity="0.7"/>
                    <rect x="9" y="5.5" width="2" height="1.5" rx="0.4" fill="#c9a84c" opacity="0.7"/>
                    <rect x="4" y="8" width="6" height="1.5" rx="0.4" fill="#c9a84c" opacity="0.5"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]">
                    Atajos de Teclado
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[9px] text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors uppercase tracking-widest"
                  aria-label="Cerrar panel de atajos"
                >
                  cerrar
                </button>
              </div>

              {/* Sections */}
              <div className="flex flex-col gap-3">
                {SHORTCUT_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[11px] leading-none" aria-hidden="true">{section.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                        {section.title}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {section.shortcuts.map((shortcut, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg"
                          style={{
                            background: i % 2 === 0 ? "rgba(245,240,232,0.03)" : "transparent",
                          }}
                        >
                          <span className="text-[10px] text-[#f5f0e8]/70 leading-snug">
                            {shortcut.desc}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {shortcut.keys.map((key, j) => (
                              key === "–"
                                ? <span key={j} className="text-[9px] text-[#f5f0e8]/30 mx-0.5">–</span>
                                : <KeyCap key={j} label={key} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div
                className="mt-3 pt-2.5 flex items-center justify-center gap-1.5"
                style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}
              >
                <span className="text-[8px] text-[#a8c4a0]/35 uppercase tracking-widest">
                  Presiona
                </span>
                <KeyCap label="?" />
                <span className="text-[8px] text-[#a8c4a0]/35 uppercase tracking-widest">
                  para abrir/cerrar
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
