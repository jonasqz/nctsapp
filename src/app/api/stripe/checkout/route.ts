import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId, type BillingInterval } from "@/lib/plans";

export async function POST(request: Request) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session, workspace: ws } = ctx;
  const body = await request.json();
  const planId = body.planId as PlanId;
  const billingInterval = (body.billingInterval || "monthly") as BillingInterval;

  const plan = PLANS[planId];
  if (!plan || plan.comingSoon) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = plan.stripePriceId[billingInterval];
  if (!priceId) {
    return NextResponse.json({ error: "No price configured for this plan/interval" }, { status: 400 });
  }

  // Check for existing subscription to get Stripe customer ID
  const existing = await db
    .select()
    .from(subscription)
    .where(eq(subscription.workspaceId, ws.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const appUrl = process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  const checkoutParams: Record<string, unknown> = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?tab=billing&success=true`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
    metadata: {
      workspaceId: ws.id,
      planId,
      billingInterval,
    },
    subscription_data: {
      metadata: {
        workspaceId: ws.id,
        planId,
        billingInterval,
      },
    },
  };

  if (existing?.stripeCustomerId) {
    checkoutParams.customer = existing.stripeCustomerId;
  } else {
    checkoutParams.customer_email = session.user.email;
  }

  const checkoutSession = await stripe.checkout.sessions.create(
    checkoutParams as Parameters<typeof stripe.checkout.sessions.create>[0]
  );

  return NextResponse.json({ url: checkoutSession.url });
}
