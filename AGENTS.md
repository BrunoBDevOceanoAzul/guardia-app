<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing or changing App Router code.
Relevant docs already validated in this project:
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

Important current warning:
- Next.js 16 marks `middleware.ts` as deprecated in favor of `proxy`. The app still builds with `src/middleware.ts`, but this should be migrated later.
<!-- END:nextjs-agent-rules -->

## Project Snapshot (2026-04-09)

- App: `guardia-app`
- Stack: Next.js 16, React 19, App Router, Route Handlers, PostgreSQL + Drizzle, Cognito, ECS Fargate
- Domain: proteção e análise de risco com foco em violência, agora com início de buscas protegidas por CPF e antecedentes
- Active implementation branch: `fase1-buscas-multitribunal`
- Active worktree used for implementation: `.worktrees/fase1-buscas-multitribunal`

## What Was Implemented In This Session

### 1. Fase 1 de buscas protegidas

Nova entrega já implementada no worktree:
- Página protegida: `/buscas`
- API protegida: `POST /api/busca/cpf`
- API protegida: `POST /api/busca/antecedentes`
- API protegida: `GET /api/busca/antecedentes` para histórico

### 2. Integração CPF (`apicpf.com`)

Integração alinhada com a documentação oficial de `https://www.apicpf.com/docs`.
Formato confirmado:
- endpoint: `GET https://apicpf.com/api/consulta?cpf={cpf}`
- auth principal: header `X-API-KEY`
- resposta real: envelope `{ code, data }`
- campos confirmados em produção: `data.nome`, `data.genero`, `data.data_nascimento`
- suporte adicionado para `data.nome_mae` se o provedor começar a retornar esse campo

Validação real feita com CPF de teste manual informado pelo usuário:
- CPF usado: `316.035.668.05`
- retorno confirmado localmente: nome, gênero, data de nascimento

### 3. Busca multitribunal CNJ

Implementado o builder multitribunal para CNJ com lista configurável:
- env: `CNJ_TRIBUNAL_CODES`
- formato esperado: lista por vírgula, exemplo `TJSP,TJRJ,TJMG,TRF1,TRF2,TRF3,TRF4,TRF5`
- o request já propaga `nome_mae` quando disponível no payload do CPF

Observação importante:
- a validação real do CNJ ficou limitada localmente porque o sandbox falhou em resolver `api.cnj.jus.br`
- a camada foi construída para aceitar `cpf` e `nome_mae`
- a classificação atual separa resultados em `criminal` e `civil` por heurística baseada no nome da classe processual

### 4. Persistência MongoDB

Adicionada base de persistência para histórico de buscas:
- client Mongo reutilizável em `src/lib/search/history-store.ts`
- collection usada: `search_history`
- documento salvo com:
  - `userId`
  - `cpfHash`
  - `cpfMasked`
  - `cpfData` redigido
  - resumo de antecedentes
  - breakdown por tribunal
  - `createdAt`

### 5. Autenticação e sessão

Adicionado helper de sessão:
- `src/lib/auth/session.ts`

Uso:
- resolve `auth_token` em `sessions`
- busca `users.role`
- rotas novas usam esse helper para autorização

### 6. Testes adicionados

Foi criada uma suíte mínima com Node test runner:
- `tests/lib/config/search-config.test.ts`
- `tests/lib/search/cpf-domain.test.ts`
- `tests/lib/search/cnj-domain.test.ts`
- `tests/lib/search/providers.test.ts`
- `tests/lib/search/search-service.test.ts`

Comando oficial:
```bash
npm test
```

Estado verificado nesta sessão:
- `npm test`: 11 testes passando
- `npm run build`: passando

## Files Added Or Changed In This Session

### Novos arquivos principais
- `src/app/buscas/page.tsx`
- `src/app/api/busca/cpf/route.ts`
- `src/app/api/busca/antecedentes/route.ts`
- `src/lib/search/config.ts`
- `src/lib/search/cpf.ts`
- `src/lib/search/cnj.ts`
- `src/lib/search/providers.ts`
- `src/lib/search/search-service.ts`
- `src/lib/search/history-store.ts`
- `src/lib/auth/session.ts`
- `tests/lib/config/search-config.test.ts`
- `tests/lib/search/cpf-domain.test.ts`
- `tests/lib/search/cnj-domain.test.ts`
- `tests/lib/search/providers.test.ts`
- `tests/lib/search/search-service.test.ts`
- `scripts/create-superadmin.ts`
- `docs/superpowers/plans/2026-04-08-fase1-buscas-multitribunal.md`

### Arquivos modificados
- `package.json`
- `package-lock.json`
- `src/app/dashboard/page.tsx`
- `scripts/deploy.sh`
- `README.md`
- `DEPLOY 2.md`
- `tsconfig.json`
- `src/app/api/analyses/route 2.ts`

## Why `tsconfig.json` Was Changed

`tsconfig.json` passou a excluir arquivos com sufixo ` 2.ts` e ` 2.tsx`.
Motivo:
- o repositório contém vários arquivos legados/duplicados com esse padrão
- eles estavam entrando no typecheck do Next e quebrando o baseline
- a exclusão foi necessária para o build voltar a ser um verificador confiável

## Known Technical Debt / Known Issues

### 1. `middleware.ts` deprecado
- build mostra warning deprecando `middleware.ts`
- migração para `proxy` ainda não foi feita

