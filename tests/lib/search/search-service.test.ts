import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSearchHistoryDocument,
  createSearchSummary,
} from "@/lib/search/search-service";

test("createSearchSummary returns masked cpf and cnj totals", () => {
  const summary = createSearchSummary({
    cpf: "52998224725",
    cpfResult: { nome: "Maria da Silva", situacao: "regular" },
    tribunalResults: [
      { tribunalCode: "TJSP", total: 2, criminal: 1, civil: 1 },
    ],
  });

  assert.equal(summary.cpfMasked, "***.***.***-25");
  assert.equal(summary.antecedents.total, 2);
  assert.equal(summary.antecedents.criminal, 1);
});

test("buildSearchHistoryDocument hashes cpf and redacts provider data", () => {
  const document = buildSearchHistoryDocument({
    userId: "user-1",
    cpf: "52998224725",
    cpfResult: {
      nome: "Maria da Silva",
      dataNascimento: "1990-05-01",
      situacao: "regular",
    },
    tribunalResults: [
      { tribunalCode: "TJSP", total: 1, criminal: 1, civil: 0 },
    ],
  });

  assert.equal(document.userId, "user-1");
  assert.equal(document.cpfMasked, "***.***.***-25");
  assert.notEqual(document.cpfHash, "52998224725");
  assert.equal(document.cpfData.nome, "M***");
  assert.equal(document.cpfData.dataNascimento, "**/**/****");
});
