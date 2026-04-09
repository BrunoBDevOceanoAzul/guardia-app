import type { TribunalSummary } from "@/lib/search/cnj";

type RequestInitWithHeaders = RequestInit & {
  headers: Record<string, string>;
};

type ProviderRequest = {
  url: string;
  init: RequestInitWithHeaders;
};

const CRIMINAL_KEYWORDS = [
  "acao penal",
  "ação penal",
  "inquerito",
  "inquérito",
  "policial",
  "criminal",
  "crime",
  "violencia",
  "violência",
];

function sanitizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function getItems(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate =
    "items" in payload
      ? payload.items
      : "content" in payload
        ? payload.content
        : "resultados" in payload
          ? payload.resultados
          : [];

  return Array.isArray(candidate)
    ? candidate.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];
}

function getClassName(item: Record<string, unknown>): string {
  const classe = item.classe;

  if (classe && typeof classe === "object" && "nome" in classe) {
    return String(classe.nome ?? "");
  }

  if ("classeNome" in item) {
    return String(item.classeNome ?? "");
  }

  if ("descricao" in item) {
    return String(item.descricao ?? "");
  }

  return "";
}

function isCriminalClass(className: string): boolean {
  const normalized = className.toLowerCase();
  return CRIMINAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function buildCpfRequest(
  baseUrl: string,
  apiKey: string,
  cpf: string,
): ProviderRequest {
  return {
    url: `${sanitizeBaseUrl(baseUrl)}/consulta?cpf=${cpf}`,
    init: {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
      },
      cache: "no-store",
    },
  };
}

export function buildCnjRequests(
  baseUrl: string,
  apiKey: string,
  tribunalCodes: string[],
  cpf: string,
  motherName?: string,
) {
  return tribunalCodes.map((tribunalCode) => {
    const searchParams = new URLSearchParams();
    searchParams.set("cpf", cpf);

    if (motherName) {
      searchParams.set("nome_mae", motherName);
    }

    return {
      tribunalCode,
      url: `${sanitizeBaseUrl(baseUrl)}/processos/tribunal/${tribunalCode}?${searchParams.toString()}`,
      init: {
        method: "GET",
        headers: {
          Authorization: `APIKey ${apiKey}`,
        },
        cache: "no-store",
      } satisfies RequestInitWithHeaders,
    };
  });
}

export function normalizeCnjResponse(
  tribunalCode: string,
  payload: unknown,
): TribunalSummary {
  const items = getItems(payload);
  const criminal = items.filter((item) => isCriminalClass(getClassName(item)))
    .length;

  return {
    tribunalCode,
    total: items.length,
    criminal,
    civil: Math.max(items.length - criminal, 0),
  };
}

export function normalizeCpfResponse(payload: Record<string, unknown>) {
  const data =
    "data" in payload && payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : payload;

  return {
    nome: String(data.nome ?? data.Nome ?? ""),
    dataNascimento: String(
      data.dataNascimento ??
        data.data_nascimento ??
        data.DataNascimento ??
        "",
    ),
    sexo: String(data.sexo ?? data.genero ?? data.Sexo ?? ""),
    nomeMae: String(data.nomeMae ?? data.nome_mae ?? data.NomeMae ?? ""),
    situacao: String(
      data.situacao ?? data.SituacaoCPF ?? data.situacaoCpf ?? "",
    ),
  };
}

export async function fetchCpfData(
  baseUrl: string,
  apiKey: string,
  cpf: string,
) {
  const request = buildCpfRequest(baseUrl, apiKey, cpf);
  const response = await fetch(request.url, request.init);

  if (!response.ok) {
    throw new Error(`CPF_PROVIDER_ERROR:${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeCpfResponse(payload);
}

export async function fetchCnjData(
  baseUrl: string,
  apiKey: string,
  tribunalCodes: string[],
  cpf: string,
  motherName?: string,
) {
  const requests = buildCnjRequests(
    baseUrl,
    apiKey,
    tribunalCodes,
    cpf,
    motherName,
  );
  const results = await Promise.all(
    requests.map(async ({ tribunalCode, url, init }) => {
      const response = await fetch(url, init);
      if (!response.ok) {
        return {
          tribunalCode,
          total: 0,
          criminal: 0,
          civil: 0,
          failed: true,
        };
      }

      const payload = (await response.json()) as unknown;
      return {
        ...normalizeCnjResponse(tribunalCode, payload),
        failed: false,
      };
    }),
  );

  return {
    results: results.map(({ failed: _failed, ...result }) => result),
    failedTribunals: results
      .filter((item) => item.failed)
      .map((item) => item.tribunalCode),
  };
}
