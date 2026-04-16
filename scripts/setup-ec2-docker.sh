#!/bin/bash
set -e

echo "=== Setup EC2 for CI/CD Pipeline ==="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo service docker start
    sudo usermod -a -G docker ec2-user
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Criar diretório da aplicação
sudo mkdir -p /opt/guardia
sudo chown -R ec2-user:ec2-user /opt/guardia

# Criar diretório para Traefik
sudo mkdir -p /opt/guardia/traefik/certs

echo "=== Docker version ==="
docker --version
docker-compose --version

echo "=== Setup complete! ==="
echo "Next steps:"
echo "1. Copiar docker-compose.prod.yml para /opt/guardia/"
echo "2. Configurar AWS credentials (IAM role recomendada)"
echo "3. Executar: cd /opt/guardia && docker-compose up -d"