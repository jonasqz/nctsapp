import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
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

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const appUrl = process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard/settings?tab=billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
