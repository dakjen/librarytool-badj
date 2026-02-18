import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { items, itemTypeEnum, organizations } from '@/db/schema'; // Import organizations table
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
    const { slug, collectionId, itemId } = resolvedParams;
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

    const item = await db.query.items.findFirst({
      where: and(
        eq(items.id, itemId),
        eq(items.collectionId, collectionId),
        eq(items.organizationId, organizationId)
      ),
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error('Error fetching item:', error);
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
    const { slug, collectionId, itemId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { title, description, type, contentUrl, articleContent, thumbnailUrl } = await request.json();

    // Validate item type if provided
    if (type && !itemTypeEnum.enumValues.includes(type)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    // Check if the user has permission to update items (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Conditional validation based on type for updates
    if (type) {
      if (['video', 'pdf', 'embed', 'link'].includes(type) && !contentUrl) {
        return NextResponse.json({ error: 'contentUrl is required for this item type' }, { status: 400 });
      }
      if (type === 'article' && !articleContent) {
        return NextResponse.json({ error: 'articleContent is required for this item type' }, { status: 400 });
      }
    }


    const [updatedItem] = await db.update(items)
      .set({
        title: title || undefined,
        description: description || undefined,
        type: type || undefined,
        contentUrl: contentUrl || undefined,
        articleContent: articleContent || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      })
      .where(and(
        eq(items.id, itemId),
        eq(items.collectionId, collectionId),
        eq(items.organizationId, organizationId)
      ))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found or failed to update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item updated successfully', item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error('Error updating item:', error);
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
    const { slug, collectionId, itemId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the user has permission to delete items (admin or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [deletedItem] = await db.delete(items)
      .where(and(
        eq(items.id, itemId),
        eq(items.collectionId, collectionId),
        eq(items.organizationId, organizationId)
      ))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}