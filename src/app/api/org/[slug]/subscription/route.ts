import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, organizations } from '@/db/schema'; // Import organizations table
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

    // Check if the user has permission to view subscription status (staff_manager)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, organizationId),
      orderBy: (subs, { desc }) => [desc(subs.createdAt)],
    });

    if (!orgSubscription) {
      return NextResponse.json({ message: 'No active subscription found for this organization' }, { status: 200 });
    }

    return NextResponse.json(orgSubscription, { status: 200 });
  } catch (error) {
    console.error('Error fetching organization subscription status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}