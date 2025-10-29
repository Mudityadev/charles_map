import Stripe from "stripe";
import { prisma } from "@/lib/db/client";

const stripe = new Stripe(process.env.STRIPE_SECRET ?? "sk_test", {
  apiVersion: "2024-12-18.acacia"
});

export async function handleSubscriptionUpdated(event: Stripe.Event) {
  const data = event.data.object as Stripe.Subscription;
  await prisma.subscription.upsert({
    where: { orgId: String(data.metadata?.orgId ?? "unknown") },
    update: {
      plan: String(data.items.data[0]?.price?.nickname ?? "BASIC"),
      status: data.status,
      currentPeriodEnd: new Date(data.current_period_end * 1000)
    },
    create: {
      orgId: String(data.metadata?.orgId ?? "unknown"),
      plan: String(data.items.data[0]?.price?.nickname ?? "BASIC"),
      status: data.status,
      currentPeriodEnd: new Date(data.current_period_end * 1000)
    }
  });
}
