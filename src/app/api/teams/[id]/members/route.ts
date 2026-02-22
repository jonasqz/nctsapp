import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { team, teamMember, workspaceMember, user } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;
  const { id } = await params;

  // Verify team belongs to workspace
  const teamRow = await db
    .select()
    .from(team)
    .where(and(eq(team.id, id), eq(team.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!teamRow)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Get team members with user info
  const members = await db
    .select({
      id: teamMember.id,
      userId: teamMember.userId,
      createdAt: teamMember.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.teamId, id));

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      createdAt: m.createdAt,
      user: {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
      },
    })),
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;
  const { id } = await params;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { userId } = body as { userId: string };

  if (!userId)
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Verify team belongs to workspace
  const teamRow = await db
    .select()
    .from(team)
    .where(and(eq(team.id, id), eq(team.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!teamRow)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Verify user is a workspace member
  const wsMember = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.userId, userId),
        eq(workspaceMember.workspaceId, ws.id),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!wsMember)
    return NextResponse.json(
      { error: "User is not a workspace member" },
      { status: 400 },
    );

  // Check if already a team member
  const existing = await db
    .select()
    .from(teamMember)
    .where(and(eq(teamMember.teamId, id), eq(teamMember.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing)
    return NextResponse.json(
      { error: "User is already a team member" },
      { status: 409 },
    );

  // Add to team
  const newMember = await db
    .insert(teamMember)
    .values({
      id: `tm-${Date.now()}`,
      teamId: id,
      userId,
    })
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(newMember, { status: 201 });
}
