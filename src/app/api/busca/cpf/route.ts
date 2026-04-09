import { type NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSearchConfig } from "@/lib/search/config";
import { normalizeCpf } from "@/lib/search/cpf";
import { fetchCpfData } from "@/lib/search/providers";
import { createSearchSummary } from "@/lib/search/search-service";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.cookies.get("auth_token")?.value);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { cpf } = await request.json();
    const normalizedCpf = normalizeCpf(String(cpf ?? ""));
    const config = getSearchConfig();

    if (!config.cpf.enabled) {
      return NextResponse.json(
        { error: "Integração de CPF não configurada" },
        { status: 503 },
      );
    }

    const cpfData = await fetchCpfData(
      config.cpf.baseUrl,
      config.cpf.apiKey,
      normalizedCpf,
    );

    const summary = createSearchSummary({
      cpf: normalizedCpf,
      cpfResult: cpfData,
      tribunalResults: [],
    });

    return NextResponse.json({
      cpfMasked: summary.cpfMasked,
      cpfData,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CPF_INVALID") {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    console.error("CPF search error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar CPF" },
      { status: 500 },
    );
  }
}
