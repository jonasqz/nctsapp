import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { workspaceInvite, workspace, user } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code)
    return NextResponse.json(
      { valid: false, error: "Missing code" },
      { status: 400 },
    );

  const invite = await db
    .select()
    .from(workspaceInvite)
    .where(eq(workspaceInvite.code, code))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!invite)
    return NextResponse.json({ valid: false, error: "Invite not found" });

  // Check if revoked
  if (invite.revokedAt)
    return NextResponse.json({ valid: false, error: "Invite has been revoked" });

  // Check if expired
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    return NextResponse.json({ valid: false, error: "Invite has expired" });

  // Check max uses (for link-type invites)
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses)
    return NextResponse.json({
      valid: false,
      error: "Invite has reached max uses",
    });

  // Get workspace name
  const ws = await db
    .select({ name: workspace.name })
    .from(workspace)
    .where(eq(workspace.id, invite.workspaceId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  // Get inviter name
  const inviter = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, invite.invitedBy))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return NextResponse.json({
    valid: true,
    workspaceName: ws?.name ?? "Unknown workspace",
    inviterName: inviter?.name ?? "Someone",
    role: invite.role,
    type: invite.type,
  });
}
