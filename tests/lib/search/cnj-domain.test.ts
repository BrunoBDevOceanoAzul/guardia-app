import assert from "node:assert/strict";
import test from "node:test";

import { summarizeTribunalResults } from "@/lib/search/cnj";

test("summarizeTribunalResults aggregates hits across tribunals", () => {
  const summary = summarizeTribunalResults([
    { tribunalCode: "TJSP", total: 2, criminal: 1, civil: 1 },
    { tribunalCode: "TJRJ", total: 1, criminal: 0, civil: 1 },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.criminal, 1);
  assert.equal(summary.civil, 2);
  assert.deepEqual(summary.tribunals, ["TJSP", "TJRJ"]);
});
