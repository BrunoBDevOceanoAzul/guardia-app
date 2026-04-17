#!/bin/bash
# Script de deploy para EC2 via SSM Run Command
# Executado após o CodeBuild completar com sucesso
# Recebe IMAGE_TAG e BRANCH_NAME como parâmetros

set -e

BRANCH_NAME="${1:-develop}"
IMAGE_TAG="${2:-latest}"
EC2_INSTANCE_ID="${3:-}"
AWS_REGION="${4:-us-east-1}"

# Mapear branch para porta
case "$BRANCH_NAME" in
  develop)
    CONTAINER_NAME="guardia-dev"
    PORT=3000
    APP_ENV="dev"
    ;;
  test)
    CONTAINER_NAME="guardia-test"
    PORT=3001
    APP_ENV="test"
    ;;
  main)
    CONTAINER_NAME="guardia-prod"
    PORT=3002
    APP_ENV="prod"
    ;;
  *)
    echo "Branch não reconhecida: $BRANCH_NAME"
    exit 1
    ;;
esac

ECR_URI="026544697783.dkr.ecr.us-east-1.amazonaws.com/guardia-app:${IMAGE_TAG}"

echo "=== Deploy para $BRANCH_NAME ==="
echo "Container: $CONTAINER_NAME"
echo "Porta: $PORT"
echo "Imagem: $ECR_URI"

# Comando a ser executado na EC2
COMMAND="#!/bin/bash
set -e
echo 'Logging in to ECR...'
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 026544697783.dkr.ecr.us-east-1.amazonaws.com

echo 'Stopping old container...'
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo 'Pulling new image...'
docker pull $ECR_URI

echo 'Starting new container...'
docker run -d \\
  --name $CONTAINER_NAME \\
  -p $PORT:3000 \\
  -e NODE_ENV=production \\
  -e APP_ENV=$APP_ENV \\
  -e AWS_REGION=us-east-1 \\
  --restart unless-stopped \\
  $ECR_URI

echo 'Waiting for container to start...'
sleep 5

echo 'Checking container status...'
docker ps --filter name=$CONTAINER_NAME

echo 'Deploy completo para $BRANCH_NAME!'
"

# Executar via SSM Run Command
if [ -n "$EC2_INSTANCE_ID" ]; then
  echo "Enviando comando para EC2: $EC2_INSTANCE_ID"
  aws ssm send-command \
    --instance-ids "$EC2_INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=$(echo "$COMMAND" | sed ':a;N;$!ba;s/\n/\\n/g')" \
    --region "$AWS_REGION" \
    --output text
  
  echo "Comando enviado. Verifique o status no CloudWatch Logs."
else
  echo "EC2_INSTANCE_ID não definido. Executando localmente..."
  eval "$COMMAND"
fi
