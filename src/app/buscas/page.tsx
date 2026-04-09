"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CpfData = {
  nome?: string;
  dataNascimento?: string;
  sexo?: string;
  nomeMae?: string;
  situacao?: string;
};

type SearchHistoryItem = {
  _id?: string;
  cpfMasked: string;
  cpfData: {
    nome?: string;
    situacao?: string;
  };
  antecedents: {
    total: number;
    criminal: number;
    civil: number;
    tribunals: string[];
  };
  createdAt: string;
};

type SearchResult = {
  cpfMasked: string;
  cpfData: CpfData;
  antecedents: {
    total: number;
    criminal: number;
    civil: number;
    tribunals: string[];
  };
  failedTribunals: string[];
  stored: boolean;
};

const testCpf = "316.035.668.05";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export default function BuscasPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/busca/antecedentes", {
        method: "GET",
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar histórico");
      }

      setHistory(data.items ?? []);
    } catch (loadError) {
      console.error(loadError);
    } finally {
      setHistoryLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const canSubmit = useMemo(
    () => cpf.replace(/\D/g, "").length === 11 && !loading,
    [cpf, loading],
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
    } catch (logoutError) {
      console.error("Erro ao sair:", logoutError);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cpfResponse = await fetch("/api/busca/cpf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf }),
      });
      const cpfPayload = await cpfResponse.json();

      if (!cpfResponse.ok) {
        throw new Error(cpfPayload.error || "Erro ao consultar CPF");
      }

      const antecedentesResponse = await fetch("/api/busca/antecedentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf,
          cpfData: cpfPayload.cpfData,
        }),
      });
      const antecedentesPayload = await antecedentesResponse.json();

      if (!antecedentesResponse.ok) {
        throw new Error(
          antecedentesPayload.error || "Erro ao consultar antecedentes",
        );
      }

      setResult({
        cpfMasked: cpfPayload.cpfMasked,
        cpfData: cpfPayload.cpfData,
        antecedents: antecedentesPayload.antecedents,
        failedTribunals: antecedentesPayload.failedTribunals ?? [],
        stored: Boolean(antecedentesPayload.stored),
      });

      await loadHistory();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro inesperado ao consultar CPF",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-2xl font-bold">
            <span className="text-rose-400">Guardiã</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 pb-16 pt-28 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm uppercase tracking-[0.3em] text-rose-400/80">
                  Painel Protegido
                </p>
                <h1 className="text-3xl font-bold">
                  Busca de CPF com antecedentes multitribunal
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setCpf(testCpf)}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Usar CPF de teste
              </button>
            </div>

            <p className="mb-8 max-w-2xl text-zinc-400">
              A busca consulta dados cadastrais por CPF, agrega ocorrências na API
              do CNJ e grava histórico anonimizado no MongoDB quando configurado.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-400">CPF</span>
                <input
                  value={cpf}
                  onChange={(event) => setCpf(event.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-lg outline-none transition focus:border-rose-400"
                />
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-2xl bg-rose-500 px-6 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-zinc-700"
                >
                  {loading ? "Consultando..." : "Consultar agora"}
                </button>
                <p className="text-sm text-zinc-500">
                  Histórico visível só para a sessão autenticada.
                </p>
              </div>
            </form>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
                Dados do CPF
              </p>
              {result ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-500">CPF consultado</span>
                    <div className="text-lg font-semibold">{result.cpfMasked}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Nome</span>
                    <div>{result.cpfData.nome || "-"}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Data de nascimento</span>
                    <div>{result.cpfData.dataNascimento || "-"}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Situação</span>
                    <div className="capitalize">{result.cpfData.situacao || "-"}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Execute uma consulta para visualizar os dados retornados pelo
                  provedor de CPF.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
                Resumo CNJ
              </p>
              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="text-2xl font-bold text-white">
                        {result.antecedents.total}
                      </div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Total
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="text-2xl font-bold text-amber-300">
                        {result.antecedents.criminal}
                      </div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Criminais
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="text-2xl font-bold text-cyan-300">
                        {result.antecedents.civil}
                      </div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Cíveis
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-zinc-500">Tribunais consultados</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.antecedents.tribunals.map((tribunal) => (
                        <span
                          key={tribunal}
                          className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                        >
                          {tribunal}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.failedTribunals.length > 0 ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Falha parcial em: {result.failedTribunals.join(", ")}
                    </div>
                  ) : null}

                  {result.stored ? (
                    <p className="text-sm text-emerald-300">
                      Consulta registrada no histórico anonimizado.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  O resumo multitribunal aparece aqui após a consulta.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6">
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
              Histórico
            </p>
            <h2 className="text-2xl font-bold">Consultas recentes</h2>
          </div>

          {historyLoading ? (
            <p className="text-sm text-zinc-500">Carregando histórico...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhuma consulta registrada para esta conta.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <article
                  key={`${item.cpfMasked}-${item.createdAt}-${index}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-semibold">{item.cpfMasked}</div>
                    <div className="text-xs text-zinc-500">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <div>Nome salvo: {item.cpfData.nome || "-"}</div>
                    <div>Situação: {item.cpfData.situacao || "-"}</div>
                    <div>
                      Total CNJ: {item.antecedents.total} | Criminal:{" "}
                      {item.antecedents.criminal} | Cível:{" "}
                      {item.antecedents.civil}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
