"use client";

import { useState, useEffect } from "react";

export function LandscapePrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function check() {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 640;
      setShow(isPortrait && isMobile && !dismissed);
    }

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [dismissed]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#163d28]/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[#1e5c3a] border border-[#c9a84c]/20 rounded-2xl p-6 max-w-xs text-center space-y-4">
        <div className="text-4xl">📱↔️</div>
        <p className="text-[#f5f0e8] font-semibold text-sm">
          Gira tu dispositivo
        </p>
        <p className="text-[#a8c4a0] text-xs">
          El dominó se ve mejor en horizontal (landscape).
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-xl bg-[#3a2210] hover:bg-[#4a2c0f] px-5 py-2 text-xs text-[#e8dcc8] transition-colors"
        >
          Continuar así
        </button>
      </div>
    </div>
  );
}
