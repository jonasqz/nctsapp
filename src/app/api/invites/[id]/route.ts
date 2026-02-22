import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { workspaceInvite } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function DELETE(
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

  const updated = await db
    .update(workspaceInvite)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(workspaceInvite.id, id),
        eq(workspaceInvite.workspaceId, ws.id),
      ),
    )
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!updated)
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
