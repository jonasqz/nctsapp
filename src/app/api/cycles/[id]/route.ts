import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { cycle } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;
  const { id } = await params;

  const found = await db
    .select()
    .from(cycle)
    .where(and(eq(cycle.id, id), eq(cycle.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(found);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;
  const { id } = await params;

  if (!isAdminOrOwner(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, startDate, endDate, status } = body;

  const updated = await db
    .update(cycle)
    .set({
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    })
    .where(and(eq(cycle.id, id), eq(cycle.workspaceId, ws.id)))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;
  const { id } = await params;

  if (!isAdminOrOwner(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await db
    .delete(cycle)
    .where(and(eq(cycle.id, id), eq(cycle.workspaceId, ws.id)))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
