# Fase 1 Buscas Multitribunal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a primeira entrega de buscas protegidas por CPF e antecedentes multitribunal, persistindo histórico em MongoDB e disponibilizando deploy em ECS sem quebrar o fluxo atual de autenticação.

**Architecture:** A feature será separada em quatro camadas: validação e normalização de CPF, clientes HTTP para provedores externos, persistência de histórico em MongoDB e rotas/página protegida no App Router. PostgreSQL continua como fonte de usuários e sessões; MongoDB recebe apenas documentos de busca e resultados agregados do CNJ.

**Tech Stack:** Next.js 16 App Router, Route Handlers, TypeScript, Node test runner com `tsx`, MongoDB Node Driver, AWS ECS Fargate.

---

### Task 1: Establish test harness and configuration contract

**Files:**
- Modify: `package.json`
- Create: `tests/lib/config/search-config.test.ts`
- Create: `src/lib/search/config.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/lib/config/search-config.test.ts`
Expected: FAIL with module not found for `@/lib/search/config`

- [ ] **Step 3: Write minimal implementation**

```ts
function splitCodes(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export function getSearchConfig() {
  const tribunalCodes = splitCodes(process.env.CNJ_TRIBUNAL_CODES);

  return {
    cpf: {
      enabled: Boolean(process.env.CPF_API_BASE_URL && process.env.CPF_API_KEY),
      baseUrl: process.env.CPF_API_BASE_URL ?? "",
      apiKey: process.env.CPF_API_KEY ?? "",
    },
    cnj: {
      enabled: Boolean(process.env.CNJ_API_BASE_URL && process.env.CNJ_API_KEY && tribunalCodes.length),
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/lib/config/search-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tests/lib/config/search-config.test.ts src/lib/search/config.ts
git commit -m "test: add config contract for search integrations"
```

### Task 2: Add CPF validation and CNJ aggregation domain helpers

**Files:**
- Create: `tests/lib/search/cpf-domain.test.ts`
- Create: `tests/lib/search/cnj-domain.test.ts`
- Create: `src/lib/search/cpf.ts`
- Create: `src/lib/search/cnj.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCpf, maskCpf } from "@/lib/search/cpf";

test("normalizeCpf removes punctuation and rejects invalid length", () => {
  assert.equal(normalizeCpf("123.456.789-09"), "12345678909");
  assert.throws(() => normalizeCpf("123"));
});

test("maskCpf keeps only the last two digits visible", () => {
  assert.equal(maskCpf("12345678909"), "***.***.***-09");
});
```

```ts
import test from "node:test";
import assert from "node:assert/strict";
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test tests/lib/search/cpf-domain.test.ts tests/lib/search/cnj-domain.test.ts`
Expected: FAIL with missing modules

- [ ] **Step 3: Write minimal implementation**

```ts
export function normalizeCpf(input: string): string {
  const normalized = input.replace(/\D/g, "");
  if (normalized.length !== 11) {
    throw new Error("CPF_INVALID");
  }
  return normalized;
}

export function maskCpf(cpf: string): string {
  const normalized = normalizeCpf(cpf);
  return `***.***.***-${normalized.slice(-2)}`;
}
```

```ts
export type TribunalSummary = {
  tribunalCode: string;
  total: number;
  criminal: number;
  civil: number;
};

export function summarizeTribunalResults(results: TribunalSummary[]) {
  return {
    total: results.reduce((acc, item) => acc + item.total, 0),
    criminal: results.reduce((acc, item) => acc + item.criminal, 0),
    civil: results.reduce((acc, item) => acc + item.civil, 0),
    tribunals: results.map((item) => item.tribunalCode),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test tests/lib/search/cpf-domain.test.ts tests/lib/search/cnj-domain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/lib/search/cpf-domain.test.ts tests/lib/search/cnj-domain.test.ts src/lib/search/cpf.ts src/lib/search/cnj.ts
git commit -m "test: add cpf and cnj domain helpers"
```

### Task 3: Implement provider clients and MongoDB persistence

**Files:**
- Create: `tests/lib/search/providers.test.ts`
- Create: `src/lib/search/providers.ts`
- Create: `src/lib/search/history-store.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildCpfRequest, buildCnjRequests } from "@/lib/search/providers";

test("buildCpfRequest creates authenticated GET request", () => {
  const request = buildCpfRequest("https://apicpf.example/api", "key-1", "12345678909");
  assert.equal(request.url, "https://apicpf.example/api/consulta?cpf=12345678909");
  assert.equal(request.init.headers["X-API-KEY"], "key-1");
});

test("buildCnjRequests creates one request per tribunal", () => {
  const requests = buildCnjRequests("https://api.cnj.jus.br/api/v2", "token-1", ["TJSP", "TJRJ"], "12345678909");
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /TJSP/);
  assert.equal(requests[0].init.headers.Authorization, "APIKey token-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/lib/search/providers.test.ts`
Expected: FAIL with missing module

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildCpfRequest(baseUrl: string, apiKey: string, cpf: string) {
  return {
    url: `${baseUrl.replace(/\/$/, "")}/consulta?cpf=${cpf}`,
    init: {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
      },
    },
  };
}

export function buildCnjRequests(baseUrl: string, apiKey: string, tribunalCodes: string[], cpf: string) {
  return tribunalCodes.map((tribunalCode) => ({
    tribunalCode,
    url: `${baseUrl.replace(/\/$/, "")}/processos/tribunal/${tribunalCode}?cpf=${cpf}`,
    init: {
      method: "GET",
      headers: {
        Authorization: `APIKey ${apiKey}`,
      },
    },
  }));
}
```

```ts
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export function getMongoClient(uri: string) {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri);
  }
  return globalForMongo.mongoClient;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/lib/search/providers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/lib/search/providers.test.ts src/lib/search/providers.ts src/lib/search/history-store.ts package.json package-lock.json
