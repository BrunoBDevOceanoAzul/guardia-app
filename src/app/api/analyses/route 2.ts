import { desc } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { analyses } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userAnalyses = await db
      .select({
        id: analyses.id,
        step: analyses.step,
        outputData: analyses.outputData,
        confidence: analyses.confidence,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(50);

    return NextResponse.json(userAnalyses);
  } catch (error) {
    console.error("Failed to fetch analyses:", error);
    return NextResponse.json(
      { message: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}
