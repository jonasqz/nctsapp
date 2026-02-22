import { db } from "@/lib/db";
import { task, commitment } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { canEdit } from "@/lib/permissions";

export async function GET(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const { searchParams } = new URL(request.url);
  const commitmentId = searchParams.get("commitmentId");

  const conditions = [eq(task.workspaceId, ws.id)];
  if (commitmentId) {
    conditions.push(eq(task.commitmentId, commitmentId));
  }

  const tasks = await db
    .select()
    .from(task)
    .where(and(...conditions))
    .orderBy(task.createdAt);

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, workspace: ws, role } = ctx;

  if (!canEdit(role)) {
    return NextResponse.json({ error: "Viewers cannot modify content" }, { status: 403 });
  }

  const body = await request.json();

  // Verify commitment belongs to workspace
  const [comm] = await db
    .select()
    .from(commitment)
    .where(
      and(
        eq(commitment.id, body.commitmentId),
        eq(commitment.workspaceId, ws.id)
      )
    );

  if (!comm) {
    return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
  }

  const id = `task-${Date.now()}`;

  const [created] = await db
    .insert(task)
    .values({
      id,
      title: body.title,
      description: body.description || null,
      acceptanceCriteria: body.acceptanceCriteria || null,
      status: body.status || "todo",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      commitmentId: body.commitmentId,
      workspaceId: ws.id,
      ownerId: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
