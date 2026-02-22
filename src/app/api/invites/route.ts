import { getSessionAndWorkspace, getWorkspaceRoleCounts } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { workspaceInvite, subscription } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";
import { sendWorkspaceInviteEmail } from "@/lib/email";
import { getPlan } from "@/lib/plans";
import crypto from "crypto";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws, role } = ctx;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invites = await db
    .select()
    .from(workspaceInvite)
    .where(
      and(
        eq(workspaceInvite.workspaceId, ws.id),
        isNull(workspaceInvite.revokedAt),
      ),
    );

  return NextResponse.json(invites);
}

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, workspace: ws, role } = ctx;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    type,
    email,
    role: inviteRole = "editor",
    expiresInDays,
  } = body as {
    type: "email" | "link";
    email?: string;
    role?: "admin" | "editor" | "viewer";
    expiresInDays?: number;
  };

  if (!type || !["email", "link"].includes(type))
    return NextResponse.json({ error: "Invalid invite type" }, { status: 400 });

  if (type === "email" && !email)
    return NextResponse.json(
      { error: "Email required for email invites" },
      { status: 400 },
    );

  // Only owner can invite as admin
  if (inviteRole === "admin" && role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can invite admins" },
      { status: 403 },
    );

  // Check plan limits for editor/viewer seats
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.workspaceId, ws.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const plan = getPlan(sub?.plan);
  const counts = await getWorkspaceRoleCounts(ws.id);

  const isEditorInvite = inviteRole !== "viewer";
  if (isEditorInvite && plan.limits.editors !== -1) {
    if (counts.editors >= plan.limits.editors) {
      return NextResponse.json(
        { error: "Editor limit reached. Upgrade your plan to invite more editors." },
        { status: 403 },
      );
    }
  }
  if (inviteRole === "viewer" && plan.limits.viewers !== -1) {
    if (counts.viewers >= plan.limits.viewers) {
      return NextResponse.json(
        { error: "Viewer limit reached. Upgrade your plan to invite more viewers." },
        { status: 403 },
      );
    }
  }

  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const invite = await db
    .insert(workspaceInvite)
    .values({
      id: `inv-${Date.now()}`,
      workspaceId: ws.id,
      invitedBy: session.user.id,
      type,
      email: type === "email" ? email!.toLowerCase() : null,
      role: inviteRole || "editor",
      code,
      expiresAt,
      maxUses: type === "link" ? null : 1,
      useCount: 0,
    })
    .returning()
    .then((rows) => rows[0]);

  const inviteUrl = `${APP_URL}/invite/${code}`;

  // Send email if type is email
  if (type === "email") {
    try {
      await sendWorkspaceInviteEmail({
        to: email!,
        inviterName: session.user.name,
        workspaceName: ws.name,
        role: inviteRole || "editor",
        inviteUrl,
      });
    } catch (err) {
      console.error("[invites] Failed to send email:", err);
    }
  }

  return NextResponse.json({ invite, inviteUrl }, { status: 201 });
}