### 2. `geo/heatmap` faz query durante build
Durante `npm run build`, o app ainda tenta consultar `help_requests_geo` ao gerar `/api/geo/heatmap`.
Isso não quebra o build hoje, mas produz ruído.
Erros observados nesta sessão:
- primeiro: servidor não suportando SSL com a credencial antiga
- depois: falha de autenticação ao usar uma `DATABASE_URL` antiga do worktree

Esse comportamento merece correção posterior para evitar query real no build.

### 3. Deploy script atual
`scripts/deploy.sh` foi estendido para incluir:
- `CPF_API_BASE_URL`
- `CPF_API_KEY`
- `CNJ_API_BASE_URL`
- `CNJ_API_KEY`
- `CNJ_TRIBUNAL_CODES`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

O deploy ainda usa environment variables embutidas no task definition do ECS. O ideal futuro é migrar para Secrets Manager.

## AWS Infrastructure State

### Recursos principais
- VPC: `vpc-008dd58344144e978`
- ECS Cluster: `guardia-cluster`
- ECS Service: `guardia-service`
- ECR: `026544697783.dkr.ecr.us-east-1.amazonaws.com/guardia-app`
- RDS ativo: `guardia-db-new.catawsu2siuo.us-east-1.rds.amazonaws.com`
- CloudWatch log group: `/ecs/guardia-app`
- ALB script existente: `scripts/setup-alb.sh`

### URL fixa para testes
ALB já documentado no projeto:
- `http://guardia-alb-1653604039.us-east-1.elb.amazonaws.com`

### Estado do deploy desta sessão
- task definition ativa: `guardia-app:9`
- nova revisão publicada no ECR:
  - `026544697783.dkr.ecr.us-east-1.amazonaws.com/guardia-app:20260409055655`
  - `026544697783.dkr.ecr.us-east-1.amazonaws.com/guardia-app:latest`
- ECS service validado com `guardia-app:9` como `PRIMARY`
- ALB respondeu `200 OK` após a troca de revisão

Comando rápido já existente:
```bash
npm run url
```

## Environment Variables Required For Full Search Feature

### Base app
```bash
DATABASE_URL=
GEMINI_API_KEY=
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_ANALYSIS=
COGNITO_CLIENT_ID=
```

### Busca CPF
```bash
CPF_API_BASE_URL=https://apicpf.com/api
CPF_API_KEY=
```

### CNJ
```bash
CNJ_API_BASE_URL=https://api.cnj.jus.br/api/v2
CNJ_API_KEY=
CNJ_TRIBUNAL_CODES=TJSP,TJRJ,TJMG,TRF1,TRF2,TRF3,TRF4,TRF5
```

### MongoDB
```bash
MONGODB_URI=
MONGODB_DB_NAME=guardia
```

## SuperAdmin Account

Conta consolidada nesta sessão:
- email: `bruno@oceanoazul.dev.br`
- role no PostgreSQL: `superAdmin`
- email verificado no Cognito: `true`

Importante:
- este documento não armazena senha
- Cognito exige senha com maiúscula, minúscula, número e símbolo

Helper criado para administração manual:
- `scripts/create-superadmin.ts`

Uso:
```bash
SUPERADMIN_EMAIL='email@exemplo.com' \
SUPERADMIN_PASSWORD='SenhaCompativel@123' \
DATABASE_URL='postgresql://...' \
npx tsx scripts/create-superadmin.ts
```

## Resume Guide For Next Agents

### Primeiro passo ao retomar
1. entrar no worktree `.worktrees/fase1-buscas-multitribunal`
2. rodar `npm test`
3. rodar `npm run build`
4. revisar `docs/superpowers/plans/2026-04-08-fase1-buscas-multitribunal.md`
5. revisar os arquivos em `src/lib/search/*` e `src/app/api/busca/*`

### Se for continuar a feature de buscas
- validar CNJ em ambiente sem restrição de DNS
- confirmar se `nome_mae` é aceito como parâmetro real da API CNJ usada
- decidir se a classificação criminal/cível precisa ser mais forte do que heurística textual
- integrar saldo/tokens antes de liberar uso irrestrito

### Se for fazer deploy
```bash
bash scripts/deploy.sh
aws ecs describe-services --cluster guardia-cluster --services guardia-service --region us-east-1 --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Task:taskDefinition}' --output table
aws logs tail /ecs/guardia-app --follow --region us-east-1
```

Observações reais desta sessão:
- o `scripts/deploy.sh` ainda depende de `docker login`, que falhou no macOS por `osxkeychain`
- o deploy foi concluído manualmente usando auth inline do ECR e depois `register-task-definition` + `update-service`
- se esse erro voltar, revisar logs temporários:
  - `/tmp/guardia_docker_build.log`
  - `/tmp/guardia_docker_push.log`
  - `/tmp/guardia_docker_push_retry.log`

### Se for validar o ambiente exposto
- URL estável esperada: `http://guardia-alb-1653604039.us-east-1.elb.amazonaws.com`
- testar:
  - `/`
  - `/dashboard`
  - `/buscas`
  - `POST /api/busca/cpf`
  - `POST /api/busca/antecedentes`

## Do Not Forget

- não remover a anonimização antes de persistência
- não acoplar o fluxo principal ao S3
- não confiar no baseline do diretório principal; o trabalho desta feature está no worktree
- sempre reler os docs do Next 16 antes de tocar em rotas App Router

Última atualização: 2026-04-09
Status desta sessão: implementação de buscas protegidas concluída no worktree, `superAdmin` consolidado, deploy realizado na revisão `guardia-app:9` e validado no ALB
