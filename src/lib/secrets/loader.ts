import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function loadSecrets() {
  const secretNames = [
    'guardia/keys/gemini',
    'guardia/keys/aws',
    'guardia/db/postgres',
    'guardia/retool/api'
  ];

  for (const name of secretNames) {
    try {
      const command = new GetSecretValueCommand({ SecretId: name });
      const response = await client.send(command);
      const secret = JSON.parse(response.SecretString!);
      
      Object.entries(secret).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          process.env[key] = value;
        }
      });
      
      console.log(`Loaded secret: ${name}`);
    } catch (error) {
      console.warn(`Could not load secret ${name}:`, error);
    }
  }
}