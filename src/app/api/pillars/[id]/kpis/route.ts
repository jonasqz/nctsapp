import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { strategicPillar, kpi } from "@/lib/db/schema";
import { canEdit } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;
  const { id } = await params;

  // Verify pillar belongs to workspace
  const pillar = await db
    .select()
    .from(strategicPillar)
    .where(and(eq(strategicPillar.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!pillar) {
    return NextResponse.json({ error: "Pillar not found" }, { status: 404 });
  }

  const kpis = await db
    .select()
    .from(kpi)
    .where(eq(kpi.pillarId, id));

  return NextResponse.json(kpis);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!canEdit(role)) {
    return NextResponse.json({ error: "Viewers cannot modify content" }, { status: 403 });
  }
  const { id } = await params;

  // Verify pillar belongs to workspace
  const pillar = await db
    .select()
    .from(strategicPillar)
    .where(and(eq(strategicPillar.id, id), eq(strategicPillar.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!pillar) {
    return NextResponse.json({ error: "Pillar not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, targetValue, unit } = body;

  if (!name || !targetValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newKpi = await db
    .insert(kpi)
    .values({
      id: `kpi-${Date.now()}`,
      pillarId: id,
      name,
      targetValue,
      unit: unit ?? null,
    })
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(newKpi, { status: 201 });
}
