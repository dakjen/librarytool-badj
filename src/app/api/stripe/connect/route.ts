import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user is an admin of the organization
    const isAdmin = await checkUserRole(userId, organizationId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the organization already has a Stripe Account ID
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      with: { owner: true } // Eager load the owner relation
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let accountId = organization.stripeAccountId;

    if (!accountId) {
      // Create a new Express account for the organization
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Default to US, should be dynamic based on Org details
        email: organization.owner?.email, // Should fetch owner email if possible
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Save the account ID to the organization
      await db.update(organizations)
        .set({ stripeAccountId: accountId })
        .where(eq(organizations.id, organizationId));
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/organization/${organization.slug}/settings?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/organization/${organization.slug}/settings?stripe=return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
