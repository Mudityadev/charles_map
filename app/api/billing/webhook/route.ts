import { NextResponse } from "next/server";
import Stripe from "stripe";
import { handleSubscriptionUpdated } from "@/billing/stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";
  const stripe = new Stripe(process.env.STRIPE_SECRET ?? "sk_test", {
    apiVersion: "2024-12-18.acacia"
  });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "whsec");
  } catch (error) {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  if (event.type === "customer.subscription.updated") {
    await handleSubscriptionUpdated(event);
  }
  return NextResponse.json({ received: true });
}
