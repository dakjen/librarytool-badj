import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { organizations, consumerSubscriptions, users, products, prices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing signature or secret');
    }
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Connect Account Onboarding
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.payouts_enabled) {
          // Find organization with this account ID and mark as enabled
          await db.update(organizations)
            .set({ stripeAccountEnabled: true })
            .where(eq(organizations.stripeAccountId, account.id));
        }
        break;
      }

      // Consumer Subscription Created/Updated
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const organizationId = session.metadata?.organizationId;
          const userId = session.metadata?.userId; // Assuming passed during checkout

          if (organizationId && userId) {
            // Check if subscription already exists (e.g., renewed)
            const existing = await db.query.consumerSubscriptions.findFirst({
              where: eq(consumerSubscriptions.stripeSubscriptionId, subscriptionId),
            });

            if (!existing) {
              await db.insert(consumerSubscriptions).values({
                organizationId,
                userId,
                stripeSubscriptionId: subscriptionId,
                status: 'active',
                currentPeriodEnd: session.expires_at ? new Date(session.expires_at * 1000) : null, // Not accurate, need subscription details
              });
            } else {
              // Usually handled by customer.subscription.updated, but for initial checkout:
              await db.update(consumerSubscriptions)
                .set({ status: 'active' })
                .where(eq(consumerSubscriptions.stripeSubscriptionId, subscriptionId));
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await db.update(consumerSubscriptions)
          .set({ 
            status: subscription.status,
            currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
          })
          .where(eq(consumerSubscriptions.stripeSubscriptionId, subscription.id));
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await db.update(consumerSubscriptions)
          .set({ status: 'canceled' })
          .where(eq(consumerSubscriptions.stripeSubscriptionId, subscription.id));
        break;
      }
      
      // Additional handlers for products/prices sync if needed
      // ...
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
