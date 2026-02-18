import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, prices, consumerSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

async function getOrganization(slug: string) {
  return await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
      stripeAccountId: true,
      stripeAccountEnabled: true,
    },
  });
}

export async function POST(
  request: NextRequest,
  context: any // To bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const organization = await getOrganization(slug);

    if (!organization || !organization.stripeAccountId || !organization.stripeAccountEnabled) {
      return NextResponse.json({ error: 'Organization not found or billing not configured' }, { status: 404 });
    }

    const { priceId } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Verify price exists and belongs to organization
    // For now, assume priceId is valid Stripe Price ID.
    // In production, you'd verify against DB 'prices' table:
    /*
    const price = await db.query.prices.findFirst({
      where: eq(prices.id, priceId),
      with: { product: true }
    });
    if (!price || price.product.organizationId !== organization.id) ...
    */

    // Create Checkout Session on Connected Account
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/org/${slug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/org/${slug}?canceled=true`,
      metadata: {
        organizationId: organization.id,
        userId: userId,
      },
      client_reference_id: userId,
      // Create customer on the connected account
      customer_email: undefined, // Ideally fetch user email from DB to prefill
    }, {
      stripeAccount: organization.stripeAccountId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
