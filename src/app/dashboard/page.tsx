"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-rose-400">Guardiã</span>
          </h1>
          <div className="flex items-center gap-6">
            <Link href="/buscas" className="text-zinc-400 hover:text-white">
              Buscas
            </Link>
            <button 
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-rose-400 mb-2">0</div>
              <div className="text-zinc-400">Análises realizadas</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">0</div>
              <div className="text-zinc-400">Casos de risco alto</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">0</div>
              <div className="text-zinc-400">Mulheres auxiliadas</div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Nova Busca Protegida</h3>
            <p className="text-zinc-400 mb-6">
              Consulte CPF e antecedentes multitribunal em um fluxo protegido e com histórico anonimizado.
            </p>
            <Link
              href="/buscas"
              className="inline-block bg-rose-500 hover:bg-rose-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Abrir buscas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
