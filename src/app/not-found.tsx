import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-felt px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-6xl">🁣</div>
        <h1 className="text-3xl font-bold text-[#f5f0e8]">Página no encontrada</h1>
        <p className="text-[#a8c4a0] text-sm">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c9a84c] hover:bg-[#dfc06a] px-6 py-3 text-sm font-semibold text-[#2a1a0a] transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
