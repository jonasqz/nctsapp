import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { team, teamMember } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;
  const { id, userId } = await params;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify team belongs to workspace
  const teamRow = await db
    .select()
    .from(team)
    .where(and(eq(team.id, id), eq(team.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!teamRow)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Remove from team
  const deleted = await db
    .delete(teamMember)
    .where(and(eq(teamMember.teamId, id), eq(teamMember.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!deleted)
    return NextResponse.json(
      { error: "User is not a member of this team" },
      { status: 404 },
    );

  return NextResponse.json({ success: true });
}
