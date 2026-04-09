import assert from "node:assert/strict";
import test from "node:test";

import { getSearchConfig } from "@/lib/search/config";

test("getSearchConfig returns enabled CNJ tribunals and provider flags", () => {
  process.env.CPF_API_BASE_URL = "https://apicpf.example/api";
  process.env.CPF_API_KEY = "cpf-key";
  process.env.CNJ_API_BASE_URL = "https://api.cnj.jus.br/api/v2";
  process.env.CNJ_API_KEY = "cnj-key";
  process.env.CNJ_TRIBUNAL_CODES = "TJSP,TJRJ,TRF1";
  process.env.MONGODB_URI = "mongodb://localhost:27017/guardia";
  process.env.MONGODB_DB_NAME = "guardia";

  const config = getSearchConfig();

  assert.equal(config.cpf.enabled, true);
  assert.equal(config.cnj.enabled, true);
  assert.deepEqual(config.cnj.tribunalCodes, ["TJSP", "TJRJ", "TRF1"]);
  assert.equal(config.mongodb.enabled, true);
});
