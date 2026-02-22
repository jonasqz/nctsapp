import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { workspaceInvite, workspaceMember } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code } = body as { code: string };

  if (!code)
    return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const invite = await db
    .select()
    .from(workspaceInvite)
    .where(eq(workspaceInvite.code, code))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!invite)
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  // Validate invite
  if (invite.revokedAt)
    return NextResponse.json(
      { error: "Invite has been revoked" },
      { status: 400 },
    );

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    return NextResponse.json(
      { error: "Invite has expired" },
      { status: 400 },
    );

  if (invite.maxUses !== null && invite.useCount >= invite.maxUses)
    return NextResponse.json(
      { error: "Invite has reached max uses" },
      { status: 400 },
    );

  // For email invites, verify the user's email matches
  if (
    invite.type === "email" &&
    invite.email &&
    session.user.email.toLowerCase() !== invite.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address" },
      { status: 403 },
    );
  }

  // Check if user is already a member
  const existing = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, invite.workspaceId),
        eq(workspaceMember.userId, session.user.id),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) {
    // Already a member — just set the cookie and redirect
    const cookieStore = await cookies();
    cookieStore.set("ncts-workspace-id", invite.workspaceId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({
      workspaceId: invite.workspaceId,
      alreadyMember: true,
    });
  }

  // Create workspace membership
  await db.insert(workspaceMember).values({
    id: `wm-${Date.now()}`,
    workspaceId: invite.workspaceId,
    userId: session.user.id,
    role: invite.role === "owner" ? "editor" : invite.role, // Never grant owner via invite
  });

  // Update invite
  await db
    .update(workspaceInvite)
    .set({
      acceptedAt: new Date(),
      acceptedBy: session.user.id,
      useCount: invite.useCount + 1,
    })
    .where(eq(workspaceInvite.id, invite.id));

  // Set workspace cookie
  const cookieStore = await cookies();
  cookieStore.set("ncts-workspace-id", invite.workspaceId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({
    workspaceId: invite.workspaceId,
    alreadyMember: false,
  });
}
