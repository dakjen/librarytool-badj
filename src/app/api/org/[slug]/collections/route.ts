import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { collections, organizations } from '@/db/schema'; // Import organizations table
import { eq, and } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole, checkUserActiveSubscription } from '@/lib/permissions';

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

    // Check if the user has appropriate permissions
    const canAccessAsStaff = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!canAccessAsStaff) {
      // If not staff, check if they are a consumer with an active subscription
      const isConsumer = await checkUserRole(userId, organizationId, 'consumer');
      if (!isConsumer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
      if (!hasActiveSubscription) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
      }
    }

    const orgCollections = await db.query.collections.findMany({
      where: eq(collections.organizationId, organizationId),
    });

    return NextResponse.json(orgCollections, { status: 200 });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    // Check if the user has permission to create collections (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [newCollection] = await db.insert(collections).values({
      organizationId,
      name,
      description: description || null,
      createdById: userId,
    }).returning();

    return NextResponse.json({ message: 'Collection created successfully', collection: newCollection }, { status: 201 });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}