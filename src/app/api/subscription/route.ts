import { NextResponse } from "next/server";
import { getSessionAndWorkspace, getWorkspaceRoleCounts } from "@/lib/workspace";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlan } from "@/lib/plans";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspace: ws } = ctx;

  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.workspaceId, ws.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const plan = getPlan(sub?.plan);
  const counts = await getWorkspaceRoleCounts(ws.id);

  if (!sub) {
    return NextResponse.json({
      plan: "free",
      billingInterval: "monthly",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasStripeSubscription: false,
      usage: {
        editors: counts.editors,
        viewers: counts.viewers,
        editorLimit: plan.limits.editors,
        viewerLimit: plan.limits.viewers,
      },
    });
  }

  return NextResponse.json({
    plan: sub.plan,
    billingInterval: sub.billingInterval,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    hasStripeSubscription: !!sub.stripeSubscriptionId,
    usage: {
      editors: counts.editors,
      viewers: counts.viewers,
      editorLimit: plan.limits.editors,
      viewerLimit: plan.limits.viewers,
    },
  });
}
