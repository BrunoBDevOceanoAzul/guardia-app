"use client";

import Link from "next/link";
import { useAuth } from "../providers";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-zinc-400">
          Bem-vinda ao Guardiã. Como posso te ajudar hoje?
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/app/chat"
          className="group bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 rounded-2xl p-6 hover:border-rose-500/50 transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Analisar conversa
          </h3>
          <p className="text-sm text-zinc-400">
            Cole uma conversa do WhatsApp para identificar sinais de violência
            ou manipulação.
          </p>
        </Link>

        <Link
          href="/app/history"
          className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-white mb-2">Histórico</h3>
          <p className="text-sm text-zinc-400">
            Veja suas análises anteriores e os resultados detalhados.
          </p>
        </Link>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-xl font-bold text-white mb-2">Busca jurídica</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Verifique processos e antecedentes criminais de uma pessoa.
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
            Em breve
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-4">Precisa de ajuda?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="tel:180"
            className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <span className="text-2xl">📞</span>
            <div>
              <p className="font-medium text-white">
                Central de Atendimento à Mulher
              </p>
              <p className="text-sm text-rose-400 font-bold">Ligue 180</p>
            </div>
          </a>
          <a
            href="tel:190"
            className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <span className="text-2xl">🚔</span>
            <div>
              <p className="font-medium text-white">Emergências</p>
              <p className="text-sm text-rose-400 font-bold">Ligue 190</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
