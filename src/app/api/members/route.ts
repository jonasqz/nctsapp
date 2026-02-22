import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { workspaceMember, user } from "@/lib/db/schema";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const members = await db
    .select({
      id: workspaceMember.id,
      userId: workspaceMember.userId,
      role: workspaceMember.role,
      createdAt: workspaceMember.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(workspaceMember)
    .innerJoin(user, eq(user.id, workspaceMember.userId))
    .where(eq(workspaceMember.workspaceId, ws.id));

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
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
