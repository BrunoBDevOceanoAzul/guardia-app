import assert from "node:assert/strict";
import test from "node:test";

import { maskCpf, normalizeCpf } from "@/lib/search/cpf";

test("normalizeCpf removes punctuation for a valid cpf", () => {
  assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
});

test("normalizeCpf rejects cpf with invalid check digits", () => {
  assert.throws(() => normalizeCpf("529.982.247-24"), /CPF_INVALID/);
});

test("maskCpf keeps only the last two digits visible", () => {
  assert.equal(maskCpf("52998224725"), "***.***.***-25");
});
