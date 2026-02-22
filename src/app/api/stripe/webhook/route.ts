import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Derive the current period end from a Stripe subscription.
 * In Stripe API v2025-04-30+, `current_period_end` is no longer on the
 * Subscription object. We use `cancel_at` as the best available signal
 * for when the subscription ends, or null if it renews indefinitely.
 */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  if (sub.cancel_at) {
    return new Date(sub.cancel_at * 1000);
  }
  return null;
}

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const planId = session.metadata?.planId;
      const billingInterval = (session.metadata?.billingInterval || "monthly") as "monthly" | "annual";
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!workspaceId || !planId) break;

      // Fetch the Stripe subscription details
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = getPeriodEnd(stripeSub);

      // Upsert the subscription record
      const existing = await db
        .select()
        .from(subscription)
        .where(eq(subscription.workspaceId, workspaceId))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (existing) {
        await db
          .update(subscription)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: planId as "free" | "business" | "pro",
            billingInterval,
            status: "active",
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscription.id, existing.id));
      } else {
        await db.insert(subscription).values({
          id: `sub-${Date.now()}`,
          workspaceId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan: planId as "free" | "business" | "pro",
          billingInterval,
          status: "active",
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;

      if (!workspaceId) break;

      const planId = sub.metadata?.planId || "free";
      const status = mapStripeStatus(sub.status);
      const periodEnd = getPeriodEnd(sub);

      await db
        .update(subscription)
        .set({
          plan: planId as "free" | "business" | "pro",
          status,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscription.workspaceId, workspaceId));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;

      if (!workspaceId) break;

      await db
        .update(subscription)
        .set({
          plan: "free",
          status: "canceled",
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscription.workspaceId, workspaceId));
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "active";
  }
}
