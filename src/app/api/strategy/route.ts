import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { workspace, strategicPillar, kpi, narrative, year } from "@/lib/db/schema";
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

  // Get active pillars for the current year
  let pillars: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    status: "active" | "archived";
    kpis: Array<{
      id: string;
      name: string;
      targetValue: string;
      currentValue: string | null;
      unit: string | null;
    }>;
    narrativeCount: number;
  }> = [];

  if (yearRecord) {
    const pillarRows = await db
      .select()
      .from(strategicPillar)
      .where(
        and(
          eq(strategicPillar.workspaceId, ws.id),
          eq(strategicPillar.yearId, yearRecord.id),
          eq(strategicPillar.status, "active")
        )
      );

    pillars = await Promise.all(
      pillarRows.map(async (pillar) => {
        const kpis = await db
          .select({
            id: kpi.id,
            name: kpi.name,
            targetValue: kpi.targetValue,
            currentValue: kpi.currentValue,
            unit: kpi.unit,
          })
          .from(kpi)
          .where(eq(kpi.pillarId, pillar.id));

        const narrativeCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(narrative)
          .where(eq(narrative.pillarId, pillar.id))
          .then((rows) => rows[0]?.count ?? 0);

        return {
          id: pillar.id,
          title: pillar.title,
          description: pillar.description,
          order: pillar.order,
          status: pillar.status,
          kpis,
          narrativeCount: narrativeCountResult,
        };
      })
    );
  }

  return NextResponse.json({
    vision: ws.vision,
    strategyDocUrl: ws.strategyDocUrl,
    pillars,
  });
}

export async function PUT(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!isAdminOrOwner(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { vision, strategyDocUrl } = body;

  const updated = await db
    .update(workspace)
    .set({
      ...(vision !== undefined && { vision }),
      ...(strategyDocUrl !== undefined && { strategyDocUrl }),
      updatedAt: new Date(),
    })
    .where(eq(workspace.id, ws.id))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    vision: updated.vision,
    strategyDocUrl: updated.strategyDocUrl,
  });
}
