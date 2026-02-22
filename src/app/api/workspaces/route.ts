import { getSessionAndWorkspace, getUserWorkspaces } from "@/lib/workspace";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session } = ctx;

  const workspaces = await getUserWorkspaces(session.user.id);

  return NextResponse.json(
    workspaces.map((row) => ({
      ...row.workspace,
      role: row.role,
    }))
  );
}
