import { getSessionAndWorkspace, requireWorkspaceMembership } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { workspace } from "@/lib/db/schema";
import { isAdminOrOwner } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session } = ctx;
  const { id } = await params;

  const membership = await requireWorkspaceMembership(session.user.id, id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ws = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(ws);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session } = ctx;
  const { id } = await params;

  const membership = await requireWorkspaceMembership(session.user.id, id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminOrOwner(membership.role as "owner" | "admin" | "editor" | "viewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, vision, strategyDocUrl, planningRhythm, cycleLengthWeeks } = body;

  const updated = await db
    .update(workspace)
    .set({
      ...(name !== undefined && { name }),
      ...(vision !== undefined && { vision }),
      ...(strategyDocUrl !== undefined && { strategyDocUrl }),
      ...(planningRhythm !== undefined && { planningRhythm }),
      ...(cycleLengthWeeks !== undefined && { cycleLengthWeeks }),
      updatedAt: new Date(),
    })
    .where(eq(workspace.id, id))
    .returning()
    .then((rows) => rows[0] ?? null);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
