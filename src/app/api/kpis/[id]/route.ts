import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { kpi, strategicPillar } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

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

  // Verify KPI belongs to workspace via pillar
  const kpiRecord = await db
    .select({ kpi, pillar: strategicPillar })
    .from(kpi)
    .innerJoin(strategicPillar, eq(strategicPillar.id, kpi.pillarId))
    .where(and(eq(kpi.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!kpiRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, targetValue, currentValue, unit } = body;

  const updated = await db
    .update(kpi)
    .set({
      ...(name !== undefined && { name }),
      ...(targetValue !== undefined && { targetValue }),
      ...(currentValue !== undefined && { currentValue }),
      ...(unit !== undefined && { unit }),
      updatedAt: new Date(),
    })
    .where(eq(kpi.id, id))
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

  // Verify KPI belongs to workspace via pillar
  const kpiRecord = await db
    .select({ kpi, pillar: strategicPillar })
    .from(kpi)
    .innerJoin(strategicPillar, eq(strategicPillar.id, kpi.pillarId))
    .where(and(eq(kpi.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!kpiRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(kpi).where(eq(kpi.id, id));

  return NextResponse.json({ success: true });
}
