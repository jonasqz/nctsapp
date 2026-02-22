import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cycle } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { canEdit } from "@/lib/permissions";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const cycles = await db
    .select()
    .from(cycle)
    .where(eq(cycle.workspaceId, ws.id))
    .orderBy(desc(cycle.startDate));

  return NextResponse.json(cycles);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!canEdit(role)) {
    return NextResponse.json({ error: "Viewers cannot modify content" }, { status: 403 });
  }

  const body = await request.json();
  const { name, yearId, startDate, endDate } = body;

  if (!name || !yearId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newCycle = await db
    .insert(cycle)
    .values({
      id: `cyc-${Date.now()}`,
      workspaceId: ws.id,
      yearId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "planning",
    })
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(newCycle, { status: 201 });
}
