import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { strategicPillar, kpi } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;
  const { id } = await params;

  const pillar = await db
    .select()
    .from(strategicPillar)
    .where(and(eq(strategicPillar.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!pillar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const kpis = await db
    .select()
    .from(kpi)
    .where(eq(kpi.pillarId, pillar.id));

  return NextResponse.json({ ...pillar, kpis });
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
  const { title, description, order, status } = body;

  const updated = await db
    .update(strategicPillar)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    })
    .where(and(eq(strategicPillar.id, id), eq(strategicPillar.workspaceId, ws.id)))
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

  // KPIs cascade-delete via foreign key constraint
  const deleted = await db
    .delete(strategicPillar)
    .where(and(eq(strategicPillar.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
