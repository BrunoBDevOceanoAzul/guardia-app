import "dotenv/config";
import crypto from "node:crypto";

import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { Pool } from "pg";

const email = process.env.SUPERADMIN_EMAIL || "bruno@oceanoazul.dev.br";
const password = process.env.SUPERADMIN_PASSWORD;
const userPoolId = "us-east-1_iwU4xEMtV";
const region = process.env.AWS_REGION || "us-east-1";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL missing");
}

if (!password) {
  throw new Error("SUPERADMIN_PASSWORD missing");
}

function hashData(data: string): string {
  return crypto.createHash("sha256").update(data.toLowerCase()).digest("hex");
}

async function ensureCognitoUser() {
  const cognito = new CognitoIdentityProviderClient({ region });

  try {
    const existing = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    );

    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      }),
    );

    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );

    return (
      existing.UserAttributes?.find((attribute) => attribute.Name === "sub")
        ?.Value ?? null
    );
  } catch (error) {
    const cognitoError = error as { name?: string };

    if (cognitoError.name !== "UserNotFoundException") {
      throw error;
    }
  }

  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      TemporaryPassword: password,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
    }),
  );

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );

  const created = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    }),
  );

  return (
    created.UserAttributes?.find((attribute) => attribute.Name === "sub")
      ?.Value ?? null
  );
}

async function upsertDatabaseUser(cognitoSub: string | null) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const emailHash = hashData(email);
  const userHash = hashData(`${email}:${Date.now()}`);

  try {
    const existing = await pool.query(
      "select id from users where email_hash = $1 limit 1",
      [emailHash],
    );

    if (existing.rowCount && existing.rows[0]?.id) {
      const updated = await pool.query(
        `update users
         set role = $2,
             cognito_sub = $3,
             email_verified = true,
             updated_at = now()
         where id = $1
         returning id, role, email_verified, cognito_sub`,
        [existing.rows[0].id, "superAdmin", cognitoSub],
      );

      return { mode: "updated", user: updated.rows[0] };
    }

    const inserted = await pool.query(
      `insert into users (user_hash, email_hash, cognito_sub, role, email_verified)
       values ($1, $2, $3, $4, true)
       returning id, role, email_verified, cognito_sub`,
      [userHash, emailHash, cognitoSub, "superAdmin"],
    );

    return { mode: "inserted", user: inserted.rows[0] };
  } finally {
    await pool.end();
  }
}

async function main() {
  const cognitoSub = await ensureCognitoUser();
  const database = await upsertDatabaseUser(cognitoSub);

  console.log(
    JSON.stringify(
      {
        email,
        cognitoSub,
        database,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
