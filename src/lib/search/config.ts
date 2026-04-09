function splitCodes(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export type SearchConfig = {
  cpf: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
  };
  cnj: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    tribunalCodes: string[];
  };
  mongodb: {
    enabled: boolean;
    uri: string;
    dbName: string;
  };
};

export function getSearchConfig(): SearchConfig {
  const tribunalCodes = splitCodes(process.env.CNJ_TRIBUNAL_CODES);

  return {
    cpf: {
      enabled: Boolean(
        process.env.CPF_API_BASE_URL && process.env.CPF_API_KEY,
      ),
      baseUrl: process.env.CPF_API_BASE_URL ?? "",
      apiKey: process.env.CPF_API_KEY ?? "",
    },
    cnj: {
      enabled: Boolean(
        process.env.CNJ_API_BASE_URL &&
          process.env.CNJ_API_KEY &&
          tribunalCodes.length,
      ),
      baseUrl: process.env.CNJ_API_BASE_URL ?? "",
      apiKey: process.env.CNJ_API_KEY ?? "",
      tribunalCodes,
    },
    mongodb: {
      enabled: Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB_NAME),
      uri: process.env.MONGODB_URI ?? "",
      dbName: process.env.MONGODB_DB_NAME ?? "",
    },
  };
}