git commit -m "feat: add search provider request builders and mongo client"
```

### Task 4: Implement protected search route handlers

**Files:**
- Create: `tests/lib/search/search-service.test.ts`
- Create: `src/lib/search/search-service.ts`
- Create: `src/app/api/busca/cpf/route.ts`
- Create: `src/app/api/busca/antecedentes/route.ts`
- Create: `src/lib/auth/session.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createSearchSummary } from "@/lib/search/search-service";

test("createSearchSummary returns masked cpf and cnj totals", () => {
  const summary = createSearchSummary({
    cpf: "12345678909",
    cpfResult: { nome: "Maria", situacao: "regular" },
    tribunalResults: [
      { tribunalCode: "TJSP", total: 2, criminal: 1, civil: 1 },
    ],
  });

  assert.equal(summary.cpfMasked, "***.***.***-09");
  assert.equal(summary.antecedents.total, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/lib/search/search-service.test.ts`
Expected: FAIL with missing module

- [ ] **Step 3: Write minimal implementation**

```ts
import { maskCpf } from "@/lib/search/cpf";
import { summarizeTribunalResults } from "@/lib/search/cnj";

export function createSearchSummary(input: {
  cpf: string;
  cpfResult: { nome?: string; situacao?: string };
  tribunalResults: Array<{ tribunalCode: string; total: number; criminal: number; civil: number }>;
}) {
  return {
    cpfMasked: maskCpf(input.cpf),
    cpfData: input.cpfResult,
    antecedents: summarizeTribunalResults(input.tribunalResults),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/lib/search/search-service.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the route handlers and session lookup**

```ts
const token = cookies().get("auth_token")?.value;
if (!token) {
  return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
}
```

```ts
const body = await request.json();
const cpf = normalizeCpf(body.cpf);
```

```ts
return NextResponse.json({
  cpf: cpfSummary,
  antecedents: antecedentSummary,
  stored: historyStored,
});
```

- [ ] **Step 6: Run focused verification**

Run: `node --import tsx --test tests/lib/search/search-service.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tests/lib/search/search-service.test.ts src/lib/search/search-service.ts src/lib/auth/session.ts src/app/api/busca/cpf/route.ts src/app/api/busca/antecedentes/route.ts
git commit -m "feat: add authenticated cpf and antecedent routes"
```

### Task 5: Build the protected search page and dashboard entry point

**Files:**
- Create: `src/app/buscas/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Write the failing build expectation**

```ts
// No dedicated UI test harness yet; use production build as the failing check.
// The page must compile with typed fetch handlers and authenticated navigation.
```

- [ ] **Step 2: Run build to verify missing page/navigation fails or remains incomplete**

Run: `npm run build`
Expected: current baseline or missing route evidence captured before UI changes

- [ ] **Step 3: Write minimal implementation**

```tsx
export default function BuscasPage() {
  return (
    <main>
      <section>
        <h1>Buscas protegidas</h1>
      </section>
    </main>
  );
}
```

```tsx
<Link href="/buscas" className="text-zinc-400 hover:text-white">
  Buscas
</Link>
```

- [ ] **Step 4: Expand the page into CPF form, antecedentes summary cards, and history list fed by the new route handlers**

```tsx
const [cpf, setCpf] = useState("");
const [result, setResult] = useState<SearchResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

```tsx
const response = await fetch("/api/busca/cpf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cpf }),
});
```

- [ ] **Step 5: Run build to verify it passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/buscas/page.tsx src/app/dashboard/page.tsx src/middleware.ts
git commit -m "feat: add protected buscas page"
```

### Task 6: Wire deploy configuration and final verification

**Files:**
- Modify: `scripts/deploy.sh`
- Modify: `README.md`
- Modify: `DEPLOY 2.md`

- [ ] **Step 1: Add the new environment variables to deploy**

```bash
CPF_API_BASE_URL
CPF_API_KEY
CNJ_API_BASE_URL
CNJ_API_KEY
CNJ_TRIBUNAL_CODES
MONGODB_URI
MONGODB_DB_NAME
```

- [ ] **Step 2: Update deployment script**

```bash
{ "name": "CNJ_TRIBUNAL_CODES", "value": "${CNJ_TRIBUNAL_CODES}" },
{ "name": "MONGODB_DB_NAME", "value": "${MONGODB_DB_NAME}" },
```

- [ ] **Step 3: Update docs with required env vars and runtime caveats**

```md
- `CPF_API_KEY`
- `CNJ_TRIBUNAL_CODES`
- `MONGODB_URI`
```

- [ ] **Step 4: Run full verification**

Run: `node --import tsx --test tests/**/*.test.ts && npm run build`
Expected: all tests PASS and production build PASS

- [ ] **Step 5: Deploy**

Run: `bash scripts/deploy.sh`
Expected: new ECS task definition registered and service reaches stable state

- [ ] **Step 6: Post-deploy smoke check**

Run: `aws ecs describe-services --cluster guardia-cluster --services guardia-service --region us-east-1 --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Task:taskDefinition}' --output table`
Expected: `ACTIVE`, `Running >= 1`, updated task definition

- [ ] **Step 7: Commit**

```bash
git add scripts/deploy.sh README.md 'DEPLOY 2.md'
git commit -m "chore: wire deploy env for search integrations"
```
