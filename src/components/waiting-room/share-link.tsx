"use client";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/components/ui/toast";

export function ShareLink({ roomId }: { roomId: string }) {
  const pushToast = useToastStore((s) => s.push);
  const url = typeof window !== "undefined" ? `${window.location.origin}/juego/${roomId}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Enlace copiado", "success");
    } catch {
      pushToast("No se pudo copiar", "error");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="px-3 py-2 bg-wood border border-gold rounded text-ivory text-sm flex-1 truncate">
        {url}
      </code>
      <Button onClick={copy}>Copiar</Button>
    </div>
  );
}
