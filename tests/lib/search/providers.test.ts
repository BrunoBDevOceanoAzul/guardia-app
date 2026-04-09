import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCnjRequests,
  buildCpfRequest,
  normalizeCnjResponse,
  normalizeCpfResponse,
} from "@/lib/search/providers";

test("buildCpfRequest creates authenticated GET request", () => {
  const request = buildCpfRequest("https://apicpf.example/api", "key-1", "52998224725");

  assert.equal(request.url, "https://apicpf.example/api/consulta?cpf=52998224725");
  assert.equal(request.init.method, "GET");
  assert.equal(request.init.headers["X-API-KEY"], "key-1");
});

test("buildCnjRequests creates one request per tribunal", () => {
  const requests = buildCnjRequests(
    "https://api.cnj.jus.br/api/v2",
    "token-1",
    ["TJSP", "TJRJ"],
    "52998224725",
    "Ana da Silva",
  );

  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /TJSP/);
  assert.match(requests[0].url, /nome_mae=Ana\+da\+Silva/);
  assert.equal(requests[0].init.headers.Authorization, "APIKey token-1");
});

test("normalizeCnjResponse counts criminal and civil hits from mixed payloads", () => {
  const normalized = normalizeCnjResponse("TJSP", {
    items: [
      { classe: { nome: "Ação Penal" } },
      { classe: { nome: "Execução de Título Extrajudicial" } },
      { classe: { nome: "Inquérito Policial" } },
    ],
  });

  assert.equal(normalized.total, 3);
  assert.equal(normalized.criminal, 2);
  assert.equal(normalized.civil, 1);
});

test("normalizeCpfResponse maps provider fields into app shape", () => {
  const normalized = normalizeCpfResponse({
    code: 200,
    data: {
      cpf: "52998224725",
      nome: "Maria da Silva",
      data_nascimento: "1990-05-01",
      genero: "F",
      nome_mae: "Ana da Silva",
    },
  });

  assert.equal(normalized.nome, "Maria da Silva");
  assert.equal(normalized.dataNascimento, "1990-05-01");
  assert.equal(normalized.sexo, "F");
  assert.equal(normalized.nomeMae, "Ana da Silva");
  assert.equal(normalized.situacao, "");
});
