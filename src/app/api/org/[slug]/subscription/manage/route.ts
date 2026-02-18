import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Required to fetch organization by slug
import { organizations } from '@/db/schema'; // Required to fetch organization by slug
import { eq } from 'drizzle-orm'; // Required for eq
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

export async function GET(
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

    // Check if the user has permission to manage billing (admin or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- Placeholder Logic for Stripe Customer Portal Redirect ---
    const placeholderStripePortalUrl = `https://billing.stripe.com/p/123456789/${organizationId}`; // Example placeholder URL

    return NextResponse.json(
      { message: 'Redirecting to Stripe customer portal (placeholder)', redirectUrl: placeholderStripePortalUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error managing organization subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}