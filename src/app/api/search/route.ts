import { db } from "@/lib/db";
import { narrative, commitment, task } from "@/lib/db/schema";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { eq, ilike, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({
      narratives: [],
      commitments: [],
      tasks: [],
    });
  }

  const pattern = `%${q}%`;

  const [narratives, commitments, tasks] = await Promise.all([
    db
      .select({
        id: narrative.id,
        title: narrative.title,
        status: narrative.status,
      })
      .from(narrative)
      .where(
        and(
          eq(narrative.workspaceId, ws.id),
          ilike(narrative.title, pattern),
        ),
      )
      .limit(10),
    db
      .select({
        id: commitment.id,
        title: commitment.title,
        status: commitment.status,
        narrativeId: commitment.narrativeId,
      })
      .from(commitment)
      .where(
        and(
          eq(commitment.workspaceId, ws.id),
          ilike(commitment.title, pattern),
        ),
      )
      .limit(10),
    db
      .select({
        id: task.id,
        title: task.title,
        status: task.status,
        commitmentId: task.commitmentId,
      })
      .from(task)
      .where(
        and(eq(task.workspaceId, ws.id), ilike(task.title, pattern)),
      )
      .limit(10),
  ]);

  return NextResponse.json({ narratives, commitments, tasks });
}
