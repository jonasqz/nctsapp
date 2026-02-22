import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { workspaceMember, workspace } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, workspace: ws, role } = ctx;
  const { id } = await params;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find the target member
  const target = await db
    .select()
    .from(workspaceMember)
    .where(
      and(eq(workspaceMember.id, id), eq(workspaceMember.workspaceId, ws.id)),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!target)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Can't change own role
  if (target.userId === session.user.id)
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 },
    );

  const body = await request.json();
  const newRole = body.role as "admin" | "editor" | "viewer";

  if (!newRole || !["admin", "editor", "viewer"].includes(newRole))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Only owner can promote to admin
  if (newRole === "admin" && role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can promote to admin" },
      { status: 403 },
    );

  // Admins can't change other admins
  if (target.role === "admin" && role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can change admin roles" },
      { status: 403 },
    );

  // Can't change the owner's role via this endpoint
  if (target.role === "owner")
    return NextResponse.json(
      { error: "Cannot change the owner's role" },
      { status: 400 },
    );

  const updated = await db
    .update(workspaceMember)
    .set({ role: newRole })
    .where(eq(workspaceMember.id, id))
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, workspace: ws, role } = ctx;
  const { id } = await params;

  if (!isAdminOrOwner(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find the target member
  const target = await db
    .select()
    .from(workspaceMember)
    .where(
      and(eq(workspaceMember.id, id), eq(workspaceMember.workspaceId, ws.id)),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!target)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Can't remove yourself
  if (target.userId === session.user.id)
    return NextResponse.json(
      { error: "Cannot remove yourself" },
      { status: 400 },
    );

  // Can't remove the owner
  if (target.role === "owner")
    return NextResponse.json(
      { error: "Cannot remove the workspace owner" },
      { status: 400 },
    );

  // Admins can't remove other admins
  if (target.role === "admin" && role !== "owner")
    return NextResponse.json(
      { error: "Only the owner can remove admins" },
      { status: 403 },
    );

  await db.delete(workspaceMember).where(eq(workspaceMember.id, id));

  return NextResponse.json({ success: true });
}
