import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

export type AuthenticatedUser = {
  id: string;
  role: string | null;
};

export async function getAuthenticatedUser(
  sessionToken: string | undefined,
): Promise<AuthenticatedUser | null> {
  if (!sessionToken) {
    return null;
  }

  const [session] = await db
    .select({
      userId: sessions.userId,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.token, sessionToken),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session?.userId) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}
