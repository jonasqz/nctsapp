import { db } from "@/lib/db";
import { commitment, narrative } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { canEdit } from "@/lib/permissions";

export async function GET(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const { searchParams } = new URL(request.url);
  const narrativeId = searchParams.get("narrativeId");

  const conditions = [eq(commitment.workspaceId, ws.id)];
  if (narrativeId) {
    conditions.push(eq(commitment.narrativeId, narrativeId));
  }

  const commitments = await db
    .select()
    .from(commitment)
    .where(and(...conditions))
    .orderBy(commitment.createdAt);

  return NextResponse.json(commitments);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, workspace: ws, role } = ctx;

  if (!canEdit(role)) {
    return NextResponse.json({ error: "Viewers cannot modify content" }, { status: 403 });
  }

  const body = await request.json();

  // Verify narrative belongs to workspace
  const [narr] = await db
    .select()
    .from(narrative)
    .where(
      and(
        eq(narrative.id, body.narrativeId),
        eq(narrative.workspaceId, ws.id)
      )
    );

  if (!narr) {
    return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
  }

  const id = `commitment-${Date.now()}`;

  const [created] = await db
    .insert(commitment)
    .values({
      id,
      title: body.title,
      outcome: body.outcome || null,
      keyResults: body.keyResults || null,
      status: body.status || "active",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      narrativeId: body.narrativeId,
      workspaceId: ws.id,
      ownerId: session.user.id,
      teamId: body.teamId || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
