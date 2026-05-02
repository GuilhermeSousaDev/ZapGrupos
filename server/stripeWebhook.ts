import express from "express";
import Stripe from "stripe";
import {
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeId,
  upsertSubscription,
} from "./db";

export const stripeWebhookRouter = express.Router();

stripeWebhookRouter.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).send("Missing stripe signature or webhook secret");
      return;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(
        "[Stripe Webhook] Signature verification failed:",
        err.message
      );
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle test events for webhook verification
    if (event.id.startsWith("evt_test_")) {
      console.log(
        "[Webhook] Test event detected, returning verification response"
      );
      return res.json({ verified: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === "subscription" && session.subscription) {
            const userId = Number(session.metadata?.userId);
            const plan = (session.metadata?.plan ?? "free") as
              | "starter"
              | "pro"
              | "premium";
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;

            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;

            await upsertSubscription({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              plan,
              status: "active",
              currentPeriodStart: subscription.billing_cycle_anchor
                ? new Date((subscription as any).billing_cycle_anchor * 1000)
                : undefined,
              currentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const existing = await getSubscriptionByStripeId(subscription.id);
          if (existing) {
            const priceId = subscription.items.data[0]?.price.id;
            const planMap: Record<
              string,
              "starter" | "pro" | "premium" | "free"
            > = {
              [process.env.STRIPE_PRICE_STARTER ?? ""]: "starter",
              [process.env.STRIPE_PRICE_PRO ?? ""]: "pro",
              [process.env.STRIPE_PRICE_PREMIUM ?? ""]: "premium",
            };
            const plan = planMap[priceId ?? ""] ?? existing.plan;
            await upsertSubscription({
              userId: existing.userId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              plan,
              status: subscription.status as any,
              currentPeriodStart: (subscription as any).current_period_start
                ? new Date((subscription as any).current_period_start * 1000)
                : undefined,
              currentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const existing = await getSubscriptionByStripeId(subscription.id);
          if (existing) {
            await upsertSubscription({
              userId: existing.userId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              plan: "free",
              status: "canceled",
              cancelAtPeriodEnd: false,
            });
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;
          if (customerId) {
            const existing =
              await getSubscriptionByStripeCustomerId(customerId);
            if (existing) {
              await upsertSubscription({
                userId: existing.userId,
                stripeCustomerId: customerId,
                plan: existing.plan,
                status: "past_due",
                cancelAtPeriodEnd: existing.cancelAtPeriodEnd,
              });
            }
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Handler error:", err);
      res.status(500).send("Internal server error");
    }
  }
);
