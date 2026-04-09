import { type NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSearchConfig } from "@/lib/search/config";
import { normalizeCpf } from "@/lib/search/cpf";
import { insertSearchHistory, listSearchHistory } from "@/lib/search/history-store";
import { fetchCnjData } from "@/lib/search/providers";
import { buildSearchHistoryDocument, createSearchSummary } from "@/lib/search/search-service";

type CpfDataInput = {
  nome?: string;
  dataNascimento?: string;
  sexo?: string;
  nomeMae?: string;
  situacao?: string;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.cookies.get("auth_token")?.value);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const config = getSearchConfig();
    if (!config.mongodb.enabled) {
      return NextResponse.json({ items: [] });
    }

    const items = await listSearchHistory(
      config.mongodb.uri,
      config.mongodb.dbName,
      user.id,
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search history error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar histórico" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.cookies.get("auth_token")?.value);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { cpf, cpfData } = (await request.json()) as {
      cpf?: string;
      cpfData?: CpfDataInput;
    };

    const normalizedCpf = normalizeCpf(String(cpf ?? ""));
    const config = getSearchConfig();

    if (!config.cnj.enabled) {
      return NextResponse.json(
        { error: "Integração CNJ não configurada" },
        { status: 503 },
      );
    }

    const cnjData = await fetchCnjData(
      config.cnj.baseUrl,
      config.cnj.apiKey,
      config.cnj.tribunalCodes,
      normalizedCpf,
      cpfData?.nomeMae,
    );

    const summary = createSearchSummary({
      cpf: normalizedCpf,
      cpfResult: cpfData ?? {},
      tribunalResults: cnjData.results,
    });

    let stored = false;
    if (config.mongodb.enabled) {
      await insertSearchHistory(
        config.mongodb.uri,
        config.mongodb.dbName,
        buildSearchHistoryDocument({
          userId: user.id,
          cpf: normalizedCpf,
          cpfResult: cpfData ?? {},
          tribunalResults: cnjData.results,
        }),
      );
      stored = true;
    }

    return NextResponse.json({
      antecedents: summary.antecedents,
      tribunalBreakdown: summary.tribunalBreakdown,
      failedTribunals: cnjData.failedTribunals,
      stored,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CPF_INVALID") {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    console.error("CNJ search error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar antecedentes" },
      { status: 500 },
    );
  }
}
