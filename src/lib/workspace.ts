import { headers, cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspace, workspaceMember } from "@/lib/db/schema";

/**
 * Get the current session and the user's active workspace.
 *
 * Resolution order for the active workspace:
 *  1. `ncts-workspace-id` cookie (if the user is a member of that workspace)
 *  2. The user's first workspace membership as a fallback
 *
 * Returns `null` if there is no valid session or the user has no workspaces.
 */
export async function getSessionAndWorkspace() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const userId = session.user.id;

  // 1. Try the workspace id stored in the cookie
  const cookieStore = await cookies();
  const preferredId = cookieStore.get("ncts-workspace-id")?.value;

  if (preferredId) {
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.userId, userId),
          eq(workspaceMember.workspaceId, preferredId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (membership) {
      const ws = await db
        .select()
        .from(workspace)
        .where(eq(workspace.id, preferredId))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (ws) {
        return {
          session,
          workspace: ws,
          role: membership.role as "owner" | "admin" | "editor" | "viewer",
        };
      }
    }
  }

  // 2. Fallback: first workspace the user belongs to
  const fallback = await db
    .select({ workspace, role: workspaceMember.role })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(eq(workspaceMember.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!fallback) return null;

  return {
    session,
    workspace: fallback.workspace,
    role: fallback.role as "owner" | "admin" | "editor" | "viewer",
  };
}

/**
 * Return every workspace a user belongs to, together with their role.
 */
export async function getUserWorkspaces(userId: string) {
  const rows = await db
    .select({
      workspace,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(eq(workspaceMember.userId, userId));

  return rows;
}

/**
 * Check whether a user is a member of a given workspace.
 *
 * Returns the `workspaceMember` record if found, or `null` otherwise.
 */
export async function requireWorkspaceMembership(
  userId: string,
  workspaceId: string,
) {
  const member = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.userId, userId),
        eq(workspaceMember.workspaceId, workspaceId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return member;
}

/**
 * Count editors and viewers in a workspace.
 * Owner + Admin + Editor = "editors" for billing purposes.
 */
export async function getWorkspaceRoleCounts(workspaceId: string) {
  const members = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(eq(workspaceMember.workspaceId, workspaceId));

  const editors = members.filter(
    (m) => m.role === "owner" || m.role === "admin" || m.role === "editor",
  ).length;
  const viewers = members.filter((m) => m.role === "viewer").length;

  return { editors, viewers, total: members.length };
}
