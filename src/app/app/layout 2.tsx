"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/app" className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <span className="text-xl font-bold text-white">Guardiã</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/app"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Início
              </Link>
              <Link
                href="/app/chat"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Analisar conversa
              </Link>
              <Link
                href="/app/history"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Histórico
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
