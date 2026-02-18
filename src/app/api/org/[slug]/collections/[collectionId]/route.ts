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
    const { slug, collectionId } = resolvedParams;
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

    const collection = await db.query.collections.findFirst({
      where: and(
        eq(collections.id, collectionId),
        eq(collections.organizationId, organizationId)
      ),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, collectionId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { name, description } = await request.json();

    if (!name && !description) {
      return NextResponse.json({ error: 'Name or description is required for update' }, { status: 400 });
    }

    // Check if the user has permission to update collections (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updatedCollection] = await db.update(collections)
      .set({
        name: name || undefined,
        description: description || undefined,
      })
      .where(and(
        eq(collections.id, collectionId),
        eq(collections.organizationId, organizationId)
      ))
      .returning();

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found or failed to update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collection updated successfully', collection: updatedCollection }, { status: 200 });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, collectionId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the user has permission to delete collections (admin or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [deletedCollection] = await db.delete(collections)
      .where(and(
        eq(collections.id, collectionId),
        eq(collections.organizationId, organizationId)
      ))
      .returning();

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collection deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}