import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, sql, max } from "drizzle-orm";
import { strategicPillar, kpi, narrative, year } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  // Find current year record
  const currentYear = new Date().getFullYear();
  const yearRecord = await db
    .select()
    .from(year)
    .where(and(eq(year.workspaceId, ws.id), eq(year.year, currentYear)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!yearRecord) {
    return NextResponse.json([]);
  }

  // Get pillars for this year
  const pillars = await db
    .select()
    .from(strategicPillar)
    .where(
      and(
        eq(strategicPillar.workspaceId, ws.id),
        eq(strategicPillar.yearId, yearRecord.id)
      )
    );

  // For each pillar, get KPIs and count narratives
  const result = await Promise.all(
    pillars.map(async (pillar) => {
      const kpis = await db
        .select()
        .from(kpi)
        .where(eq(kpi.pillarId, pillar.id));

      const narrativeCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(narrative)
        .where(eq(narrative.pillarId, pillar.id))
        .then((rows) => rows[0]?.count ?? 0);

      return {
        ...pillar,
        kpis,
        narrativeCount: narrativeCountResult,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!isAdminOrOwner(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description } = body;
  let { yearId } = body as { yearId?: string };

  if (!title) {
    return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
  }

  // Auto-resolve yearId from current year if not provided
  if (!yearId) {
    const currentYear = new Date().getFullYear();
    const yearRecord = await db
      .select()
      .from(year)
      .where(and(eq(year.workspaceId, ws.id), eq(year.year, currentYear)))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!yearRecord) {
      return NextResponse.json(
        { error: "No year record found. Create a cycle first." },
        { status: 400 }
      );
    }
    yearId = yearRecord.id;
  }

  // Get max order for auto-increment
  const maxOrderResult = await db
    .select({ maxOrder: max(strategicPillar.order) })
    .from(strategicPillar)
    .where(
      and(
        eq(strategicPillar.workspaceId, ws.id),
        eq(strategicPillar.yearId, yearId)
      )
    )
    .then((rows) => rows[0]?.maxOrder ?? 0);

  const newPillar = await db
    .insert(strategicPillar)
    .values({
      id: `pillar-${Date.now()}`,
      workspaceId: ws.id,
      yearId,
      title,
      description: description ?? null,
      order: (maxOrderResult ?? 0) + 1,
    })
    .returning()
    .then((rows) => rows[0]);

  // Optionally create an initial KPI if provided
  const { kpiData } = body as { kpiData?: { name: string; targetValue: string; unit: string } };
  const kpiPayload = kpiData ?? body.kpi;
  if (kpiPayload && kpiPayload.name) {
    await db.insert(kpi).values({
      id: `kpi-${Date.now()}`,
      pillarId: newPillar.id,
      name: kpiPayload.name,
      targetValue: kpiPayload.targetValue ?? "",
      currentValue: null,
      unit: kpiPayload.unit ?? "",
    });
  }

  return NextResponse.json(newPillar, { status: 201 });
}
