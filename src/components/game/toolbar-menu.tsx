"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ToolbarMenu({ children }: { children: ReactNode }) {
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
    <>
      {/* Mobile: overflow menu behind a single button */}
      <div className="sm:hidden relative" ref={containerRef}>
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          aria-label={open ? "Cerrar herramientas" : "Abrir herramientas"}
          aria-expanded={open}
          className="flex items-center justify-center rounded-lg border px-2 py-1 transition-colors"
          style={{
            minHeight: 36,
            minWidth: 36,
            background: open ? "rgba(201,168,76,0.18)" : "rgba(58,34,16,0.8)",
            borderColor: open ? "rgba(201,168,76,0.55)" : "rgba(201,168,76,0.2)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="4" cy="9" r="1.5" fill={open ? "#c9a84c" : "#a8c4a0"} />
            <circle cx="9" cy="9" r="1.5" fill={open ? "#c9a84c" : "#a8c4a0"} />
            <circle cx="14" cy="9" r="1.5" fill={open ? "#c9a84c" : "#a8c4a0"} />
          </svg>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="toolbar-menu-panel"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #2a1a08 0%, #1a1008 100%)",
                borderColor: "rgba(201,168,76,0.3)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)",
              }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="4" height="4" rx="1" fill="#c9a84c" opacity="0.6" />
                  <rect x="7" y="1" width="4" height="4" rx="1" fill="#c9a84c" opacity="0.6" />
                  <rect x="1" y="7" width="4" height="4" rx="1" fill="#c9a84c" opacity="0.6" />
                  <rect x="7" y="7" width="4" height="4" rx="1" fill="#c9a84c" opacity="0.6" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#c9a84c]">
                  Herramientas
                </span>
              </div>
              <div className="flex items-center gap-1 p-2 flex-wrap">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: show children inline */}
      <div className="hidden sm:flex items-center gap-1">
        {children}
      </div>
    </>
  );
}
