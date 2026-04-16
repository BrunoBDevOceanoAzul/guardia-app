#!/bin/bash
# Script para configurar o Retool como orquestrador do pipeline

echo "=== Configuração do Retool para Orquestração ==="
echo ""
echo "O Retool está disponível em: https://retool_01kpbqncmtsjm95javczj95a2w.retool.com"
echo ""
echo "PASSO 1: Criar Resource para AWS Secrets"
echo "   1. Acesse o Retool"
echo "   2. Vá em Resources > Create New > AWS Secrets Manager"
echo "   3. Configure a região: us-east-1"
echo ""
echo "PASSO 2: Criar Resource para GitHub API"
echo "   1. Resources > Create New > REST API"
echo "   2. URL: https://api.github.com"
echo "   3. Authentication: Bearer Token"
echo "   4. Token: Seu GitHub PAT"
echo ""
echo "PASSO 3: Criar Dashboard de Pipeline"
echo "   Crie os seguintes componentes:"
echo "   - Status Cards (DEV/TEST/PROD) - mostram status atual"
echo "   - Tables - histórico de deploys"
echo "   - Buttons - botões para promover código"
echo "   - Text - logs de execução"
echo ""
echo "PASSO 4: Configurar Webhook de Notificação"
echo "   1. Vá em Workflows > Create New"
echo "   2. Configure o trigger como webhook"
echo "   3. URL do webhook: Use esta URL no GitHub Actions"
echo ""
echo "Exemplo de JSON que o GitHub Actions envia:"
cat << 'EOF'
{
  "status": "success|failure",
  "branch": "develop|test|main",
  "commit": "abc123...",
  "run_id": 123456,
  "environment": "dev|test|prod",
  "timestamp": "2026-04-16T22:00:00Z"
}
EOF
echo ""
echo "=== Próximos Passos ==="
echo "1. Acesse o Retool: https://retool_01kpbqncmtsjm95javczj95a2w.retool.com"
echo "2. Configure os Resources"
echo "3. Crie o Dashboard visual do pipeline"