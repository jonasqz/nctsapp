import { db } from "@/lib/db";
import { task } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
    .from(task)
    .where(and(eq(task.id, id), eq(task.workspaceId, ws.id)));

  if (!found) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(found);
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
    .from(task)
    .where(and(eq(task.id, id), eq(task.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const [updated] = await db
    .update(task)
    .set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      acceptanceCriteria:
        body.acceptanceCriteria ?? existing.acceptanceCriteria,
      status: body.status ?? existing.status,
      dueDate:
        body.dueDate !== undefined
          ? body.dueDate
            ? new Date(body.dueDate)
            : null
          : existing.dueDate,
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.workspaceId, ws.id)))
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
    .from(task)
    .where(and(eq(task.id, id), eq(task.workspaceId, ws.id)));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!canModifyEntity(role, session.user.id, existing.ownerId ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(task)
    .where(and(eq(task.id, id), eq(task.workspaceId, ws.id)));

  return NextResponse.json({ success: true });
}
