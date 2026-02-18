import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';

async function getOrganizationIdFromSlug(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
    },
  });
  return organization?.id;
}

export async function POST(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { planId } = await request.json(); // Assuming a planId is passed for the subscription

    // Check if the user has permission to manage billing (admin or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Simulate Stripe Customer ID creation/assignment if it doesn't exist
    let stripeCustomerId = organization.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = `cus_${Math.random().toString(36).substring(2, 15)}`; // Placeholder
      await db.update(organizations)
        .set({ stripeCustomerId })
        .where(eq(organizations.id, organizationId));
    }

    // Simulate subscription creation
    const simulatedStripeSubscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`; // Placeholder
    const [newSubscription] = await db.insert(subscriptions).values({
      organizationId,
      stripeSubscriptionId: simulatedStripeSubscriptionId,
      status: 'active', // Simulate active status
    }).returning();

    return NextResponse.json(
      { message: 'Organization subscription simulated successfully', subscription: newSubscription, stripeCustomerId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error simulating organization subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}