/**
 * Migration script: Assigns existing narratives/commitments/tasks to a workspace.
 *
 * For each user who has narratives but no workspace:
 *   1. Creates a "My Workspace" workspace
 *   2. Creates a workspace member (owner)
 *   3. Creates a year + active cycle
 *   4. Creates a "My Team" team
 *   5. Links all their narratives/commitments/tasks to the workspace + team + cycle
 *
 * Safe to run multiple times (idempotent — skips users who already have a workspace).
 *
 * Usage: bun run src/lib/db/migrate-to-workspaces.ts
 */

import { db } from "./index";
import {
  narrative,
  commitment,
  task,
  workspace,
  workspaceMember,
  year,
  cycle,
  team,
} from "./schema";
import { eq, isNull, sql } from "drizzle-orm";

async function migrate() {
  console.log("🔄 Starting workspace migration...\n");

  // Find all unique ownerIds from narratives that don't have a workspaceId yet
  const orphanedNarratives = await db
    .selectDistinct({ ownerId: narrative.ownerId })
    .from(narrative)
    .where(isNull(narrative.workspaceId));

  if (orphanedNarratives.length === 0) {
    console.log("✅ No orphaned narratives found. Nothing to migrate.");
    process.exit(0);
  }

  console.log(
    `Found ${orphanedNarratives.length} user(s) with orphaned narratives.\n`,
  );

  for (const { ownerId } of orphanedNarratives) {
    // Check if this user already has a workspace
    const existingMembership = await db
      .select()
      .from(workspaceMember)
      .where(eq(workspaceMember.userId, ownerId))
      .limit(1);

    if (existingMembership.length > 0) {
      console.log(`⏭  User ${ownerId} already has a workspace, skipping.`);

      // Still link their orphaned narratives to their existing workspace
      const wsId = existingMembership[0].workspaceId;

      // Get workspace's first team and active cycle
      const teams = await db
        .select()
        .from(team)
        .where(eq(team.workspaceId, wsId))
        .limit(1);

      const cycles = await db
        .select()
        .from(cycle)
        .where(eq(cycle.workspaceId, wsId))
        .limit(1);

      const teamId = teams[0]?.id || null;
      const cycleId = cycles[0]?.id || null;

      // Update orphaned narratives
      await db
        .update(narrative)
        .set({
          workspaceId: wsId,
          teamId,
          cycleId,
        })
        .where(
          sql`${narrative.ownerId} = ${ownerId} AND ${narrative.workspaceId} IS NULL`,
        );

      // Update orphaned commitments
      await db
        .update(commitment)
        .set({ workspaceId: wsId, teamId })
        .where(
          sql`${commitment.ownerId} = ${ownerId} AND ${commitment.workspaceId} IS NULL`,
        );

      // Update orphaned tasks
      await db
        .update(task)
        .set({ workspaceId: wsId })
        .where(
          sql`${task.ownerId} = ${ownerId} AND ${task.workspaceId} IS NULL`,
        );

      console.log(`   Linked orphaned entities to workspace ${wsId}`);
      continue;
    }

    console.log(`📦 Migrating user ${ownerId}...`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const ts = Date.now();

    // 1. Create workspace
    const [ws] = await db
      .insert(workspace)
      .values({
        id: `ws-migrate-${ts}`,
        name: "My Workspace",
        planningRhythm: "quarters",
        createdBy: ownerId,
      })
      .returning();

    // 2. Create workspace member
    await db.insert(workspaceMember).values({
      id: `wm-migrate-${ts}`,
      workspaceId: ws.id,
      userId: ownerId,
      role: "owner",
    });

    // 3. Create year
    const [yr] = await db
      .insert(year)
      .values({
        id: `yr-migrate-${ts}`,
        workspaceId: ws.id,
        year: currentYear,
      })
      .returning();

    // 4. Create cycle
    const [cy] = await db
      .insert(cycle)
      .values({
        id: `cy-migrate-${ts}`,
        yearId: yr.id,
        workspaceId: ws.id,
        name: `Q1 ${currentYear}`,
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 2, 31),
        status: "active",
      })
      .returning();

    // 5. Create team
    const [tm] = await db
      .insert(team)
      .values({
        id: `tm-migrate-${ts}`,
        workspaceId: ws.id,
        name: "My Team",
      })
      .returning();

    // 6. Link all narratives
    const updatedNarratives = await db
      .update(narrative)
      .set({
        workspaceId: ws.id,
        teamId: tm.id,
        cycleId: cy.id,
      })
      .where(
        sql`${narrative.ownerId} = ${ownerId} AND ${narrative.workspaceId} IS NULL`,
      )
      .returning({ id: narrative.id });

    // 7. Link all commitments
    const updatedCommitments = await db
      .update(commitment)
      .set({ workspaceId: ws.id, teamId: tm.id })
      .where(
        sql`${commitment.ownerId} = ${ownerId} AND ${commitment.workspaceId} IS NULL`,
      )
      .returning({ id: commitment.id });

    // 8. Link all tasks
    const updatedTasks = await db
      .update(task)
      .set({ workspaceId: ws.id })
      .where(
        sql`${task.ownerId} = ${ownerId} AND ${task.workspaceId} IS NULL`,
      )
      .returning({ id: task.id });

    console.log(`   ✅ Created workspace "${ws.name}" (${ws.id})`);
    console.log(`   📝 Linked ${updatedNarratives.length} narratives`);
    console.log(`   📋 Linked ${updatedCommitments.length} commitments`);
    console.log(`   ✓  Linked ${updatedTasks.length} tasks`);
    console.log();
  }

  console.log("✅ Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
