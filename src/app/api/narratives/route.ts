import { getSessionAndWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { narrative } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { canEdit } from "@/lib/permissions";

export async function GET(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspace: ws } = ctx;

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const teamId = searchParams.get("teamId");

  const conditions = [eq(narrative.workspaceId, ws.id)];
  if (cycleId) conditions.push(eq(narrative.cycleId, cycleId));
  if (teamId) conditions.push(eq(narrative.teamId, teamId));

  const narratives = await db
    .select()
    .from(narrative)
    .where(and(...conditions))
    .orderBy(narrative.createdAt);

  return NextResponse.json(narratives);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { session, workspace: ws, role } = ctx;

  if (!canEdit(role)) {
    return NextResponse.json({ error: "Viewers cannot modify content" }, { status: 403 });
  }

  const body = await request.json();
  const id = `narrative-${Date.now()}`;

  const [created] = await db
    .insert(narrative)
    .values({
      id,
      title: body.title,
      context: body.context || null,
      whyNow: body.whyNow || null,
      successLooksLike: body.successLooksLike || null,
      status: "active",
      ownerId: session.user.id,
      workspaceId: ws.id,
      cycleId: body.cycleId || null,
      teamId: body.teamId || null,
      pillarId: body.pillarId || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
