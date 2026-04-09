# Guia de Deploy - Guardiã App

## Pré-requisitos

- Conta AWS ativa
- AWS CLI configurado (`aws configure`)
- Docker instalado
- Node.js 20+

## 1. Configuração Inicial na AWS

### 1.1 Criar User Pool no Cognito

```bash
# Criar User Pool
aws cognito-idp create-user-pool \
  --pool-name guardia-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --region us-east-1

# Anote o UserPoolId retornado

# Criar App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name guardia-web \
  --explicit-auth-flows USER_PASSWORD_AUTH \
  --region us-east-1

# Anote o ClientId retornado
```

### 1.2 Criar Banco RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier guardia-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username guardia \
  --master-user-password Guardia2024! \
  --allocated-storage 20 \
  --db-name guardia \
  --publicly-accessible \
  --region us-east-1
```

### 1.3 Criar Bucket S3 (opcional)

```bash
aws s3 mb s3://guardia-uploads-us-east-1 --region us-east-1
```

### 1.4 Criar Usuário IAM para a Aplicação

```bash
# Criar usuário
aws iam create-user --user-name guardia-app

# Anexar políticas necessárias
aws iam attach-user-policy --user-name guardia-app --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser
aws iam attach-user-policy --user-name guardia-app --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Criar Access Keys
aws iam create-access-key --user-name guardia-app
# Anote AccessKeyId e SecretAccessKey
```

## 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` com suas credenciais:

```env
# Gemini AI
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.5-flash

# Busca CPF
CPF_API_BASE_URL=https://apicpf.com/api
CPF_API_KEY=sua_chave_apicpf

# CNJ / DataJud
CNJ_API_BASE_URL=https://api.cnj.jus.br/api/v2
CNJ_API_KEY=sua_chave_cnj
CNJ_TRIBUNAL_CODES=TJSP,TJRJ,TRF1

# MongoDB para histórico anonimizado
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?appName=guardia
MONGODB_DB_NAME=guardia

# AWS Credentials
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1

# Database
DATABASE_URL=postgresql://guardia:Guardia2024!@guardia-db.xxxxx.us-east-1.rds.amazonaws.com:5432/guardia

# S3
S3_BUCKET=guardia-uploads-us-east-1

# AWS Cognito
NEXT_PUBLIC_COGNITO_CLIENT_ID=seu_client_id
NEXT_PUBLIC_COGNITO_USER_POOL_ID=seu_user_pool_id
COGNITO_CLIENT_SECRET=seu_client_secret
```

## 3. Deploy

### 3.1 Deploy Automático

```bash
# Dar permissão de execução
chmod +x scripts/deploy.sh scripts/update-env.sh

# Executar deploy
./scripts/deploy.sh
```

### 3.2 Atualizar Variáveis de Ambiente

```bash
./scripts/update-env.sh
```

## 4. Criar Tabelas no Banco

Após o deploy, execute o script de criação de tabelas:

```bash
npm run db:push
# ou
npx tsx scripts/create-tables.ts
```

## 5. Verificar Deploy

Acesse a URL retornada pelo script de deploy (ex: `https://xxxxx.us-east-1.awsapprunner.com`)

## Troubleshooting

### Erro de Conexão com Banco

1. Verifique se o RDS está acessível publicamente
2. Verifique se o Security Group permite conexões na porta 5432
3. Teste a conexão: `psql $DATABASE_URL`

### Erro de Autenticação Cognito

1. Verifique se o App Client tem `USER_PASSWORD_AUTH` habilitado
2. Verifique se o usuário foi confirmado (verificação de email)

### Rotas de Busca Respondendo 503

1. Verifique se `CPF_API_BASE_URL` e `CPF_API_KEY` estão presentes no task definition
2. Verifique se `CNJ_API_BASE_URL`, `CNJ_API_KEY` e `CNJ_TRIBUNAL_CODES` foram enviados ao container
3. Verifique se `MONGODB_URI` e `MONGODB_DB_NAME` estão configurados

### Erro no App Runner

1. Verifique os logs: `aws apprunner describe-service --service-arn <ARN>`
2. Verifique se as variáveis de ambiente estão corretas

## Custos Estimados (us-east-1)

- App Runner (1 vCPU, 2GB): ~$25/mês
- RDS PostgreSQL (db.t3.micro): ~$15/mês
- Cognito: Grátis até 50k MAU
- S3: ~$0.023/GB
- Data Transfer: Variável

**Total estimado: ~$40-50/mês para uso moderado**
