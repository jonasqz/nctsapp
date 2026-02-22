export type PlanId = "free" | "business" | "pro";
export type BillingInterval = "monthly" | "annual";

export interface PlanPricing {
  price: number;
  label: string;
  perEditorPrice: number;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  pricing: Record<BillingInterval, PlanPricing>;
  stripePriceId: Record<BillingInterval, string | null>;
  features: string[];
  limits: {
    editors: number; // included editors (-1 = unlimited)
    viewers: number; // -1 = unlimited
    aiCoach: boolean;
    integrations: boolean;
  };
  comingSoon: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Cloud Free",
    description: "Everything you need to align your team. Free forever.",
    pricing: {
      monthly: { price: 0, label: "Free", perEditorPrice: 0 },
      annual: { price: 0, label: "Free", perEditorPrice: 0 },
    },
    stripePriceId: { monthly: null, annual: null },
    features: [
      "Unlimited narratives, commitments & tasks",
      "Web UI + dashboard",
      "MCP server for AI tools",
      "Community support",
    ],
    limits: {
      editors: 1,
      viewers: 3,
      aiCoach: false,
      integrations: false,
    },
    comingSoon: false,
  },
  business: {
    id: "business",
    name: "Business",
    description: "For growing teams. Start with 3 editors.",
    pricing: {
      monthly: { price: 25, label: "€25/mo", perEditorPrice: 5 },
      annual: { price: 20, label: "€20/mo", perEditorPrice: 4 },
    },
    stripePriceId: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
      annual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || null,
    },
    features: [
      "Everything in Free",
      "3 Editors included",
      "Unlimited Viewers",
      "Priority support",
    ],
    limits: {
      editors: 3,
      viewers: -1,
      aiCoach: false,
      integrations: false,
    },
    comingSoon: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "AI-powered alignment. Coming soon.",
    pricing: {
      monthly: { price: 50, label: "€50/mo", perEditorPrice: 0 },
      annual: { price: 40, label: "€40/mo", perEditorPrice: 0 },
    },
    stripePriceId: { monthly: null, annual: null },
    features: [
      "Everything in Business",
      "AI Coach",
      "Slack integration",
      "Linear integration",
    ],
    limits: {
      editors: -1,
      viewers: -1,
      aiCoach: true,
      integrations: true,
    },
    comingSoon: true,
  },
};

/**
 * Look up a plan by ID, with backward compatibility for old plan IDs.
 */
export function getPlan(planId: string | null | undefined): PlanConfig {
  if (!planId) return PLANS.free;

  // Backward compat: old "pro" → "business", old "team" → "business"
  if (planId === "team") return PLANS.business;
  if (planId in PLANS) return PLANS[planId as PlanId];

  return PLANS.free;
}

/**
 * Get the Stripe price ID for a given plan + billing interval.
 */
export function getStripePriceId(
  planId: PlanId,
  interval: BillingInterval,
): string | null {
  const plan = PLANS[planId];
  return plan?.stripePriceId[interval] ?? null;
}
