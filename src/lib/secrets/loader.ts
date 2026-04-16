import os
import json
import boto3
from botocore.exceptions import ClientError

class SecretsManager:
    def __init__(self):
        self.client = boto3.client('secretsmanager', region_name='us-east-1')
    
    def get_secret(self, secret_name):
        try:
            get_secret_value_response = self.client.get_secret_value(
                SecretId=secret_name
            )
            secret = get_secret_value_response['SecretString']
            return json.loads(secret)
        except ClientError as e:
            print(f"Error retrieving secret {secret_name}: {e}")
            return None

secrets = SecretsManager()

# Carregar secrets como variáveis de ambiente
gemini_secrets = secrets.get_secret('guardia/keys/gemini')
aws_secrets = secrets.get_secret('guardia/keys/aws')
db_secrets = secrets.get_secret('guardia/db/postgres')
retool_secrets = secrets.get_secret('guardia/retool/api')

if gemini_secrets:
    os.environ['GEMINI_API_KEY'] = gemini_secrets.get('GEMINI_API_KEY', '')

if aws_secrets:
    os.environ['AWS_ACCESS_KEY_ID'] = aws_secrets.get('AWS_ACCESS_KEY_ID', '')
    os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secrets.get('AWS_SECRET_ACCESS_KEY', '')
    os.environ['AWS_REGION'] = aws_secrets.get('AWS_REGION', 'us-east-1')

if db_secrets:
    os.environ['DATABASE_URL'] = db_secrets.get('DATABASE_URL', '')

print("Secrets carregados com sucesso!")
print(f"Gemini API Key: {'*' * 10}...")
print(f"AWS Region: {os.environ.get('AWS_REGION', 'N/A')}")
print(f"Database URL: {os.environ.get('DATABASE_URL', 'N/A')[:30]}...")