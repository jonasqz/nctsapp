export type Role = "owner" | "admin" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if the user's role meets or exceeds the required role level.
 *
 *   hasMinRole("admin", "editor") → true
 *   hasMinRole("viewer", "editor") → false
 */
export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Convenience: returns true for owner or admin.
 */
export function isAdminOrOwner(role: Role): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Returns true if the role is viewer (read-only).
 */
export function isViewer(role: Role): boolean {
  return role === "viewer";
}

/**
 * Returns true if the user can create/edit content (editor or above).
 */
export function canEdit(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY["editor"];
}

/**
 * Check if a user can modify a specific NCT entity.
 *
 * - Viewer → never (read-only).
 * - Owner / admin → can modify any entity in the workspace.
 * - Editor → can only modify entities they own.
 */
export function canModifyEntity(
  userRole: Role,
  userId: string,
  entityOwnerId: string,
): boolean {
  if (isViewer(userRole)) return false;
  if (isAdminOrOwner(userRole)) return true;
  return userId === entityOwnerId;
}
