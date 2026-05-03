"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RULES = [
  {
    title: "Objetivo",
    icon: "🎯",
    items: [
      "Primer equipo en llegar a 100 puntos gana la partida.",
      "Cada ronda se juega hasta que alguien domina o el juego se tranca.",
    ],
  },
  {
    title: "Turno",
    icon: "🔄",
    items: [
      "Cada jugador coloca una ficha que coincida con algún extremo del tablero.",
      "Si no puedes jugar, debes pasar. Con 4 pases consecutivos el juego se tranca.",
    ],
  },
  {
    title: "Puntuación",
    icon: "🏆",
    items: [
      "Dominó: el equipo ganador suma los puntos (pips) de las fichas en mano del equipo perdedor.",
      "Trancado: gana el equipo con menos puntos en mano; suma los puntos del rival.",
      "Capicúa: ambos extremos iguales al cerrar → puntos dobles.",
      "Cochina: abrir con doble-6 vale puntos extra.",
    ],
  },
  {
    title: "Mano",
    icon: "✋",
    items: [
      "El jugador que abre la ronda se llama 'mano'.",
      "Ronda 1: quien tenga el doble-6 abre (cochina).",
      "Rondas siguientes: abre quien ganó la ronda anterior, o el jugador con menos puntos si hubo trancado.",
    ],
  },
  {
    title: "Equipos",
    icon: "🤝",
    items: [
      "4 jugadores en 2 equipos: asientos 0+2 vs 1+3.",
      "Los compañeros se sientan frente a frente.",
    ],
  },
];

export function RulesPanel() {
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

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar reglas del juego" : "Ver reglas del juego"}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors"
        style={{
          background: open ? "rgba(201,168,76,0.18)" : "rgba(0,0,0,0.25)",
          border: `1px solid ${open ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {/* Question mark / book icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke={open ? "#c9a84c" : "#a8c4a0"} strokeWidth="1.1" fill="none"/>
          <path d="M5.2 5.2C5.2 4.2 6 3.5 7 3.5s1.8.7 1.8 1.7c0 .8-.5 1.3-1.1 1.7C7.1 7.3 7 7.7 7 8.2" stroke={open ? "#c9a84c" : "#a8c4a0"} strokeWidth="1.1" strokeLinecap="round" fill="none"/>
          <circle cx="7" cy="10.2" r="0.7" fill={open ? "#c9a84c" : "#a8c4a0"}/>
        </svg>
        <span className="hidden sm:inline text-[10px] font-semibold" style={{ color: open ? "#c9a84c" : "#a8c4a0" }}>
          Reglas
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="rules-panel"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed top-14 sm:top-16 right-2 sm:right-4 z-50"
            role="dialog"
            aria-label="Reglas del juego"
          >
            <div
              className="rounded-2xl p-3 sm:p-4 backdrop-blur-md overflow-y-auto"
              style={{
                background: "linear-gradient(160deg, #1a1208 0%, #0e0c06 100%)",
                border: "1.5px solid rgba(201,168,76,0.35)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5)",
                minWidth: 260,
                maxWidth: 320,
                maxHeight: "calc(100dvh - 80px)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="#c9a84c" strokeWidth="1.1" fill="none"/>
                    <path d="M5.2 5.2C5.2 4.2 6 3.5 7 3.5s1.8.7 1.8 1.7c0 .8-.5 1.3-1.1 1.7C7.1 7.3 7 7.7 7 8.2" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                    <circle cx="7" cy="10.2" r="0.7" fill="#c9a84c"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a84c]">
                    Reglas del Juego
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[9px] text-[#a8c4a0]/40 hover:text-[#a8c4a0]/80 transition-colors uppercase tracking-widest"
                  aria-label="Cerrar panel de reglas"
                >
                  cerrar
                </button>
              </div>

              {/* Subtitle */}
              <p className="text-[9px] text-[#a8c4a0]/45 uppercase tracking-widest mb-3 pb-2.5" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                Dominó Venezolano · 4 jugadores · 2 equipos
              </p>

              {/* Rule sections */}
              <div className="flex flex-col gap-3">
                {RULES.map((section) => (
                  <div key={section.title}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[11px] leading-none" aria-hidden="true">{section.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                        {section.title}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span
                            className="mt-1 w-1 h-1 rounded-full shrink-0"
                            style={{ backgroundColor: "rgba(201,168,76,0.45)" }}
                            aria-hidden="true"
                          />
                          <span className="text-[10px] text-[#f5f0e8]/70 leading-snug">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                className="mt-3 pt-2.5 flex items-center gap-1.5"
                style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" stroke="rgba(168,196,160,0.4)" strokeWidth="0.9" fill="none"/>
                  <line x1="5" y1="3" x2="5" y2="5.5" stroke="rgba(168,196,160,0.5)" strokeWidth="0.9" strokeLinecap="round"/>
                  <circle cx="5" cy="7" r="0.6" fill="rgba(168,196,160,0.5)"/>
                </svg>
                <span className="text-[8px] text-[#a8c4a0]/35 uppercase tracking-widest">
                  Meta: 100 pts · Fichas: 28 (doble-6)
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
