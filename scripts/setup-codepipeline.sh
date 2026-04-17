#!/bin/bash
set -e

REGION="us-east-1"
ACCOUNT_ID="026544697783"
GITHUB_REPO="BrunoBDevOceanoAzul/guardia-app"
EC2_INSTANCE_ID="i-07a6ed42a79520d16"
S3_BUCKET="guardia-pipeline-artifacts"
CODEBUILD_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/GuardiaCodeBuildRole"
CODEPIPELINE_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/GuardiaCodePipelineRole"

echo "=== AWS CodePipeline Setup para Guardia App ==="
echo ""

# 1. Verificar conexão CodeStar
echo "1. Verificando conexão CodeStar..."
CONNECTION_ARN=$(aws codestar-connections list-connections --region $REGION --query 'Connections[?ConnectionStatus==`AVAILABLE`].ConnectionArn' --output text)

if [ "$CONNECTION_ARN" == "None" ] || [ -z "$CONNECTION_ARN" ]; then
  echo ""
  echo "⚠️  A conexão CodeStar 'guardia-github' está em PENDING."
  echo ""
  echo "Para ativar:"
  echo "1. Acesse: https://${REGION}.console.aws.amazon.com/codesuite/settings/connections?region=${REGION}"
  echo "2. Clique em 'guardia-github'"
  echo "3. Clique em 'Update pending connection'"
  echo "4. Autorize o acesso ao GitHub"
  echo ""
  read -p "Pressione Enter quando a conexão estiver ativa..."
  
  CONNECTION_ARN=$(aws codestar-connections list-connections --region $REGION --query 'Connections[?ConnectionStatus==`AVAILABLE`].ConnectionArn' --output text)
  
  if [ "$CONNECTION_ARN" == "None" ] || [ -z "$CONNECTION_ARN" ]; then
    echo "❌ Conexão ainda não está ativa. Abortando."
    exit 1
  fi
fi

echo "✅ Conexão ativa: $CONNECTION_ARN"

# 2. Criar/verificar S3 bucket
echo ""
echo "2. Verificando S3 bucket..."
if aws s3api head-bucket --bucket $S3_BUCKET --region $REGION 2>/dev/null; then
  echo "✅ Bucket $S3_BUCKET já existe"
else
  aws s3api create-bucket --bucket $S3_BUCKET --region $REGION
  echo "✅ Bucket $S3_BUCKET criado"
fi

# 3. Criar CodeBuild project
echo ""
echo "3. Criando CodeBuild project..."
aws codebuild delete-project --name guardia-app-build --region $REGION 2>/dev/null || true

aws codebuild create-project \
  --name "guardia-app-build" \
  --source "{\"type\": \"CODESTAR_SOURCE_CONNECTION\", \"location\": \"${CONNECTION_ARN}:fullRepositoryName/${GITHUB_REPO}\", \"buildspec\": \"buildspec.yml\", \"gitCloneDepth\": 1}" \
  --artifacts "{\"type\": \"S3\", \"location\": \"${S3_BUCKET}\", \"packaging\": \"ZIP\"}" \
  --environment "{\"type\": \"LINUX_CONTAINER\", \"image\": \"aws/codebuild/standard:7.0\", \"computeType\": \"BUILD_GENERAL1_SMALL\", \"privilegedMode\": true}" \
  --service-role "$CODEBUILD_ROLE" \
  --region $REGION

echo "✅ CodeBuild project criado"

# 4. Criar CodeDeploy application e deployment groups
echo ""
echo "4. Configurando CodeDeploy..."
aws codedeploy create-application --application-name guardia-app --compute-platform EC2 --region $REGION 2>/dev/null || echo "App já existe"

for ENV in dev test prod; do
  case $ENV in
    dev) PORT=3000; TAG_KEY=Environment; TAG_VALUE=ci-cd ;;
    test) PORT=3001; TAG_KEY=Environment; TAG_VALUE=ci-cd ;;
    prod) PORT=3002; TAG_KEY=Environment; TAG_VALUE=ci-cd ;;
  esac
  
  aws codedeploy create-deployment-group \
    --application-name guardia-app \
    --deployment-group-name "guardia-${ENV}-group" \
    --ec2-tag-filters "[{\"Key\": \"${TAG_KEY}\", \"Value\": \"${TAG_VALUE}\", \"Type\": \"KEY_AND_VALUE\"}]" \
    --service-role-arn "$CODEBUILD_ROLE" \
    --deployment-style "{\"deploymentType\": \"IN_PLACE\", \"deploymentOption\": \"WITHOUT_TRAFFIC_CONTROL\"}" \
    --region $REGION 2>/dev/null || echo "Deployment group ${ENV} já existe"
done

echo "✅ CodeDeploy configurado"

# 5. Criar CodePipeline
echo ""
echo "5. Criando CodePipeline..."
aws codepipeline delete-pipeline --name guardia-app-pipeline --region $REGION 2>/dev/null || true

# Criar pipeline JSON
cat > /tmp/pipeline.json << PIPELINE
{
  "pipeline": {
    "name": "guardia-app-pipeline",
    "roleArn": "${CODEPIPELINE_ROLE}",
    "artifactStore": {
      "type": "S3",
      "location": "${S3_BUCKET}"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "Source",
            "actionTypeId": {
              "category": "Source",
              "owner": "AWS",
              "provider": "CodeStarSourceConnection",
              "version": "1"
            },
            "outputArtifacts": [{"name": "SourceOutput"}],
            "configuration": {
              "ConnectionArn": "${CONNECTION_ARN}",
              "FullRepositoryId": "${GITHUB_REPO}",
              "BranchName": "develop"
            },
            "runOrder": 1
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "Build",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "inputArtifacts": [{"name": "SourceOutput"}],
            "outputArtifacts": [{"name": "BuildOutput"}],
            "configuration": {
              "ProjectName": "guardia-app-build"
            },
            "runOrder": 1
          }
        ]
      },
      {
        "name": "Deploy",
        "actions": [
          {
            "name": "DeployToEC2",
            "actionTypeId": {
              "category": "Deploy",
              "owner": "AWS",
              "provider": "CodeDeploy",
              "version": "1"
            },
            "inputArtifacts": [{"name": "BuildOutput"}],
            "configuration": {
              "ApplicationName": "guardia-app",
              "DeploymentGroupName": "guardia-dev-group"
            },
            "runOrder": 1
          }
        ]
      }
    ]
  }
}
PIPELINE

aws codepipeline create-pipeline --cli-input-json file:///tmp/pipeline.json --region $REGION

echo "✅ CodePipeline criado"

echo ""
echo "=== Setup Completo! ==="
echo ""
echo "Pipeline: https://${REGION}.console.aws.amazon.com/codesuite/codepipeline/pipelines/guardia-app-pipeline/view?region=${REGION}"
echo ""
echo "URLs dos ambientes:"
echo "  DEV:  https://dev.irisregistro.qzz.io"
echo "  TEST: https://test.irisregistro.qzz.io"
echo "  PROD: https://irisregistro.qzz.io"
