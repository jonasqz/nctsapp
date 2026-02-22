import { getSessionAndWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { narrative } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { canModifyEntity } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspace: ws } = ctx;

  const { id } = await params;

  const [found] = await db
    .select()
    .from(narrative)
    .where(and(eq(narrative.id, id), eq(narrative.workspaceId, ws.id)));

  if (!found) {
    return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
  }

  return NextResponse.json(found);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspace: ws, session, role } = ctx;

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(narrative)
    .where(and(eq(narrative.id, id), eq(narrative.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const [updated] = await db
    .update(narrative)
    .set({
      title: body.title ?? existing.title,
      context: body.context ?? existing.context,
      whyNow: body.whyNow ?? existing.whyNow,
      successLooksLike: body.successLooksLike ?? existing.successLooksLike,
      status: body.status ?? existing.status,
      teamId: body.teamId ?? existing.teamId,
      pillarId: body.pillarId ?? existing.pillarId,
      cycleId: body.cycleId ?? existing.cycleId,
      updatedAt: new Date(),
    })
    .where(and(eq(narrative.id, id), eq(narrative.workspaceId, ws.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspace: ws, session, role } = ctx;

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(narrative)
    .where(and(eq(narrative.id, id), eq(narrative.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(narrative)
    .where(and(eq(narrative.id, id), eq(narrative.workspaceId, ws.id)));

  return NextResponse.json({ success: true });
}
