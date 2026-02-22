import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { team } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const teams = await db
    .select()
    .from(team)
    .where(eq(team.workspaceId, ws.id));

  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!isAdminOrOwner(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  const newTeam = await db
    .insert(team)
    .values({
      id: `team-${Date.now()}`,
      workspaceId: ws.id,
      name,
    })
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(newTeam, { status: 201 });
}
