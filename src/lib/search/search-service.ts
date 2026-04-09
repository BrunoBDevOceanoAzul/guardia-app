import { hashData } from "@/lib/auth/utils";
import { summarizeTribunalResults, type TribunalSummary } from "@/lib/search/cnj";
import { maskCpf } from "@/lib/search/cpf";

type CpfProviderResult = {
  nome?: string;
  dataNascimento?: string;
  sexo?: string;
  nomeMae?: string;
  situacao?: string;
};

type SearchSummaryInput = {
  cpf: string;
  cpfResult: CpfProviderResult;
  tribunalResults: TribunalSummary[];
};

type SearchHistoryInput = SearchSummaryInput & {
  userId: string;
};

function redactName(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return `${value[0]?.toUpperCase() ?? ""}***`;
}

function redactDate(): string {
  return "**/**/****";
}

export function createSearchSummary(input: SearchSummaryInput) {
  return {
    cpfMasked: maskCpf(input.cpf),
    cpfData: input.cpfResult,
    antecedents: summarizeTribunalResults(input.tribunalResults),
    tribunalBreakdown: input.tribunalResults,
  };
}

export function buildSearchHistoryDocument(input: SearchHistoryInput) {
  const summary = createSearchSummary(input);

  return {
    userId: input.userId,
    cpfHash: hashData(input.cpf),
    cpfMasked: summary.cpfMasked,
    cpfData: {
      nome: redactName(input.cpfResult.nome),
      dataNascimento: redactDate(),
      sexo: input.cpfResult.sexo ?? "",
      nomeMae: redactName(input.cpfResult.nomeMae),
      situacao: input.cpfResult.situacao ?? "",
    },
    antecedents: summary.antecedents,
    tribunalBreakdown: summary.tribunalBreakdown,
    createdAt: new Date(),
  };
}
