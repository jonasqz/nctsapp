import { db } from "@/lib/db";
import { commitment, task } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { canModifyEntity } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const { id } = await params;

  const [found] = await db
    .select()
    .from(commitment)
    .where(and(eq(commitment.id, id), eq(commitment.workspaceId, ws.id)));

  if (!found) {
    return NextResponse.json(
      { error: "Commitment not found" },
      { status: 404 }
    );
  }

  // Get tasks count for this commitment
  const [tasksCount] = await db
    .select({ count: count() })
    .from(task)
    .where(eq(task.commitmentId, id));

  return NextResponse.json({
    ...found,
    tasksCount: tasksCount.count,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, session, role } = ctx;

  const { id } = await params;

  // Verify workspace ownership
  const [existing] = await db
    .select()
    .from(commitment)
    .where(and(eq(commitment.id, id), eq(commitment.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json(
      { error: "Commitment not found" },
      { status: 404 }
    );
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const [updated] = await db
    .update(commitment)
    .set({
      title: body.title ?? existing.title,
      outcome: body.outcome ?? existing.outcome,
      keyResults: body.keyResults ?? existing.keyResults,
      status: body.status ?? existing.status,
      dueDate:
        body.dueDate !== undefined
          ? body.dueDate
            ? new Date(body.dueDate)
            : null
          : existing.dueDate,
      teamId: body.teamId !== undefined ? body.teamId : existing.teamId,
      updatedAt: new Date(),
    })
    .where(and(eq(commitment.id, id), eq(commitment.workspaceId, ws.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, session, role } = ctx;

  const { id } = await params;

  // Verify workspace ownership
  const [existing] = await db
    .select()
    .from(commitment)
    .where(and(eq(commitment.id, id), eq(commitment.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json(
      { error: "Commitment not found" },
      { status: 404 }
    );
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(commitment)
    .where(and(eq(commitment.id, id), eq(commitment.workspaceId, ws.id)));

  return NextResponse.json({ success: true });
}
